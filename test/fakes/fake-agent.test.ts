import { describe, it, expect } from 'vitest';
import { FakeAgent } from '../fakes/fake-agent';
import type { RunContext } from '@/src/contracts/run';

const ctx: RunContext = {
  run_id: 'r1',
  started_at: '2025-01-01T00:00:00Z',
  params: {},
};

describe('FakeAgent', () => {
  it('produces AgentResult on success behavior', async () => {
    const agent = new FakeAgent('a1', { type: 'success' });
    const result = await agent.run(ctx);
    expect('agent_id' in result).toBe(true);
    expect('collection' in result).toBe(true);
    expect('analysis' in result).toBe(true);
  });

  it('produces AgentFailure on failure behavior', async () => {
    const agent = new FakeAgent('a1', { type: 'failure', message: 'test fail' });
    const result = await agent.run(ctx);
    expect('error_type' in result).toBe(true);
    expect('message' in result).toBe(true);
    if ('message' in result) {
      expect(result.message).toBe('test fail');
    }
  });

  it('throws on throw behavior', async () => {
    const agent = new FakeAgent('a1', { type: 'throw', message: 'boom' });
    await expect(agent.run(ctx)).rejects.toThrow('boom');
  });
});
