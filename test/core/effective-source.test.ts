import { describe, it, expect } from 'vitest';
import { isEffectiveSource } from '@/src/core/effective-source';
import type { SourceResult } from '@/src/contracts/source';

function makeResult(overrides: Partial<SourceResult>): SourceResult {
  return {
    source: 'test',
    dispatch: 'DISPATCHED',
    dispatch_reason: 'NONE',
    collection_ok: true,
    parse_ok: true,
    normalization: 'OK',
    raw_hash: 'abc123',
    ...overrides,
  };
}

describe('isEffectiveSource', () => {
  it('returns true when all conditions met (OK)', () => {
    expect(isEffectiveSource(makeResult({}))).toBe(true);
  });

  it('returns true when normalization is WARN', () => {
    expect(isEffectiveSource(makeResult({ normalization: 'WARN' }))).toBe(true);
  });

  it('returns false when dispatch is NOT_DISPATCHED', () => {
    expect(isEffectiveSource(makeResult({ dispatch: 'NOT_DISPATCHED' }))).toBe(false);
  });

  it('returns false when dispatch is CANCELLED', () => {
    expect(isEffectiveSource(makeResult({ dispatch: 'CANCELLED' }))).toBe(false);
  });

  it('returns false when collection_ok is false', () => {
    expect(isEffectiveSource(makeResult({ collection_ok: false, raw_hash: null }))).toBe(false);
  });

  it('returns false when parse_ok is false', () => {
    expect(isEffectiveSource(makeResult({ parse_ok: false }))).toBe(false);
  });

  it('returns false when normalization is FATAL', () => {
    expect(isEffectiveSource(makeResult({ normalization: 'FATAL' }))).toBe(false);
  });

  it('returns false when normalization is NOT_RUN', () => {
    expect(isEffectiveSource(makeResult({ normalization: 'NOT_RUN' }))).toBe(false);
  });
});
