import type { CollectOutput, ParseOutput, NormalizeOutput, SourceStepHandlers } from '@/src/core/source-pipeline';
import { parseDfpCsv, normalizeRevenueCost, type DfpRow, type NormalizeResult } from '@/src/core/dfp-parser';

function isDfpRows(x: unknown): x is DfpRow[] {
  return Array.isArray(x) && x.every((r) => typeof r === 'object' && r !== null && 'CD_CVM' in r);
}

export function toNormalizeOutput(r: NormalizeResult): NormalizeOutput {
  if (r.status === 'EXCLUDED') {
    return { normalization: 'FATAL', normalized: null, error_message: r.reason };
  }
  if (r.status === 'NOT_FOUND') {
    return { normalization: 'FATAL', normalized: null, error_message: 'EMPRESA_NAO_ENCONTRADA' };
  }
  if (!r.revenue.ok) {
    return { normalization: 'FATAL', normalized: null, error_message: 'RECEITA_INDISPONIVEL: ' + r.revenue.reason };
  }
  if (!r.cost.ok) {
    return {
      normalization: 'FATAL',
      normalized: null,
      error_message: 'CUSTO_INDISPONIVEL: ' + r.cost.reason,
    };
  }
  return {
    normalization: 'OK',
    normalized: { revenue: r.revenue.value, cost: r.cost.value },
    error_message: null,
  };
}

export function dfpDreHandlers(
  fetchBytes: () => Promise<Uint8Array | null>,
  cvmCode: string
): SourceStepHandlers {
  return {
    collect: async (): Promise<CollectOutput> => {
      const bytes = await fetchBytes();
      if (bytes === null) return { ok: false, raw_bytes: null, error_message: 'COLLECTION_FAILED' };
      return { ok: true, raw_bytes: bytes, error_message: null };
    },
    parse: (raw: Uint8Array): ParseOutput => {
      const p = parseDfpCsv(Buffer.from(raw).toString('latin1'));
      if (!p.ok) return { ok: false, parsed: null, error_message: p.reason };
      return { ok: true, parsed: p.rows, error_message: null };
    },
    normalize: (parsed: unknown): NormalizeOutput => {
      if (!isDfpRows(parsed)) {
        return { normalization: 'FATAL', normalized: null, error_message: 'FORMA_DE_DADOS_INVALIDA' };
      }
      return toNormalizeOutput(normalizeRevenueCost(parsed, cvmCode));
    },
  };
}
