/**
 * Safe AI execution wrapper with bounded timeouts.
 * Enforces an 8000ms maximum execution boundary for LLM/vision inference.
 */

export const DEFAULT_AI_TIMEOUT_MS = 8000;

export async function runWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_AI_TIMEOUT_MS
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`AI execution timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
