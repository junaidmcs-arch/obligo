import { beforeAll, afterEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BackupCard } from '@/features/settings/BackupCard';
import { backupService } from '@/services/backupService';
import { backupFileService } from '@/services/backupFileService';
import { backupFixture } from './fixtures/backup';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = vi.fn();
});
afterEach(() => vi.restoreAllMocks());
function choose(contents = JSON.stringify(backupFixture())) {
  fireEvent.change(screen.getByLabelText('Restore from a JSON file'), {
    target: {
      files: [
        new File([contents], 'backup.json', { type: 'application/json' }),
      ],
    },
  });
}

it('previews a file, requires acknowledgement and never restores on cancel', async () => {
  const restore = vi.spyOn(backupService, 'restore').mockResolvedValue();
  render(<BackupCard />);
  choose();
  const confirm = await screen.findByRole('button', {
    name: 'Replace and restore',
  });
  expect(confirm).toBeDisabled();
  expect(screen.getByText('1 obligations (1 archived)')).toBeInTheDocument();
  expect(restore).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(restore).not.toHaveBeenCalled();
});
it('keeps the preview after a failure and allows a successful retry', async () => {
  const restore = vi
    .spyOn(backupService, 'restore')
    .mockRejectedValueOnce(new Error('Storage is full.'))
    .mockResolvedValueOnce();
  render(<BackupCard />);
  choose();
  fireEvent.click(await screen.findByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Replace and restore' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'current records are unchanged',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Replace and restore' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(screen.getByRole('status')).toHaveTextContent('Backup restored');
  expect(restore).toHaveBeenCalledTimes(2);
});
it('shows invalid-file feedback without allowing restore', async () => {
  const restore = vi.spyOn(backupService, 'restore');
  render(<BackupCard />);
  choose('not JSON');
  expect(await screen.findByRole('alert')).toHaveTextContent('not valid JSON');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(restore).not.toHaveBeenCalled();
});
it('prepares a snapshot before a separate save gesture and handles cancellation honestly', async () => {
  const text = JSON.stringify(backupFixture());
  const prepared = {
    text,
    filename: 'obligo-backup-test.json',
    preview: backupService.preview(text),
  };
  vi.spyOn(backupService, 'create').mockResolvedValue(prepared);
  const save = vi
    .spyOn(backupFileService, 'save')
    .mockResolvedValue('cancelled');
  render(<BackupCard />);
  fireEvent.click(screen.getByRole('button', { name: 'Prepare backup' }));
  const button = await screen.findByRole('button', { name: 'Save JSON' });
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(button);
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('Save cancelled'),
  );
  expect(screen.getByRole('button', { name: 'Save JSON' })).toBeEnabled();
});
