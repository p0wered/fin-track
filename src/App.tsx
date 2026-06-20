import { useState, useEffect, useCallback, useMemo } from 'react';
import { LazyMotion, domAnimation, MotionConfig, AnimatePresence } from 'motion/react';
import SourceModal from './components/SourceModal/SourceModal.tsx';
import TabBar from './components/TabBar/TabBar.tsx';
import type { TabId } from './components/TabBar/TabBar.tsx';
import DynamicsPage from './pages/DynamicsPage/DynamicsPage.tsx';
import MainTabContent from './pages/MainTab/MainTabContent.tsx';
import SettingsPage from './pages/SettingsPage/SettingsPage.tsx';
import type { BackupData } from './settings/backup.ts';
import type { FinanceSource } from './types';
import { getCurrentMonthKey } from './types';

const STORAGE_KEY = 'fin-track-sources';
const MONTHLY_BALANCE_KEY = 'fin-track-monthly-balance';

function loadSources(): FinanceSource[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadMonthlyBalances(): Record<string, number> {
  try {
    const raw = localStorage.getItem(MONTHLY_BALANCE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function App() {
  const [sources, setSources] = useState<FinanceSource[]>(loadSources);
  const [persistedBalances, setPersistedBalances] =
    useState<Record<string, number>>(loadMonthlyBalances);
  const [activeTab, setActiveTab] = useState<TabId>('main');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceSource | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  }, [sources]);

  const total = useMemo(
    () => sources.reduce((s, src) => s + src.amount, 0),
    [sources],
  );

  const monthlyBalances = useMemo(
    () => ({ ...persistedBalances, [getCurrentMonthKey()]: total }),
    [persistedBalances, total],
  );

  useEffect(() => {
    localStorage.setItem(MONTHLY_BALANCE_KEY, JSON.stringify(monthlyBalances));
  }, [monthlyBalances]);

  const openAdd = useCallback(() => {
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((src: FinanceSource) => {
    setEditing(src);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const handleImport = useCallback((data: BackupData) => {
    setSources(data.sources);
    setPersistedBalances(data.monthlyBalances);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleSave = useCallback(
    (data: { id?: string; name: string; amount: number; color: string }) => {
      if (data.id) {
        setSources(prev =>
          prev.map(s => (s.id === data.id ? { ...s, ...data } as FinanceSource : s)),
        );
      } else {
        setSources(prev => [
          ...prev,
          { id: crypto.randomUUID(), name: data.name, amount: data.amount, color: data.color },
        ]);
      }
      closeModal();
    },
    [closeModal],
  );

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="app">
          <div className="app-content">
            {activeTab === 'main' && (
              <MainTabContent
                sources={sources}
                total={total}
                onEdit={openEdit}
                onDelete={handleDelete}
                onAdd={openAdd}
              />
            )}

            {activeTab === 'dynamics' && (
              <DynamicsPage monthlyBalances={monthlyBalances} />
            )}

            {activeTab === 'settings' && (
              <SettingsPage
                data={{ sources, monthlyBalances }}
                onImport={handleImport}
              />
            )}
          </div>

          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

          <AnimatePresence onExitComplete={() => setEditing(null)}>
            {modalOpen && (
              <SourceModal
                source={editing}
                onSave={handleSave}
                onClose={closeModal}
              />
            )}
          </AnimatePresence>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}

export default App;
