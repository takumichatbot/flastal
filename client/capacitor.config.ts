import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { StatusBarStyle } from '@capacitor/status-bar';

const isDev = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'com.flastal.app',
  appName: 'FLASTAL',
  webDir: 'out',
  server: isDev
    ? {
        // 開発時: ローカル Next.js サーバーへライブリロード
        url: 'http://localhost:3000',
        cleartext: true,
      }
    : {
        // 本番: 公開 URL をそのまま表示（SSR維持）
        url: 'https://www.flastal.com',
        cleartext: false,
        allowNavigation: [
          'flastal.com',
          '*.flastal.com',
          'flastal-backend.onrender.com',
        ],
      },
  ios: {
    scheme: 'App',
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    scrollEnabled: true,
    allowsLinkPreview: false,
    // プッシュ通知用 entitlements は Xcode で設定
    // Universal Links: Associated Domains は Xcode の Signing & Capabilities で
    // "applinks:flastal.com" と "applinks:www.flastal.com" を追加すること
  },
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: isDev,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#fff0f5',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#ec4899',
    },
    StatusBar: {
      style: StatusBarStyle.Default,  // Light/Dark を OS 設定に合わせて自動判定
      overlaysWebView: false,
      backgroundColor: '#FAF9FF',     // ライトモード基調色
    },
    Keyboard: {
      resize: KeyboardResize.Native,  // Body から変更（iPhone X でヘッダーズレ防止）
      style: KeyboardStyle.Light,
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
