# 删除能力 + 收尾 计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement task-by-task.

**Goal:** 为所有实体补上删除能力（旗帜、障碍、玩家、熊坑），提供右键统一删除菜单 + 快捷删除 + 全局重置按钮。

**Architecture:** Editor 增加 `contextmenu` 右键菜单：根据右键所在格命中实体类型（熊坑/旗帜/障碍/玩家），弹出菜单提供「删除此处 X」。UI 顶栏加「重置」按钮。障碍已有单击擦除保留；旗帜双击锁定保留；玩家列表 × 删除保留。右键是统一入口。

**Tech Stack:** 原生 JS、Canvas 2D、`node:test`。

## Global Constraints

- 右键菜单（contextmenu）命中实体优先级：玩家 > 旗帜 > 障碍 > 熊坑（按格子精确匹配：玩家 2×2、熊坑 3×3 命中即算）。
- 右键菜单项动态生成：只显示该格实际存在的可删实体。
- 删除操作进 undo 栈（store.push() 先行）。
- 删除玩家时同时清掉其 placement 和 fixed 状态？——删除玩家即从 players 数组移除并 delete placement[id]（与列表 × 一致）。
- 熊坑不可删除（全局唯一、必需）——右键熊坑只提示「熊坑不可删除」，或菜单不出现删除项。**决定：熊坑不可删，右键熊坑无菜单。**
- 重置按钮：清空 banners（保留 1 个默认）、obstacles、players、placement，熊坑归位 (0,0)，二次确认。
- 现有 21 个单测须仍全绿。

---

### Task D1: Editor — 右键删除菜单

**Files:**
- Modify: `D:\PythonProject\map\js\editor.js`
- Modify: `D:\PythonProject\map\index.html`

**Interfaces:**
- Consumes: `Geometry`（命中检测可直接用 state 遍历）
- Produces: Editor 绑定 canvas 的 `contextmenu` 事件，阻止默认菜单，在鼠标位置弹出一个绝对定位的 `<div id="ctx-menu">`，按命中实体生成菜单项；点击菜单项执行删除并 requestRender。

- [ ] **Step 1: index.html 加菜单容器**

在 `<body>` 内、`<input id="file-input">` 之前加：
```html
<div id="ctx-menu" style="position:absolute;display:none;background:#fff;border:1px solid #d1d5db;box-shadow:2px 2px 6px rgba(0,0,0,.2);z-index:1000;font-size:13px;min-width:120px"></div>
```

- [ ] **Step 2: editor.js 加 contextmenu 处理**

在 `Editor.init` 内，mouseup/mouseleave 之后追加：
```js
    const menu = document.getElementById('ctx-menu');
    function hideMenu() { menu.style.display = 'none'; menu.innerHTML = ''; }

    function entityAt(state, r, c) {
      // returns array of {kind, ref} for all entities covering (r,c)
      const hits = [];
      // player 2x2
      for (const p of state.players) {
        const pc = state.placement[p.id];
        if (pc && r >= pc[0] && r <= pc[0]+1 && c >= pc[1] && c <= pc[1]+1) hits.push({ kind: 'player', ref: p });
      }
      // banner 1x1
      const bn = (state.banners || []).find(b => b.row === r && b.col === c);
      if (bn) hits.push({ kind: 'banner', ref: bn });
      // obstacle 1x1
      for (const o of state.obstacles) {
        if (o.cells.some(cc => cc[0] === r && cc[1] === c)) { hits.push({ kind: 'obstacle', ref: { group: o, r, c } }); break; }
      }
      // bear 3x3 — not deletable, skip
      return hits;
    }

    function deleteEntity(state, hit) {
      if (hit.kind === 'player') {
        const idx = state.players.indexOf(hit.ref);
        if (idx >= 0) state.players.splice(idx, 1);
        delete state.placement[hit.ref.id];
      } else if (hit.kind === 'banner') {
        const idx = state.banners.indexOf(hit.ref);
        if (idx >= 0) state.banners.splice(idx, 1);
      } else if (hit.kind === 'obstacle') {
        const o = hit.ref.group;
        const idx = o.cells.findIndex(cc => cc[0] === hit.ref.r && cc[1] === hit.ref.c);
        if (idx >= 0) o.cells.splice(idx, 1);
      }
    }

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const cellSize = getCellSize();
      const view = getView();
      const [r, c] = cellFromEvent(e, canvas, view, cellSize);
      const state = store.get();
      const hits = entityAt(state, r, c);
      if (hits.length === 0) { hideMenu(); return; }
      const labels = { player: '玩家', banner: '旗帜', obstacle: '障碍' };
      menu.innerHTML = '';
      hits.forEach(hit => {
        const item = document.createElement('div');
        item.textContent = '删除' + labels[hit.kind] + (hit.kind === 'player' ? '（' + (hit.ref.name || '') + '）' : '');
        item.style.cssText = 'padding:6px 12px;cursor:pointer';
        item.addEventListener('mouseenter', () => item.style.background = '#e5e7eb');
        item.addEventListener('mouseleave', () => item.style.background = '#fff');
        item.addEventListener('click', () => {
          store.push();
          deleteEntity(store.get(), hit);
          hideMenu();
          requestRender();
        });
        menu.appendChild(item);
      });
      menu.style.left = e.pageX + 'px';
      menu.style.top = e.pageY + 'px';
      menu.style.display = 'block';
    });
    document.addEventListener('click', hideMenu);
    document.addEventListener('mousedown', (e) => { if (e.target !== menu && !menu.contains(e.target)) hideMenu(); });
```

