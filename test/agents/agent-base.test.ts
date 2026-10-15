import { describe, it, expect } from 'vitest';
import { AgentBase, type SourceCollection } from '@/src/agents/agent-base';
import type { AgentResult, AgentFailure, RunContext } from '@/src/contracts/agent';
import type { SourceGroup } from '@/src/contracts/source';
import type { SourceTask } from '@/src/orchestrator/source-orchestrator';
import type { CollectOutput } from '@/src/core/source-pipeline';

const ctx: RunContext = { run_id: 'r1', started_at: '2025-01-01T00:00:00Z', params: {} };
const cfg = { max_dispatches: 10, max_concurrency: 2, global_timeout_ms: 5000 };

const okCollect = async (): Promise<CollectOutput> => ({
  ok: true,
  raw_bytes: new TextEncoder().encode('x'),
  error_message: null,
});
const badCollect = async (): Promise<CollectOutput> => ({
  ok: false,
  raw_bytes: null,
  error_message: 'net',
});

function task(source: string, collect: () => Promise<CollectOutput>): SourceTask {
  return {
    source,
    handlers: {
      collect,
      parse: () => ({ ok: true, parsed: {}, error_message: null }),
      normalize: () => ({ normalization: 'OK' as const, normalized: {}, error_message: null }),
    },
  };
}

class TestAgent extends AgentBase {
  readonly agentId = 'test';
  async execute(): Promise<AgentResult | AgentFailure> {
    throw new Error('secret internal detail at /home/x');
  }
  collect(tasks: SourceTask[], groups: SourceGroup[]): Promise<SourceCollection> {
    return this.collectSources(tasks, groups, cfg);
  }
}

const group: SourceGroup = { group_id: 'g', sources: ['a', 'b'], minimum_successful_sources: 1 };

describe('AgentBase (ADR-003)', () => {
  it('preserves failed sources in the collection', async () => {
    const out = await new TestAgent().collect([task('a', okCollect), task('b', badCollect)], [group]);
    const b = out.sources.find((s) => s.source === 'b');
    expect(out.sources).toHaveLength(2);
    expect(b?.collection_ok).toBe(false);
    expect(b?.raw_hash).toBeNull();
  });

  it('requirement satisfied with one effective source (min=1)', async () => {
    const out = await new TestAgent().collect([task('a', okCollect), task('b', badCollect)], [group]);
    expect(out.requirement_satisfied).toBe(true);
    expect(out.coverage[0].effective_count).toBe(1);
  });

  it('requirement not satisfied when every source fails', async () => {
    const out = await new TestAgent().collect([task('a', badCollect), task('b', badCollect)], [group]);
    expect(out.requirement_satisfied).toBe(false);
  });

  it('run() turns exceptions into a sanitized AgentFailure', async () => {
    const res = await new TestAgent().run(ctx);
    expect('error_type' in res).toBe(true);
    if ('message' in res) {
      expect(res.error_type).toBe('AGENT_EXCEPTION');
      expect(res.message).toBe('Agent execution failed');
      expect(res.message).not.toContain('secret');
    }
  });
});
