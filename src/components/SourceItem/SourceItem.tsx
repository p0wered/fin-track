import { useRef, useCallback, useEffect } from 'react';
import { m, animate, useMotionValue, useTransform } from 'motion/react';
import type { MotionValue, Variants } from 'motion/react';
import { SquarePen, Trash2 } from 'lucide-react';
import type { FinanceSource } from '../../types.ts';
import { formatNumber, formatPercent } from '../../types.ts';
import { useSettings } from '../../settings/SettingsContext.tsx';
import { resolveColor } from '../../theme/colors.ts';
import styles from './SourceItem.module.css';

interface Props {
  source: FinanceSource;
  pct: number;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  isOpen: boolean;
  onRequestOpen: () => void;
  onTouchStartItem: () => void;
  onClose: () => void;
}

// Кнопки свайпа квадратные, со стороной в высоту карточки.
const ITEM_HEIGHT = 64;
const ACTION_GAP = 8;
const ACTION_WIDTH = 2 * (ITEM_HEIGHT + ACTION_GAP);
const SNAP_THRESHOLD = ACTION_WIDTH / 2;
const RUBBER = 0.55;
// Без отскока: пользователь не любит «пружинистость».
const SNAP_SPRING = { type: 'spring', bounce: 0, duration: 0.4 } as const;

// Куда «докатится» карточка после броска (формула Apple, как у инерции скролла).
function project(velocity: number, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

function rubberband(distance: number, dimension: number) {
  return (distance * dimension * RUBBER) / (dimension + RUBBER * distance);
}

function withRubberband(pos: number, min: number, max: number) {
  if (pos < min) return min - rubberband(min - pos, max - min);
  if (pos > max) return max + rubberband(pos - max, max - min);
  return pos;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: Math.min(i, 6) * 0.06 },
  }),
  exit: {
    opacity: 0,
    x: -30,
    height: 0,
    marginBottom: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
};

/**
 * Кнопка свайпа в духе уведомлений iOS: стоит на своём месте и проявляется
 * (растёт и становится видимой) по мере того, как карточка открывает её слот.
 * `revealAt` — сдвиг карточки, при котором кнопка видна полностью.
 */
function SwipeAction({ x, revealAt, label, icon, onClick }: {
  x: MotionValue<number>;
  revealAt: number;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const progress = useTransform(x, [-revealAt, -(revealAt - ITEM_HEIGHT)], [1, 0]);
  const scale = useTransform(progress, [0, 1], [0.6, 1]);
  const opacity = useTransform(progress, [0, 0.6], [0, 1]);
  return (
    <m.button
      className={`${styles.actionBtn} surface`}
      style={{ scale, opacity }}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
    </m.button>
  );
}

export default function SourceItem({ source, pct, index, onEdit, onDelete, isOpen, onRequestOpen, onTouchStartItem, onClose }: Props) {
  const { t, locale, theme } = useSettings();
  const x = useMotionValue(0);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const baseRef = useRef(0);
  const movedRef = useRef(false);
  const dirRef = useRef<'h' | 'v' | null>(null);

  // Пружина стартует с текущей позиции и скорости пальца, поэтому карточку
  // можно перехватить на середине анимации.
  const snapTo = useCallback((val: number) => {
    animate(x, val, { ...SNAP_SPRING, velocity: x.getVelocity() });
  }, [x]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    onTouchStartItem();
    x.stop();
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    baseRef.current = x.get();
    movedRef.current = false;
    dirRef.current = null;
  }, [onTouchStartItem, x]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;

    if (dirRef.current === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      dirRef.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }

    if (dirRef.current === 'v') return;

    if (Math.abs(dx) > 4) movedRef.current = true;
    x.set(withRubberband(baseRef.current + dx, -ACTION_WIDTH, 0));
  }, [x]);

  const handleTouchEnd = useCallback(() => {
    if (!movedRef.current) {
      if (x.get() !== 0) {
        snapTo(0);
        onClose();
      }
      return;
    }
    // Решаем по точке, куда карточка докатится, а не где отпустили:
    // короткий бросок влево тоже открывает кнопки.
    const willOpen = x.get() + project(x.getVelocity()) < -SNAP_THRESHOLD;
    snapTo(willOpen ? -ACTION_WIDTH : 0);
    if (willOpen) onRequestOpen();
    else onClose();
  }, [x, snapTo, onRequestOpen, onClose]);

  // Закрываемся, когда открыли соседнюю карточку или тапнули мимо.
  useEffect(() => {
    if (!isOpen && x.get() !== 0) snapTo(0);
  }, [isOpen, x, snapTo]);

  return (
    <m.div
      className={styles.wrapper}
      variants={itemVariants}
      custom={index}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div
        className={styles.track}
        style={{
          '--item-height': `${ITEM_HEIGHT}px`,
          '--action-gap': `${ACTION_GAP}px`,
        } as React.CSSProperties}
      >
        {/* Кнопки не едут вместе с карточкой, а ждут под ней у правого края. */}
        <div className={styles.actions}>
          <SwipeAction
            x={x}
            revealAt={ACTION_WIDTH}
            label={t('item.edit')}
            icon={<SquarePen size={22} strokeWidth={1.75} aria-hidden />}
            onClick={() => {
              snapTo(0);
              onClose();
              onEdit();
            }}
          />
          <SwipeAction
            x={x}
            revealAt={ACTION_WIDTH / 2}
            label={t('item.delete')}
            icon={<Trash2 size={22} strokeWidth={1.75} aria-hidden />}
            onClick={() => {
              snapTo(0);
              onClose();
              onDelete();
            }}
          />
        </div>
        <m.div className={styles.row} style={{ x }}>
          <div
            className={`${styles.item} surface`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className={styles.dot} style={{ background: resolveColor(source.color, theme) }} />
            <div className={styles.info}>
              <span className={styles.name}>{source.name}</span>
              <span className={styles.pct}>{formatPercent(pct / 100, locale)}</span>
            </div>
            <span className={styles.amount}>
              {formatNumber(source.amount, locale)}
              <span className={styles.currency}>₽</span>
            </span>
          </div>
        </m.div>
      </div>
    </m.div>
  );
}
