/** Полоса `[████░░░░]` шириной `width` символов внутри скобок. */
export function renderBar(ratio: number, width: number): string {
  const filled = Math.round(ratio * width);

  return `[${'█'.repeat(filled)}${'░'.repeat(width - filled)}]`;
}
