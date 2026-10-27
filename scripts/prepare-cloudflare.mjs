import { writeFileSync } from 'node:fs';

// The web build lives in a real subdirectory so its URLs and SW scope agree.
writeFileSync(
  'cloudflare-dist/_redirects',
  '/ /obligo/ 302\n/obligo /obligo/ 301\n',
);
writeFileSync(
  'cloudflare-dist/_headers',
  '/obligo/sw.js\n  Cache-Control: no-cache\n/obligo/\n  Cache-Control: no-cache\n/obligo/manifest.webmanifest\n  Cache-Control: no-cache\n',
);
