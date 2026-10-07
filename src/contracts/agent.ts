import type { RunContext } from './run';
export type { RunContext };

/**
 * AgentResult — FROZEN CONTRACT (Master Specification v1.0)
 *
 * Represents a successful agent execution.
 * AgentFailure is semantically DISTINCT from AgentResult.
 * NEVER convert a failure into an AgentResult with empty values.
 */
export interface AgentResult {
  agent_id: string;
  context: RunContext;
  collection: Record<string, unknown>;
  analysis: Record<string, unknown>;
}

/**
 * AgentFailure — FROZEN CONTRACT (Master Specification v1.0)
 *
 * Represents a failed agent execution.
 * NEVER convert a failure into AgentResult with zeros or empty objects.
 * NEVER convert a failure into success.
 */
export interface AgentFailure {
  run_id: string;
  agent_id: string;
  started_at: string;
  error_type: string;
  message: string;
}

/**
 * Agent interface — implemented by domain agents in future phases.
 * Phase 1 provides the interface only; no domain agents are implemented.
 *
 * The run() method is ASYNC because the Scheduler depends on concurrency.
 */
export interface Agent {
  readonly agentId: string;
  run(context: RunContext): Promise<AgentResult | AgentFailure>;
}
