import type {
  RunResult,
  PostRunResponse,
  GetRunResponse,
  GetRunAgentsResponse,
  GetRunAgentResponse,
} from '@/src/contracts/index';
import type { RunRow, AgentRunRow, AgentFailureRow } from '@/src/db/types';
import type { AgentResult, AgentFailure } from '@/src/contracts/agent';

/**
 * Maps RunResult → PostRunResponse (FROZEN HTTP CONTRACT).
 * This is the ONLY shape that POST /run returns.
 */
export function toPostRunResponse(runResult: RunResult): PostRunResponse {
  return {
    run_id: runResult.context.run_id,
    status: runResult.status,
    finished_at: runResult.finished_at,
    agents: runResult.results.map((r) => r.agent_id),
    failures: runResult.failures.map((f) => ({
      agent_id: f.agent_id,
      error_type: f.error_type,
      message: f.message,
    })),
  };
}

/**
 * Maps RunRow → GetRunResponse (IMPLEMENTATION PROPOSAL, not frozen).
 */
export function toGetRunResponse(row: RunRow): GetRunResponse {
  return {
    run_id: row.run_id,
    started_at: row.started_at,
    finished_at: row.finished_at,
    status: row.status,
  };
}

/**
 * Maps agent listing → GetRunAgentsResponse (IMPLEMENTATION PROPOSAL, not frozen).
 */
export function toGetRunAgentsResponse(
  runId: string,
  agents: Array<{ agent_id: string; has_result: boolean; has_failure: boolean }>
): GetRunAgentsResponse {
  return {
    run_id: runId,
    agents,
  };
}

/**
 * Maps agent result + failure → GetRunAgentResponse (IMPLEMENTATION PROPOSAL, not frozen).
 */
export function toGetRunAgentResponse(
  runId: string,
  agentId: string,
  resultRow: AgentRunRow | null,
  failureRow: AgentFailureRow | null
): GetRunAgentResponse {
  let result: AgentResult | null = null;
  let failure: AgentFailure | null = null;

  if (resultRow) {
    result = {
      agent_id: resultRow.agent_id,
      context: {
        run_id: resultRow.run_id,
        started_at: resultRow.started_at,
        params: {},
      },
      collection: resultRow.collection ?? {},
      analysis: resultRow.analysis ?? {},
    };
  }

  if (failureRow) {
    failure = {
      run_id: failureRow.run_id,
      agent_id: failureRow.agent_id,
      started_at: failureRow.started_at,
      error_type: failureRow.error_type,
      message: failureRow.message,
    };
  }

  return {
    run_id: runId,
    agent_id: agentId,
    result,
    failure,
  };
}
