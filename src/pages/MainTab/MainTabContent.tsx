import { useMemo, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import SourceItem from '../../components/SourceItem/SourceItem.tsx';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber.ts';
import { useSettings } from '../../settings/SettingsContext.tsx';
import type { FinanceSource } from '../../types.ts';
import { formatAmount } from '../../types.ts';
import styles from './MainTabContent.module.css';

interface Props {
  sources: FinanceSource[];
  total: number;
  onEdit: (src: FinanceSource) => void;
  onDelete: (id: string) => void;
}

const EASE = [0.4, 0, 0.2, 1] as const;

export default function MainTabContent({ sources, total, onEdit, onDelete }: Props) {
  const { t, locale } = useSettings();
  const animatedTotal = useAnimatedNumber(total);
  const [openSourceId, setOpenSourceId] = useState<string | null>(null);

  const sortedSources = useMemo(
    () => [...sources].sort((a, b) => b.amount - a.amount),
    [sources],
  );

  const count = sources.length;

  return (
    <>
      <m.section
        className={styles.hero}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
      >
        <span className={styles.heroLabel}>{t('donut.total')}</span>
        <span className={styles.heroAmount}>{formatAmount(animatedTotal, locale)}</span>
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
              className={`${styles.sectionCount} glass`}
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
          <div className={styles.list}>
            <AnimatePresence>
              {sortedSources.map((src, index) => (
                <SourceItem
                  key={src.id}
                  source={src}
                  index={index}
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
          </div>
        )}

      </section>
    </>
  );
}
