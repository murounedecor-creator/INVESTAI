import { describe, it, expect } from 'vitest';
import { routeRequest } from '@/src/api/router';
import { InMemoryRepository } from '../fakes/in-memory-repository';
import { FakeAgent } from '../fakes/fake-agent';
import type { PostRunResponse, GetRunResponse, GetRunAgentsResponse, ApiErrorResponse } from '@/src/contracts/http';

describe('Router', () => {
  const deps = { repository: new InMemoryRepository(), agents: [new FakeAgent('a1')] };

  it('routes POST /run to post-run handler', async () => {
    const request = new Request('http://localhost:3000/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: {} }),
    });
    const response = await routeRequest('POST', '/run', request, deps);
    expect(response.status).toBe(200);
    const body = (await response.json()) as PostRunResponse;
    expect(body.run_id).toBeDefined();
  });

  it('routes GET /runs/{id} to get-run handler', async () => {
    const postReq = new Request('http://localhost:3000/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const postResp = await routeRequest('POST', '/run', postReq, deps);
    const { run_id } = (await postResp.json()) as PostRunResponse;

    const response = await routeRequest('GET', `/runs/${run_id}`, new Request('http://localhost:3000'), deps);
    expect(response.status).toBe(200);
    const body = (await response.json()) as GetRunResponse;
    expect(body.run_id).toBe(run_id);
  });

  it('routes GET /runs/{id}/agents to get-run-agents handler', async () => {
    const postReq = new Request('http://localhost:3000/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const postResp = await routeRequest('POST', '/run', postReq, deps);
    const { run_id } = (await postResp.json()) as PostRunResponse;

    const response = await routeRequest('GET', `/runs/${run_id}/agents`, new Request('http://localhost:3000'), deps);
    expect(response.status).toBe(200);
    const body = (await response.json()) as GetRunAgentsResponse;
    expect(body.agents).toBeDefined();
  });

  it('routes GET /runs/{id}/agents/{agent_id} to get-run-agent handler', async () => {
    const postReq = new Request('http://localhost:3000/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const postResp = await routeRequest('POST', '/run', postReq, deps);
    const { run_id } = (await postResp.json()) as PostRunResponse;

    const response = await routeRequest('GET', `/runs/${run_id}/agents/a1`, new Request('http://localhost:3000'), deps);
    expect(response.status).toBe(200);
  });

  it('returns 400 for unknown route', async () => {
    const response = await routeRequest('GET', '/unknown', new Request('http://localhost:3000'), deps);
    expect(response.status).toBe(400);
  });

  it('returns 404 RUN_NOT_FOUND for missing run via router', async () => {
    const response = await routeRequest('GET', '/runs/nonexistent', new Request('http://localhost:3000'), deps);
    expect(response.status).toBe(404);
    const body = (await response.json()) as ApiErrorResponse;
    expect(body.error).toBe('RUN_NOT_FOUND');
  });
});
