export interface FinanceSource {
  id: string;
  name: string;
  amount: number;
  color: string;
}

/** Баланс на конец месяца: ключ "YYYY-MM", значение - сумма */
export type MonthlyBalances = Record<string, number>;

export function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Форматирование месяца для подписи (например "янв. 2025") */
export function formatMonthLabel(monthKey: string, locale = 'ru-RU'): string {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
}

/** Три буквы месяца без точки (для подписи под столбцом) */
export function formatMonthShort(monthKey: string, locale = 'ru-RU'): string {
  const [, m] = monthKey.split('-').map(Number);
  const date = new Date(2000, m - 1, 1);
  return date.toLocaleDateString(locale, { month: 'short' }).replace(/\.$/, '').slice(0, 3);
}

export function formatAmount(amount: number, locale = 'ru-RU'): string {
  return new Intl.NumberFormat(locale).format(Math.round(amount)) + ' \u20BD';
}
