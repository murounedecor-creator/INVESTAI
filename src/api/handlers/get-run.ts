import type { RunRepository } from '@/src/db/repository';
import { toGetRunResponse } from '../response-mapper';
import { errorResponse, successResponse, safeErrorMessage } from '../errors';

/**
 * GET /runs/{run_id} handler.
 *
 * 200 — run exists
 * 404 RUN_NOT_FOUND — run does not exist
 * 500 INTERNAL_ERROR — internal failure
 */
export async function handleGetRun(
  runId: string,
  deps: { repository: RunRepository }
): Promise<Response> {
  try {
    const row = await deps.repository.getRun(runId);
    if (!row) {
      return errorResponse('RUN_NOT_FOUND', `Run '${runId}' not found`);
    }
    return successResponse(toGetRunResponse(row));
  } catch (err) {
    return errorResponse('INTERNAL_ERROR', safeErrorMessage(err));
  }
}
