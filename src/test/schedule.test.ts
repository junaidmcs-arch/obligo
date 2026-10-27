import { describe, expect, it } from 'vitest';
import { currentOccurrence, firstDueDate } from '@/services/scheduleService';
import { dashboardSummary } from '@/services/dashboardService';
import type { Obligation, ObligationStatus } from '@/models/types';
const createdAt = new Date(2026, 9, 27, 15);
const obligation: Obligation = {
  id: 'test',
  title: 'Internet',
  dueDay: 10,
  categoryId: 'home',
  priority: 'high',
  frequency: 'monthly',
  isActive: true,
  createdAt,
  updatedAt: createdAt,
};
describe('first occurrence and monthly completion', () => {
  it('starts a new past-day obligation next month, including legacy records', () => {
    const summary = dashboardSummary([obligation], createdAt);
    expect(summary.action[0].date).toEqual(new Date(2026, 10, 10));
    expect(summary.action[0].days).toBe(14);
    expect(summary.thisWeek).toBe(0);
  });
  it('keeps today and later due days in the current month', () => {
    expect(firstDueDate(27, createdAt)).toEqual(new Date(2026, 9, 27));
    expect(firstDueDate(30, createdAt)).toEqual(new Date(2026, 9, 30));
  });
  it('handles year rollover and clamped month-end days', () => {
    expect(firstDueDate(10, new Date(2026, 11, 27))).toEqual(
      new Date(2027, 0, 10),
    );
    expect(firstDueDate(31, new Date(2026, 1, 28, 23))).toEqual(
      new Date(2026, 1, 28),
    );
    expect(firstDueDate(28, new Date(2028, 1, 29))).toEqual(
      new Date(2028, 2, 28),
    );
  });
  it('becomes overdue after its actual first due date', () => {
    expect(
      dashboardSummary([obligation], new Date(2026, 10, 11)).action[0].days,
    ).toBe(-1);
  });
  it('skips completed months but leaves future occurrences active', () => {
    const statuses: ObligationStatus[] = [
      {
        id: 'done',
        obligationId: 'test',
        year: 2026,
        month: 11,
        status: 'completed',
      },
    ];
    const summary = dashboardSummary(
      [obligation],
      new Date(2026, 10, 10),
      statuses,
    );
    expect(summary.action).toEqual([]);
    expect(summary.active).toBe(1);
    expect(summary.thisWeek).toBe(0);
    expect(summary.upcoming[0].date).toEqual(new Date(2026, 11, 10));
    expect(
      dashboardSummary([obligation], new Date(2026, 11, 1), statuses).action,
    ).toHaveLength(1);
    expect(currentOccurrence(obligation, createdAt)).toEqual(
      new Date(2026, 10, 10),
    );
  });
});
