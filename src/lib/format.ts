export function currency(amount: number, code = 'IDR') {
  return new Intl.NumberFormat(code === 'IDR' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: code === 'IDR' ? 0 : 2,
  }).format(amount || 0);
}

export function shortDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function inputDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

export function parseAmount(value: string) {
  const digits = value.replace(/[^\d]/g, '');
  return Number.parseInt(digits || '0', 10);
}

export function daysUntil(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - start.getTime()) / 86_400_000);
}

export function todayInput() {
  return inputDate(new Date());
}

export function addDaysInput(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return inputDate(date);
}
