import { m } from 'motion/react';
import { Wallet, BarChart3 } from 'lucide-react';
import styles from './TabBar.module.css';

export type TabId = 'main' | 'dynamics';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; Icon: typeof Wallet }[] = [
  { id: 'main', label: 'Баланс', Icon: Wallet },
  { id: 'dynamics', label: 'Динамика', Icon: BarChart3 },
];

export default function TabBar({ activeTab, onTabChange }: Props) {
  return (
    <m.nav
      className={styles.bar}
      role="tablist"
      aria-label="Навигация по разделам"
      initial={{ x: '-50%', y: 24, opacity: 0 }}
      animate={{ x: '-50%', y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
    >
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          aria-label={label}
          className={`${styles.item} ${activeTab === id ? styles.active : ''}`}
          onClick={() => onTabChange(id)}
        >
          <Icon className={styles.icon} size={26} strokeWidth={1.5} aria-hidden />
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </m.nav>
  );
}
