import { describe, expect, it } from 'vitest';
import { dashboardSummary, dueDate } from '@/services/dashboardService';
import type { Obligation } from '@/models/types';
function obligation(dueDay: number, isActive = true): Obligation {
  return {
    id: String(dueDay),
    title: `Day ${dueDay}`,
    categoryId: 'home',
    dueDay,
    priority: 'high',
    frequency: 'monthly',
    isActive,
    createdAt: new Date(2026, 0, 1),
    updatedAt: new Date(2026, 0, 1),
  };
}
describe('monthly date projections', () => {
  it('clamps end-of-month dates including leap years', () => {
    expect(dueDate({ dueDay: 31 }, new Date(2026, 1, 1)).getDate()).toBe(28);
    expect(dueDate({ dueDay: 30 }, new Date(2028, 1, 1)).getDate()).toBe(29);
  });
  it('orders overdue, today, then upcoming and excludes archived records', () => {
    const result = dashboardSummary(
      [obligation(28), obligation(25), obligation(3), obligation(1, false)],
      new Date(2026, 9, 25, 23),
    );
    expect(result.action.map((a) => a.days)).toEqual([-22, 0, 3]);
    expect(result.total).toBe(4);
    expect(result.active).toBe(3);
    expect(result.high).toBe(3);
  });
  it('projects next occurrences across December and limits upcoming to five', () => {
    const result = dashboardSummary(
      [1, 2, 3, 4, 5, 6].map((d) => obligation(d)),
      new Date(2026, 11, 30),
    );
    expect(result.upcoming).toHaveLength(5);
    expect(result.upcoming[0].date.getFullYear()).toBe(2027);
    expect(result.thisWeek).toBe(5);
  });
  it('counts today through day six without including day seven', () => {
    const result = dashboardSummary(
      [25, 31, 1].map((d) => obligation(d)),
      new Date(2026, 9, 25),
    );
    expect(result.thisWeek).toBe(2);
  });
});
