import { describe, it, expect } from 'vitest';
import { InMemoryRepository } from '../fakes/in-memory-repository';
import type { AgentResult } from '@/src/contracts/agent';

describe('InMemoryRepository', () => {
  it('inserts and retrieves a run', async () => {
    const repo = new InMemoryRepository();
    await repo.insertRun({
      run_id: 'r1',
      started_at: '2025-01-01T00:00:00Z',
      finished_at: '2025-01-01T00:00:01Z',
      status: 'COMPLETED',
    });
    const run = await repo.getRun('r1');
    expect(run).not.toBeNull();
    expect(run!.run_id).toBe('r1');
  });

  it('returns null for missing run', async () => {
    const repo = new InMemoryRepository();
    const run = await repo.getRun('nonexistent');
    expect(run).toBeNull();
  });

  it('inserts and retrieves agent results', async () => {
    const repo = new InMemoryRepository();
    await repo.insertRun({
      run_id: 'r1',
      started_at: '2025-01-01T00:00:00Z',
      finished_at: null,
      status: 'COMPLETED',
    });
    const result: AgentResult = {
      agent_id: 'a1',
      context: { run_id: 'r1', started_at: '2025-01-01T00:00:00Z', params: {} },
      collection: { x: 1 },
      analysis: { y: 2 },
    };
    await repo.insertAgentResult(result);
    const results = await repo.getAgentResults('r1');
    expect(results).toHaveLength(1);
    expect(results[0].agent_id).toBe('a1');
  });

  it('inserts and retrieves agent failures', async () => {
    const repo = new InMemoryRepository();
    await repo.insertRun({
      run_id: 'r1',
      started_at: '2025-01-01T00:00:00Z',
      finished_at: null,
      status: 'FAILED',
    });
    await repo.insertAgentFailure({
      run_id: 'r1',
      agent_id: 'a1',
      started_at: '2025-01-01T00:00:00Z',
      error_type: 'ERR',
      message: 'fail',
    });
    const failures = await repo.getAgentFailures('r1');
    expect(failures).toHaveLength(1);
    expect(failures[0].agent_id).toBe('a1');
  });

  it('getAgentIds combines results and failures', async () => {
    const repo = new InMemoryRepository();
    await repo.insertRun({
      run_id: 'r1',
      started_at: '2025-01-01T00:00:00Z',
      finished_at: null,
      status: 'PARTIAL',
    });
    await repo.insertAgentResult({
      agent_id: 'a1',
      context: { run_id: 'r1', started_at: '2025-01-01T00:00:00Z', params: {} },
      collection: {},
      analysis: {},
    });
    await repo.insertAgentFailure({
      run_id: 'r1',
      agent_id: 'a2',
      started_at: '2025-01-01T00:00:00Z',
      error_type: 'ERR',
      message: 'fail',
    });
    const agents = await repo.getAgentIds('r1');
    expect(agents).toHaveLength(2);
    const a1 = agents.find((a) => a.agent_id === 'a1');
    expect(a1?.has_result).toBe(true);
    expect(a1?.has_failure).toBe(false);
    const a2 = agents.find((a) => a.agent_id === 'a2');
    expect(a2?.has_result).toBe(false);
    expect(a2?.has_failure).toBe(true);
  });
});
