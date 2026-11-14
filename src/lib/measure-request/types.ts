export interface Measurement {
  /** От отправки запроса до последнего байта тела. */
  ms: number;
  /** Реально полученные байты тела. */
  bytes: number;
}

export interface DownloadProgress {
  /** Сколько байт тела уже получено. */
  received: number;
  /** Ожидаемый размер из `Content-Length`; `undefined` — неизвестен. */
  total: number | undefined;
}

export interface MeasureOptions {
  /** Сколько ждать следующую порцию данных (или заголовки), мс. По умолчанию 30 000. */
  idleTimeoutMs?: number;
  /** После заголовков (`received = 0`) и на каждый чанк тела. */
  onProgress?: (progress: DownloadProgress) => void;
}
