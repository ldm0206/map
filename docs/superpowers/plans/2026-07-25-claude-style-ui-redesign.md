# Claude 风格 UI 重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把熊坑排座的 UI 从「系统默认灰」换成 Claude.ai 主站那种米白 + 赤陶 + 衬线标题的视觉语言,并重组三栏布局。

**Architecture:** 新增 `style.css`(设计令牌 + 组件样式),重写 `index.html`(DOM 重组 + `<link>` 取代内联 `<style>`),微调 `js/renderer.js`(COLORS 常量 + 玩家描边色),微调 `js/ui.js`(selected 改 class、新增状态徽章 span)。其余 JS 不动。

**Tech Stack:** 原生 HTML / CSS / ES 模块 JS。无构建步骤、无框架、无字体 CDN。

**Spec:** `docs/superpowers/specs/2026-07-25-claude-style-ui-redesign.md`

## Global Constraints

- **纯静态无依赖**:不引入任何构建工具、框架、字体 CDN。图标用内联 SVG。
- **仅亮色**:不做深色模式,不跟随系统。
- **不动交互行为**:拖放、Shift+点击、点选玩家、撤销/重做、求解器调用、固定/删除玩家的逻辑全部不变。
- **`npm test` 21 个测试必须通过**。本计划没有可单测的新逻辑,所有验证靠 `npm test` + 浏览器手测。
- **所有元素 id 保持不变**(`btn-load` / `btn-save` / `btn-final` / `btn-changes` / `btn-reset` / `btn-undo` / `btn-redo` / `btn-import-names` / `btn-solve` / `btn-clear` / `zoom` / `file-input` / `canvas` / `player-list`)。
- **`.tool` class 与 `data-tool` 属性保留**(`bear` / `banner` / `mountain` / `lake` / `mine` / `player`)。
- **`input[name=mode]` 的 value `strict` / `minimal` 保留**。
- **`.pname` / `.pfix` / `.pdel` class 保留**(JS 事件委托用)。
- **中文 UI 文案不变**(熊坑/旗帜/山/湖/矿/手动放玩家/撤销/重做/加载项目/导出项目/最终图/变动图/重置/批量导入名单/一键排位/清空排位/玩家优先级)。

---

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

### Task 2: 重写 `index.html` — DOM 重组 + 链接 style.css

**Files:**
- Modify: `index.html`(整体重写)

**Interfaces:**
- Consumes: Task 1 的 `style.css`。
- Produces: 给 `js/ui.js` 用的 DOM 契约。**必须保留**这些 id 与 class,否则 JS 会找不到节点:
  - id:`btn-load` `btn-save` `btn-final` `btn-changes` `btn-reset` `btn-undo` `btn-redo` `btn-import-names` `btn-solve` `btn-clear` `zoom` `file-input` `canvas` `player-list`
  - class:`.tool` + `data-tool="bear|banner|mountain|lake|mine|player"`
  - `input[name=mode]` value `strict` / `minimal`

- [ ] **Step 1: 重写 `index.html`**

