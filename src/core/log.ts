/**
 * Server-side error log (pendency 8).
 * Never import from the Mobile bundle. Never log request bodies or secrets.
 * Prints name and message only (no stack) as one JSON line.
 */
export function logServerError(
  context: string,
  err: unknown,
  write: (line: string) => void = (line) => console.error(line)
): void {
  const name = err instanceof Error ? err.name : 'NonError';
  const message = err instanceof Error ? err.message : String(err);
  write(
    JSON.stringify({
      level: 'error',
      context,
      name,
      message,
      at: new Date().toISOString(),
    })
  );
}
