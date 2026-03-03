export interface FinanceSource {
  id: string;
  name: string;
  amount: number;
  color: string;
}

export const COLORS = [
  '#6C63FF',
  '#00aaff',
  '#21a038',
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
