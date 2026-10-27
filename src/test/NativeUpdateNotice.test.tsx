import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { NativeUpdateNotice } from '@/components/common/NativeUpdateNotice';
import { RELEASE_REPOSITORY } from '@/services/releaseService';
const release = {
  tag_name: 'v9.0.0',
  draft: false,
  prerelease: false,
  assets: [
    {
      name: 'obligo-9.0.0.apk',
      state: 'uploaded',
      size: 10,
      browser_download_url: `https://github.com/${RELEASE_REPOSITORY}/releases/download/v9.0.0/obligo-9.0.0.apk`,
    },
  ],
};
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('checks after an offline start when connectivity returns and lets the user dismiss', async () => {
  let online = false;
  vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online);
  const fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => release });
  vi.stubGlobal('fetch', fetch);
  render(<NativeUpdateNotice />);
  expect(fetch).not.toHaveBeenCalled();
  online = true;
  fireEvent(window, new Event('online'));
  expect(
    await screen.findByRole('link', { name: 'View release & download' }),
  ).toHaveAttribute(
    'href',
    `https://github.com/${RELEASE_REPOSITORY}/releases/tag/v9.0.0`,
  );
  fireEvent(window, new Event('online'));
  expect(fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Later' }));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
it('does not interrupt the user on a network failure', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  const fetch = vi.fn().mockRejectedValue(new TypeError('Network unavailable'));
  vi.stubGlobal('fetch', fetch);
  render(<NativeUpdateNotice />);
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
