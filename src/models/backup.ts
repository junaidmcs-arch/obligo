import type {
  Category,
  Obligation,
  ObligationStatus,
  UserSettings,
} from './types';

export const BACKUP_FORMAT = 'obligo-backup';
export const BACKUP_SCHEMA_VERSION = 1;
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

export interface BackupData {
  categories: Category[];
  obligations: Obligation[];
  statuses: ObligationStatus[];
  settings: UserSettings;
}

export interface BackupPreview {
  exportedAt: Date;
  appVersion: string;
  categories: number;
  obligations: number;
  archived: number;
  statuses: number;
}

export interface PreparedBackup {
  text: string;
  filename: string;
  preview: BackupPreview;
}
