import BalanceChart from '../components/BalanceChart';
import type { MonthlyBalances } from '../types';

interface Props {
  monthlyBalances: MonthlyBalances;
}

export default function DynamicsPage({ monthlyBalances }: Props) {
  const data = Object.entries(monthlyBalances).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="dynamics-page">
      <section
        className="dynamics-section anim-fade-slide"
        style={{ '--delay': '0.05s' } as React.CSSProperties}
      >
        <div className="dynamics-title-row">
          <h1 className="dynamics-title">Динамика баланса</h1>
          <span className="dynamics-year">{new Date().getFullYear()}</span>
        </div>
      </section>

      <section className="balance-chart-section">
        <BalanceChart data={data} />
      </section>
    </div>
  );
}
