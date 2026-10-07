import type { RunRepository } from '@/src/db/repository';
import type { RunRow, AgentRunRow, AgentFailureRow } from '@/src/db/types';
import type { AgentResult, AgentFailure } from '@/src/contracts/agent';

/**
 * InMemoryRepository — fake implementation of RunRepository for tests.
 * No Supabase, no network, no credentials.
 */
export class InMemoryRepository implements RunRepository {
  private runs = new Map<string, RunRow>();
  private agentResults = new Map<string, AgentRunRow>();
  private agentFailures = new Map<string, AgentFailureRow>();

  async insertRun(row: RunRow): Promise<void> {
    this.runs.set(row.run_id, { ...row });
  }

  async getRun(runId: string): Promise<RunRow | null> {
    return this.runs.get(runId) ?? null;
  }

  async insertAgentResult(result: AgentResult): Promise<void> {
    const key = `${result.context.run_id}:${result.agent_id}`;
    this.agentResults.set(key, {
      run_id: result.context.run_id,
      agent_id: result.agent_id,
      started_at: result.context.started_at,
      analysis: result.analysis,
      collection: result.collection,
    });
  }

  async getAgentResults(runId: string): Promise<AgentRunRow[]> {
    const out: AgentRunRow[] = [];
    for (const row of this.agentResults.values()) {
      if (row.run_id === runId) out.push({ ...row });
    }
    return out;
  }

  async getAgentResult(runId: string, agentId: string): Promise<AgentRunRow | null> {
    return this.agentResults.get(`${runId}:${agentId}`) ?? null;
  }

  async insertAgentFailure(failure: AgentFailure): Promise<void> {
    const key = `${failure.run_id}:${failure.agent_id}`;
    this.agentFailures.set(key, { ...failure });
  }

  async getAgentFailures(runId: string): Promise<AgentFailureRow[]> {
    const out: AgentFailureRow[] = [];
    for (const row of this.agentFailures.values()) {
      if (row.run_id === runId) out.push({ ...row });
    }
    return out;
  }

  async getAgentIds(runId: string): Promise<Array<{
    agent_id: string;
    has_result: boolean;
    has_failure: boolean;
  }>> {
    const results = await this.getAgentResults(runId);
    const failures = await this.getAgentFailures(runId);
    const map = new Map<string, { has_result: boolean; has_failure: boolean }>();

    for (const r of results) {
      map.set(r.agent_id, { has_result: true, has_failure: false });
    }
    for (const f of failures) {
      const existing = map.get(f.agent_id);
      if (existing) {
        existing.has_failure = true;
      } else {
        map.set(f.agent_id, { has_result: false, has_failure: true });
      }
    }

    return Array.from(map.entries()).map(([agent_id, info]) => ({ agent_id, ...info }));
  }
}