完整替换 `D:\PythonProject\map\index.html` 为:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>熊坑排座</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header id="topbar">
    <div class="topbar-brand">熊坑排座</div>
    <div class="topbar-divider"></div>

    <div class="topbar-group">
      <button id="btn-load" class="btn btn-ghost" data-tip="加载项目 JSON">加载项目</button>
      <button id="btn-save" class="btn btn-ghost" data-tip="导出项目 JSON">导出项目</button>
    </div>

    <div class="topbar-divider"></div>

    <div class="topbar-group">
      <button id="btn-final" class="btn btn-ghost" data-tip="导出最终排位图 PNG">最终图</button>
      <button id="btn-changes" class="btn btn-ghost" data-tip="导出座位变动图 PNG">变动图</button>
    </div>

    <div class="topbar-spacer"></div>

    <div class="zoom-wrap">
      <span>缩放</span>
      <input id="zoom" type="range" min="20" max="80" value="40">
      <span class="zoom-value" id="zoom-value">40px</span>
    </div>

    <div class="topbar-divider"></div>

    <button id="btn-reset" class="btn btn-danger" data-tip="清空所有数据,谨慎操作">重置</button>
  </header>

  <div id="main">
    <aside id="leftbar">
      <div class="panel-section">
        <h2 class="panel-title">建造</h2>
        <button class="tool active" data-tool="bear" data-tip="拖动放置 3×3 熊坑">
          <span class="tool-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2.5" fill="currentColor"/></svg>
          </span>
          <span class="tool-name">熊坑</span>
        </button>
        <button class="tool" data-tool="banner" data-tip="点空格新建,点已有删除,Shift+点锁定">
          <span class="tool-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2v12M4 3h8l-2 3 2 3H4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
          </span>
          <span class="tool-name">旗帜</span>
          <span class="tool-tag">7×7</span>
        </button>
      </div>

      <div class="panel-section">
        <h2 class="panel-title">障碍</h2>
        <button class="tool" data-tool="mountain" data-tip="点格子切换山体">
          <span class="tool-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 13 L6 4 L9 9 L11 6 L14 13 Z" fill="currentColor"/></svg>
          </span>
          <span class="tool-name">山</span>
        </button>
        <button class="tool" data-tool="lake" data-tip="点格子切换湖泊">
          <span class="tool-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2 C8 2 3 8 3 11 a5 5 0 0 0 10 0 C13 8 8 2 8 2 Z" fill="currentColor"/></svg>
          </span>
          <span class="tool-name">湖</span>
        </button>
        <button class="tool" data-tool="mine" data-tip="点格子切换矿点">
          <span class="tool-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 5 L10 8 L8 11 L6 8 Z" fill="currentColor"/></svg>
          </span>
          <span class="tool-name">矿</span>
        </button>
      </div>

      <div class="panel-section">
        <h2 class="panel-title">玩家</h2>
        <button class="tool" data-tool="player" data-tip="先在右侧点选玩家,再点地图放置">
          <span class="tool-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="5" r="2.5" fill="currentColor"/><path d="M3 14 c0-3 2.5-5 5-5 s5 2 5 5 Z" fill="currentColor"/></svg>
          </span>
          <span class="tool-name">手动放玩家</span>
        </button>
      </div>

      <div class="leftbar-actions">
        <button id="btn-undo" class="icon-btn" data-tip="撤销" aria-label="撤销">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M6 4 L2 8 L6 12 V9 h5 a3 3 0 0 1 3 3 v1 h-1.5 v-1 a1.5 1.5 0 0 0 -1.5 -1.5 H6 Z" fill="currentColor"/></svg>
        </button>
        <button id="btn-redo" class="icon-btn" data-tip="重做" aria-label="重做">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M10 4 L14 8 L10 12 V9 h-5 a3 3 0 0 0 -3 3 v1 h1.5 v-1 a1.5 1.5 0 0 1 1.5 -1.5 H10 Z" fill="currentColor"/></svg>
        </button>
      </div>
    </aside>

    <main id="canvas-wrap">
      <div id="canvas-card">
        <canvas id="canvas"></canvas>
      </div>
    </main>

    <aside id="rightbar">
      <div class="panel-section">
        <h2 class="panel-title">玩家优先级</h2>
        <p class="panel-subtitle">顶部最高 · 拖拽调整顺序 · 点选后可在地图上手动放置</p>
        <ul id="player-list"></ul>
      </div>

      <button id="btn-import-names" class="btn btn-secondary btn-block">批量导入名单</button>

      <hr>

      <div class="panel-section">
        <h2 class="panel-title">排位模式</h2>
        <div class="mode-cards">
          <label class="mode-card selected" data-mode-card="strict">
            <input type="radio" name="mode" value="strict" checked>
            <span class="mode-name">严格</span>
            <span class="mode-desc">贪心算法</span>
          </label>
          <label class="mode-card" data-mode-card="minimal">
            <input type="radio" name="mode" value="minimal">
            <span class="mode-name">最小修改</span>
            <span class="mode-desc">匈牙利算法</span>
          </label>
        </div>
      </div>

      <button id="btn-solve" class="btn btn-primary btn-block">一键排位</button>
      <button id="btn-clear" class="btn btn-ghost btn-block">清空排位</button>
    </aside>
  </div>

  <input id="file-input" type="file" accept=".json" style="display:none">
  <script type="module" src="js/ui.js"></script>
