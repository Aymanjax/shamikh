import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shumoukh.erp',
  appName: 'شموخ ERP',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f8f9fa',
      androidSplashResourceName: 'splash',
    },
  },
};

export default config;
