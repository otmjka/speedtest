import { measureRequest } from './measure-request/index.js';
import type { Measurement, MeasureOptions } from './measure-request/index.js';

export const REQUEST_COUNT = 10;

export interface RunOptions extends MeasureOptions {
  /** Сколько запросов. По умолчанию `REQUEST_COUNT`. */
  count?: number;
  /** Вызывается после каждого успешного запроса; `index` с 1. */
  onResult?: (index: number, measurement: Measurement) => void;
}

/** Запрос номер `index` (с 1) упал; `reason` — причина одной строкой. */
export class RequestFailedError extends Error {
  constructor(
    readonly index: number,
    readonly reason: string,
    options?: ErrorOptions,
  ) {
    super(`Request ${index} failed: ${reason}`, options);
    this.name = 'RequestFailedError';
  }
}

/**
 * `count` последовательных замеров `url`: следующий — только после полного тела предыдущего.
 *
 * @throws RequestFailedError на первом упавшем запросе; остальные не выполняются.
 */
export async function runMeasurements(url: URL, options: RunOptions = {}): Promise<Measurement[]> {
  const { count = REQUEST_COUNT, onResult, ...measureOptions } = options;
  const results: Measurement[] = [];

  for (let index = 1; index <= count; index += 1) {
    const measurement = await measureRequest(url, measureOptions).catch((error: unknown) => {
      const reason = error instanceof Error ? error.message : String(error);
      throw new RequestFailedError(index, reason, { cause: error });
    });
    results.push(measurement);
    onResult?.(index, measurement);
  }

  return results;
}
