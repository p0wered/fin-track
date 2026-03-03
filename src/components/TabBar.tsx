import { Wallet, BarChart3 } from 'lucide-react';

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
    <nav
      className="tab-bar"
      role="tablist"
      aria-label="Навигация по разделам"
    >
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          aria-label={label}
          className={`tab-bar-item ${activeTab === id ? 'active' : ''}`}
          onClick={() => onTabChange(id)}
        >
          <Icon className="tab-bar-icon" size={20} strokeWidth={2} aria-hidden />
          <span className="tab-bar-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
