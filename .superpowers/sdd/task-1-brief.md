### Task 1: 新增 `style.css` — 设计令牌 + 全部组件样式

**Files:**
- Create: `style.css`

**Interfaces:**
- Consumes: 无(全新文件)。
- Produces: 给 `index.html` 用的 class 与 id 选择器集合(详见 Task 2)。包括:
  - CSS 变量 `--bg-app` `--bg-panel` `--bg-canvas` `--bg-card` `--bg-hover` `--bg-active` `--text-primary` `--text-secondary` `--text-tertiary` `--accent` `--accent-hover` `--accent-soft` `--accent-text` `--border-soft` `--border-strong` `--shadow-sm` `--shadow-md` `--radius-sm` `--radius-md` `--radius-lg` `--font-serif` `--font-sans` `--font-mono`
  - 布局:`#topbar` `#main` `#leftbar` `#canvas-wrap` `#canvas-card` `#rightbar` `.panel-section` `.panel-title` `.panel-subtitle` `.topbar-brand` `.topbar-group` `.topbar-divider`
  - 按钮:`.btn` `.btn-primary` `.btn-secondary` `.btn-ghost` `.btn-danger` `.btn-block`
  - 工具:`.tool` `.tool.active` `.tool-icon` `.tool-name` `.tool-hint`
  - 玩家项:`#player-list li` `li.selected` `.player-rank` `.player-name-wrap` `.pname` `.pfix` `.pdel` `.badge` `.badge-seated` `.badge-fixed` `.badge-unseated`
  - 模式卡片:`.mode-cards` `.mode-card` `input[type=radio]`
  - 其他:`#zoom` `[data-tip]::after` `.icon-btn` `.icon-btn:disabled`

- [ ] **Step 1: 写 `style.css`**

新建文件 `D:\PythonProject\map\style.css`,完整内容如下:

