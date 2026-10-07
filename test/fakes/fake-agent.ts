import type { Agent, AgentResult, AgentFailure } from '@/src/contracts/agent';
import type { RunContext } from '@/src/contracts/run';

export type FakeAgentBehavior =
  | { type: 'success'; collection?: Record<string, unknown>; analysis?: Record<string, unknown> }
  | { type: 'failure'; error_type?: string; message?: string }
  | { type: 'throw'; message?: string };

/**
 * FakeAgent — configurable agent for tests.
 * Can produce success, failure, or throw based on behavior config.
 */
export class FakeAgent implements Agent {
  readonly agentId: string;
  private behavior: FakeAgentBehavior;

  constructor(agentId: string, behavior: FakeAgentBehavior = { type: 'success' }) {
    this.agentId = agentId;
    this.behavior = behavior;
  }

  setBehavior(behavior: FakeAgentBehavior): void {
    this.behavior = behavior;
  }

  async run(context: RunContext): Promise<AgentResult | AgentFailure> {
    switch (this.behavior.type) {
      case 'success':
        return {
          agent_id: this.agentId,
          context,
          collection: this.behavior.collection ?? { data: 'fake' },
          analysis: this.behavior.analysis ?? { summary: 'ok' },
        } satisfies AgentResult;

      case 'failure':
        return {
          run_id: context.run_id,
          agent_id: this.agentId,
          started_at: context.started_at,
          error_type: this.behavior.error_type ?? 'FAKE_FAILURE',
          message: this.behavior.message ?? 'Simulated failure',
        } satisfies AgentFailure;

      case 'throw':
        throw new Error(this.behavior.message ?? 'Simulated exception');
    }
  }
}
