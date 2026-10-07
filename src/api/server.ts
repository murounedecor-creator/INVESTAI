import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { ApiDependencies } from './router';
import { routeRequest } from './router';
import { errorResponse } from './errors';

/**
 * Creates and starts an HTTP server that routes to the API handlers.
 *
 * This is the EXECUTABLE backend server (Node.js runtime).
 * It is NOT imported by the Expo/React Native bundle.
 */
export function startServer(
  deps: ApiDependencies,
  port: number
): ReturnType<typeof createServer> {
  const server = createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      try {
        const url = new URL(req.url ?? '/', `http://localhost:${port}`);
        const method = req.method ?? 'GET';
        const pathname = url.pathname;

        // Handle CORS preflight
        if (method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          });
          res.end();
          return;
        }

        // Buffer the request body for POST requests
        let bodyBytes: Uint8Array | undefined;
        if (method === 'POST') {
          const chunks: Buffer[] = [];
          await new Promise<void>((resolve, reject) => {
            req.on('data', (chunk: Buffer) => chunks.push(chunk));
            req.on('end', () => resolve());
            req.on('error', reject);
          });
          bodyBytes = new Uint8Array(Buffer.concat(chunks));
        }

        // Build a Web API Request for the handlers
        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) {
          if (value) {
            headers.set(key, Array.isArray(value) ? value.join(', ') : value);
          }
        }

        const request = new Request(`http://localhost:${port}${req.url}`, {
          method,
          headers,
          body: bodyBytes,
        });

        const response = await routeRequest(method, pathname, request, deps);

        const responseHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        res.writeHead(response.status, responseHeaders);

        const responseBody = await response.text();
        res.end(responseBody);
      } catch {
        const fallback = errorResponse('INTERNAL_ERROR', 'Unexpected server error');
        res.writeHead(fallback.status, { 'Content-Type': 'application/json' });
        res.end(await fallback.text());
      }
    }
  );

  server.listen(port);
  return server;
}
