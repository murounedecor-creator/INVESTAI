import { startServer } from '@/src/api/server';
import { bootstrap } from '@/src/api/bootstrap';

/**
 * Backend server entry point.
 *
 * This file is executed with Node.js (via tsx or compiled tsc output).
 * It is NOT part of the Expo/React Native bundle.
 *
 * Usage: npx tsx backend/server-entry.ts
 */
async function main() {
  const { deps, port } = bootstrap();
  const server = startServer(deps, port);

  console.log(`InvestAI backend server listening on port ${port}`);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
