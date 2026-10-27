import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.validacore.obligo',
  appName: 'Obligo',
  webDir: 'dist',
  // Keep this origin unchanged: IndexedDB belongs to this origin.
  server: { hostname: 'localhost', androidScheme: 'https' },
  android: { allowMixedContent: false },
};
export default config;
