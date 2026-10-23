import type { Theme } from './theme.ts';

// Системные цвета Apple (iOS 26). У источника хранится dark-значение,
// light подставляется при отрисовке в светлой теме.
export const PALETTE = [
  { dark: '#FF4245', light: '#FF383C' }, // red
  { dark: '#FF9230', light: '#FF8D28' }, // orange
  { dark: '#FFD600', light: '#FFCC00' }, // yellow
  { dark: '#30D158', light: '#34C759' }, // green
  { dark: '#00DAC3', light: '#00C8B3' }, // mint
  { dark: '#00D2E0', light: '#00C3D0' }, // teal
  { dark: '#3CD3FE', light: '#00C0E8' }, // cyan
  { dark: '#0091FF', light: '#0088FF' }, // blue
  { dark: '#6D7CFF', light: '#6155F5' }, // indigo
  { dark: '#DB34F2', light: '#CB30E0' }, // purple
  { dark: '#FF375F', light: '#FF2D55' }, // pink
  { dark: '#B78A66', light: '#AC7F5E' }, // brown
] as const;

const ACCENT = PALETTE[7];
const ACCENT_HOVER = { dark: '#0080E6', light: '#0077E0' };
const DANGER = PALETTE[0];
const SUCCESS = PALETTE[3];

const LIGHT_BY_DARK = new Map<string, string>(
  PALETTE.map((c) => [c.dark.toLowerCase(), c.light]),
);

export function isPaletteColor(hex: string): boolean {
  return LIGHT_BY_DARK.has(hex.toLowerCase());
}

/** Цвет источника для текущей темы. Пользовательские цвета не меняются. */
export function resolveColor(hex: string, theme: Theme): string {
  if (theme === 'dark') return hex;
  return LIGHT_BY_DARK.get(hex.toLowerCase()) ?? hex;
}

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

// Вызывать синхронно до первого рендера, иначе FOUC.
export function applyThemeColors(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.style.setProperty('--accent', ACCENT[theme]);
  root.style.setProperty('--accent-hover', ACCENT_HOVER[theme]);
  root.style.setProperty('--accent-rgb', hexToRgb(ACCENT[theme]));
  root.style.setProperty('--danger', DANGER[theme]);
  root.style.setProperty('--danger-rgb', hexToRgb(DANGER[theme]));
  root.style.setProperty('--success', SUCCESS[theme]);
}
