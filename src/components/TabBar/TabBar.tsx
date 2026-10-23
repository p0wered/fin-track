import { m } from 'motion/react';
import { Wallet, ChartColumn, Settings2 } from 'lucide-react';
import { useSettings } from '../../settings/SettingsContext.tsx';
import type { TranslationKey } from '../../i18n/translations.ts';
import styles from './TabBar.module.css';

export type TabId = 'main' | 'dynamics' | 'settings';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; labelKey: TranslationKey; Icon: typeof Wallet }[] = [
  { id: 'main', labelKey: 'tab.balance', Icon: Wallet },
  { id: 'dynamics', labelKey: 'tab.dynamics', Icon: ChartColumn },
  { id: 'settings', labelKey: 'tab.settings', Icon: Settings2 },
];

export default function TabBar({ activeTab, onTabChange }: Props) {
  const { t } = useSettings();

  const activeIndex = TABS.findIndex((tab) => tab.id === activeTab);

  return (
    <m.nav
      className={styles.bar}
      role="tablist"
      aria-label={t('nav.label')}
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
    >
      <span
        className={styles.thumb}
        style={{ '--count': TABS.length, '--index': activeIndex } as React.CSSProperties}
        aria-hidden
      />
      {TABS.map(({ id, labelKey, Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          className={`${styles.item} ${activeTab === id ? styles.active : ''}`}
          onClick={() => onTabChange(id)}
        >
          <Icon className={styles.icon} size={24} strokeWidth={1.75} aria-hidden />
          <span className={styles.label}>{t(labelKey)}</span>
        </button>
      ))}
    </m.nav>
  );
}
