import { createSpeedMeter } from './parts/create-speed-meter.js';
import type { SpeedMeter } from './types/speed-meter.js';
import { renderProgressLine } from './parts/render-progress-line.js';
import { resolveColumns } from './parts/resolve-columns.js';
import type { ProgressBarOptions } from './types/progress-bar-options.js';
import type { ProgressBar } from './types/progress-bar.js';

const REDRAW_INTERVAL_MS = 100;
const CLEAR_LINE = '\r\x1b[K';
const ERASE_TO_END = '\x1b[K';

/**
 * Строка прогресса, перерисовываемая на месте (`\r` + строка + `\x1b[K`).
 * Таймеров нет: рисует только из `update`, поэтому после `clear` ничего не дорисовывает.
 * Новый `index` — скорость считается заново и строка рисуется сразу.
 */
export function createProgressBar({
  stream,
  now = () => performance.now(),
}: ProgressBarOptions): ProgressBar {
  let currentIndex: number | undefined;
  let lastDrawAt = 0;
  let drawn = false;
  let meter: SpeedMeter = createSpeedMeter(now);

  return {
    update: (index, count, { received, total }) => {
      const time = now();

      if (index === currentIndex && time - lastDrawAt < REDRAW_INTERVAL_MS) {
        return;
      }

      if (index !== currentIndex) {
        currentIndex = index;
        meter = createSpeedMeter(now);
      }

      meter.add(received);
      lastDrawAt = time;
      drawn = true;
      const state = { index, count, received, total, bytesPerSecond: meter.bytesPerSecond() };
      stream.write(`\r${renderProgressLine(state, resolveColumns(stream.columns))}${ERASE_TO_END}`);
    },
    clear: () => {
      currentIndex = undefined;

      if (!drawn) {
        return;
      }

      drawn = false;
      stream.write(CLEAR_LINE);
    },
  };
}
