import type { SourceResult, SourceExecutionDetail } from '@/src/contracts/source';
import type { DispatchReason } from '@/src/contracts/dispatch';
import { createSourceResult } from '@/src/contracts/source';
import { executeSourcePipeline, type SourceStepHandlers } from '@/src/core/source-pipeline';

/**
 * SourceExecutor — executes the individual cycle of a single source.
 *
 * Pipeline: COLLECT → PARSE → NORMALIZE → [validation when applicable] → RESULT
 *
 * Produces a SourceResult (frozen contract) + SourceExecutionDetail (internal).
 * Domain-specific executors are implemented in future phases.
 */
export async function executeSource(
  sourceName: string,
  dispatchReason: DispatchReason,
  handlers: SourceStepHandlers
): Promise<{ result: SourceResult; detail: SourceExecutionDetail }> {
  return executeSourcePipeline(sourceName, dispatchReason, handlers);
}

/**
 * Creates a NOT_DISPATCHED source result.
 * Used when a source was not started due to max_dispatches limit.
 */
export function createNotDispatchedResult(
  sourceName: string,
  reason: DispatchReason
): SourceResult {
  return createSourceResult({
    source: sourceName,
    dispatch: 'NOT_DISPATCHED',
    dispatch_reason: reason,
    collection_ok: false,
    parse_ok: false,
    normalization: 'NOT_RUN',
    raw_hash: null,
  });
}

/**
 * Creates a CANCELLED source result.
 * Used when a source was cancelled due to global timeout.
 */
export function createCancelledResult(
  sourceName: string,
  reason: DispatchReason
): SourceResult {
  return createSourceResult({
    source: sourceName,
    dispatch: 'CANCELLED',
    dispatch_reason: reason,
    collection_ok: false,
    parse_ok: false,
    normalization: 'NOT_RUN',
    raw_hash: null,
  });
}
