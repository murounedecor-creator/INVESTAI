import { describe, it, expect } from 'vitest';
import { sha256Hex, sha256HexOfString, stringToBytes } from '@/src/core/hash';

describe('sha256Hex', () => {
  it('produces a 64-char hex string for non-empty input', async () => {
    const hash = await sha256Hex(stringToBytes('hello'));
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic — same input produces same hash', async () => {
    const h1 = await sha256HexOfString('test');
    const h2 = await sha256HexOfString('test');
    expect(h1).toBe(h2);
  });

  it('different inputs produce different hashes', async () => {
    const h1 = await sha256HexOfString('a');
    const h2 = await sha256HexOfString('b');
    expect(h1).not.toBe(h2);
  });

  it('produces correct SHA-256 for known input', async () => {
    // SHA-256 of empty string
    const hash = await sha256HexOfString('');
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});
