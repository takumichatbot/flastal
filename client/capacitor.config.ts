import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.flastal.app',
  appName: 'FLASTAL',
  webDir: 'out',
  server: {
    // 本番サーバーのURLを読み込む（サーバーサイドレンダリング維持）
    url: 'https://www.flastal.com/app',
    cleartext: false,
    allowNavigation: [
      'flastal.com',
      '*.flastal.com',
      'flastal-backend.onrender.com',
      'flastal-frontend.onrender.com',
    ],
  },
  ios: {
    scheme: 'App',
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    scrollEnabled: true,
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#fce7f3',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Default',
      backgroundColor: '#0f172a',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
