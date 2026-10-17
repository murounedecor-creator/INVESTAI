import { describe, it, expect, vi } from 'vitest';
import {
  AcoesEtfsAgent,
  type AssetData,
  type AssetAnalysis,
} from '@/src/agents/acoes-etfs/acoes-etfs-agent';
import type { CalcResult } from '@/src/agents/acoes-etfs/calc-result';
import type { CorporateEvent } from '@/src/agents/acoes-etfs/corporate-events-analysis';
import type {
  AgentResult,
  AgentFailure,
  RunContext,
} from '@/src/contracts/agent';

const ctx: RunContext = {
  run_id: 'run_1',
  started_at: '2025-12-31T00:00:00Z',
  params: {},
};

const DAY = '2025-12-31';
const FUND = '2025-09-30';

const base: AssetData = {
  ticker: 'AAA',
  per_share_values_adjusted: null,
  financial: {
    reference_date: DAY,
    revenue: 100,
    cogs: 60,
    operating_income: 20,
    net_income: 10,
  },
  balance_cashflow: {
    reference_date: DAY,
    current_assets: 200,
    current_liabilities: 100,
    total_debt: 300,
    equity: 150,
    cash: 50,
    operating_cash_flow: 80,
    capex: 30,
  },
  valuation: {
    reference_date: DAY,
    fundamentals_date: FUND,
    price: 100,
    eps: 5,
    book_value_per_share: 50,
    enterprise_value: 1000,
    ebitda: 200,
  },
  dividends: {
    reference_date: DAY,
    fundamentals_date: FUND,
    price: 100,
    dividends_per_share_12m: 5,
    previous_dividends_per_share_12m: 4,
    eps: 10,
  },
  corporate_events: {
    reference_date: DAY,
    fundamentals_date: FUND,
    events: [],
  },
};

const SPLIT: CorporateEvent = {
  kind: 'SPLIT',
  effective_date: '2025-10-15',
  share_multiplier: 2,
};

function withSplit(adjusted: boolean | null): AssetData {
  return {
    ...base,
    per_share_values_adjusted: adjusted,
    corporate_events: { ...base.corporate_events, events: [SPLIT] },
  };
}

function runAgent(assets: AssetData[]) {
  return new AcoesEtfsAgent(assets).run(ctx);
}

function resultOf(r: AgentResult | AgentFailure): AgentResult {
  if (!('analysis' in r)) throw new Error('expected AgentResult');
  return r;
}

function failureOf(r: AgentResult | AgentFailure): AgentFailure {
  if (!('error_type' in r)) throw new Error('expected AgentFailure');
  return r;
}

function assetsOf(r: AgentResult): AssetAnalysis[] {
  const assets = r.analysis.assets;
  if (!Array.isArray(assets)) throw new Error('expected assets');
  return assets;
}

function recordOf(v: unknown): Record<string, unknown> {
  if (typeof v !== 'object' || v === null) {
    throw new Error('expected object');
  }
  return Object.fromEntries(Object.entries(v));
}

function perShare(a: AssetAnalysis): CalcResult<number>[] {
  return [
    a.valuation.pe_ratio,
    a.valuation.pb_ratio,
    a.valuation.earnings_yield,
    a.dividends.dividend_yield,
    a.dividends.payout_ratio,
    a.dividends.dividend_growth,
  ];
}

function failOf(r: CalcResult<number>) {
  if (r.ok) throw new Error('expected failure');
  return r;
}

function valueOf(r: CalcResult<number>): number {
  if (!r.ok) throw new Error('expected ok result');
  return r.value;
}

