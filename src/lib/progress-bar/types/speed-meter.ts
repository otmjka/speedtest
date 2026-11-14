export interface SpeedMeter {
  /** Сэмпл: сколько байт получено к текущему моменту. */
  add: (received: number) => void;
  /** Скорость за последние `windowMs`; пока данных меньше — за фактический интервал. */
  bytesPerSecond: () => number;
}
