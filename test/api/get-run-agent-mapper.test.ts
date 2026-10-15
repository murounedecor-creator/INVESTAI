import { describe, it, expect } from 'vitest';
import { toGetRunAgentResponse } from '@/src/api/response-mapper';
import type { AgentRunRow } from '@/src/db/types';

function row(overrides: Partial<AgentRunRow> = {}): AgentRunRow {
  return {
    run_id: 'r1',
    agent_id: 'a1',
    started_at: '2025-01-01T00:00:00Z',
    collection: { x: 1 },
    analysis: { y: 2 },
    ...overrides,
  };
}

describe('toGetRunAgentResponse (COR-03)', () => {
  it('preserves null collection and analysis (no silent {} fabrication)', () => {
    const resp = toGetRunAgentResponse('r1', 'a1', row({ collection: null, analysis: null }), null);
    expect(resp.result?.collection).toBeNull();
    expect(resp.result?.analysis).toBeNull();
  });

  it('passes present values through unchanged', () => {
    const resp = toGetRunAgentResponse('r1', 'a1', row(), null);
    expect(resp.result?.collection).toEqual({ x: 1 });
    expect(resp.result?.analysis).toEqual({ y: 2 });
  });

  it('does not fabricate context or params', () => {
    const resp = toGetRunAgentResponse('r1', 'a1', row(), null);
    expect(resp.result).not.toHaveProperty('context');
    expect(JSON.stringify(resp)).not.toContain('params');
  });

  it('returns result null when only a failure exists', () => {
    const resp = toGetRunAgentResponse('r1', 'a1', null, {
      run_id: 'r1', agent_id: 'a1', started_at: '2025-01-01T00:00:00Z',
      error_type: 'ERR', message: 'fail',
    });
    expect(resp.result).toBeNull();
    expect(resp.failure?.error_type).toBe('ERR');
  });
});
