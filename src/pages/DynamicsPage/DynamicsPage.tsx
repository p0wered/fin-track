import { m } from 'motion/react';
import BalanceChart from '../../components/BalanceChart/BalanceChart.tsx';
import { useSettings } from '../../settings/SettingsContext.tsx';
import type { MonthlyBalances } from '../../types.ts';
import { formatPercent } from '../../types.ts';
import styles from './DynamicsPage.module.css';

interface Props {
  monthlyBalances: MonthlyBalances;
}

export default function DynamicsPage({ monthlyBalances }: Props) {
  const { t, locale } = useSettings();
  const data = Object.entries(monthlyBalances).sort(([a], [b]) => a.localeCompare(b));

  // Изменение текущего месяца к прошлому; без прошлого месяца строку не показываем.
  const [, current] = data[data.length - 1] ?? [];
  const [, previous] = data[data.length - 2] ?? [];
  const change = current !== undefined && previous ? (current - previous) / previous : null;

  return (
    <section className={styles.page}>
      <m.header
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.05 }}
      >
        <h1 className={styles.title}>{t('dynamics.title')}</h1>
        <p className={styles.meta}>
          {new Date().getFullYear()}
          {change !== null && (
            <>
              {' · '}
              <span className={change < 0 ? styles.negative : styles.positive}>
                {formatPercent(change, locale, true)}
              </span>{' '}
              {t('dynamics.perMonth')}
            </>
          )}
        </p>
      </m.header>
      <BalanceChart data={data} />
    </section>
  );
}
