import { useState, useRef, useCallback, useEffect } from 'react';
import type { FinanceSource } from '../types';
import { formatAmount } from '../types';

type AnimState = 'initial' | 'entering' | 'leaving' | 'idle';

interface Props {
  source: FinanceSource;
  pct: number;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
  animState: AnimState;
  /** Открыт ли этот блок (свайпнут) — может быть только один */
  isOpen: boolean;
  /** Вызвать при открытии этого блока (свайп влево) */
  onRequestOpen: () => void;
  /** Вызвать при начале касания — закрыть другой открытый блок */
  onTouchStartItem: () => void;
  /** Вызвать при закрытии блока (свайп вправо или нажатие кнопки) */
  onClose: () => void;
}

const ACTION_WIDTH = 128;
const SNAP_THRESHOLD = ACTION_WIDTH / 2;

const ANIM_CLASS: Record<AnimState, string> = {
  initial: ' initial',
  entering: ' entering',
  leaving: ' leaving',
  idle: '',
};

export default function SourceItem({ source, pct, onEdit, onDelete, index, animState, isOpen, onRequestOpen, onTouchStartItem, onClose }: Props) {
  const [offset, setOffset] = useState(0);
  const [animate, setAnimate] = useState(false);
  const startXRef = useRef(0);
  const openRef = useRef(false);
  const movedRef = useRef(false);

  const snapTo = useCallback((val: number) => {
    setAnimate(true);
    setOffset(val);
    openRef.current = val !== 0;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    onTouchStartItem();
    startXRef.current = e.touches[0].clientX;
    movedRef.current = false;
    setAnimate(false);
  }, [onTouchStartItem]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startXRef.current;
    if (Math.abs(dx) > 4) movedRef.current = true;
    const base = openRef.current ? -ACTION_WIDTH : 0;
    setOffset(Math.min(0, Math.max(base + dx, -ACTION_WIDTH)));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!movedRef.current) {
      if (openRef.current) {
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

  useEffect(() => {
    if (!isOpen && (openRef.current || offset !== 0)) {
      setAnimate(true);
      setOffset(0);
      openRef.current = false;
    }
  }, [isOpen]);

  return (
    <div
      className={`source-item-wrapper${ANIM_CLASS[animState]}`}
      style={{ '--i': index } as React.CSSProperties}
    >
      <div className="source-item-actions">
        <button
          className="action-btn edit-btn"
          onClick={() => {
            snapTo(0);
            onClose();
            onEdit();
          }}
          aria-label="Редактировать"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          className="action-btn delete-btn"
          onClick={() => {
            snapTo(0);
            onClose();
            onDelete();
          }}
          aria-label="Удалить"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
      <div
        className="source-item"
        style={{
          transform: `translateX(${offset}px)`,
          transition: animate ? 'transform 0.3s cubic-bezier(.4,0,.2,1)' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTransitionEnd={() => setAnimate(false)}
      >
        <div
          className="source-dot"
          style={{ background: source.color }}
        />
        <div className="source-info">
          <span className="source-name">{source.name}</span>
          <span className="source-pct">{pct.toFixed(1)}%</span>
        </div>
        <span className="source-amount">{formatAmount(source.amount)}</span>
      </div>
    </div>
  );
}
