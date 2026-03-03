import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import SourceModal from './components/SourceModal';
import TabBar from './components/TabBar';
import type { TabId } from './components/TabBar';
import DynamicsPage from './pages/DynamicsPage';
import MainTabContent from './pages/MainTabContent';
import type { FinanceSource } from './types';
import { getCurrentMonthKey } from './types';
import './App.css';

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
  const [monthlyBalances, setMonthlyBalances] = useState<Record<string, number>>(loadMonthlyBalances);
  const [activeTab, setActiveTab] = useState<TabId>('main');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [editing, setEditing] = useState<FinanceSource | null>(null);
  const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set());
  const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set());
  const closingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  }, [sources]);

  const activeSources = useMemo(
    () => sources.filter(s => !leavingIds.has(s.id)),
    [sources, leavingIds],
  );

  const total = useMemo(
    () => sources.reduce((s, src) => s + src.amount, 0),
    [sources],
  );

  useEffect(() => {
    const monthKey = getCurrentMonthKey();
    setMonthlyBalances(prev => {
      const next = { ...prev, [monthKey]: total };
      localStorage.setItem(MONTHLY_BALANCE_KEY, JSON.stringify(next));
      return next;
    });
  }, [total]);

  const animateModalClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setModalClosing(true);
    setTimeout(() => {
      setModalVisible(false);
      setModalClosing(false);
      setEditing(null);
      closingRef.current = false;
    }, 300);
  }, []);

  const openAdd = useCallback(() => {
    setEditing(null);
    setModalVisible(true);
    setModalClosing(false);
    closingRef.current = false;
  }, []);

  const openEdit = useCallback((src: FinanceSource) => {
    setEditing(src);
    setModalVisible(true);
    setModalClosing(false);
    closingRef.current = false;
  }, []);

  const handleDelete = useCallback((id: string) => {
    setLeavingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      setSources(prev => prev.filter(s => s.id !== id));
      setLeavingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 400);
  }, []);

  const handleSave = useCallback(
    (data: { id?: string; name: string; amount: number; color: string }) => {
      if (data.id) {
        setSources(prev =>
          prev.map(s => (s.id === data.id ? { ...s, ...data } as FinanceSource : s)),
        );
      } else {
        const newId = crypto.randomUUID();
        setSources(prev => [
          ...prev,
          { id: newId, name: data.name, amount: data.amount, color: data.color },
        ]);
        setEnteringIds(prev => new Set(prev).add(newId));
        setTimeout(() => {
          setEnteringIds(prev => {
            const next = new Set(prev);
            next.delete(newId);
            return next;
          });
        }, 500);
      }
      animateModalClose();
    },
    [animateModalClose],
  );

  return (
    <div className="app">
      <div className="app-content">
        {activeTab === 'main' && (
          <MainTabContent
            sources={sources}
            activeSources={activeSources}
            total={total}
            leavingIds={leavingIds}
            enteringIds={enteringIds}
            onEdit={openEdit}
            onDelete={handleDelete}
            onAdd={openAdd}
          />
        )}

        {activeTab === 'dynamics' && (
          <DynamicsPage monthlyBalances={monthlyBalances} />
        )}
      </div>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {modalVisible && (
        <SourceModal
          source={editing}
          onSave={handleSave}
          onClose={animateModalClose}
          closing={modalClosing}
        />
      )}

    </div>
  );
}

export default App;
