import type {
  Agent,
  AgentResult,
  AgentFailure,
  RunContext,
  RunResult,
} from '@/src/contracts/index';
import { deriveRunStatus } from '@/src/core/run-status';

/**
 * Scheduler — orchestrates agent execution and aggregates results.
 *
 * Responsibilities:
 * - Execute agents asynchronously (concurrent)
 * - Aggregate AgentResult[] and AgentFailure[]
 * - Produce RunResult with derived RunStatus
 * - Individual agent failures do NOT cause global failure
 *
 * Phase 1: uses provided agents (fakes in tests). No domain agents.
 */

export interface SchedulerConfig {
  agents: Agent[];
}

/**
 * Executes all agents concurrently and produces a RunResult.
 *
 * Uses Promise.allSettled to ensure all agents complete (success or failure)
 * regardless of individual failures.
 */
export async function executeRun(
  context: RunContext,
  config: SchedulerConfig
): Promise<RunResult> {
  const results: AgentResult[] = [];
  const failures: AgentFailure[] = [];

  const settled = await Promise.allSettled(
    config.agents.map((agent) => agent.run(context))
  );

  for (let i = 0; i < settled.length; i++) {
    const outcome = settled[i];
    const agent = config.agents[i];

    if (outcome.status === 'fulfilled') {
      const value = outcome.value;
      if ('error_type' in value && 'message' in value) {
        // It's an AgentFailure
        failures.push(value as AgentFailure);
      } else {
        // It's an AgentResult
        results.push(value as AgentResult);
      }
    } else {
      // Promise rejected — create a failure
      failures.push({
        run_id: context.run_id,
        agent_id: agent.agentId,
        started_at: context.started_at,
        error_type: 'AGENT_EXCEPTION',
        message: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason),
      });
    }
  }

  const status = deriveRunStatus(results, failures);

  return {
    context,
    finished_at: new Date().toISOString(),
    results,
    failures,
    status,
  };
}
