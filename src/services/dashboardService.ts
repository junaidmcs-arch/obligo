import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  startOfDay,
} from 'date-fns';
import type { Obligation } from '@/models/types';
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
export function dashboardSummary(obligations: Obligation[], now: Date) {
  const today = startOfDay(now);
  const active = obligations.filter((o) => o.isActive);
  const action = active
    .map((obligation) => {
      const date = dueDate(obligation, today);
      return { obligation, date, days: differenceInCalendarDays(date, today) };
    })
    .sort(
      (a, b) =>
        a.days - b.days || a.obligation.title.localeCompare(b.obligation.title),
    );
  const upcoming = active
    .map((obligation) => {
      let date = dueDate(obligation, today);
      if (date < today) date = dueDate(obligation, addMonths(today, 1));
      return { obligation, date, days: differenceInCalendarDays(date, today) };
    })
    .sort(
      (a, b) =>
        a.days - b.days || a.obligation.title.localeCompare(b.obligation.title),
    );
  return {
    total: obligations.length,
    active: active.length,
    high: active.filter((o) => o.priority === 'high').length,
    thisWeek: upcoming.filter((o) => o.date < addDays(today, 7)).length,
    action,
    upcoming: upcoming.slice(0, 5),
  };
}
