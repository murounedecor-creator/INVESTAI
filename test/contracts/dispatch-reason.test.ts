import { describe, it, expect } from 'vitest';
import { orchestrateSources } from '@/src/orchestrator/source-orchestrator';

const handlers = {
  collect: async () => ({
    ok: true as const,
    raw_bytes: new TextEncoder().encode('x'),
    error_message: null,
  }),
  parse: () => ({ ok: true as const, parsed: {}, error_message: null }),
  normalize: () => ({ normalization: 'OK' as const, normalized: {}, error_message: null }),
};

describe('dispatch_reason contract (ADR-008, spec B.4)', () => {
  it('a DISPATCHED source has dispatch_reason null', async () => {
    const out = await orchestrateSources([{ source: 'a', handlers }], {
      max_dispatches: 10,
      max_concurrency: 1,
      global_timeout_ms: 5000,
    });
    expect(out.results[0].dispatch).toBe('DISPATCHED');
    expect(out.results[0].dispatch_reason).toBeNull();
  });

  it('a source over the dispatch limit is NOT_DISPATCHED with BUDGET_EXHAUSTED', async () => {
    const out = await orchestrateSources(
      [
        { source: 'a', handlers },
        { source: 'b', handlers },
      ],
      { max_dispatches: 1, max_concurrency: 1, global_timeout_ms: 5000 }
    );
    expect(out.results[1].dispatch).toBe('NOT_DISPATCHED');
    expect(out.results[1].dispatch_reason).toBe('BUDGET_EXHAUSTED');
  });
});
