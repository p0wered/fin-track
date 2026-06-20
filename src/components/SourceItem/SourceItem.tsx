import { useState, useRef, useCallback } from 'react';
import { m } from 'motion/react';
import type { Variants } from 'motion/react';
import type { FinanceSource } from '../../types.ts';
import { formatAmount } from '../../types.ts';
import { useSettings } from '../../settings/SettingsContext.tsx';
import styles from './SourceItem.module.css';

interface Props {
  source: FinanceSource;
  pct: number;
  onEdit: () => void;
  onDelete: () => void;
  isOpen: boolean;
  onRequestOpen: () => void;
  onTouchStartItem: () => void;
  onClose: () => void;
}

const ACTION_WIDTH = 128;
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit: {
    opacity: 0,
    x: -30,
    height: 0,
    marginBottom: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function SourceItem({ source, pct, onEdit, onDelete, isOpen, onRequestOpen, onTouchStartItem, onClose }: Props) {
  const { t, locale } = useSettings();
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
    <m.div className={styles.wrapper} variants={itemVariants}>
      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${styles.editBtn}`}
          onClick={() => {
            snapTo(0);
            onClose();
            onEdit();
          }}
          aria-label={t('item.edit')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          className={`${styles.actionBtn} ${styles.deleteBtn}`}
          onClick={() => {
            snapTo(0);
            onClose();
            onDelete();
          }}
          aria-label={t('item.delete')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
      <div
        className={styles.item}
        style={{
          transform: `translateX(${offset}px)`,
          transition: animate ? 'transform 0.45s cubic-bezier(.22,1.2,.36,1)' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTransitionEnd={() => setAnimate(false)}
      >
        <div className={styles.dot} style={{ background: source.color }} />
        <div className={styles.info}>
          <span className={styles.name}>{source.name}</span>
          <span className={styles.pct}>{pct.toFixed(1)}%</span>
        </div>
        <span className={styles.amount}>{formatAmount(source.amount, locale)}</span>
      </div>
    </m.div>
  );
}
