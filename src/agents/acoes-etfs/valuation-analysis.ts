/**
 * valuation_analysis - Acoes/ETFs pure function (ADR-004 v2).
 *
 * Multiples are plain ratios. Prices and per-share values
 * must share currency and share base (not tracked yet).
 * reference_date is the price date. fundamentals_date is the
 * date of the financial statements and must not be later.
 * Null inputs are MISSING_INPUT. They never become zero.
 * Order: MISSING_INPUT, then INVALID_INPUT, then
 * NOT_APPLICABLE (valid data, ratio has no useful reading).
 * Each output passes or fails on its own.
 */
import { calcOk, calcFail, type CalcResult } from './calc-result';

export interface ValuationInput {
  reference_date: string;
  fundamentals_date: string;
  price: number | null;
  eps: number | null;
  book_value_per_share: number | null;
  enterprise_value: number | null;
  ebitda: number | null;
}

export interface ValuationAnalysis {
  pe_ratio: CalcResult<number>;
  pb_ratio: CalcResult<number>;
  ev_to_ebitda: CalcResult<number>;
  earnings_yield: CalcResult<number>;
}

interface Field {
  name: string;
  value: number | null;
  mustBePositive: boolean;
}

interface Dates {
  reference: string;
  fundamentals: string;
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
  if (!Number.isFinite(x) || (a.mustBePositive && x <= 0)) {
    invalid.push(a.name);
  }
  if (!Number.isFinite(y) || (b.mustBePositive && y <= 0)) {
    invalid.push(b.name);
  }
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

export function valuationAnalysis(
  input: ValuationInput
): ValuationAnalysis {
  const dates: Dates = {
    reference: input.reference_date,
    fundamentals: input.fundamentals_date,
  };
  const price: Field = {
    name: 'price',
    value: input.price,
    mustBePositive: true,
  };
  const eps: Field = {
    name: 'eps',
    value: input.eps,
    mustBePositive: false,
  };
  return {
    pe_ratio: compute(
      dates,
      price,
      eps,
      'pe_ratio = price / eps',
      (x, y) => x / y,
      (_x, y) => (y <= 0 ? ['eps'] : [])
    ),
    pb_ratio: compute(
      dates,
      price,
      {
        name: 'book_value_per_share',
        value: input.book_value_per_share,
        mustBePositive: false,
      },
      'pb_ratio = price / book_value_per_share',
      (x, y) => x / y,
      (_x, y) => (y <= 0 ? ['book_value_per_share'] : [])
    ),
    ev_to_ebitda: compute(
      dates,
      {
        name: 'enterprise_value',
        value: input.enterprise_value,
        mustBePositive: false,
      },
      { name: 'ebitda', value: input.ebitda, mustBePositive: false },
      'ev_to_ebitda = enterprise_value / ebitda',
      (x, y) => x / y,
      (x, y) => {
        const na: string[] = [];
        if (x <= 0) na.push('enterprise_value');
        if (y <= 0) na.push('ebitda');
        return na;
      }
    ),
    earnings_yield: compute(
      dates,
      eps,
      price,
      'earnings_yield = eps / price',
      (x, y) => x / y
    ),
  };
}
