import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { db } from '@/db/db';
import {
  COLOR_THEMES,
  type ColorTheme,
  type UserSettings,
} from '@/models/types';
import {
  defaultSettings,
  resolveSettings,
  settingsService,
} from '@/services/settingsService';
import { backupService } from '@/services/backupService';
import { backupFixture } from './fixtures/backup';
import { palettes } from '@/theme/palettes';
import { useTheme } from '@/hooks/useTheme';
import { useObligo } from '@/hooks/useObligo';
import { AppearanceCard } from '@/features/settings/AppearanceCard';

let prefersDark = false;
let media: EventTarget;
beforeEach(async () => {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) await table.clear();
  });
  prefersDark = false;
  media = new EventTarget();
  Object.defineProperty(media, 'matches', { get: () => prefersDark });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media),
  );
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  document.head.append(meta);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('style');
  document.documentElement.classList.remove('dark');
  delete document.documentElement.dataset.colorTheme;
  document.querySelector('meta[name="theme-color"]')?.remove();
});

it('persists palette and mode independently across concurrent writes and reopen', async () => {
  await db.settings.put({ ...defaultSettings, currencySymbol: 'USD' });
  await Promise.all([
    settingsService.setTheme('dark'),
    settingsService.setColorTheme('ocean'),
  ]);
  db.close();
  await db.open();
  expect(await db.settings.get('default')).toMatchObject({
    theme: 'dark',
    colorTheme: 'ocean',
    currencySymbol: 'USD',
  });
});

it('defaults legacy settings to Forest without changing their dark mode or preferences', async () => {
  const { colorTheme: omitted, ...legacy } = {
    ...defaultSettings,
    theme: 'dark' as const,
  };
  void omitted;
  // Reproduce the exact stored shape from 0.1.2 before colorTheme existed.
  await db.settings.put(legacy as UserSettings);
  expect(resolveSettings(await db.settings.get('default'))).toMatchObject({
    theme: 'dark',
    colorTheme: 'forest',
  });
  await settingsService.setColorTheme('amber');
  expect(await db.settings.get('default')).toMatchObject({
    theme: 'dark',
    colorTheme: 'amber',
  });
});

it('restores older backups and round trips the new colour preference', async () => {
  const fixture = backupFixture();
  const { colorTheme: omitted, ...legacy } = fixture.data.settings;
  void omitted;
  await backupService.restore(
    JSON.stringify({ ...fixture, data: { ...fixture.data, settings: legacy } }),
  );
  expect(await db.settings.get('default')).toMatchObject({
    theme: 'dark',
    colorTheme: 'forest',
  });
  await settingsService.setColorTheme('rose');
  const backup = await backupService.create();
  await settingsService.setColorTheme('slate');
  await backupService.restore(backup.text);
  expect(await db.settings.get('default')).toMatchObject({
    theme: 'dark',
    colorTheme: 'rose',
  });
});

it('rejects unknown palettes on save and import without changing settings', async () => {
  await settingsService.setColorTheme('ocean');
  await expect(
    settingsService.setColorTheme('unknown' as ColorTheme),
  ).rejects.toThrow('valid colour theme');
  const fixture = backupFixture();
  const settings = { ...fixture.data.settings, colorTheme: 'unknown' };
  await expect(
    backupService.restore(
      JSON.stringify({ ...fixture, data: { ...fixture.data, settings } }),
    ),
  ).rejects.toThrow('colour theme');
  expect((await db.settings.get('default'))?.colorTheme).toBe('ocean');
});

it('follows system brightness, keeps the chosen palette and updates the browser theme colour', () => {
  const removeListener = vi.spyOn(media, 'removeEventListener');
  const { rerender, unmount } = renderHook(
    ({ mode, palette }: { mode: UserSettings['theme']; palette: ColorTheme }) =>
      useTheme(mode, palette),
    {
      initialProps: {
        mode: 'system' as UserSettings['theme'],
        palette: 'violet' as ColorTheme,
      },
    },
  );
  const root = document.documentElement;
  expect(root.style.getPropertyValue('--bg')).toBe(palettes.violet.light.bg);
  act(() => {
    prefersDark = true;
    media.dispatchEvent(new Event('change'));
  });
  expect(root).toHaveClass('dark');
  expect(root.dataset.colorTheme).toBe('violet');
  expect(root.style.getPropertyValue('--primary')).toBe(
    palettes.violet.dark.primary,
  );
  expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    palettes.violet.dark.surface,
  );
  rerender({ mode: 'light', palette: 'ocean' });
  act(() => media.dispatchEvent(new Event('change')));
  expect(root).not.toHaveClass('dark');
  expect(root.style.getPropertyValue('--primary')).toBe(
    palettes.ocean.light.primary,
  );
  unmount();
  expect(removeListener).toHaveBeenCalled();
});

function AppearanceHarness() {
  const data = useObligo();
  useTheme(data?.settings.theme ?? 'system', data?.settings.colorTheme);
  return data ? <AppearanceCard settings={data.settings} /> : null;
}

it('applies choices from Settings and preserves the current choice if saving fails', async () => {
  render(<AppearanceHarness />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Ocean colour theme' }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Ocean colour theme' }),
    ).toHaveAttribute('aria-pressed', 'true'),
  );
  expect(document.documentElement.dataset.colorTheme).toBe('ocean');
  fireEvent.click(screen.getByRole('button', { name: 'Dark' }));
  await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
  expect(document.documentElement.style.getPropertyValue('--primary')).toBe(
    palettes.ocean.dark.primary,
  );
  vi.spyOn(settingsService, 'setColorTheme').mockRejectedValueOnce(
    new Error('Storage is full.'),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Rose colour theme' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Storage is full.',
  );
  expect(
    screen.getByRole('button', { name: 'Ocean colour theme' }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(document.documentElement.dataset.colorTheme).toBe('ocean');
});

function luminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => {
      const value = parseInt(channel, 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a: string, b: string): number {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

it.each(COLOR_THEMES)(
  '%s keeps readable text and button contrast in both modes',
  (id) => {
    for (const colors of [palettes[id].light, palettes[id].dark]) {
      for (const background of [colors.bg, colors.surface, colors.soft]) {
        expect(contrast(colors.text, background)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(colors.muted, background)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(colors.primary, background)).toBeGreaterThanOrEqual(
          4.5,
        );
      }
      expect(
        contrast(colors['on-primary'], colors.primary),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(colors['on-primary'], colors['primary-hover']),
      ).toBeGreaterThanOrEqual(4.5);
    }
  },
);
