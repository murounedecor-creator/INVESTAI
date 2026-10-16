/**
 * financial_analysis - Acoes/ETFs pure function (ADR-004 v2).
 *
 * Margins are ratios (0.25 = 25%), not percentages.
 * Null inputs are MISSING_INPUT. They never become zero.
 * MISSING_INPUT is reported before INVALID_INPUT.
 * Each margin passes or fails on its own.
 */
import { calcOk, calcFail, type CalcResult } from './calc-result';

export interface FinancialInput {
  reference_date: string;
  revenue: number | null;
  cogs: number | null;
  operating_income: number | null;
  net_income: number | null;
}

export interface FinancialAnalysis {
  gross_margin: CalcResult<number>;
  operating_margin: CalcResult<number>;
  net_margin: CalcResult<number>;
}

interface Part {
  name: string;
  value: number | null;
  isCost: boolean;
}

function margin(
  referenceDate: string,
  revenue: number | null,
  part: Part,
  formula: string
): CalcResult<number> {
  const partValue = part.value;
  const missing: string[] = [];
  if (revenue === null) missing.push('revenue');
  if (partValue === null) missing.push(part.name);
  if (revenue === null || partValue === null) {
    return calcFail('MISSING_INPUT', missing);
  }

  const invalid: string[] = [];
  if (Number.isNaN(Date.parse(referenceDate))) {
    invalid.push('reference_date');
  }
  if (!Number.isFinite(revenue) || revenue <= 0) {
    invalid.push('revenue');
  }
  if (
    !Number.isFinite(partValue) ||
    (part.isCost && partValue < 0)
  ) {
    invalid.push(part.name);
  }
  if (invalid.length > 0) {
    return calcFail('INVALID_INPUT', invalid);
  }

  const result = part.isCost
    ? (revenue - partValue) / revenue
    : partValue / revenue;
  if (!Number.isFinite(result)) {
    return calcFail('INVALID_INPUT', ['revenue', part.name]);
  }

  return calcOk(result, {
    inputs: { revenue, [part.name]: partValue },
    formula,
    reference_date: referenceDate,
  });
}

export function financialAnalysis(
  input: FinancialInput
): FinancialAnalysis {
  const d = input.reference_date;
  const r = input.revenue;
  return {
    gross_margin: margin(
      d,
      r,
      { name: 'cogs', value: input.cogs, isCost: true },
      'gross_margin = (revenue - cogs) / revenue'
    ),
    operating_margin: margin(
      d,
      r,
      {
        name: 'operating_income',
        value: input.operating_income,
        isCost: false,
      },
      'operating_margin = operating_income / revenue'
    ),
    net_margin: margin(
      d,
      r,
      { name: 'net_income', value: input.net_income, isCost: false },
      'net_margin = net_income / revenue'
    ),
  };
}
