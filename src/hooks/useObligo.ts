import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '@/db/db';
import { resolveSettings } from '@/services/settingsService';
export function useObligo() {
  return useLiveQuery(async () => {
    const [categories, obligations, settings, statuses] = await Promise.all([
      db.categories.orderBy('name').toArray(),
      db.obligations.toArray(),
      db.settings.get('default'),
      db.statuses.toArray(),
    ]);
    return {
      categories,
      obligations,
      statuses,
      settings: resolveSettings(settings),
    };
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
