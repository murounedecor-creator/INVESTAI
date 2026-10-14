import { describe, it, expect } from 'vitest';
import { errorResponse, safeErrorMessage } from '@/src/api/errors';
import type { ApiErrorResponse } from '@/src/contracts/http';

describe('safeErrorMessage (COR-05)', () => {
  it('does not leak the Error message', () => {
    const msg = safeErrorMessage(new Error('DB insert run failed: relation "runs" secret'));
    expect(msg).toBe('Internal error');
    expect(msg).not.toContain('runs');
    expect(msg).not.toContain('secret');
  });

  it('returns a generic message for non-Error values', () => {
    expect(safeErrorMessage('boom')).toBe('Internal error');
    expect(safeErrorMessage(undefined)).toBe('Internal error');
  });

  it('INTERNAL_ERROR response body carries no internal detail', async () => {
    const res = errorResponse('INTERNAL_ERROR', safeErrorMessage(new Error('stack at /home/x')));
    expect(res.status).toBe(500);
    const body = (await res.json()) as ApiErrorResponse;
    expect(body).toEqual({ error: 'INTERNAL_ERROR', message: 'Internal error' });
  });
});