- [ ] **Step 3: node --check + 全套测试**

Run: `node --check js/editor.js && node --test`
Expected: 无语法错误，21/21 PASS。

- [ ] **Step 4: 提交**

```bash
git add js/editor.js index.html
git commit -m "feat(editor): right-click context menu to delete any entity"
```

---

### Task D2: UI — 重置按钮

**Files:**
- Modify: `D:\PythonProject\map\index.html`
- Modify: `D:\PythonProject\map\js\ui.js`

**Interfaces:**
- Produces: 顶栏「重置」按钮，二次确认后恢复初始状态。

- [ ] **Step 1: index.html 顶栏加按钮**

在顶栏 `<button id="btn-changes">变动图</button>` 之后加：
```html
    <button id="btn-reset">重置</button>
```

- [ ] **Step 2: ui.js 绑定**

在 `$('btn-changes')` 绑定之后追加：
```js
$('btn-reset') && $('btn-reset').addEventListener('click', () => {
  if (!confirm('重置将清空所有旗帜/障碍/玩家/排位，熊坑归位。确认？')) return;
  store.push();
  const state = store.get();
  state.bear = { row: 0, col: 0 };
  state.banners = [{ id: 'b1', row: 3, col: 0, fixed: false }];
  state.obstacles = [];
  state.players = [];
  state.placement = {};
  lastOldPlacement = {};
  render();
});
```

- [ ] **Step 3: node --check + 全套测试**

Run: `node --check js/ui.js && node --test`
Expected: 无语法错误，21/21 PASS。

- [ ] **Step 4: 提交**

```bash
git add index.html js/ui.js
git commit -m "feat(ui): reset button to restore initial state"
```

---

### Task D3: 浏览器验证（含删除能力）

**Files:** 无（验证）

- [ ] **Step 1** 浏览器打开，验证：
1. 右键某旗帜 → 菜单「删除旗帜」→ 点击后旗帜消失，可撤销。
2. 右键某障碍格 → 「删除障碍」→ 该格清除。
3. 右键某已落座玩家 → 「删除玩家（名字）」→ 玩家从地图和列表消失。
4. 右键空格 → 无菜单。右键熊坑 → 无菜单（不可删）。
5. 「重置」按钮 → 二次确认 → 全清，熊坑归 (0,0)，1 默认旗帜。
6. 障碍工具单击已有障碍格仍可擦除（保留）。
7. 多旗帜创建、严格/最小排位、导入导出、图片导出仍正常。

---

## Self-Review

**1. Spec 覆盖：**
- 删除旗帜 → D1 右键 ✓
- 删除障碍（增强）→ D1 右键 + 保留单击擦除 ✓
- 全局重置 → D2 ✓
- 右键删任意实体 → D1 ✓

**2. 占位：** 无 TBD。D3 是验证清单。

**3. 一致性：** entityAt/deleteEntity 命名一致；菜单 id `ctx-menu` 在 index.html 与 editor.js 一致；reset 用 store.push() 进 undo。
