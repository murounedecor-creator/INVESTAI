import { describe, it, expect } from 'vitest';
import { logServerError } from '@/src/core/log';

describe('logServerError (pendency 8)', () => {
  it('writes one JSON line with context, name and message', () => {
    const lines: string[] = [];
    logServerError('post-run.persist', new TypeError('db down'), (l) => lines.push(l));
    expect(lines).toHaveLength(1);
    const o = JSON.parse(lines[0]);
    expect(o.level).toBe('error');
    expect(o.context).toBe('post-run.persist');
    expect(o.name).toBe('TypeError');
    expect(o.message).toBe('db down');
    expect(typeof o.at).toBe('string');
  });

  it('never includes a stack trace', () => {
    const lines: string[] = [];
    logServerError('x', new Error('boom'), (l) => lines.push(l));
    expect(lines[0]).not.toContain('stack');
    expect(lines[0]).not.toContain(' at ');
  });

  it('handles non-Error values', () => {
    const lines: string[] = [];
    logServerError('x', 'plain', (l) => lines.push(l));
    const o = JSON.parse(lines[0]);
    expect(o.name).toBe('NonError');
    expect(o.message).toBe('plain');
  });
});
