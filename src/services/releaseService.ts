export const RELEASE_REPOSITORY = 'junaidmcs-arch/obligo';
export const RELEASES_URL = `https://github.com/${RELEASE_REPOSITORY}/releases`;
export interface AvailableRelease {
  version: string;
  url: string;
}

export function stableVersion(value: string): number[] | null {
  const match = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(value);
  if (!match) return null;
  const parts = match.slice(1).map(Number);
  return parts.every(Number.isSafeInteger) ? parts : null;
}
export function isNewerVersion(candidate: string, installed: string): boolean {
  const next = stableVersion(candidate);
  const current = stableVersion(installed);
  if (!next || !current) return false;
  for (let i = 0; i < 3; i++) {
    if (next[i] !== current[i]) return next[i] > current[i];
  }
  return false;
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Only accept stable releases with a finished APK asset in our own repository.
export function parseRelease(
  value: unknown,
  installed: string,
): AvailableRelease | null {
  if (
    !record(value) ||
    value.draft !== false ||
    value.prerelease !== false ||
    typeof value.tag_name !== 'string'
  )
    return null;
  if (!isNewerVersion(value.tag_name, installed)) return null;
  const version = value.tag_name.replace(/^v/, '');
  const expected = `https://github.com/${RELEASE_REPOSITORY}/releases/download/${value.tag_name}/obligo-${version}.apk`;
  if (
    !Array.isArray(value.assets) ||
    !value.assets.some(
      (asset: unknown) =>
        record(asset) &&
        asset.state === 'uploaded' &&
        asset.name === `obligo-${version}.apk` &&
        asset.browser_download_url === expected &&
        typeof asset.size === 'number' &&
        asset.size > 0,
    )
  )
    return null;
  return { version, url: `${RELEASES_URL}/tag/${value.tag_name}` };
}

export async function checkForRelease(
  installed: string,
  signal?: AbortSignal,
): Promise<AvailableRelease | null> {
  const response = await fetch(
    `https://api.github.com/repos/${RELEASE_REPOSITORY}/releases/latest`,
    {
      headers: { Accept: 'application/vnd.github+json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
      signal,
    },
  );
  // Missing first release, private repo, rate limit, and network failures must never block the app.
  if (!response.ok) return null;
  return parseRelease((await response.json()) as unknown, installed);
}
