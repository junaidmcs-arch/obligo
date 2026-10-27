import { addMonths, endOfMonth, startOfDay } from 'date-fns';
import type { Obligation, ObligationStatus } from '@/models/types';
export function dueDate(
  obligation: Pick<Obligation, 'dueDay'>,
  month: Date,
): Date {
  return new Date(
    month.getFullYear(),
    month.getMonth(),
    Math.min(obligation.dueDay, endOfMonth(month).getDate()),
  );
}
export function firstDueDate(dueDay: number, createdAt: Date): Date {
  const date = dueDate({ dueDay }, createdAt);
  return date < startOfDay(createdAt)
    ? dueDate({ dueDay }, addMonths(createdAt, 1))
    : date;
}
export function startMonth(obligation: Obligation): number {
  if (obligation.startMonth !== undefined) return obligation.startMonth;
  const first = firstDueDate(obligation.dueDay, obligation.createdAt);
  return first.getFullYear() * 12 + first.getMonth();
}
export function currentOccurrence(obligation: Obligation, now: Date): Date {
  const month = Math.max(
    startMonth(obligation),
    now.getFullYear() * 12 + now.getMonth(),
  );
  return dueDate(obligation, new Date(Math.floor(month / 12), month % 12, 1));
}
export function isCompleted(
  id: string,
  date: Date,
  statuses: ObligationStatus[],
): boolean {
  return statuses.some(
    (s) =>
      s.obligationId === id &&
      s.year === date.getFullYear() &&
      s.month === date.getMonth() + 1 &&
      s.status === 'completed',
  );
}
export function nextPendingOccurrence(
  obligation: Obligation,
  now: Date,
  statuses: ObligationStatus[],
): Date {
  let date = currentOccurrence(obligation, now);
  while (date < startOfDay(now) || isCompleted(obligation.id, date, statuses))
    date = dueDate(obligation, addMonths(date, 1));
  return date;
}
