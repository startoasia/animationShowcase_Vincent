// 5. 粒子特效 (particles)
// 統一由 window.particlesConfig 控制全站粒子實例，並交由 js/lp-particles.js 讀取與按需載入引擎。
(function () {
  "use strict";

  const COIN_SVG_URI =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
        '<circle cx="16" cy="16" r="14" fill="#fbbf24" stroke="#d97706" stroke-width="2.5"/>' +
        '<circle cx="16" cy="16" r="9.5" fill="none" stroke="#fef3c7" stroke-width="1.5"/>' +
        '<text x="16" y="21" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="14" fill="#92400e">$</text>' +
      "</svg>"
    );

  window.particlesConfig = [
    // =========================================================
    // 獨立粒子動畫展示區（Preset Demo：snow / confetti / confettiCannon / fireworks）
    // =========================================================

    // B1. Snow（局部深色冬季舞台：進入視窗自動飄雪、離開暫停）
    {
      id: "demo-snow",
      preset: "snow",
      container: "#particle-stage-snow",
      trigger: {
        type: "scroll",
        selector: "#section-particles-snow",
        threshold: 0.2,
        once: false,
      },
      overrides: {
        count: 75,
        speed: { min: 1, max: 2.6 },
        color: "#ffffff",
      },
    },

    // B1-global. Snow（全螢幕預覽模式，由「全螢幕飄雪」按鈕切換）
    {
      id: "global-snow",
      preset: "snow",
      layer: "foreground",
      trigger: { type: "manual" },
      overrides: {
        count: 75,
        speed: { min: 1, max: 2.8 },
        color: ["#60a5fa", "#93c5fd", "#bae6fd"],
      },
    },

    // B2. Confetti Continuous（局部舞台：持續 3D 翻轉彩帶飄落）
    {
      id: "demo-confetti-continuous",
      preset: "confetti",
      mode: "continuous",
      container: "#particle-stage-confetti",
      trigger: {
        type: "scroll",
        selector: "#section-particles-confetti",
        threshold: 0.2,
        once: false,
      },
      overrides: {
        count: 55,
        speed: { min: 1.8, max: 4 },
      },
    },

    // B2-global. Confetti Continuous（全螢幕持續彩帶飄落預覽）
    {
      id: "global-confetti-continuous",
      preset: "confetti",
      mode: "continuous",
      layer: "foreground",
      trigger: { type: "manual" },
      overrides: {
        count: 60,
      },
    },

    // B2-burst. Confetti Burst（單次彩帶雨點擊噴發）
    {
      id: "demo-confetti-burst",
      preset: "confetti",
      mode: "burst",
      layer: "overlay",
      trigger: {
        type: "click",
        selector: "#btn-confetti-burst",
        cooldown: 500,
      },
      overrides: {
        count: 90,
      },
    },

    // B2-scroll. Confetti Scroll Burst（整合滑動觸發全畫面灑花：開啟控制按鈕後，滑動進入可視範圍即觸發）
    {
      id: "demo-confetti-scroll",
      preset: "confetti",
      mode: "burst",
      layer: "overlay",
      trigger: {
        type: "scroll",
        selector: "#confetti-scroll-zone",
        threshold: 0.3,
        once: false,
        cooldown: 2500,
      },
      overrides: {
        count: 90,
      },
    },

    // B3-1. Confetti Cannon（左下 45° + 右下 135° 經典雙側彩帶禮炮）
    {
      id: "demo-cannon-classic",
      preset: "confettiCannon",
      layer: "overlay",
      trigger: {
        type: "click",
        selector: "#btn-cannon-classic",
        cooldown: 500,
      },
      overrides: {
        count: 55,
      },
    },

    // B3-2. Confetti Cannon（自訂圖片 imageSrc 示範：雙側金幣禮炮）
    {
      id: "demo-cannon-coin",
      preset: "confettiCannon",
      layer: "overlay",
      trigger: {
        type: "click",
        selector: "#btn-cannon-coin",
        cooldown: 500,
      },
      overrides: {
        count: 30,
        imageSrc: COIN_SVG_URI,
        imageSize: 32,
        scalar: 2.2,
      },
    },

    // B4. Fireworks（局部深色夜空舞台：含發射線軌跡與炸裂火花外掛）
    {
      id: "demo-fireworks",
      preset: "fireworks",
      container: "#particle-stage-fireworks",
      trigger: {
        type: "scroll",
        selector: "#section-particles-fireworks",
        threshold: 0.2,
        once: false,
      },
      overrides: {
        rateDelay: 1,
        trailColor: "#ffe082",
      },
    },

    // B4-global. Fireworks（全螢幕煙火預覽）
    {
      id: "global-fireworks",
      preset: "fireworks",
      layer: "foreground",
      trigger: { type: "manual" },
      overrides: {
        rateDelay: 0.6,
        trailColor: "#f59e0b",
        colors: ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"],
      },
    },
  ];
})();
