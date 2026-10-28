# Colour themes

In version 0.1.3, open **Settings → Make Obligo yours** and choose a display mode
and a colour theme. Changes apply across the app and persist on this device.

| Palette | Character                              |
| ------- | -------------------------------------- |
| Forest  | Calm green; the default Obligo palette |
| Ocean   | Fresh blue                             |
| Violet  | Soft purple                            |
| Rose    | Warm pink                              |
| Amber   | Golden warmth                          |
| Slate   | Quiet neutral                          |

Every palette has light and dark variants. **System** follows the device's
appearance and responds when it changes. Palette and display mode are independent:
switching to Dark keeps the selected colour family. Priority and overdue labels
keep their semantic colours, and user-selected category colours remain intact.

## Storage and backup compatibility

`UserSettings.theme` keeps its light/dark/system meaning; `colorTheme` stores the
palette ID. Existing database records and v0.1.2 backups without that property
resolve to Forest, preserving their display mode and other settings. No IndexedDB
schema migration is required. New backups include both preferences. The backup
schema remains version 1 because the field is additive; older apps ignore it.
Unknown imported palette IDs are rejected before any database changes.

## Architecture and validation

- `src/theme/palettes.ts`: typed registry of palette labels and semantic tokens.
- `settingsService`: validates and saves appearance updates transactionally.
- `useTheme`: applies CSS variables, the dark-mode class, and browser theme-colour
  metadata; listens for device appearance changes and cleans up the listener.
- `AppearanceCard`: accessible named buttons with selected states and colour
  previews; reports storage errors without pretending a preference was saved.

Text, muted text, accent text, and primary-button labels are tested for a minimum
4.5:1 contrast ratio on their relevant palette backgrounds, in all twelve variants.
These token checks are not a full-app accessibility audit. Tests also cover
concurrent preference writes, persistence, live switching, failed saves, and
backup compatibility. The feature adds no dependencies or network requests.
