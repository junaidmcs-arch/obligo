import { db } from '@/db/db';
import type { UserSettings } from '@/models/types';
export const defaultSettings: UserSettings = {
  id: 'default',
  theme: 'system',
  reminderDaysBefore: 3,
  notificationsEnabled: false,
  currencySymbol: 'PKR',
};
export const settingsService = {
  async setTheme(theme: UserSettings['theme']) {
    if (!['light', 'dark', 'system'].includes(theme))
      throw new Error('Invalid theme.');
    await db.transaction('rw', db.settings, async () => {
      const settings = (await db.settings.get('default')) ?? defaultSettings;
      await db.settings.put({ ...settings, theme });
    });
  },
};
