import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { db } from '@/db/db';
import { categoryService } from '@/services/categoryService';
import { obligationService } from '@/services/obligationService';
import { statusService } from '@/services/statusService';
import { currentOccurrence } from '@/services/scheduleService';
const now = new Date(2026, 9, 27, 12);
beforeEach(async () => {
  await Promise.all([
    db.obligations.clear(),
    db.categories.clear(),
    db.statuses.clear(),
  ]);
});
afterEach(() => vi.useRealTimers());
async function create() {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
  const categoryId = await categoryService.save('Home', '#176b50');
  const input = {
    title: 'Internet',
    dueDay: 10,
    priority: 'high' as const,
    categoryId,
  };
  const id = await obligationService.save(input);
  return { id, input };
}
it('persists the first eligible month and preserves it when editing', async () => {
  const { id, input } = await create();
  expect((await db.obligations.get(id))?.startMonth).toBe(2026 * 12 + 10);
  await obligationService.save({ ...input, title: 'Edited', dueDay: 5 }, id);
  const edited = (await db.obligations.get(id))!;
  expect(currentOccurrence(edited, now)).toEqual(new Date(2026, 10, 5));
});
it('completes and undoes one monthly occurrence without archiving or duplicating', async () => {
  const { id } = await create();
  const date = new Date(2026, 10, 10);
  await Promise.all([
    statusService.setCompleted(id, date, true, now),
    statusService.setCompleted(id, date, true, now),
  ]);
  expect(await db.statuses.count()).toBe(1);
  expect((await db.statuses.toArray())[0]).toMatchObject({
    year: 2026,
    month: 11,
    status: 'completed',
    completedAt: now,
  });
  expect((await db.obligations.get(id))?.isActive).toBe(true);
  db.close();
  await db.open();
  expect((await db.statuses.toArray())[0].status).toBe('completed');
  await statusService.setCompleted(id, date, false, now);
  expect((await db.statuses.toArray())[0]).toMatchObject({
    status: 'pending',
    completedAt: undefined,
  });
  expect(await db.statuses.count()).toBe(1);
});
it('rejects stale periods, archived obligations, and missing records', async () => {
  const { id } = await create();
  await expect(
    statusService.setCompleted(id, new Date(2026, 9, 10), true, now),
  ).rejects.toThrow('month');
  await obligationService.setActive(id, false);
  await expect(
    statusService.setCompleted(id, new Date(2026, 10, 10), true, now),
  ).rejects.toThrow('active');
  await expect(
    statusService.setCompleted('missing', new Date(2026, 10, 10), true, now),
  ).rejects.toThrow('active');
  expect(await db.statuses.count()).toBe(0);
});
