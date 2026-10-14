import { describe, it, expect } from 'vitest';
import { handlePostRun } from '@/src/api/handlers/post-run';
import { InMemoryRepository } from '../fakes/in-memory-repository';
import { FakeAgent } from '../fakes/fake-agent';
import type { ApiErrorResponse } from '@/src/contracts/http';

function post(body: string): Request {
  return new Request('http://localhost:3000/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

async function expect400(body: string): Promise<void> {
  const repo = new InMemoryRepository();
  const res = await handlePostRun(post(body), {
    repository: repo,
    agents: [new FakeAgent('a1')],
  });
  expect(res.status).toBe(400);
  const json = (await res.json()) as ApiErrorResponse;
  expect(json.error).toBe('VALIDATION_ERROR');
}

describe('POST /run input validation (COR-04)', () => {
  it('rejects a JSON array body', async () => {
    await expect400('[]');
  });

  it('rejects params as string', async () => {
    await expect400(JSON.stringify({ params: 'abc' }));
  });

  it('rejects params as array', async () => {
    await expect400(JSON.stringify({ params: [] }));
  });

  it('rejects params as null', async () => {
    await expect400(JSON.stringify({ params: null }));
  });

  it('accepts a valid params object and an empty object body', async () => {
    const repo = new InMemoryRepository();
    const deps = { repository: repo, agents: [new FakeAgent('a1')] };
    const r1 = await handlePostRun(post(JSON.stringify({ params: { a: 1 } })), deps);
    expect(r1.status).toBe(200);
    const r2 = await handlePostRun(post('{}'), deps);
    expect(r2.status).toBe(200);
  });

  it('persists nothing when validation fails', async () => {
    const repo = new InMemoryRepository();
    const res = await handlePostRun(post(JSON.stringify({ params: 'x' })), {
      repository: repo,
      agents: [new FakeAgent('a1')],
    });
    expect(res.status).toBe(400);
    expect(await repo.getAgentResults('anything')).toHaveLength(0);
  });
});
