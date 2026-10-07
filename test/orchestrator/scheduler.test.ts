import { describe, it, expect } from 'vitest';
import { executeRun } from '@/src/scheduler/scheduler';
import { FakeAgent } from '../fakes/fake-agent';
import type { RunContext } from '@/src/contracts/run';

const ctx: RunContext = {
  run_id: 'run_test_1',
  started_at: '2025-01-01T00:00:00Z',
  params: {},
};

describe('Scheduler — executeRun', () => {
  it('COMPLETED when all agents succeed', async () => {
    const result = await executeRun(ctx, {
      agents: [new FakeAgent('a1'), new FakeAgent('a2')],
    });
    expect(result.status).toBe('COMPLETED');
    expect(result.results).toHaveLength(2);
    expect(result.failures).toHaveLength(0);
  });

  it('FAILED when all agents fail', async () => {
    const result = await executeRun(ctx, {
      agents: [
        new FakeAgent('a1', { type: 'failure' }),
        new FakeAgent('a2', { type: 'failure' }),
      ],
    });
    expect(result.status).toBe('FAILED');
    expect(result.results).toHaveLength(0);
    expect(result.failures).toHaveLength(2);
  });

  it('PARTIAL when some succeed and some fail', async () => {
    const result = await executeRun(ctx, {
      agents: [
        new FakeAgent('a1', { type: 'success' }),
        new FakeAgent('a2', { type: 'failure' }),
      ],
    });
    expect(result.status).toBe('PARTIAL');
    expect(result.results).toHaveLength(1);
    expect(result.failures).toHaveLength(1);
  });

  it('catches thrown exceptions as AgentFailure', async () => {
    const result = await executeRun(ctx, {
      agents: [new FakeAgent('a1', { type: 'throw', message: 'boom' })],
    });
    expect(result.status).toBe('FAILED');
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].error_type).toBe('AGENT_EXCEPTION');
    expect(result.failures[0].message).toBe('boom');
  });

  it('preserves run_id in context', async () => {
    const result = await executeRun(ctx, {
      agents: [new FakeAgent('a1')],
    });
    expect(result.context.run_id).toBe('run_test_1');
  });
});
