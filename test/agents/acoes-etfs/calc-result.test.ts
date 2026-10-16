import { describe, it, expect } from 'vitest';
import {
  calcOk,
  calcFail,
  type CalcTrace,
  type CalcFailReason,
} from '@/src/agents/acoes-etfs/calc-result';

const trace: CalcTrace = {
  inputs: { revenue: 100, cost: 60 },
  formula: 'margin = (revenue - cost) / revenue',
  reference_date: '2025-12-31',
};

describe('calcOk', () => {
  it('preserves value and trace', () => {
    expect(calcOk(0.4, trace)).toEqual({
      ok: true,
      value: 0.4,
      trace,
    });
  });

  it('accepts an explicit zero value', () => {
    const r = calcOk(0, trace);
    expect(r.ok).toBe(true);
  });

  it('throws when value is undefined', () => {
    expect(() => calcOk<number | undefined>(undefined, trace)).toThrow(
      'INVARIANT_VIOLATION'
    );
  });
});

describe('calcFail', () => {
  it('throws when MISSING_INPUT has no missing fields', () => {
    expect(() => calcFail('MISSING_INPUT', [])).toThrow(
      'INVARIANT_VIOLATION'
    );
  });

  it('returns the failure for every valid reason', () => {
    const reasons: CalcFailReason[] = [
      'MISSING_INPUT',
      'INVALID_INPUT',
      'NOT_APPLICABLE',
    ];
    for (const reason of reasons) {
      expect(calcFail(reason, ['revenue'])).toEqual({
        ok: false,
        reason,
        missing: ['revenue'],
      });
    }
  });
});