```css
/* ============================================================
   熊坑排座 · Claude.ai 主站风格
   ============================================================ */

:root {
  /* 背景层 */
  --bg-app:      #F5F1EA;
  --bg-panel:    #FBF8F2;
  --bg-canvas:   #EFEAE0;
  --bg-card:     #FFFFFF;
  --bg-hover:    #F1EBE0;
  --bg-active:   #E9DCC8;

  /* 文字 */
  --text-primary:   #1F1A14;
  --text-secondary: #6B6156;
  --text-tertiary:  #9C9184;

  /* 主色(赤陶) */
  --accent:        #C15A3C;
  --accent-hover:  #A94D32;
  --accent-soft:   #F6E3D9;
  --accent-text:   #FFFFFF;

  /* 边框 / 分隔 */
  --border-soft:   #E5DDCF;
  --border-strong: #C9BFA9;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(31, 26, 20, .06);
  --shadow-md: 0 4px 12px rgba(31, 26, 20, .08);

  /* 圆角 */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;

  /* 字体 */
  --font-serif: Georgia, "Songti SC", "STSong", "SimSun", serif;
  --font-sans:  -apple-system, "Segoe UI", "PingFang SC",
                "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
  --font-mono:  ui-monospace, "SF Mono", Consolas, monospace;
}

/* ============ 基础 ============ */

* { box-sizing: border-box; }

html, body { height: 100%; }

body {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-app);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

button {
  font-family: inherit;
  font-size: 14px;
  color: inherit;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

button:focus-visible,
input:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

input[type="text"], input:not([type]) {
  font-family: inherit;
  font-size: 13px;
  color: var(--text-primary);
  background: transparent;
  border: none;
  padding: 2px 4px;
  border-radius: var(--radius-sm);
}

input[type="text"]:hover, input:not([type]):hover { background: var(--bg-hover); }
input[type="text"]:focus, input:not([type]):focus {
  background: var(--bg-card);
  outline: 1.5px solid var(--accent);
  outline-offset: 0;
}

input[type="checkbox"] {
  accent-color: var(--accent);
  width: 14px; height: 14px;
  cursor: pointer;
}

input[type="radio"] {
  accent-color: var(--accent);
  width: 14px; height: 14px;
  cursor: pointer;
}

hr {
  border: none;
  border-top: 1px solid var(--border-soft);
  margin: 16px 0;
}

/* ============ 按钮变体 ============ */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 120ms ease, color 120ms ease,
              border-color 120ms ease, box-shadow 120ms ease;
  border: 1px solid transparent;
  white-space: nowrap;
}

.btn-block { width: 100%; }

.btn-primary {
  background: var(--accent);
  color: var(--accent-text);
  box-shadow: var(--shadow-sm);
}
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); }

.btn-secondary {
  background: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--border-soft);
}
.btn-secondary:hover:not(:disabled) { background: var(--bg-hover); }

.btn-ghost {
  background: transparent;
  color: var(--text-primary);
}
.btn-ghost:hover:not(:disabled) { background: var(--bg-hover); }

.btn-danger {
  background: transparent;
  color: #B3341F;
}
.btn-danger:hover:not(:disabled) { background: #F9E5E0; }

/* 图标按钮(撤销/重做) */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px; height: 34px;
  border-radius: 8px;
  color: var(--text-secondary);
  transition: background-color 120ms ease, color 120ms ease;
}
.icon-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* ============ 顶栏 ============ */

#topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 56px;
  padding: 0 16px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-soft);
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  padding-right: 4px;
}
.topbar-brand::before {
  content: "";
  display: block;
  width: 4px; height: 22px;
  background: var(--accent);
  border-radius: 2px;
}

.topbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.topbar-divider {
  width: 1px;
  height: 22px;
  background: var(--border-soft);
  margin: 0 6px;
}

.topbar-spacer { flex: 1; }

.zoom-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-secondary);
  font-size: 12px;
}

#zoom {
  -webkit-appearance: none;
  appearance: none;
  width: 140px;
  height: 4px;
  background: var(--border-soft);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
#zoom::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg-card);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 120ms ease;
}
#zoom::-webkit-slider-thumb:hover { transform: scale(1.15); }
#zoom::-moz-range-thumb {
  width: 16px; height: 16px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg-card);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 120ms ease;
}
#zoom::-moz-range-thumb:hover { transform: scale(1.15); }

.zoom-value {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-tertiary);
  min-width: 36px;
  text-align: right;
}

/* ============ 主区三栏 ============ */

#main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

#leftbar {
  width: 200px;
  padding: 16px 12px;
  background: var(--bg-panel);
  border-right: 1px solid var(--border-soft);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

#canvas-wrap {
  flex: 1;
  overflow: auto;
  background: var(--bg-canvas);
  padding: 24px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

#canvas-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-soft);
}

#canvas-card canvas { display: block; }

#rightbar {
  width: 320px;
  padding: 20px 16px;
  background: var(--bg-panel);
  border-left: 1px solid var(--border-soft);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ============ 面板分组 ============ */

.panel-section { display: flex; flex-direction: column; gap: 6px; }

.panel-title {
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.panel-subtitle {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0 0 6px 0;
}

/* ============ 工具按钮(左栏) ============ */

.tool {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 38px;
  padding: 0 10px 0 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
  text-align: left;
  position: relative;
  transition: background-color 120ms ease, border-color 120ms ease;
  margin-bottom: 4px;
}
.tool:hover { background: var(--bg-hover); }

.tool.active {
  background: var(--bg-active);
  border-color: var(--accent);
  font-weight: 600;
}
.tool.active::before {
  content: "";
  position: absolute;
  left: -1px;
  top: 6px; bottom: 6px;
  width: 3px;
  background: var(--accent);
  border-radius: 0 2px 2px 0;
}

.tool-icon {
  display: inline-flex;
  width: 16px; height: 16px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.tool.active .tool-icon { color: var(--accent); }
.tool-icon svg { width: 100%; height: 100%; }

.tool-name { flex: 1; }

.tool-hint {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-tertiary);
}

.tool-tag {
  font-size: 10px;
  color: var(--text-tertiary);
  background: var(--bg-hover);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: var(--font-mono);
}

/* 左栏底部按钮组(撤销/重做) */
.leftbar-actions {
  display: flex;
  gap: 4px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--border-soft);
}

/* ============ 玩家列表(右栏) ============ */

#player-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

#player-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 120ms ease, background-color 120ms ease,
              border-color 120ms ease;
  cursor: grab;
  position: relative;
}

#player-list li:hover { box-shadow: var(--shadow-md); }

#player-list li.selected {
  background: var(--bg-active);
  border-color: var(--accent);
}
#player-list li.selected::before {
  content: "";
  position: absolute;
  left: -1px;
  top: 6px; bottom: 6px;
  width: 3px;
  background: var(--accent);
  border-radius: 0 2px 2px 0;
}

.drag-handle {
  color: var(--text-tertiary);
  font-size: 12px;
  letter-spacing: -2px;
  user-select: none;
  flex-shrink: 0;
}
#player-list li:hover .drag-handle { color: var(--text-secondary); }

.player-rank {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-tertiary);
  min-width: 20px;
  text-align: right;
  flex-shrink: 0;
}

.player-name-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.pname {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--text-primary);
}

.pfix { flex-shrink: 0; cursor: pointer; }

.pdel {
  width: 22px; height: 22px;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  font-size: 16px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background-color 120ms ease, color 120ms ease;
}
.pdel:hover { background: #F9E5E0; color: #B3341F; }

/* 状态徽章 */
.badge {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  white-space: nowrap;
}
.badge-unseated {
  background: transparent;
  color: var(--text-tertiary);
  border: 1px solid var(--border-soft);
}
.badge-seated {
  background: #E7F0E3;
  color: #3E5A39;
}
.badge-fixed {
  background: #FBEEC8;
  color: #6B4E0F;
}

/* ============ 排位模式(单选卡片) ============ */

.mode-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.mode-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}

.mode-card:hover { background: var(--bg-hover); }

.mode-card.selected {
  background: var(--bg-active);
  border-color: var(--accent);
  border-width: 1.5px;
}

.mode-card input[type="radio"] {
  margin: 0;
  align-self: flex-start;
}

.mode-card .mode-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.mode-card .mode-desc {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* ============ Tooltip(纯 CSS) ============ */

[data-tip] { position: relative; }

[data-tip]::after {
  content: attr(data-tip);
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  background: var(--text-primary);
  color: var(--bg-card);
  font-size: 12px;
  padding: 5px 9px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 150ms ease, transform 150ms ease;
  z-index: 100;
}

[data-tip]:hover::after {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* 左栏工具的 tooltip 改到右侧(避免被裁切) */
#leftbar [data-tip]::after {
  top: 50%;
  left: calc(100% + 8px);
  transform: translateY(-50%) translateX(-4px);
}
#leftbar [data-tip]:hover::after {
  transform: translateY(-50%) translateX(0);
}

/* ============ 滚动条 ============ */

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 5px;
  border: 2px solid var(--bg-panel);
}
::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
```

- [ ] **Step 2: 视觉校对(静态检查)**

打开 `style.css`,确认:
- 没有 `//` 单行注释(CSS 只支持 `/* */`)
- 所有 `var(--xxx)` 都在 `:root` 里定义过
- 没有未闭合的 `{`

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat(ui): add Claude-style design tokens and component styles"
```

---

