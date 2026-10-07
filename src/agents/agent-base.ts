// Agent base interface is defined in contracts/agent.ts
// This file re-exports it for convenience and provides a base abstract class
// that domain agents (future phases) can extend.

export type { Agent } from '@/src/contracts/agent';

import type { Agent, AgentResult, AgentFailure, RunContext } from '@/src/contracts/agent';

/**
 * Abstract base class for domain agents.
 *
 * Phase 1 provides the interface only.
 * Domain agents (CryptoAgent, StocksAgent, etc.) are implemented in future phases.
 *
 * Subclasses must implement the execute() method.
 * The run() method wraps execute() and ensures failures are properly typed.
 */
export abstract class AgentBase implements Agent {
  abstract readonly agentId: string;

  abstract execute(context: RunContext): Promise<AgentResult | AgentFailure>;

  async run(context: RunContext): Promise<AgentResult | AgentFailure> {
    try {
      return await this.execute(context);
    } catch (err) {
      return {
        run_id: context.run_id,
        agent_id: this.agentId,
        started_at: context.started_at,
        error_type: 'AGENT_EXCEPTION',
        message: err instanceof Error ? err.message : String(err),
      } satisfies AgentFailure;
    }
  }
}
