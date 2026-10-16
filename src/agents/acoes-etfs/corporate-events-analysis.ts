/**
 * corporate_events_analysis - Acoes/ETFs pure function
 * (ADR-004 v2).
 *
 * Window: fundamentals_date < effective_date <= reference_date.
 * share_multiplier = new shares per old share (2-for-1 split
 * is 2, 1-for-10 reverse split is 0.1, 10% bonus is 1.1).
 * To bring a per-share value from fundamentals_date to the
 * price basis, divide it by split_adjustment_factor. This
 * function only computes the factor.
 * events null means unknown (MISSING_INPUT). An empty list
 * is proof of no events: count 0 and factor 1.
 * A null share_multiplier never becomes 1.
 * Order: events null is MISSING_INPUT; unreadable dates make
 * the window unknowable (INVALID_INPUT); then a null
 * multiplier in the window is MISSING_INPUT; then a bad
 * multiplier is INVALID_INPUT.
 * Each output passes or fails on its own.
 */
import { calcOk, calcFail, type CalcResult } from './calc-result';

export type CorporateEventKind =
  | 'SPLIT'
  | 'REVERSE_SPLIT'
  | 'BONUS';

export interface CorporateEvent {
  kind: CorporateEventKind;
  effective_date: string;
  share_multiplier: number | null;
}

export interface CorporateEventsInput {
  reference_date: string;
  fundamentals_date: string;
  events: CorporateEvent[] | null;
}

export interface CorporateEventsAnalysis {
  events_in_window: CalcResult<number>;
  split_adjustment_factor: CalcResult<number>;
}

type WindowResult =
  | { ok: true; startMs: number; endMs: number }
  | { ok: false; invalid: string[] };

function windowOf(
  referenceDate: string,
  fundamentalsDate: string
): WindowResult {
  const invalid: string[] = [];
  const endMs = Date.parse(referenceDate);
  const startMs = Date.parse(fundamentalsDate);
  if (Number.isNaN(endMs)) invalid.push('reference_date');
  if (
    Number.isNaN(startMs) ||
    (!Number.isNaN(endMs) && startMs > endMs)
  ) {
    invalid.push('fundamentals_date');
  }
  if (invalid.length > 0) return { ok: false, invalid };
  return { ok: true, startMs, endMs };
}

interface Hit {
  index: number;
  event: CorporateEvent;
}

function scanEvents(
  events: CorporateEvent[],
  startMs: number,
  endMs: number
): { invalid: string[]; hits: Hit[] } {
  const invalid: string[] = [];
  const hits: Hit[] = [];
  events.forEach((event, index) => {
    const ms = Date.parse(event.effective_date);
    if (Number.isNaN(ms)) {
      invalid.push(`events[${index}].effective_date`);
    } else if (ms > startMs && ms <= endMs) {
      hits.push({ index, event });
    }
  });
  return { invalid, hits };
}

function eventsInWindow(
  input: CorporateEventsInput
): CalcResult<number> {
  const { events } = input;
  if (events === null) return calcFail('MISSING_INPUT', ['events']);
  const w = windowOf(input.reference_date, input.fundamentals_date);
  if (!w.ok) return calcFail('INVALID_INPUT', w.invalid);
  const scan = scanEvents(events, w.startMs, w.endMs);
  if (scan.invalid.length > 0) {
    return calcFail('INVALID_INPUT', scan.invalid);
  }
  return calcOk(scan.hits.length, {
    inputs: {
      fundamentals_date: input.fundamentals_date,
      events_total: events.length,
    },
    formula:
      'events_in_window = count(events with ' +
      'fundamentals_date < effective_date <= reference_date)',
    reference_date: input.reference_date,
  });
}

function splitAdjustmentFactor(
  input: CorporateEventsInput
): CalcResult<number> {
  const { events } = input;
  if (events === null) return calcFail('MISSING_INPUT', ['events']);
  const w = windowOf(input.reference_date, input.fundamentals_date);
  if (!w.ok) return calcFail('INVALID_INPUT', w.invalid);
  const scan = scanEvents(events, w.startMs, w.endMs);
  if (scan.invalid.length > 0) {
    return calcFail('INVALID_INPUT', scan.invalid);
  }

  const missing: string[] = [];
  const bad: string[] = [];
  let factor = 1;
  for (const { index, event } of scan.hits) {
    const m = event.share_multiplier;
    const name = `events[${index}].share_multiplier`;
    if (m === null) missing.push(name);
    else if (!Number.isFinite(m) || m <= 0) bad.push(name);
    else factor *= m;
  }
  if (missing.length > 0) return calcFail('MISSING_INPUT', missing);
  if (bad.length > 0) return calcFail('INVALID_INPUT', bad);
  if (!Number.isFinite(factor) || factor <= 0) {
    return calcFail(
      'INVALID_INPUT',
      scan.hits.map((h) => `events[${h.index}].share_multiplier`)
    );
  }

  return calcOk(factor, {
    inputs: {
      fundamentals_date: input.fundamentals_date,
      events_in_window: scan.hits.length,
      multipliers: scan.hits
        .map((h) => String(h.event.share_multiplier))
        .join(','),
    },
    formula:
      'split_adjustment_factor = product(share_multiplier ' +
      'of events in window)',
    reference_date: input.reference_date,
  });
}

export function corporateEventsAnalysis(
  input: CorporateEventsInput
): CorporateEventsAnalysis {
  return {
    events_in_window: eventsInWindow(input),
    split_adjustment_factor: splitAdjustmentFactor(input),
  };
}
