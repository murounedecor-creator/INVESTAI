import type { AgentResult, AgentFailure } from '@/src/contracts/agent';
import type { RunStatus, RunContext } from '@/src/contracts/run';
import type { RunRow, AgentRunRow, AgentFailureRow } from './types';

/**
 * RunRepository — interface for persisting and retrieving run data.
 *
 * The backend uses the Supabase implementation with the service role key.
 * Tests use the InMemoryRepository fake.
 *
 * Atomicity: No global transaction is required (Master Specification does not
 * freeze a transactional policy). Each insert is individual.
 */

export interface RunRepository {
  insertRun(run: RunRow): Promise<void>;
  getRun(runId: string): Promise<RunRow | null>;

  insertAgentResult(result: AgentResult): Promise<void>;
  getAgentResults(runId: string): Promise<AgentRunRow[]>;
  getAgentResult(runId: string, agentId: string): Promise<AgentRunRow | null>;

  insertAgentFailure(failure: AgentFailure): Promise<void>;
  getAgentFailures(runId: string): Promise<AgentFailureRow[]>;

  getAgentIds(runId: string): Promise<Array<{
    agent_id: string;
    has_result: boolean;
    has_failure: boolean;
  }>>;
}

/**
 * Transforms AgentResult to AgentRunRow for persistence.
 */
export function agentResultToRow(result: AgentResult): AgentRunRow {
  return {
    run_id: result.context.run_id,
    agent_id: result.agent_id,
    started_at: result.context.started_at,
    analysis: result.analysis,
    collection: result.collection,
  };
}

/**
 * Transforms AgentFailure to AgentFailureRow for persistence.
 */
export function agentFailureToRow(failure: AgentFailure): AgentFailureRow {
  return {
    run_id: failure.run_id,
    agent_id: failure.agent_id,
    started_at: failure.started_at,
    error_type: failure.error_type,
    message: failure.message,
  };
}

/**
 * Transforms RunContext + status to RunRow for persistence.
 */
export function runContextToRow(
  context: RunContext,
  finishedAt: string,
  status: RunStatus
): RunRow {
  return {
    run_id: context.run_id,
    started_at: context.started_at,
    finished_at: finishedAt,
    status,
  };
}
