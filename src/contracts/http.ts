import type { RunStatus } from './run';
import type { AgentResult, AgentFailure } from './agent';

/**
 * PostRunResponse — FROZEN HTTP CONTRACT (Master Specification v1.0)
 * Do NOT alter the shape of this response.
 */
export interface PostRunResponse {
  run_id: string;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  finished_at: string;
  agents: string[];
  failures: Array<{
    agent_id: string;
    error_type: string;
    message: string;
  }>;
}

// ============================================================
// GET endpoints — statuses are FROZEN, shapes are PROPOSALS
// ============================================================
//
// What the Master Specification freezes:
//   - The endpoints exist
//   - 200 when resource exists
//   - 404 RUN_NOT_FOUND (run inexistente)
//   - 404 AGENT_RESULT_NOT_FOUND (agent inexistente in run existente)
//   - 500 INTERNAL_ERROR (no stack trace, no secrets)
//
// What is NOT frozen:
//   - The exact JSON shape of each GET response
//   - Which fields are included
//   - The nested structure of agents/results
//
// The shapes below are IMPLEMENTATION PROPOSALS, not frozen contracts.
// They can be adjusted without violating the Master Specification.
// ============================================================

export interface GetRunResponse {
  run_id: string;
  started_at: string;
  finished_at: string | null;
  status: RunStatus;
}

export interface GetRunAgentsResponse {
  run_id: string;
  agents: Array<{
    agent_id: string;
    has_result: boolean;
    has_failure: boolean;
  }>;
}

export interface GetRunAgentResponse {
  run_id: string;
  agent_id: string;
  result: AgentResult | null;
  failure: AgentFailure | null;
}

// ============================================================
// Error contract — FROZEN
// ============================================================

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'RUN_NOT_FOUND'
  | 'AGENT_RESULT_NOT_FOUND'
  | 'INTERNAL_ERROR';

export interface ApiErrorResponse {
  error: ApiErrorCode;
  message: string;
}
