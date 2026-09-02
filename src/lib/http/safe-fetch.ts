/**
 * Safe HTTP Fetch utility with bounded timeouts.
 * Enforces an 8000ms (8 seconds) maximum network execution boundary
 * to prevent serverless function hangs.
 */

export const DEFAULT_FETCH_TIMEOUT_MS = 8000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS
): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;

  return fetch(input, {
    ...init,
    signal,
  });
}
