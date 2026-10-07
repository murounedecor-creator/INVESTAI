import { describe, it, expect } from 'vitest';
import { deriveRunStatus } from '@/src/core/run-status';
import type { AgentResult, AgentFailure } from '@/src/contracts/agent';
import type { RunContext } from '@/src/contracts/run';

const ctx: RunContext = { run_id: 'r1', started_at: '2025-01-01T00:00:00Z', params: {} };

function makeResult(id: string): AgentResult {
  return { agent_id: id, context: ctx, collection: {}, analysis: {} };
}

function makeFailure(id: string): AgentFailure {
  return { run_id: 'r1', agent_id: id, started_at: ctx.started_at, error_type: 'ERR', message: 'fail' };
}

describe('deriveRunStatus', () => {
  it('COMPLETED when results exist and no failures', () => {
    expect(deriveRunStatus([makeResult('a')], [])).toBe('COMPLETED');
  });

  it('PARTIAL when both results and failures exist', () => {
    expect(deriveRunStatus([makeResult('a')], [makeFailure('b')])).toBe('PARTIAL');
  });

  it('FAILED when no results and failures exist', () => {
    expect(deriveRunStatus([], [makeFailure('a')])).toBe('FAILED');
  });

  it('throws when both results and failures are empty (NOT RUN ≠ PASS)', () => {
    expect(() => deriveRunStatus([], [])).toThrow('not a valid run state');
  });
});
