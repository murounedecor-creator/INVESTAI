import { describe, it, expect, afterAll } from 'vitest';
import { loadConfig } from '@/src/config/app-config';

describe('AppConfig', () => {
  const origEnv = { ...process.env };

  it('loads valid config', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'development';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:3000';
    const config = loadConfig();
    expect(config.appEnv).toBe('development');
    expect(config.apiBaseUrl).toBe('http://localhost:3000');
  });

  it('throws when APP_ENV is missing', () => {
    delete process.env.EXPO_PUBLIC_APP_ENV;
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:3000';
    expect(() => loadConfig()).toThrow('EXPO_PUBLIC_APP_ENV');
  });

  it('throws when APP_ENV is invalid', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'staging';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:3000';
    expect(() => loadConfig()).toThrow('Invalid');
  });

  it('throws when API_BASE_URL is missing', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'production';
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    expect(() => loadConfig()).toThrow('EXPO_PUBLIC_API_BASE_URL');
  });

  it('throws when API_BASE_URL is not a valid URL', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'production';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'not-a-url';
    expect(() => loadConfig()).toThrow('Invalid');
  });

  afterAll(() => {
    process.env = origEnv;
  });
});
