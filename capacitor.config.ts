import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vortexaathishatudios.arcadeio',
  appName: 'Arcade.io',
  webDir: 'dist',
  backgroundColor: '#101116',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: "#101116",
      showSpinner: false,
      androidSplashResourceName: "arcade_launch",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
