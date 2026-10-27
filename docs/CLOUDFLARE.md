# Obligo on Cloudflare Workers

The permanent web app URL is https://validacore.tech/obligo/.

## Build and deploy

Connect `junaidmcs-arch/obligo` to a new Worker named `obligo`.
Use branch `main`, repository root, build command `pnpm run build:cloudflare`,
and deploy command `npx wrangler deploy` if that field is shown.
The committed Wrangler configuration serves `cloudflare-dist` as static assets.
No environment variables or application secrets are required.

First verify the deployed workers.dev URL at `/obligo/`.
Then add these two routes to the **obligo** Worker in Domains & Routes:

- `validacore.tech/obligo`
- `validacore.tech/obligo/*`

Choose the `validacore.tech` zone. Keep the existing `fortis-arch` custom
domain intact; do not assign the entire domain to Obligo. The exact route
redirects the no-slash URL to `/obligo/`; the wildcard serves the app assets.
Routes require a proxied DNS record for the hostname.

The app uses hash navigation, so no server-side SPA fallback is needed.
Service worker registration, offline fallback, manifest and icons are scoped
to `/obligo/`. Default/Android builds continue to use `/` and `dist`.

## iPhone verification

Open the permanent URL in Safari, Share, Add to Home Screen, enable Open as Web
App if offered, and Add. Launch from the new icon while online and wait for
offline readiness. Create a sample obligation, close and reopen in airplane
mode, then verify editing and completion persist. Physical iPhone testing is
required after deployment. Data created on the workers.dev preview does not
transfer to the production domain or from Android. Do not clear website data.

Web updates are delivered by deploying a new web build; the application prompts
when a new service worker is ready. APK releases remain a separate workflow.
