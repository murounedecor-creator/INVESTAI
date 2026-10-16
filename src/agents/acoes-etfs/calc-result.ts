/**
 * CalcResult - output of each Acoes/ETFs pure function (ADR-004 v2).
 *
 * Absence never becomes zero (Constitution 11 and 19).
 * A calculation either has a value with a full trace,
 * or it fails with a reason from a closed set.
 */

export type CalcFailReason =
  | 'MISSING_INPUT'
  | 'INVALID_INPUT'
  | 'NOT_APPLICABLE';

export interface CalcTrace {
  inputs: Record<string, number | string | null>;
  formula: string;
  reference_date: string;
}

export type CalcResult<T> =
  | { ok: true; value: T; trace: CalcTrace }
  | { ok: false; reason: CalcFailReason; missing: string[] };

export function calcOk<T>(value: T, trace: CalcTrace): CalcResult<T> {
  if (value === undefined) {
    throw new Error(
      'INVARIANT_VIOLATION: value must not be undefined'
    );
  }
  return { ok: true, value, trace };
}

export function calcFail(
  reason: CalcFailReason,
  missing: string[]
): CalcResult<never> {
  if (reason === 'MISSING_INPUT' && missing.length === 0) {
    throw new Error(
      'INVARIANT_VIOLATION: MISSING_INPUT requires missing'
    );
  }
  return { ok: false, reason, missing };
}
