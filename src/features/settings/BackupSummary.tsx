import type { BackupPreview } from '@/models/backup';

export function BackupSummary({ preview }: { preview: BackupPreview }) {
  return (
    <div className="backup-summary">
      <p className="muted">
        Created {preview.exportedAt.toLocaleString()} · Obligo{' '}
        {preview.appVersion}
      </p>
      <ul>
        <li>{preview.categories} categories</li>
        <li>
          {preview.obligations} obligations ({preview.archived} archived)
        </li>
        <li>{preview.statuses} monthly status records</li>
        <li>Appearance and app preferences</li>
      </ul>
    </div>
  );
}
