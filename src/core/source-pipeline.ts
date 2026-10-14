import type {
  SourceResult,
  SourceExecutionDetail,
} from '@/src/contracts/source';
import type { DispatchReason } from '@/src/contracts/dispatch';
import type {
  NormalizationState,
  FailureLayer,
} from '@/src/contracts/normalization';
import { createSourceResult } from '@/src/contracts/source';
import { sha256Hex } from './hash';

/**
 * Source Pipeline — COLLECT → PARSE → NORMALIZE
 * → domain validation when applicable → RESULT
 *
 * Validation is not a universal validate() function.
 * It may be separate or integrated into normalization.
 *
 * This module provides the reference executor.
 * Domain-specific sources are implemented separately.
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
  collect: (
    signal?: AbortSignal
  ) => Promise<CollectOutput>;

  parse: (
    raw: Uint8Array,
    signal?: AbortSignal
  ) => ParseOutput | Promise<ParseOutput>;

  normalize: (
    parsed: unknown,
    signal?: AbortSignal
  ) => NormalizeOutput | Promise<NormalizeOutput>;
}

export class SourceExecutionAbortedError extends Error {
  constructor() {
    super('SOURCE_EXECUTION_ABORTED');
    this.name = 'AbortError';
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new SourceExecutionAbortedError();
  }
}

/**
 * Executes the full pipeline for one source.
 * Returns the frozen SourceResult contract and internal detail.
 */
export async function executeSourcePipeline(
  sourceName: string,
  dispatchReason: DispatchReason,
  handlers: SourceStepHandlers,
  signal?: AbortSignal
): Promise<{
  result: SourceResult;
  detail: SourceExecutionDetail;
}> {
  throwIfAborted(signal);

  // COLLECT
  const collectOutput = await handlers.collect(signal);
  throwIfAborted(signal);

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
  throwIfAborted(signal);

  // PARSE
  const parseOutput = await handlers.parse(
    rawBytes,
    signal
  );
  throwIfAborted(signal);

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

  // NORMALIZE
  const normalizeOutput = await handlers.normalize(
    parseOutput.parsed,
    signal
  );
  throwIfAborted(signal);

  const detail: SourceExecutionDetail = {
    failure_layer:
      normalizeOutput.normalization === 'FATAL'
        ? ('NORMALIZATION' as FailureLayer)
        : ('NONE' as FailureLayer),
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
