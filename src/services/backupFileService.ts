import { Capacitor, registerPlugin } from '@capacitor/core';
import { MAX_BACKUP_BYTES, type PreparedBackup } from '@/models/backup';

const nativeFiles = registerPlugin<{
  saveFile(options: {
    filename: string;
    contents: string;
  }): Promise<{ cancelled: boolean }>;
}>('BackupFile');

export const backupFileService = {
  async read(file: File): Promise<string> {
    if (file.size > MAX_BACKUP_BYTES)
      throw new Error('Choose a backup smaller than 10 MB.');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('Could not read this file.'));
      reader.onerror = () =>
        reject(
          new Error(
            'Could not read this file. Download it to your device and try again.',
          ),
        );
      reader.onabort = () => reject(new Error('File reading was cancelled.'));
      reader.readAsText(file);
    });
  },
  canShare(backup: PreparedBackup): boolean {
    if (Capacitor.isNativePlatform()) return false;
    return (
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({
        files: [
          new File([backup.text], backup.filename, {
            type: 'application/json',
          }),
        ],
      })
    );
  },
  // Called directly from a click after preparation to retain iPhone user activation.
  async share(backup: PreparedBackup): Promise<boolean> {
    try {
      await navigator.share({
        files: [
          new File([backup.text], backup.filename, {
            type: 'application/json',
          }),
        ],
      });
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError')
        return false;
      throw new Error(
        'Sharing is unavailable. Use Save JSON to download the file instead.',
      );
    }
  },
  async save(
    backup: PreparedBackup,
  ): Promise<'saved' | 'download' | 'cancelled'> {
    if (Capacitor.isNativePlatform()) {
      const result = await nativeFiles.saveFile({
        filename: backup.filename,
        contents: backup.text,
      });
      return result.cancelled ? 'cancelled' : 'saved';
    }
    const url = URL.createObjectURL(
      new Blob([backup.text], { type: 'application/json' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = backup.filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    // Allow Safari time to consume the URL before releasing the data.
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    return 'download';
  },
};
