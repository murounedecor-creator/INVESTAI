import type { SourceGroup, CoverageResult, SourceResult } from '@/src/contracts/source';
import { isEffectiveSource } from './effective-source';

/**
 * Evaluates coverage for a source group.
 *
 * A group satisfies its requirement when it has
 * at least minimum_successful_sources effective sources.
 *
 * Failures and non-dispatched sources do NOT count as effective.
 */
export function evaluateGroupCoverage(
  group: SourceGroup,
  results: SourceResult[]
): CoverageResult {
  const groupResults = results.filter((r) => group.sources.includes(r.source));
  const effectiveCount = groupResults.filter(isEffectiveSource).length;
  const satisfied = effectiveCount >= group.minimum_successful_sources;

  return {
    group_id: group.group_id,
    effective_count: effectiveCount,
    minimum_required: group.minimum_successful_sources,
    satisfied,
  };
}

/**
 * Evaluates coverage for multiple groups at once.
 */
export function evaluateAllCoverage(
  groups: SourceGroup[],
  results: SourceResult[]
): CoverageResult[] {
  return groups.map((g) => evaluateGroupCoverage(g, results));
}

/**
 * Full coverage is achieved when ALL groups are satisfied.
 */
export function isFullCoverage(
  groups: SourceGroup[],
  results: SourceResult[]
): boolean {
  return evaluateAllCoverage(groups, results).every((c) => c.satisfied);
}
