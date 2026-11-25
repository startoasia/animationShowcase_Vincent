/**
 * @fileoverview lp-particles.js — 粒子特效控制器
 * 1. 讀取 window.particlesConfig，無設定時靜默退出且不載入引擎。
 * 2. 動態按需載入本地 particles-presets.js 與 tsparticles.bundle.min.js（相容 file://）。
 * 3. 支援 load / scroll / click / manual 觸發方式自由組合 snow 與 confetti。
 * 4. 公開 window.LPParticles = { init, fire, start, pause, stop }。
 */
(function () {
  "use strict";

  if (window.__LP_PARTICLES_LOADED__) return;
  window.__LP_PARTICLES_LOADED__ = true;

  const MOBILE_WIDTH = 768;
  const STYLE_ID = "lp-particles-style";
  const LAYER_Z = { "stage-backdrop": 5, foreground: 20, overlay: 950 };
  const DEFAULT_BURST_PRESETS = { confettiCannon: true };
  const CLICK_COOLDOWN_MS = 400;
  const SCROLL_COOLDOWN_MS = 1500;
  const EXTRA_PLUGINS = {
    destroy: { file: "tsparticles.updater.destroy.min.js", loader: "loadDestroyUpdater" },
    trail: { file: "tsparticles.effect.trail.min.js", loader: "loadTrailEffect" },
  };

  let loadPromise = null;
  let initialized = false;
  const instances = new Map();
  const loadedPlugins = new Set();

  function getBaseDir() {
    if (document.currentScript && document.currentScript.src) {
      const src = document.currentScript.src;
      return src.substring(0, src.lastIndexOf("/") + 1);
    }
    const scripts = document.querySelectorAll("script[src]");
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src.includes("lp-particles.js")) {
        return scripts[i].src.substring(0, scripts[i].src.lastIndexOf("/") + 1);
      }
    }
    return "./js/frontend-libs/";
  }

  const BASE_DIR = getBaseDir();

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", function () {
        script.remove();
        reject(new Error("[LPParticles] 載入失敗: " + src));
      }, { once: true });
      document.head.appendChild(script);
    });
  }

  function collectRequiredPlugins(presets) {
    const needed = [];
    instances.forEach(function (rec) {
      const fn = presets && presets[rec.rule.preset];
      if (fn && Array.isArray(fn.plugins)) {
        fn.plugins.forEach(function (p) {
          if (needed.indexOf(p) === -1) needed.push(p);
        });
      }
    });
    return needed;
  }

  function loadExtraPlugins(pluginNames, engine) {
    if (!Array.isArray(pluginNames) || !pluginNames.length) return Promise.resolve();
    const pending = pluginNames.filter(function (name) { return EXTRA_PLUGINS[name] && !loadedPlugins.has(name); });
    if (!pending.length) return Promise.resolve();

    return Promise.all(pending.map(function (name) {
      const cfg = EXTRA_PLUGINS[name];
      return loadScript(BASE_DIR + "particles/" + cfg.file).then(function () {
        const loaderFn = window[cfg.loader];
        if (typeof loaderFn === "function") return loaderFn(engine);
      }).then(function () {
        loadedPlugins.add(name);
      });
    }));
  }

  function ensureReady() {
    if (!loadPromise) {
      const tasks = [];
      if (!window.LPParticlePresets) tasks.push(loadScript(BASE_DIR + "particles/particles-presets.js"));
      if (typeof window.confetti !== "function") tasks.push(loadScript(BASE_DIR + "particles/tsparticles.bundle.min.js"));
      loadPromise = Promise.all(tasks).then(function () {
        const internals = window.__tsParticlesInternals;
        if (internals && internals.bundles && internals.bundles.confetti && (!internals.engine || !internals.engine.tsParticles)) {
          internals.engine = internals.bundles.confetti;
        }
        const engine = window.tsParticles || (internals && internals.engine && internals.engine.tsParticles);
        const initBase = typeof window.confetti.init === "function" ? window.confetti.init() : Promise.resolve();
        // 必須在任何 tsParticles.load() 執行前註冊所有外掛，避免觸發 TSP-1003
        return initBase.then(function () {
          return loadExtraPlugins(collectRequiredPlugins(window.LPParticlePresets), engine);
        });
      }).catch(function (err) {
        loadPromise = null;
        throw err;
      });
    }
    return loadPromise.then(function () {
      const internals = window.__tsParticlesInternals;
      const engine = window.tsParticles || (internals && internals.engine && internals.engine.tsParticles);
      return { tsParticles: engine, confetti: window.confetti, presets: window.LPParticlePresets };
    });
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".lp-particles-layer { pointer-events: none; overflow: hidden; }",
      ".lp-particles-global { position: fixed; inset: 0; }",
      ".lp-particles-local { position: absolute; inset: 0; width: 100%; height: 100%; }",
      ".lp-particles-layer canvas { pointer-events: none; display: block; }",
      "@media screen and (max-width: 767px) { .lp-particles-stage-backdrop { display: none; } }",
    ].join("\n");
    document.head.appendChild(style);
  }

  function createMount(id, rule, zIndex) {
    injectStyles();
    const domId = "lp-particles-mount-" + id;
    const existing = document.getElementById(domId);
    if (existing) return existing;

    const mount = document.createElement("div");
    mount.id = domId;
    mount.className = "lp-particles-layer";
    mount.setAttribute("aria-hidden", "true");
    mount.style.zIndex = String(zIndex);

    if (rule.container) {
      const host = document.querySelector(rule.container);
      if (!host) return null;
      if (window.getComputedStyle(host).position === "static") host.style.position = "relative";
      mount.classList.add("lp-particles-local");
      host.appendChild(mount);
    } else {
      mount.classList.add("lp-particles-global");
      if (rule.layer === "stage-backdrop") mount.classList.add("lp-particles-stage-backdrop");
      document.body.appendChild(mount);
    }
    return mount;
  }

  function startContinuous(id) {
    const rec = instances.get(id);
    if (!rec) return Promise.resolve();
    if (rec.rule.layer === "stage-backdrop" && !rec.rule.container && window.innerWidth < MOBILE_WIDTH) {
      return Promise.resolve();
    }
    rec.wantRunning = true;
    if (rec.container) {
      if (!document.hidden) rec.container.play();
      return Promise.resolve();
    }
    if (rec.loading) return rec.loading;

    rec.loading = ensureReady().then(function (deps) {
      const build = deps.presets[rec.rule.preset || "snow"];
      if (typeof build !== "function" || !rec.wantRunning) return;
      const zIndex = typeof rec.rule.zIndex === "number" ? rec.rule.zIndex : (LAYER_Z[rec.rule.layer] || LAYER_Z.foreground);
      const mount = createMount(id, rec.rule, zIndex);
      if (!mount) return;
      return deps.tsParticles.load({
        id: "lp-particles-" + id,
        element: mount,
        options: build(rec.rule.overrides, rec.rule),
      }).then(function (container) {
        if (!container) return;
        rec.container = container;
        rec.mount = mount;
        if (document.hidden || !rec.wantRunning) container.pause();
      });
    }).catch(function (err) {
      console.error("[LPParticles] 啟動失敗 (" + id + "):", err);
    }).finally(function () {
      rec.loading = null;
    });
    return rec.loading;
  }

  function pauseContinuous(id) {
    const rec = instances.get(id);
    if (!rec) return;
    rec.wantRunning = false;
    if (rec.container) rec.container.pause();
  }

  function stopContinuous(id) {
    const rec = instances.get(id);
    if (!rec) return;
    rec.wantRunning = false;
    if (rec.container) {
      rec.container.destroy();
      rec.container = null;
    }
    if (rec.mount && rec.mount.parentNode) {
      rec.mount.parentNode.removeChild(rec.mount);
      rec.mount = null;
    }
  }

  function fireBurst(idOrPreset, extraOverrides) {
    const rec = instances.get(idOrPreset);
    const rule = rec ? rec.rule : { id: "adhoc-" + (idOrPreset || "confetti"), preset: idOrPreset || "confetti" };

    return ensureReady().then(function (deps) {
      const build = deps.presets[rule.preset || "confetti"];
      if (typeof build !== "function") return;
      const burstFn = build.mode === "burst" ? build : build.burst;
      if (typeof burstFn !== "function") return rec ? startContinuous(rec.id) : undefined;

      const merged = Object.assign({}, rule.overrides, extraOverrides);
      if (merged.zIndex === undefined) {
        merged.zIndex = typeof rule.zIndex === "number" ? rule.zIndex : (LAYER_Z[rule.layer] || LAYER_Z.overlay);
      }
      const payload = burstFn(merged);
      const shots = Array.isArray(payload) ? payload : [payload];
      const key = "lp-burst-" + (rule.id || "confetti");
      return Promise.all(shots.map(function (shot) { return deps.confetti(key, shot); }));
    }).catch(function (err) {
      console.error("[LPParticles] 噴發失敗:", err);
    });
  }

  function bindTrigger(rec) {
    const rule = rec.rule;
    const trigger = rule.trigger || { type: "load" };
    const type = trigger.type || "load";
    const isBurst = rec.mode === "burst";
    let fired = false;
    let lastTime = -Infinity;

    function canFire(defaultCd, defaultOnce) {
      const isOnce = trigger.once !== undefined ? Boolean(trigger.once) : defaultOnce;
      if (isOnce && fired) return false;
      const cd = typeof trigger.cooldown === "number" ? trigger.cooldown : defaultCd;
      const now = performance.now();
      if (cd > 0 && now - lastTime < cd) return false;
      lastTime = now;
      fired = true;
      return true;
    }

    if (type === "load") {
      const run = function () { isBurst ? fireBurst(rec.id) : startContinuous(rec.id); };
      if (trigger.delay > 0) setTimeout(run, trigger.delay);
      else run();
      return;
    }

    if (type === "scroll" && trigger.selector) {
      const targets = document.querySelectorAll(trigger.selector);
      if (!targets.length) return;
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!isBurst) startContinuous(rec.id);
            else if (canFire(SCROLL_COOLDOWN_MS, true)) fireBurst(rec.id);
            if (trigger.once === true || (isBurst && trigger.once !== false)) observer.disconnect();
          } else if (!isBurst && trigger.once !== true) {
            pauseContinuous(rec.id);
          }
        });
      }, { threshold: typeof trigger.threshold === "number" ? trigger.threshold : 0.25 });
      targets.forEach(function (el) { observer.observe(el); });
      return;
    }

    if (type === "click" && trigger.selector) {
      document.addEventListener("click", function (e) {
        const el = e.target && e.target.closest ? e.target.closest(trigger.selector) : null;
        if (!el || !canFire(isBurst ? CLICK_COOLDOWN_MS : 150, false)) return;
        if (!isBurst) {
          rec.wantRunning ? pauseContinuous(rec.id) : startContinuous(rec.id);
          return;
        }
        const pos = trigger.originFromEvent && (e.clientX || e.clientY)
          ? { position: { x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 } }
          : null;
        fireBurst(rec.id, pos);
      }, { passive: true });
    }
  }

  function init(overrideConfig) {
    if (initialized && !overrideConfig) return;
    const raw = overrideConfig !== undefined ? overrideConfig : window.particlesConfig;
    const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    const active = list.filter(function (r) { return r && typeof r === "object" && r.enabled !== false; });
    if (!active.length) return;

    initialized = true;
    document.addEventListener("visibilitychange", function () {
      instances.forEach(function (rec) {
        if (rec.container) document.hidden ? rec.container.pause() : (rec.wantRunning && rec.container.play());
      });
    });

    active.forEach(function (rule, index) {
      const id = rule.id || ("rule-" + index);
      const presetName = rule.preset || "snow";
      const known = window.LPParticlePresets && window.LPParticlePresets[presetName];
      const mode = (known && known.mode) || rule.mode || (DEFAULT_BURST_PRESETS[presetName] ? "burst" : "continuous");
      const rec = { id: id, rule: rule, mode: mode, wantRunning: false, container: null, mount: null, loading: null };
      instances.set(id, rec);
      bindTrigger(rec);
    });
  }

  window.LPParticles = {
    init: init,
    fire: fireBurst,
    start: startContinuous,
    pause: pauseContinuous,
    stop: stopContinuous,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { init(); });
  } else {
    init();
  }
})();
