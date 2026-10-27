import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
export function WebUpdateNotice({ onReady }: { onReady: () => void }) {
  const [error, setError] = useState(false);
  const {
    needRefresh: [update],
    updateServiceWorker,
  } = useRegisterSW({
    onOfflineReady: onReady,
    onRegisterError() {
      setError(true);
    },
  });
  if (error)
    return (
      <p className="error" role="alert">
        Offline installation could not finish. Reopen online to try again.
      </p>
    );
  if (!update) return null;
  return (
    <div className="update-notice" role="status">
      <span>A new version is ready. Save your work before updating.</span>
      <Button onClick={() => void updateServiceWorker(true)}>Update app</Button>
    </div>
  );
}
