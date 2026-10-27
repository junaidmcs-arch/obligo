import { useState } from 'react';
import { Laptop, Moon, ShieldCheck, Smartphone, Sun } from 'lucide-react';
import type { UserSettings } from '@/models/types';
import { settingsService } from '@/services/settingsService';
import { errorMessage } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import { version } from '../../../package.json';
import { RELEASES_URL } from '@/services/releaseService';
import { BackupCard } from './BackupCard';
export function SettingsPage({ settings }: { settings: UserSettings }) {
  const [error, setError] = useState('');
  const native = Capacitor.isNativePlatform();
  async function changeTheme(theme: UserSettings['theme']) {
    try {
      await settingsService.setTheme(theme);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">MAKE YOURSELF AT HOME</p>
          <h1>Settings</h1>
          <p className="muted">
            A few simple preferences. Entirely yours. · Version {version}
          </p>
        </div>
      </div>
      <div className="settings-stack">
        <BackupCard />
        {native && (
          <section className="panel settings-card">
            <h2>App updates</h2>
            <p>
              Obligo checks GitHub Releases when it starts online, or when
              connectivity returns. Your obligations are never included in the
              request. GitHub receives ordinary connection information,
              including your IP address.
            </p>
            <p>
              <a
                className="accent"
                href={RELEASES_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                View releases on GitHub
              </a>
            </p>
            <p className="muted">
              Install updates over the existing app to retain your records. Do
              not uninstall first.
            </p>
          </section>
        )}
        <section className="panel settings-card">
          <h2>Appearance</h2>
          <p className="muted">Choose the view that feels right.</p>
          <div className="theme-options">
            {(
              [
                { value: 'light', icon: Sun },
                { value: 'dark', icon: Moon },
                { value: 'system', icon: Laptop },
              ] as const
            ).map(({ value, icon: Icon }) => (
              <button
                key={value}
                aria-pressed={settings.theme === value}
                className={settings.theme === value ? 'selected' : ''}
                onClick={() => void changeTheme(value)}
              >
                <Icon size={24} />
                {value}
              </button>
            ))}
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>
        {!native && (
          <section className="panel settings-card">
            <Smartphone className="accent" size={24} />
            <h2>Keep Obligo close</h2>
            <p>
              On Android, open your browser menu and choose{' '}
              <strong>Install app</strong> or{' '}
              <strong>Add to Home screen</strong>.
            </p>
            <p>
              On iPhone, open in Safari, tap <strong>Share</strong>, then{' '}
              <strong>Add to Home Screen</strong>.
            </p>
            <p className="muted">
              Visit once online and wait for “Ready offline” before
              disconnecting. Installation requires HTTPS, or localhost for
              development.
            </p>
          </section>
        )}
        <section className="panel settings-card">
          <ShieldCheck className="accent" size={24} />
          <h2>Private by design</h2>
          <p>
            Your categories, obligations, and preferences are stored in this
            {native ? 'app' : 'browser'} on this device. No account, no
            analytics, no cloud.
          </p>
          <p className="muted">
            {native
              ? 'Uninstalling the app or clearing its storage removes your records.'
              : 'Clearing browser data removes your records. Private browsing may not retain data.'}{' '}
            Save a JSON backup above before clearing storage or moving to
            another device.
          </p>
        </section>
      </div>
    </>
  );
}