describe('AcoesEtfsAgent', () => {
  it('a complete asset gives an AgentResult', async () => {
    const res = resultOf(await runAgent([base]));
    expect(res.agent_id).toBe('acoes_etfs');
    const [a] = assetsOf(res);
    expect(a.ticker).toBe('AAA');
    expect(a.outputs_ok).toBe(16);
    expect(a.outputs_total).toBe(16);
    expect(res.collection).toEqual({
      data_origin: 'INJECTED_NORMALIZED_DATA',
      asset_count: 1,
      tickers: ['AAA'],
    });
  });

  it('common dimensions follow ADR-002', async () => {
    const res = resultOf(await runAgent([base]));
    const nulls = {
      momentum: null,
      source_quality: null,
      volatility: null,
      entry_cost: null,
      liquidity: null,
    };
    const reasons = {
      momentum: 'FORMULA_NOT_APPROVED',
      source_quality: 'FORMULA_NOT_APPROVED',
      volatility: 'FORMULA_NOT_APPROVED',
      entry_cost: 'FORMULA_NOT_APPROVED',
      liquidity: 'FORMULA_NOT_APPROVED',
    };
    expect(recordOf(res.analysis.common_dimensions)).toEqual({
      AAA: nulls,
    });
    expect(
      recordOf(res.analysis.common_dimensions_reasons)
    ).toEqual({ AAA: reasons });
  });

  it('no events: per-share outputs are not guarded', async () => {
    const res = resultOf(await runAgent([base]));
    const [a] = assetsOf(res);
    expect(base.per_share_values_adjusted).toBeNull();
    for (const r of perShare(a)) expect(r.ok).toBe(true);
    expect(a.outputs_ok).toBe(16);
  });

  it('events and adjusted=true keep per-share outputs', async () => {
    const res = resultOf(await runAgent([withSplit(true)]));
    const [a] = assetsOf(res);
    for (const r of perShare(a)) expect(r.ok).toBe(true);
    expect(valueOf(a.corporate_events.events_in_window)).toBe(1);
    expect(valueOf(a.corporate_events.split_adjustment_factor)).toBe(2);
    expect(a.outputs_ok).toBe(16);
  });

  it('events and adjusted=null: MISSING_INPUT', async () => {
    const res = resultOf(await runAgent([withSplit(null)]));
    const [a] = assetsOf(res);
    for (const r of perShare(a)) {
      expect(failOf(r)).toEqual({
        ok: false,
        reason: 'MISSING_INPUT',
        missing: ['per_share_values_adjusted'],
      });
    }
    expect(a.valuation.ev_to_ebitda.ok).toBe(true);
    expect(a.outputs_ok).toBe(10);
  });

  it('events and adjusted=false: INVALID_INPUT', async () => {
    const res = resultOf(await runAgent([withSplit(false)]));
    const [a] = assetsOf(res);
    for (const r of perShare(a)) {
      expect(failOf(r)).toEqual({
        ok: false,
        reason: 'INVALID_INPUT',
        missing: ['per_share_values_adjusted'],
      });
    }
    expect(a.valuation.ev_to_ebitda.ok).toBe(true);
    expect(a.outputs_ok).toBe(10);
  });

  it('unknown events pass MISSING_INPUT to per-share outputs', async () => {
    const asset: AssetData = {
      ...base,
      corporate_events: { ...base.corporate_events, events: null },
    };
    const res = resultOf(await runAgent([asset]));
    const [a] = assetsOf(res);
    for (const r of perShare(a)) {
      expect(failOf(r)).toEqual({
        ok: false,
        reason: 'MISSING_INPUT',
        missing: ['events'],
      });
    }
    expect(a.corporate_events.events_in_window.ok).toBe(false);
    expect(a.corporate_events.split_adjustment_factor.ok).toBe(false);
    expect(a.outputs_ok).toBe(8);
  });

  it('bad event dates pass INVALID_INPUT to per-share outputs', async () => {
    const asset: AssetData = {
      ...base,
      corporate_events: {
        ...base.corporate_events,
        reference_date: 'not-a-date',
      },
    };
    const res = resultOf(await runAgent([asset]));
    const [a] = assetsOf(res);
    for (const r of perShare(a)) {
      expect(failOf(r)).toEqual({
        ok: false,
        reason: 'INVALID_INPUT',
        missing: ['reference_date'],
      });
    }
    expect(a.outputs_ok).toBe(8);
  });

  it('the guard never hides an own failure', async () => {
    const asset: AssetData = {
      ...withSplit(null),
      valuation: { ...base.valuation, eps: -5 },
    };
    const res = resultOf(await runAgent([asset]));
    const [a] = assetsOf(res);
    expect(failOf(a.valuation.pe_ratio)).toEqual({
      ok: false,
      reason: 'NOT_APPLICABLE',
      missing: ['eps'],
    });
    expect(failOf(a.valuation.earnings_yield)).toEqual({
      ok: false,
      reason: 'MISSING_INPUT',
      missing: ['per_share_values_adjusted'],
    });
  });

  it('assets are independent of each other', async () => {
    const b: AssetData = {
      ...base,
      ticker: 'BBB',
      financial: { ...base.financial, revenue: null },
    };
    const res = resultOf(await runAgent([base, b]));
    const [first, second] = assetsOf(res);
    expect(first.outputs_ok).toBe(16);
    expect(second.outputs_ok).toBe(13);
    expect(failOf(second.financial.gross_margin).missing).toEqual([
      'revenue',
    ]);
    expect(res.collection.tickers).toEqual(['AAA', 'BBB']);
  });

  it('no valid output at all is NO_CALCULABLE_OUTPUT', async () => {
    const bad = 'not-a-date';
    const asset: AssetData = {
      ...base,
      financial: { ...base.financial, reference_date: bad },
      balance_cashflow: { ...base.balance_cashflow, reference_date: bad },
      valuation: { ...base.valuation, reference_date: bad },
      dividends: { ...base.dividends, reference_date: bad },
      corporate_events: { ...base.corporate_events, reference_date: bad },
    };
    const f = failureOf(await runAgent([asset]));
    expect(f).toEqual({
      run_id: 'run_1',
      agent_id: 'acoes_etfs',
      started_at: '2025-12-31T00:00:00Z',
      error_type: 'NO_CALCULABLE_OUTPUT',
      message: 'No output could be calculated',
    });
  });

  it('an empty asset list is NO_INPUT_ASSETS', async () => {
    const f = failureOf(await runAgent([]));
    expect(f.error_type).toBe('NO_INPUT_ASSETS');
  });

  it('a duplicate ticker is INVALID_ASSETS', async () => {
    const f = failureOf(await runAgent([base, base]));
    expect(f.error_type).toBe('INVALID_ASSETS');
  });

  it('a blank ticker is INVALID_ASSETS', async () => {
    const f = failureOf(await runAgent([{ ...base, ticker: '  ' }]));
    expect(f.error_type).toBe('INVALID_ASSETS');
  });

  it('a __proto__ ticker is a normal key in the maps', async () => {
    const res = resultOf(
      await runAgent([{ ...base, ticker: '__proto__' }])
    );
    const dims = recordOf(res.analysis.common_dimensions);
    const reasons = recordOf(res.analysis.common_dimensions_reasons);
    expect(Object.keys(dims)).toEqual(['__proto__']);
    expect(Object.keys(reasons)).toEqual(['__proto__']);
    expect(assetsOf(res)[0].ticker).toBe('__proto__');
  });

  it('the result keeps the run context', async () => {
    const res = resultOf(await runAgent([base]));
    expect(res.context).toEqual(ctx);
  });

  it('an exception becomes a generic AgentFailure', async () => {
    const bad = { ...base };
    Object.defineProperty(bad, 'ticker', {
      get() {
        throw new Error('boom-secret');
      },
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const f = failureOf(await runAgent([bad]));
      expect(f.error_type).toBe('AGENT_EXCEPTION');
      expect(f.message).toBe('Agent execution failed');
      expect(JSON.stringify(f)).not.toContain('boom-secret');
    } finally {
      spy.mockRestore();
    }
  });
});
