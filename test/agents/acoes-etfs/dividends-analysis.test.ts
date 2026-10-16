import { describe, it, expect } from 'vitest';
import {
  dividendsAnalysis,
  type DividendsInput,
} from '@/src/agents/acoes-etfs/dividends-analysis';
import type { CalcResult } from '@/src/agents/acoes-etfs/calc-result';

const base: DividendsInput = {
  reference_date: '2025-12-31',
  fundamentals_date: '2025-09-30',
  price: 100,
  dividends_per_share_12m: 5,
  previous_dividends_per_share_12m: 4,
  eps: 10,
};

function valueOf(r: CalcResult<number>): number {
  if (!r.ok) throw new Error('expected ok result');
  return r.value;
}

function failOf(r: CalcResult<number>) {
  if (r.ok) throw new Error('expected failure');
  return r;
}

function all(o: ReturnType<typeof dividendsAnalysis>) {
  return [o.dividend_yield, o.payout_ratio, o.dividend_growth];
}

describe('dividendsAnalysis', () => {
  it('computes all outputs with trace', () => {
    const out = dividendsAnalysis(base);
    expect(valueOf(out.dividend_yield)).toBeCloseTo(0.05);
    expect(valueOf(out.payout_ratio)).toBeCloseTo(0.5);
    expect(valueOf(out.dividend_growth)).toBeCloseTo(0.25);
    const y = out.dividend_yield;
    if (!y.ok) throw new Error('expected ok');
    expect(y.trace).toEqual({
      inputs: {
        dividends_per_share_12m: 5,
        price: 100,
        fundamentals_date: '2025-09-30',
      },
      formula: 'dividend_yield = dividends_per_share_12m / price',
      reference_date: '2025-12-31',
    });
    const g = out.dividend_growth;
    if (!g.ok) throw new Error('expected ok');
    expect(g.trace.formula).toBe(
      'dividend_growth = dividends_per_share_12m / ' +
        'previous_dividends_per_share_12m - 1'
    );
  });

  it('missing dividends fails all three outputs', () => {
    const out = dividendsAnalysis({
      ...base,
      dividends_per_share_12m: null,
    });
    for (const r of all(out)) {
      expect(failOf(r).reason).toBe('MISSING_INPUT');
      expect(failOf(r).missing).toEqual(['dividends_per_share_12m']);
    }
  });

  it('missing price fails dividend_yield only', () => {
    const out = dividendsAnalysis({ ...base, price: null });
    const f = failOf(out.dividend_yield);
    expect(f.reason).toBe('MISSING_INPUT');
    expect(f.missing).toEqual(['price']);
    expect(out.payout_ratio.ok).toBe(true);
    expect(out.dividend_growth.ok).toBe(true);
  });

  it('missing eps fails payout_ratio only', () => {
    const out = dividendsAnalysis({ ...base, eps: null });
    const f = failOf(out.payout_ratio);
    expect(f.reason).toBe('MISSING_INPUT');
    expect(f.missing).toEqual(['eps']);
    expect(out.dividend_yield.ok).toBe(true);
    expect(out.dividend_growth.ok).toBe(true);
  });

  it('missing previous fails dividend_growth only', () => {
    const out = dividendsAnalysis({
      ...base,
      previous_dividends_per_share_12m: null,
    });
    const f = failOf(out.dividend_growth);
    expect(f.reason).toBe('MISSING_INPUT');
    expect(f.missing).toEqual(['previous_dividends_per_share_12m']);
    expect(out.dividend_yield.ok).toBe(true);
    expect(out.payout_ratio.ok).toBe(true);
  });

  it('an explicit zero dividend is a valid value', () => {
    const out = dividendsAnalysis({
      ...base,
      dividends_per_share_12m: 0,
    });
    expect(valueOf(out.dividend_yield)).toBe(0);
    expect(valueOf(out.payout_ratio)).toBe(0);
    expect(valueOf(out.dividend_growth)).toBe(-1);
  });

  it('a negative dividend is INVALID_INPUT for all three', () => {
    const out = dividendsAnalysis({
      ...base,
      dividends_per_share_12m: -1,
    });
    for (const r of all(out)) {
      expect(failOf(r).reason).toBe('INVALID_INPUT');
      expect(failOf(r).missing).toEqual(['dividends_per_share_12m']);
    }
  });

  it('zero or negative price is INVALID for yield only', () => {
    for (const price of [0, -1]) {
      const out = dividendsAnalysis({ ...base, price });
      const f = failOf(out.dividend_yield);
      expect(f.reason).toBe('INVALID_INPUT');
      expect(f.missing).toEqual(['price']);
      expect(out.payout_ratio.ok).toBe(true);
      expect(out.dividend_growth.ok).toBe(true);
    }
  });

  it('nonpositive eps is NOT_APPLICABLE for payout', () => {
    for (const eps of [0, -2]) {
      const out = dividendsAnalysis({ ...base, eps });
      const f = failOf(out.payout_ratio);
      expect(f.reason).toBe('NOT_APPLICABLE');
      expect(f.missing).toEqual(['eps']);
      expect(out.dividend_yield.ok).toBe(true);
    }
  });

  it('a payout above 1 is valid', () => {
    const out = dividendsAnalysis({
      ...base,
      dividends_per_share_12m: 15,
    });
    expect(valueOf(out.payout_ratio)).toBeCloseTo(1.5);
  });

  it('zero previous dividend is NOT_APPLICABLE for growth', () => {
    const out = dividendsAnalysis({
      ...base,
      previous_dividends_per_share_12m: 0,
    });
    const f = failOf(out.dividend_growth);
    expect(f.reason).toBe('NOT_APPLICABLE');
    expect(f.missing).toEqual(['previous_dividends_per_share_12m']);
    expect(out.dividend_yield.ok).toBe(true);
    expect(out.payout_ratio.ok).toBe(true);
  });

  it('a negative previous dividend is INVALID_INPUT', () => {
    const out = dividendsAnalysis({
      ...base,
      previous_dividends_per_share_12m: -1,
    });
    const f = failOf(out.dividend_growth);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual(['previous_dividends_per_share_12m']);
  });

  it('a dividend cut gives a negative growth', () => {
    const out = dividendsAnalysis({
      ...base,
      dividends_per_share_12m: 2,
    });
    expect(valueOf(out.dividend_growth)).toBeCloseTo(-0.5);
  });

  it('fundamentals_date after reference_date fails all', () => {
    const out = dividendsAnalysis({
      ...base,
      fundamentals_date: '2026-01-01',
    });
    for (const r of all(out)) {
      expect(failOf(r).reason).toBe('INVALID_INPUT');
      expect(failOf(r).missing).toEqual(['fundamentals_date']);
    }
  });

  it('the same date in both fields is valid', () => {
    const out = dividendsAnalysis({
      ...base,
      fundamentals_date: '2025-12-31',
    });
    for (const r of all(out)) {
      expect(r.ok).toBe(true);
    }
  });

  it('an unreadable reference_date fails all', () => {
    const out = dividendsAnalysis({
      ...base,
      reference_date: 'not-a-date',
    });
    for (const r of all(out)) {
      expect(failOf(r).reason).toBe('INVALID_INPUT');
      expect(failOf(r).missing).toEqual(['reference_date']);
    }
  });

  it('an unreadable fundamentals_date fails all', () => {
    const out = dividendsAnalysis({
      ...base,
      fundamentals_date: 'not-a-date',
    });
    for (const r of all(out)) {
      expect(failOf(r).reason).toBe('INVALID_INPUT');
      expect(failOf(r).missing).toEqual(['fundamentals_date']);
    }
  });

  it('NaN and Infinity are INVALID_INPUT', () => {
    const a = dividendsAnalysis({ ...base, price: NaN });
    expect(failOf(a.dividend_yield).reason).toBe('INVALID_INPUT');
    expect(failOf(a.dividend_yield).missing).toEqual(['price']);
    const b = dividendsAnalysis({ ...base, eps: Infinity });
    expect(failOf(b.payout_ratio).reason).toBe('INVALID_INPUT');
    expect(failOf(b.payout_ratio).missing).toEqual(['eps']);
  });

  it('reports MISSING_INPUT before INVALID_INPUT', () => {
    const out = dividendsAnalysis({
      ...base,
      price: -1,
      dividends_per_share_12m: null,
    });
    const f = failOf(out.dividend_yield);
    expect(f.reason).toBe('MISSING_INPUT');
    expect(f.missing).toEqual(['dividends_per_share_12m']);
  });

  it('reports INVALID_INPUT before NOT_APPLICABLE', () => {
    const out = dividendsAnalysis({
      ...base,
      dividends_per_share_12m: -1,
      eps: -5,
    });
    const f = failOf(out.payout_ratio);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual(['dividends_per_share_12m']);
  });

  it('a result that overflows is INVALID_INPUT', () => {
    const out = dividendsAnalysis({
      ...base,
      dividends_per_share_12m: 1e300,
      price: 1e-320,
    });
    const f = failOf(out.dividend_yield);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual([
      'dividends_per_share_12m',
      'price',
    ]);
  });
});
