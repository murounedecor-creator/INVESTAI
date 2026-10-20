import { calcOk, calcFail, type CalcResult } from '@/src/agents/acoes-etfs/calc-result';
import type { CalcTrace } from '@/src/agents/acoes-etfs/calc-result';

export const EXPECTED_HEADER = [
  'CNPJ_CIA', 'DT_REFER', 'VERSAO', 'DENOM_CIA', 'CD_CVM', 'GRUPO_DFP',
  'MOEDA', 'ESCALA_MOEDA', 'ORDEM_EXERC', 'DT_INI_EXERC', 'DT_FIM_EXERC',
  'CD_CONTA', 'DS_CONTA', 'VL_CONTA', 'ST_CONTA_FIXA',
] as const;

export type DfpColumn = (typeof EXPECTED_HEADER)[number];
export type DfpRow = Record<DfpColumn, string>;

export type ParseResult =
  | { ok: true; rows: DfpRow[] }
  | { ok: false; reason: 'EMPTY_FILE' | 'HEADER_INVALID' | 'ROW_INVALID'; missing: string[] };

export function parseDfpCsv(text: string): ParseResult {
  if (text.trim() === '') return { ok: false, reason: 'EMPTY_FILE', missing: [] };
  const lines = text.split('\n').map((l) => l.replace(/\r$/, ''));
  const header = lines[0].split(';').map((h) => h.trim());
  const missing: string[] = EXPECTED_HEADER.filter((c) => !header.includes(c));
  if (missing.length > 0) return { ok: false, reason: 'HEADER_INVALID', missing };
  const rows: DfpRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    const cells = lines[i].split(';');
    if (cells.length !== header.length) {
      return { ok: false, reason: 'ROW_INVALID', missing: [String(i + 1)] };
    }
    const row: Record<string, string> = {};
    header.forEach((name, j) => {
      row[name] = cells[j];
    });
    rows.push(row as DfpRow);
  }
  return { ok: true, rows };
}

function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function amount(raw: string): number | null {
  if (raw.trim() === '') return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null;
}

export type NormalizeResult =
  | { status: 'EXCLUDED'; reason: 'SETOR_FINANCEIRO_NAO_SUPORTADO'; cvm_code: string }
  | { status: 'NOT_FOUND'; cvm_code: string }
  | { status: 'OK'; revenue: CalcResult<number>; cost: CalcResult<number> };

export function normalizeRevenueCost(rows: DfpRow[], cvmCode: string): NormalizeResult {
  const target = Number(cvmCode);
  const company = rows.filter((r) => Number(r.CD_CVM) === target);
  if (company.length === 0) return { status: 'NOT_FOUND', cvm_code: cvmCode };

  const isFinancial = company.some(
    (r) => r.CD_CONTA === '3.01' && norm(r.DS_CONTA).includes('intermediacao financeira')
  );
  if (isFinancial) {
    return { status: 'EXCLUDED', reason: 'SETOR_FINANCEIRO_NAO_SUPORTADO', cvm_code: cvmCode };
  }

  const current = company.filter((r) => norm(r.ORDEM_EXERC) === 'ultimo');
  if (current.length === 0) {
    return {
      status: 'OK',
      revenue: calcFail('MISSING_INPUT', ['exercicio_ULTIMO']),
      cost: calcFail('MISSING_INPUT', ['exercicio_ULTIMO']),
    };
  }

  const dates = current.map((r) => r.DT_REFER).sort();
  const latestDate = dates[dates.length - 1];
  const dated = current.filter((r) => r.DT_REFER === latestDate);
  const maxVersion = Math.max(...dated.map((r) => Number(r.VERSAO)));
  const chosen = dated.filter((r) => Number(r.VERSAO) === maxVersion);

  const scale = chosen[0].ESCALA_MOEDA;
  const trace = (value: number, formula: string): CalcTrace => ({
    inputs: { scale, exercise: 'ULTIMO', sign_as_read: value },
    formula,
    reference_date: latestDate,
  });

  const revRow = chosen.find(
    (r) => r.CD_CONTA === '3.01' && norm(r.DS_CONTA) === 'receita de venda de bens e/ou servicos'
  );
  let revenue: CalcResult<number>;
  if (!revRow) {
    revenue = calcFail('MISSING_INPUT', ['receita_venda_3.01']);
  } else {
    const v = amount(revRow.VL_CONTA);
    revenue =
      v === null
        ? calcFail('INVALID_INPUT', ['receita_venda_3.01'])
        : calcOk(v, trace(v, 'receita = conta 3.01 (venda de bens e/ou servicos)'));
  }

  const costRow = chosen.find((r) => r.CD_CONTA === '3.02');
  let cost: CalcResult<number>;
  if (!costRow) {
    cost = calcFail('MISSING_INPUT', ['custo_3.02']);
  } else {
    const v = amount(costRow.VL_CONTA);
    cost =
      v === null
        ? calcFail('INVALID_INPUT', ['custo_3.02'])
        : calcOk(Math.abs(v), trace(v, 'custo = |conta 3.02|'));
  }

  return { status: 'OK', revenue, cost };
}
