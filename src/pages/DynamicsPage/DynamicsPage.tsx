import { m } from 'motion/react';
import BalanceChart from '../../components/BalanceChart/BalanceChart.tsx';
import { useSettings } from '../../settings/SettingsContext.tsx';
import type { MonthlyBalances } from '../../types.ts';
import styles from './DynamicsPage.module.css';

interface Props {
  monthlyBalances: MonthlyBalances;
}

export default function DynamicsPage({ monthlyBalances }: Props) {
  const { t } = useSettings();
  const data = Object.entries(monthlyBalances).sort(([a], [b]) => a.localeCompare(b));

  return (
    <section className={styles.page}>
      <m.div
        className={styles.sectionHeader}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.05 }}
      >
        <h1 className={styles.sectionTitle}>{t('dynamics.title')}</h1>
        <span className={`${styles.year} glass`}>{new Date().getFullYear()}</span>
      </m.div>
      <BalanceChart data={data} />
    </section>
  );
}
