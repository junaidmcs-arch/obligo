# Obligo 0.1.1 — monthly completion and clearer scheduling

- Prominent **Powered by ValidaCore.tech** branding on every screen, including mobile.
- New obligations with a due day earlier than today begin next month instead of immediately appearing overdue. Existing records use their creation date to determine their first eligible month.
- Complete a specific monthly occurrence from the dashboard or Obligations screen. Completed months no longer appear in the attention list or due-this-week count. The obligation remains active for future months.
- Review completed status and undo it in Obligations. Completion records persist locally and remain intact when an obligation is archived.

Install `obligo-0.1.1.apk` over version 0.1.0. **Do not uninstall or clear app storage.** The package ID, local storage origin, database, and signing key are unchanged. No destructive database migration is required.

Publish a stable GitHub release tagged `v0.1.1`, attach `obligo-0.1.1.apk` and `obligo-0.1.1.apk.sha256`, and mark it Latest. Version 0.1.0 installations will then offer this update on an online startup.

Scheduling remains a current-month tracker: it does not accumulate uncompleted months as a historical backlog. The completion button names the exact month it affects. A newly scheduled obligation can be completed early; future monthly recurrence remains active. Changing a due day preserves the original first eligible month.
