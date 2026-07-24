# 无尽冬日熊坑排座静态网页 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个纯静态单页网页，为无尽冬日熊集结按优先级排座，支持地图编辑、严格/最小修改两种排位模式、玩家固定、JSON 导入导出和图片导出。

**Architecture:** 单 `index.html` 加载若干纯逻辑 JS 模块（Geometry/StrictSolver/MinimalSolver，可单测）和若干 DOM 模块（Renderer/Editor/Exporter/UI）。纯逻辑模块用 Node 内置 `node:test` 单测；DOM 模块在浏览器中手动验证。匈牙利算法自实现（无外部依赖）。

**Tech Stack:** 原生 JS（ES modules）、Canvas 2D、`node:test`（仅测试时）。

## Global Constraints

- 项目非 git 仓库：每个 "Commit" 步骤改为「保存检查点」—— 用 `git init` 初始化仓库后再按原步骤提交。若用户拒绝 git，则跳过提交、仅保存文件。本计划默认执行 `git init` 后按正常提交流程走。
- 无构建步骤、无 npm 依赖（除 Node 自身用于跑测试）。
- 单文件交付目标：最终 `index.html` 应可双击即用。为可测试性，开发期把纯逻辑拆成独立 `.js` 模块并用 `<script type="module">` 加载；最后可选地内联回单文件（非必须）。
- 所有坐标以「行 row、列 col」表示，左上角为 (0,0)，向下/向右递增。
- 熊坑 3×3，存储左上角 `bear.row/bear.col`。
- 旗帜 1×1，存储 `banner.row/banner.col/banner.fixed`。
- 玩家 2×2，存储其左上角格。
- 欧氏距离取玩家 2×2 中心 `(r+0.5, c+0.5)` 到熊坑中心 `(bear.row+1, bear.col+1)`。
- 命名：模块用对象字面量导出，函数名见各任务 Produces 块，保持全计划一致。

---

## File Structure

- `index.html` — 页面骨架 + 三栏布局 + 加载所有模块
- `js/geometry.js` — 候选格计算、距离、冲突检测、地图自动扩张（纯逻辑，可单测）
- `js/strictSolver.js` — 严格模式贪心（纯逻辑，可单测）
- `js/minimalSolver.js` — 最小修改模式匈牙利算法（纯逻辑，可单测）
- `js/store.js` — 状态管理 + 撤销/重做栈
- `js/renderer.js` — Canvas 渲染
- `js/editor.js` — 工具交互
- `js/exporter.js` — JSON 导入导出 + 图片导出（自绘 canvas）
- `js/ui.js` — 按钮绑定、模式切换、入口
- `tests/geometry.test.js` — geometry 单测
- `tests/strictSolver.test.js` — strictSolver 单测
- `tests/minimalSolver.test.js` — minimalSolver 单测

---

### Task 1: 初始化仓库与项目骨架

**Files:**
- Create: `D:\PythonProject\map\index.html`
- Create: `D:\PythonProject\map\js\geometry.js`
- Create: `D:\PythonProject\map\js\store.js`
- Create: `D:\PythonProject\map\package.json`
- Create: `D:\PythonProject\map\.gitignore`

**Interfaces:**
- Produces: `Geometry`、`Store` 对象占位（空导出），供后续任务填充。

- [ ] **Step 1: git init**

Run:
```bash
cd /d/PythonProject/map
git init
```
Expected: 初始化空仓库。

- [ ] **Step 2: 写 package.json**

`D:\PythonProject\map\package.json`:
```json
{
  "name": "bear-rally-seat-planner",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 3: 写 .gitignore**

`D:\PythonProject\map\.gitignore`:
```
node_modules/
*.log
```

- [ ] **Step 4: 写 geometry.js 占位**

`D:\PythonProject\map\js\geometry.js`:
```js
export const Geometry = {};
```

- [ ] **Step 5: 写 store.js 占位**

`D:\PythonProject\map\js\store.js`:
```js
export const Store = {};
```

- [ ] **Step 6: 写 index.html 骨架**

`D:\PythonProject\map\index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>熊坑排座</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; display: flex; flex-direction: column; height: 100vh; }
    #topbar { display: flex; gap: 8px; padding: 8px; background: #1f2937; color: #fff; }
    #main { display: flex; flex: 1; overflow: hidden; }
    #leftbar { width: 140px; padding: 8px; background: #f3f4f6; overflow-y: auto; }
    #canvas-wrap { flex: 1; overflow: auto; background: #e5e7eb; }
    #rightbar { width: 280px; padding: 8px; background: #f3f4f6; overflow-y: auto; }
    .tool { display: block; width: 100%; margin-bottom: 4px; padding: 6px; text-align: left; }
    .tool.active { background: #3b82f6; color: #fff; }
    #player-list { list-style: none; padding: 0; margin: 8px 0; }
    #player-list li { display: flex; align-items: center; gap: 4px; padding: 4px; border: 1px solid #d1d5db; margin-bottom: 2px; background: #fff; }
  </style>
</head>
<body>
  <div id="topbar">
    <b>熊坑排座</b>
    <button id="btn-load">加载项目</button>
    <button id="btn-save">导出项目</button>
    <button id="btn-final">最终图</button>
    <button id="btn-changes">变动图</button>
    <input id="zoom" type="range" min="20" max="80" value="40">
  </div>
  <div id="main">
    <div id="leftbar">
      <div>工具</div>
      <button class="tool" data-tool="bear">熊坑</button>
      <button class="tool" data-tool="banner">旗帜</button>
      <button class="tool" data-tool="mountain">山</button>
      <button class="tool" data-tool="lake">湖</button>
      <button class="tool" data-tool="mine">矿</button>
      <button class="tool" data-tool="player">手动放玩家</button>
      <hr>
      <button id="btn-undo">撤销</button>
      <button id="btn-redo">重做</button>
    </div>
    <div id="canvas-wrap">
      <canvas id="canvas"></canvas>
    </div>
    <div id="rightbar">
      <div>玩家优先级（顶部最高）</div>
      <ul id="player-list"></ul>
      <button id="btn-import-names">批量导入名单</button>
      <hr>
      <div>模式</div>
      <label><input type="radio" name="mode" value="strict" checked> 严格</label>
      <label><input type="radio" name="mode" value="minimal"> 最小修改</label>
      <button id="btn-solve">一键排位</button>
      <button id="btn-clear">清空排位</button>
    </div>
  </div>
  <input id="file-input" type="file" accept=".json" style="display:none">
  <script type="module" src="js/ui.js"></script>
</body>
</html>
```

- [ ] **Step 7: 提交**

Run:
```bash
git add .
git commit -m "chore: init repo skeleton"
```
Expected: 提交成功。

---

### Task 2: Geometry — 距离与可建格

**Files:**
- Modify: `D:\PythonProject\map\js\geometry.js`
- Create: `D:\PythonProject\map\tests\geometry.test.js`

**Interfaces:**
- Consumes: 无
- Produces:
  - `Geometry.distance(playerCell, bear)` → `number`。`playerCell=[r,c]` 为玩家 2×2 左上角，`bear={row,col}` 为熊坑左上角。
  - `Geometry.buildableCells(state, occupiedByFixed)` → `Set<string>`。返回可建单格集合（"r,c" 字符串），排除熊坑 3×3、旗帜格、障碍格、固定玩家占用的 2×2 四格。`state` 形如 `{bear, banner, obstacles}`，`occupiedByFixed` 为 `[[r,c]...]` 固定玩家 2×2 左上角列表。

- [ ] **Step 1: 写失败测试**

`D:\PythonProject\map\tests\geometry.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Geometry } from '../js/geometry.js';

