import { describe, it, expect } from 'vitest';
import { evaluateGroupCoverage, isFullCoverage } from '@/src/core/coverage';
import type { SourceResult } from '@/src/contracts/source';

function sr(source: string, overrides: Partial<SourceResult> = {}): SourceResult {
  return {
    source,
    dispatch: 'DISPATCHED',
    dispatch_reason: 'NONE',
    collection_ok: true,
    parse_ok: true,
    normalization: 'OK',
    raw_hash: 'hash_' + source,
    ...overrides,
  };
}

describe('evaluateGroupCoverage', () => {
  it('satisfied when effective_count >= minimum', () => {
    const group = { group_id: 'g1', sources: ['a', 'b'], minimum_successful_sources: 1 };
    const results = [sr('a'), sr('b')];
    const cov = evaluateGroupCoverage(group, results);
    expect(cov.satisfied).toBe(true);
    expect(cov.effective_count).toBe(2);
  });

  it('not satisfied when effective_count < minimum', () => {
    const group = { group_id: 'g1', sources: ['a', 'b'], minimum_successful_sources: 2 };
    const results = [sr('a'), sr('b', { collection_ok: false, raw_hash: null })];
    const cov = evaluateGroupCoverage(group, results);
    expect(cov.satisfied).toBe(false);
    expect(cov.effective_count).toBe(1);
  });

  it('does not count NOT_DISPATCHED as effective', () => {
    const group = { group_id: 'g1', sources: ['a', 'b'], minimum_successful_sources: 2 };
    const results = [sr('a'), sr('b', { dispatch: 'NOT_DISPATCHED', collection_ok: false, raw_hash: null })];
    const cov = evaluateGroupCoverage(group, results);
    expect(cov.effective_count).toBe(1);
    expect(cov.satisfied).toBe(false);
  });
});

describe('isFullCoverage', () => {
  it('true when all groups satisfied', () => {
    const groups = [
      { group_id: 'g1', sources: ['a'], minimum_successful_sources: 1 },
      { group_id: 'g2', sources: ['b'], minimum_successful_sources: 1 },
    ];
    expect(isFullCoverage(groups, [sr('a'), sr('b')])).toBe(true);
  });

  it('false when any group not satisfied', () => {
    const groups = [
      { group_id: 'g1', sources: ['a'], minimum_successful_sources: 1 },
      { group_id: 'g2', sources: ['b'], minimum_successful_sources: 1 },
    ];
    expect(isFullCoverage(groups, [sr('a'), sr('b', { normalization: 'FATAL' })])).toBe(false);
  });
});
