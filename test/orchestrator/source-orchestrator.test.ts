import { describe, it, expect } from 'vitest';
import { orchestrateSources, type SourceTask } from '@/src/orchestrator/source-orchestrator';
import type { SourceStepHandlers } from '@/src/core/source-pipeline';

function successHandlers(): SourceStepHandlers {
  return {
    collect: async () => ({ ok: true, raw_bytes: new TextEncoder().encode('x'), error_message: null }),
    parse: () => ({ ok: true, parsed: {}, error_message: null }),
    normalize: () => ({ normalization: 'OK' as const, normalized: {}, error_message: null }),
  };
}

function makeTask(source: string, handlers?: Partial<SourceStepHandlers>): SourceTask {
  return { source, handlers: { ...successHandlers(), ...handlers } };
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
    expect(result.results.every((r) => r.dispatch === 'DISPATCHED')).toBe(true);
  });

  it('marks excess sources as NOT_DISPATCHED', async () => {
    const tasks = [makeTask('a'), makeTask('b'), makeTask('c')];
    const result = await orchestrateSources(tasks, {
      max_dispatches: 1,
      max_concurrency: 1,
      global_timeout_ms: 5000,
    });
    const notDispatched = result.results.filter((r) => r.dispatch === 'NOT_DISPATCHED');
    expect(notDispatched).toHaveLength(2);
    expect(notDispatched.every((r) => r.dispatch_reason === 'MAX_DISPATCHES_REACHED')).toBe(true);
  });

  it('never produces TO_SPECIFY as dispatch_reason', async () => {
    const tasks = [makeTask('a'), makeTask('b')];
    const result = await orchestrateSources(tasks, {
      max_dispatches: 1,
      max_concurrency: 1,
      global_timeout_ms: 5000,
    });
    expect(result.results.every((r) => r.dispatch_reason !== 'TO_SPECIFY')).toBe(true);
  });
});
