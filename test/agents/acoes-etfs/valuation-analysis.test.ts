import { describe, it, expect } from 'vitest';
import {
  valuationAnalysis,
  type ValuationInput,
} from '@/src/agents/acoes-etfs/valuation-analysis';
import type { CalcResult } from '@/src/agents/acoes-etfs/calc-result';

const base: ValuationInput = {
  reference_date: '2025-12-31',
  fundamentals_date: '2025-09-30',
  price: 100,
  eps: 5,
  book_value_per_share: 50,
  enterprise_value: 1000,
  ebitda: 200,
};

function valueOf(r: CalcResult<number>): number {
  if (!r.ok) throw new Error('expected ok result');
  return r.value;
}

function failOf(r: CalcResult<number>) {
  if (r.ok) throw new Error('expected failure');
  return r;
}

function all(o: ReturnType<typeof valuationAnalysis>) {
  return [
    o.pe_ratio,
    o.pb_ratio,
    o.ev_to_ebitda,
    o.earnings_yield,
  ];
}

describe('valuationAnalysis', () => {
  it('computes all outputs with trace', () => {
    const out = valuationAnalysis(base);
    expect(valueOf(out.pe_ratio)).toBe(20);
    expect(valueOf(out.pb_ratio)).toBe(2);
    expect(valueOf(out.ev_to_ebitda)).toBe(5);
    expect(valueOf(out.earnings_yield)).toBeCloseTo(0.05);
    const p = out.pe_ratio;
    if (!p.ok) throw new Error('expected ok');
    expect(p.trace).toEqual({
      inputs: {
        price: 100,
        eps: 5,
        fundamentals_date: '2025-09-30',
      },
      formula: 'pe_ratio = price / eps',
      reference_date: '2025-12-31',
    });
  });

  it('missing eps fails pe_ratio and earnings_yield only', () => {
    const out = valuationAnalysis({ ...base, eps: null });
    for (const r of [out.pe_ratio, out.earnings_yield]) {
      expect(failOf(r).reason).toBe('MISSING_INPUT');
      expect(failOf(r).missing).toEqual(['eps']);
    }
    expect(out.pb_ratio.ok).toBe(true);
    expect(out.ev_to_ebitda.ok).toBe(true);
  });

  it('missing price fails the three price-based outputs', () => {
    const out = valuationAnalysis({ ...base, price: null });
    for (const r of [
      out.pe_ratio,
      out.pb_ratio,
      out.earnings_yield,
    ]) {
      expect(failOf(r).reason).toBe('MISSING_INPUT');
      expect(failOf(r).missing).toEqual(['price']);
    }
    expect(out.ev_to_ebitda.ok).toBe(true);
  });

  it('negative eps: pe_ratio N/A, earnings_yield negative', () => {
    const out = valuationAnalysis({ ...base, eps: -5 });
    const f = failOf(out.pe_ratio);
    expect(f.reason).toBe('NOT_APPLICABLE');
    expect(f.missing).toEqual(['eps']);
    expect(valueOf(out.earnings_yield)).toBeCloseTo(-0.05);
    expect(out.pb_ratio.ok).toBe(true);
  });

  it('explicit zero eps: pe_ratio N/A, earnings_yield 0', () => {
    const out = valuationAnalysis({ ...base, eps: 0 });
    const f = failOf(out.pe_ratio);
    expect(f.reason).toBe('NOT_APPLICABLE');
    expect(f.missing).toEqual(['eps']);
    expect(valueOf(out.earnings_yield)).toBe(0);
  });

  it('zero or negative price is INVALID_INPUT', () => {
    for (const price of [0, -1]) {
      const out = valuationAnalysis({ ...base, price });
      for (const r of [
        out.pe_ratio,
        out.pb_ratio,
        out.earnings_yield,
      ]) {
        expect(failOf(r).reason).toBe('INVALID_INPUT');
        expect(failOf(r).missing).toEqual(['price']);
      }
      expect(out.ev_to_ebitda.ok).toBe(true);
    }
  });

  it('nonpositive book value is NOT_APPLICABLE', () => {
    for (const bv of [0, -10]) {
      const out = valuationAnalysis({
        ...base,
        book_value_per_share: bv,
      });
      const f = failOf(out.pb_ratio);
      expect(f.reason).toBe('NOT_APPLICABLE');
      expect(f.missing).toEqual(['book_value_per_share']);
      expect(out.pe_ratio.ok).toBe(true);
    }
  });

  it('nonpositive ev or ebitda is NOT_APPLICABLE', () => {
    const a = valuationAnalysis({ ...base, ebitda: 0 });
    expect(failOf(a.ev_to_ebitda).reason).toBe('NOT_APPLICABLE');
    expect(failOf(a.ev_to_ebitda).missing).toEqual(['ebitda']);
    const b = valuationAnalysis({
      ...base,
      enterprise_value: -100,
    });
    expect(failOf(b.ev_to_ebitda).reason).toBe('NOT_APPLICABLE');
    expect(failOf(b.ev_to_ebitda).missing).toEqual([
      'enterprise_value',
    ]);
    const c = valuationAnalysis({
      ...base,
      enterprise_value: 0,
      ebitda: -1,
    });
    expect(failOf(c.ev_to_ebitda).missing).toEqual([
      'enterprise_value',
      'ebitda',
    ]);
  });

  it('fundamentals_date after reference_date fails all', () => {
    const out = valuationAnalysis({
      ...base,
      fundamentals_date: '2026-01-01',
    });
    for (const r of all(out)) {
      expect(failOf(r).reason).toBe('INVALID_INPUT');
      expect(failOf(r).missing).toEqual(['fundamentals_date']);
    }
  });

  it('the same date in both fields is valid', () => {
    const out = valuationAnalysis({
      ...base,
      fundamentals_date: '2025-12-31',
    });
    for (const r of all(out)) {
      expect(r.ok).toBe(true);
    }
  });

  it('an unreadable reference_date fails all', () => {
    const out = valuationAnalysis({
      ...base,
      reference_date: 'not-a-date',
    });
    for (const r of all(out)) {
      expect(failOf(r).reason).toBe('INVALID_INPUT');
      expect(failOf(r).missing).toEqual(['reference_date']);
    }
  });

  it('an unreadable fundamentals_date fails all', () => {
    const out = valuationAnalysis({
      ...base,
      fundamentals_date: 'not-a-date',
    });
    for (const r of all(out)) {
      expect(failOf(r).reason).toBe('INVALID_INPUT');
      expect(failOf(r).missing).toEqual(['fundamentals_date']);
    }
  });

  it('NaN and Infinity are INVALID_INPUT', () => {
    const a = valuationAnalysis({ ...base, price: NaN });
    expect(failOf(a.pe_ratio).reason).toBe('INVALID_INPUT');
    expect(failOf(a.pe_ratio).missing).toEqual(['price']);
    const b = valuationAnalysis({ ...base, eps: Infinity });
    for (const r of [b.pe_ratio, b.earnings_yield]) {
      expect(failOf(r).reason).toBe('INVALID_INPUT');
      expect(failOf(r).missing).toEqual(['eps']);
    }
  });

  it('reports MISSING_INPUT before INVALID_INPUT', () => {
    const out = valuationAnalysis({
      ...base,
      price: -1,
      eps: null,
    });
    const f = failOf(out.pe_ratio);
    expect(f.reason).toBe('MISSING_INPUT');
    expect(f.missing).toEqual(['eps']);
  });

  it('reports INVALID_INPUT before NOT_APPLICABLE', () => {
    const out = valuationAnalysis({
      ...base,
      eps: -5,
      price: 0,
    });
    const f = failOf(out.pe_ratio);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual(['price']);
  });

  it('a result that overflows is INVALID_INPUT', () => {
    const out = valuationAnalysis({
      ...base,
      price: 1e300,
      eps: 1e-320,
    });
    const f = failOf(out.pe_ratio);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual(['price', 'eps']);
  });
});
