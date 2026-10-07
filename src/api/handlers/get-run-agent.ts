import type { RunRepository } from '@/src/db/repository';
import { toGetRunAgentResponse } from '../response-mapper';
import { errorResponse, successResponse, safeErrorMessage } from '../errors';

/**
 * GET /runs/{run_id}/agents/{agent_id} handler.
 *
 * 200 — agent result or failure exists
 * 404 RUN_NOT_FOUND — run does not exist
 * 404 AGENT_RESULT_NOT_FOUND — agent does not exist within the run
 * 500 INTERNAL_ERROR — internal failure
 */
export async function handleGetRunAgent(
  runId: string,
  agentId: string,
  deps: { repository: RunRepository }
): Promise<Response> {
  try {
    const run = await deps.repository.getRun(runId);
    if (!run) {
      return errorResponse('RUN_NOT_FOUND', `Run '${runId}' not found`);
    }

    const resultRow = await deps.repository.getAgentResult(runId, agentId);
    const failureRows = await deps.repository.getAgentFailures(runId);
    const failureRow = failureRows.find((f) => f.agent_id === agentId) ?? null;

    if (!resultRow && !failureRow) {
      return errorResponse(
        'AGENT_RESULT_NOT_FOUND',
        `Agent '${agentId}' not found in run '${runId}'`
      );
    }

    return successResponse(
      toGetRunAgentResponse(runId, agentId, resultRow, failureRow)
    );
  } catch (err) {
    return errorResponse('INTERNAL_ERROR', safeErrorMessage(err));
  }
}
