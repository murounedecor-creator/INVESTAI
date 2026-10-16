import { describe, it, expect } from 'vitest';
import {
  balanceCashflowAnalysis,
  type BalanceCashflowInput,
} from '@/src/agents/acoes-etfs/balance-cashflow-analysis';
import type { CalcResult } from '@/src/agents/acoes-etfs/calc-result';

const base: BalanceCashflowInput = {
  reference_date: '2025-12-31',
  current_assets: 200,
  current_liabilities: 100,
  total_debt: 300,
  equity: 150,
  cash: 50,
  operating_cash_flow: 80,
  capex: 30,
};

function valueOf(r: CalcResult<number>): number {
  if (!r.ok) throw new Error('expected ok result');
  return r.value;
}

function failOf(r: CalcResult<number>) {
  if (r.ok) throw new Error('expected failure');
  return r;
}

function all(o: ReturnType<typeof balanceCashflowAnalysis>) {
  return [
    o.current_ratio,
    o.debt_to_equity,
    o.net_debt,
    o.free_cash_flow,
  ];
}

describe('balanceCashflowAnalysis', () => {
  it('computes all outputs with trace', () => {
    const out = balanceCashflowAnalysis(base);
    expect(valueOf(out.current_ratio)).toBe(2);
    expect(valueOf(out.debt_to_equity)).toBe(2);
    expect(valueOf(out.net_debt)).toBe(250);
    expect(valueOf(out.free_cash_flow)).toBe(50);
    const c = out.current_ratio;
    if (!c.ok) throw new Error('expected ok');
    expect(c.trace).toEqual({
      inputs: { current_assets: 200, current_liabilities: 100 },
      formula: 'current_ratio = current_assets / current_liabilities',
      reference_date: '2025-12-31',
    });
  });

  it('missing cash fails only net_debt', () => {
    const out = balanceCashflowAnalysis({ ...base, cash: null });
    expect(failOf(out.net_debt)).toEqual({
      ok: false,
      reason: 'MISSING_INPUT',
      missing: ['cash'],
    });
    expect(out.current_ratio.ok).toBe(true);
    expect(out.debt_to_equity.ok).toBe(true);
    expect(out.free_cash_flow.ok).toBe(true);
  });

  it('missing total_debt fails debt_to_equity and net_debt', () => {
    const out = balanceCashflowAnalysis({
      ...base,
      total_debt: null,
    });
    for (const r of [out.debt_to_equity, out.net_debt]) {
      expect(failOf(r).reason).toBe('MISSING_INPUT');
      expect(failOf(r).missing).toEqual(['total_debt']);
    }
    expect(out.current_ratio.ok).toBe(true);
    expect(out.free_cash_flow.ok).toBe(true);
  });

  it('zero current_liabilities is NOT_APPLICABLE', () => {
    const out = balanceCashflowAnalysis({
      ...base,
      current_liabilities: 0,
    });
    const f = failOf(out.current_ratio);
    expect(f.reason).toBe('NOT_APPLICABLE');
    expect(f.missing).toEqual(['current_liabilities']);
  });

  it('zero or negative equity is NOT_APPLICABLE', () => {
    for (const equity of [0, -50]) {
      const out = balanceCashflowAnalysis({ ...base, equity });
      const f = failOf(out.debt_to_equity);
      expect(f.reason).toBe('NOT_APPLICABLE');
      expect(f.missing).toEqual(['equity']);
    }
  });

  it('negative cash is INVALID_INPUT for net_debt only', () => {
    const out = balanceCashflowAnalysis({ ...base, cash: -1 });
    const f = failOf(out.net_debt);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual(['cash']);
    expect(out.debt_to_equity.ok).toBe(true);
  });

  it('negative current liabilities is INVALID, not N/A', () => {
    const out = balanceCashflowAnalysis({
      ...base,
      current_liabilities: -10,
    });
    const f = failOf(out.current_ratio);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual(['current_liabilities']);
  });

  it('negative current_assets is INVALID_INPUT', () => {
    const out = balanceCashflowAnalysis({
      ...base,
      current_assets: -5,
    });
    const f = failOf(out.current_ratio);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual(['current_assets']);
  });

  it('cash above debt gives a negative net_debt', () => {
    const out = balanceCashflowAnalysis({
      ...base,
      total_debt: 50,
      cash: 80,
    });
    expect(valueOf(out.net_debt)).toBe(-30);
  });

  it('negative operating cash flow is valid', () => {
    const out = balanceCashflowAnalysis({
      ...base,
      operating_cash_flow: -20,
    });
    expect(valueOf(out.free_cash_flow)).toBe(-50);
  });

  it('negative capex is INVALID_INPUT', () => {
    const out = balanceCashflowAnalysis({ ...base, capex: -1 });
    const f = failOf(out.free_cash_flow);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual(['capex']);
  });

  it('explicit zeros are valid values', () => {
    const out = balanceCashflowAnalysis({
      ...base,
      current_assets: 0,
      total_debt: 0,
    });
    expect(valueOf(out.current_ratio)).toBe(0);
    expect(valueOf(out.debt_to_equity)).toBe(0);
    expect(valueOf(out.net_debt)).toBe(-50);
  });

  it('NaN and Infinity are INVALID_INPUT', () => {
    const a = balanceCashflowAnalysis({
      ...base,
      current_assets: NaN,
    });
    expect(failOf(a.current_ratio).reason).toBe('INVALID_INPUT');
    const b = balanceCashflowAnalysis({
      ...base,
      equity: Infinity,
    });
    const f = failOf(b.debt_to_equity);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual(['equity']);
  });

  it('an unreadable reference_date fails every output', () => {
    const out = balanceCashflowAnalysis({
      ...base,
      reference_date: 'not-a-date',
    });
    for (const r of all(out)) {
      expect(failOf(r).reason).toBe('INVALID_INPUT');
      expect(failOf(r).missing).toEqual(['reference_date']);
    }
  });

  it('reports MISSING_INPUT before INVALID_INPUT', () => {
    const out = balanceCashflowAnalysis({
      ...base,
      current_assets: -1,
      current_liabilities: null,
    });
    const f = failOf(out.current_ratio);
    expect(f.reason).toBe('MISSING_INPUT');
    expect(f.missing).toEqual(['current_liabilities']);
  });

  it('reports INVALID_INPUT before NOT_APPLICABLE', () => {
    const out = balanceCashflowAnalysis({
      ...base,
      equity: 0,
      total_debt: -1,
    });
    const f = failOf(out.debt_to_equity);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual(['total_debt']);
  });

  it('a result that overflows is INVALID_INPUT', () => {
    const out = balanceCashflowAnalysis({
      ...base,
      current_assets: 1e300,
      current_liabilities: 1e-320,
    });
    const f = failOf(out.current_ratio);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual([
      'current_assets',
      'current_liabilities',
    ]);
  });
});
