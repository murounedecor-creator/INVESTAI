import { describe, it, expect, afterAll } from 'vitest';
import { startServer } from '@/src/api/server';
import { routeRequest } from '@/src/api/router';
import type { ApiDependencies } from '@/src/api/router';
import { InMemoryRepository } from '../fakes/in-memory-repository';
import { FakeAgent } from '../fakes/fake-agent';
import type { Server } from 'node:http';
import type { PostRunResponse, GetRunResponse, ApiErrorResponse } from '@/src/contracts/http';

/**
 * HTTP Boundary Integration Test — validates the full chain:
 * server → router → handler → response
 *
 * Uses InMemoryRepository (no Supabase, no credentials).
 * Starts a real HTTP server on an ephemeral port.
 */
describe('HTTP Boundary Integration', () => {
  let server: Server | null = null;
  let port: number;
  let deps: ApiDependencies;

  function startTestServer(): { server: Server; port: number; deps: ApiDependencies } {
    const testDeps: ApiDependencies = {
      repository: new InMemoryRepository(),
      agents: [new FakeAgent('a1')],
    };
    const s = startServer(testDeps, 0);
    const addr = s.address();
    if (!addr || typeof addr === 'string') throw new Error('Failed to get server address');
    return { server: s, port: addr.port, deps: testDeps };
  }

  afterAll(() => {
    if (server) server.close();
  });

  it('server routes GET /runs/{nonexistent} → 404 RUN_NOT_FOUND', async () => {
    const started = startTestServer();
    server = started.server;
    port = started.port;
    deps = started.deps;

    const response = await fetch(`http://localhost:${port}/runs/nonexistent`);
    expect(response.status).toBe(404);
    const body = (await response.json()) as ApiErrorResponse;
    expect(body.error).toBe('RUN_NOT_FOUND');
  });

  it('server routes POST /run → 200 with PostRunResponse', async () => {
    const response = await fetch(`http://localhost:${port}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: {} }),
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as PostRunResponse;
    expect(body.run_id).toBeDefined();
    expect(body.status).toBe('COMPLETED');
    expect(body.agents).toEqual(['a1']);
  });

  it('server routes GET /runs/{id} → 200 after POST', async () => {
    const postResp = await fetch(`http://localhost:${port}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const { run_id } = (await postResp.json()) as PostRunResponse;

    const getResp = await fetch(`http://localhost:${port}/runs/${run_id}`);
    expect(getResp.status).toBe(200);
    const body = (await getResp.json()) as GetRunResponse;
    expect(body.run_id).toBe(run_id);
  });

  it('router directly: unknown route → 400', async () => {
    const response = await routeRequest('GET', '/nope', new Request('http://localhost'), deps);
    expect(response.status).toBe(400);
  });
});
