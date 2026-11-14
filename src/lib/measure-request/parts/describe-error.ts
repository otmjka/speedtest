/**
 * Причина падения одной строкой. `fetch` прячет суть в `cause`:
 * `fetch failed (getaddrinfo ENOTFOUND host)`, `terminated (other side closed)`.
 */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  if (error.cause instanceof Error) {
    return `${error.message} (${error.cause.message})`;
  }

  return error.message;
}
