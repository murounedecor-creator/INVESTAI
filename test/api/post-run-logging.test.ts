import { describe, it, expect, vi } from 'vitest';
import { handlePostRun } from '@/src/api/handlers/post-run';
import { InMemoryRepository } from '../fakes/in-memory-repository';
import { FakeAgent } from '../fakes/fake-agent';
import type { RunRow } from '@/src/db/types';

class FailingRepo extends InMemoryRepository {
  async insertRun(_row: RunRow): Promise<void> {
    throw new Error('relation "runs" secret-detail');
  }
}

describe('POST /run server-side logging (pendency 8)', () => {
  it('logs persistence failure but keeps the response generic', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await handlePostRun(
      new Request('http://x/run', { method: 'POST', body: '{}' }),
      { repository: new FailingRepo(), agents: [new FakeAgent('a1')] }
    );
    const text = await res.text();
    expect(res.status).toBe(500);
    expect(text).toContain('Internal error');
    expect(text).not.toContain('secret-detail');
    expect(spy).toHaveBeenCalledTimes(1);
    const line = JSON.parse(String(spy.mock.calls[0][0]));
    expect(line.context).toBe('post-run.persist');
    expect(line.message).toContain('secret-detail');
    spy.mockRestore();
  });
});
