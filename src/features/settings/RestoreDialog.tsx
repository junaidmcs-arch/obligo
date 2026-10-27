import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import type { PreparedBackup } from '@/models/backup';
import { BackupSummary } from './BackupSummary';

export function RestoreDialog({
  backup,
  busy,
  error,
  onRestore,
  onClose,
}: {
  backup: PreparedBackup;
  busy: boolean;
  error: string;
  onRestore: () => void;
  onClose: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <Modal title="Restore this backup?" onClose={onClose}>
      <div className="backup-review">
        <p className="backup-filename">{backup.filename}</p>
        <BackupSummary preview={backup.preview} />
        <p>
          <strong>
            This replaces all categories, obligations, completion history, and
            settings currently on this device.
          </strong>{' '}
          Records will not be merged. Save a backup of your current records
          first if you want to keep them.
        </p>
        {backup.preview.obligations === 0 && (
          <p>This backup contains no obligations.</p>
        )}
        <label className="backup-confirm">
          <input
            type="checkbox"
            checked={confirmed}
            disabled={busy}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span>I understand that my current records will be replaced.</span>
        </label>
        {error && (
          <p role="alert" className="error">
            Restore failed. Your current records are unchanged. {error}
          </p>
        )}
        <div className="backup-actions">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!confirmed || busy}
            onClick={onRestore}
          >
            {busy ? 'Restoring…' : 'Replace and restore'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
