import type {
  AgentResult,
  AgentFailure,
} from '@/src/contracts/agent';
import type { RunStatus } from '@/src/contracts/run';

/**
 * Derives RunStatus from results and failures.
 *
 * COMPLETED: all agents produced results AND no failures exist.
 * PARTIAL: at least one result AND at least one failure.
 * FAILED: no successful results AND at least one failure.
 *
 * A normal execution CANNOT result in results=[] AND failures=[] simultaneously.
 * This state is INVALID and will throw.
 *
 * NOT RUN ≠ PASS.
 */
export function deriveRunStatus(
  results: AgentResult[],
  failures: AgentFailure[]
): RunStatus {
  if (results.length === 0 && failures.length === 0) {
    throw new Error(
      'INVALID_STATE: results=[] and failures=[] is not a valid run state. ' +
        'A normal execution must produce at least one result or one failure.'
    );
  }

  const hasResults = results.length > 0;
  const hasFailures = failures.length > 0;

  if (hasResults && !hasFailures) {
    return 'COMPLETED';
  }
  if (hasResults && hasFailures) {
    return 'PARTIAL';
  }
  // !hasResults && hasFailures
  return 'FAILED';
}
