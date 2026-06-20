import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { applyTheme, loadTheme, saveTheme } from '../theme/theme.ts';
import type { Theme } from '../theme/theme.ts';
import { LOCALE, translations } from '../i18n/translations.ts';
import type { Lang, TranslationKey } from '../i18n/translations.ts';

const LANG_KEY = 'fin-track-lang';

function loadLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'ru';
  } catch {
    return 'ru';
  }
}

interface SettingsValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  locale: string;
  t: (key: TranslationKey) => string;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(loadTheme);
  const [lang, setLangState] = useState<Lang>(loadLang);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    saveTheme(next);
    applyTheme(next);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* игнорируем недоступность storage */
    }
    document.documentElement.lang = next;
  }, []);

  const t = useCallback((key: TranslationKey) => translations[lang][key], [lang]);

  const value = useMemo<SettingsValue>(
    () => ({ theme, setTheme, lang, setLang, locale: LOCALE[lang], t }),
    [theme, setTheme, lang, setLang, t],
  );

  return <SettingsContext value={value}>{children}</SettingsContext>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
