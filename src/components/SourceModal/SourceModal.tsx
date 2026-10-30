import { useState, useEffect } from 'react';
import { m, useDragControls } from 'motion/react';
import type { PanInfo, Variants } from 'motion/react';
import { Check, X } from 'lucide-react';
import type { FinanceSource } from '../../types.ts';
import { PALETTE, isPaletteColor } from '../../theme/colors.ts';
import { useSettings } from '../../settings/SettingsContext.tsx';
import styles from './SourceModal.module.css';

interface SavePayload {
  id?: string;
  name: string;
  amount: number;
  color: string;
}

interface Props {
  source: FinanceSource | null;
  onSave: (data: SavePayload) => void;
  onClose: () => void;
}

const EASE = [0.32, 0.72, 0, 1] as const;

// Свайп вниз дальше этого или с такой скоростью закрывает шторку.
const DISMISS_OFFSET = 120;
const DISMISS_VELOCITY = 600;

const sheetVariants: Variants = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: { duration: 0.35, ease: EASE, staggerChildren: 0.05, delayChildren: 0.08 },
  },
  exit: { y: '100%', transition: { duration: 0.28, ease: EASE } },
};

const childVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
};

const colorPickerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.025, delayChildren: 0.05 } },
};

const colorSwatchVariants: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: EASE } },
};

// На iOS клавиатура не уменьшает layout viewport, поэтому прижатая к низу
// шторка оказывается под ней. Поднимаем её на высоту клавиатуры.
function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}

export default function SourceModal({ source, onSave, onClose }: Props) {
  const { t, theme } = useSettings();
  const [name, setName] = useState(source?.name ?? '');
  const [amount, setAmount] = useState(source ? String(source.amount) : '');
  const [color, setColor] = useState<string>(source?.color ?? PALETTE[0].dark);
  const dragControls = useDragControls();
  const keyboardInset = useKeyboardInset();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const parsedAmount = Number(amount);
  const isValid = name.trim().length > 0 && amount.length > 0 && !isNaN(parsedAmount) && parsedAmount >= 0;
  const isCustomColor = !isPaletteColor(color);

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      ...(source ? { id: source.id } : {}),
      name: name.trim(),
      amount: parsedAmount,
      color,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) handleSave();
    if (e.key === 'Escape') onClose();
  };

  const handleDragEnd = (_: PointerEvent, info: PanInfo) => {
    if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) onClose();
  };

  return (
    <div
      className={styles.overlay}
      style={{ paddingBottom: `calc(var(--sheet-inset) + ${keyboardInset}px)` }}
    >
      {/* Затемнение — отдельный слой, а не обёртка: иначе backdrop-filter
          шторки не видит страницу под собой. */}
      <m.div
        className={styles.backdrop}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />
      <m.div
        className={`${styles.sheet} ${keyboardInset > 0 ? styles.lifted : ''} surface`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-sheet-title"
        onKeyDown={handleKeyDown}
        variants={sheetVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 0.7 }}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 50 }}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.handle} onPointerDown={(e) => dragControls.start(e)}>
          <div className={styles.grabber} aria-hidden />
          <div className={styles.header}>
            <button
              type="button"
              className={`${styles.circleBtn} surface`}
              onClick={onClose}
              aria-label={t('modal.close')}
            >
              <X size={22} strokeWidth={2} aria-hidden />
            </button>
            <h3 id="source-sheet-title" className={styles.title}>
              {source ? t('modal.editTitle') : t('modal.newTitle')}
            </h3>
            <button
              type="button"
              className={`${styles.circleBtn} ${isValid ? styles.confirmBtn : 'surface'}`}
              onClick={handleSave}
              disabled={!isValid}
              aria-label={source ? t('modal.save') : t('modal.add')}
            >
              <Check size={22} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        </div>

        <div className={styles.body}>
          <m.div className={`${styles.group} surface`} variants={childVariants}>
            <input
              className={`${styles.row} ${styles.input}`}
              type="text"
              placeholder={t('modal.name')}
              aria-label={t('modal.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label className={styles.row}>
              <span className={styles.rowLabel}>{t('modal.amount')}</span>
              <input
                className={`${styles.input} ${styles.amountInput}`}
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, '');
                  setAmount(v);
                }}
              />
              <span className={styles.currency}>₽</span>
            </label>
          </m.div>

          <m.div variants={childVariants}>
            <div className={styles.sectionLabel}>{t('modal.color')}</div>
            <m.div className={`${styles.group} ${styles.colorPicker} surface`} variants={colorPickerVariants}>
              {PALETTE.map((c) => (
                <m.button
                  key={c.dark}
                  type="button"
                  variants={colorSwatchVariants}
                  whileTap={{ scale: 0.88 }}
                  className={`${styles.colorOption} ${c.dark.toLowerCase() === color.toLowerCase() ? styles.selected : ''}`}
                  style={{ background: c[theme] }}
                  onClick={() => setColor(c.dark)}
                  aria-label={c.dark}
                />
              ))}
              <m.label
                variants={colorSwatchVariants}
                whileTap={{ scale: 0.88 }}
                className={`${styles.colorOption} ${styles.customColor} ${isCustomColor ? styles.selected : ''}`}
                style={isCustomColor ? { background: color } : undefined}
                aria-label={t('modal.customColor')}
              >
                {!isCustomColor && <span className={styles.customIcon}>+</span>}
                <input
                  type="color"
                  className={styles.colorInput}
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </m.label>
            </m.div>
          </m.div>
        </div>
      </m.div>
    </div>
  );
}