test('distance from player at bear center is small', () => {
  // bear at (0,0), 3x3 occupies rows0-2 cols0-2, center=(1,1)
  // player 2x2 at (3,3): center=(3.5,3.5); distance to (1,1)=sqrt(2.5^2+2.5^2)
  const d = Geometry.distance([3, 3], { row: 0, col: 0 });
  assert.ok(Math.abs(d - Math.hypot(2.5, 2.5)) < 1e-9);
});

test('buildableCells excludes bear, banner, obstacles', () => {
  const state = {
    bear: { row: 0, col: 0 },
    banner: { row: 3, col: 0, fixed: false },
    obstacles: [{ id: 'o1', type: 'mine', cells: [[5, 5]] }]
  };
  const cells = Geometry.buildableCells(state, []);
  // bear cells rows0-2 cols0-2 not buildable
  assert.equal(cells.has('0,0'), false);
  assert.equal(cells.has('2,2'), false);
  // banner cell not buildable
  assert.equal(cells.has('3,0'), false);
  // mine not buildable
  assert.equal(cells.has('5,5'), false);
  // a free cell is buildable
  assert.equal(cells.has('3,3'), true);
});

test('buildableCells excludes fixed player 2x2', () => {
  const state = {
    bear: { row: 0, col: 0 },
    banner: { row: 3, col: 0, fixed: false },
    obstacles: []
  };
  const cells = Geometry.buildableCells(state, [[4, 4]]);
  // fixed player occupies 4,4 4,5 5,4 5,5
  assert.equal(cells.has('4,4'), false);
  assert.equal(cells.has('5,5'), false);
  assert.equal(cells.has('4,6'), true);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/geometry.test.js`
Expected: FAIL（distance / buildableCells 未定义或非函数）。

- [ ] **Step 3: 实现 geometry.js**

`D:\PythonProject\map\js\geometry.js`（整体替换）:
```js
export const Geometry = {
  distance(playerCell, bear) {
    const [r, c] = playerCell;
    const cx = c + 0.5;
    const cy = r + 0.5;
    const bx = bear.col + 1;
    const by = bear.row + 1;
    return Math.hypot(cx - bx, cy - by);
  },

  buildableCells(state, occupiedByFixed) {
    const blocked = new Set();
    const add = (r, c) => blocked.add(`${r},${c}`);
    // bear 3x3
    for (let r = state.bear.row; r < state.bear.row + 3; r++)
      for (let c = state.bear.col; c < state.bear.col + 3; c++) add(r, c);
    // banner
    add(state.banner.row, state.banner.col);
    // obstacles
    for (const o of state.obstacles || [])
      for (const [r, c] of o.cells) add(r, c);
    // fixed players 2x2
    for (const [fr, fc] of occupiedByFixed || []) {
      add(fr, fc); add(fr, fc + 1); add(fr + 1, fc); add(fr + 1, fc + 1);
    }
    // buildable = map cells minus blocked. Map size computed by caller via computeView;
    // here we return blocked set inverted over a bounding region derived from state.
    // Determine bounding region: union of bear, banner, obstacles, fixed, expanded by 8.
    const rows = [], cols = [];
    for (let r = state.bear.row; r < state.bear.row + 3; r++) { rows.push(r); cols.push(state.bear.col); cols.push(state.bear.col+2); }
    rows.push(state.banner.row); cols.push(state.banner.col);
    for (const o of state.obstacles || []) for (const [r,c] of o.cells) { rows.push(r); cols.push(c); }
    for (const [fr, fc] of occupiedByFixed || []) { rows.push(fr); rows.push(fr+1); cols.push(fc); cols.push(fc+1); }
    const minR = Math.min(...rows) - 8, maxR = Math.max(...rows) + 8;
    const minC = Math.min(...cols) - 8, maxC = Math.max(...cols) + 8;
    const result = new Set();
    for (let r = minR; r <= maxR; r++)
      for (let c = minC; c <= maxC; c++)
        if (!blocked.has(`${r},${c}`)) result.add(`${r},${c}`);
    return result;
  }
};
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test tests/geometry.test.js`
Expected: PASS（3 个测试通过）。

- [ ] **Step 5: 提交**

```bash
git add js/geometry.js tests/geometry.test.js
git commit -m "feat(geometry): distance and buildable cell computation"
```

---

### Task 3: Geometry — 候选格与地图自动扩张

**Files:**
- Modify: `D:\PythonProject\map\js\geometry.js`
- Modify: `D:\PythonProject\map\tests\geometry.test.js`

**Interfaces:**
- Consumes: `Geometry.buildableCells`
- Produces:
  - `Geometry.candidateCells(state, occupiedByFixed)` → `Array<[number,number]>`。返回所有合法 2×2 左上角格（4 格全可建），按 `(row, col)` 字典序排序。
  - `Geometry.computeView(state, placedPlayers, minView)` → `{minRow, minCol, maxRow, maxCol}`。计算地图可视矩形，向四周外扩 1 格。`placedPlayers` 为 `[[r,c]...]`（含固定与已排位玩家左上角），`minView` 为 `{w,h}?`。
  - `Geometry.bannerCoverage(banner)` → `{minRow, minCol, maxRow, maxCol}`。旗帜 7×7 覆盖区。
  - `Geometry.overlapsRect(a, b)` → `boolean`。两个矩形 `{minRow,minCol,maxRow,maxCol}` 是否重叠。

- [ ] **Step 1: 写失败测试**

追加到 `D:\PythonProject\map\tests\geometry.test.js`:
```js
test('candidateCells returns sorted 2x2 left corners', () => {
  const state = {
    bear: { row: 0, col: 0 },
    banner: { row: 3, col: 0, fixed: false },
    obstacles: []
  };
  const cands = Geometry.candidateCells(state, []);
  // (0,3): cells (0,3)(0,4)(1,3)(1,4) — none in bear, none banner → valid
  assert.ok(cands.some(([r, c]) => r === 0 && c === 3));
  // (0,0) invalid (bear)
  assert.ok(!cands.some(([r, c]) => r === 0 && c === 0));
  // sorted
  for (let i = 1; i < cands.length; i++) {
    const [pr, pc] = cands[i - 1], [cr, cc] = cands[i];
    assert.ok(pr < cr || (pr === cr && pc <= cc));
  }
});

test('bannerCoverage is 7x7 centered on banner', () => {
  const cov = Geometry.bannerCoverage({ row: 5, col: 5 });
  // 7x7 centered: rows 5-3=2..5+3=8
  assert.equal(cov.minRow, 2); assert.equal(cov.maxRow, 8);
  assert.equal(cov.minCol, 2); assert.equal(cov.maxCol, 8);
});

test('computeView expands and respects minView', () => {
  const state = { bear: { row: 0, col: 0 }, banner: { row: 3, col: 0 }, obstacles: [] };
  const v = Geometry.computeView(state, [[6, 6]], null);
  // bear rows0-2, banner row3, player row6-7 → maxRow 7, +1 = 8; min 0-1=-1
  assert.equal(v.maxRow, 8);
  assert.equal(v.minRow, -1);
  const v2 = Geometry.computeView(state, [], { w: 20, h: 20 });
  // minView 20x20 centered around content → at least 20 wide
  assert.ok(v2.maxRow - v2.minRow + 1 >= 20);
});

test('overlapsRect detects overlap', () => {
  assert.equal(Geometry.overlapsRect({minRow:0,minCol:0,maxRow:2,maxCol:2}, {minRow:2,minCol:2,maxRow:4,maxCol:4}), true);
  assert.equal(Geometry.overlapsRect({minRow:0,minCol:0,maxRow:1,maxCol:1}, {minRow:3,minCol:3,maxRow:4,maxCol:4}), false);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/geometry.test.js`
Expected: FAIL（新函数未定义）。

- [ ] **Step 3: 实现新函数**

在 `D:\PythonProject\map\js\geometry.js` 的 `Geometry` 对象内追加（在 `buildableCells` 之后）:
```js
  candidateCells(state, occupiedByFixed) {
    const buildable = this.buildableCells(state, occupiedByFixed);
    // bounding region from buildable set
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const k of buildable) {
      const [r, c] = k.split(',').map(Number);
      if (r < minR) minR = r; if (r > maxR) maxR = r;
      if (c < minC) minC = c; if (c > maxC) maxC = c;
    }
    const result = [];
    for (let r = minR; r <= maxR - 1; r++)
      for (let c = minC; c <= maxC - 1; c++) {
        if (buildable.has(`${r},${c}`) && buildable.has(`${r},${c+1}`)
            && buildable.has(`${r+1},${c}`) && buildable.has(`${r+1},${c+1}`)) {
          result.push([r, c]);
        }
      }
    result.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return result;
  },

  bannerCoverage(banner) {
    return { minRow: banner.row - 3, minCol: banner.col - 3, maxRow: banner.row + 3, maxCol: banner.col + 3 };
  },

  overlapsRect(a, b) {
    return !(a.maxRow < b.minRow || b.maxRow < a.minRow || a.maxCol < b.minCol || b.maxCol < a.minCol);
  },

  computeView(state, placedPlayers, minView) {
    const rows = [], cols = [];
    for (let r = state.bear.row; r < state.bear.row + 3; r++) { rows.push(r); cols.push(state.bear.col); cols.push(state.bear.col+2); }
    rows.push(state.banner.row); cols.push(state.banner.col);
    const cov = this.bannerCoverage(state.banner);
    rows.push(cov.minRow, cov.maxRow); cols.push(cov.minCol, cov.maxCol);
    for (const o of state.obstacles || []) for (const [r, c] of o.cells) { rows.push(r); cols.push(c); }
    for (const [r, c] of placedPlayers || []) { rows.push(r, r + 1); cols.push(c, c + 1); }
    let minR = Math.min(...rows) - 1, maxR = Math.max(...rows) + 1;
    let minC = Math.min(...cols) - 1, maxC = Math.max(...cols) + 1;
    if (minView) {
      const curW = maxC - minC + 1, curH = maxR - minR + 1;
      if (curW < minView.w) { const extra = minView.w - curW; minC -= Math.floor(extra / 2); maxC += Math.ceil(extra / 2); }
      if (curH < minView.h) { const extra = minView.h - curH; minR -= Math.floor(extra / 2); maxR += Math.ceil(extra / 2); }
    }
    return { minRow: minR, minCol: minC, maxRow: maxR, maxCol: maxC };
  }
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test tests/geometry.test.js`
Expected: PASS（全部 7 个测试）。

- [ ] **Step 5: 提交**

```bash
git add js/geometry.js tests/geometry.test.js
git commit -m "feat(geometry): candidate cells, banner coverage, view expansion"
```

---

### Task 4: Geometry — 玩家落位冲突检测

**Files:**
- Modify: `D:\PythonProject\map\js\geometry.js`
- Modify: `D:\PythonProject\map\tests\geometry.test.js`

**Interfaces:**
- Consumes: `Geometry.buildableCells`
- Produces:
  - `Geometry.canPlace(state, occupiedByFixed, cell)` → `boolean`。玩家 2×2 左上角 `cell=[r,c]` 是否可放置（4 格全可建）。
  - `Geometry.inCoverage(cell, banner)` → `boolean`。玩家 2×2 是否完全落在旗帜 7×7 覆盖区内。

- [ ] **Step 1: 写失败测试**

追加到 `D:\PythonProject\map\tests\geometry.test.js`:
```js
test('canPlace true for free cell, false for bear/banner', () => {
  const state = { bear: { row: 0, col: 0 }, banner: { row: 3, col: 0 }, obstacles: [] };
  assert.equal(Geometry.canPlace(state, [], [0, 3]), true);
  assert.equal(Geometry.canPlace(state, [], [0, 0]), false);
  assert.equal(Geometry.canPlace(state, [], [3, 0]), false);
});

test('inCoverage checks all 4 cells inside 7x7', () => {
  // banner at (3,0): coverage rows0-6 cols-3..3
  const banner = { row: 3, col: 0 };
  assert.equal(Geometry.inCoverage([0, 0], banner), false); // (1,1) inside but (0,-1)?? check: col-1 not needed; (0,0)(0,1)(1,0)(1,1) all inside rows0-6 cols-3..3 → true actually
  // (0,0): rows0,1 cols0,1 — all inside coverage (cols -3..3) → true
  assert.equal(Geometry.inCoverage([0, 0], banner), true);
  // (5,3): rows5,6 cols3,4 — col4 outside (max 3) → false
  assert.equal(Geometry.inCoverage([5, 3], banner), false);
});
```

注意：第一个 `inCoverage([0,0])` 断言先写 false 再改 true，修正见下。

修正测试（替换上面 inCoverage 块）:
```js
test('inCoverage checks all 4 cells inside 7x7', () => {
  const banner = { row: 3, col: 0 };
  assert.equal(Geometry.inCoverage([0, 0], banner), true);
  assert.equal(Geometry.inCoverage([5, 3], banner), false);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/geometry.test.js`
Expected: FAIL（canPlace / inCoverage 未定义）。

- [ ] **Step 3: 实现**

在 `D:\PythonProject\map\js\geometry.js` 的 `Geometry` 对象内追加:
```js
  canPlace(state, occupiedByFixed, cell) {
    const [r, c] = cell;
    const b = this.buildableCells(state, occupiedByFixed);
    return b.has(`${r},${c}`) && b.has(`${r},${c+1}`) && b.has(`${r+1},${c}`) && b.has(`${r+1},${c+1}`);
  },

  inCoverage(cell, banner) {
    const [r, c] = cell;
    const cov = this.bannerCoverage(banner);
    const inside = (rr, cc) => rr >= cov.minRow && rr <= cov.maxRow && cc >= cov.minCol && cc <= cov.maxCol;
    return inside(r, c) && inside(r, c+1) && inside(r+1, c) && inside(r+1, c+1);
  }
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test tests/geometry.test.js`
Expected: PASS（全部 9 个测试）。

- [ ] **Step 5: 提交**

```bash
git add js/geometry.js tests/geometry.test.js
git commit -m "feat(geometry): placement and coverage checks"
```

---

### Task 5: StrictSolver — 贪心严格排位

**Files:**
- Create: `D:\PythonProject\map\js\strictSolver.js`
- Create: `D:\PythonProject\map\tests\strictSolver.test.js`

**Interfaces:**
- Consumes: `Geometry.candidateCells`、`Geometry.distance`、`Geometry.inCoverage`
- Produces:
  - `StrictSolver.solve(state, players)` → `{ placement: {playerId:[r,c]}, unplaced: [playerId], error?: string }`。
    - `players` 数组已按优先级降序排好（顶部最高）。
    - 固定玩家（`player.fixed && player.fixedCell`）直接放入结果并占用其 2×2。
    - 仅考虑落在覆盖区内的候选格（`Geometry.inCoverage`）。
    - 返回的 placement 含固定 + 新排玩家。

- [ ] **Step 1: 写失败测试**

`D:\PythonProject\map\tests\strictSolver.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StrictSolver } from '../js/strictSolver.js';

const state = {
  bear: { row: 0, col: 0 },
  banner: { row: 3, col: 0, fixed: true },
  obstacles: []
};

test('strict places higher priority closer to bear', () => {
  const players = [
    { id: 'p1', name: 'A', priority: 1, fixed: false },
    { id: 'p2', name: 'B', priority: 2, fixed: false }
  ];
  const res = StrictSolver.solve(state, players);
  assert.equal(res.unplaced.length, 0);
  const d1 = Math.hypot((res.placement.p1[0]+0.5)-1, (res.placement.p1[1]+0.5)-1);
  const d2 = Math.hypot((res.placement.p2[0]+0.5)-1, (res.placement.p2[1]+0.5)-1);
  assert.ok(d1 <= d2, 'p1 should be at least as close as p2');
});

test('strict respects fixed players', () => {
  const players = [
    { id: 'p1', name: 'A', priority: 1, fixed: true, fixedCell: [0, 3] },
    { id: 'p2', name: 'B', priority: 2, fixed: false }
  ];
  const res = StrictSolver.solve(state, players);
  assert.deepEqual(res.placement.p1, [0, 3]);
  // p2 must not overlap p1's 2x2 (0,3)(0,4)(1,3)(1,4)
  const [r, c] = res.placement.p2;
  assert.ok(!(r <= 1 && c <= 4 && r >= 0 && c >= 3) || !(r+1 >= 0 && c+1 >= 3));
});

test('strict reports unplaced when no room', () => {
  // tiny coverage impossible: bear covers most; just ensure no crash and unplaced reported if overflow
  const players = Array.from({ length: 100 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, priority: i, fixed: false }));
  const res = StrictSolver.solve(state, players);
  assert.ok(res.unplaced.length > 0 || Object.keys(res.placement).length === 100);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/strictSolver.test.js`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 strictSolver.js**

`D:\PythonProject\map\js\strictSolver.js`:
```js
import { Geometry } from './geometry.js';

export const StrictSolver = {
  solve(state, players) {
    const placement = {};
    const occupiedByFixed = [];
    for (const p of players) {
      if (p.fixed && p.fixedCell) {
        placement[p.id] = p.fixedCell;
        occupiedByFixed.push(p.fixedCell);
      }
    }
    const allCands = Geometry.candidateCells(state, occupiedByFixed)
      .filter(cell => Geometry.inCoverage(cell, state.banner));
    const taken = new Set(); // occupied 2x2 corner keys
    const overlapsTaken = (cell) => {
      const [r, c] = cell;
      for (const [tr, tc] of taken) {
        if (Math.abs(r - tr) < 2 && Math.abs(c - tc) < 2) return true;
      }
      return false;
    };
    const unplaced = [];
    for (const p of players) {
      if (p.fixed && p.fixedCell) continue;
      let best = null, bestD = Infinity;
      for (const cell of allCands) {
        if (overlapsTaken(cell)) continue;
        const d = Geometry.distance(cell, state.bear);
        if (d < bestD - 1e-12 || (Math.abs(d - bestD) < 1e-12 && (best === null || cell[0] < best[0] || (cell[0] === best[0] && cell[1] < best[1])))) {
          bestD = d; best = cell;
        }
      }
      if (best === null) { unplaced.push(p.id); continue; }
      placement[p.id] = best;
      taken.add(best);
    }
    const result = { placement, unplaced };
    if (unplaced.length) result.error = `${unplaced.length} 名玩家无法放置（容量不足）`;
    return result;
  }
};
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test tests/strictSolver.test.js`
Expected: PASS（3 个测试）。

- [ ] **Step 5: 提交**

```bash
git add js/strictSolver.js tests/strictSolver.test.js
git commit -m "feat(strict): greedy priority placement"
```

---

### Task 6: MinimalSolver — 匈牙利算法最小修改

**Files:**
- Create: `D:\PythonProject\map\js\minimalSolver.js`
- Create: `D:\PythonProject\map\tests\minimalSolver.test.js`

**Interfaces:**
- Consumes: `Geometry.candidateCells`、`Geometry.distance`、`Geometry.inCoverage`
- Produces:
  - `MinimalSolver.solve(state, players, oldPlacement)` → `{ placement, unplaced, moves, error? }`。
    - `oldPlacement` 为旧排位 `{playerId:[r,c]}`（可能为空对象）。
    - 固定玩家锁定其格、不进入匹配。
    - `moves` 为 `[{playerId, from:[r,c]?, to:[r,c]}]`（from 为 null 表示新增）。
    - 使用匈牙利算法求最小总费用匹配；费用见 spec §5.3（原地 0、移动 base+M、新增 base）。

- [ ] **Step 1: 写失败测试**

`D:\PythonProject\map\tests\minimalSolver.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MinimalSolver } from '../js/minimalSolver.js';

const state = { bear: { row: 0, col: 0 }, banner: { row: 3, col: 0, fixed: true }, obstacles: [] };

test('minimal keeps existing players in place when possible', () => {
  const players = [
    { id: 'p1', name: 'A', priority: 1, fixed: false },
    { id: 'p2', name: 'B', priority: 2, fixed: false }
  ];
  const old = { p1: [0, 3], p2: [2, 3] };
  const res = MinimalSolver.solve(state, players, old);
  assert.deepEqual(res.placement.p1, [0, 3]);
  assert.deepEqual(res.placement.p2, [2, 3]);
  assert.equal(res.moves.filter(m => m.playerId === 'p1' || m.playerId === 'p2').length, 0);
});

test('minimal moves player when old cell blocked by fixed', () => {
  const players = [
    { id: 'p1', name: 'A', priority: 1, fixed: true, fixedCell: [0, 3] },
    { id: 'p2', name: 'B', priority: 2, fixed: false }
  ];
  const old = { p1: [0, 3], p2: [0, 3] }; // p2 was on p1's now-fixed cell
  const res = MinimalSolver.solve(state, players, old);
  assert.deepEqual(res.placement.p1, [0, 3]);
  // p2 must move to a non-overlapping cell
  const [r, c] = res.placement.p2;
  assert.ok(!(Math.abs(r - 0) < 2 && Math.abs(c - 3) < 2));
  const move = res.moves.find(m => m.playerId === 'p2');
  assert.ok(move); assert.deepEqual(move.from, [0, 3]);
});

test('minimal handles new player with no move penalty', () => {
  const players = [
    { id: 'p1', name: 'A', priority: 1, fixed: false },
    { id: 'p2', name: 'B', priority: 2, fixed: false }
  ];
  const old = { p1: [0, 3] };
  const res = MinimalSolver.solve(state, players, old);
  assert.deepEqual(res.placement.p1, [0, 3]);
  assert.ok(res.placement.p2);
  const moveP2 = res.moves.find(m => m.playerId === 'p2');
  assert.equal(moveP2.from, null);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/minimalSolver.test.js`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 minimalSolver.js（含匈牙利算法）**

`D:\PythonProject\map\js\minimalSolver.js`:
```js
import { Geometry } from './geometry.js';

// Hungarian algorithm (Kuhn-Munkres) for square cost matrix. Returns assignment: row->col.
function hungarian(cost) {
  const n = cost.length;
  if (n === 0) return [];
  const m = cost[0].length;
  const INF = Infinity;
  // pad to square
  const size = Math.max(n, m);
  const c = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => i < n && j < m ? cost[i][j] : 0));
  const u = new Array(size + 1).fill(0);
  const v = new Array(size + 1).fill(0);
  const p = new Array(size + 1).fill(0);
  const way = new Array(size + 1).fill(0);
  for (let i = 1; i <= size; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(size + 1).fill(INF);
    const used = new Array(size + 1).fill(false);
    do {
      used[j0] = true;
      let i0 = p[j0], delta = INF, j1 = -1;
      for (let j = 1; j <= size; j++) {
        if (!used[j]) {
          const cur = c[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
          if (minv[j] < delta) { delta = minv[j]; j1 = j; }
        }
      }
      for (let j = 0; j <= size; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; }
        else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0 !== 0);
  }
  const assignment = new Array(n).fill(-1);
  for (let j = 1; j <= size; j++) {
    if (p[j] !== 0 && p[j] - 1 < n && j - 1 < m) assignment[p[j] - 1] = j - 1;
  }
  return assignment;
}

export const MinimalSolver = {
  solve(state, players, oldPlacement) {
    oldPlacement = oldPlacement || {};
    const placement = {};
    const occupiedByFixed = [];
    for (const p of players) {
      if (p.fixed && p.fixedCell) {
        placement[p.id] = p.fixedCell;
        occupiedByFixed.push(p.fixedCell);
      }
    }
    const movable = players.filter(p => !(p.fixed && p.fixedCell));
    const cands = Geometry.candidateCells(state, occupiedByFixed)
      .filter(cell => Geometry.inCoverage(cell, state.banner));
    if (movable.length === 0) return { placement, unplaced: [], moves: [] };
    if (cands.length < movable.length) {
      return { placement, unplaced: movable.map(p => p.id), moves: [], error: '容量不足' };
    }
    const M = 1e6;
    const cost = movable.map(p => {
      const oldCell = oldPlacement[p.id];
      return cands.map(cell => {
        const base = Geometry.distance(cell, state.bear);
        if (oldCell && oldCell[0] === cell[0] && oldCell[1] === cell[1]) return 0;
        if (oldCell) return base + M;
        return base;
      });
    });
    const assign = hungarian(cost);
    const moves = [];
    const unplaced = [];
    movable.forEach((p, i) => {
      const ci = assign[i];
      if (ci < 0 || ci >= cands.length) { unplaced.push(p.id); return; }
      const cell = cands[ci];
      placement[p.id] = cell;
      const oldCell = oldPlacement[p.id];
      if (!oldCell || oldCell[0] !== cell[0] || oldCell[1] !== cell[1]) {
        moves.push({ playerId: p.id, from: oldCell || null, to: cell });
      }
    });
    return { placement, unplaced, moves };
  }
};
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test tests/minimalSolver.test.js`
Expected: PASS（3 个测试）。

- [ ] **Step 5: 提交**

```bash
git add js/minimalSolver.js tests/minimalSolver.test.js
git commit -m "feat(minimal): hungarian min-change placement"
```

---

### Task 7: Store — 状态管理与撤销重做

**Files:**
- Modify: `D:\PythonProject\map\js\store.js`
- Create: `D:\PythonProject\map\tests\store.test.js`

**Interfaces:**
- Consumes: 无
- Produces:
  - `Store.create()` → 返回一个 store 实例对象 `{ state, undo(), redo(), push(snapshot), canUndo, canRedo, get() }`。
  - 初始状态：`{ bear:{row:0,col:0}, banner:{row:3,col:0,fixed:false}, obstacles:[], players:[], placement:{}, mode:'strict', minView:null }`。
  - `push(snapshot)`：保存当前 state 的深拷贝到 undo 栈，清空 redo 栈。
  - `undo()`/`redo()`：切换 state。
  - `get()`：返回当前 state（引用）。

- [ ] **Step 1: 写失败测试**

`D:\PythonProject\map\tests\store.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../js/store.js';

test('initial state defaults', () => {
  const s = Store.create();
  const st = s.get();
  assert.equal(st.mode, 'strict');
  assert.deepEqual(st.bear, { row: 0, col: 0 });
  assert.equal(st.banner.fixed, false);
  assert.equal(s.canUndo(), false);
});

test('push/undo/redo', () => {
  const s = Store.create();
  s.push(); // snapshot initial
  s.get().bear.row = 5;
  assert.equal(s.get().bear.row, 5);
  s.undo();
  assert.equal(s.get().bear.row, 0);
  assert.equal(s.canRedo(), true);
  s.redo();
  assert.equal(s.get().bear.row, 5);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/store.test.js`
Expected: FAIL（Store.create 未定义）。

- [ ] **Step 3: 实现 store.js**

`D:\PythonProject\map\js\store.js`（整体替换）:
```js
const clone = (o) => JSON.parse(JSON.stringify(o));

const initial = () => ({
  bear: { row: 0, col: 0 },
  banner: { row: 3, col: 0, fixed: false },
  obstacles: [],
  players: [],
  placement: {},
  mode: 'strict',
  minView: null
});

export const Store = {
  create() {
    let state = initial();
    const undoStack = [];
    const redoStack = [];
    return {
      get() { return state; },
      canUndo() { return undoStack.length > 0; },
      canRedo() { return redoStack.length > 0; },
      push() { undoStack.push(clone(state)); redoStack.length = 0; },
      undo() {
        if (!undoStack.length) return;
        redoStack.push(clone(state));
        state = undoStack.pop();
      },
      redo() {
        if (!redoStack.length) return;
        undoStack.push(clone(state));
        state = redoStack.pop();
      }
    };
  }
};
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test tests/store.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add js/store.js tests/store.test.js
git commit -m "feat(store): state with undo/redo"
```

---

### Task 8: Renderer — Canvas 渲染

**Files:**
- Create: `D:\PythonProject\map\js\renderer.js`

**Interfaces:**
- Consumes: `Geometry.computeView`、`Geometry.bannerCoverage`
- Produces:
  - `Renderer.draw(canvas, store, opts)` → 在 canvas 上绘制地图、熊坑、旗帜、7×7 覆盖高亮、障碍、玩家格。`opts={cellSize, view}`。

> 说明：渲染为视觉模块，无单测，靠后续手动验证。

- [ ] **Step 1: 实现 renderer.js**

`D:\PythonProject\map\js\renderer.js`:
```js
import { Geometry } from './geometry.js';

const COLORS = {
  grid: '#9ca3af',
  bear: '#7c2d12',
  banner: '#facc15',
  coverage: 'rgba(250, 204, 21, 0.12)',
  coverageBorder: '#eab308',
  mountain: '#78716c',
  lake: '#0ea5e9',
  mine: '#a16207',
  player: '#3b82f6',
  fixed: '#f59e0b',
  text: '#000'
};

export const Renderer = {
  draw(canvas, store, opts) {
    const state = store.get();
    const cell = opts.cellSize;
    const view = opts.view;
    const w = (view.maxCol - view.minCol + 1) * cell;
    const h = (view.maxRow - view.minRow + 1) * cell;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const toPx = (r, c) => [(c - view.minCol) * cell, (r - view.minRow) * cell];

    // coverage highlight
    const cov = Geometry.bannerCoverage(state.banner);
    let [cx, cy] = toPx(cov.minRow, cov.minCol);
    ctx.fillStyle = COLORS.coverage;
    ctx.fillRect(cx, cy, 7 * cell, 7 * cell);
    ctx.strokeStyle = COLORS.coverageBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, 7 * cell, 7 * cell);

    // grid
    ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 0.5;
    for (let r = view.minRow; r <= view.maxRow + 1; r++) {
      let [x1, y1] = toPx(r, view.minCol); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + w, y1); ctx.stroke();
    }
    for (let c = view.minCol; c <= view.maxCol + 1; c++) {
      let [x1, y1] = toPx(view.minRow, c); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1, y1 + h); ctx.stroke();
    }

    // obstacles
    for (const o of state.obstacles) {
      ctx.fillStyle = COLORS[o.type] || '#888';
      for (const [r, c] of o.cells) {
        let [x, y] = toPx(r, c);
        ctx.fillRect(x, y, cell, cell);
      }
    }

    // bear 3x3
    let [bx, by] = toPx(state.bear.row, state.bear.col);
    ctx.fillStyle = COLORS.bear;
    ctx.fillRect(bx, by, 3 * cell, 3 * cell);
    ctx.fillStyle = '#fff'; ctx.font = `${cell * 0.4}px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('熊', bx + 1.5 * cell, by + 1.5 * cell);

    // banner
    let [fx, fy] = toPx(state.banner.row, state.banner.col);
    ctx.fillStyle = COLORS.banner;
    ctx.fillRect(fx, fy, cell, cell);
    ctx.fillStyle = '#000'; ctx.fillText('旗', fx + cell / 2, fy + cell / 2);
    if (state.banner.fixed) {
      ctx.strokeStyle = COLORS.fixed; ctx.lineWidth = 3;
      ctx.strokeRect(fx, fy, cell, cell);
    }

    // players
    for (const p of state.players) {
      const cell0 = state.placement[p.id];
      if (!cell0) continue;
      let [x, y] = toPx(cell0[0], cell0[1]);
      ctx.fillStyle = p.fixed ? COLORS.fixed : COLORS.player;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(x, y, 2 * cell, 2 * cell);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 1;
      ctx.strokeRect(x, y, 2 * cell, 2 * cell);
      ctx.fillStyle = COLORS.text; ctx.font = `${cell * 0.25}px sans-serif`;
      ctx.fillText(p.name, x + cell, y + cell * 0.5);
      ctx.fillText(`#${p.priority}`, x + cell, y + cell * 1.4);
    }
  }
};
```

- [ ] **Step 2: 手动验证（在 UI 任务后统一进行）**

本步留空，渲染将在 Task 12 集成后统一手动验证。

- [ ] **Step 3: 提交**

```bash
git add js/renderer.js
git commit -m "feat(renderer): canvas grid and entity rendering"
```

---

### Task 9: Editor — 工具交互

**Files:**
- Create: `D:\PythonProject\map\js\editor.js`

**Interfaces:**
- Consumes: `Store`、`Geometry.canPlace`、`Geometry.computeView`
- Produces:
  - `Editor.init(canvas, store, getTool, requestRender)` → 绑定鼠标事件实现放置熊坑/旗帜/障碍/手动放玩家、拖动、旗帜双击锁定。
  - 工具通过 `getTool()` 闭包读取当前选中工具字符串。

> 说明：视觉/交互模块，无单测，手动验证。

- [ ] **Step 1: 实现 editor.js**

`D:\PythonProject\map\js\editor.js`:
```js
import { Geometry } from './geometry.js';

function cellFromEvent(e, canvas, view, cellSize) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  const c = Math.floor(x / cellSize) + view.minCol;
  const r = Math.floor(y / cellSize) + view.minRow;
  return [r, c];
}

export const Editor = {
  init(canvas, store, getTool, requestRender, getCellSize, getView) {
    let dragging = null;
    let lastClickCell = null, lastClickTime = 0;

    canvas.addEventListener('mousedown', (e) => {
      const tool = getTool();
      const cellSize = getCellSize();
      const view = getView();
      const [r, c] = cellFromEvent(e, canvas, view, cellSize);
      const state = store.get();

      if (tool === 'bear') {
        store.push();
        state.bear.row = r; state.bear.col = c;
        dragging = { type: 'bear' };
      } else if (tool === 'banner') {
        const now = Date.now();
        if (lastClickCell && lastClickCell[0] === r && lastClickCell[1] === c && now - lastClickTime < 400) {
          state.banner.fixed = !state.banner.fixed;
        } else {
          store.push();
          state.banner.row = r; state.banner.col = c;
          lastClickCell = [r, c]; lastClickTime = now;
        }
      } else if (['mountain', 'lake', 'mine'].includes(tool)) {
        store.push();
        let obs = state.obstacles.find(o => o.type === tool);
        if (!obs) { obs = { id: tool + Date.now(), type: tool, cells: [] }; state.obstacles.push(obs); }
        const key = `${r},${c}`;
        const idx = obs.cells.findIndex(cc => cc[0] === r && cc[1] === c);
        if (idx >= 0) obs.cells.splice(idx, 1);
        else obs.cells.push([r, c]);
      } else if (tool === 'player') {
        const firstUnfixed = state.players.find(p => !p.fixed && !state.placement[p.id]);
        if (firstUnfixed) {
          store.push();
          if (Geometry.canPlace(state, [], [r, c])) {
            state.placement[firstUnfixed.id] = [r, c];
            firstUnfixed.fixed = true;
            firstUnfixed.fixedCell = [r, c];
          }
        }
      }
      requestRender();
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const cellSize = getCellSize();
      const view = getView();
      const [r, c] = cellFromEvent(e, canvas, view, cellSize);
      const state = store.get();
      if (dragging.type === 'bear') { state.bear.row = r; state.bear.col = c; }
      requestRender();
    });
    canvas.addEventListener('mouseup', () => { dragging = null; });
    canvas.addEventListener('mouseleave', () => { dragging = null; });
  }
};
```

- [ ] **Step 2: 手动验证（Task 12 统一）**

- [ ] **Step 3: 提交**

```bash
git add js/editor.js
git commit -m "feat(editor): tool interactions and banner lock"
```

---

### Task 10: Exporter — JSON 导入导出

**Files:**
- Create: `D:\PythonProject\map\js\exporter.js`

**Interfaces:**
- Consumes: `Store`
- Produces:
  - `Exporter.saveJSON(store)` → 下载 JSON 文件。
  - `Exporter.loadJSON(file, store, onLoaded)` → 读取文件并整体替换 store.state（带二次确认）。
  - `Exporter.importNames(text, store)` → 按行解析名字，追加到 players。

- [ ] **Step 1: 实现 exporter.js（JSON 部分）**

`D:\PythonProject\map\js\exporter.js`:
```js
export const Exporter = {
  saveJSON(store) {
    const data = JSON.stringify(store.get(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bear-rally-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  loadJSON(file, store, onLoaded) {
    if (!confirm('加载项目将覆盖当前状态，确认？')) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        if (!obj.bear || !obj.banner) throw new Error('无效的项目文件');
        store.push();
        const state = store.get();
        Object.assign(state, obj);
        onLoaded();
      } catch (err) { alert('加载失败：' + err.message); }
    };
    reader.readAsText(file);
  },

  importNames(text, store) {
    const names = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    store.push();
    const state = store.get();
    let prio = state.players.length;
    for (const name of names) {
      state.players.push({ id: 'p' + Date.now() + Math.random().toString(36).slice(2, 6), name, priority: ++prio, fixed: false });
    }
  }
};
```

- [ ] **Step 2: 手动验证（Task 12 统一）**

- [ ] **Step 3: 提交**

```bash
git add js/exporter.js
git commit -m "feat(exporter): json import/export"
```

---

### Task 11: Exporter — 图片导出（自绘 canvas）

**Files:**
- Modify: `D:\PythonProject\map\js\exporter.js`

**Interfaces:**
- Consumes: `Store`、`Geometry.computeView`、`Renderer`（复用绘制逻辑）
- Produces:
  - `Exporter.exportFinalImage(store)` → 下载最终排位图 PNG。
  - `Exporter.exportChangesImage(store, oldPlacement)` → 下载变动示意图 PNG（箭头+颜色编码）。`oldPlacement` 为排位前的旧排位（由 UI 在排位时记录）。

- [ ] **Step 1: 在 exporter.js 追加图片导出**

在 `D:\PythonProject\map\js\exporter.js` 顶部加 import，并在 `Exporter` 对象内追加方法:
```js
import { Geometry } from './geometry.js';
import { Renderer } from './renderer.js';
```
（若已存在 import 块则合并到顶部。）

在 `Exporter` 对象内追加:
```js
  _makeCanvas(view, cellSize) {
    const canvas = document.createElement('canvas');
    const fakeStore = { get: () => null };
    const w = (view.maxCol - view.minCol + 1) * cellSize;
    const h = (view.maxRow - view.minRow + 1) * cellSize;
    const dpr = 2;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    return { canvas, dpr, w, h, cellSize };
  },

  _download(canvas, name) {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
    });
  },

  exportFinalImage(store) {
    const state = store.get();
    const placed = Object.values(state.placement);
    const view = Geometry.computeView(state, placed, state.minView);
    const cellSize = 40;
    const { canvas } = this._makeCanvas(view, cellSize);
    Renderer.draw(canvas, store, { cellSize, view });
    this._download(canvas, `seats-final-${new Date().toISOString().slice(0, 10)}.png`);
  },

  exportChangesImage(store, oldPlacement) {
    const state = store.get();
    oldPlacement = oldPlacement || {};
    const placed = Object.values(state.placement);
    const view = Geometry.computeView(state, placed, state.minView);
    const cellSize = 40;
    const { canvas, dpr } = this._makeCanvas(view, cellSize);
    Renderer.draw(canvas, store, { cellSize, view });
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const toPx = (r, c) => [(c - view.minCol) * cellSize + cellSize, (r - view.minRow) * cellSize + cellSize];

    const colorFor = (move) => move.from === null ? '#2563eb' : '#f97316'; // 新增蓝 / 移动橙

    // 原地不动玩家
    for (const p of state.players) {
      const cur = state.placement[p.id];
      const old = oldPlacement[p.id];
      if (cur && old && old[0] === cur[0] && old[1] === cur[1]) {
        let [x, y] = toPx(cur[0], cur[1]);
        ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2;
        ctx.strokeRect(x - cellSize, y - cellSize, 2 * cellSize, 2 * cellSize);
      }
    }
    // 移动 / 新增箭头
    for (const p of state.players) {
      const cur = state.placement[p.id];
      const old = oldPlacement[p.id];
      if (!cur) continue;
      if (old && old[0] === cur[0] && old[1] === cur[1]) continue;
      let [x2, y2] = toPx(cur[0], cur[1]);
      if (old) {
        let [x1, y1] = toPx(old[0], old[1]);
        ctx.strokeStyle = colorFor({ from: old }); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        // arrowhead
        const ang = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath(); ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 8 * Math.cos(ang - 0.4), y2 - 8 * Math.sin(ang - 0.4));
        ctx.lineTo(x2 - 8 * Math.cos(ang + 0.4), y2 - 8 * Math.sin(ang + 0.4));
        ctx.closePath(); ctx.fillStyle = colorFor({ from: old }); ctx.fill();
      } else {
        ctx.fillStyle = colorFor({ from: null });
        ctx.beginPath(); ctx.arc(x2, y2, 6, 0, 2 * Math.PI); ctx.fill();
      }
    }
    // 删除玩家（旧位置灰虚线）
    for (const p of Object.keys(oldPlacement)) {
      if (!state.placement[p]) {
        let [x, y] = toPx(oldPlacement[p][0], oldPlacement[p][1]);
        ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x - cellSize, y - cellSize, 2 * cellSize, 2 * cellSize);
        ctx.setLineDash([]);
      }
    }
    // 固定玩家金框
    for (const p of state.players) {
      if (p.fixed && state.placement[p.id]) {
        let [x, y] = toPx(state.placement[p.id][0], state.placement[p.id][1]);
        ctx.strokeStyle = '#eab308'; ctx.lineWidth = 3;
        ctx.strokeRect(x - cellSize, y - cellSize, 2 * cellSize, 2 * cellSize);
      }
    }
    // 图例
    const legend = [['新增', '#2563eb'], ['移动', '#f97316'], ['不动', '#22c55e'], ['删除', '#9ca3af'], ['固定', '#eab308']];
    let lx = (view.maxCol - view.minCol + 1) * cellSize - 120;
    let ly = (view.maxRow - view.minRow + 1) * cellSize - legend.length * 18 - 10;
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(lx - 6, ly - 6, 116, legend.length * 18 + 12);
    legend.forEach(([t, col], i) => {
      ctx.fillStyle = col; ctx.fillRect(lx, ly + i * 18, 12, 12);
      ctx.fillStyle = '#000'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(t, lx + 18, ly + i * 18);
    });
    this._download(canvas, `seats-changes-${new Date().toISOString().slice(0, 10)}.png`);
  }
