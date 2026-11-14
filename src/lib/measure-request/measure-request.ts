import { createIdleTimer } from './parts/create-idle-timer.js';
import { describeError } from './parts/describe-error.js';
import { parseContentLength } from './parts/parse-content-length.js';
import { readBodyBytes } from './parts/read-body-bytes.js';
import type { MeasureOptions, Measurement } from './types.js';

const DEFAULT_IDLE_TIMEOUT_MS = 30_000;

const REQUEST_HEADERS = {
  'Cache-Control': 'no-cache',
  // Иначе fetch распакует gzip, и посчитаем не те байты, что пришли по сети.
  'Accept-Encoding': 'identity',
} as const;

/**
 * Один GET с полным чтением тела. Идёт по редиректам, меряет финальный ответ.
 * Время — от вызова `fetch` до последнего байта (в первый запрос входят DNS/TCP/TLS).
 *
 * @throws Error с причиной одной строкой: сеть/DNS/TLS, не-2xx, обрыв тела,
 *         петля редиректов, `idleTimeoutMs` без данных.
 */
export async function measureRequest(url: URL, options: MeasureOptions = {}): Promise<Measurement> {
  const timer = createIdleTimer(options.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS);
  const started = performance.now();

  try {
    const response = await fetch(url, {
      headers: REQUEST_HEADERS,
      redirect: 'follow',
      signal: timer.signal,
    });
    timer.touch();

    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`HTTP ${response.status} ${response.statusText}`.trimEnd());
    }

    const total = parseContentLength(response.headers);
    const { onProgress } = options;
    onProgress?.({ received: 0, total });

    const bytes = await readBodyBytes(response.body, (received) => {
      timer.touch();
      onProgress?.({ received, total });
    });

    return { ms: performance.now() - started, bytes };
  } catch (error) {
    throw new Error(describeError(error), { cause: error });
  } finally {
    timer.clear();
  }
}
