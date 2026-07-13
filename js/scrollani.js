/**
 * scrollani.js — Scroll-triggered Confetti
 * =========================================
 * 提供兩種使用方式：
 *
 * ── 方式 A：data-attribute 自動掃描（推薦）────────────────────
 *   在 HTML 上加屬性，於頁面底部呼叫一次 autoInit()：
 *
 *   <section data-scroll-confetti
 *            data-confetti-threshold="0.3"
 *            data-confetti-duration="5800">
 *     <div data-confetti-trigger>觸發元素</div>
 *     <div data-confetti-status>等待滾動觸發…</div>  <!-- 選填 -->
 *   </section>
 *
 *   ScrollConfetti.autoInit(); // 掃描所有 [data-scroll-confetti]
 *
 * ── 方式 B：手動建立（進階控制）─────────────────────────────
 *   const instance = ScrollConfetti.create({
 *     triggerEl : document.getElementById('my-trigger'),
 *     confettiEl: document.getElementById('my-section'),
 *     statusEl  : document.getElementById('my-status'),  // 選填
 *     threshold : 0.3,    // 選填，預設 0.3
 *     duration  : 5800,   // 選填，預設 5800
 *   });
 *   instance.destroy();   // 解除監聽，清理資源
 */

const ScrollConfetti = (() => {

  // ── 私有工具 ────────────────────────────────────────────────
  function setText(el, text) {
    if (el) el.textContent = text;
  }

  // ── 核心工廠函式 ─────────────────────────────────────────────
  /**
   * @param {Object}  opts
   * @param {Element} opts.triggerEl        - IntersectionObserver 偵測目標（必填）
   * @param {Element} opts.confettiEl       - 加上 .confetti-scroll 的容器（必填）
   * @param {Element} [opts.statusEl]       - 狀態訊息容器（選填）
   * @param {number}  [opts.threshold=0.3]  - 進入視窗比例閾值
   * @param {number}  [opts.duration=5800]  - 動畫結束後重置的毫秒數
   * @returns {{ destroy: Function }}
   */
  function create(opts = {}) {
    const {
      triggerEl,
      confettiEl,
      statusEl  = null,
      threshold = 0.3,
      duration  = 5800,
    } = opts;

    if (!triggerEl || !confettiEl) {
      console.warn('[ScrollConfetti] triggerEl 和 confettiEl 為必填參數。');
      return { destroy: () => {} };
    }

    const CLASS_CONFETTI = 'confetti-scroll';
    const CLASS_ACTIVE   = 'confetti-scroll-active';

    let isPlaying  = false;
    let resetTimer = null;

    function play() {
      if (isPlaying) return;
      isPlaying = true;

      if (confettiEl.classList.contains(CLASS_CONFETTI)) {
        confettiEl.classList.remove(CLASS_CONFETTI);
        void confettiEl.offsetWidth; // 強制 reflow，重播動畫
      }

      confettiEl.classList.add(CLASS_CONFETTI);
      triggerEl.classList.add(CLASS_ACTIVE);
      setText(statusEl, '🎉 灑花中！滾動到下個區塊後再回來可再次觸發。');

      clearTimeout(resetTimer);
      resetTimer = setTimeout(reset, duration);
    }

    function reset() {
      confettiEl.classList.remove(CLASS_CONFETTI);
      triggerEl.classList.remove(CLASS_ACTIVE);
      isPlaying = false;
      setText(statusEl, '✅ 播放完畢。再次滾過此區塊可重新觸發。');
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            play();
          } else if (!isPlaying) {
            setText(statusEl, '等待滾動觸發…');
          }
        }
      },
      { threshold }
    );

    observer.observe(triggerEl);

    return {
      destroy() {
        observer.disconnect();
        clearTimeout(resetTimer);
        confettiEl.classList.remove(CLASS_CONFETTI);
        triggerEl.classList.remove(CLASS_ACTIVE);
      },
    };
  }

  // ── 自動掃描初始化 ───────────────────────────────────────────
  /**
   * 掃描頁面上所有 [data-scroll-confetti] 元素並自動建立實例。
   *
   * 對應的 HTML 屬性：
   *   data-scroll-confetti            → 標記容器（同時作為 confettiEl）
   *   data-confetti-trigger           → 觸發偵測的子元素（必填）
   *   data-confetti-status            → 狀態文字的子元素（選填）
   *   data-confetti-threshold="0.3"   → IntersectionObserver 閾值（選填）
   *   data-confetti-duration="5800"   → 動畫重置毫秒數（選填）
   *
   * @param {Element|Document} [root=document] - 掃描的根節點，預設為整份 document
   * @returns {Array<{ destroy: Function }>}   - 所有建立的實例陣列
   */
  function autoInit(root = document) {
    const containers = root.querySelectorAll('[data-scroll-confetti]');
    const instances  = [];

    for (const container of containers) {
      const triggerEl  = container.querySelector('[data-confetti-trigger]');
      const statusEl   = container.querySelector('[data-confetti-status]') ?? null;
      const threshold  = parseFloat(container.dataset.confettiThreshold) || 0.3;
      const duration   = parseInt(container.dataset.confettiDuration, 10)  || 5800;

      if (!triggerEl) {
        console.warn(
          '[ScrollConfetti] autoInit: 找不到 [data-confetti-trigger] 子元素，略過此容器。',
          container
        );
        continue;
      }

      instances.push(
        create({ triggerEl, confettiEl: container, statusEl, threshold, duration })
      );
    }

    return instances;
  }

  // ── 公開 API ─────────────────────────────────────────────────
  return { create, autoInit };
})();
