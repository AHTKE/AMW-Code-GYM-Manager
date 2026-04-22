// Currency / formatting helpers.

export function fmtCurrency(n: number, suffix = 'ج.م'): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return `0 ${suffix}`;
  return `${Math.round(n).toLocaleString('ar-EG')} ${suffix}`;
}

export function fmtDate(input: string | number | Date): string {
  const d = typeof input === 'string' ? new Date(input) : new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function fmtTime(input: string | number | Date): string {
  const d = typeof input === 'string' ? new Date(input) : new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
