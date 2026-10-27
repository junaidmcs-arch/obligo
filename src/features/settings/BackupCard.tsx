import { Download, FolderOpen, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBackup } from '@/hooks/useBackup';
import { backupFileService } from '@/services/backupFileService';
import { BackupSummary } from './BackupSummary';
import { RestoreDialog } from './RestoreDialog';

export function BackupCard() {
  const backup = useBackup();
  return (
    <section
      className="panel settings-card"
      aria-labelledby="backup-heading"
      aria-busy={Boolean(backup.busy)}
    >
      <Download className="accent" size={24} />
      <h2 id="backup-heading">Backup & restore</h2>
      <p>
        Keep a copy of your categories, active and archived obligations,
        completion history, and preferences. You can restore it on another
        device.
      </p>
      <p className="muted">
        Backups are readable JSON files, without password protection. Store them
        somewhere private. Obligo does not upload them.
      </p>
      <Button
        variant="outline"
        disabled={Boolean(backup.busy)}
        onClick={() => void backup.prepare()}
      >
        <Download size={16} />
        {backup.prepared ? 'Prepare a fresh backup' : 'Prepare backup'}
      </Button>
      {backup.prepared && (
        <div className="backup-ready">
          <h3>Backup ready to save</h3>
          <BackupSummary preview={backup.prepared.preview} />
          <p className="muted">
            This copy includes records as of the time above. Save the file
            outside Obligo before clearing storage.
          </p>
          <div className="backup-actions">
            <Button
              disabled={Boolean(backup.busy)}
              onClick={() => void backup.save()}
            >
              <Download size={16} />
              Save JSON
            </Button>
            {backupFileService.canShare(backup.prepared) && (
              <Button
                variant="outline"
                disabled={Boolean(backup.busy)}
                onClick={() => void backup.share()}
              >
                <Share2 size={16} />
                Share file
              </Button>
            )}
          </div>
          <p className="muted">
            On iPhone, use Downloads or choose Save to Files if the file opens
            in a preview or share sheet.
          </p>
        </div>
      )}
      <div className="backup-import">
        <label htmlFor="backup-file">
          <FolderOpen size={16} />
          Restore from a JSON file
        </label>
        <p className="muted" id="backup-file-help">
          Choose an Obligo backup up to 10 MB. You will review it before
          replacing any records.
        </p>
        <input
          id="backup-file"
          type="file"
          accept=".json,application/json"
          aria-describedby="backup-file-help"
          disabled={Boolean(backup.busy)}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void backup.select(file);
          }}
        />
      </div>
      {backup.busy && <p role="status">{backup.busy}</p>}
      {backup.message && (
        <p className="accent" role="status">
          {backup.message}
        </p>
      )}
      {backup.error && !backup.pending && (
        <p className="error" role="alert">
          {backup.error}
        </p>
      )}
      {backup.pending && (
        <RestoreDialog
          backup={backup.pending}
          busy={Boolean(backup.busy)}
          error={backup.error}
          onRestore={() => void backup.restore()}
          onClose={backup.cancel}
        />
      )}
    </section>
  );
}
