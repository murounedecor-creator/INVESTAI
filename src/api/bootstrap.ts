import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { RunRepository } from '@/src/db/repository';
import type { Agent } from '@/src/contracts/agent';
import type { ApiDependencies } from './router';

/**
 * SupabaseRunRepository — implements RunRepository using Supabase with the service role key.
 *
 * The service role key bypasses RLS (by design — Supabase behavior).
 * This is server-side only. The service role key MUST NEVER be in the Mobile bundle.
 */
export class SupabaseRunRepository implements RunRepository {
  private client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  async insertRun(row: import('@/src/db/types').RunRow): Promise<void> {
    const { error } = await this.client
      .from('runs')
      .insert({
        run_id: row.run_id,
        started_at: row.started_at,
        finished_at: row.finished_at,
        status: row.status,
      });
    if (error) throw new Error(`DB insert run failed: ${error.message}`);
  }

  async getRun(runId: string): Promise<import('@/src/db/types').RunRow | null> {
    const { data, error } = await this.client
      .from('runs')
      .select('*')
      .eq('run_id', runId)
      .maybeSingle();
    if (error) throw new Error(`DB get run failed: ${error.message}`);
    return data as import('@/src/db/types').RunRow | null;
  }

  async insertAgentResult(result: import('@/src/contracts/agent').AgentResult): Promise<void> {
    const { error } = await this.client
      .from('agent_runs')
      .insert({
        run_id: result.context.run_id,
        agent_id: result.agent_id,
        started_at: result.context.started_at,
        analysis: result.analysis,
        collection: result.collection,
      });
    if (error) throw new Error(`DB insert agent result failed: ${error.message}`);
  }

  async getAgentResults(runId: string): Promise<import('@/src/db/types').AgentRunRow[]> {
    const { data, error } = await this.client
      .from('agent_runs')
      .select('*')
      .eq('run_id', runId);
    if (error) throw new Error(`DB get agent results failed: ${error.message}`);
    return (data ?? []) as import('@/src/db/types').AgentRunRow[];
  }

  async getAgentResult(
    runId: string,
    agentId: string
  ): Promise<import('@/src/db/types').AgentRunRow | null> {
    const { data, error } = await this.client
      .from('agent_runs')
      .select('*')
      .eq('run_id', runId)
      .eq('agent_id', agentId)
      .maybeSingle();
    if (error) throw new Error(`DB get agent result failed: ${error.message}`);
    return data as import('@/src/db/types').AgentRunRow | null;
  }

  async insertAgentFailure(failure: import('@/src/contracts/agent').AgentFailure): Promise<void> {
    const { error } = await this.client
      .from('agent_failures')
      .insert({
        run_id: failure.run_id,
        agent_id: failure.agent_id,
        started_at: failure.started_at,
        error_type: failure.error_type,
        message: failure.message,
      });
    if (error) throw new Error(`DB insert agent failure failed: ${error.message}`);
  }

  async getAgentFailures(runId: string): Promise<import('@/src/db/types').AgentFailureRow[]> {
    const { data, error } = await this.client
      .from('agent_failures')
      .select('*')
      .eq('run_id', runId);
    if (error) throw new Error(`DB get agent failures failed: ${error.message}`);
    return (data ?? []) as import('@/src/db/types').AgentFailureRow[];
  }

  async getAgentIds(runId: string): Promise<Array<{
    agent_id: string;
    has_result: boolean;
    has_failure: boolean;
  }>> {
    const [results, failures] = await Promise.all([
      this.getAgentResults(runId),
      this.getAgentFailures(runId),
    ]);

    const agentMap = new Map<string, { has_result: boolean; has_failure: boolean }>();

    for (const r of results) {
      agentMap.set(r.agent_id, { has_result: true, has_failure: false });
    }
    for (const f of failures) {
      const existing = agentMap.get(f.agent_id);
      if (existing) {
        existing.has_failure = true;
      } else {
        agentMap.set(f.agent_id, { has_result: false, has_failure: true });
      }
    }

    return Array.from(agentMap.entries()).map(([agent_id, info]) => ({
      agent_id,
      ...info,
    }));
  }
}

/**
 * Bootstrap — initializes the backend dependencies.
 *
 * Reads server-side env vars (NOT EXPO_PUBLIC_*):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PORT
 *
 * In Phase 1, agents list is empty (no domain agents implemented).
 */
export function bootstrap(): { deps: ApiDependencies; port: number } {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const port = parseInt(process.env.PORT ?? '3000', 10);

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is required (server-side env var)');
  }
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required (server-side env var)');
  }

  const repository = new SupabaseRunRepository(supabaseUrl, serviceRoleKey);
  const agents: Agent[] = []; // Phase 1: no domain agents

  return {
    deps: { repository, agents },
    port,
  };
}
