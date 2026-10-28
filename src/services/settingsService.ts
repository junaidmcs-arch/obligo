import { db } from '@/db/db';
import type { ColorTheme, UserSettings } from '@/models/types';
import {
  DEFAULT_COLOR_THEME,
  isColorTheme,
  resolveColorTheme,
} from '@/theme/palettes';
export const defaultSettings: UserSettings = {
  id: 'default',
  theme: 'system',
  colorTheme: DEFAULT_COLOR_THEME,
  reminderDaysBefore: 3,
  notificationsEnabled: false,
  currencySymbol: 'PKR',
};

// Records created before colour themes have no colorTheme property.
export function resolveSettings(
  settings?: Partial<UserSettings>,
): UserSettings {
  return {
    ...defaultSettings,
    ...settings,
    colorTheme: resolveColorTheme(settings?.colorTheme),
  };
}

async function updateAppearance(
  patch: Partial<Pick<UserSettings, 'theme' | 'colorTheme'>>,
) {
  await db.transaction('rw', db.settings, async () => {
    const settings = resolveSettings(await db.settings.get('default'));
    await db.settings.put({ ...settings, ...patch });
  });
}

export const settingsService = {
  async setTheme(theme: UserSettings['theme']) {
    if (!['light', 'dark', 'system'].includes(theme))
      throw new Error('Invalid theme.');
    await updateAppearance({ theme });
  },
  async setColorTheme(colorTheme: ColorTheme) {
    if (!isColorTheme(colorTheme))
      throw new Error('Choose a valid colour theme.');
    await updateAppearance({ colorTheme });
  },
};
