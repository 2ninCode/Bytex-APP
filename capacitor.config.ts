import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bytex.app',
  appName: 'BytexAPP',
  webDir: 'dist',
  server: {
    url: 'https://bytex-app.vercel.app', // Update with the correct Vercel URL if different
    cleartext: true
  }
};

export default config;
