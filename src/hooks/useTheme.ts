import { useEffect } from 'react';
import type { ColorTheme, UserSettings } from '@/models/types';
import {
  DEFAULT_COLOR_THEME,
  palettes,
  resolveColorTheme,
} from '@/theme/palettes';

export function useTheme(
  theme: UserSettings['theme'],
  colorTheme: ColorTheme = DEFAULT_COLOR_THEME,
) {
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => {
      const dark = theme === 'dark' || (theme === 'system' && query.matches);
      const selected = resolveColorTheme(colorTheme);
      const colors = palettes[selected][dark ? 'dark' : 'light'];
      const root = document.documentElement;
      root.classList.toggle('dark', dark);
      root.dataset.colorTheme = selected;
      for (const [token, value] of Object.entries(colors))
        root.style.setProperty(`--${token}`, value);
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', colors.surface);
    };
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [theme, colorTheme]);
}
