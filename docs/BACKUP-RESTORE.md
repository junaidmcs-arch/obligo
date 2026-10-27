# JSON Backup & Restore

Available in Obligo 0.1.2 under **Settings → Backup & restore**. Works offline,
without an account or a server. The same file works in the Android APK, iPhone
web app, and desktop browser.

## Save a backup

1. Select **Prepare backup** to take a consistent snapshot of the local database.
2. Check the creation time and record counts, then select **Save JSON**.
3. Android APK: choose a folder and confirm Save in the system file picker.
4. Safari/iPhone: use the download, or Save to Files if a preview appears. A
   **Share file** button is also offered when the browser supports sharing JSON.
5. Confirm the file exists in Files/Downloads or your chosen destination before
   clearing storage. A browser download request cannot prove the file was saved.

Backups include category colors, all active and archived obligations, optional
amounts/currencies, first eligible months, completion history/notes, and settings.
The file is readable JSON without encryption. Keep it private. Obligo does not
upload it; choosing a cloud drive or share destination is your decision.
Backups are manual snapshots, not automatic sync. Prepare a fresh one after edits.

## Restore or move to another device

Transfer the backup file to the destination device. Install/open Obligo, go to
Settings and choose the file under **Restore from a JSON file**. Review its date
and counts. Export the destination's current records first if needed, then check
the acknowledgement and select **Replace and restore**.

Restoring replaces **all** four collections, including preferences. It does not
merge records. Cancel leaves data untouched. Invalid files are rejected before
any writes. A storage failure rolls back the entire replacement. The UI updates
automatically, including the restored theme.

## Format and limits

- Envelope: `format: "obligo-backup"`, `schemaVersion: 1`, `appVersion`,
  `exportedAt` (ISO UTC), and `data`.
- Data: `categories`, `obligations`, and `statuses` arrays; a single `settings`
  object with ID `default`.
- Dates serialize as ISO UTC strings and restore as Date objects. Monthly
  periods and first eligible months remain calendar values.
- Limit: 10 MiB per file; at most 100,000 records per collection. Duplicate IDs,
  duplicate category names/monthly statuses, missing references, invalid dates,
  and unsupported schema versions are rejected.
- Restoring legacy records without `startMonth` preserves the existing fallback
  behavior. Only known fields are imported; no imported object is spread into
  the database or rendered as HTML.

Native export uses a small Capacitor bridge to Android's ACTION_CREATE_DOCUMENT.
It needs no broad storage permission. Web export uses a JSON Blob download and
an optional Web Share API path; preparation is separate from the save/share
gesture to retain Safari's user activation. Restore uses the normal file input.
No database migration or dependency change is required.

Before publishing, verify Save/Cancel/Restore with real Android and iPhone Files
pickers, including offline use. If Android restarts while the save picker is open,
prepare and save the backup again; the original database remains intact.
