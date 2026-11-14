import type { Measurement } from './measure-request/index.js';
import type { Summary } from './summarize.js';

/** Строка по одному запросу: `Request  3/10: 123.4 ms, 1000000 B (1.00 MB)`. */
export function formatRequestLine(
  index: number,
  total: number,
  { ms, bytes }: Measurement,
): string {
  const number = String(index).padStart(String(total).length);

  return `Request ${number}/${total}: ${formatMs(ms)}, ${bytes} B (${formatMegabytes(bytes)})`;
}

/** Итоговый блок. Единицы десятичные: MB = 10^6 байт, Mbit = 10^6 бит. */
export function formatSummary({ averageMs, totalBytes, bytesPerSecond }: Summary): string {
  const mbit = ((bytesPerSecond * 8) / 1e6).toFixed(2);
  const mb = (bytesPerSecond / 1e6).toFixed(2);

  return [
    `Average time: ${formatMs(averageMs)}`,
    `Downloaded:   ${formatMegabytes(totalBytes)}`,
    `Speed:        ${mbit} Mbit/s (${mb} MB/s)`,
  ].join('\n');
}

function formatMs(ms: number): string {
  return `${ms.toFixed(1)} ms`;
}

function formatMegabytes(bytes: number): string {
  return `${(bytes / 1e6).toFixed(2)} MB`;
}
