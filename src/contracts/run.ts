/**
 * RunContext — context for a single execution run.
 */
export interface RunContext {
  run_id: string;
  started_at: string;
  params: Record<string, unknown>;
}

/**
 * RunStatus — FROZEN CONTRACT (Master Specification v1.0)
 *
 * COMPLETED: all agents produced results AND no failures exist.
 * PARTIAL: at least one result AND at least one failure.
 * FAILED: no successful results AND at least one failure.
 *
 * A normal execution CANNOT result in results=[] AND failures=[] simultaneously.
 */
export type RunStatus = 'COMPLETED' | 'PARTIAL' | 'FAILED';

/**
 * RunResult — result of a complete run.
 */
export interface RunResult {
  context: RunContext;
  finished_at: string;
  results: AgentResult[];
  failures: AgentFailure[];
  status: RunStatus;
}

// Re-export types needed by agent.ts
import type { AgentResult, AgentFailure } from './agent';
export type { AgentResult, AgentFailure };
