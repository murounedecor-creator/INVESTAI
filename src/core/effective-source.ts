import type { SourceResult } from '@/src/contracts/source';
import type { DispatchState } from '@/src/contracts/dispatch';
import type { NormalizationState } from '@/src/contracts/normalization';

/**
 * Effective Source — FROZEN RULE (Master Specification v1.0)
 *
 * A source is considered effective ONLY when ALL of:
 *   dispatch = DISPATCHED
 *   collection_ok = true
 *   parse_ok = true
 *   normalization ∈ {OK, WARN}
 *
 * No partially invalid source can be considered effective
 * just because it has some value.
 */
export function isEffectiveSource(sr: SourceResult): boolean {
  const dispatched: DispatchState = 'DISPATCHED';
  const validNormalization: NormalizationState[] = ['OK', 'WARN'];

  return (
    sr.dispatch === dispatched &&
    sr.collection_ok === true &&
    sr.parse_ok === true &&
    validNormalization.includes(sr.normalization)
  );
}
