import { useMemo, useRef, useEffect } from 'react';
import { formatAmount, formatMonthLabel, formatMonthShort } from '../types';

const BAR_GAP = 12;
const BAR_MIN_WIDTH = 56;
const BAR_AREA_HEIGHT = 220;
const VALUE_AREA_HEIGHT = 18;
const RAIL_TOP_PADDING = 8;

interface Props {
  data: [string, number][];
}

export default function BalanceChart({ data }: Props) {
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
      <div className="balance-chart-empty anim-fade-slide" style={{ '--delay': '0.15s' } as React.CSSProperties}>
        <div className="balance-chart-empty-icon">📊</div>
        <p>Пока нет данных по месяцам</p>
        <p className="balance-chart-empty-hint">Баланс на конец каждого месяца будет сохраняться автоматически</p>
      </div>
    );
  }

  const barWidth = BAR_MIN_WIDTH;
  const totalWidth = sorted.length * (barWidth + BAR_GAP) - BAR_GAP;
  const railHeight = BAR_AREA_HEIGHT + VALUE_AREA_HEIGHT + RAIL_TOP_PADDING;

  return (
    <div className="balance-chart-wrap anim-fade-slide" style={{ '--delay': '0.08s' } as React.CSSProperties}>
      <div
        className="balance-chart-scroll"
        ref={containerRef}
        role="region"
        aria-label="Динамика баланса по месяцам"
      >
        <div
          className="balance-chart-inner"
          style={{ width: totalWidth, minWidth: '100%' }}
        >
          {sorted.map(([monthKey, balance], i) => {
            const heightPct = maxBalance > 0 ? (balance / maxBalance) * 100 : 0;
            const barHeightPx = (BAR_AREA_HEIGHT * heightPct) / 100;
            return (
              <div
                key={monthKey}
                className="balance-chart-bar-cell"
                style={{
                  '--i': i,
                } as React.CSSProperties}
              >
                <div className="balance-chart-bar-rail" style={{ height: railHeight }}>
                  <div className="balance-chart-bar-rail-top" style={{ height: RAIL_TOP_PADDING }} />
                  <div className="balance-chart-bar-rail-spacer" />
                  <div className="balance-chart-bar-value" title={formatAmount(balance)}>
                    {formatAmount(balance)}
                  </div>
                  <div
                    className="balance-chart-bar"
                    style={{ height: barHeightPx }}
                    aria-label={`${formatMonthLabel(monthKey)}: ${formatAmount(balance)}`}
                  />
                </div>
                <div className="balance-chart-bar-label">
                  {formatMonthShort(monthKey)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
