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

/** \u0420\u0430\u0437\u0440\u044F\u0434\u044B \u0447\u0435\u0440\u0435\u0437 \u0443\u0437\u043A\u0438\u0439 \u043D\u0435\u0440\u0430\u0437\u0440\u044B\u0432\u043D\u044B\u0439 \u043F\u0440\u043E\u0431\u0435\u043B (U+202F), \u043C\u0438\u043D\u0443\u0441 \u2014 \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u0439 (U+2212). */
function typeset(formatted: string): string {
  return formatted.replace(/\u00A0/g, '\u202F').replace(/-/g, '\u2212');
}

/** \u0427\u0438\u0441\u043B\u043E \u0431\u0435\u0437 \u0432\u0430\u043B\u044E\u0442\u044B: "1 795 241". \u0417\u043D\u0430\u043A \u20BD \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B \u0440\u0438\u0441\u0443\u044E\u0442 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E, \u043F\u0440\u0438\u0433\u043B\u0443\u0448\u0451\u043D\u043D\u044B\u043C. */
export function formatNumber(amount: number, locale = 'ru-RU'): string {
  return typeset(new Intl.NumberFormat(locale).format(Math.round(amount)));
}

export function formatAmount(amount: number, locale = 'ru-RU'): string {
  return formatNumber(amount, locale) + '\u00A0\u20BD';
}

/** \u0414\u043E\u043B\u044F 0\u20261 \u043F\u043E \u043F\u0440\u0430\u0432\u0438\u043B\u0430\u043C \u043B\u043E\u043A\u0430\u043B\u0438: "69,6 %" / "69.6%". */
export function formatPercent(fraction: number, locale = 'ru-RU', signed = false): string {
  return typeset(
    new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      signDisplay: signed ? 'exceptZero' : 'auto',
    }).format(fraction),
  );
}

/** \u041A\u043E\u0440\u043E\u0442\u043A\u0430\u044F \u043F\u043E\u0434\u043F\u0438\u0441\u044C \u0434\u043B\u044F \u0433\u0440\u0430\u0444\u0438\u043A\u0430: "1,8 \u043C\u043B\u043D" / "1.8M". */
export function formatCompact(amount: number, locale = 'ru-RU'): string {
  return typeset(
    new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(amount),
  );
}
