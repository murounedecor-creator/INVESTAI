import { describe, it, expect } from 'vitest';
import { createSourceResult } from '@/src/contracts/source';

type P = Parameters<typeof createSourceResult>[0];
const H = 'a'.repeat(64);

function mk(p: Partial<P>): P {
  return {
    source: 's',
    dispatch: 'DISPATCHED',
    dispatch_reason: null,
    collection_ok: true,
    parse_ok: true,
    normalization: 'OK',
    raw_hash: H,
    ...p,
  };
}

const valid: Array<[string, P]> = [
  ['row1 OK', mk({})],
  ['row2 WARN', mk({ normalization: 'WARN' })],
  ['row3 FATAL', mk({ normalization: 'FATAL' })],
  ['row4 parse failure', mk({ parse_ok: false, normalization: 'NOT_RUN' })],
  ['row5 collection failure without bytes', mk({ collection_ok: false, parse_ok: false, normalization: 'NOT_RUN', raw_hash: null })],
  ['row5b collection failure with bytes', mk({ collection_ok: false, parse_ok: false, normalization: 'NOT_RUN', raw_hash: H })],
  ['row6 cancelled', mk({ dispatch: 'CANCELLED', dispatch_reason: 'GLOBAL_TIMEOUT', collection_ok: false, parse_ok: false, normalization: 'NOT_RUN', raw_hash: null })],
  ['row7 not dispatched', mk({ dispatch: 'NOT_DISPATCHED', dispatch_reason: 'BUDGET_EXHAUSTED', collection_ok: false, parse_ok: false, normalization: 'NOT_RUN', raw_hash: null })],
];

const invalid: Array<[string, P]> = [
  ['CANCELLED with collection_ok true', mk({ dispatch: 'CANCELLED', dispatch_reason: 'GLOBAL_TIMEOUT', collection_ok: true, parse_ok: false, normalization: 'NOT_RUN' })],
  ['NOT_DISPATCHED with raw_hash (INV-20)', mk({ dispatch: 'NOT_DISPATCHED', dispatch_reason: 'BUDGET_EXHAUSTED', collection_ok: false, parse_ok: false, normalization: 'NOT_RUN', raw_hash: H })],
  ['NOT_DISPATCHED with null reason', mk({ dispatch: 'NOT_DISPATCHED', dispatch_reason: null, collection_ok: false, parse_ok: false, normalization: 'NOT_RUN', raw_hash: null })],
  ['DISPATCHED with a reason', mk({ dispatch_reason: 'GLOBAL_TIMEOUT' })],
  ['parse ok without collection', mk({ collection_ok: false, normalization: 'NOT_RUN', raw_hash: null })],
  ['normalization without parse', mk({ parse_ok: false, normalization: 'OK' })],
  ['parse ok with NOT_RUN normalization', mk({ normalization: 'NOT_RUN' })],
  ['collection_ok without hash', mk({ raw_hash: null })],
  ['empty hash', mk({ raw_hash: '' })],
];

describe('SourceResult matrix (spec 27/09, ADR-009)', () => {
  for (const [name, p] of valid) {
    it(`accepts ${name}`, () => {
      expect(() => createSourceResult(p)).not.toThrow();
    });
  }
  for (const [name, p] of invalid) {
    it(`rejects ${name}`, () => {
      expect(() => createSourceResult(p)).toThrow('INVARIANT_VIOLATION');
    });
  }
});
