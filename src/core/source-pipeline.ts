import type {
  SourceResult,
  SourceExecutionDetail,
} from '@/src/contracts/source';
import type { DispatchReason } from '@/src/contracts/dispatch';
import type { NormalizationState, FailureLayer } from '@/src/contracts/normalization';
import { createSourceResult } from '@/src/contracts/source';
import { sha256Hex } from './hash';

/**
 * Source Pipeline — COLLECT → PARSE → NORMALIZE → [domain validation when applicable] → RESULT
 *
 * The validation step is NOT a universal validate() function.
 * It can be separate or integrated into normalization, depending on the contract.
 *
 * This module provides the interface and a reference executor.
 * Domain-specific sources are implemented in future phases.
 */

export interface CollectOutput {
  ok: boolean;
  raw_bytes: Uint8Array | null;
  error_message: string | null;
}

export interface ParseOutput {
  ok: boolean;
  parsed: unknown | null;
  error_message: string | null;
}

export interface NormalizeOutput {
  normalization: NormalizationState;
  normalized: Record<string, unknown> | null;
  error_message: string | null;
}

export interface SourceStepHandlers {
  collect: () => Promise<CollectOutput>;
  parse: (raw: Uint8Array) => ParseOutput | Promise<ParseOutput>;
  normalize: (parsed: unknown) => NormalizeOutput | Promise<NormalizeOutput>;
}

/**
 * Executes the full pipeline for a single source.
 * Produces a SourceResult (frozen contract) + SourceExecutionDetail (internal).
 */
export async function executeSourcePipeline(
  sourceName: string,
  dispatchReason: DispatchReason,
  handlers: SourceStepHandlers
): Promise<{ result: SourceResult; detail: SourceExecutionDetail }> {
  // COLLECT
  const collectOutput = await handlers.collect();

  if (!collectOutput.ok) {
    const detail: SourceExecutionDetail = {
      failure_layer: 'COLLECTION' as FailureLayer,
      error_message: collectOutput.error_message,
      raw_bytes_length: null,
    };
    const result = createSourceResult({
      source: sourceName,
      dispatch: 'DISPATCHED',
      dispatch_reason: dispatchReason,
      collection_ok: false,
      parse_ok: false,
      normalization: 'NOT_RUN',
      raw_hash: null,
    });
    return { result, detail };
  }

  const rawBytes = collectOutput.raw_bytes!;
  const rawHash = await sha256Hex(rawBytes);

  // PARSE
  const parseOutput = await handlers.parse(rawBytes);

  if (!parseOutput.ok) {
    const detail: SourceExecutionDetail = {
      failure_layer: 'PARSE' as FailureLayer,
      error_message: parseOutput.error_message,
      raw_bytes_length: rawBytes.length,
    };
    const result = createSourceResult({
      source: sourceName,
      dispatch: 'DISPATCHED',
      dispatch_reason: dispatchReason,
      collection_ok: true,
      parse_ok: false,
      normalization: 'NOT_RUN',
      raw_hash: rawHash,
    });
    return { result, detail };
  }

  // NORMALIZE (+ domain validation when applicable)
  const normalizeOutput = await handlers.normalize(parseOutput.parsed);

  const detail: SourceExecutionDetail = {
    failure_layer: normalizeOutput.normalization === 'FATAL' ? 'NORMALIZATION' as FailureLayer : 'NONE' as FailureLayer,
    error_message: normalizeOutput.error_message,
    raw_bytes_length: rawBytes.length,
  };

  const result = createSourceResult({
    source: sourceName,
    dispatch: 'DISPATCHED',
    dispatch_reason: dispatchReason,
    collection_ok: true,
    parse_ok: true,
    normalization: normalizeOutput.normalization,
    raw_hash: rawHash,
  });

  return { result, detail };
}
