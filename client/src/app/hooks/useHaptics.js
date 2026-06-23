import { Capacitor } from '@capacitor/core';

/**
 * 触覚フィードバックを発火する。
 * ネイティブプラットフォーム（iOS / Android）以外では何もしない。
 *
 * @param {'light' | 'medium' | 'success' | 'error'} type
 */
export async function triggerHaptic(type = 'light') {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
    switch (type) {
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case 'error':
        await Haptics.notification({ type: NotificationType.Error });
        break;
      default:
        await Haptics.impact({ style: ImpactStyle.Light });
    }
  } catch {
    // Web / 未インストール時は無視
  }
}
