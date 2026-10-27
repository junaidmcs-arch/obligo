import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '@/db/db';
import { defaultSettings } from '@/services/settingsService';
export function useObligo() {
  return useLiveQuery(async () => {
    const [categories, obligations, settings] = await Promise.all([
      db.categories.orderBy('name').toArray(),
      db.obligations.toArray(),
      db.settings.get('default'),
    ]);
    return { categories, obligations, settings: settings ?? defaultSettings };
  });
}
export function useToday() {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const update = () => setToday(new Date());
    const interval = window.setInterval(update, 60000);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', update);
    };
  }, []);
  return today;
}
export function useTheme(theme: 'light' | 'dark' | 'system') {
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () =>
      document.documentElement.classList.toggle(
        'dark',
        theme === 'dark' || (theme === 'system' && query.matches),
      );
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [theme]);
}
