import type { SourceResult } from '@/src/contracts/source';
import type { DispatchReason } from '@/src/contracts/dispatch';
import {
  executeSource,
  createNotDispatchedResult,
  createCancelledResult,
} from './source-executor';
import type { SourceStepHandlers } from '@/src/core/source-pipeline';

/**
 * SourceOrchestrator — controls dispatch, concurrency, budget, groups, and timeout.
 *
 * Responsibilities:
 * - Respect max_dispatches (global limit on number of sources dispatched)
 * - Limit concurrency via max_concurrency
 * - Enforce global_timeout (started work may be cancelled, unstarted work becomes NOT_DISPATCHED)
 * - Preserve dispatch_reason for NOT_DISPATCHED and CANCELLED states
 */

export interface OrchestratorConfig {
  max_dispatches: number;
  max_concurrency: number;
  global_timeout_ms: number;
}

export interface SourceTask {
  source: string;
  handlers: SourceStepHandlers;
}

export interface OrchestratorResult {
  results: SourceResult[];
}

// Dispatch reason constants — descriptive strings, NOT frozen enum values.
// The runtime NEVER produces "TO_SPECIFY".
const REASON_MAX_DISPATCHES: DispatchReason = 'MAX_DISPATCHES_REACHED';
const REASON_GLOBAL_TIMEOUT: DispatchReason = 'GLOBAL_TIMEOUT';

/**
 * Orchestrates the execution of multiple sources with concurrency and timeout control.
 */
export async function orchestrateSources(
  tasks: SourceTask[],
  config: OrchestratorConfig
): Promise<OrchestratorResult> {
  const results: SourceResult[] = [];

  // Determine which sources get dispatched (respecting max_dispatches)
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

  // Execute with concurrency limit and global timeout
  const dispatchedResults = await runWithConcurrencyAndTimeout(
    toDispatch,
    config.max_concurrency,
    config.global_timeout_ms
  );

  // Combine: dispatched results first, then not-dispatched
  results.push(...dispatchedResults.results, ...notDispatched);

  return { results };
}

/**
 * Runs tasks with a concurrency limiter and global timeout.
 *
 * Tasks that don't start before the timeout expires become CANCELLED.
 * Tasks that are in-flight when timeout expires are also CANCELLED.
 */
async function runWithConcurrencyAndTimeout(
  tasks: SourceTask[],
  maxConcurrency: number,
  timeoutMs: number
): Promise<OrchestratorResult> {
  const results: SourceResult[] = [];
  let currentIndex = 0;
  let timedOut = false;

  // Create a timeout controller
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      timedOut = true;
      resolve();
    }, timeoutMs);
  });

  async function runNext(): Promise<void> {
    while (currentIndex < tasks.length && !timedOut) {
      const task = tasks[currentIndex++];
      try {
        const { result } = await Promise.race([
          executeSource(task.source, 'NONE', task.handlers),
          timeoutPromise.then(() => null),
        ]);
        if (result) {
          results.push(result);
        } else {
          // Timeout hit during execution
          results.push(createCancelledResult(task.source, REASON_GLOBAL_TIMEOUT));
        }
      } catch {
        results.push(createCancelledResult(task.source, REASON_GLOBAL_TIMEOUT));
      }
    }

    // If timeout expired, mark remaining unstarted tasks as CANCELLED
    while (currentIndex < tasks.length) {
      const task = tasks[currentIndex++];
      results.push(createCancelledResult(task.source, REASON_GLOBAL_TIMEOUT));
    }
  }

  // Start concurrency workers
  const workers: Promise<void>[] = [];
  const workerCount = Math.min(maxConcurrency, tasks.length);
  for (let i = 0; i < workerCount; i++) {
    workers.push(runNext());
  }

  await Promise.all(workers);

  return { results };
}
