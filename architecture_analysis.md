# 動畫架構全盤分析：集中式 vs 元件內實作

## 前提：先前建議的矛盾

我在先前的對話中給出了兩個矛盾的建議：

| 時間點 | 建議 |
|---|---|
| 試行階段評估時 | 定案後應將動畫邏輯「從外掛回歸內聚」至各元件 `<script>` 中 |
| 剛才的回答 | 維持現有集中式 `src/animations/` 架構 |

**這兩個建議都有各自合理的論據，但不能同時成立。** 以下是基於目前程式碼實際狀態的完整分析。

---

## 一、現況架構盤點

### 檔案結構
```
src/animations/
├── index.ts          # Orchestrator (81行)
├── config.ts         # 集中參數 (99行)
└── modules/
    ├── textChars.ts       # Hero 逐字 (71行)
    ├── problemList.ts     # 痛點清單 (124行)
    ├── growthWave.ts      # 成長階段 (139行)
    ├── statCounters.ts    # 實績數字 (137行)
    ├── discsLevitate.ts   # 圓盤懸浮 (32行)
    ├── servicesLaser.ts   # 服務列表 (124行)
    ├── circuitTrace.ts    # 流程路徑 (106行)
    └── highlightMarker.ts # 螢光筆畫線 (75行)
```

### 耦合方式
- **元件 → 動畫**：元件透過 `data-anime="xxx"` 屬性標記 DOM 節點（共 16 處）
- **動畫 → 元件**：模組透過 `querySelectorAll('[data-anime="xxx"]')` 在 runtime 查找目標
- **啟動點**：`index.astro` 的 `<script>` 呼叫 `initHomeMotion()`，一次啟動全部 8 個模組
- **例外**：`highlightMarker` 使用 CSS class `.marker-highlight` 而非 `data-anime`，天然跨頁可複用

---

## 二、先前「建議遷移至元件內」的論據——逐項重新檢視

### 論據 1：Runtime DOM 查詢開銷
> *「每次 astro:page-load 都要重新掃描整個 DOM 樹去『發現』動畫目標」*

**重新評估**：

- 實際開銷：8 個模組共約 16 次 `querySelector` / `querySelectorAll`，對數十個節點的查詢在**微秒級完成**。
- **Astro 元件內 `<script>` 一樣要做 `querySelector`**。Astro 的 `<script>` 不像 React 的 `useRef` 能直接持有 DOM 引用——它只是一個普通的 client-side script，照樣需要 `document.querySelector` 去找目標。

> [!IMPORTANT]
> **結論：這個論據在 Astro 架構下不成立。** 無論集中式或元件內，都需要 runtime DOM 查詢。遷移不會消除這層「間接尋址」。

---

### 論據 2：全局開關的 Dead Code
> *「`if (!MOTION_CONFIG.enabled) return;` 無法被 Tree Shaking 消除」*

**重新評估**：

- 確實，`enabled` 作為 runtime 值，Vite 無法在 build time 消除這段分支。
- 但整個條件分支只存在於 `index.ts` 的第 42 行，**不是每個模組都有**。實際 dead code 量約 **4 行**，打包影響可忽略不計。
- 若要消除，可改用 `import.meta.env.PUBLIC_MOTION_ENABLED` 做 build-time 常數，**不需要遷移整個架構**。

> [!NOTE]
> **結論：合理但輕微的問題，且有不動架構的解法（build-time env）。不構成遷移理由。**

---

### 論據 3：模組間的解耦間接成本
> *「組件內建動畫可以在同一個 `<script>` 中直接管理初始化與銷毀，不需要全局 orchestrator」*

**重新評估——這是唯一有實質重量的論據**：

集中式 orchestrator 確實引入了以下維護成本：

| 集中式需要的額外工作 | 元件內可省略 |
|---|---|
| `index.ts` 要 import 並手動 push 每個模組的 cleanup | 模組自己管自己 |
| `config.ts` 要集中宣告所有參數 | 參數與元件同檔 |
| `astro:before-swap` 清理需由 orchestrator 統一觸發 | 各元件各自清理 |
| 新增動畫需改 3 個檔案（模組、config、index） | 只改 1 個元件檔 |

**但同時帶來的好處**：

| 集中式的好處 | 對你們專案的實際價值 |
|---|---|
| `reduced-motion` 只寫一次 | ✅ 已驗證有效，不用每個元件重複 |
| `enabled` 全局開關 | ✅ 在試行調校期間救過命，未來可改 build-time |
| `config.ts` 集中調參 | ✅ **在這次 6 輪調校迭代中被反覆證明是最大優勢** |
| View Transition 清理統一 | ✅ Astro 多頁場景下必要 |

---

### 論據 4：`data-anime` 屬性暴露
> *「攻擊者可精準定位品牌核心元素」*

**重新評估**：

- 如先前分析所述，**風險等級：低**。攻擊者若能執行任意 JS，用 class/id/DOM 結構一樣能定位。
- 但若介意，可改用更隱蔽的選擇器策略（如 `[data-a="pl"]` 短碼），**不需要遷移架構**。

---

## 三、Astro 框架特性的關鍵約束

這是先前分析中**遺漏的關鍵因素**：

### Astro `<script>` ≠ React `useEffect` / Vue `onMounted`

