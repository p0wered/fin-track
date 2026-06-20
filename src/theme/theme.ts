export type Theme = 'dark' | 'light';

const THEME_KEY = 'fin-track-theme';

export function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return raw === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* приватный режим / квота — игнорируем */
  }
}

/**
 * Применяет тему к корню документа. Вызывать синхронно до первого рендера,
 * чтобы избежать FOUC. CSS-переменные поверхностей переключаются через
 * атрибут [data-theme] в index.css.
 */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}
