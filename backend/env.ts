/**
 * Backend environment configuration.
 *
 * These variables are server-side ONLY.
 * They MUST NEVER use the EXPO_PUBLIC_ prefix.
 * They MUST NEVER be imported by the Expo/React Native bundle.
 */

export interface BackendEnv {
  supabaseUrl: string;
  serviceRoleKey: string;
  port: number;
}

export function loadBackendEnv(): BackendEnv {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const portStr = process.env.PORT ?? '3000';

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL — this must be set in the server environment');
  }
  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY — this must be set in the server environment'
    );
  }

  const port = parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: '${portStr}'`);
  }

  return { supabaseUrl, serviceRoleKey, port };
}
