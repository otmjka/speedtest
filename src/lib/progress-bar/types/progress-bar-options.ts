import type { ProgressStream } from './progress-stream.js';

export interface ProgressBarOptions {
  stream: ProgressStream;
  /** Часы, мс. По умолчанию `performance.now`. */
  now?: () => number;
}
