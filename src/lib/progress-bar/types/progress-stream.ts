/** То, что нужно бару от `process.stderr`. */
export interface ProgressStream {
  /** Ширина терминала; нет — 80. */
  readonly columns?: number | undefined;
  write: (chunk: string) => unknown;
}