</body>
</html>
```

注意:第一个 `.tool`(熊坑)上加了 `active` class,与 `ui.js` 里的 `let tool = 'bear'` 默认值一致。

- [ ] **Step 2: 浏览器手动验证(冒烟)**

```bash
cd D:\PythonProject\map
python -m http.server 8000
```

打开 `http://localhost:8000`,确认:
- 顶栏 56px、奶油色、左侧"熊坑排座"衬线标题、右侧缩放滑杆 + "40px" + 红色"重置"
- 左栏 200px,三组分组(建造/障碍/玩家),熊坑默认激活(浅奶油底 + 赤陶竖条)
- 画布区米奶油背景,Canvas 外面有白色圆角卡片
- 右栏 320px,"玩家优先级"衬线标题
- 撤销/重做成 icon 按钮,在左栏最底部

发现渲染问题就停下排查,不要继续。

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(ui): restructure index.html with Claude-style layout"
```

---

### Task 3: 更新 `js/renderer.js` — 替换 COLORS + 玩家描边色

**Files:**
- Modify: `js/renderer.js:3-15`(COLORS 常量)
- Modify: `js/renderer.js:93`(玩家描边色硬编码)

**Interfaces:**
- Consumes: 无(独立任务,但效果要与 Task 1 的米白底协调)。
- Produces: 不变(导出对象签名不变,只改色值)。

- [ ] **Step 1: 替换 COLORS 常量**

打开 `js/renderer.js`,把第 3–15 行的 `COLORS` 常量替换为:

```javascript
const COLORS = {
  grid: '#D6CDBB',
  bear: '#8A3B2A',
  banner: '#D4A24E',
  coverage: 'rgba(212, 162, 78, 0.10)',
  coverageBorder: '#C08A35',
  mountain: '#8B8075',
  lake: '#7A9AB5',
  mine: '#9C6F3A',
  player: '#C15A3C',
  playerBorder: '#7A3524',
  fixed: '#D4A24E',
  text: '#1F1A14'
};
```

(新增 `playerBorder` 这个 key,取代原本硬编码的 `#1e3a8a`。)

- [ ] **Step 2: 改玩家描边色**

把第 93 行:

```javascript
ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 1;
```

改为:

```javascript
ctx.strokeStyle = COLORS.playerBorder; ctx.lineWidth = 1;
```

- [ ] **Step 3: 跑测试**

```bash
cd D:\PythonProject\map
npm test
```

预期:21 个测试全部通过。renderer 本身没有单测,但 `geometry.js` `store.js` 等模块的测试不应受影响。

- [ ] **Step 4: 浏览器手动验证**

刷新 `http://localhost:8000`,确认:
- 网格线变米沙色(不再是冷灰)
- 旗帜变蜂蜜黄(不再是亮黄),覆盖区也变米金
- 玩家落座后 marker 变赤陶,描边深棕
- 山 / 湖 / 矿颜色都比之前柔和

- [ ] **Step 5: Commit**

```bash
git add js/renderer.js
git commit -m "feat(ui): warm-tone canvas palette matching Claude aesthetic"
```

---

### Task 4: 微调 `js/ui.js` — selected 改 class + 状态徽章

**Files:**
- Modify: `js/ui.js:29-42`(renderPlayerList 内层 DOM 生成)
- Modify: `js/ui.js:113-115`(模式 radio 事件,加 selected class 切换)
- Modify: `js/ui.js:116`(zoom 事件,更新数值显示)

**Interfaces:**
- Consumes: Task 1 的 `.badge-*` `.selected` `.mode-card.selected` `.zoom-value` 样式;Task 2 的 `#zoom-value` `.mode-card` DOM。
- Produces: 不变(Store / Renderer / Editor 接口不变)。

**三处改动,每改动一处就浏览器验证一处。**

- [ ] **Step 1: 改玩家列表项 DOM(替换 `li.innerHTML` 那一段)**

