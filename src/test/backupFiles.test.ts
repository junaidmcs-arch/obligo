import { afterEach, expect, it, vi } from 'vitest';
import { backupFileService } from '@/services/backupFileService';
import { MAX_BACKUP_BYTES } from '@/models/backup';
import { backupService } from '@/services/backupService';
import { backupFixture } from './fixtures/backup';

const mocks = vi.hoisted(() => ({ native: false, saveFile: vi.fn() }));
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => mocks.native },
  registerPlugin: () => ({ saveFile: mocks.saveFile }),
}));
afterEach(() => {
  mocks.native = false;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const text = JSON.stringify(backupFixture());
const backup = {
  text,
  filename: 'obligo-backup-test.json',
  preview: backupService.preview(text),
};

it('uses the native document picker and reports cancellation separately from save success', async () => {
  mocks.native = true;
  mocks.saveFile
    .mockResolvedValueOnce({ cancelled: true })
    .mockResolvedValueOnce({ cancelled: false });
  expect(await backupFileService.save(backup)).toBe('cancelled');
  expect(await backupFileService.save(backup)).toBe('saved');
  expect(mocks.saveFile).toHaveBeenCalledWith({
    filename: backup.filename,
    contents: text,
  });
});
it('downloads the JSON Blob in browsers and releases the object URL later', async () => {
  vi.useFakeTimers();
  const create = vi.fn((blob: Blob) => {
    expect(blob.type).toBe('application/json');
    return 'blob:backup';
  });
  const revoke = vi.fn();
  vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe(backup.filename);
      expect(this.getAttribute('href')).toBe('blob:backup');
    });
  expect(await backupFileService.save(backup)).toBe('download');
  expect(click).toHaveBeenCalledOnce();
  expect(create.mock.calls[0][0]).toBeInstanceOf(Blob);
  expect(document.querySelector('a')).toBeNull();
  expect(revoke).not.toHaveBeenCalled();
  vi.advanceTimersByTime(60000);
  expect(revoke).toHaveBeenCalledWith('blob:backup');
});
it('handles a cancelled share without triggering an unintended download', async () => {
  const share = vi
    .fn()
    .mockRejectedValue(new DOMException('Cancelled', 'AbortError'));
  vi.stubGlobal('navigator', { share, canShare: () => true });
  expect(backupFileService.canShare(backup)).toBe(true);
  const promise = backupFileService.share(backup);
  expect(share).toHaveBeenCalledOnce(); // Still in the click's activation, before awaiting.
  expect(await promise).toBe(false);
});
it('reads Unicode JSON and rejects oversized files before reading', async () => {
  expect(await backupFileService.read(new File([text], 'backup.json'))).toBe(
    text,
  );
  const large = new File(['x'], 'large.json');
  Object.defineProperty(large, 'size', { value: MAX_BACKUP_BYTES + 1 });
  await expect(backupFileService.read(large)).rejects.toThrow('10 MB');
});
