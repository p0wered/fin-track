import { useState, useEffect } from 'react';
import { m } from 'motion/react';
import type { Variants } from 'motion/react';
import type { FinanceSource } from '../../types.ts';
import { PALETTE } from '../../theme/colors.ts';
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

const EASE = [0.4, 0, 0.2, 1] as const;

const sheetVariants: Variants = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: { duration: 0.3, ease: EASE, staggerChildren: 0.06, delayChildren: 0.08 },
  },
  exit: { y: '100%', transition: { duration: 0.28, ease: EASE } },
};

const childVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

export default function SourceModal({ source, onSave, onClose }: Props) {
  const [name, setName] = useState(source?.name ?? '');
  const [amount, setAmount] = useState(source ? String(source.amount) : '');
  const [color, setColor] = useState(source?.color ?? PALETTE[0]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const parsedAmount = Number(amount);
  const isValid = name.trim().length > 0 && amount.length > 0 && !isNaN(parsedAmount) && parsedAmount >= 0;

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
  };

  return (
    <m.div
      className={styles.overlay}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <m.div
        className={styles.sheet}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        variants={sheetVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <m.div className={styles.header} variants={childVariants}>
          <h3 className={styles.title}>
            {source ? 'Редактировать' : 'Новый источник'}
          </h3>
          <button className={styles.close} onClick={onClose}>
            &#10005;
          </button>
        </m.div>

        <m.div className={styles.formGroup} variants={childVariants}>
          <label className={styles.label}>Название</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Например, Сбербанк"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </m.div>

        <m.div className={styles.formGroup} variants={childVariants}>
          <label className={styles.label}>{'Сумма (₽)'}</label>
          <input
            className={styles.input}
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d]/g, '');
              setAmount(v);
            }}
          />
        </m.div>

        <m.div className={styles.formGroup} variants={childVariants}>
          <label className={styles.label}>Цвет</label>
          <div className={styles.colorPicker}>
            {PALETTE.map((c) => (
              <button
                key={c}
                className={`${styles.colorOption} ${c === color ? styles.selected : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={c}
              />
            ))}
          </div>
        </m.div>

        <m.button
          className={styles.saveBtn}
          variants={childVariants}
          onClick={handleSave}
          disabled={!isValid}
        >
          {source ? 'Сохранить' : 'Добавить'}
        </m.button>
      </m.div>
    </m.div>
  );
}
