import { useMemo, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import type { Variants } from 'motion/react';
import DonutChart from '../../components/DonutChart/DonutChart.tsx';
import SourceItem from '../../components/SourceItem/SourceItem.tsx';
import { useSettings } from '../../settings/SettingsContext.tsx';
import type { FinanceSource } from '../../types.ts';
import styles from './MainTabContent.module.css';

interface Props {
  sources: FinanceSource[];
  total: number;
  onEdit: (src: FinanceSource) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const EASE = [0.4, 0, 0.2, 1] as const;

/** Контейнер списка: каскадный вход дочерних элементов при первом монтировании. */
const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.25 } },
};

export default function MainTabContent({ sources, total, onEdit, onDelete, onAdd }: Props) {
  const { t } = useSettings();
  const [openSourceId, setOpenSourceId] = useState<string | null>(null);

  const sortedSources = useMemo(
    () => [...sources].sort((a, b) => b.amount - a.amount),
    [sources],
  );

  const count = sources.length;

  return (
    <>
      <m.section
        className={styles.donutSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
      >
        <DonutChart sources={sources} />
      </m.section>

      <section className={styles.sourcesSection}>
        <m.div
          className={styles.sectionHeader}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
        >
          <h2 className={styles.sectionTitle}>{t('sources.title')}</h2>
          {count > 0 && (
            <m.span
              className={styles.sectionCount}
              key={count}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {count}
            </m.span>
          )}
        </m.div>

        {sources.length === 0 ? (
          <m.div
            className={styles.emptyState}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.25 }}
          >
            <div className={styles.emptyIcon}>💰</div>
            <p>{t('sources.empty')}</p>
          </m.div>
        ) : (
          <m.div variants={listVariants} initial="hidden" animate="visible">
            <AnimatePresence>
              {sortedSources.map(src => (
                <SourceItem
                  key={src.id}
                  source={src}
                  pct={total > 0 ? (src.amount / total) * 100 : 0}
                  onEdit={() => onEdit(src)}
                  onDelete={() => onDelete(src.id)}
                  isOpen={openSourceId === src.id}
                  onRequestOpen={() => setOpenSourceId(src.id)}
                  onTouchStartItem={() => setOpenSourceId(prev => (prev === src.id ? prev : null))}
                  onClose={() => setOpenSourceId(null)}
                />
              ))}
            </AnimatePresence>
          </m.div>
        )}

        <m.button
          className={styles.addBtn}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.25 + sources.length * 0.06 }}
          onClick={onAdd}
        >
          <span className={styles.addIcon}>+</span>
          {t('sources.add')}
        </m.button>
      </section>
    </>
  );
}
