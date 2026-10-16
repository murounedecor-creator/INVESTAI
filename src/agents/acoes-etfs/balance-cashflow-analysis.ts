/**
 * balance_cashflow_analysis - Acoes/ETFs pure function
 * (ADR-004 v2).
 *
 * Ratios are plain ratios. net_debt and free_cash_flow keep
 * the unit of the inputs (no currency tracking yet).
 * Null inputs are MISSING_INPUT. They never become zero.
 * MISSING_INPUT is reported before INVALID_INPUT.
 * A zero denominator (or equity <= 0) is NOT_APPLICABLE:
 * the data is valid, but the ratio has no useful reading.
 * Each output passes or fails on its own.
 */
import { calcOk, calcFail, type CalcResult } from './calc-result';

export interface BalanceCashflowInput {
  reference_date: string;
  current_assets: number | null;
  current_liabilities: number | null;
  total_debt: number | null;
  equity: number | null;
  cash: number | null;
  operating_cash_flow: number | null;
  capex: number | null;
}

export interface BalanceCashflowAnalysis {
  current_ratio: CalcResult<number>;
  debt_to_equity: CalcResult<number>;
  net_debt: CalcResult<number>;
  free_cash_flow: CalcResult<number>;
}

interface Field {
  name: string;
  value: number | null;
  nonNegative: boolean;
}

function compute(
  referenceDate: string,
  a: Field,
  b: Field,
  formula: string,
  fn: (x: number, y: number) => number,
  notApplicable?: (x: number, y: number) => boolean
): CalcResult<number> {
  const missing: string[] = [];
  if (a.value === null) missing.push(a.name);
  if (b.value === null) missing.push(b.name);
  const x = a.value;
  const y = b.value;
  if (x === null || y === null) {
    return calcFail('MISSING_INPUT', missing);
  }

  const invalid: string[] = [];
  if (Number.isNaN(Date.parse(referenceDate))) {
    invalid.push('reference_date');
  }
  if (!Number.isFinite(x) || (a.nonNegative && x < 0)) {
    invalid.push(a.name);
  }
  if (!Number.isFinite(y) || (b.nonNegative && y < 0)) {
    invalid.push(b.name);
  }
  if (invalid.length > 0) {
    return calcFail('INVALID_INPUT', invalid);
  }

  if (notApplicable !== undefined && notApplicable(x, y)) {
    return calcFail('NOT_APPLICABLE', [b.name]);
  }

  const result = fn(x, y);
  if (!Number.isFinite(result)) {
    return calcFail('INVALID_INPUT', [a.name, b.name]);
  }

  return calcOk(result, {
    inputs: { [a.name]: x, [b.name]: y },
    formula,
    reference_date: referenceDate,
  });
}

export function balanceCashflowAnalysis(
  input: BalanceCashflowInput
): BalanceCashflowAnalysis {
  const d = input.reference_date;
  return {
    current_ratio: compute(
      d,
      {
        name: 'current_assets',
        value: input.current_assets,
        nonNegative: true,
      },
      {
        name: 'current_liabilities',
        value: input.current_liabilities,
        nonNegative: true,
      },
      'current_ratio = current_assets / current_liabilities',
      (x, y) => x / y,
      (_x, y) => y === 0
    ),
    debt_to_equity: compute(
      d,
      { name: 'total_debt', value: input.total_debt, nonNegative: true },
      { name: 'equity', value: input.equity, nonNegative: false },
      'debt_to_equity = total_debt / equity',
      (x, y) => x / y,
      (_x, y) => y <= 0
    ),
    net_debt: compute(
      d,
      { name: 'total_debt', value: input.total_debt, nonNegative: true },
      { name: 'cash', value: input.cash, nonNegative: true },
      'net_debt = total_debt - cash',
      (x, y) => x - y
    ),
    free_cash_flow: compute(
      d,
      {
        name: 'operating_cash_flow',
        value: input.operating_cash_flow,
        nonNegative: false,
      },
      { name: 'capex', value: input.capex, nonNegative: true },
      'free_cash_flow = operating_cash_flow - capex',
      (x, y) => x - y
    ),
  };
}
