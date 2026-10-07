import { describe, it, expect } from 'vitest';
import { toPostRunResponse } from '@/src/api/response-mapper';
import type { RunResult } from '@/src/contracts/run';

describe('toPostRunResponse', () => {
  it('maps a COMPLETED run correctly', () => {
    const runResult: RunResult = {
      context: { run_id: 'r1', started_at: '2025-01-01T00:00:00Z', params: {} },
      finished_at: '2025-01-01T00:00:01Z',
      results: [
        {
          agent_id: 'a1',
          context: { run_id: 'r1', started_at: '2025-01-01T00:00:00Z', params: {} },
          collection: { x: 1 },
          analysis: { y: 2 },
        },
      ],
      failures: [],
      status: 'COMPLETED',
    };

    const resp = toPostRunResponse(runResult);
    expect(resp.run_id).toBe('r1');
    expect(resp.status).toBe('COMPLETED');
    expect(resp.finished_at).toBe('2025-01-01T00:00:01Z');
    expect(resp.agents).toEqual(['a1']);
    expect(resp.failures).toEqual([]);
  });

  it('maps failures correctly', () => {
    const runResult: RunResult = {
      context: { run_id: 'r2', started_at: '2025-01-01T00:00:00Z', params: {} },
      finished_at: '2025-01-01T00:00:01Z',
      results: [],
      failures: [
        { run_id: 'r2', agent_id: 'a1', started_at: '2025-01-01T00:00:00Z', error_type: 'ERR', message: 'fail' },
      ],
      status: 'FAILED',
    };

    const resp = toPostRunResponse(runResult);
    expect(resp.status).toBe('FAILED');
    expect(resp.agents).toEqual([]);
    expect(resp.failures).toHaveLength(1);
    expect(resp.failures[0]).toEqual({ agent_id: 'a1', error_type: 'ERR', message: 'fail' });
  });
});