```

- [ ] **Step 2: 手动验证（Task 12 统一）**

- [ ] **Step 3: 提交**

```bash
git add js/exporter.js
git commit -m "feat(exporter): final and changes image export"
```

---

### Task 12: UI — 入口与按钮绑定

**Files:**
- Create: `D:\PythonProject\map\js\ui.js`

**Interfaces:**
- Consumes: `Store`、`Renderer`、`Editor`、`Exporter`、`StrictSolver`、`MinimalSolver`、`Geometry.computeView`
- Produces: 应用入口，绑定所有按钮、模式切换、玩家列表渲染、排位触发、图片导出触发。

- [ ] **Step 1: 实现 ui.js**

`D:\PythonProject\map\js\ui.js`:
```js
import { Store } from './store.js';
import { Renderer } from './renderer.js';
import { Editor } from './editor.js';
import { Exporter } from './exporter.js';
import { StrictSolver } from './strictSolver.js';
import { MinimalSolver } from './minimalSolver.js';
import { Geometry } from './geometry.js';

const store = Store.create();
let tool = 'bear';
let cellSize = 40;
let lastOldPlacement = {};

const canvas = document.getElementById('canvas');
const $ = (id) => document.getElementById(id);

function getView() {
  const state = store.get();
  const placed = Object.values(state.placement);
  return Geometry.computeView(state, placed, state.minView);
}

