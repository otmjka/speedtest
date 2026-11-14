import type { Measurement } from './measure-request/index.js';

export interface Summary {
  count: number;
  /** Среднее время запроса, мс. */
  averageMs: number;
  totalBytes: number;
  /** Все байты / сумма времён. Время 0 → 0. */
  bytesPerSecond: number;
}

/** Итог по замерам. Скорость = все байты / сумма времён (а не среднее скоростей). */
export function summarize(measurements: readonly Measurement[]): Summary {
  const count = measurements.length;
  const totalMs = measurements.reduce((sum, { ms }) => sum + ms, 0);
  const totalBytes = measurements.reduce((sum, { bytes }) => sum + bytes, 0);

  return {
    count,
    averageMs: count > 0 ? totalMs / count : 0,
    totalBytes,
    bytesPerSecond: totalMs > 0 ? (totalBytes / totalMs) * 1000 : 0,
  };
}
