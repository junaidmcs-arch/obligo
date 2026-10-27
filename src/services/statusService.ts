import { db } from '@/db/db';
import { currentOccurrence } from './scheduleService';
export const statusService = {
  async setCompleted(
    obligationId: string,
    date: Date,
    completed: boolean,
    now = new Date(),
  ) {
    if (!Number.isFinite(date.getTime()))
      throw new Error('Invalid completion date.');
    await db.transaction('rw', db.obligations, db.statuses, async () => {
      const obligation = await db.obligations.get(obligationId);
      if (!obligation?.isActive)
        throw new Error('Only active obligations can be completed.');
      const expected = currentOccurrence(obligation, now);
      if (
        date.getFullYear() !== expected.getFullYear() ||
        date.getMonth() !== expected.getMonth()
      )
        throw new Error('The month has changed. Refresh and try again.');
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const existing = await db.statuses
        .where('[obligationId+year+month]')
        .equals([obligationId, year, month])
        .first();
      await db.statuses.put({
        ...existing,
        id: existing?.id ?? crypto.randomUUID(),
        obligationId,
        year,
        month,
        status: completed ? 'completed' : 'pending',
        completedAt: completed ? (existing?.completedAt ?? now) : undefined,
      });
    });
  },
};
