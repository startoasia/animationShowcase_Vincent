/**
 * @fileoverview particles-presets.js — tsParticles 預設動畫配方庫
 * 內建：
 * - snow           (continuous)：背景持續飄雪
 * - confetti       (continuous / burst)：彩帶降落（預設持續飄落，亦支援 burst / 點擊觸發彩帶雨）
 * - confettiCannon (burst)：左下 45° + 右下 135° 雙側噴射，支援 imageSrc 替換圖片（如金幣）
 * - fireworks      (continuous + 按需外掛)：透明背景與發射線軌跡煙火
 */
(function (root) {
  "use strict";

  if (root.LPParticlePresets) return;

  const MOBILE_WIDTH = 768;
  const DEFAULT_COLORS = ["#ff5e7e", "#ffd166", "#06d6a0", "#4cc9f0", "#a25afd", "#ffffff"];

  function buildImageShapeOption(imageSrc, size) {
    const list = Array.isArray(imageSrc) ? imageSrc : [imageSrc];
    const s = typeof size === "number" ? size : 32;
    return list.map(function (src) {
      return { src: src, width: s, height: s };
    });
  }

  /**
   * 1. 持續飄雪 (snow)
   */
  function snow(overrides) {
    const o = overrides || {};
    const isMobile = window.innerWidth < MOBILE_WIDTH;
    const baseCount = typeof o.count === "number" ? o.count : 80;
    const shape = o.imageSrc
      ? { type: "image", options: { image: buildImageShapeOption(o.imageSrc, o.imageSize || 24) } }
      : { type: "circle" };

    return {
      fullScreen: { enable: false },
      fpsLimit: 60,
      detectRetina: o.detectRetina !== undefined ? Boolean(o.detectRetina) : !isMobile,
      pauseOnBlur: true,
      pauseOnOutsideViewport: true,
      motion: { disable: true },
      particles: {
        number: {
          value: isMobile ? Math.max(10, Math.round(baseCount * 0.55)) : baseCount,
          density: { enable: true },
        },
        paint: { fill: { enable: true, color: { value: o.color || "#ffffff" } } },
        shape: shape,
        opacity: { value: o.opacity || { min: 0.35, max: 0.85 } },
        size: { value: o.size || { min: 2, max: 6 } },
        move: {
          enable: true,
          direction: o.direction || "bottom",
          speed: o.speed || { min: 1, max: 2.8 },
          straight: false,
          outModes: { default: "out" },
        },
        wobble: { enable: o.wobble !== false, distance: 20, speed: { min: -5, max: 5 } },
      },
    };
  }
  snow.mode = "continuous";

  /**
   * 2. 彩帶降落 (confetti — Confetti Falling，預設持續型，亦可搭配 burst 模式事件觸發)
   */
  function confetti(overrides) {
    const o = overrides || {};
    const isMobile = window.innerWidth < MOBILE_WIDTH;
    const baseCount = typeof o.count === "number" ? o.count : 60;

    return {
      fullScreen: { enable: false },
      fpsLimit: 60,
      detectRetina: o.detectRetina !== undefined ? Boolean(o.detectRetina) : !isMobile,
      pauseOnBlur: true,
      pauseOnOutsideViewport: true,
      motion: { disable: true },
      particles: {
        number: {
          value: isMobile ? Math.max(15, Math.round(baseCount * 0.6)) : baseCount,
          density: { enable: true },
        },
        paint: { fill: { enable: true, color: { value: o.colors || DEFAULT_COLORS } } },
        shape: { type: o.shapes || ["square", "circle"] },
        opacity: { value: o.opacity || { min: 0.7, max: 1 } },
        size: { value: o.size || { min: 4, max: 8 } },
        move: {
          enable: true,
          direction: "bottom",
          speed: o.speed || { min: 2, max: 4.5 },
          straight: false,
          outModes: { default: "out" },
        },
        rotate: { value: { min: 0, max: 360 }, direction: "random", animation: { enable: true, speed: 30 } },
        tilt: { direction: "random", enable: true, value: { min: 0, max: 360 }, animation: { enable: true, speed: 30 } },
        roll: { darken: { enable: true, value: 25 }, enable: true, speed: { min: 15, max: 25 } },
        wobble: { enable: true, distance: 25, speed: { min: -10, max: 10 } },
      },
    };
  }
  confetti.mode = "continuous";

  // 互動觸發用彩帶雨 (供 mode: "burst" 或 LPParticles.fire("confetti") 呼叫)
  confetti.burst = function (overrides) {
    const o = overrides || {};
    const isMobile = window.innerWidth < MOBILE_WIDTH;
    const totalCount = typeof o.count === "number" ? o.count : (isMobile ? 45 : 75);
    const perShot = Math.max(10, Math.round(totalCount / 3));
    const base = Object.assign({
      count: perShot,
      angle: 270,
      spread: 80,
      startVelocity: 22,
      gravity: 0.5,
      decay: 0.94,
      ticks: 360,
      colors: o.colors || DEFAULT_COLORS,
      shapes: o.shapes || ["square", "circle"],
      scalar: isMobile ? 0.85 : 1,
      zIndex: 950,
      disableForReducedMotion: true,
    }, o);
    base.count = perShot;

    if (o.position) return base;
    return [
      Object.assign({}, base, { position: { x: 20, y: -5 } }),
      Object.assign({}, base, { position: { x: 50, y: -5 } }),
      Object.assign({}, base, { position: { x: 80, y: -5 } }),
    ];
  };

  /**
   * 3. 雙側彩帶／自訂圖片禮炮 (confettiCannon — 左下 45° 與右下 135° 向中央噴射)
   * @param {Object} [overrides] - 傳入 imageSrc (字串或陣列) 可替換噴射物為圖片（如金幣）
   */
  function confettiCannon(overrides) {
    const o = overrides || {};
    const isMobile = window.innerWidth < MOBILE_WIDTH;
    const count = typeof o.count === "number" ? o.count : (isMobile ? 35 : 55);
    const base = Object.assign({
      count: count,
      spread: 50,
      startVelocity: isMobile ? 45 : 55,
      gravity: 1,
      ticks: 240,
      colors: DEFAULT_COLORS,
      shapes: ["square", "circle"],
      scalar: isMobile ? 0.85 : 1,
      zIndex: 950,
      disableForReducedMotion: true,
    }, o);

    if (o.imageSrc) {
      base.shapes = ["image"];
      base.shapeOptions = { image: buildImageShapeOption(o.imageSrc, o.imageSize || 32) };
      if (o.scalar === undefined) base.scalar = isMobile ? 2.4 : 3;
    }

    return [
      Object.assign({}, base, { angle: 45, position: { x: 5, y: 95 } }),
      Object.assign({}, base, { angle: 135, position: { x: 95, y: 95 } }),
    ];
  }
  confettiCannon.mode = "burst";

  /**
   * 4. 煙火效果 (fireworks — 依 layer 多點同時隨機發射、透明背景、無框混色 1px 細火花)
   */
  function buildFireworkEmitters(rule, isMobile, baseDelay) {
    const isStageBackdrop = Boolean(rule && rule.layer === "stage-backdrop" && !rule.container);
    const zones = isStageBackdrop
      ? [{ min: 4, max: 24 }, { min: 76, max: 96 }]
      : (isMobile
        ? [{ min: 12, max: 45 }, { min: 55, max: 88 }]
        : [{ min: 8, max: 32 }, { min: 36, max: 64 }, { min: 68, max: 92 }]);

    return zones.map(function (xRange) {
      return {
        direction: "top",
        startCount: 0,
        rate: { delay: 0.14, quantity: 1 },
        life: { duration: 0.15, delay: { min: baseDelay * 0.65, max: baseDelay * 1.35 } },
        position: { x: xRange, y: 100 },
      };
    });
  }

  function fireworks(overrides, rule) {
    const o = overrides || {};
    const isMobile = window.innerWidth < MOBILE_WIDTH;
    const palette = Array.isArray(o.colors) && o.colors.length ? o.colors : DEFAULT_COLORS;
    const baseDelay = typeof o.rateDelay === "number" ? o.rateDelay : (isMobile ? 1.2 : 0.9);

    return {
      fullScreen: { enable: false },
      fpsLimit: 60,
      detectRetina: o.detectRetina !== undefined ? Boolean(o.detectRetina) : !isMobile,
      pauseOnBlur: true,
      pauseOnOutsideViewport: true,
      motion: { disable: true },
      emitters: buildFireworkEmitters(rule, isMobile, baseDelay),
      particles: {
        number: { value: 0 },
        life: { count: 1 },
        shape: { type: "circle" },
        size: { value: 0.8 },
        paint: { fill: { enable: true, color: { value: o.trailColor || "#ffe082" } }, stroke: { width: 0 } },
        effect: { type: "trail", options: { trail: { length: { min: 6, max: 12 }, minWidth: 1, maxWidth: 1.5 } } },
        move: {
          enable: true,
          gravity: { enable: true, inverse: true, acceleration: 15, maxSpeed: 100 },
          speed: { min: 10, max: 20 },
          outModes: { default: "destroy", top: "none" },
        },
        destroy: {
          mode: "split",
          bounds: { top: { min: 15, max: 35 } },
          split: {
            sizeOffset: false,
            count: 1,
            factor: { value: 0.333333 },
            rate: { value: typeof o.sparkCount === "number" ? o.sparkCount : (isMobile ? { min: 35, max: 55 } : { min: 65, max: 100 }) },
            particles: {
              merge: false,
              paint: { fill: { enable: true, color: { value: palette } }, stroke: { width: 0 } },
              number: { value: 0 },
              opacity: {
                value: { min: 0.1, max: 1 },
                animation: { enable: true, speed: 0.7, sync: false, startValue: "max", destroy: "min" },
              },
              shape: { type: "circle" },
              effect: { type: "trail", options: { trail: { length: { min: 5, max: 10 }, minWidth: 0.5, maxWidth: 1 } } },
              size: { value: { min: 0.5, max: 1 } },
              life: { count: 1, duration: { value: { min: 1, max: 2 } } },
              move: {
                enable: true,
                decay: { min: 0.075, max: 0.1 },
                gravity: { enable: true, inverse: false, acceleration: 5 },
                speed: { min: 5, max: 15 },
                direction: "none",
                outModes: { default: "destroy" },
              },
            },
          },
        },
      },
    };
  }
  fireworks.mode = "continuous";
  fireworks.plugins = ["destroy", "trail"];

  root.LPParticlePresets = {
    snow: snow,
    confetti: confetti,
    confettiCannon: confettiCannon,
    fireworks: fireworks,
  };
})(typeof window !== "undefined" ? window : globalThis);
