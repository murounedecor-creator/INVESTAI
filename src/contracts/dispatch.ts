export type DispatchState = 'DISPATCHED' | 'CANCELLED' | 'NOT_DISPATCHED';

/**
 * DispatchReason is typed as string to avoid freezing invented values.
 * The runtime produces descriptive string values (e.g. "MAX_DISPATCHES_REACHED",
 * "GLOBAL_TIMEOUT") but these are NOT frozen as a union type.
 *
 * "TO_SPECIFY" is a specification status, NOT a runtime value.
 * The runtime must NEVER produce the string "TO_SPECIFY".
 */
export type DispatchReason = string;