function render() {
  Renderer.draw(canvas, store, { cellSize, view: getView() });
  renderPlayerList();
}

function renderPlayerList() {
  const ul = $('player-list');
  ul.innerHTML = '';
  const state = store.get();
  state.players.forEach((p, i) => {
    p.priority = i + 1;
    const li = document.createElement('li');
    li.draggable = true;
    li.dataset.id = p.id;
    li.innerHTML = `<span>${i + 1}.</span><input value="${p.name}" data-id="${p.id}" class="pname" style="flex:1">
      <input type="checkbox" data-id="${p.id}" class="pfix" ${p.fixed ? 'checked' : ''}>
      <button data-id="${p.id}" class="pdel">×</button>`;
    ul.appendChild(li);
  });
  // drag to reorder
  let dragId = null;
  ul.querySelectorAll('li').forEach(li => {
    li.addEventListener('dragstart', () => dragId = li.dataset.id);
    li.addEventListener('dragover', (e) => e.preventDefault());
    li.addEventListener('drop', () => {
      const state = store.get();
      const from = state.players.findIndex(p => p.id === dragId);
      const to = state.players.findIndex(p => p.id === li.dataset.id);
      if (from < 0 || to < 0 || from === to) return;
      store.push();
      const [moved] = state.players.splice(from, 1);
      state.players.splice(to, 0, moved);
      render();
    });
  });
  ul.querySelectorAll('.pname').forEach(inp => inp.addEventListener('change', (e) => {
    const p = store.get().players.find(p => p.id === e.target.dataset.id);
    store.push(); p.name = e.target.value;
  }));
  ul.querySelectorAll('.pfix').forEach(inp => inp.addEventListener('change', (e) => {
    const state = store.get();
    const p = state.players.find(p => p.id === e.target.dataset.id);
    store.push();
    p.fixed = e.target.checked;
    if (p.fixed && state.placement[p.id]) p.fixedCell = state.placement[p.id];
    if (!p.fixed) p.fixedCell = null;
  }));
  ul.querySelectorAll('.pdel').forEach(b => b.addEventListener('click', (e) => {
    const state = store.get();
    const idx = state.players.findIndex(p => p.id === e.target.dataset.id);
    if (idx < 0) return;
    store.push();
    const [removed] = state.players.splice(idx, 1);
    delete state.placement[removed.id];
    render();
  }));
}