```astro
<!-- Astro 元件 -->
<div class="problem-list">...</div>

<script>
  // 這段 JS 會被 Vite 抽取、打包、dedupe
  // 它不是「每個元件實例」執行一次，而是「每個頁面」執行一次
  // 它沒有 component lifecycle，沒有 props，沒有 cleanup hook
  const el = document.querySelector('.problem-list'); // 一樣要 querySelector
</script>
```

| 特性 | React/Vue | Astro `<script>` |
|---|---|---|
| 直接持有 DOM 引用 | ✅ `useRef` / `ref` | ❌ 需要 `querySelector` |
| 元件生命周期 | ✅ `onMounted` / `useEffect` | ❌ 無，需自行管理 |
| 自動 cleanup | ✅ `onUnmounted` / `return ()=>{}` | ❌ 需自行監聽 `astro:before-swap` |
| Bundle deduplication | ✅ 框架處理 | ✅ Vite 處理（相同 `<script>` 只打包一次） |

> [!CAUTION]
> **在 Astro 中將動畫邏輯移入元件 `<script>`，不會獲得 React/Vue co-location 的核心好處（直接引用、生命周期管理）。反而會失去集中式清理的便利，每個元件都得自己寫 `document.addEventListener('astro:before-swap', cleanup)`。**

---

## 四、如果真的遷移到元件內，會變成什麼樣？

以 `ProblemSection.astro` 為例，遷移後的樣貌：

```astro
<!-- ProblemSection.astro -->
<section class="problem-section">
  <ul class="problem-list">
    <li class="problem-item">...</li>
  </ul>
</section>

<script>
  import { animate, set, stagger, remove } from 'animejs';

  // 參數（原本在 config.ts 集中管理，現在散落各處）
  const PROBLEM_MOTION = {
    titleToContentDelayMs: 80,
    pointerDurationMs: 450,
    textDurationMs: 500,
    staggerMs: 120,
  };

  // reduced-motion 守衛（每個元件都要寫一次）
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // 什麼都不做
  } else {
    const listContainer = document.querySelector('.problem-list');
    const pointers = Array.from(document.querySelectorAll('.problem-item svg'));
    // ... 同樣的 querySelector 邏輯 ...
    // ... 同樣的 IntersectionObserver 邏輯 ...

    // cleanup（每個元件都要自己綁）
    const cleanup = () => { /* ... */ };
    document.addEventListener('astro:before-swap', cleanup, { once: true });
  }
</script>
```

### 遷移後的實際差異

| 面向 | 變化 |
|---|---|
| DOM 查詢方式 | **完全一樣**，仍是 `querySelector` |
| 打包體積 | 幾乎不變（Vite 會 bundle 所有 `<script>`） |
| `reduced-motion` | **退化**：從寫 1 次變成寫 8 次 |
| cleanup | **退化**：從 orchestrator 統一管理變成各自管理 |
| 參數調校 | **退化**：從改 1 個 `config.ts` 變成翻找 8 個 `.astro` 檔 |
| 新人理解成本 | **改善**：動畫邏輯與模板同檔，不需要理解 `data-anime` 配對機制 |

---

## 五、最終建議

### ✅ 推薦：維持集中式 `src/animations/` 架構

原因排序：

1. **Astro 的 `<script>` 不提供元件生命周期**，遷移不會獲得 React/Vue co-location 的真正好處
2. **集中 `config.ts` 的調參效率已被 6 輪迭代驗證**，這是實際工作流中最高頻的操作
3. **統一 cleanup 與 `reduced-motion` 守衛**是正確的橫切關注點處理方式，不應分散
4. **DOM 查詢開銷不會因遷移而改善**——兩種方式完全一樣

### 可漸進優化（不改架構）

| 優化項 | 做法 | 收益 |
|---|---|---|
| 消除 dead code | 將 `enabled` 改為 `import.meta.env.PUBLIC_MOTION_ENABLED` | Build-time 消除 |
| 精簡 `data-anime` | 縮短為 `data-a="pl"` 或改用 CSS class | 減少 HTML 體積，降低語意暴露 |
| 按頁分組 | 未來若有子頁動畫，新增 `initAboutMotion()` | 避免首頁模組被其他頁面載入 |

### 例外：`highlightMarker` 類的通用 CSS utility 動畫

像螢光筆畫線這種**跨頁通用、以 CSS class 觸發**的動畫，天然適合作為獨立模組存在於 `src/animations/modules/`，繼續由 orchestrator 管理，但也可以被其他頁面單獨 import。這已經是最佳實踐。

---

## 六、對先前「建議遷移」的修正說明

先前的建議是以 **React/Vue 的 co-location 最佳實踐**為基礎推演的。在那些框架中，元件內實作確實能獲得直接 DOM 引用、自動 cleanup、props 驅動等真實好處。

但 **Astro 是靜態優先的 MPA 框架**，其 `<script>` 標籤的行為與 SPA 框架的元件腳本有本質差異。將 SPA 框架的最佳實踐直接套用到 Astro 上，是一個**錯誤的類比**。

> [!IMPORTANT]
> **修正結論：在 Astro 架構下，集中式動畫管理是更合適的選擇。先前「定案後遷移至元件內」的建議不適用於本專案的技術棧。**
