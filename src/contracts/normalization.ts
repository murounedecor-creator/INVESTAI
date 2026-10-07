export type NormalizationState = 'OK' | 'WARN' | 'FATAL' | 'NOT_RUN';

/**
 * FailureLayer is an INTERNAL implementation type.
 * It does NOT belong to the frozen SourceResult contract.
 * Used in SourceExecutionDetail to track where in the pipeline a failure occurred.
 */
export type FailureLayer = 'NONE' | 'COLLECTION' | 'PARSE' | 'NORMALIZATION';
