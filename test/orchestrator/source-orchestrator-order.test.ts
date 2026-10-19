import { describe, it, expect } from 'vitest';
import {
  orchestrateSources,
  type OrchestratorConfig,
  type SourceTask,
} from '@/src/orchestrator/source-orchestrator';
import type {
  SourceStepHandlers,
  CollectOutput,
} from '@/src/core/source-pipeline';

/**
 * Order tests for the orchestrator (COR-C2).
 * results must follow the input order of the tasks, no matter
 * which source finishes first (Constitution 31).
 */

const config: OrchestratorConfig = {
  max_dispatches: 10,
  max_concurrency: 3,
  global_timeout_ms: 5000,
};

function delayedHandlers(ms: number): SourceStepHandlers {
  return {
    collect: async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, ms));
      return {
        ok: true,
        raw_bytes: new TextEncoder().encode('x'),
        error_message: null,
      };
    },
    parse: () => ({ ok: true, parsed: {}, error_message: null }),
    normalize: () => ({
      normalization: 'OK' as const,
      normalized: {},
      error_message: null,
    }),
  };
}

function task(source: string, ms: number): SourceTask {
  return { source, handlers: delayedHandlers(ms) };
}

function stuckTask(source: string): SourceTask {
  return {
    source,
    handlers: {
      ...delayedHandlers(0),
      collect: () => new Promise<CollectOutput>(() => {}),
    },
  };
}

describe('SourceOrchestrator result order', () => {
  it('follows input order when completion order differs', async () => {
    const out = await orchestrateSources(
      [task('slow', 60), task('fast', 0), task('mid', 20)],
      config
    );
    expect(out.results.map((r) => r.source)).toEqual([
      'slow',
      'fast',
      'mid',
    ]);
    expect(
      out.results.every((r) => r.dispatch === 'DISPATCHED')
    ).toBe(true);
  });

  it('keeps input order with NOT_DISPATCHED at the end', async () => {
    const out = await orchestrateSources(
      [task('a', 40), task('b', 0), task('c', 0), task('d', 0)],
      { ...config, max_dispatches: 2 }
    );
    expect(out.results.map((r) => [r.source, r.dispatch])).toEqual([
      ['a', 'DISPATCHED'],
      ['b', 'DISPATCHED'],
      ['c', 'NOT_DISPATCHED'],
      ['d', 'NOT_DISPATCHED'],
    ]);
  });

  it('puts a cancelled task and unstarted ones in input order', async () => {
    const out = await orchestrateSources(
      [stuckTask('first'), task('second', 0), task('third', 0)],
      { ...config, max_concurrency: 1, global_timeout_ms: 50 }
    );
    expect(
      out.results.map((r) => [r.source, r.dispatch, r.dispatch_reason])
    ).toEqual([
      ['first', 'CANCELLED', 'GLOBAL_TIMEOUT'],
      ['second', 'NOT_DISPATCHED', 'GLOBAL_TIMEOUT'],
      ['third', 'NOT_DISPATCHED', 'GLOBAL_TIMEOUT'],
    ]);
  });

  it('mixes finished and cancelled tasks in input order', async () => {
    const out = await orchestrateSources(
      [stuckTask('a'), task('b', 0), stuckTask('c')],
      { ...config, max_concurrency: 2, global_timeout_ms: 80 }
    );
    expect(out.results.map((r) => [r.source, r.dispatch])).toEqual([
      ['a', 'CANCELLED'],
      ['b', 'DISPATCHED'],
      ['c', 'CANCELLED'],
    ]);
  });
});
