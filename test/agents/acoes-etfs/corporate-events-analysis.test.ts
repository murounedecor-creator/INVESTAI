import { describe, it, expect } from 'vitest';
import {
  corporateEventsAnalysis,
  type CorporateEvent,
  type CorporateEventsInput,
} from '@/src/agents/acoes-etfs/corporate-events-analysis';
import type { CalcResult } from '@/src/agents/acoes-etfs/calc-result';

const base: Omit<CorporateEventsInput, 'events'> = {
  reference_date: '2025-12-31',
  fundamentals_date: '2025-09-30',
};

function ev(
  effective_date: string,
  share_multiplier: number | null,
  kind: CorporateEvent['kind'] = 'SPLIT'
): CorporateEvent {
  return { kind, effective_date, share_multiplier };
}

function run(
  events: CorporateEvent[] | null,
  over: Partial<CorporateEventsInput> = {}
) {
  return corporateEventsAnalysis({ ...base, events, ...over });
}

function valueOf(r: CalcResult<number>): number {
  if (!r.ok) throw new Error('expected ok result');
  return r.value;
}

function failOf(r: CalcResult<number>) {
  if (r.ok) throw new Error('expected failure');
  return r;
}

function all(o: ReturnType<typeof corporateEventsAnalysis>) {
  return [o.events_in_window, o.split_adjustment_factor];
}

