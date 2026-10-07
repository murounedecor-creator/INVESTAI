/**
 * Mobile application configuration.
 *
 * Reads ONLY EXPO_PUBLIC_* variables (safe for client-side).
 * NEVER reads private credentials or service keys.
 *
 * This module is part of the Mobile (Expo/React Native) bundle.
 */

export type AppEnv = 'development' | 'production';

export interface AppConfig {
  appEnv: AppEnv;
  apiBaseUrl: string;
}

const VALID_ENVS: AppEnv[] = ['development', 'production'];

/**
 * Loads and validates mobile configuration from environment variables.
 *
 * Throws if:
 * - APP_ENV is missing or invalid
 * - API_BASE_URL is missing or not a valid URL
 *
 * NEVER uses localhost as an automatic fallback.
 * NEVER infers values silently.
 */
export function loadConfig(): AppConfig {
  const appEnvStr = process.env.EXPO_PUBLIC_APP_ENV;
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (!appEnvStr) {
    throw new Error(
      'EXPO_PUBLIC_APP_ENV is required. Set it to "development" or "production".'
    );
  }

  if (!VALID_ENVS.includes(appEnvStr as AppEnv)) {
    throw new Error(
      `Invalid EXPO_PUBLIC_APP_ENV: '${appEnvStr}'. Must be one of: ${VALID_ENVS.join(', ')}`
    );
  }

  if (!apiBaseUrl) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL is required. Set it to the backend API URL.'
    );
  }

  // Validate URL format
  try {
    new URL(apiBaseUrl);
  } catch {
    throw new Error(
      `Invalid EXPO_PUBLIC_API_BASE_URL: '${apiBaseUrl}'. Must be a valid URL.`
    );
  }

  return {
    appEnv: appEnvStr as AppEnv,
    apiBaseUrl,
  };
}

/**
 * Cached config instance.
 * Loaded once on first access.
 */
let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}
