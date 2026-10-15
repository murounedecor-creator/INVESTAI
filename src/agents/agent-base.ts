// Agent base interface is defined in contracts/agent.ts
// This file re-exports it for convenience and provides a base abstract class
// that domain agents (future phases) can extend.

import type { Agent, AgentResult, AgentFailure, RunContext } from '@/src/contracts/agent';
import type { SourceResult, SourceGroup, CoverageResult } from '@/src/contracts/source';
import { evaluateAllCoverage } from '@/src/core/coverage';
import {
  orchestrateSources,
  type OrchestratorConfig,
  type SourceTask,
} from '@/src/orchestrator/source-orchestrator';
import { logServerError } from '@/src/core/log';

export type { Agent } from '@/src/contracts/agent';

/**
 * Outcome of collecting sources for an agent (ADR-003).
 * `sources` always carries every SourceResult, including failures.
 * `requirement_satisfied` is true only when every group meets its minimum.
 * It is independent from full coverage.
 */
export interface SourceCollection {
  sources: SourceResult[];
  coverage: CoverageResult[];
  requirement_satisfied: boolean;
}

/**
 * Abstract base class for domain agents.
 *
 * Subclasses must implement the execute() method.
 * The run() method wraps execute() and ensures failures are properly typed.
 */
export abstract class AgentBase implements Agent {
  abstract readonly agentId: string;

  abstract execute(context: RunContext): Promise<AgentResult | AgentFailure>;

  /**
   * Bridge Agent -> SourceOrchestrator (ADR-003).
   * Never hides source failures; the agent decides AgentResult vs AgentFailure.
   */
  protected async collectSources(
    tasks: SourceTask[],
    groups: SourceGroup[],
    config: OrchestratorConfig
  ): Promise<SourceCollection> {
    const { results } = await orchestrateSources(tasks, config);
    const coverage = evaluateAllCoverage(groups, results);
    return {
      sources: results,
      coverage,
      requirement_satisfied: coverage.every((c) => c.satisfied),
    };
  }

  async run(context: RunContext): Promise<AgentResult | AgentFailure> {
    try {
      return await this.execute(context);
    } catch (err) {
      logServerError(`agent.${this.agentId}.execute`, err);
      // Never expose internal error details to API clients.
      return {
        run_id: context.run_id,
        agent_id: this.agentId,
        started_at: context.started_at,
        error_type: 'AGENT_EXCEPTION',
        message: 'Agent execution failed',
      } satisfies AgentFailure;
    }
  }
}
