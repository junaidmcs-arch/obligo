import { useRef, useState, type CSSProperties } from 'react';
import { Check, Laptop, Moon, Palette, Sun } from 'lucide-react';
import { COLOR_THEMES, type UserSettings } from '@/models/types';
import { palettes } from '@/theme/palettes';
import { settingsService } from '@/services/settingsService';
import { errorMessage } from '@/lib/utils';

export function AppearanceCard({ settings }: { settings: UserSettings }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const saving = useRef(false);

  async function save(action: () => Promise<void>, label: string) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(`${label} selected. Saved on this device.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return (
    <section
      className="panel settings-card"
      aria-labelledby="appearance-heading"
      aria-busy={busy}
    >
      <Palette className="accent" size={24} />
      <h2 id="appearance-heading">Make Obligo yours</h2>
      <p className="muted">
        Choose the colours and brightness that feel right for you.
      </p>
      <h3 className="appearance-label" id="display-mode-heading">
        Display mode
      </h3>
      <div
        className="theme-options"
        role="group"
        aria-labelledby="display-mode-heading"
      >
        {(
          [
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'system', label: 'System', icon: Laptop },
          ] as const
        ).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={settings.theme === value}
            disabled={busy}
            className={settings.theme === value ? 'selected' : ''}
            onClick={() =>
              void save(() => settingsService.setTheme(value), `${label} mode`)
            }
          >
            <Icon size={22} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <p className="muted appearance-hint">
        System follows your device’s light or dark setting.
      </p>
      <h3 className="appearance-label" id="colour-theme-heading">
        Colour theme
      </h3>
      <div
        className="palette-grid"
        role="group"
        aria-labelledby="colour-theme-heading"
      >
        {COLOR_THEMES.map((id) => {
          const palette = palettes[id];
          const selected = settings.colorTheme === id;
          const style = {
            '--preview-bg': palette.light.bg,
            '--preview-surface': palette.light.surface,
            '--preview-accent': palette.light.primary,
            '--preview-dark': palette.dark.bg,
          } as CSSProperties;
          return (
            <button
              key={id}
              type="button"
              className={`palette-option${selected ? ' selected' : ''}`}
              style={style}
              aria-label={`${palette.name} colour theme`}
              aria-pressed={selected}
              disabled={busy}
              onClick={() =>
                void save(() => settingsService.setColorTheme(id), palette.name)
              }
            >
              <span className="palette-preview" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="palette-name">
                {palette.name}
                {selected && <Check size={16} aria-hidden="true" />}
              </span>
              <span className="palette-description">{palette.description}</span>
            </button>
          );
        })}
      </div>
      <p className="muted appearance-hint">
        All six palettes work in light and dark mode. Your choice is included in
        JSON backups.
      </p>
      {message && (
        <p className="accent" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          Could not save your appearance. {error}
        </p>
      )}
    </section>
  );
}
