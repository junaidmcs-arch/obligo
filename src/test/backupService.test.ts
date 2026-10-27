import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db/db';
import { backupService } from '@/services/backupService';
import { parseBackup } from '@/services/backupValidation';
import { MAX_BACKUP_BYTES } from '@/models/backup';
import { backupFixture } from './fixtures/backup';

beforeEach(async () => {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) await table.clear();
  });
});
afterEach(() => vi.restoreAllMocks());

describe('JSON backup storage', () => {
  it('round trips Unicode, archives, status notes, IDs, dates, first month and settings across reopen', async () => {
    await backupService.restore(JSON.stringify(backupFixture()));
    const exported = await backupService.create();
    await db.categories.put({
      id: 'extra',
      name: 'Discard me',
      color: '#123456',
    });
    await backupService.restore(exported.text);
    db.close();
    await db.open();
    expect(await db.categories.count()).toBe(1);
    expect(await db.obligations.get('internet')).toMatchObject({
      id: 'internet',
      title: 'انٹرنیٹ',
      isActive: false,
      startMonth: 24322,
      amount: 3000.5,
      currency: 'PKR',
      createdAt: new Date('2026-10-27T10:00:00.000Z'),
    });
    expect(await db.statuses.get('paid')).toMatchObject({
      status: 'completed',
      notes: 'Paid ✓',
      completedAt: new Date('2026-10-27T11:00:00.000Z'),
    });
    expect((await db.settings.get('default'))?.theme).toBe('dark');
    expect(exported.preview).toMatchObject({
      categories: 1,
      obligations: 1,
      archived: 1,
      statuses: 1,
    });
    expect(exported.filename).toMatch(/^obligo-backup-.*\.json$/);
  });
  it('exports defaults on a new install and can restore an empty backup', async () => {
    const empty = await backupService.create();
    expect(parseBackup(empty.text).data.settings.theme).toBe('system');
    await backupService.restore(JSON.stringify(backupFixture()));
    await backupService.restore(empty.text);
    expect(await db.obligations.count()).toBe(0);
    expect(await db.categories.count()).toBe(0);
    expect(await db.statuses.count()).toBe(0);
    expect(await db.settings.count()).toBe(1);
  });
  it('rolls back all four tables if a write fails after clearing them', async () => {
    await db.categories.add({
      id: 'original',
      name: 'Original',
      color: '#123456',
    });
    const original = parseBackup((await backupService.create()).text).data;
    vi.spyOn(db.settings, 'add').mockRejectedValueOnce(
      new Error('Storage is full.'),
    );
    await expect(
      backupService.restore(JSON.stringify(backupFixture())),
    ).rejects.toThrow('Storage is full');
    const after = parseBackup((await backupService.create()).text).data;
    expect(after).toEqual(original);
  });
  it('rejects an invalid import without changing existing records', async () => {
    await db.categories.add({
      id: 'original',
      name: 'Original',
      color: '#123456',
    });
    const invalid = backupFixture();
    invalid.data.obligations[0].categoryId = 'missing';
    await expect(
      backupService.restore(JSON.stringify(invalid)),
    ).rejects.toThrow('missing category');
    expect(await db.categories.count()).toBe(1);
    expect(await db.obligations.count()).toBe(0);
  });
});

describe('backup validation', () => {
  it.each([
    ['format', { format: 'other-app' }],
    ['version', { schemaVersion: 2 }],
    ['date', { exportedAt: '2026-02-30T00:00:00.000Z' }],
    ['missing data', { data: null }],
  ])('rejects %s', (_name, fields) => {
    expect(() =>
      parseBackup(JSON.stringify({ ...backupFixture(), ...fields })),
    ).toThrow();
  });
  it.each([
    { dueDay: 0 },
    { dueDay: 32 },
    { dueDay: 1.5 },
    { amount: -1 },
    { amount: '3' },
    { currency: null },
    { title: '' },
    { priority: 'urgent' },
    { frequency: 'daily' },
    { isActive: 'false' },
    { startMonth: -1 },
    { createdAt: 'not a date' },
  ])('rejects invalid obligation fields %j', (fields) => {
    const fixture = backupFixture();
    const data = {
      ...fixture.data,
      obligations: [{ ...fixture.data.obligations[0], ...fields }],
    };
    expect(() => parseBackup(JSON.stringify({ ...fixture, data }))).toThrow();
  });
  it('rejects duplicate identities, names and monthly statuses', () => {
    const fixture = backupFixture();
    const { categories, obligations, statuses } = fixture.data;
    for (const fields of [
      { categories: [...categories, ...categories] },
      {
        categories: [
          ...categories,
          { ...categories[0], id: 'other', name: 'home 🏠' },
        ],
      },
      { obligations: [...obligations, ...obligations] },
      { statuses: [...statuses, { ...statuses[0], id: 'another' }] },
      { statuses: [...statuses, { ...statuses[0], month: 12 }] },
    ])
      expect(() =>
        parseBackup(
          JSON.stringify({ ...fixture, data: { ...fixture.data, ...fields } }),
        ),
      ).toThrow('duplicate');
  });
  it('rejects orphan statuses and invalid preferences', () => {
    const fixture = backupFixture();
    fixture.data.statuses[0].obligationId = 'missing';
    expect(() => parseBackup(JSON.stringify(fixture))).toThrow(
      'missing obligation',
    );
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...backupFixture(),
          data: {
            ...backupFixture().data,
            settings: { id: 'default', theme: 'dark' },
          },
        }),
      ),
    ).toThrow();
  });
  it('rejects malformed and oversized JSON', () => {
    expect(() => parseBackup('{')).toThrow('not valid JSON');
    expect(() => parseBackup(' '.repeat(MAX_BACKUP_BYTES + 1))).toThrow(
      '10 MB',
    );
  });
  it('supports legacy obligations without a first month and ignores unrecognized fields', () => {
    const fixture = backupFixture();
    const { startMonth: _omitted, ...legacy } = fixture.data.obligations[0];
    void _omitted;
    const text = JSON.stringify({
      ...fixture,
      data: { ...fixture.data, obligations: [{ ...legacy, unrelated: true }] },
    });
    const restored = parseBackup('\uFEFF' + text).data.obligations[0];
    expect(restored.startMonth).toBeUndefined();
    expect(restored).not.toHaveProperty('unrelated');
    expect(restored.createdAt).toBeInstanceOf(Date);
  });
});