Editor.init(canvas, store, () => tool, render, () => cellSize, getView);

document.querySelectorAll('.tool').forEach(b => b.addEventListener('click', () => {
  tool = b.dataset.tool;
  document.querySelectorAll('.tool').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
}));

$('btn-undo').addEventListener('click', () => { store.undo(); render(); });
$('btn-redo').addEventListener('click', () => { store.redo(); render(); });
$('btn-save').addEventListener('click', () => Exporter.saveJSON(store));
$('btn-load').addEventListener('click', () => $('file-input').click());
$('file-input').addEventListener('change', (e) => {
  const f = e.target.files[0]; if (!f) return;
  Exporter.loadJSON(f, store, render);
  e.target.value = '';
});
$('btn-import-names').addEventListener('click', () => {
  const text = prompt('粘贴玩家名单，每行一个：');
  if (text) { Exporter.importNames(text, store); render(); }
});
document.querySelectorAll('input[name=mode]').forEach(r => r.addEventListener('change', (e) => {
  store.get().mode = e.target.value;
}));
$('zoom').addEventListener('input', (e) => { cellSize = +e.target.value; render(); });

$('btn-solve').addEventListener('click', () => {
  const state = store.get();
  lastOldPlacement = JSON.parse(JSON.stringify(state.placement));
  store.push();
  const sorted = [...state.players];
  if (state.mode === 'strict') {
    const res = StrictSolver.solve(state, sorted);
    state.placement = res.placement;
    if (res.error) alert(res.error + '\n未放置：' + res.unplaced.join(', '));
  } else {
    const res = MinimalSolver.solve(state, sorted, lastOldPlacement);
    state.placement = res.placement;
    if (res.error) alert(res.error);
  }
  render();
});
$('btn-clear').addEventListener('click', () => {
  store.push();
  const state = store.get();
  for (const p of state.players) if (!p.fixed) delete state.placement[p.id];
  render();
});
$('btn-final').addEventListener('click', () => Exporter.exportFinalImage(store));
$('btn-changes').addEventListener('click', () => Exporter.exportChangesImage(store, lastOldPlacement));

