import type { Measurement } from './measure-request/index.js';
import type { Summary } from './summarize.js';

/**
 * Строка по одному запросу: `Request  3/10: 123.4 ms, 1000000 B (1.00 MB), 64.83 Mbit/s`.
 * Скорость — байты этого запроса / его время; время 0 → 0.
 */
export function formatRequestLine(
  index: number,
  total: number,
  { ms, bytes }: Measurement,
): string {
  const number = String(index).padStart(String(total).length);
  const speed = formatMegabits(ms > 0 ? (bytes / ms) * 1000 : 0);

  return `Request ${number}/${total}: ${formatMs(ms)}, ${bytes} B (${formatMegabytes(bytes)}), ${speed}`;
}

/** Итоговый блок. Единицы десятичные: MB = 10^6 байт, Mbit = 10^6 бит. */
export function formatSummary({ averageMs, totalBytes, bytesPerSecond }: Summary): string {
  const mb = (bytesPerSecond / 1e6).toFixed(2);

  return [
    `Average time: ${formatMs(averageMs)}`,
    `Downloaded:   ${formatMegabytes(totalBytes)}`,
    `Speed:        ${formatMegabits(bytesPerSecond)} (${mb} MB/s)`,
  ].join('\n');
}

function formatMegabits(bytesPerSecond: number): string {
  return `${((bytesPerSecond * 8) / 1e6).toFixed(2)} Mbit/s`;
}

function formatMs(ms: number): string {
  return `${ms.toFixed(1)} ms`;
}

/** `1234567` → `1.23 MB`. */
export function formatMegabytes(bytes: number): string {
  return `${(bytes / 1e6).toFixed(2)} MB`;
}
