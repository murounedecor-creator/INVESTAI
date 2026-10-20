import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseDfpCsv, normalizeRevenueCost } from '@/src/core/dfp-parser';

const sample = readFileSync(join(process.cwd(), 'test/cvm/fixtures/dfp-dre-sample.csv'), 'utf8');
const HEADER = sample.split('\n')[0];
const PETRO = '9512';
const BB = '1023';

function ok(text: string) {
  const r = parseDfpCsv(text);
  if (!r.ok) throw new Error('expected parse ok: ' + r.reason);
  return r.rows;
}

function line(version: number, value: string, exercise = 'ÚLTIMO') {
  return `00.000.000/0002-72;2023-12-31;${version};PETROBRAS;009512;DF Consolidado - Demonstração do Resultado;REAL;MIL;${exercise};2023-01-01;2023-12-31;3.01;Receita de Venda de Bens e/ou Serviços;${value};S`;
}

describe('parseDfpCsv', () => {
  it('accepts the verified header and reads 6 rows', () => {
    const r = parseDfpCsv(sample);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('expected ok');
    expect(r.rows).toHaveLength(6);
    expect(r.rows[0].CD_CONTA).toBe('3.01');
  });

  it('fails explicitly when a required column is missing', () => {
    const broken = sample.replace('CD_CONTA;', '');
    expect(parseDfpCsv(broken)).toEqual({ ok: false, reason: 'HEADER_INVALID', missing: ['CD_CONTA'] });
  });

  it('fails explicitly on an empty file', () => {
    expect(parseDfpCsv('')).toEqual({ ok: false, reason: 'EMPTY_FILE', missing: [] });
  });
});

describe('normalizeRevenueCost', () => {
  it('reads revenue and absolute cost for a non-financial company, with trace', () => {
    const r = normalizeRevenueCost(ok(sample), PETRO);
    expect(r.status).toBe('OK');
    if (r.status !== 'OK') throw new Error('expected OK');
    expect(r.revenue.ok).toBe(true);
    if (!r.revenue.ok) throw new Error('expected revenue ok');
    expect(r.revenue.value).toBe(511994000);
    expect(r.revenue.trace.inputs.scale).toBe('MIL');
    expect(r.revenue.trace.inputs.exercise).toBe('ULTIMO');
    expect(r.revenue.trace.reference_date).toBe('2023-12-31');
    expect(r.cost.ok).toBe(true);
    if (!r.cost.ok) throw new Error('expected cost ok');
    expect(r.cost.value).toBe(242061000);
    expect(r.cost.trace.inputs.sign_as_read).toBe(-242061000);
  });

  it('excludes a financial company with the declared reason', () => {
    const r = normalizeRevenueCost(ok(sample), BB);
    expect(r).toEqual({ status: 'EXCLUDED', reason: 'SETOR_FINANCEIRO_NAO_SUPORTADO', cvm_code: BB });
  });

  it('a missing sales revenue account gives MISSING_INPUT, never zero', () => {
    const noRevenue = sample
      .split('\n')
      .filter((l) => !(l.includes(';009512;') && l.includes(';3.01;')))
      .join('\n');
    const r = normalizeRevenueCost(ok(noRevenue), PETRO);
    if (r.status !== 'OK') throw new Error('expected OK');
    expect(r.revenue.ok).toBe(false);
    if (r.revenue.ok) throw new Error('expected failure');
    expect(r.revenue.reason).toBe('MISSING_INPUT');
    expect(r.revenue.missing).toEqual(['receita_venda_3.01']);
  });

  it('uses the latest VERSAO for the same company and date', () => {
    const text = [HEADER, line(1, '100.0000000000'), line(2, '200.0000000000')].join('\n');
    const r = normalizeRevenueCost(ok(text), PETRO);
    if (r.status !== 'OK') throw new Error('expected OK');
    if (!r.revenue.ok) throw new Error('expected revenue ok');
    expect(r.revenue.value).toBe(200);
  });

  it('a non-numeric VL_CONTA gives INVALID_INPUT', () => {
    const text = [HEADER, line(1, 'abc')].join('\n');
    const r = normalizeRevenueCost(ok(text), PETRO);
    if (r.status !== 'OK') throw new Error('expected OK');
    expect(r.revenue.ok).toBe(false);
    if (r.revenue.ok) throw new Error('expected failure');
    expect(r.revenue.reason).toBe('INVALID_INPUT');
  });

  it('with only PENULTIMO rows, it does not mix exercises', () => {
    const text = [HEADER, line(1, '100.0000000000', 'PENÚLTIMO')].join('\n');
    const r = normalizeRevenueCost(ok(text), PETRO);
    if (r.status !== 'OK') throw new Error('expected OK');
    expect(r.revenue.ok).toBe(false);
    if (r.revenue.ok) throw new Error('expected failure');
    expect(r.revenue.reason).toBe('MISSING_INPUT');
  });
});
