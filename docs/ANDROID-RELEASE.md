# Free Android APK distribution

Obligo can be built locally and distributed as a signed APK through the public GitHub repository `junaidmcs-arch/obligo`. No Google Play subscription, Play Console registration, Apple account, paid build service, or backend is used by this build process. We do not publish anything automatically.

## First APK

Build output: `artifacts/obligo-0.1.0.apk` and `artifacts/obligo-0.1.0.apk.sha256`.

Application ID: `com.validacore.obligo`. The APK bundles all web assets and uses IndexedDB in its local WebView. Its minimum Android API is 24 (Android 7); the target/compile API is 36. The current Capacitor template determines these requirements. No personal obligations are sent to GitHub.

Android signs updates using a stable private key. This checkout's release key is in `.signing/obligo-release.jks`, with generated passwords in `.signing/credentials.json`. The folder has restricted Windows permissions and is ignored by Git.

**Securely back up the entire `.signing` folder before publishing the first APK. Never upload it to GitHub or attach it to a release.** Anyone with the key and passwords can sign updates as you. If it is lost, existing installs cannot receive normally signed updates from a replacement key. Do not regenerate it for an update. Do not change the application ID or local WebView origin either.

## Upload to GitHub Releases

1. Ensure the repository is public. Anonymous app clients cannot inspect a private repository; no GitHub token is embedded in the APK.
2. Create a release with tag **`v0.1.0`** pointing to the corresponding source commit.
3. Attach **`obligo-0.1.0.apk`** and **`obligo-0.1.0.apk.sha256`**. Keep these exact names.
4. Add release notes, state that it is an Android APK, and tell users to install updates over the existing app without uninstalling.
5. Publish it as a stable release and mark it **Latest**. Draft and prerelease versions are not offered by the app.

Users download the APK from the release, open it, and follow Android's installer. Android may ask them to allow installs from that browser or file manager. Installation remains user-controlled; Obligo does not request the permission to install packages or automatically replace itself. Avoid uninstalling: that removes the app's IndexedDB records. Browser/PWA data and native APK data are separate stores; they are not automatically transferred.

## Startup release check

The native app reads `https://api.github.com/repos/junaidmcs-arch/obligo/releases/latest` once when starting online, and tries when connectivity returns if it started offline. Repeated network events are throttled to one attempt per minute; there is no background polling or push-notification permission.

It compares the release tag against the bundled `package.json` version numerically. Only stable `major.minor.patch` tags (optionally prefixed with `v`) are supported. The release must contain a nonempty, fully uploaded `obligo-VERSION.apk` asset with a download URL under the expected repository. The notice opens the trusted GitHub release page, allowing users to review notes and download intentionally. “Later” dismisses the notice for the current app session.

The request has no credentials, device ID, obligation data, or request body. GitHub still receives normal network metadata such as the IP address. This is an explicit exception to Sprint 1's zero-network-data design for the requested update discovery. The core app remains usable if GitHub is down, the device is offline, the repository is private, no release exists yet, or GitHub rate-limits the request. A check times out after eight seconds. No failure dialog interrupts the user's work.

The PWA keeps its separate service-worker update prompt. The Android wrapper never mounts the service-worker registration component, preventing stale cached web bundles from overriding APK updates.

## Build the next release on Windows

Prerequisites: Node 22.12+, pnpm 11, JDK 21 (`JAVA_HOME`), Android platform 36, and build-tools 36.0.0. The initial build installed the SDK locally under `.android-sdk`; set `ANDROID_HOME` if using an SDK elsewhere. Downloads and tools are free. SDK license acceptance is required.

1. Restore the original `.signing` folder if using a new checkout or machine.
2. Change `package.json` version, for example from `0.1.0` to `0.1.1`, and update the lockfile if dependencies change.
3. Run:

   ```powershell
   pnpm install --frozen-lockfile
   pnpm test
   pnpm lint
   pnpm android:apk
   ```

4. Test the resulting APK by upgrading an existing install with sample data. Verify data persistence and offline operation.
5. Publish tag `v0.1.1` with `obligo-0.1.1.apk` and its checksum, and mark that release Latest.

`scripts/build-android.ps1` runs TypeScript, the Vite production build, Capacitor sync, Gradle release packaging, APK signature verification, and SHA-256 generation. Passwords are passed to child processes through environment variables, not command-line arguments. Output goes to `artifacts/`. Release builds fail if signing is not configured.

The Android version name comes directly from `package.json`; version code is `major × 1,000,000 + minor × 1,000 + patch`. Keep major <= 2000 and minor/patch <= 999, and always increase the version for an update. `0.1.0` has version code 1000. Replacing the asset under an unchanged version does not notify installed users.

For a genuinely new application only, initial key creation uses:

```powershell
./scripts/build-android.ps1 -InitializeSigning
```

This refuses to overwrite existing signing material. It is not needed again for this project.

## Platform and cost limitations

- An APK is Android-only. iPhones cannot install it. For a free iPhone distribution path, host the PWA over HTTPS and use Safari's Add to Home Screen; GitHub Releases is file hosting, not a running website. GitHub Pages can host a PWA, but the current Vite/PWA configuration assumes an origin-root deployment and needs a base-path adjustment for `/obligo/` project Pages hosting.
- Android developer-verification requirements are evolving. On affected certified devices, an unregistered application can require additional user installation steps; unrestricted, frictionless installation on every device cannot be guaranteed without registration. This build does not register you, pay fees, or promise to bypass platform protections. See [Google's current guidance](https://developer.android.com/developer-verification).
- Public GitHub release downloads do not require an app-store developer account. GitHub's service policies and availability still apply. The local build does not consume billed GitHub Actions minutes.
- Signature verification and automated tests are not a substitute for installing on a physical phone. Check Android 7+ and current Android/WebView versions, offline cold starts, update-in-place data preservation, the release notice, and external browser handoff before broad distribution.

References: [Capacitor setup](https://capacitorjs.com/docs/getting-started/environment-setup), [Android signing](https://developer.android.com/studio/publish/app-signing), [GitHub REST rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).
