export interface FinanceSource {
  id: string;
  name: string;
  amount: number;
  color: string;
}

/** Баланс на конец месяца: ключ "YYYY-MM", значение — сумма */
export type MonthlyBalances = Record<string, number>;

export function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Форматирование месяца для подписи (например "янв. 2025") */
export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
}

/** Три буквы месяца без точки (для подписи под столбцом) */
export function formatMonthShort(monthKey: string): string {
  const [, m] = monthKey.split('-').map(Number);
  const date = new Date(2000, m - 1, 1);
  return date.toLocaleDateString('ru-RU', { month: 'short' }).replace(/\.$/, '').slice(0, 3);
}

export const COLORS = [
  '#6C63FF',
  '#1671ef',
  '#41a141',
  '#FFA726',
  '#EF5350',
  '#AB47BC',
  '#26C6DA',
  '#EC407A',
  '#8D6E63',
  '#78909C',
  '#ffdd2d',
  '#9368e1',
];

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(amount)) + ' \u20BD';
}