打开 `js/ui.js`,把第 35–42 行:

```javascript
    const li = document.createElement('li');
    li.draggable = true;
    li.dataset.id = p.id;
    if (p.id === selectedPlayerId) li.style.background = '#bfdbfe';
    li.innerHTML = `<span>${i + 1}.</span><input value="${p.name}" data-id="${p.id}" class="pname" style="flex:1">
      <input type="checkbox" data-id="${p.id}" class="pfix" ${p.fixed ? 'checked' : ''}>
      <button data-id="${p.id}" class="pdel">×</button>`;
    ul.appendChild(li);
```

替换为:

```javascript
    const li = document.createElement('li');
    li.draggable = true;
    li.dataset.id = p.id;
    if (p.id === selectedPlayerId) li.classList.add('selected');
    const seated = Boolean(state.placement[p.id]);
    const badgeClass = p.fixed ? 'badge-fixed' : (seated ? 'badge-seated' : 'badge-unseated');
    const badgeText  = p.fixed ? '固定'     : (seated ? '已落座'     : '未落座');
    li.innerHTML = `<span class="drag-handle" aria-hidden="true">⋮⋮</span>
      <span class="player-rank">${i + 1}</span>
      <span class="player-name-wrap"><input value="${p.name}" data-id="${p.id}" class="pname"></span>
      <span class="badge ${badgeClass}">${badgeText}</span>
      <input type="checkbox" data-id="${p.id}" class="pfix" title="固定" ${p.fixed ? 'checked' : ''}>
      <button data-id="${p.id}" class="pdel" title="删除玩家">×</button>`;
    ul.appendChild(li);
```

注意:`state` 在循环外的 `renderPlayerList` 顶部已声明(`const state = store.get();`),这里直接复用。

- [ ] **Step 2: 浏览器手动验证玩家列表**

刷新页面,批量导入几个名字,确认:
- 每行有拖拽把手 `⋮⋮`、名次(等宽)、名字、徽章、"固定"复选框、删除按钮
- 未落座徽章灰描边、已落座浅绿、固定蜂蜜色
- 点选某行 → 该行左出现赤陶竖条 + 浅奶油底(不再是突兀的蓝色)
- 拖拽换序仍正常,事件仍然绑定成功(`input.pname` 改名、`.pfix` 固定、`.pdel` 删除)

发现任何事件失效就停下排查。

- [ ] **Step 3: 模式卡片选中态切换**

把 `js/ui.js` 第 113–115 行:

```javascript
document.querySelectorAll('input[name=mode]').forEach(r => r.addEventListener('change', (e) => {
  store.get().mode = e.target.value;
}));
```

替换为:

```javascript
document.querySelectorAll('input[name=mode]').forEach(r => r.addEventListener('change', (e) => {
  store.get().mode = e.target.value;
  document.querySelectorAll('.mode-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.modeCard === e.target.value);
  });
}));
```

- [ ] **Step 4: 浏览器手动验证模式切换**

刷新页面,点"最小修改"卡片:
- 卡片从白卡变浅奶油底 + 赤陶描边 1.5px
- "严格"卡片回到白卡
- `store.get().mode` 同步变化(在 console 里看)

- [ ] **Step 5: 缩放滑杆数值实时显示**

把 `js/ui.js` 第 116 行:

```javascript
$('zoom').addEventListener('input', (e) => { cellSize = +e.target.value; render(); });
```

替换为:

```javascript
$('zoom').addEventListener('input', (e) => {
  cellSize = +e.target.value;
  const zv = $('zoom-value');
  if (zv) zv.textContent = e.target.value + 'px';
  render();
});
```

- [ ] **Step 6: 浏览器手动验证缩放**

拖动滑杆,右侧数字从 "40px" 跟着变化。

- [ ] **Step 7: 跑测试**

```bash
npm test
```

预期:21 个测试通过。

- [ ] **Step 8: Commit**

```bash
git add js/ui.js
git commit -m "feat(ui): class-based selection, seat badges, mode-card highlight, zoom readout"
```

---

### Task 5: 更新 README + 整体回归验证

**Files:**
- Modify: `README.md`(项目结构 + 视觉描述)

