import { useRef, useState } from 'react';
import { backupService } from '@/services/backupService';
import { backupFileService } from '@/services/backupFileService';
import { errorMessage } from '@/lib/utils';
import type { PreparedBackup } from '@/models/backup';

export function useBackup() {
  const [prepared, setPrepared] = useState<PreparedBackup>();
  const [pending, setPending] = useState<PreparedBackup>();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const locked = useRef(false);

  async function run(label: string, action: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    setBusy(label);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      locked.current = false;
      setBusy('');
    }
  }
  return {
    prepared,
    pending,
    busy,
    error,
    message,
    prepare: () =>
      run('Preparing backup…', async () => {
        setPrepared(undefined);
        setPrepared(await backupService.create());
      }),
    select: (file: File) =>
      run('Checking backup…', async () => {
        setPending(undefined);
        const text = await backupFileService.read(file);
        setPending({
          text,
          filename: file.name,
          preview: backupService.preview(text),
        });
      }),
    save: () =>
      run('Opening save options…', async () => {
        if (!prepared) return;
        const result = await backupFileService.save(prepared);
        setMessage(
          result === 'cancelled'
            ? 'Save cancelled. Your backup is still ready.'
            : result === 'saved'
              ? 'Backup file saved.'
              : 'Download requested. Check Downloads or Files to confirm your backup was saved.',
        );
      }),
    share: () =>
      run('Opening share options…', async () => {
        if (!prepared) return;
        const shared = await backupFileService.share(prepared);
        setMessage(
          shared
            ? 'Share sheet finished. Check your chosen destination for the backup file.'
            : 'Sharing cancelled. Your backup is still ready.',
        );
      }),
    restore: () =>
      run('Restoring records…', async () => {
        if (!pending) return;
        await backupService.restore(pending.text);
        setPending(undefined);
        setPrepared(undefined);
        setMessage(
          'Backup restored. Your records and settings are now available on this device.',
        );
      }),
    cancel: () => {
      if (locked.current) return;
      setPending(undefined);
      setError('');
    },
  };
}
