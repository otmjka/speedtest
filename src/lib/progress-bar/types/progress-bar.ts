import type { DownloadProgress } from '../../measure-request/index.js';

export interface ProgressBar {
  /** Новые данные запроса `index` из `count`. Рисует не чаще раза в 100 мс. */
  update: (index: number, count: number, progress: DownloadProgress) => void;
  /** Стирает строку прогресса. Звать перед любым выводом в терминал. */
  clear: () => void;
}
