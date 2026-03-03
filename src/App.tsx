import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DonutChart from './components/DonutChart';
import SourceItem from './components/SourceItem';
import SourceModal from './components/SourceModal';
import type { FinanceSource } from './types';
import './App.css';

const STORAGE_KEY = 'fin-track-sources';

function loadSources(): FinanceSource[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function App() {
  const [sources, setSources] = useState<FinanceSource[]>(loadSources);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [editing, setEditing] = useState<FinanceSource | null>(null);
  const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set());
  const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set());
  const isInitialMount = useRef(true);
  const closingRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => { isInitialMount.current = false; }, 1000);
    return () => clearTimeout(t);
  }, []);

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

  const activeCount = activeSources.length;

  return (
    <div className="app">
      <section
        className="donut-section anim-fade-slide"
        style={{ '--delay': '0.05s' } as React.CSSProperties}
      >
        <DonutChart sources={activeSources} />
      </section>

      <section className="sources-section">
        <div
          className="section-header anim-fade-slide"
          style={{ '--delay': '0.15s' } as React.CSSProperties}
        >
          <h2 className="section-title">Источники</h2>
          {activeCount > 0 && (
            <span className="section-count" key={activeCount}>
              {activeCount}
            </span>
          )}
        </div>

        {sources.length === 0 ? (
          <div
            className="empty-state anim-fade-slide"
            style={{ '--delay': '0.25s' } as React.CSSProperties}
          >
            <div className="empty-icon">💰</div>
            <p>Добавьте свой первый источник</p>
          </div>
        ) : (
          <div className="sources-list">
            {sources.map((src, idx) => (
              <SourceItem
                key={src.id}
                source={src}
                pct={total > 0 ? (src.amount / total) * 100 : 0}
                onEdit={() => openEdit(src)}
                onDelete={() => handleDelete(src.id)}
                index={idx}
                animState={
                  leavingIds.has(src.id) ? 'leaving' :
                  enteringIds.has(src.id) ? 'entering' :
                  isInitialMount.current ? 'initial' : 'idle'
                }
              />
            ))}
          </div>
        )}

        <button
          className="add-source-btn anim-fade-slide"
          style={{ '--delay': `${0.25 + sources.length * 0.06}s` } as React.CSSProperties}
          onClick={openAdd}
        >
          <span className="add-icon">+</span>
          Добавить источник
        </button>
      </section>

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
