import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { executeSourcePipeline } from '@/src/core/source-pipeline';
import { dfpDreHandlers } from '@/src/core/dfp-source';

const utf8 = readFileSync(join(process.cwd(), 'test/cvm/fixtures/dfp-dre-sample.csv'), 'utf8');
const latin1Bytes = new Uint8Array(Buffer.from(utf8, 'latin1'));
const PETRO = '9512';
const BB = '1023';

describe('dfpDreHandlers via executeSourcePipeline', () => {
  it('a valid non-financial company is effective, with a 64-char raw_hash', async () => {
    const h = dfpDreHandlers(async () => latin1Bytes, PETRO);
    const { result } = await executeSourcePipeline('cvm_dfp_dre', null, h);
    expect(result.collection_ok).toBe(true);
    expect(result.parse_ok).toBe(true);
    expect(result.normalization).toBe('OK');
    expect(result.raw_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('normalized output carries revenue and absolute cost', async () => {
    const h = dfpDreHandlers(async () => latin1Bytes, PETRO);
    const parsed = await h.parse(latin1Bytes);
    if (!parsed.ok) throw new Error('expected parse ok');
    const out = await h.normalize(parsed.parsed);
    expect(out.normalization).toBe('OK');
    expect(out.normalized).toEqual({ revenue: 511994000, cost: 242061000 });
  });

  it('a financial company is FATAL with the declared reason, never a number', async () => {
    const h = dfpDreHandlers(async () => latin1Bytes, BB);
    const { result, detail } = await executeSourcePipeline('cvm_dfp_dre', null, h);
    expect(result.parse_ok).toBe(true);
    expect(result.normalization).toBe('FATAL');
    expect(detail.error_message).toBe('SETOR_FINANCEIRO_NAO_SUPORTADO');
  });

  it('a collection failure gives collection_ok false and raw_hash null', async () => {
    const h = dfpDreHandlers(async () => null, PETRO);
    const { result } = await executeSourcePipeline('cvm_dfp_dre', null, h);
    expect(result.collection_ok).toBe(false);
    expect(result.raw_hash).toBeNull();
    expect(result.normalization).toBe('NOT_RUN');
  });

  it('bytes with a broken header are a parse failure, but the hash of received bytes is kept', async () => {
    const bad = new Uint8Array(Buffer.from('CD;X\n1;2', 'latin1'));
    const h = dfpDreHandlers(async () => bad, PETRO);
    const { result } = await executeSourcePipeline('cvm_dfp_dre', null, h);
    expect(result.collection_ok).toBe(true);
    expect(result.parse_ok).toBe(false);
    expect(result.raw_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.normalization).toBe('NOT_RUN');
  });
});

describe('a missing cost is not effective (Constitution 15 and 16)', () => {
  it('a missing cost makes normalization FATAL, never WARN', async () => {
    const noCost = utf8
      .split('\n')
      .filter((l) => !(l.includes(';009512;') && l.includes(';3.02;')))
      .join('\n');
    const h = dfpDreHandlers(async () => new Uint8Array(Buffer.from(noCost, 'latin1')), PETRO);
    const { result } = await executeSourcePipeline('cvm_dfp_dre', null, h);
    expect(result.normalization).toBe('FATAL');
  });
});
