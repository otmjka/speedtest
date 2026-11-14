/** Обрезает строку до `width` символов; ширина ≤ 0 → пустая строка. */
export function fitToWidth(line: string, width: number): string {
  return line.slice(0, Math.max(width, 0));
}
