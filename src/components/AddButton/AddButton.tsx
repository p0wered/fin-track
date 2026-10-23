import { m } from 'motion/react';
import { Plus } from 'lucide-react';
import { useSettings } from '../../settings/SettingsContext.tsx';
import styles from './AddButton.module.css';

interface Props {
  onClick: () => void;
  /** Пока открыта шторка добавления, кнопка гаснет до цвета таб-бара. */
  muted?: boolean;
}

export default function AddButton({ onClick, muted = false }: Props) {
  const { t } = useSettings();

  return (
    <m.button
      type="button"
      className={`${styles.button} ${muted ? styles.muted : ''}`}
      onClick={onClick}
      aria-label={t('sources.add')}
      title={t('sources.add')}
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.25 }}
    >
      <Plus size={28} strokeWidth={2.25} aria-hidden />
    </m.button>
  );
}
