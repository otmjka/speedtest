export interface ProgressLineState {
  /** Номер запроса, с 1. */
  index: number;
  /** Всего запросов. */
  count: number;
  received: number;
  /** Ожидаемый размер; `undefined` — неизвестен, строка без полосы и процента. */
  total: number | undefined;
  bytesPerSecond: number;
}
