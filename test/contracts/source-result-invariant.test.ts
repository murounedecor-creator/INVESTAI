import { describe, it, expect } from 'vitest';
import { createSourceResult } from '@/src/contracts/source';

describe('createSourceResult — raw_hash invariant', () => {
  it('succeeds when collection_ok=true and raw_hash is provided', () => {
    const sr = createSourceResult({
      source: 'test',
      dispatch: 'DISPATCHED',
      dispatch_reason: null,
      collection_ok: true,
      parse_ok: true,
      normalization: 'OK',
      raw_hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
    expect(sr.raw_hash).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  it('throws when collection_ok=true but raw_hash is null', () => {
    expect(() =>
      createSourceResult({
        source: 'test',
        dispatch: 'DISPATCHED',
        dispatch_reason: null,
        collection_ok: true,
        parse_ok: true,
        normalization: 'OK',
        raw_hash: null,
      })
    ).toThrow('INVARIANT_VIOLATION');
  });

  it('throws when collection_ok=true but raw_hash is empty string', () => {
    expect(() =>
      createSourceResult({
        source: 'test',
        dispatch: 'DISPATCHED',
        dispatch_reason: null,
        collection_ok: true,
        parse_ok: true,
        normalization: 'OK',
        raw_hash: '',
      })
    ).toThrow('INVARIANT_VIOLATION');
  });

  it('succeeds when collection_ok=false and raw_hash is null', () => {
    const sr = createSourceResult({
      source: 'test',
      dispatch: 'CANCELLED',
      dispatch_reason: 'GLOBAL_TIMEOUT',
      collection_ok: false,
      parse_ok: false,
      normalization: 'NOT_RUN',
      raw_hash: null,
    });
    expect(sr.raw_hash).toBeNull();
  });

  it('accepts raw_hash when collection_ok=false and bytes were received (spec B.1)', () => {
    const sr = createSourceResult({
      source: 'test',
      dispatch: 'DISPATCHED',
      dispatch_reason: null,
      collection_ok: false,
      parse_ok: false,
      normalization: 'NOT_RUN',
      raw_hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
    expect(sr.raw_hash).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });
});
