import { describe, it, expect } from 'vitest';
import { createSourceResult } from '@/src/contracts/source';

describe('createSourceResult — raw_hash invariant', () => {
  it('succeeds when collection_ok=true and raw_hash is provided', () => {
    const sr = createSourceResult({
      source: 'test',
      dispatch: 'DISPATCHED',
      dispatch_reason: 'NONE',
      collection_ok: true,
      parse_ok: true,
      normalization: 'OK',
      raw_hash: 'abc123',
    });
    expect(sr.raw_hash).toBe('abc123');
  });

  it('throws when collection_ok=true but raw_hash is null', () => {
    expect(() =>
      createSourceResult({
        source: 'test',
        dispatch: 'DISPATCHED',
        dispatch_reason: 'NONE',
        collection_ok: true,
        parse_ok: true,
        normalization: 'OK',
        raw_hash: null,
      })
    ).toThrow('raw_hash is mandatory');
  });

  it('throws when collection_ok=true but raw_hash is empty string', () => {
    expect(() =>
      createSourceResult({
        source: 'test',
        dispatch: 'DISPATCHED',
        dispatch_reason: 'NONE',
        collection_ok: true,
        parse_ok: true,
        normalization: 'OK',
        raw_hash: '',
      })
    ).toThrow('raw_hash is mandatory');
  });

  it('succeeds when collection_ok=false and raw_hash is null', () => {
    const sr = createSourceResult({
      source: 'test',
      dispatch: 'CANCELLED',
      dispatch_reason: 'TIMEOUT',
      collection_ok: false,
      parse_ok: false,
      normalization: 'NOT_RUN',
      raw_hash: null,
    });
    expect(sr.raw_hash).toBeNull();
  });

  it('throws when collection_ok=false but raw_hash is provided', () => {
    expect(() =>
      createSourceResult({
        source: 'test',
        dispatch: 'DISPATCHED',
        dispatch_reason: 'NONE',
        collection_ok: false,
        parse_ok: false,
        normalization: 'NOT_RUN',
        raw_hash: 'abc123',
      })
    ).toThrow('raw_hash must be null');
  });
});