**Interfaces:**
- Consumes: 前 4 个任务的最终状态。
- Produces: 无。

- [ ] **Step 1: 更新 README**

打开 `README.md`,把「项目结构」一段(第 42-53 行)改为:

````
```
index.html        页面骨架(三栏布局)
style.css         Claude 风格设计令牌 + 组件样式
js/geometry.js    候选格、距离、冲突检测、地图扩张(单测)
js/strictSolver.js   严格模式贪心(单测)
js/minimalSolver.js  最小修改匈牙利算法(单测)
js/store.js        状态管理 + 撤销/重做(单测)
js/renderer.js     Canvas 渲染
js/editor.js       工具交互
js/exporter.js     JSON + 图片导入导出
js/ui.js           入口、按钮绑定
tests/             node:test 单测(21 个)
```
````

- [ ] **Step 2: 跑测试**

```bash
npm test
```

预期:21 个测试全部通过。

- [ ] **Step 3: 全功能浏览器回归**

刷新 `http://localhost:8000`,按 README 的「交互速查」表逐项验证:

| 操作 | 验证点 |
|---|---|
| 熊坑工具 + 拖动 | 熊坑跟着鼠标 3×3 拖动放置 |
| 旗帜工具点空格 | 新建旗帜 + 出现米金覆盖区 |
| 旗帜工具点已有旗帜 | 删除该旗帜 |
| 旗帜工具 Shift+点旗帜 | 锁定/解锁(旗帜边框变化) |
| 山/湖/矿工具点格子 | 切换障碍 |
| 列表点选玩家 → 玩家工具点地图 | 该玩家被放到点中的格子 |
| 玩家工具点已落座玩家 | 取消落座 |
| 撤销 / 重做 | 状态正确回退/前进 |
| 加载项目 / 导出项目 | JSON 文件正常 |
| 批量导入名单 | prompt 弹窗正常,名单入库 |
| 严格 / 最小修改 + 一键排位 | 与改动前结果一致 |
| 清空排位 | 只清未固定的落座 |
| 最终图 / 变动图 PNG | 下载成功,色板为新色 |
| 重置 | confirm 弹窗,确认后状态归零 |

任何一项行为变化都算回归,回滚该 Task 排查。

- [ ] **Step 4: 键盘可达性检查**

Tab 键依次扫过:加载项目 → 导出项目 → 最终图 → 变动图 → 重置 → 缩放滑杆 → 工具按钮 → 撤销/重做 → 玩家列表项 → 批量导入 → 模式卡片 → 一键排位 → 清空排位。
每个焦点位置都有 2px 赤陶 outline。

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: update README for style.css"
```

---

## 自检结果

**1. Spec 覆盖**:
- 设计令牌 → Task 1 ✓
- 顶栏 / 左栏 / 右栏 / 画布卡布局 → Task 2 ✓
- 按钮 4 变体 / 工具按钮 / 玩家列表 / 单选卡片 / tooltip / 缩放滑杆 → Task 1(样式)+ Task 2(DOM)+ Task 4(交互细节)✓
- 画布调色 → Task 3 ✓
- selected 改 class / 状态徽章 / 模式卡片切换 / 缩放数值 → Task 4 ✓
- 测试通过 + 全功能回归 → Task 3 / 4 / 5 ✓
- README 更新 → Task 5 ✓

**2. 占位符扫描**:无 TBD / TODO / "略"。所有 CSS 与 HTML 完整给出,JS 改动以 before/after 形式给出。

**3. 类型一致性**:
- Task 1 声明的 class 名(`.tool-icon` `.tool-name` `.tool-tag` `.badge-*` `.mode-card` `.panel-title` 等)与 Task 2 的 HTML 全部对得上
- Task 2 的 `data-mode-card="strict|minimal"` 与 Task 4 的 `c.dataset.modeCard === e.target.value` 对得上
- Task 2 的 `id="zoom-value"` 与 Task 4 的 `$('zoom-value')` 对得上
- Task 3 新增的 `COLORS.playerBorder` 在第 93 行被使用,与 Task 1 的 `--accent` 同色调
