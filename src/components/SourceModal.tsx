import { useState, useEffect, useRef } from 'react';
import type { FinanceSource } from '../types';
import { COLORS } from '../types';

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
  closing?: boolean;
}

export default function SourceModal({ source, onSave, onClose, closing }: Props) {
  const [name, setName] = useState(source?.name ?? '');
  const [amount, setAmount] = useState(source ? String(source.amount) : '');
  const [color, setColor] = useState(source?.color ?? COLORS[0]);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    nameRef.current?.focus();
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
    <div
      className={`modal-overlay${closing ? ' closing' : ''}`}
      onClick={onClose}
    >
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            {source ? 'Редактировать' : 'Новый источник'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            &#10005;
          </button>
        </div>

        <div className="form-group" style={{ '--fi': 0 } as React.CSSProperties}>
          <label className="form-label">Название</label>
          <input
            ref={nameRef}
            className="form-input"
            type="text"
            placeholder="Например, Сбербанк"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ '--fi': 1 } as React.CSSProperties}>
          <label className="form-label">{'Сумма (₽)'}</label>
          <input
            className="form-input"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d]/g, '');
              setAmount(v);
            }}
          />
        </div>

        <div className="form-group" style={{ '--fi': 2 } as React.CSSProperties}>
          <label className="form-label">Цвет</label>
          <div className="color-picker">
            {COLORS.map((c, i) => (
              <button
                key={c}
                className={`color-option${c === color ? ' selected' : ''}`}
                style={{ background: c, '--ci': i } as React.CSSProperties}
                onClick={() => setColor(c)}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <button
          className="modal-save-btn"
          onClick={handleSave}
          disabled={!isValid}
        >
          {source ? 'Сохранить' : 'Добавить'}
        </button>
      </div>
    </div>
  );
}
