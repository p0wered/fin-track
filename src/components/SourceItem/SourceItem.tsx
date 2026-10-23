import { useState, useRef, useCallback } from 'react';
import { m } from 'motion/react';
import type { Variants } from 'motion/react';
import { SquarePen, Trash2 } from 'lucide-react';
import type { FinanceSource } from '../../types.ts';
import { formatAmount } from '../../types.ts';
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

export default function SourceItem({ source, pct, index, onEdit, onDelete, isOpen, onRequestOpen, onTouchStartItem, onClose }: Props) {
  const { t, locale, theme } = useSettings();
  const [offset, setOffset] = useState(0);
  const [animate, setAnimate] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const baseRef = useRef(0);
  const movedRef = useRef(false);
  const dirRef = useRef<'h' | 'v' | null>(null);

  const snapTo = useCallback((val: number) => {
    setAnimate(true);
    setOffset(val);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    onTouchStartItem();
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    baseRef.current = offset;
    movedRef.current = false;
    dirRef.current = null;
    setAnimate(false);
  }, [onTouchStartItem, offset]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;

    if (dirRef.current === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      dirRef.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }

    if (dirRef.current === 'v') return;

    if (Math.abs(dx) > 4) movedRef.current = true;
    setOffset(withRubberband(baseRef.current + dx, -ACTION_WIDTH, 0));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!movedRef.current) {
      if (offset !== 0) {
        snapTo(0);
        onClose();
      }
      return;
    }
    const willOpen = offset < -SNAP_THRESHOLD;
    snapTo(willOpen ? -ACTION_WIDTH : 0);
    if (willOpen) onRequestOpen();
    else onClose();
  }, [offset, snapTo, onRequestOpen, onClose]);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen && offset !== 0) {
      setAnimate(true);
      setOffset(0);
    }
  }

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
        className={styles.row}
        style={{
          '--item-height': `${ITEM_HEIGHT}px`,
          '--action-gap': `${ACTION_GAP}px`,
          transform: `translateX(${offset}px)`,
          transition: animate ? 'transform 0.45s cubic-bezier(.22,1.2,.36,1)' : 'none',
        } as React.CSSProperties}
        onTransitionEnd={() => setAnimate(false)}
      >
        <div
          className={`${styles.item} glass`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className={styles.dot} style={{ background: resolveColor(source.color, theme) }} />
          <div className={styles.info}>
            <span className={styles.name}>{source.name}</span>
            <span className={styles.pct}>{pct.toFixed(1)}%</span>
          </div>
          <span className={styles.amount}>{formatAmount(source.amount, locale)}</span>
        </div>
        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} glass`}
            onClick={() => {
              snapTo(0);
              onClose();
              onDelete();
            }}
            aria-label={t('item.delete')}
          >
            <Trash2 size={22} strokeWidth={1.75} aria-hidden />
          </button>
          <button
            className={`${styles.actionBtn} glass`}
            onClick={() => {
              snapTo(0);
              onClose();
              onEdit();
            }}
            aria-label={t('item.edit')}
          >
            <SquarePen size={22} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
    </m.div>
  );
}
