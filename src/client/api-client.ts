import type {
  PostRunResponse,
  GetRunResponse,
  GetRunAgentsResponse,
  GetRunAgentResponse,
  ApiErrorResponse,
  ApiErrorCode,
} from '@/src/contracts/http';
import { getConfig } from '@/src/config/app-config';

/**
 * ApiClient — centralized HTTP client for the Mobile app.
 *
 * The Mobile app NEVER constructs URLs directly in screens.
 * All HTTP calls go through this client.
 *
 * The Mobile app NEVER accesses PostgreSQL/Supabase directly.
 * All data access goes through the API.
 */

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? getConfig().apiBaseUrl;
  }

  /**
   * POST /run — triggers a new run.
   */
  async postRun(params?: Record<string, unknown>): Promise<PostRunResponse> {
    return this.request<PostRunResponse>('POST', '/run', { params });
  }

  /**
   * GET /runs/{run_id} — gets run details.
   */
  async getRun(runId: string): Promise<GetRunResponse> {
    return this.request<GetRunResponse>('GET', `/runs/${runId}`);
  }

  /**
   * GET /runs/{run_id}/agents — lists agents in a run.
   */
  async getRunAgents(runId: string): Promise<GetRunAgentsResponse> {
    return this.request<GetRunAgentsResponse>('GET', `/runs/${runId}/agents`);
  }

  /**
   * GET /runs/{run_id}/agents/{agent_id} — gets a specific agent's result.
   */
  async getRunAgent(runId: string, agentId: string): Promise<GetRunAgentResponse> {
    return this.request<GetRunAgentResponse>(
      'GET',
      `/runs/${runId}/agents/${agentId}`
    );
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(url, options);
    } catch (err) {
      throw new ApiError(
        'INTERNAL_ERROR',
        0,
        `Network error: ${err instanceof Error ? err.message : 'fetch failed'}`
      );
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorBody = data as ApiErrorResponse | null;
      throw new ApiError(
        errorBody?.error ?? 'INTERNAL_ERROR',
        response.status,
        errorBody?.message ?? `HTTP ${response.status}`
      );
    }

    return data as T;
  }
}

/**
 * Singleton instance.
 */
let cachedClient: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!cachedClient) {
    cachedClient = new ApiClient();
  }
  return cachedClient;
}
