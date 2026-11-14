export interface IdleTimer {
  readonly signal: AbortSignal;
  /** Перезапустить отсчёт — пришли данные. */
  touch: () => void;
  clear: () => void;
}

/** Обрывает запрос, если `ms` мс не было ни заголовков, ни данных. */
export function createIdleTimer(ms: number): IdleTimer {
  const controller = new AbortController();
  const reason = new Error(`timeout: no data for ${ms / 1000} s`);
  let timer: NodeJS.Timeout | undefined;

  const touch = (): void => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      controller.abort(reason);
    }, ms);
  };

  touch();

  return {
    signal: controller.signal,
    touch,
    clear: () => {
      clearTimeout(timer);
    },
  };
}
