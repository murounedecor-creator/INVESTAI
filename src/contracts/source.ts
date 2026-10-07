import type { DispatchState, DispatchReason } from './dispatch';
import type { NormalizationState } from './normalization';

/**
 * SourceResult — FROZEN CONTRACT (Master Specification v1.0)
 * Do NOT add, remove, or rename fields.
 */
export interface SourceResult {
  source: string;
  dispatch: DispatchState;
  dispatch_reason: DispatchReason;
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
  dispatch_reason: DispatchReason;
  collection_ok: boolean;
  parse_ok: boolean;
  normalization: NormalizationState;
  raw_hash: string | null;
}): SourceResult {
  if (params.collection_ok && (params.raw_hash === null || params.raw_hash === '')) {
    throw new Error(
      'INVARIANT_VIOLATION: raw_hash is mandatory when collection_ok = true'
    );
  }
  if (!params.collection_ok && params.raw_hash !== null) {
    throw new Error(
      'INVARIANT_VIOLATION: raw_hash must be null when collection_ok = false'
    );
  }
  return {
    source: params.source,
    dispatch: params.dispatch,
    dispatch_reason: params.dispatch_reason,
    collection_ok: params.collection_ok,
    parse_ok: params.parse_ok,
    normalization: params.normalization,
    raw_hash: params.raw_hash,
  };
}