describe('corporateEventsAnalysis', () => {
  it('computes count and factor with trace', () => {
    const out = run([ev('2025-10-15', 2)]);
    expect(valueOf(out.events_in_window)).toBe(1);
    expect(valueOf(out.split_adjustment_factor)).toBe(2);
    const c = out.events_in_window;
    if (!c.ok) throw new Error('expected ok');
    expect(c.trace).toEqual({
      inputs: { fundamentals_date: '2025-09-30', events_total: 1 },
      formula:
        'events_in_window = count(events with ' +
        'fundamentals_date < effective_date <= reference_date)',
      reference_date: '2025-12-31',
    });
    const f = out.split_adjustment_factor;
    if (!f.ok) throw new Error('expected ok');
    expect(f.trace).toEqual({
      inputs: {
        fundamentals_date: '2025-09-30',
        events_in_window: 1,
        multipliers: '2',
      },
      formula:
        'split_adjustment_factor = product(share_multiplier ' +
        'of events in window)',
      reference_date: '2025-12-31',
    });
  });

  it('an empty list is proof of no events', () => {
    const out = run([]);
    expect(valueOf(out.events_in_window)).toBe(0);
    expect(valueOf(out.split_adjustment_factor)).toBe(1);
    const f = out.split_adjustment_factor;
    if (!f.ok) throw new Error('expected ok');
    expect(f.trace.inputs.multipliers).toBe('');
  });

  it('null events is MISSING_INPUT for both outputs', () => {
    const out = run(null);
    for (const r of all(out)) {
      expect(failOf(r)).toEqual({
        ok: false,
        reason: 'MISSING_INPUT',
        missing: ['events'],
      });
    }
  });

  it('a reverse split gives a factor below 1', () => {
    const out = run([ev('2025-10-15', 0.1, 'REVERSE_SPLIT')]);
    expect(valueOf(out.split_adjustment_factor)).toBeCloseTo(0.1);
  });

  it('a bonus gives a factor above 1', () => {
    const out = run([ev('2025-10-15', 1.1, 'BONUS')]);
    expect(valueOf(out.split_adjustment_factor)).toBeCloseTo(1.1);
  });

  it('two events multiply their factors', () => {
    const out = run([
      ev('2025-10-15', 2),
      ev('2025-11-15', 1.1, 'BONUS'),
    ]);
    expect(valueOf(out.events_in_window)).toBe(2);
    expect(valueOf(out.split_adjustment_factor)).toBeCloseTo(2.2);
    const f = out.split_adjustment_factor;
    if (!f.ok) throw new Error('expected ok');
    expect(f.trace.inputs.multipliers).toBe('2,1.1');
  });

  it('an event before the window is ignored', () => {
    const out = run([ev('2025-06-01', 2)]);
    expect(valueOf(out.events_in_window)).toBe(0);
    expect(valueOf(out.split_adjustment_factor)).toBe(1);
  });

  it('an event after reference_date is ignored', () => {
    const out = run([ev('2026-02-01', 2)]);
    expect(valueOf(out.events_in_window)).toBe(0);
    expect(valueOf(out.split_adjustment_factor)).toBe(1);
  });

  it('an event on fundamentals_date is excluded', () => {
    const out = run([ev('2025-09-30', 2)]);
    expect(valueOf(out.events_in_window)).toBe(0);
    expect(valueOf(out.split_adjustment_factor)).toBe(1);
  });

  it('an event on reference_date is included', () => {
    const out = run([ev('2025-12-31', 2)]);
    expect(valueOf(out.events_in_window)).toBe(1);
    expect(valueOf(out.split_adjustment_factor)).toBe(2);
  });

  it('a null multiplier in the window never becomes 1', () => {
    const out = run([ev('2025-10-15', null)]);
    expect(failOf(out.split_adjustment_factor)).toEqual({
      ok: false,
      reason: 'MISSING_INPUT',
      missing: ['events[0].share_multiplier'],
    });
    expect(valueOf(out.events_in_window)).toBe(1);
  });

  it('a null multiplier outside the window is ignored', () => {
    const out = run([ev('2025-06-01', null)]);
    expect(valueOf(out.events_in_window)).toBe(0);
    expect(valueOf(out.split_adjustment_factor)).toBe(1);
  });

  it('a bad multiplier is INVALID_INPUT for the factor', () => {
    for (const m of [0, -2, NaN, Infinity]) {
      const out = run([ev('2025-10-15', m)]);
      expect(failOf(out.split_adjustment_factor)).toEqual({
        ok: false,
        reason: 'INVALID_INPUT',
        missing: ['events[0].share_multiplier'],
      });
      expect(valueOf(out.events_in_window)).toBe(1);
    }
  });

  it('the error names the right event index', () => {
    const out = run([
      ev('2025-10-15', 2),
      ev('2025-11-15', -1),
    ]);
    const f = failOf(out.split_adjustment_factor);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual(['events[1].share_multiplier']);
  });

  it('an unreadable event date fails both outputs', () => {
    const out = run([ev('not-a-date', 2)]);
    for (const r of all(out)) {
      expect(failOf(r).reason).toBe('INVALID_INPUT');
      expect(failOf(r).missing).toEqual(['events[0].effective_date']);
    }
  });

  it('an unreadable reference_date fails both outputs', () => {
    const out = run([], { reference_date: 'not-a-date' });
    for (const r of all(out)) {
      expect(failOf(r).reason).toBe('INVALID_INPUT');
      expect(failOf(r).missing).toEqual(['reference_date']);
    }
  });

  it('an unreadable fundamentals_date fails both outputs', () => {
    const out = run([], { fundamentals_date: 'not-a-date' });
    for (const r of all(out)) {
      expect(failOf(r).reason).toBe('INVALID_INPUT');
      expect(failOf(r).missing).toEqual(['fundamentals_date']);
    }
  });

  it('fundamentals_date after reference_date fails both', () => {
    const out = run([], { fundamentals_date: '2026-01-01' });
    for (const r of all(out)) {
      expect(failOf(r).reason).toBe('INVALID_INPUT');
      expect(failOf(r).missing).toEqual(['fundamentals_date']);
    }
  });

  it('an unreadable date is reported before a null multiplier', () => {
    const out = run([ev('2025-10-15', null), ev('bad', 2)]);
    const f = failOf(out.split_adjustment_factor);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual(['events[1].effective_date']);
  });

  it('a null multiplier is reported before a bad one', () => {
    const out = run([
      ev('2025-10-15', null),
      ev('2025-11-15', -1),
    ]);
    const f = failOf(out.split_adjustment_factor);
    expect(f.reason).toBe('MISSING_INPUT');
    expect(f.missing).toEqual(['events[0].share_multiplier']);
  });

  it('a product that overflows is INVALID_INPUT', () => {
    const out = run([
      ev('2025-10-15', 1e200),
      ev('2025-11-15', 1e200),
    ]);
    const f = failOf(out.split_adjustment_factor);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual([
      'events[0].share_multiplier',
      'events[1].share_multiplier',
    ]);
  });

  it('a product that underflows to zero is INVALID_INPUT', () => {
    const out = run([
      ev('2025-10-15', 1e-200),
      ev('2025-11-15', 1e-200),
    ]);
    const f = failOf(out.split_adjustment_factor);
    expect(f.reason).toBe('INVALID_INPUT');
    expect(f.missing).toEqual([
      'events[0].share_multiplier',
      'events[1].share_multiplier',
    ]);
  });
});
