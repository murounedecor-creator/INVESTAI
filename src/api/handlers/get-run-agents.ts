import type { RunRepository } from '@/src/db/repository';
import { toGetRunAgentsResponse } from '../response-mapper';
import { errorResponse, successResponse, safeErrorMessage } from '../errors';

/**
 * GET /runs/{run_id}/agents handler.
 *
 * 200 — run exists, returns agent listing
 * 404 RUN_NOT_FOUND — run does not exist
 * 500 INTERNAL_ERROR — internal failure
 */
export async function handleGetRunAgents(
  runId: string,
  deps: { repository: RunRepository }
): Promise<Response> {
  try {
    const run = await deps.repository.getRun(runId);
    if (!run) {
      return errorResponse('RUN_NOT_FOUND', `Run '${runId}' not found`);
    }
    const agents = await deps.repository.getAgentIds(runId);
    return successResponse(toGetRunAgentsResponse(runId, agents));
  } catch (err) {
    return errorResponse('INTERNAL_ERROR', safeErrorMessage(err));
  }
}
