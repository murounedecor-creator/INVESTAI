/**
 * AcoesEtfsAgent - first real agent (ADR-004 v2, ADR-002).
 *
 * No external source in this phase: assets arrive already
 * normalized and injected. collectSources is not used.
 * analysis.assets keeps every CalcResult, including failures.
 * Common dimensions are all null with FORMULA_NOT_APPROVED
 * until ADR-005 exists (ADR-002 format, per ticker).
 *
 * Per-share guard: when a ticker has corporate events in the
 * window, per-share outputs are only trusted if the caller
 * declares per_share_values_adjusted = true. The agent never
 * adjusts numbers by itself. The guard only replaces outputs
 * that were valid, so an own failure is never hidden.
 *
 * AgentResult when at least one output of at least one asset
 * is valid. Otherwise AgentFailure (never an empty result).
 */
import { AgentBase } from '@/src/agents/agent-base';
import type {
  AgentResult,
  AgentFailure,
  RunContext,
} from '@/src/contracts/agent';
import { calcFail, type CalcResult } from './calc-result';
import {
  financialAnalysis,
  type FinancialInput,
  type FinancialAnalysis,
} from './financial-analysis';
import {
  balanceCashflowAnalysis,
  type BalanceCashflowInput,
  type BalanceCashflowAnalysis,
} from './balance-cashflow-analysis';
import {
  valuationAnalysis,
  type ValuationInput,
  type ValuationAnalysis,
} from './valuation-analysis';
import {
  dividendsAnalysis,
  type DividendsInput,
  type DividendsAnalysis,
} from './dividends-analysis';
import {
  corporateEventsAnalysis,
  type CorporateEventsInput,
  type CorporateEventsAnalysis,
} from './corporate-events-analysis';

export const FORMULA_NOT_APPROVED = 'FORMULA_NOT_APPROVED';

// Provisional (ADR-002 item 6, to be confirmed in ADR-005).
export const COMMON_DIMENSIONS = [
  'momentum',
  'source_quality',
  'volatility',
  'entry_cost',
  'liquidity',
] as const;

export interface AssetData {
  ticker: string;
  per_share_values_adjusted: boolean | null;
  financial: FinancialInput;
  balance_cashflow: BalanceCashflowInput;
  valuation: ValuationInput;
  dividends: DividendsInput;
  corporate_events: CorporateEventsInput;
}

export interface AssetAnalysis {
  ticker: string;
  financial: FinancialAnalysis;
  balance_cashflow: BalanceCashflowAnalysis;
  valuation: ValuationAnalysis;
  dividends: DividendsAnalysis;
  corporate_events: CorporateEventsAnalysis;
  outputs_ok: number;
  outputs_total: number;
}

function guardPerShare(
  result: CalcResult<number>,
  eventsResult: CalcResult<number>,
  adjusted: boolean | null
): CalcResult<number> {
  if (!result.ok) return result;
  if (!eventsResult.ok) {
    return calcFail(eventsResult.reason, eventsResult.missing);
  }
  if (eventsResult.value === 0) return result;
  if (adjusted === true) return result;
  if (adjusted === null) {
    return calcFail('MISSING_INPUT', ['per_share_values_adjusted']);
  }
  return calcFail('INVALID_INPUT', ['per_share_values_adjusted']);
}

function analyzeAsset(asset: AssetData): AssetAnalysis {
  const corporate = corporateEventsAnalysis(asset.corporate_events);
  const guard = (r: CalcResult<number>): CalcResult<number> =>
    guardPerShare(
      r,
      corporate.events_in_window,
      asset.per_share_values_adjusted
    );

  const financial = financialAnalysis(asset.financial);
  const balance = balanceCashflowAnalysis(asset.balance_cashflow);
  const v = valuationAnalysis(asset.valuation);
  const d = dividendsAnalysis(asset.dividends);
  const valuation: ValuationAnalysis = {
    pe_ratio: guard(v.pe_ratio),
    pb_ratio: guard(v.pb_ratio),
    ev_to_ebitda: v.ev_to_ebitda,
    earnings_yield: guard(v.earnings_yield),
  };
  const dividends: DividendsAnalysis = {
    dividend_yield: guard(d.dividend_yield),
    payout_ratio: guard(d.payout_ratio),
    dividend_growth: guard(d.dividend_growth),
  };

  const all: CalcResult<number>[] = [
    financial.gross_margin,
    financial.operating_margin,
    financial.net_margin,
    balance.current_ratio,
    balance.debt_to_equity,
    balance.net_debt,
    balance.free_cash_flow,
    valuation.pe_ratio,
    valuation.pb_ratio,
    valuation.ev_to_ebitda,
    valuation.earnings_yield,
    dividends.dividend_yield,
    dividends.payout_ratio,
    dividends.dividend_growth,
    corporate.events_in_window,
    corporate.split_adjustment_factor,
  ];

  return {
    ticker: asset.ticker,
    financial,
    balance_cashflow: balance,
    valuation,
    dividends,
    corporate_events: corporate,
    outputs_ok: all.filter((r) => r.ok).length,
    outputs_total: all.length,
  };
}

function emptyDimensions(): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const dim of COMMON_DIMENSIONS) out[dim] = null;
  return out;
}

function emptyReasons(): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const dim of COMMON_DIMENSIONS) {
    out[dim] = FORMULA_NOT_APPROVED;
  }
  return out;
}

export class AcoesEtfsAgent extends AgentBase {
  readonly agentId = 'acoes_etfs';
  private readonly assets: AssetData[];

  constructor(assets: AssetData[]) {
    super();
    this.assets = assets;
  }

  async execute(
    context: RunContext
  ): Promise<AgentResult | AgentFailure> {
    const fail = (type: string, message: string): AgentFailure => ({
      run_id: context.run_id,
      agent_id: this.agentId,
      started_at: context.started_at,
      error_type: type,
      message,
    });

    if (this.assets.length === 0) {
      return fail('NO_INPUT_ASSETS', 'No assets were provided');
    }
    const tickers = this.assets.map((a) => a.ticker);
    const hasBlank = tickers.some((t) => t.trim() === '');
    const hasDuplicate = new Set(tickers).size !== tickers.length;
    if (hasBlank || hasDuplicate) {
      return fail(
        'INVALID_ASSETS',
        'Asset tickers must be non-empty and unique'
      );
    }

    const analyzed = this.assets.map(analyzeAsset);
    if (analyzed.every((a) => a.outputs_ok === 0)) {
      return fail(
        'NO_CALCULABLE_OUTPUT',
        'No output could be calculated'
      );
    }

    const common_dimensions = Object.fromEntries(
      tickers.map((t) => [t, emptyDimensions()])
    );
    const common_dimensions_reasons = Object.fromEntries(
      tickers.map((t) => [t, emptyReasons()])
    );

    return {
      agent_id: this.agentId,
      context,
      collection: {
        data_origin: 'INJECTED_NORMALIZED_DATA',
        asset_count: analyzed.length,
        tickers,
      },
      analysis: {
        assets: analyzed,
        common_dimensions,
        common_dimensions_reasons,
      },
    } satisfies AgentResult;
  }
}
