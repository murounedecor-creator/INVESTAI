import { describe, it, expect } from 'vitest';
import {
  financialAnalysis,
  type FinancialInput,
} from '@/src/agents/acoes-etfs/financial-analysis';
import type { CalcResult } from '@/src/agents/acoes-etfs/calc-result';

const base: FinancialInput = {
  reference_date: '2025-12-31',
  revenue: 100,
  cogs: 60,
  operating_income: 20,
  net_income: 10,
};

function valueOf(r: CalcResult<number>): number {
  if (!r.ok) throw new Error('expected ok result');
  return r.value;
}

function failOf(r: CalcResult<number>) {
  if (r.ok) throw new Error('expected failure');
  return r;
}

describe('financialAnalysis', () => {
  it('computes all margins as ratios with trace', () => {
    const out = financialAnalysis(base);
    expect(valueOf(out.gross_margin)).toBeCloseTo(0.4);
    expect(valueOf(out.operating_margin)).toBeCloseTo(0.2);
    expect(valueOf(out.net_margin)).toBeCloseTo(0.1);
    const g = out.gross_margin;
    if (!g.ok) throw new Error('expected ok');
    expect(g.trace).toEqual({
      inputs: { revenue: 100, cogs: 60 },
      formula: 'gross_margin = (revenue - cogs) / revenue',
      reference_date: '2025-12-31',
    });
  });

  it('missing cogs fails only the gross margin', () => {
    const out = financialAnalysis({ ...base, cogs: null });
    expect(failOf(out.gross_margin)).toEqual({
      ok: false,
      reason: 'MISSING_INPUT',
      missing: ['cogs'],
    });
    expect(out.operating_margin.ok).toBe(true);
    expect(out.net_margin.ok).toBe(true);
  });

  it('missing revenue fails every margin', () => {
    const out = financialAnalysis({ ...base, revenue: null });
    for (const r of [
      out.gross_margin,
      out.operating_margin,
      out.net_margin,
    ]) {
      expect(failOf(r).reason).toBe('MISSING_INPUT');
      expect(failOf(r).missing).toEqual(['revenue']);
    }
  });

  it('zero or negative revenue is INVALID_INPUT', () => {
    for (const revenue of [0, -50]) {
      const out = financialAnalysis({ ...base, revenue });
      const f = failOf(out.net_margin);
      expect(f.reason).toBe('INVALID_INPUT');
      expect(f.missing).toEqual(['revenue']);
    }
  });

  it('negative cogs is INVALID_INPUT for gross margin only', () => {
    const out = financialAnalysis({ ...base, cogs: -1 });
    const f = failOf(out.gross_margin);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual(['cogs']);
    expect(out.operating_margin.ok).toBe(true);
  });

  it('a loss gives a negative margin', () => {
    const out = financialAnalysis({ ...base, net_income: -10 });
    expect(valueOf(out.net_margin)).toBeCloseTo(-0.1);
  });

  it('explicit zeros are valid values', () => {
    const out = financialAnalysis({
      ...base,
      cogs: 0,
      net_income: 0,
    });
    expect(valueOf(out.gross_margin)).toBeCloseTo(1);
    expect(valueOf(out.net_margin)).toBe(0);
  });

  it('NaN and Infinity are INVALID_INPUT', () => {
    const a = financialAnalysis({ ...base, revenue: NaN });
    expect(failOf(a.gross_margin).reason).toBe('INVALID_INPUT');
    const b = financialAnalysis({
      ...base,
      operating_income: Infinity,
    });
    const f = failOf(b.operating_margin);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual(['operating_income']);
  });

  it('an unreadable reference_date is INVALID_INPUT', () => {
    const out = financialAnalysis({
      ...base,
      reference_date: 'not-a-date',
    });
    for (const r of [
      out.gross_margin,
      out.operating_margin,
      out.net_margin,
    ]) {
      expect(failOf(r).reason).toBe('INVALID_INPUT');
      expect(failOf(r).missing).toEqual(['reference_date']);
    }
  });

  it('reports MISSING_INPUT before INVALID_INPUT', () => {
    const out = financialAnalysis({
      ...base,
      revenue: 0,
      cogs: null,
    });
    const f = failOf(out.gross_margin);
    expect(f.reason).toBe('MISSING_INPUT');
    expect(f.missing).toEqual(['cogs']);
  });

  it('a result that overflows is INVALID_INPUT', () => {
    const out = financialAnalysis({
      ...base,
      revenue: 1e-320,
      operating_income: 1e300,
    });
    const f = failOf(out.operating_margin);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual(['revenue', 'operating_income']);
  });
});
