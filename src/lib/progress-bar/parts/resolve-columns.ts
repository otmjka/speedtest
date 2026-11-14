const DEFAULT_COLUMNS = 80;

/** Ширина терминала; нет или 0 (pty без размера) → 80. */
export function resolveColumns(columns: number | undefined): number {
  if (columns === undefined || columns <= 0) {
    return DEFAULT_COLUMNS;
  }

  return columns;
}
