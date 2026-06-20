import { useMemo, useRef, useEffect } from 'react';
import { m } from 'motion/react';
import { formatAmount, formatMonthLabel, formatMonthShort } from '../../types.ts';
import { useSettings } from '../../settings/SettingsContext.tsx';
import styles from './BalanceChart.module.css';

const EASE = [0.4, 0, 0.2, 1] as const;

const BAR_GAP = 12;
const BAR_MIN_WIDTH = 56;
const BAR_AREA_HEIGHT = 220;
const VALUE_AREA_HEIGHT = 18;
const RAIL_TOP_PADDING = 8;

interface Props {
  data: [string, number][];
}

export default function BalanceChart({ data }: Props) {
  const { t, locale } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const maxBalance = useMemo(
    () => (data.length ? Math.max(...data.map(([, b]) => b), 1) : 1),
    [data],
  );

  const sorted = useMemo(() => [...data].sort(([a], [b]) => a.localeCompare(b)), [data]);

  useEffect(() => {
    if (!containerRef.current || sorted.length === 0) return;
    containerRef.current.scrollLeft = containerRef.current.scrollWidth;
  }, [sorted.length]);

  if (sorted.length === 0) {
    return (
      <m.div
        className={styles.empty}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
      >
        <div className={styles.emptyIcon}>📊</div>
        <p>{t('chart.empty')}</p>
        <p className={styles.hint}>{t('chart.emptyHint')}</p>
      </m.div>
    );
  }

  const barWidth = BAR_MIN_WIDTH;
  const totalWidth = sorted.length * (barWidth + BAR_GAP) - BAR_GAP;
  const railHeight = BAR_AREA_HEIGHT + VALUE_AREA_HEIGHT + RAIL_TOP_PADDING;

  return (
    <m.div
      className={styles.wrap}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}
    >
      <div
        className={styles.scroll}
        ref={containerRef}
        role="region"
        aria-label={t('dynamics.aria')}
      >
        <div
          className={styles.inner}
          style={{ width: totalWidth, minWidth: '100%' }}
        >
          {sorted.map(([monthKey, balance], i) => {
            const heightPct = maxBalance > 0 ? (balance / maxBalance) * 100 : 0;
            const barHeightPx = (BAR_AREA_HEIGHT * heightPct) / 100;
            return (
              <m.div
                key={monthKey}
                className={styles.barCell}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE, delay: 0.1 + i * 0.04 }}
              >
                <div className={styles.barRail} style={{ height: railHeight }}>
                  <div className={styles.barRailTop} style={{ height: RAIL_TOP_PADDING }} />
                  <div className={styles.barRailSpacer} />
                  <div className={styles.barValue} title={formatAmount(balance, locale)}>
                    {formatAmount(balance, locale)}
                  </div>
                  <div
                    className={styles.bar}
                    style={{ height: barHeightPx }}
                    aria-label={`${formatMonthLabel(monthKey, locale)}: ${formatAmount(balance, locale)}`}
                  />
                </div>
                <div className={styles.barLabel}>
                  {formatMonthShort(monthKey, locale)}
                </div>
              </m.div>
            );
          })}
        </div>
      </div>
    </m.div>
  );
}
