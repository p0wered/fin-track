export const PALETTE = [
  '#6C63FF',
  '#1671ef',
  '#41a141',
  '#FFA726',
  '#EF5350',
  '#AB47BC',
  '#26C6DA',
  '#EC407A',
  '#8D6E63',
  '#78909C',
  '#ffdd2d',
  '#9368e1',
] as const;

export const ACCENT = PALETTE[2];
export const ACCENT_HOVER = '#348734';
export const DANGER = PALETTE[4];

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

// Вызывать синхронно до первого рендера, иначе FOUC.
export function applyThemeColors(root: HTMLElement = document.documentElement): void {
  root.style.setProperty('--accent', ACCENT);
  root.style.setProperty('--accent-hover', ACCENT_HOVER);
  root.style.setProperty('--accent-rgb', hexToRgb(ACCENT));
  root.style.setProperty('--danger', DANGER);
  root.style.setProperty('--danger-rgb', hexToRgb(DANGER));
}
