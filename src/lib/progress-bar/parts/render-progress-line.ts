import { formatMegabytes } from '../../format-report.js';
import type { ProgressLineState } from '../types/progress-line-state.js';
import { fitToWidth } from './fit-to-width.js';
import { renderBar } from './render-bar.js';

const BAR_WIDTH = 10;

/**
 * Строка прогресса под ширину терминала:
 * `Request  3/10 [█████░░░░░]  50%   7.34 / 14.68 MB  62.0 Mbit/s`.
 * Полоса — 10 символов. Размер неизвестен — без полосы и процента. Не влезает — без полосы.
 * Последняя колонка не занимается, чтобы терминал не перенёс курсор на новую строку.
 */
export function renderProgressLine(state: ProgressLineState, columns: number): string {
  const { index, count, received, total, bytesPerSecond } = state;
  const head = `Request ${String(index).padStart(String(count).length)}/${count}`;
  const speed = `${((bytesPerSecond * 8) / 1e6).toFixed(1)} Mbit/s`;
  const available = columns - 1;

  if (total === undefined) {
    return fitToWidth(`${head}  ${formatMegabytes(received)}  ${speed}`, available);
  }

  const ratio = total > 0 ? Math.min(received / total, 1) : 1;
  const percent = `${Math.floor(ratio * 100)}%`.padStart(4);
  const totalText = formatMegabytes(total);
  // Выравниваем скачанное по ширине итога, чтобы полоса не прыгала на 9.99 → 10.00 MB.
  const receivedText = (received / 1e6).toFixed(2).padStart(totalText.length - ' MB'.length);
  const tail = `${percent}  ${receivedText} / ${totalText}  ${speed}`;
  const withBar = `${head} ${renderBar(ratio, BAR_WIDTH)} ${tail}`;

  if (withBar.length > available) {
    return fitToWidth(`${head}  ${tail}`, available);
  }

  return withBar;
}
