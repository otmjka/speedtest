import type { SpeedMeter } from '../types/speed-meter.js';

interface Sample {
  time: number;
  received: number;
}

/**
 * Текущая скорость по скользящему окну. Базой берётся последний сэмпл не позже
 * `now - windowMs`, поэтому старые быстрые/медленные участки не размывают значение.
 */
export function createSpeedMeter(now: () => number, windowMs = 1000): SpeedMeter {
  const samples: Sample[] = [];

  return {
    add: (received) => {
      const time = now();
      samples.push({ time, received });

      for (let next = samples[1]; next && next.time <= time - windowMs; next = samples[1]) {
        samples.shift();
      }
    },
    bytesPerSecond: () => {
      const first = samples[0];
      const last = samples.at(-1);

      if (!first || !last || last.time <= first.time) {
        return 0;
      }

      return ((last.received - first.received) / (last.time - first.time)) * 1000;
    },
  };
}
