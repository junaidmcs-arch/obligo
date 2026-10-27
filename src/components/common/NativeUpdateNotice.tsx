import { useEffect, useState } from 'react';
import {
  checkForRelease,
  type AvailableRelease,
} from '@/services/releaseService';
import { Button } from '@/components/ui/button';
import { version } from '../../../package.json';

export function NativeUpdateNotice() {
  const [release, setRelease] = useState<AvailableRelease | null>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    let disposed = false;
    let checking = false;
    let lastAttempt = 0;
    let controller: AbortController | undefined;
    async function check() {
      if (!navigator.onLine || checking || Date.now() - lastAttempt < 60_000)
        return;
      checking = true;
      lastAttempt = Date.now();
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 8_000);
      try {
        const found = await checkForRelease(version, controller.signal);
        if (!disposed && found) setRelease(found);
      } catch {
        /* Remain fully usable offline or when GitHub is unavailable. */
      } finally {
        window.clearTimeout(timeout);
        checking = false;
      }
    }
    void check();
    window.addEventListener('online', check);
    return () => {
      disposed = true;
      controller?.abort();
      window.removeEventListener('online', check);
    };
  }, []);
  if (!release || dismissed) return null;
  return (
    <aside
      className="update-notice"
      aria-label="Application update"
      role="status"
    >
      <strong>Obligo {release.version} is available</strong>
      <span>
        You have {version}. Download the new APK from our GitHub release, then
        open it to update. Keep the existing app installed to retain your data.
      </span>
      <Button asChild>
        <a href={release.url} target="_blank" rel="noopener noreferrer">
          View release & download
        </a>
      </Button>
      <Button variant="ghost" onClick={() => setDismissed(true)}>
        Later
      </Button>
    </aside>
  );
}
