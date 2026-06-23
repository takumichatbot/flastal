import confetti from 'canvas-confetti';

const BRAND_COLORS = ['#f472b6', '#e879f9', '#c084fc', '#fb7185', '#fbbf24'];

/**
 * 支払い完了時のconfetti
 */
export function triggerPaymentConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: BRAND_COLORS,
    scalar: 1.1,
  });
}

/**
 * 目標達成時のconfetti（より豪華）
 */
export function triggerAchievementConfetti() {
  // 左から
  confetti({
    particleCount: 80,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.6 },
    colors: BRAND_COLORS,
  });
  // 右から
  setTimeout(() => {
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: BRAND_COLORS,
    });
  }, 200);
}
