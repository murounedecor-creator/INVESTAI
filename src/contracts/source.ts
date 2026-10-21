import type { DispatchState, DispatchReason } from './dispatch';
import type { NormalizationState } from './normalization';

/**
 * SourceResult — FROZEN CONTRACT (Master Specification v1.0)
 * Do NOT add, remove, or rename fields.
 */
export interface SourceResult {
  source: string;
  dispatch: DispatchState;
  dispatch_reason: DispatchReason | null;
  collection_ok: boolean;
  parse_ok: boolean;
  normalization: NormalizationState;
  raw_hash: string | null;
}

/**
 * SourceExecutionDetail — INTERNAL implementation type (NOT frozen).
 *
 * Restrictions:
 * - Does NOT alter SourceResult.
 * - Does NOT create new fields in the frozen contract.
 * - Must NOT be exposed as an HTTP contract.
 * - Must NOT be used to invent new states without specification.
 */
export interface SourceExecutionDetail {
  failure_layer: import('./normalization').FailureLayer;
  error_message: string | null;
  raw_bytes_length: number | null;
}

/**
 * SourceGroup — defines a group of sources with a minimum effective requirement.
 */
export interface SourceGroup {
  group_id: string;
  sources: string[];
  minimum_successful_sources: number;
}

/**
 * CoverageResult — result of evaluating a source group's coverage.
 */
export interface CoverageResult {
  group_id: string;
  effective_count: number;
  minimum_required: number;
  satisfied: boolean;
}

/**
 * Factory for SourceResult enforcing the raw_hash invariant:
 * When collection_ok = true, raw_hash MUST be a non-null SHA-256 hex string.
 * When collection_ok = false, raw_hash MUST be null.
 */
export function createSourceResult(params: {
  source: string;
  dispatch: DispatchState;
  dispatch_reason: DispatchReason | null;
  collection_ok: boolean;
  parse_ok: boolean;
  normalization: NormalizationState;
  raw_hash: string | null;
}): SourceResult {
  const fail = (msg: string): never => {
    throw new Error('INVARIANT_VIOLATION: ' + msg);
  };
  const p = params;
  const hashOk = p.raw_hash === null || /^[0-9a-f]{64}$/.test(p.raw_hash);
  if (!hashOk) fail('raw_hash must be a 64-char lowercase SHA-256 hex or null');
  if (p.collection_ok && (p.raw_hash === null)) fail('raw_hash is mandatory when collection_ok = true');
  if (p.dispatch === 'DISPATCHED') {
    if (p.dispatch_reason !== null) fail('dispatch_reason must be null when DISPATCHED');
  } else {
    if (p.dispatch_reason === null) fail('dispatch_reason is required when not DISPATCHED');
    if (p.collection_ok || p.parse_ok || p.normalization !== 'NOT_RUN') {
      fail('CANCELLED and NOT_DISPATCHED require collection_ok=false, parse_ok=false, normalization=NOT_RUN');
    }
  }
  if (p.dispatch === 'NOT_DISPATCHED' && p.raw_hash !== null) {
    fail('NOT_DISPATCHED requires raw_hash = null (INV-20)');
  }
  if (p.dispatch === 'CANCELLED' && p.collection_ok) {
    fail('CANCELLED is only valid before collection completes');
  }
  if (p.parse_ok && !p.collection_ok) fail('parse_ok requires collection_ok');
  if (p.normalization !== 'NOT_RUN' && !p.parse_ok) fail('normalization requires parse_ok');
  if (p.parse_ok && p.normalization === 'NOT_RUN') fail('parse_ok requires a normalization result');
  return {
    source: p.source,
    dispatch: p.dispatch,
    dispatch_reason: p.dispatch_reason,
    collection_ok: p.collection_ok,
    parse_ok: p.parse_ok,
    normalization: p.normalization,
    raw_hash: p.raw_hash,
  };
}
