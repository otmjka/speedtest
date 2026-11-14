export interface Measurement {
  /** От отправки запроса до последнего байта тела. */
  ms: number;
  /** Реально полученные байты тела. */
  bytes: number;
}

export interface MeasureOptions {
  /** Сколько ждать следующую порцию данных (или заголовки), мс. По умолчанию 30 000. */
  idleTimeoutMs?: number;
}
