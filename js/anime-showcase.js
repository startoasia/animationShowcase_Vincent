/**
 * ============================================================
 * AnimeComponents — 隨插即用模組化動態元件庫
 * 
 * 透過 data-attribute 宣告即可自動生效，點擊展台直接觸發重播或切換。
 * 
 * 包含四大元件：
 * A. [data-anime-motion-path]        SVG 路徑跟隨元件 (createMotionPath)
 * B. [data-anime-split-words]        文字分詞遮罩浮現元件 (splitText + addEffect)
 * C. [data-anime-split-chars="wave"] 字元波浪彈跳元件 (chars + addEffect)
 * D. [data-anime-split-chars="flip"] 字元 3D 翻轉進場元件 (chars + addEffect)
 * ============================================================
 */

const AnimeComponents = (() => {
  'use strict';

  // 確保 Anime.js v4 已正確載入
  if (typeof anime === 'undefined') {
    console.error('[AnimeComponents] Anime.js 尚未載入。');
    return { autoInit: () => {} };
  }

  /* ============================================================
     A. SVG 路徑跟隨元件 (createMotionPath)
     ============================================================ */
  function initMotionPath(container) {
    const track = container.querySelector('path[data-motion-track]') || container.querySelector('.anime-motion-track');
    const traveler = container.querySelector('[data-motion-traveler]') || container.querySelector('.anime-traveler');
    if (!track || !traveler) return;

    let isPlaying = true;
    const motionPath = anime.createMotionPath(track);

    const anim = anime.animate(traveler, {
      translateX: motionPath.translateX,
      translateY: motionPath.translateY,
      rotate: motionPath.rotate,
      duration: 5000,
      ease: 'linear',
      loop: true
    });

    // 點擊展台切換暫停／繼續
    container.addEventListener('click', () => {
      if (isPlaying) {
        anim.pause();
        isPlaying = false;
      } else {
        anim.play();
        isPlaying = true;
      }
    });
  }

  /* ============================================================
     B. 文字分詞遮罩浮現元件 (splitText + addEffect)
     ============================================================ */
  function initSplitWords(container) {
    const textEl = container.querySelector('[data-split-target]') || container;

    // 透過 splitText 進行語意分詞
    const split = anime.splitText(textEl, {
      words: '<span class="anime-split-word-clip"><span class="anime-split-word-inner">{value}</span></span>'
    });

    let currentAnim = null;

    // 透過 addEffect 綁定動態生命週期，確保 RWD 折行自適應
    split.addEffect(() => {
      const inners = textEl.querySelectorAll('.anime-split-word-inner');
      currentAnim = anime.animate(inners, {
        translateY: ['110%', '0%'],
        rotateX: [-45, 0],
        opacity: [0, 1],
        duration: 850,
        delay: anime.stagger(50),
        ease: 'outBack(1.4)'
      });
      return currentAnim;
    });

    // 點擊展台重新播放進場動態
    container.addEventListener('click', () => {
      if (currentAnim) currentAnim.restart();
    });
  }

  /* ============================================================
     C. 字元波浪彈跳元件 (chars + addEffect)
     ============================================================ */
  function initCharsWave(container) {
    const textEl = container.querySelector('[data-split-target]') || container;

    const split = anime.splitText(textEl, {
      chars: '<span class="anime-char-wave">{value}</span>'
    });

    let currentAnim = null;

    // 以 addEffect 註冊波浪交錯動態
    split.addEffect(() => {
      const chars = textEl.querySelectorAll('.anime-char-wave');
      currentAnim = anime.animate(chars, {
        translateY: [-26, 0],
        scale: [0.35, 1],
        opacity: [0, 1],
        duration: 700,
        delay: anime.stagger(35, { from: 'center' }),
        ease: 'outBack(2)'
      });
      return currentAnim;
    });

    // 點擊展台重新彈跳
    container.addEventListener('click', () => {
      if (currentAnim) currentAnim.restart();
    });
  }

  /* ============================================================
     D. 字元 3D 翻轉進場元件 (chars + addEffect)
     ============================================================ */
  function initCharsFlip(container) {
    const textEl = container.querySelector('[data-split-target]') || container;

    const split = anime.splitText(textEl, {
      chars: '<span class="anime-char-flip">{value}</span>'
    });

    let currentAnim = null;

    // 以 addEffect 註冊立體翻轉進場動態
    split.addEffect(() => {
      const chars = textEl.querySelectorAll('.anime-char-flip');
      currentAnim = anime.animate(chars, {
        rotateY: [90, 0],
        rotateX: [35, 0],
        scale: [0.6, 1],
        opacity: [0, 1],
        duration: 800,
        delay: anime.stagger(40, { from: 'first' }),
        ease: 'outCubic'
      });
      return currentAnim;
    });

    // 點擊展台重新翻轉
    container.addEventListener('click', () => {
      if (currentAnim) currentAnim.restart();
    });
  }

  /* ============================================================
     自動初始化掃描器 (autoInit)
     ============================================================ */
  function autoInit() {
    // 1. SVG Motion Path 元件
    document.querySelectorAll('[data-anime-motion-path]').forEach(initMotionPath);

    // 2. 文字分詞遮罩浮現元件
    document.querySelectorAll('[data-anime-split-words]').forEach(initSplitWords);

    // 3. 字元層級動態元件 (依屬性值區分 wave / flip)
    document.querySelectorAll('[data-anime-split-chars]').forEach((container) => {
      const mode = container.dataset.animeSplitChars;
      if (mode === 'flip') {
        initCharsFlip(container);
      } else {
        initCharsWave(container);
      }
    });
  }

  // 頁面載入時自動初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  return {
    autoInit
  };
})();
