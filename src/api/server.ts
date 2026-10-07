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

        // Build a Web API Request for the handlers
        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) {
          if (value) {
            headers.set(key, Array.isArray(value) ? value.join(', ') : value);
          }
        }

        let body: ReadableStream<Uint8Array> | undefined;
        if (method === 'POST' && req) {
          body = new ReadableStream({
            start(controller) {
              req.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
              req.on('end', () => controller.close());
              req.on('error', (err) => controller.error(err));
            },
          });
        }

        const request = new Request(`http://localhost:${port}${req.url}`, {
          method,
          headers,
          body,
        });

        const response = await routeRequest(method, pathname, request, deps);

        res.writeHead(response.status, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        });

        if (method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        const responseBody = await response.text();
        res.end(responseBody);
      } catch (err) {
        const fallback = errorResponse('INTERNAL_ERROR', 'Unexpected server error');
        res.writeHead(fallback.status, { 'Content-Type': 'application/json' });
        res.end(await fallback.text());
      }
    }
  );

  server.listen(port);
  return server;
}
