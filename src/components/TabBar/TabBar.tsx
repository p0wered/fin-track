import { Wallet, ChartColumn, Settings2 } from 'lucide-react';
import { TabBar as GlassTabBar } from '../../glisse/index.ts';
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

  return (
    <GlassTabBar
      className={styles.bar}
      aria-label={t('nav.label')}
      items={TABS.map(({ id, labelKey, Icon }) => ({
        value: id,
        label: t(labelKey),
        icon: <Icon strokeWidth={1.75} />,
      }))}
      value={activeTab}
      onValueChange={(value) => onTabChange(value as TabId)}
    />
  );
}
