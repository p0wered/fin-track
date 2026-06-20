import type { FinanceSource, MonthlyBalances } from '../types.ts';

export interface BackupData {
  sources: FinanceSource[];
  monthlyBalances: MonthlyBalances;
}

interface BackupFile extends BackupData {
  app: 'fin-track';
  version: 1;
  exportedAt: string;
}

/** Собирает файл бэкапа и инициирует его скачивание. */
export function downloadBackup(data: BackupData): void {
  const payload: BackupFile = {
    app: 'fin-track',
    version: 1,
    exportedAt: new Date().toISOString(),
    sources: data.sources,
    monthlyBalances: data.monthlyBalances,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fin-track-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function isSource(v: unknown): v is FinanceSource {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.amount === 'number' &&
    typeof o.color === 'string'
  );
}

function isMonthlyBalances(v: unknown): v is MonthlyBalances {
  if (typeof v !== 'object' || v === null) return false;
  return Object.values(v as Record<string, unknown>).every((n) => typeof n === 'number');
}

/** Парсит и валидирует содержимое файла бэкапа. Бросает Error при невалидных данных. */
export function parseBackup(raw: string): BackupData {
  const data = JSON.parse(raw) as unknown;
  if (typeof data !== 'object' || data === null) throw new Error('invalid backup');

  const o = data as Record<string, unknown>;
  if (!Array.isArray(o.sources) || !o.sources.every(isSource)) {
    throw new Error('invalid sources');
  }
  if (!isMonthlyBalances(o.monthlyBalances)) {
    throw new Error('invalid monthlyBalances');
  }

  return { sources: o.sources, monthlyBalances: o.monthlyBalances };
}
