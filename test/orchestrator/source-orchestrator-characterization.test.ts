import { describe, it, expect, vi } from 'vitest';
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
 * Characterization tests for the orchestrator (COR-C1).
 * They describe current behavior and add no new rule.
 */

const config: OrchestratorConfig = {
  max_dispatches: 10,
  max_concurrency: 2,
  global_timeout_ms: 5000,
};

function successHandlers(): SourceStepHandlers {
  return {
    collect: async () => ({
      ok: true,
      raw_bytes: new TextEncoder().encode('x'),
      error_message: null,
    }),
    parse: () => ({ ok: true, parsed: {}, error_message: null }),
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
  return { source, handlers: { ...successHandlers(), ...handlers } };
}

function failingTask(source: string): SourceTask {
  return makeTask(source, {
    collect: async () => {
      throw new Error('boom-original');
    },
  });
}

function silenceLogs() {
  return vi.spyOn(console, 'error').mockImplementation(() => {});
}

describe('SourceOrchestrator characterization', () => {
  it('keeps the original error as the cause', async () => {
    const spy = silenceLogs();
    try {
      const err = await orchestrateSources(
        [failingTask('bad')],
        config
      ).catch((e: unknown) => e);
      if (!(err instanceof Error)) throw new Error('expected Error');
      expect(err.message).toBe('SOURCE_EXECUTION_FAILED: bad');
      if (!(err.cause instanceof Error)) {
        throw new Error('expected Error cause');
      }
      expect(err.cause.message).toBe('boom-original');
    } finally {
      spy.mockRestore();
    }
  });

  it('logs the original error on the server only', async () => {
    const spy = silenceLogs();
    try {
      const err = await orchestrateSources(
        [failingTask('bad')],
        config
      ).catch((e: unknown) => e);
      if (!(err instanceof Error)) throw new Error('expected Error');
      expect(err.message).not.toContain('boom-original');
      const lines = spy.mock.calls.map((c) => String(c[0]));
      const mine = lines.filter((l) => l.includes('orchestrator.bad'));
      expect(mine).toHaveLength(1);
      const line = mine[0];
      expect(JSON.parse(line)).toMatchObject({
        level: 'error',
        context: 'orchestrator.bad',
        name: 'Error',
        message: 'boom-original',
      });
      expect(line).not.toContain('stack');
    } finally {
      spy.mockRestore();
    }
  });

  it('treats max_concurrency <= 0 as 1', async () => {
    for (const max_concurrency of [0, -3]) {
      const out = await orchestrateSources(
        [makeTask('a'), makeTask('b')],
        { ...config, max_concurrency }
      );
      expect(out.results.map((r) => r.source).sort()).toEqual([
        'a',
        'b',
      ]);
      expect(
        out.results.every((r) => r.dispatch === 'DISPATCHED')
      ).toBe(true);
    }
  });

  it('returns no results for an empty task list', async () => {
    expect(await orchestrateSources([], config)).toEqual({
      results: [],
    });
  });

  it('cancels a handler that ignores the signal on timeout', async () => {
    const stuck = makeTask('stuck', {
      collect: () => new Promise<CollectOutput>(() => {}),
    });
    const out = await orchestrateSources([stuck], {
      ...config,
      max_concurrency: 1,
      global_timeout_ms: 50,
    });
    expect(out.results).toEqual([
      {
        source: 'stuck',
        dispatch: 'CANCELLED',
        dispatch_reason: 'GLOBAL_TIMEOUT',
        collection_ok: false,
        parse_ok: false,
        normalization: 'NOT_RUN',
        raw_hash: null,
      },
    ]);
  });
});
