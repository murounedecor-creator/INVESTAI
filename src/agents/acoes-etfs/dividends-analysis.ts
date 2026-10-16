/**
 * dividends_analysis - Acoes/ETFs pure function (ADR-004 v2).
 *
 * Outputs are plain ratios (0.10 = 10%), not percentages.
 * reference_date is the price date. fundamentals_date ends
 * the period of eps and of the 12-month dividend windows,
 * and must not be later than reference_date.
 * Per-share values must already be adjusted for splits.
 * Null inputs are MISSING_INPUT. They never become zero.
 * An explicit zero dividend is a valid value.
 * Order: MISSING_INPUT, then INVALID_INPUT, then
 * NOT_APPLICABLE (valid data, ratio has no useful reading).
 * Each output passes or fails on its own.
 */
import { calcOk, calcFail, type CalcResult } from './calc-result';

export interface DividendsInput {
  reference_date: string;
  fundamentals_date: string;
  price: number | null;
  dividends_per_share_12m: number | null;
  previous_dividends_per_share_12m: number | null;
  eps: number | null;
}

export interface DividendsAnalysis {
  dividend_yield: CalcResult<number>;
  payout_ratio: CalcResult<number>;
  dividend_growth: CalcResult<number>;
}

type Rule = 'any' | 'nonNegative' | 'positive';

interface Field {
  name: string;
  value: number | null;
  rule: Rule;
}

interface Dates {
  reference: string;
  fundamentals: string;
}

function isInvalid(value: number, rule: Rule): boolean {
  if (!Number.isFinite(value)) return true;
  if (rule === 'positive') return value <= 0;
  if (rule === 'nonNegative') return value < 0;
  return false;
}

function compute(
  dates: Dates,
  a: Field,
  b: Field,
  formula: string,
  fn: (x: number, y: number) => number,
  notApplicable?: (x: number, y: number) => string[]
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
  const refMs = Date.parse(dates.reference);
  const funMs = Date.parse(dates.fundamentals);
  if (Number.isNaN(refMs)) invalid.push('reference_date');
  if (
    Number.isNaN(funMs) ||
    (!Number.isNaN(refMs) && funMs > refMs)
  ) {
    invalid.push('fundamentals_date');
  }
  if (isInvalid(x, a.rule)) invalid.push(a.name);
  if (isInvalid(y, b.rule)) invalid.push(b.name);
  if (invalid.length > 0) {
    return calcFail('INVALID_INPUT', invalid);
  }

  if (notApplicable !== undefined) {
    const na = notApplicable(x, y);
    if (na.length > 0) {
      return calcFail('NOT_APPLICABLE', na);
    }
  }

  const result = fn(x, y);
  if (!Number.isFinite(result)) {
    return calcFail('INVALID_INPUT', [a.name, b.name]);
  }

  return calcOk(result, {
    inputs: {
      [a.name]: x,
      [b.name]: y,
      fundamentals_date: dates.fundamentals,
    },
    formula,
    reference_date: dates.reference,
  });
}

export function dividendsAnalysis(
  input: DividendsInput
): DividendsAnalysis {
  const dates: Dates = {
    reference: input.reference_date,
    fundamentals: input.fundamentals_date,
  };
  const dps: Field = {
    name: 'dividends_per_share_12m',
    value: input.dividends_per_share_12m,
    rule: 'nonNegative',
  };
  return {
    dividend_yield: compute(
      dates,
      dps,
      { name: 'price', value: input.price, rule: 'positive' },
      'dividend_yield = dividends_per_share_12m / price',
      (x, y) => x / y
    ),
    payout_ratio: compute(
      dates,
      dps,
      { name: 'eps', value: input.eps, rule: 'any' },
      'payout_ratio = dividends_per_share_12m / eps',
      (x, y) => x / y,
      (_x, y) => (y <= 0 ? ['eps'] : [])
    ),
    dividend_growth: compute(
      dates,
      dps,
      {
        name: 'previous_dividends_per_share_12m',
        value: input.previous_dividends_per_share_12m,
        rule: 'nonNegative',
      },
      'dividend_growth = dividends_per_share_12m / ' +
        'previous_dividends_per_share_12m - 1',
      (x, y) => x / y - 1,
      (_x, y) =>
        y === 0 ? ['previous_dividends_per_share_12m'] : []
    ),
  };
}
