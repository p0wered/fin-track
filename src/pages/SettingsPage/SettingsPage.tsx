import { useRef, useState } from 'react';
import { m } from 'motion/react';
import { Moon, Sun, Download, Upload, Check } from 'lucide-react';
import { useSettings } from '../../settings/SettingsContext.tsx';
import { LANGS } from '../../i18n/translations.ts';
import type { Lang } from '../../i18n/translations.ts';
import type { Theme } from '../../theme/theme.ts';
import { downloadBackup, parseBackup } from '../../settings/backup.ts';
import type { BackupData } from '../../settings/backup.ts';
import styles from './SettingsPage.module.css';

interface Props {
  data: BackupData;
  onImport: (data: BackupData) => void;
}

const EASE = [0.4, 0, 0.2, 1] as const;

const THEME_OPTIONS: { id: Theme; labelKey: 'settings.theme.light' | 'settings.theme.dark'; Icon: typeof Sun }[] = [
  { id: 'light', labelKey: 'settings.theme.light', Icon: Sun },
  { id: 'dark', labelKey: 'settings.theme.dark', Icon: Moon },
];

export default function SettingsPage({ data, onImport }: Props) {
  const { t, theme, setTheme, lang, setLang } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const themeIndex = THEME_OPTIONS.findIndex((o) => o.id === theme);
  const langIndex = LANGS.findIndex((l) => l.id === lang);

  const handleExport = () => {
    downloadBackup(data);
  };

  const handleImportClick = () => {
    fileRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // позволяем повторно выбрать тот же файл
    if (!file) return;

    try {
      const parsed = parseBackup(await file.text());
      onImport(parsed);
      setStatus({ ok: true, text: t('settings.importSuccess') });
    } catch {
      setStatus({ ok: false, text: t('settings.importError') });
    }
  };

  return (
    <div className={styles.page}>
      <m.h1
        className={styles.title}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
      >
        {t('settings.title')}
      </m.h1>

      <m.section
        className={styles.section}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.12 }}
      >
        <h2 className={styles.sectionTitle}>{t('settings.appearance')}</h2>
        <div className={`${styles.group} glass`}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>{t('settings.theme')}</span>
            <div className={styles.segmented} role="group" aria-label={t('settings.theme')}>
              <span
                className={styles.thumb}
                style={{ '--count': THEME_OPTIONS.length, '--index': themeIndex } as React.CSSProperties}
                aria-hidden
              />
              {THEME_OPTIONS.map(({ id, labelKey, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={styles.segment}
                  aria-pressed={theme === id}
                  onClick={() => setTheme(id)}
                >
                  <Icon size={16} strokeWidth={1.8} aria-hidden />
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.rowLabel}>{t('settings.language')}</span>
            <div className={styles.segmented} role="group" aria-label={t('settings.language')}>
              <span
                className={styles.thumb}
                style={{ '--count': LANGS.length, '--index': langIndex } as React.CSSProperties}
                aria-hidden
              />
              {LANGS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={styles.segment}
                  aria-pressed={lang === id}
                  onClick={() => setLang(id as Lang)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </m.section>

      <m.section
        className={styles.section}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.19 }}
      >
        <h2 className={styles.sectionTitle}>{t('settings.data')}</h2>
        <div className={`${styles.group} glass`}>
          <button type="button" className={`${styles.row} ${styles.action}`} onClick={handleExport}>
            <Download size={20} strokeWidth={1.8} aria-hidden />
            {t('settings.export')}
          </button>
          <button type="button" className={`${styles.row} ${styles.action}`} onClick={handleImportClick}>
            <Upload size={20} strokeWidth={1.8} aria-hidden />
            {t('settings.import')}
          </button>
        </div>
        <p className={styles.footer}>{t('settings.dataDesc')}</p>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className={styles.fileInput}
          onChange={handleFile}
        />

        {status && (
          <m.p
            key={status.text}
            className={`${styles.status} ${status.ok ? styles.statusOk : styles.statusError}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            {status.ok && <Check size={15} strokeWidth={2.2} aria-hidden />}
            {status.text}
          </m.p>
        )}
      </m.section>
    </div>
  );
}
