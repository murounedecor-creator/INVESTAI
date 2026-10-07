import { describe, it, expect } from 'vitest';
import { handleGetRun } from '@/src/api/handlers/get-run';
import { handleGetRunAgents } from '@/src/api/handlers/get-run-agents';
import { handleGetRunAgent } from '@/src/api/handlers/get-run-agent';
import { InMemoryRepository } from '../fakes/in-memory-repository';
import type { AgentResult } from '@/src/contracts/agent';
import type { GetRunResponse, GetRunAgentsResponse, GetRunAgentResponse, ApiErrorResponse } from '@/src/contracts/http';

describe('GET handlers', () => {
  async function setupRun(): Promise<{ repo: InMemoryRepository; runId: string }> {
    const repo = new InMemoryRepository();
    await repo.insertRun({
      run_id: 'r1',
      started_at: '2025-01-01T00:00:00Z',
      finished_at: '2025-01-01T00:00:01Z',
      status: 'COMPLETED',
    });
    const result: AgentResult = {
      agent_id: 'a1',
      context: { run_id: 'r1', started_at: '2025-01-01T00:00:00Z', params: {} },
      collection: { x: 1 },
      analysis: { y: 2 },
    };
    await repo.insertAgentResult(result);
    return { repo, runId: 'r1' };
  }

  it('GET /runs/{id} returns 200 with run data', async () => {
    const { repo, runId } = await setupRun();
    const response = await handleGetRun(runId, { repository: repo });
    expect(response.status).toBe(200);
    const body = (await response.json()) as GetRunResponse;
    expect(body.run_id).toBe('r1');
    expect(body.status).toBe('COMPLETED');
  });

  it('GET /runs/{id} returns 404 RUN_NOT_FOUND for missing run', async () => {
    const repo = new InMemoryRepository();
    const response = await handleGetRun('nonexistent', { repository: repo });
    expect(response.status).toBe(404);
    const body = (await response.json()) as ApiErrorResponse;
    expect(body.error).toBe('RUN_NOT_FOUND');
  });

  it('GET /runs/{id}/agents returns 200 with agent listing', async () => {
    const { repo, runId } = await setupRun();
    const response = await handleGetRunAgents(runId, { repository: repo });
    expect(response.status).toBe(200);
    const body = (await response.json()) as GetRunAgentsResponse;
    expect(body.agents).toHaveLength(1);
    expect(body.agents[0].agent_id).toBe('a1');
    expect(body.agents[0].has_result).toBe(true);
  });

  it('GET /runs/{id}/agents returns 404 for missing run', async () => {
    const repo = new InMemoryRepository();
    const response = await handleGetRunAgents('nope', { repository: repo });
    expect(response.status).toBe(404);
  });

  it('GET /runs/{id}/agents/{agent_id} returns 200 with result', async () => {
    const { repo, runId } = await setupRun();
    const response = await handleGetRunAgent(runId, 'a1', { repository: repo });
    expect(response.status).toBe(200);
    const body = (await response.json()) as GetRunAgentResponse;
    expect(body.result).not.toBeNull();
    expect(body.result!.agent_id).toBe('a1');
  });

  it('GET /runs/{id}/agents/{agent_id} returns 404 AGENT_RESULT_NOT_FOUND', async () => {
    const { repo, runId } = await setupRun();
    const response = await handleGetRunAgent(runId, 'nonexistent_agent', { repository: repo });
    expect(response.status).toBe(404);
    const body = (await response.json()) as ApiErrorResponse;
    expect(body.error).toBe('AGENT_RESULT_NOT_FOUND');
  });

  it('GET /runs/{id}/agents/{agent_id} returns 404 RUN_NOT_FOUND for missing run', async () => {
    const repo = new InMemoryRepository();
    const response = await handleGetRunAgent('nope', 'a1', { repository: repo });
    expect(response.status).toBe(404);
    const body = (await response.json()) as ApiErrorResponse;
    expect(body.error).toBe('RUN_NOT_FOUND');
  });
});
