import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';
import type { Obligation, ObligationStatus } from '@/models/types';
import {
  currentOccurrence,
  isCompleted,
  nextPendingOccurrence,
} from './scheduleService';
export { dueDate } from './scheduleService';
export function dashboardSummary(
  obligations: Obligation[],
  now: Date,
  statuses: ObligationStatus[] = [],
) {
  const today = startOfDay(now);
  const active = obligations.filter((o) => o.isActive);
  const project = (obligation: Obligation, date: Date) => ({
    obligation,
    date,
    days: differenceInCalendarDays(date, today),
  });
  const sort = (a: ReturnType<typeof project>, b: ReturnType<typeof project>) =>
    a.days - b.days || a.obligation.title.localeCompare(b.obligation.title);
  const action = active
    .map((o) => project(o, currentOccurrence(o, today)))
    .filter(
      ({ obligation, date }) => !isCompleted(obligation.id, date, statuses),
    )
    .sort(sort);
  const upcoming = active
    .map((o) => project(o, nextPendingOccurrence(o, today, statuses)))
    .sort(sort);
  return {
    total: obligations.length,
    active: active.length,
    high: active.filter((o) => o.priority === 'high').length,
    thisWeek: upcoming.filter((o) => o.date < addDays(today, 7)).length,
    action,
    upcoming: upcoming.slice(0, 5),
  };
}
