import type { RunRepository } from '@/src/db/repository';
import type { Agent } from '@/src/contracts/agent';
import { handlePostRun } from './handlers/post-run';
import { handleGetRun } from './handlers/get-run';
import { handleGetRunAgents } from './handlers/get-run-agents';
import { handleGetRunAgent } from './handlers/get-run-agent';
import { errorResponse } from './errors';

export interface ApiDependencies {
  repository: RunRepository;
  agents: Agent[];
}

/**
 * Routes an incoming HTTP request to the appropriate handler.
 *
 * Routes:
 *   POST   /run                          → handlePostRun
 *   GET    /runs/{run_id}                → handleGetRun
 *   GET    /runs/{run_id}/agents         → handleGetRunAgents
 *   GET    /runs/{run_id}/agents/{agent_id} → handleGetRunAgent
 *
 * Returns 404 for unknown routes, 405 for wrong method.
 */
export async function routeRequest(
  method: string,
  pathname: string,
  request: Request,
  deps: ApiDependencies
): Promise<Response> {
  // POST /run
  if (method === 'POST' && pathname === '/run') {
    return handlePostRun(request, deps);
  }

  // GET /runs/{run_id}
  const runMatch = pathname.match(/^\/runs\/([^/]+)$/);
  if (method === 'GET' && runMatch) {
    return handleGetRun(runMatch[1], deps);
  }

  // GET /runs/{run_id}/agents
  const agentsMatch = pathname.match(/^\/runs\/([^/]+)\/agents$/);
  if (method === 'GET' && agentsMatch) {
    return handleGetRunAgents(agentsMatch[1], deps);
  }

  // GET /runs/{run_id}/agents/{agent_id}
  const agentMatch = pathname.match(/^\/runs\/([^/]+)\/agents\/([^/]+)$/);
  if (method === 'GET' && agentMatch) {
    return handleGetRunAgent(agentMatch[1], agentMatch[2], deps);
  }

  // Wrong method on known paths
  if (pathname === '/run' && method !== 'POST') {
    return errorResponse('VALIDATION_ERROR', `Method ${method} not allowed for /run`);
  }
  if (runMatch && method !== 'GET') {
    return errorResponse('VALIDATION_ERROR', `Method ${method} not allowed`);
  }

  // Unknown route
  return errorResponse('VALIDATION_ERROR', `No route for ${method} ${pathname}`);
}
