import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  checkForRelease,
  isNewerVersion,
  parseRelease,
  RELEASE_REPOSITORY,
} from '@/services/releaseService';
const valid = {
  tag_name: 'v0.2.0',
  draft: false,
  prerelease: false,
  assets: [
    {
      name: 'obligo-0.2.0.apk',
      state: 'uploaded',
      size: 5000,
      browser_download_url: `https://github.com/${RELEASE_REPOSITORY}/releases/download/v0.2.0/obligo-0.2.0.apk`,
    },
  ],
};
afterEach(() => vi.unstubAllGlobals());
describe('GitHub release updates', () => {
  it('compares numeric components rather than strings', () => {
    expect(isNewerVersion('v0.10.0', '0.9.0')).toBe(true);
    expect(isNewerVersion('0.1.0', '0.1.0')).toBe(false);
    expect(isNewerVersion('0.1.9', '0.2.0')).toBe(false);
  });
  it('rejects malformed versions and prereleases', () => {
    for (const value of [
      'v1',
      'v01.2.3',
      '1.0.0-beta.1',
      'Infinity.0.0',
      '999999999999999999.0.0',
    ])
      expect(isNewerVersion(value, '0.1.0')).toBe(false);
  });
  it('only offers a stable release with a finished APK from the expected repo', () => {
    expect(parseRelease(valid, '0.1.0')?.version).toBe('0.2.0');
    for (const value of [
      null,
      {},
      { ...valid, draft: true },
      { ...valid, prerelease: true },
      { ...valid, assets: [] },
      {
        ...valid,
        assets: [
          {
            ...valid.assets[0],
            browser_download_url: 'https://evil.example/app.apk',
          },
        ],
      },
      { ...valid, assets: [{ ...valid.assets[0], state: 'new' }] },
    ])
      expect(parseRelease(value, '0.1.0')).toBeNull();
    expect(parseRelease(valid, '0.2.0')).toBeNull();
  });
  it('handles absent releases and rate limits without an update', async () => {
    for (const status of [404, 403, 429, 500]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));
      expect(await checkForRelease('0.1.0')).toBeNull();
    }
  });
  it('requests only public release metadata without credentials or personal data', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => valid });
    vi.stubGlobal('fetch', fetch);
    expect((await checkForRelease('0.1.0'))?.version).toBe('0.2.0');
    expect(fetch).toHaveBeenCalledWith(
      `https://api.github.com/repos/${RELEASE_REPOSITORY}/releases/latest`,
      expect.objectContaining({
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      }),
    );
  });
});
