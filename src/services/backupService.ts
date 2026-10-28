import { db } from '@/db/db';
import {
  BACKUP_FORMAT,
  BACKUP_SCHEMA_VERSION,
  type PreparedBackup,
} from '@/models/backup';
import { version } from '../../package.json';
import { resolveSettings } from './settingsService';
import { parseBackup } from './backupValidation';

export const backupService = {
  async create(): Promise<PreparedBackup> {
    const exportedAt = new Date();
    // One read transaction provides a consistent snapshot across all four tables.
    const data = await db.transaction('r', db.tables, async () => ({
      categories: await db.categories.toArray(),
      obligations: await db.obligations.toArray(),
      statuses: await db.statuses.toArray(),
      settings: resolveSettings(await db.settings.get('default')),
    }));
    const text = JSON.stringify(
      {
        format: BACKUP_FORMAT,
        schemaVersion: BACKUP_SCHEMA_VERSION,
        appVersion: version,
        exportedAt: exportedAt.toISOString(),
        data,
      },
      null,
      2,
    );
    // Never offer an export that this version cannot restore.
    const { preview } = parseBackup(text);
    return {
      text,
      preview,
      filename: `obligo-backup-${exportedAt.toISOString().replace(/[:.]/g, '-')}.json`,
    };
  },
  preview(text: string) {
    return parseBackup(text).preview;
  },
  async restore(text: string): Promise<void> {
    const { data } = parseBackup(text);
    await db.transaction('rw', db.tables, async () => {
      await db.statuses.clear();
      await db.obligations.clear();
      await db.categories.clear();
      await db.settings.clear();
      await db.categories.bulkAdd(data.categories);
      await db.obligations.bulkAdd(data.obligations);
      await db.statuses.bulkAdd(data.statuses);
      await db.settings.add(data.settings);
    });
  },
};
