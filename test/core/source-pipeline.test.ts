import { describe, it, expect } from 'vitest';
import { executeSourcePipeline, type SourceStepHandlers } from '@/src/core/source-pipeline';

function makeHandlers(overrides: Partial<SourceStepHandlers> = {}): SourceStepHandlers {
  return {
    collect: async () => ({ ok: true, raw_bytes: new TextEncoder().encode('data'), error_message: null }),
    parse: (raw: Uint8Array) => ({ ok: true, parsed: { raw: raw.length }, error_message: null }),
    normalize: () => ({ normalization: 'OK' as const, normalized: {}, error_message: null }),
    ...overrides,
  };
}

describe('executeSourcePipeline', () => {
  it('produces effective result on success', async () => {
    const { result, detail } = await executeSourcePipeline('src1', 'NONE', makeHandlers());
    expect(result.collection_ok).toBe(true);
    expect(result.parse_ok).toBe(true);
    expect(result.normalization).toBe('OK');
    expect(result.raw_hash).not.toBeNull();
    expect(detail.failure_layer).toBe('NONE');
  });

  it('produces collection failure with raw_hash=null', async () => {
    const handlers = makeHandlers({
      collect: async () => ({ ok: false, raw_bytes: null, error_message: 'network error' }),
    });
    const { result, detail } = await executeSourcePipeline('src1', 'NONE', handlers);
    expect(result.collection_ok).toBe(false);
    expect(result.raw_hash).toBeNull();
    expect(result.normalization).toBe('NOT_RUN');
    expect(detail.failure_layer).toBe('COLLECTION');
  });

  it('produces parse failure with raw_hash present', async () => {
    const handlers = makeHandlers({
      parse: () => ({ ok: false, parsed: null, error_message: 'bad format' }),
    });
    const { result, detail } = await executeSourcePipeline('src1', 'NONE', handlers);
    expect(result.collection_ok).toBe(true);
    expect(result.parse_ok).toBe(false);
    expect(result.raw_hash).not.toBeNull();
    expect(result.normalization).toBe('NOT_RUN');
    expect(detail.failure_layer).toBe('PARSE');
  });

  it('produces normalization FATAL with raw_hash present', async () => {
    const handlers = makeHandlers({
      normalize: () => ({ normalization: 'FATAL' as const, normalized: null, error_message: 'bad data' }),
    });
    const { result, detail } = await executeSourcePipeline('src1', 'NONE', handlers);
    expect(result.normalization).toBe('FATAL');
    expect(result.raw_hash).not.toBeNull();
    expect(detail.failure_layer).toBe('NORMALIZATION');
  });

  it('produces normalization WARN (still effective)', async () => {
    const handlers = makeHandlers({
      normalize: () => ({ normalization: 'WARN' as const, normalized: {}, error_message: 'minor issue' }),
    });
    const { result } = await executeSourcePipeline('src1', 'NONE', handlers);
    expect(result.normalization).toBe('WARN');
  });
});
