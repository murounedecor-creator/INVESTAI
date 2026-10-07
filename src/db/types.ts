import type { RunStatus } from '@/src/contracts/run';

/**
 * Database row types — match the frozen logical model (Master Specification v1.0).
 *
 * runs:        PK(run_id), started_at, finished_at, status
 * agent_runs:  PK(run_id, agent_id), started_at, analysis(jsonb), collection(jsonb)
 * agent_failures: PK(run_id, agent_id), started_at, error_type, message
 */

export interface RunRow {
  run_id: string;
  started_at: string;
  finished_at: string | null;
  status: RunStatus;
}

export interface AgentRunRow {
  run_id: string;
  agent_id: string;
  started_at: string;
  analysis: Record<string, unknown> | null;
  collection: Record<string, unknown> | null;
}

export interface AgentFailureRow {
  run_id: string;
  agent_id: string;
  started_at: string;
  error_type: string;
  message: string;
}
