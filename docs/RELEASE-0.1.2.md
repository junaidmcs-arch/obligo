# Obligo 0.1.2 — Android

## What's new

- JSON Backup & Restore in Settings.
- Back up categories, active and archived obligations, completion history, and
  preferences, and move them between Android, iPhone, and desktop.
- Preview backups and confirm before replacing existing records.
- Invalid files are rejected; failed restores leave the current database intact.
- Android saves through the system file picker; the web app downloads JSON.

## Updating

Install `obligo-0.1.2.apk` over your existing app. Do not uninstall or clear app
storage. Your existing obligations remain in place. In Settings, prepare a backup,
save it, and confirm it exists in your chosen folder.

Restore replaces current records instead of merging. Save a backup first if you
want to keep the destination's records. Backup files are readable JSON: store
them privately. No account or paid service is needed.

Publish the signed APK and its `.sha256` file under tag `v0.1.2`, marked Latest.
The iPhone/web version updates separately through the Cloudflare deployment.
