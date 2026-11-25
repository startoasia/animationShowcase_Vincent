/**
 * particles-showcase.js
 * 負責粒子展示區的 UI 狀態同步（局部播放/暫停按鈕、全螢幕預覽互斥與懸浮關閉列）。
 * 所有粒子配方、觸發規則與參數皆由 js/config.js + js/lp-particles.js 控制。
 */
(function () {
  "use strict";

  const STAGE_NAMES = {
    "global-snow": "全螢幕飄雪",
    "global-confetti-continuous": "全螢幕彩帶飄落",
    "global-fireworks": "全螢幕煙火",
  };

  let activeGlobalId = null;

  function setStatusPill(pillEl, stateText, isPlaying) {
    if (!pillEl) return;
    const textEl = pillEl.querySelector("[data-status-text]");
    if (textEl) textEl.textContent = stateText;
    pillEl.classList.toggle("is-playing", Boolean(isPlaying));
    pillEl.classList.toggle("is-paused", !isPlaying);
  }

  // ── 1. 局部舞台：自動偵測進出可視範圍狀態 + 手動暫停/播放切換 ──
  function initLocalStages() {
    document.querySelectorAll("[data-particle-stage-id]").forEach(function (card) {
      const id = card.dataset.particleStageId;
      const toggleBtn = card.querySelector("[data-particle-toggle]");
      const statusPill = card.querySelector("[data-particle-status-pill]");
      let manuallyPaused = false;
      let inView = false;

      function syncUI() {
        const playing = inView && !manuallyPaused;
        if (toggleBtn) {
          toggleBtn.textContent = playing ? "⏸ 暫停預覽" : "▶ 播放預覽";
          toggleBtn.classList.toggle("is-active", !playing);
        }
        if (manuallyPaused) {
          setStatusPill(statusPill, "已手動暫停", false);
        } else if (inView) {
          setStatusPill(statusPill, "播放中（進入可視範圍）", true);
        } else {
          setStatusPill(statusPill, "待機中（滑動至此自動播放）", false);
        }
      }

      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            inView = entry.isIntersecting;
            if (inView && manuallyPaused && window.LPParticles) {
              // lp-particles 會在進入視窗時呼叫 start；若使用者曾手動暫停則維持使用者意圖
              window.LPParticles.pause(id);
            }
            syncUI();
          });
        },
        { threshold: 0.2 }
      );
      observer.observe(card);

      if (toggleBtn) {
        toggleBtn.addEventListener("click", function () {
          if (!window.LPParticles) return;
          if (inView && !manuallyPaused) {
            manuallyPaused = true;
            window.LPParticles.pause(id);
          } else {
            manuallyPaused = false;
            inView = true;
            window.LPParticles.start(id);
          }
          syncUI();
        });
      }

      syncUI();
    });
  }

  // ── 2. 全螢幕連續特效互斥控制與懸浮關閉條 ──
  function initGlobalPreviews() {
    const globalBar = document.getElementById("particleGlobalBar");
    const globalBarLabel = document.getElementById("particleGlobalBarLabel");
    const globalBarClose = document.getElementById("particleGlobalBarClose");
    const buttons = Array.from(document.querySelectorAll("[data-global-particle]"));

    function stopActiveGlobal() {
      if (!activeGlobalId || !window.LPParticles) return;
      window.LPParticles.stop(activeGlobalId);
      activeGlobalId = null;
      buttons.forEach(function (btn) {
        btn.classList.remove("is-active");
        if (btn.dataset.defaultLabel) btn.textContent = btn.dataset.defaultLabel;
      });
      if (globalBar) globalBar.classList.remove("is-visible");
    }

    buttons.forEach(function (btn) {
      btn.dataset.defaultLabel = btn.textContent.trim();
      btn.addEventListener("click", function () {
        if (!window.LPParticles) return;
        const targetId = btn.dataset.globalParticle;
        if (activeGlobalId === targetId) {
          stopActiveGlobal();
          return;
        }
        stopActiveGlobal();
        activeGlobalId = targetId;
        window.LPParticles.start(targetId);
        btn.classList.add("is-active");
        btn.textContent = "⏹ 關閉全螢幕";
        if (globalBar && globalBarLabel) {
          globalBarLabel.textContent = "目前播放：" + (STAGE_NAMES[targetId] || targetId);
          globalBar.classList.add("is-visible");
        }
      });
    });

    if (globalBarClose) {
      globalBarClose.addEventListener("click", stopActiveGlobal);
    }
  }

  // ── 3. 彩帶降落區「滑動觸發全畫面灑花」示範開關與狀態同步 ──
  function initConfettiScrollDemo() {
    const toggleBtn = document.getElementById("btn-confetti-scroll-toggle");
    const panel = document.getElementById("confetti-scroll-panel");
    const zone = document.getElementById("confetti-scroll-zone");
    const statusEl = document.getElementById("confetti-scroll-status");
    if (!toggleBtn || !panel || !zone || !statusEl) return;

    let lastTrigger = -Infinity;
    let highlightTimer = null;

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (panel.hidden) return;
          if (entry.isIntersecting) {
            const now = performance.now();
            if (now - lastTrigger < 2500) return;
            lastTrigger = now;
            zone.classList.add("is-triggered");
            statusEl.textContent = "🎉 已觸發全畫面灑花！移出可視範圍後再次滑入可重播。";
            clearTimeout(highlightTimer);
            highlightTimer = setTimeout(function () {
              zone.classList.remove("is-triggered");
            }, 2200);
          } else {
            statusEl.textContent = "等待滑入可視範圍觸發全畫面灑花…";
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(zone);

    toggleBtn.addEventListener("click", function () {
      const willEnable = panel.hidden;
      panel.hidden = !willEnable;
      toggleBtn.classList.toggle("is-active", willEnable);
      toggleBtn.textContent = willEnable ? "⏹ 關閉滑動灑花示範" : "🎆 開啟滑動灑花示範";
      if (!willEnable) {
        zone.classList.remove("is-triggered");
        statusEl.textContent = "上下滑動頁面讓此區塊進出視窗，即會觸發全畫面彩帶雨。";
      }
    });
  }

  function init() {
    initLocalStages();
    initGlobalPreviews();
    initConfettiScrollDemo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
