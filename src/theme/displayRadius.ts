// Скругление углов дисплея iPhone в pt. CSS его не знает, поэтому определяем
// модель по размеру экрана и плотности пикселей. Ключ: "ширина×высота@dpr".
const DISPLAY_RADIUS: Record<string, number> = {
  '375x812@3': 44, // 12 mini, 13 mini (у X, XS, 11 Pro — 39)
  '414x896@2': 41.5, // XR, 11
  '414x896@3': 39, // XS Max, 11 Pro Max
  '390x844@3': 47.33, // 12, 12 Pro, 13, 13 Pro, 14
  '428x926@3': 53.33, // 12 Pro Max, 13 Pro Max, 14 Plus
  '393x852@3': 55, // 14 Pro, 15, 15 Pro, 16
  '430x932@3': 55, // 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  '402x874@3': 62, // 16 Pro, 17, 17 Pro
  '440x956@3': 62, // 16 Pro Max, 17 Pro Max
};

/**
 * Задаёт --display-radius, чтобы нижние углы шторки были концентричны экрану.
 * Только в установленном PWA: в Safari низ страницы — не край экрана.
 */
export function applyDisplayRadius(): void {
  const standalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  if (!standalone || !/iPhone/.test(navigator.userAgent)) return;

  const w = Math.min(screen.width, screen.height);
  const h = Math.max(screen.width, screen.height);
  const radius = DISPLAY_RADIUS[`${w}x${h}@${Math.round(devicePixelRatio)}`];
  if (radius) document.documentElement.style.setProperty('--display-radius', `${radius}px`);
}
