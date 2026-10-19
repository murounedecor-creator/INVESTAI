import type { SourceResult } from '@/src/contracts/source';
import type { DispatchReason } from '@/src/contracts/dispatch';
import {
  executeSource,
  createNotDispatchedResult,
  createCancelledResult,
} from '@/src/orchestrator/source-executor';
import type { SourceStepHandlers } from '@/src/core/source-pipeline';
import { logServerError } from '@/src/core/log';

const REASON_MAX_DISPATCHES: DispatchReason = 'MAX_DISPATCHES_REACHED';
const REASON_GLOBAL_TIMEOUT: DispatchReason = 'GLOBAL_TIMEOUT';

export interface SourceTask {
  source: string;
  handlers: SourceStepHandlers;
}

export interface OrchestratorConfig {
  max_dispatches: number;
  max_concurrency: number;
  global_timeout_ms: number;
}

export interface OrchestratorResult {
  results: SourceResult[];
}

export async function orchestrateSources(
  tasks: SourceTask[],
  config: OrchestratorConfig
): Promise<OrchestratorResult> {
  const results: SourceResult[] = [];
  const toDispatch: SourceTask[] = [];
  const notDispatched: SourceResult[] = [];

  for (const task of tasks) {
    if (toDispatch.length < config.max_dispatches) {
      toDispatch.push(task);
    } else {
      notDispatched.push(
        createNotDispatchedResult(task.source, REASON_MAX_DISPATCHES)
      );
    }
  }

  const dispatchedResults = await runWithConcurrencyAndTimeout(
    toDispatch,
    config.max_concurrency,
    config.global_timeout_ms
  );

  results.push(...dispatchedResults.results, ...notDispatched);
  return { results };
}

/**
 * Runs tasks with a concurrency limiter and a global timeout.
 *
 * Active tasks when the timeout expires become CANCELLED.
 * Tasks that have not started become NOT_DISPATCHED.
 *
 * AbortSignal is cooperative: a handler must observe the signal
 * to stop its own work. Promise.race prevents the orchestrator
 * from waiting indefinitely for a handler that ignores cancellation.
 */
async function runWithConcurrencyAndTimeout(
  tasks: SourceTask[],
  maxConcurrency: number,
  timeoutMs: number
): Promise<OrchestratorResult> {
  const entries: { index: number; result: SourceResult }[] = [];
  const record = (index: number, result: SourceResult): void => {
    entries.push({ index, result });
  };
  let currentIndex = 0;
  let timedOut = false;
  let firstFailure: Error | null = null;

  const abortController = new AbortController();

  let resolveTimeout!: () => void;
  const timeoutPromise = new Promise<void>((resolve) => {
    resolveTimeout = resolve;
  });

  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    abortController.abort();
    resolveTimeout();
  }, timeoutMs);

  async function runNext(): Promise<void> {
    while (
      currentIndex < tasks.length &&
      !timedOut &&
      firstFailure === null
    ) {
      const index = currentIndex++;
      const task = tasks[index];

      const executionPromise = executeSource(
        task.source,
        'NONE',
        task.handlers,
        abortController.signal
      );

      try {
        const outcome = await Promise.race([
          executionPromise.then((value) => ({
            kind: 'result' as const,
            value,
          })),
          timeoutPromise.then(() => ({
            kind: 'timeout' as const,
          })),
        ]);

        if (firstFailure !== null) {
          return;
        }

        if (outcome.kind === 'result') {
          record(index, outcome.value.result);
        } else {
          record(
            index,
            createCancelledResult(task.source, REASON_GLOBAL_TIMEOUT)
          );
        }
      } catch (err) {
        if (firstFailure !== null) {
          return;
        }

        if (timedOut) {
          record(
            index,
            createCancelledResult(task.source, REASON_GLOBAL_TIMEOUT)
          );
        } else {
          logServerError(`orchestrator.${task.source}`, err);
          firstFailure = new Error(
            `SOURCE_EXECUTION_FAILED: ${task.source}`,
            { cause: err }
          );
          abortController.abort();
          return;
        }
      }
    }

    if (firstFailure !== null) {
      return;
    }

    while (currentIndex < tasks.length) {
      const index = currentIndex++;
      const task = tasks[index];
      record(
        index,
        createNotDispatchedResult(task.source, REASON_GLOBAL_TIMEOUT)
      );
    }
  }

  try {
    const workerCount = Math.min(
      Math.max(1, maxConcurrency),
      tasks.length
    );

    const workers: Promise<void>[] = [];

    for (let i = 0; i < workerCount; i++) {
      workers.push(runNext());
    }

    await Promise.allSettled(workers);

    if (firstFailure !== null) {
      throw firstFailure;
    }

    return {
      results: entries
        .sort((a, b) => a.index - b.index)
        .map((e) => e.result),
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}
