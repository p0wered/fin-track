import { useMemo, useState, useEffect, useRef } from 'react';
import type { FinanceSource } from '../types';
import { formatAmount } from '../types';

const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const STROKE = 34;
const RADIUS = 112;
const OUTER = RADIUS + STROKE / 2;
const INNER = RADIUS - STROKE / 2;
const CORNER = 5;
const GAP_HALF = 0.035;
const ANIM_MS = 450;

function pt(r: number, a: number) {
  return `${CX + r * Math.cos(a)} ${CY + r * Math.sin(a)}`;
}

function buildPath(a1: number, a2: number) {
  const sweep = a2 - a1;
  const maxC = Math.min(CORNER, (sweep * INNER) / 2.5);
  const c = Math.max(0, maxC);

  if (c < 0.5) {
    const lg = sweep > Math.PI ? 1 : 0;
    return [
      `M${pt(OUTER, a1)}`,
      `A${OUTER} ${OUTER} 0 ${lg} 1 ${pt(OUTER, a2)}`,
      `L${pt(INNER, a2)}`,
      `A${INNER} ${INNER} 0 ${lg} 0 ${pt(INNER, a1)}`,
      'Z',
    ].join('');
  }

  const dO = c / OUTER;
  const dI = c / INNER;
  const lg = sweep - 2 * dI > Math.PI ? 1 : 0;

  return [
    `M${pt(OUTER - c, a1)}`,
    `A${c} ${c} 0 0 1 ${pt(OUTER, a1 + dO)}`,
    `A${OUTER} ${OUTER} 0 ${lg} 1 ${pt(OUTER, a2 - dO)}`,
    `A${c} ${c} 0 0 1 ${pt(OUTER - c, a2)}`,
    `L${pt(INNER + c, a2)}`,
    `A${c} ${c} 0 0 1 ${pt(INNER, a2 - dI)}`,
    `A${INNER} ${INNER} 0 ${lg} 0 ${pt(INNER, a1 + dI)}`,
    `A${c} ${c} 0 0 1 ${pt(INNER + c, a1)}`,
    'Z',
  ].join('');
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function useAnimatedNumber(target: number, duration = 500) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const frameRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    if (from === target) {
      prevRef.current = target;
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(from + (target - from) * easeOutCubic(t)));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return display;
}

interface AnimSeg {
  id: string;
  color: string;
  from: number;
  to: number;
}

interface DisplaySeg {
  id: string;
  color: string;
  fraction: number;
}

interface Props {
  sources: FinanceSource[];
}

export default function DonutChart({ sources }: Props) {
  const total = useMemo(
    () => sources.reduce((sum, s) => sum + s.amount, 0),
    [sources],
  );

  const animatedTotal = useAnimatedNumber(total);

  const segsRef = useRef<AnimSeg[]>([]);
  const [displaySegs, setDisplaySegs] = useState<DisplaySeg[]>([]);
  const frameRef = useRef(0);
  const startRef = useRef(0);
  const isFirstRef = useRef(true);

  useEffect(() => {
    const targets: DisplaySeg[] = [];
    if (total > 0) {
      for (const s of sources) {
        if (s.amount > 0) {
          targets.push({ id: s.id, color: s.color, fraction: s.amount / total });
        }
      }
    }

    const segs = segsRef.current;

    cancelAnimationFrame(frameRef.current);

    if (!isFirstRef.current) {
      const elapsed = performance.now() - startRef.current;
      const t = Math.min(elapsed / ANIM_MS, 1);
      const e = easeOutCubic(t);
      for (const s of segs) {
        s.from = s.from + (s.to - s.from) * e;
      }
    }

    const targetMap = new Map(targets.map(t => [t.id, t]));
    const existingIds = new Set(segs.map(s => s.id));

    for (const s of segs) {
      const t = targetMap.get(s.id);
      if (t) {
        s.color = t.color;
        s.to = t.fraction;
      } else {
        s.to = 0;
      }
    }

    for (const t of targets) {
      if (!existingIds.has(t.id)) {
        segs.push({ id: t.id, color: t.color, from: 0, to: t.fraction });
      }
    }

    if (isFirstRef.current) {
      isFirstRef.current = false;
      for (const s of segs) s.from = s.to;
      setDisplaySegs(
        segs.filter(s => s.to > 0.001).map(s => ({ id: s.id, color: s.color, fraction: s.to })),
      );
      return;
    }

    startRef.current = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - startRef.current) / ANIM_MS, 1);
      const e = easeOutCubic(t);

      const result = segs
        .map(s => ({
          id: s.id,
          color: s.color,
          fraction: s.from + (s.to - s.from) * e,
        }))
        .filter(s => s.fraction > 0.001);

      setDisplaySegs(result);

      if (t >= 1) {
        for (const s of segs) s.from = s.to;
        segsRef.current = segs.filter(s => s.to > 0.001);
      } else {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [sources, total]);

  const svgContent = useMemo(() => {
    if (displaySegs.length === 0) return null;

    if (displaySegs.length === 1 && displaySegs[0].fraction > 0.995) {
      return (
        <circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          fill="none"
          stroke={displaySegs[0].color}
          strokeWidth={STROKE}
        />
      );
    }

    const FULL = 2 * Math.PI;
    let startAngle = -Math.PI / 2;

    return displaySegs.map(seg => {
      const rawArc = seg.fraction * FULL;
      const gap = displaySegs.length > 1 ? Math.min(GAP_HALF, rawArc / 3) : 0;
      const a1 = startAngle + gap;
      const a2 = startAngle + rawArc - gap;
      startAngle += rawArc;

      if (a2 - a1 < 0.005) return null;
      return <path key={seg.id} d={buildPath(a1, a2)} fill={seg.color} />;
    });
  }, [displaySegs]);

  return (
    <div className="donut-container">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="donut-svg"
      >
        <circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          fill="none"
          stroke="var(--bg)"
          strokeWidth={STROKE}
        />
        {svgContent}
      </svg>
      <div className="donut-center">
        <span className="donut-label">Всего</span>
        <span className="donut-amount">{formatAmount(animatedTotal)}</span>
      </div>
    </div>
  );
}
