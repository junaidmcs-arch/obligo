import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { categoryService } from '@/services/categoryService';
import { obligationService } from '@/services/obligationService';
import { settingsService } from '@/services/settingsService';
const input = {
  title: 'Internet',
  dueDay: 31,
  priority: 'high' as const,
  categoryId: '',
};
beforeEach(async () => {
  await Promise.all([
    db.categories.clear(),
    db.obligations.clear(),
    db.statuses.clear(),
    db.settings.clear(),
  ]);
});
describe('local services', () => {
  it('creates, edits, archives and restores without deleting records', async () => {
    const categoryId = await categoryService.save('Home', '#176b50');
    const id = await obligationService.save({ ...input, categoryId });
    const original = await db.obligations.get(id);
    await obligationService.save(
      { ...input, title: 'New title', categoryId },
      id,
    );
    await obligationService.setActive(id, false);
    expect(await db.obligations.get(id)).toMatchObject({
      title: 'New title',
      isActive: false,
      createdAt: original?.createdAt,
    });
    expect(await db.obligations.count()).toBe(1);
    await obligationService.setActive(id, true);
    expect((await db.obligations.get(id))?.isActive).toBe(true);
    db.close();
    await db.open();
    expect((await db.obligations.get(id))?.title).toBe('New title');
  });
  it('protects categories referenced by archived obligations', async () => {
    const categoryId = await categoryService.save('Home', '#176b50');
    const id = await obligationService.save({ ...input, categoryId });
    await obligationService.setActive(id, false);
    await expect(categoryService.remove(categoryId)).rejects.toThrow(
      'including archived',
    );
    expect(await db.categories.count()).toBe(1);
  });
  it('allows editing and deleting unused categories and rejects duplicate names', async () => {
    const id = await categoryService.save(' Home ', '#176b50');
    await expect(categoryService.save('home', '#176b50')).rejects.toThrow(
      'already exists',
    );
    await categoryService.save('School', '#ff0000', id);
    expect(await db.categories.get(id)).toMatchObject({
      name: 'School',
      color: '#ff0000',
    });
    await categoryService.remove(id);
    expect(await db.categories.count()).toBe(0);
  });
  it('rejects invalid inputs and dangling category references', async () => {
    for (const dueDay of [0, 32, 1.5, NaN])
      await expect(
        obligationService.save({ ...input, categoryId: 'home', dueDay }),
      ).rejects.toThrow('Due day');
    await expect(
      obligationService.save({ ...input, title: ' ' }),
    ).rejects.toThrow('title');
    await expect(
      obligationService.save({ ...input, categoryId: 'missing' }),
    ).rejects.toThrow('no longer exists');
    await expect(
      obligationService.save({ ...input, categoryId: 'missing', amount: -1 }),
    ).rejects.toThrow('amount');
    expect(await db.obligations.count()).toBe(0);
  });
  it('enforces one monthly status per obligation', async () => {
    const record = {
      obligationId: 'test',
      year: 2026,
      month: 10,
      status: 'pending' as const,
    };
    await db.statuses.add({ ...record, id: crypto.randomUUID() });
    await expect(
      db.statuses.add({ ...record, id: crypto.randomUUID() }),
    ).rejects.toThrow();
  });
  it('persists the chosen theme', async () => {
    await settingsService.setTheme('dark');
    expect((await db.settings.get('default'))?.theme).toBe('dark');
  });
});
