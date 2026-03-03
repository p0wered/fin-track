import { useEffect, useMemo, useState } from 'react';
import DonutChart from '../components/DonutChart';
import SourceItem from '../components/SourceItem';
import type { FinanceSource } from '../types';

interface Props {
  sources: FinanceSource[];
  activeSources: FinanceSource[];
  total: number;
  leavingIds: Set<string>;
  enteringIds: Set<string>;
  onEdit: (src: FinanceSource) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export default function MainTabContent({
  sources,
  activeSources,
  total,
  leavingIds,
  enteringIds,
  onEdit,
  onDelete,
  onAdd,
}: Props) {
  const [isInitial, setIsInitial] = useState(true);
  const [openSourceId, setOpenSourceId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setIsInitial(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const sortedSources = useMemo(
    () => [...sources].sort((a, b) => b.amount - a.amount),
    [sources],
  );

  const activeCount = activeSources.length;

  return (
    <>
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
            {sortedSources.map((src, idx) => (
              <SourceItem
                key={src.id}
                source={src}
                pct={total > 0 ? (src.amount / total) * 100 : 0}
                onEdit={() => onEdit(src)}
                onDelete={() => onDelete(src.id)}
                index={idx}
                animState={
                  leavingIds.has(src.id) ? 'leaving' :
                  enteringIds.has(src.id) ? 'entering' :
                  isInitial ? 'initial' : 'idle'
                }
                isOpen={openSourceId === src.id}
                onRequestOpen={() => setOpenSourceId(src.id)}
                onTouchStartItem={() => setOpenSourceId(prev => prev === src.id ? prev : null)}
                onClose={() => setOpenSourceId(null)}
              />
            ))}
          </div>
        )}

        <button
          className="add-source-btn anim-fade-slide"
          style={{ '--delay': `${0.25 + sources.length * 0.06}s` } as React.CSSProperties}
          onClick={onAdd}
        >
          <span className="add-icon">+</span>
          Добавить источник
        </button>
      </section>
    </>
  );
}
