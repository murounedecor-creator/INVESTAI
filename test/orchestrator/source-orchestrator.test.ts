import { describe, it, expect } from 'vitest';
import {
  orchestrateSources,
  type SourceTask,
} from '@/src/orchestrator/source-orchestrator';
import type {
  SourceStepHandlers,
  CollectOutput,
} from '@/src/core/source-pipeline';

function successHandlers(): SourceStepHandlers {
  return {
    collect: async () => ({
      ok: true,
      raw_bytes: new TextEncoder().encode('x'),
      error_message: null,
    }),
    parse: () => ({
      ok: true,
      parsed: {},
      error_message: null,
    }),
    normalize: () => ({
      normalization: 'OK' as const,
      normalized: {},
      error_message: null,
    }),
  };
}

function makeTask(
  source: string,
  handlers?: Partial<SourceStepHandlers>
): SourceTask {
  return {
    source,
    handlers: {
      ...successHandlers(),
      ...handlers,
    },
  };
}

describe('SourceOrchestrator', () => {
  it('dispatches all when under max_dispatches', async () => {
    const tasks = [makeTask('a'), makeTask('b')];

    const result = await orchestrateSources(tasks, {
      max_dispatches: 10,
      max_concurrency: 2,
      global_timeout_ms: 5000,
    });

    expect(result.results).toHaveLength(2);
    expect(
      result.results.every((item) => item.dispatch === 'DISPATCHED')
    ).toBe(true);
  });

  it('marks excess sources as NOT_DISPATCHED', async () => {
    const tasks = [
      makeTask('a'),
      makeTask('b'),
      makeTask('c'),
    ];

    const result = await orchestrateSources(tasks, {
      max_dispatches: 1,
      max_concurrency: 1,
      global_timeout_ms: 5000,
    });

    const notDispatched = result.results.filter(
      (item) => item.dispatch === 'NOT_DISPATCHED'
    );

    expect(notDispatched).toHaveLength(2);
    expect(
      notDispatched.every(
        (item) => item.dispatch_reason === 'MAX_DISPATCHES_REACHED'
      )
    ).toBe(true);
  });

  it('never produces TO_SPECIFY as dispatch_reason', async () => {
    const tasks = [makeTask('a'), makeTask('b')];

    const result = await orchestrateSources(tasks, {
      max_dispatches: 1,
      max_concurrency: 1,
      global_timeout_ms: 5000,
    });

    expect(
      result.results.every(
        (item) => item.dispatch_reason !== 'TO_SPECIFY'
      )
    ).toBe(true);
  });

  it('aborts active workers and does not start queued sources after an unexpected worker failure', async () => {
    let abortObserved = false;
    let waitingStarted = false;

    const failsImmediately = async (): Promise<CollectOutput> => {
      throw new Error('boom');
    };

    const waitsForAbort = (
      signal?: AbortSignal
    ): Promise<CollectOutput> =>
      new Promise((resolve, reject) => {
        if (signal?.aborted) {
          abortObserved = true;
          reject(new Error('Handler observed cancellation'));
          return;
        }

        signal?.addEventListener(
          'abort',
          () => {
            abortObserved = true;
            reject(new Error('Handler observed cancellation'));
          },
          { once: true }
        );
      });

    const tasks = [
      makeTask('failing', { collect: failsImmediately }),
      makeTask('active', { collect: waitsForAbort }),
      makeTask('waiting', {
        collect: async () => {
          waitingStarted = true;
          return {
            ok: true,
            raw_bytes: new TextEncoder().encode('waiting'),
            error_message: null,
          };
        },
      }),
    ];

    await expect(
      orchestrateSources(tasks, {
        max_dispatches: 3,
        max_concurrency: 2,
        global_timeout_ms: 5000,
      })
    ).rejects.toThrow('SOURCE_EXECUTION_FAILED: failing');

    expect(abortObserved).toBe(true);
    expect(waitingStarted).toBe(false);
  });

  it('distinguishes an active task cancelled by timeout from tasks never started', async () => {
    const neverFinishes = (): Promise<CollectOutput> =>
      new Promise(() => {});

    const tasks = [
      makeTask('active', { collect: neverFinishes }),
      makeTask('waiting-1'),
      makeTask('waiting-2'),
    ];

    const result = await orchestrateSources(tasks, {
      max_dispatches: 3,
      max_concurrency: 1,
      global_timeout_ms: 30,
    });

    const bySource = new Map(
      result.results.map((item) => [item.source, item])
    );

    expect(bySource.get('active')?.dispatch).toBe('CANCELLED');

    expect(bySource.get('waiting-1')?.dispatch).toBe('NOT_DISPATCHED');
    expect(bySource.get('waiting-2')?.dispatch).toBe('NOT_DISPATCHED');

    expect(bySource.get('waiting-1')?.dispatch_reason).toBe('GLOBAL_TIMEOUT');
    expect(bySource.get('waiting-2')?.dispatch_reason).toBe('GLOBAL_TIMEOUT');
  });

  it('signals cancellation to an active handler when the global timeout expires', async () => {
    let abortObserved = false;

    const waitsForAbort = (
      signal?: AbortSignal
    ): Promise<CollectOutput> =>
      new Promise((resolve, reject) => {
        if (signal?.aborted) {
          abortObserved = true;
          reject(new Error('Handler observed cancellation'));
          return;
        }

        signal?.addEventListener(
          'abort',
          () => {
            abortObserved = true;
            reject(new Error('Handler observed cancellation'));
          },
          { once: true }
        );
      });

    const tasks = [
      makeTask('active', { collect: waitsForAbort }),
      makeTask('waiting'),
    ];

    const result = await orchestrateSources(tasks, {
      max_dispatches: 2,
      max_concurrency: 1,
      global_timeout_ms: 30,
    });

    const bySource = new Map(
      result.results.map((item) => [item.source, item])
    );

    expect(abortObserved).toBe(true);
    expect(bySource.get('active')?.dispatch).toBe('CANCELLED');
    expect(bySource.get('active')?.dispatch_reason).toBe('GLOBAL_TIMEOUT');
    expect(bySource.get('waiting')?.dispatch).toBe('NOT_DISPATCHED');
    expect(bySource.get('waiting')?.dispatch_reason).toBe('GLOBAL_TIMEOUT');
  });
});
