import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.millionaireblueprint.memoryhoops',
  appName: 'Memory Hoops',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'always',          // respect notch / Dynamic Island
    scrollEnabled: false,            // prevent bounce-scroll on game screen
    backgroundColor: '#0d0905',      // match Classic gym dark bg
  },
  android: {
    backgroundColor: '#0d0905',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0d0905',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