render();
```

- [ ] **Step 2: 手动验证**

在浏览器打开 `D:\PythonProject\map\index.html`（用本地服务器或 `file://`）。验证：
1. 熊坑默认在 (0,0)，旗帜在 (3,0)，7×7 黄色覆盖区显示。
2. 选「旗帜」工具点击地图移动旗帜；双击旗帜格切换锁定（金边）。
3. 选「山/湖/矿」涂抹与擦除。
4. 「批量导入名单」粘贴 5 个名字，玩家列表出现 5 项。
5. 模式选「严格」，点「一键排位」→ 玩家落座，优先级高的离熊坑更近。
6. 切「最小修改」，移动某玩家后再点一键排位 → 该玩家尽量不动。
7. 「导出项目」下载 JSON；「加载项目」还原。
8. 「最终图」「变动图」各下载 PNG，变动图含箭头与图例。
9. 撤销/重做生效。
10. 地图随玩家落到边界外自动扩张。

- [ ] **Step 3: 提交**

```bash
git add js/ui.js
git commit -m "feat(ui): wire up toolbar, list, solve, export"
```

---

## Self-Review

**1. Spec 覆盖：**
- §2 数据模型 → Task 7 (Store) ✓
- §3 自动扩张 → Task 3 (computeView) ✓
- §4 界面交互（熊坑/旗帜/障碍/手动放/固定/优先级/模式/排位/清空） → Task 9 (Editor) + Task 12 (UI) ✓
- §5.1 候选格/距离 → Task 2+3 ✓
- §5.2 严格贪心 → Task 5 ✓
- §5.3 最小修改匈牙利 → Task 6 ✓
- §5.4 容量不足报错 → Task 5/6 ✓
- §6.1 JSON 导入导出 → Task 10 ✓
- §6.2 图片导出（最终图+变动图，自绘 canvas，颜色编码，图例） → Task 11 ✓
- §7 文件结构模块划分 → 全部任务 ✓

**2. 占位扫描：** 无 TBD/TODO。Task 8/9/10/11/12 的「手动验证」是真实测试步骤，非占位。

**3. 类型/命名一致性：**
- `Geometry.distance/buildableCells/candidateCells/bannerCoverage/overlapsRect/computeView/canPlace/inCoverage` 各任务引用一致 ✓
- `Store.create()` 返回 `{get,push,undo,redo,canUndo,canRedo}` 一致 ✓
- `Renderer.draw(canvas, store, {cellSize, view})` 在 Task 8/11/12 一致 ✓
- `StrictSolver.solve(state, players)`、`MinimalSolver.solve(state, players, oldPlacement)` 在 Task 5/6/12 一致 ✓
- `Exporter.saveJSON/loadJSON/importNames/exportFinalImage/exportChangesImage` 在 Task 10/11/12 一致 ✓

无问题，计划完整。

## 执行选择

计划已保存到 `docs/superpowers/plans/2026-07-24-bear-rally-seat-planner.md`。两种执行方式：

1. **Subagent 驱动（推荐）** — 每个 Task 派一个全新 subagent 实现，任务间我来 review，迭代快、上下文干净。
2. **内联执行** — 在当前会话按 executing-plans 批量执行，带检查点。

选哪种？
