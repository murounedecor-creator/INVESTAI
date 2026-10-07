import { describe, it, expect } from 'vitest';
import { handlePostRun } from '@/src/api/handlers/post-run';
import { InMemoryRepository } from '../fakes/in-memory-repository';
import { FakeAgent } from '../fakes/fake-agent';
import type { PostRunResponse, ApiErrorResponse } from '@/src/contracts/http';

describe('POST /run handler', () => {
  it('returns 200 with PostRunResponse on success', async () => {
    const repo = new InMemoryRepository();
    const agents = [new FakeAgent('a1')];
    const request = new Request('http://localhost:3000/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: {} }),
    });

    const response = await handlePostRun(request, { repository: repo, agents });
    expect(response.status).toBe(200);
    const body = (await response.json()) as PostRunResponse;
    expect(body.run_id).toBeDefined();
    expect(body.status).toBe('COMPLETED');
    expect(body.agents).toEqual(['a1']);
    expect(body.failures).toEqual([]);
  });

  it('returns 400 VALIDATION_ERROR on invalid JSON', async () => {
    const repo = new InMemoryRepository();
    const request = new Request('http://localhost:3000/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });

    const response = await handlePostRun(request, { repository: repo, agents: [] });
    expect(response.status).toBe(400);
    const body = (await response.json()) as ApiErrorResponse;
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR on non-object body', async () => {
    const repo = new InMemoryRepository();
    const request = new Request('http://localhost:3000/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify('string'),
    });

    const response = await handlePostRun(request, { repository: repo, agents: [] });
    expect(response.status).toBe(400);
  });

  it('persists results to repository', async () => {
    const repo = new InMemoryRepository();
    const agents = [new FakeAgent('a1'), new FakeAgent('a2')];
    const request = new Request('http://localhost:3000/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: {} }),
    });

    const response = await handlePostRun(request, { repository: repo, agents });
    const body = (await response.json()) as PostRunResponse;
    const run = await repo.getRun(body.run_id);
    expect(run).not.toBeNull();
    expect(run!.status).toBe('COMPLETED');
    const results = await repo.getAgentResults(body.run_id);
    expect(results).toHaveLength(2);
  });
});
