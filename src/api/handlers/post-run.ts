import type { RunRepository } from '@/src/db/repository';
import type { Agent } from '@/src/contracts/agent';
import type { RunResult, RunContext } from '@/src/contracts/run';
import { executeRun } from '@/src/scheduler/scheduler';
import {
  runContextToRow,
} from '@/src/db/repository';
import { toPostRunResponse } from '../response-mapper';
import { errorResponse, successResponse, safeErrorMessage } from '../errors';
import { logServerError } from '@/src/core/log';
import type { PostRunResponse } from '@/src/contracts/http';

export interface ApiDependencies {
  repository: RunRepository;
  agents: Agent[];
}

/**
 * POST /run handler.
 *
 * Triggers the Scheduler, persists results, and returns the FROZEN PostRunResponse.
 *
 * 200 OK — valid response
 * 400 VALIDATION_ERROR — invalid request body
 * 500 INTERNAL_ERROR — internal failure (no stack trace, no secrets)
 */
export async function handlePostRun(
  request: Request,
  deps: ApiDependencies
): Promise<Response> {
  let body: { params?: Record<string, unknown> };

  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return errorResponse('VALIDATION_ERROR', 'Request body must be a JSON object');
    }
    body = parsed as { params?: Record<string, unknown> };
  } catch {
    return errorResponse('VALIDATION_ERROR', 'Request body must be valid JSON');
  }

  const rawParams: unknown = body.params;
  if (
    rawParams !== undefined &&
    (typeof rawParams !== 'object' || rawParams === null || Array.isArray(rawParams))
  ) {
    return errorResponse('VALIDATION_ERROR', 'params must be a JSON object when provided');
  }

  const runId = generateRunId();
  const startedAt = new Date().toISOString();
  const params = body.params ?? {};

  const context: RunContext = {
    run_id: runId,
    started_at: startedAt,
    params,
  };

  let runResult: RunResult;
  try {
    runResult = await executeRun(context, { agents: deps.agents });
  } catch (err) {
    logServerError('post-run.execute', err);
    return errorResponse('INTERNAL_ERROR', safeErrorMessage(err));
  }

  // Persist results
  try {
    await deps.repository.insertRun(
      runContextToRow(context, runResult.finished_at, runResult.status)
    );
    for (const result of runResult.results) {
      await deps.repository.insertAgentResult(result);
    }
    for (const failure of runResult.failures) {
      await deps.repository.insertAgentFailure(failure);
    }
  } catch (err) {
    logServerError('post-run.persist', err);
    return errorResponse('INTERNAL_ERROR', safeErrorMessage(err));
  }

  const response: PostRunResponse = toPostRunResponse(runResult);
  return successResponse(response);
}

function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
