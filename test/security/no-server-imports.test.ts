import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Verifies that Mobile-side files do NOT import server-side code.
 *
 * Mobile files: app/**, src/config/**, src/client/**
 * Server-side modules: src/api/**, src/db/**, src/scheduler/**,
 *   src/orchestrator/**, src/agents/**, src/core/**, backend/**
 *
 * Only src/contracts/** is shared (pure types, no runtime).
 */

const MOBILE_DIRS = ['app', 'src/config', 'src/client'];
const FORBIDDEN_PATTERNS = [
  /from\s+['"]@\/src\/api/,
  /from\s+['"]@\/src\/db/,
  /from\s+['"]@\/src\/scheduler/,
  /from\s+['"]@\/src\/orchestrator/,
  /from\s+['"]@\/src\/agents/,
  /from\s+['"]@\/src\/core/,
  /from\s+['"]@\/backend/,
  /require\(['"]@\/src\/api/,
  /require\(['"]@\/src\/db/,
  /require\(['"]@\/src\/scheduler/,
  /require\(['"]@\/src\/orchestrator/,
  /require\(['"]@\/src\/agents/,
  /require\(['"]@\/src\/core/,
  /require\(['"]@\/backend/,
  /SUPABASE_SERVICE_ROLE_KEY/,
];

function listTsFiles(dir: string): string[] {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...listTsFiles(fullPath));
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
    return files;
  } catch {
    return [];
  }
}

describe('Mobile/Backend separation', () => {
  it('no Mobile file imports server-side modules', () => {
    const mobileFiles: string[] = [];
    for (const dir of MOBILE_DIRS) {
      mobileFiles.push(...listTsFiles(dir));
    }

    const violations: string[] = [];
    for (const file of mobileFiles) {
      const content = readFileSync(file, 'utf-8');
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(`${file}: matches ${pattern}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('no EXPO_PUBLIC var contains service role key reference', () => {
    const mobileFiles: string[] = [];
    for (const dir of MOBILE_DIRS) {
      mobileFiles.push(...listTsFiles(dir));
    }

    for (const file of mobileFiles) {
      const content = readFileSync(file, 'utf-8');
      expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    }
  });
});
