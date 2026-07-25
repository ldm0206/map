# 多旗帜 + 全局不重叠 改造计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将单旗帜设计改造为多旗帜（`state.banners[]`），并补齐所有建筑两两不重叠的冲突检测。

**Architecture:** 数据模型 `banner` → `banners[]`；`Geometry.inCoverage(cell, banners)` 改为「任一旗帜覆盖即 true」；`buildableCells` 屏蔽所有旗帜格；Editor 对熊坑移动、旗帜放置/移动、障碍涂抹、玩家放置全部做不重叠检测；Renderer 画所有旗帜及各自覆盖区；Store 初始状态改 `banners`；Exporter 校验改 `banners`。

**Tech Stack:** 原生 JS（ES modules）、Canvas 2D、`node:test`。

## Global Constraints

- 沿用主计划的所有约束（坐标 row/col、熊坑 3×3 存左上角、距离算熊坑中心、纯静态单页）。
- `state.banners` 为数组，元素 `{id, row, col, fixed}`。初始含 1 个旗帜 `{id:'b1', row:3, col:0, fixed:false}`（保持向后兼容的默认体验）。
- `Geometry.inCoverage(cell, banners)` 签名改为接收数组；玩家 2×2 完全落在**任一**旗帜 7×7 内即 true。
- `Geometry.buildableCells(state, occupiedByFixed)` 屏蔽 `state.banners` 中所有旗帜格。
- 所有建筑（熊坑 3×3、每个旗帜 1×1、每个障碍格、每个玩家 2×2）两两不可重叠——放置操作前必须用 `Geometry.canPlace*` 系列检测，冲突则不写入并提示。
- 现有 17 个单测需相应更新（涉及 banner 单参数的测试改 banners 数组），改完仍须全绿。

---

### Task M1: Geometry — 多旗帜覆盖与可建格

**Files:**
- Modify: `D:\PythonProject\map\js\geometry.js`
- Modify: `D:\PythonProject\map\tests\geometry.test.js`

**Interfaces:**
- Consumes: 无
- Produces:
  - `Geometry.bannerCoverage(banner)` 保持不变（单旗帜）。
  - `Geometry.inCoverage(cell, banners)` → `boolean`。`banners` 为数组；玩家 2×2 完全落在**任一**旗帜 7×7 内即 true。
  - `Geometry.buildableCells(state, occupiedByFixed)` 屏蔽 `state.banners` 中**所有**旗帜格（state 现含 `banners:[]` 而非 `banner`）。
  - `Geometry.computeView(state, placedPlayers, minView)` 包络所有旗帜及各自覆盖区。

- [ ] **Step 1: 更新测试**

把 `tests/geometry.test.js` 中所有 `banner: { row:..., col:..., fixed:... }` 改为 `banners: [{ id:'b1', row:..., col:..., fixed:... }]`。`inCoverage` 调用改为传数组。新增一个多旗帜测试：玩家格只被第二个旗帜覆盖时也算 in coverage。

具体替换（搜索 `banner:` 全部替换为 `banners:` 并包成数组；`inCoverage(x, state.banner)` → `inCoverage(x, state.banners)`；`inCoverage(x, banner)` 变量 → `inCoverage(x, [banner])`）。

新增测试追加到文件末尾：
```js
test('inCoverage true if covered by any banner', () => {
  const banners = [
    { id: 'b1', row: 3, col: 0, fixed: false },
    { id: 'b2', row: 10, col: 10, fixed: false }
  ];
  // banner2 coverage rows7..13 cols7..13; cell [8,8] 2x2 inside b2 only
  assert.equal(Geometry.inCoverage([8, 8], banners), true);
  // cell [0,0] inside b1 only
  assert.equal(Geometry.inCoverage([0, 0], banners), true);
  // cell [5,5] inside neither
  assert.equal(Geometry.inCoverage([5, 5], banners), false);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/geometry.test.js`
Expected: FAIL（inCoverage 签名不匹配、buildableCells 读 state.banner 报错）。

- [ ] **Step 3: 改 geometry.js**

`D:\PythonProject\map\js\geometry.js`：
- `buildableCells`：把 `add(state.banner.row, state.banner.col)` 改为遍历 `for (const bn of state.banners || []) add(bn.row, bn.col);`；包络计算同理把 `state.banner.row/col` 换成遍历 banners。
- `computeView`：把 `rows.push(state.banner.row); cols.push(state.banner.col);` 和 `const cov = this.bannerCoverage(state.banner);` 改为遍历 `state.banners`，每个旗帜 push 其 row/col 及 bannerCoverage 的四角。
- `inCoverage(cell, banners)`：改为
```js
  inCoverage(cell, banners) {
    const [r, c] = cell;
    for (const bn of banners || []) {
      const cov = this.bannerCoverage(bn);
      const inside = (rr, cc) => rr >= cov.minRow && rr <= cov.maxRow && cc >= cov.minCol && cc <= cov.maxCol;
      if (inside(r, c) && inside(r, c+1) && inside(r+1, c) && inside(r+1, c+1)) return true;
    }
    return false;
  }
```
- `canPlace` 不变（它依赖 buildableCells，自动适配）。
- `distance`、`candidateCells`、`bannerCoverage`、`overlapsRect` 不变。

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test tests/geometry.test.js`
Expected: PASS（全部测试，含新增多旗帜测试）。

- [ ] **Step 5: 提交**

```bash
git add js/geometry.js tests/geometry.test.js
git commit -m "refactor(geometry): multi-banner coverage and buildable cells"
```

---

### Task M2: 全局不重叠检测函数

**Files:**
- Modify: `D:\PythonProject\map\js\geometry.js`
- Modify: `D:\PythonProject\map\tests\geometry.test.js`

**Interfaces:**
- Produces:
  - `Geometry.occupiedCells(state, occupiedByFixed)` → `Set<string>`。返回当前所有「已占格」：熊坑 3×3 ∪ 所有旗帜格 ∪ 所有障碍格 ∪ 所有固定玩家 2×2。供「放置新建筑时是否冲突」查询。
  - `Geometry.canPlaceEntity(state, occupiedByFixed, kind, cell, opts?)` → `boolean`。统一不重叠检测：
    - `kind='banner'`：cell=[r,c] 1×1，要求该格不在 occupiedCells 内。
    - `kind='obstacle'`：cell=[r,c] 1×1，同上。
    - `kind='player'`：cell=[r,c] 2×2，要求 4 格都不在 occupiedCells 内（等价于 canPlace，但显式排除其他玩家格——下述）。
    - `kind='bear'`：cell=[r,c] 3×3，要求 9 格都不在 occupiedCells 内。
  - 注意：`occupiedCells` 不含「待放置实体自身」。opts 可选 `{ignorePlayerId}` 用于移动某玩家时排除其自身原位（本任务先不实现 opts，留接口）。

- [ ] **Step 1: 写失败测试**

追加到 `tests/geometry.test.js`：
```js
test('occupiedCells unions bear, banners, obstacles, fixed players', () => {
  const state = {
    bear: { row: 0, col: 0 },
    banners: [{ id: 'b1', row: 3, col: 0, fixed: false }],
    obstacles: [{ id: 'o1', type: 'mine', cells: [[5,5]] }]
  };
  const occ = Geometry.occupiedCells(state, [[4,4]]);
  assert.equal(occ.has('0,0'), true);   // bear
  assert.equal(occ.has('3,0'), true);   // banner
  assert.equal(occ.has('5,5'), true);   // obstacle
  assert.equal(occ.has('4,4'), true);   // fixed player
  assert.equal(occ.has('4,6'), false);  // free
});

test('canPlaceEntity rejects overlapping placements', () => {
  const state = {
    bear: { row: 0, col: 0 },
    banners: [{ id: 'b1', row: 3, col: 0, fixed: false }],
    obstacles: []
  };
  // banner on bear cell (0,0) → false
  assert.equal(Geometry.canPlaceEntity(state, [], 'banner', [0, 0]), false);
  // banner on free cell (3,3) → true
  assert.equal(Geometry.canPlaceEntity(state, [], 'banner', [3, 3]), true);
  // bear overlapping existing banner (bear 3x3 at (2,0) covers (3,0)=banner) → false
  assert.equal(Geometry.canPlaceEntity(state, [], 'bear', [2, 0]), false);
  // bear on free area (10,10) → true
  assert.equal(Geometry.canPlaceEntity(state, [], 'bear', [10, 10]), true);
  // obstacle on bear cell → false
  assert.equal(Geometry.canPlaceEntity(state, [], 'obstacle', [1, 1]), false);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/geometry.test.js`
Expected: FAIL（occupiedCells / canPlaceEntity 未定义）。

- [ ] **Step 3: 实现**

在 `D:\PythonProject\map\js\geometry.js` 的 Geometry 对象内追加：
```js
  occupiedCells(state, occupiedByFixed) {
    const occ = new Set();
    const add = (r, c) => occ.add(`${r},${c}`);
    for (let r = state.bear.row; r < state.bear.row + 3; r++)
      for (let c = state.bear.col; c < state.bear.col + 3; c++) add(r, c);
    for (const bn of state.banners || []) add(bn.row, bn.col);
    for (const o of state.obstacles || []) for (const [r, c] of o.cells) add(r, c);
    for (const [fr, fc] of occupiedByFixed || []) {
      add(fr, fc); add(fr, fc + 1); add(fr + 1, fc); add(fr + 1, fc + 1);
    }
    return occ;
  },

  canPlaceEntity(state, occupiedByFixed, kind, cell, opts) {
    const [r, c] = cell;
    const occ = this.occupiedCells(state, occupiedByFixed);
    const cells = [];
    if (kind === 'banner' || kind === 'obstacle') cells.push([r, c]);
    else if (kind === 'player') cells.push([r,c],[r,c+1],[r+1,c],[r+1,c+1]);
    else if (kind === 'bear') {
      for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) cells.push([r+dr, c+dc]);
    } else return false;
    return cells.every(([rr, cc]) => !occ.has(`${rr},${cc}`));
  }
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test tests/geometry.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add js/geometry.js tests/geometry.test.js
git commit -m "feat(geometry): global non-overlap entity placement checks"
```

---

### Task M3: Solvers — 适配多旗帜

**Files:**
- Modify: `D:\PythonProject\map\js\strictSolver.js`
- Modify: `D:\PythonProject\map\js\minimalSolver.js`
- Modify: `D:\PythonProject\map\tests\strictSolver.test.js`
- Modify: `D:\PythonProject\map\tests\minimalSolver.test.js`

**Interfaces:**
- Consumes: `Geometry.inCoverage(cell, banners)`（新签名）
- Produces: solver 内 `Geometry.inCoverage(cell, state.banner)` → `Geometry.inCoverage(cell, state.banners)`。

- [ ] **Step 1: 改测试**

两个 solver 测试文件里的 `state` 都用 `banner: {...}`，全部改成 `banners: [{ id:'b1', row:3, col:0, fixed:true }]`。

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/strictSolver.test.js tests/minimalSolver.test.js`
Expected: FAIL（inCoverage 传了 banner 对象而非数组，或 state.banner 未定义）。

- [ ] **Step 3: 改 solver**

- `js/strictSolver.js` 第 14 行 `.filter(cell => Geometry.inCoverage(cell, state.banner))` → `Geometry.inCoverage(cell, state.banners)`。
- `js/minimalSolver.js` 第 60 行同样改 `state.banner` → `state.banners`。

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test`
Expected: 全套 PASS。

- [ ] **Step 5: 提交**

```bash
git add js/strictSolver.js js/minimalSolver.js tests/strictSolver.test.js tests/minimalSolver.test.js
git commit -m "refactor(solvers): adapt to multi-banner state"
```

---

### Task M4: Store — 初始状态多旗帜

**Files:**
- Modify: `D:\PythonProject\map\js\store.js`
- Modify: `D:\PythonProject\map\tests\store.test.js`

**Interfaces:**
- Produces: `Store.create()` 初始 state 用 `banners: [{id:'b1',row:3,col:0,fixed:false}]` 而非 `banner:{...}`。

- [ ] **Step 1: 改测试**

`tests/store.test.js` 中 `assert.equal(st.banner.fixed, false)` → `assert.equal(st.banners.length, 1); assert.equal(st.banners[0].fixed, false)`。

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/store.test.js`
Expected: FAIL。

- [ ] **Step 3: 改 store.js**

`D:\PythonProject\map\js\store.js` 的 `initial()`：
```js
  banners: [{ id: 'b1', row: 3, col: 0, fixed: false }],
```
（替换原 `banner: { row: 3, col: 0, fixed: false }`）

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test`
Expected: 全套 PASS。

- [ ] **Step 5: 提交**

```bash
git add js/store.js tests/store.test.js
git commit -m "refactor(store): initial state with banners array"
```

---

### Task M5: Renderer — 画所有旗帜及覆盖区

**Files:**
- Modify: `D:\PythonProject\map\js\renderer.js`

**Interfaces:**
- Consumes: `Geometry.bannerCoverage`
- Produces: `Renderer.draw` 遍历 `state.banners` 画每个旗帜的 7×7 覆盖高亮 + 旗帜格 + fixed 金边。

- [ ] **Step 1: 改 renderer.js**

把原单旗帜绘制块：
```js
    const cov = Geometry.bannerCoverage(state.banner);
    let [cx, cy] = toPx(cov.minRow, cov.minCol);
    ctx.fillStyle = COLORS.coverage;
    ctx.fillRect(cx, cy, 7 * cell, 7 * cell);
    ctx.strokeStyle = COLORS.coverageBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, 7 * cell, 7 * cell);
```
改为遍历：
```js
    for (const bn of state.banners || []) {
      const cov = Geometry.bannerCoverage(bn);
      let [cx, cy] = toPx(cov.minRow, cov.minCol);
      ctx.fillStyle = COLORS.coverage;
      ctx.fillRect(cx, cy, 7 * cell, 7 * cell);
      ctx.strokeStyle = COLORS.coverageBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, cy, 7 * cell, 7 * cell);
    }
```

把单旗帜格绘制块：
```js
    let [fx, fy] = toPx(state.banner.row, state.banner.col);
    ctx.fillStyle = COLORS.banner;
    ctx.fillRect(fx, fy, cell, cell);
    ctx.fillStyle = '#000'; ctx.fillText('旗', fx + cell / 2, fy + cell / 2);
    if (state.banner.fixed) {
      ctx.strokeStyle = COLORS.fixed; ctx.lineWidth = 3;
      ctx.strokeRect(fx, fy, cell, cell);
    }
```
改为遍历：
```js
    for (const bn of state.banners || []) {
      let [fx, fy] = toPx(bn.row, bn.col);
      ctx.fillStyle = COLORS.banner;
      ctx.fillRect(fx, fy, cell, cell);
      ctx.fillStyle = '#000'; ctx.font = `${cell * 0.4}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('旗', fx + cell / 2, fy + cell / 2);
      if (bn.fixed) {
        ctx.strokeStyle = COLORS.fixed; ctx.lineWidth = 3;
        ctx.strokeRect(fx, fy, cell, cell);
      }
    }
```

- [ ] **Step 2: node --check**

Run: `node --check js/renderer.js`
Expected: 无语法错误。

- [ ] **Step 3: 全套测试**

Run: `node --test`
Expected: 全套 PASS（renderer 无单测，确认未破坏其它）。

- [ ] **Step 4: 提交**

```bash
git add js/renderer.js
git commit -m "refactor(renderer): render all banners and their coverage"
```

---

### Task M6: Editor — 多旗帜 + 全局不重叠

**Files:**
- Modify: `D:\PythonProject\map\js\editor.js`

**Interfaces:**
- Consumes: `Geometry.canPlaceEntity`、`Geometry.canPlace`
- Produces: Editor 对熊坑移动、旗帜放置/移动/锁定、障碍涂抹、玩家放置全部做不重叠检测；旗帜工具可创建多个旗帜。

- [ ] **Step 1: 改 editor.js**

整体替换 `Editor.init` 的 mousedown/mousemove 逻辑为：
```js
    let dragging = null;          // {type:'bear'|'banner', id?}
    let lastClickCell = null, lastClickTime = 0;

    canvas.addEventListener('mousedown', (e) => {
      const tool = getTool();
      const cellSize = getCellSize();
      const view = getView();
      const [r, c] = cellFromEvent(e, canvas, view, cellSize);
      const state = store.get();
      const fixedCells = state.players.filter(p => p.fixed && p.fixedCell).map(p => p.fixedCell);

      if (tool === 'bear') {
        if (!Geometry.canPlaceEntity(state, fixedCells, 'bear', [r, c])) { requestRender(); return; }
        store.push();
        state.bear.row = r; state.bear.col = c;
        dragging = { type: 'bear' };
      } else if (tool === 'banner') {
        // find existing banner at this cell
        const hit = (state.banners || []).find(bn => bn.row === r && bn.col === c);
        const now = Date.now();
        if (hit && lastClickCell && lastClickCell[0] === r && lastClickCell[1] === c && now - lastClickTime < 400) {
          store.push();
          hit.fixed = !hit.fixed;
          lastClickCell = null;
        } else if (hit) {
          // start dragging existing banner (only if not fixed)
          if (!hit.fixed) { store.push(); dragging = { type: 'banner', id: hit.id }; }
          lastClickCell = [r, c]; lastClickTime = now;
        } else {
          // place new banner if cell free
          if (Geometry.canPlaceEntity(state, fixedCells, 'banner', [r, c])) {
            store.push();
            state.banners.push({ id: 'b' + Date.now() + Math.random().toString(36).slice(2, 5), row: r, col: c, fixed: false });
          }
          lastClickCell = [r, c]; lastClickTime = now;
        }
      } else if (['mountain', 'lake', 'mine'].includes(tool)) {
        // toggle obstacle cell, but forbid placing on bear/banner/other obstacle/player
        const occ = Geometry.occupiedCells(state, fixedCells);
        if (!occ.has(`${r},${c}`)) {
          store.push();
          let obs = state.obstacles.find(o => o.type === tool);
          if (!obs) { obs = { id: tool + Date.now(), type: tool, cells: [] }; state.obstacles.push(obs); }
          const idx = obs.cells.findIndex(cc => cc[0] === r && cc[1] === c);
          if (idx >= 0) obs.cells.splice(idx, 1);
          else obs.cells.push([r, c]);
        } else {
          // allow erasing an existing obstacle cell even if it's "occupied" (obstacle cells are occupied by themselves)
          store.push();
          for (const o of state.obstacles) {
            const idx = o.cells.findIndex(cc => cc[0] === r && cc[1] === c);
            if (idx >= 0) { o.cells.splice(idx, 1); break; }
          }
        }
      } else if (tool === 'player') {
        const firstUnfixed = state.players.find(p => !p.fixed && !state.placement[p.id]);
        if (firstUnfixed && Geometry.canPlaceEntity(state, fixedCells, 'player', [r, c])) {
          store.push();
          state.placement[firstUnfixed.id] = [r, c];
          firstUnfixed.fixed = true;
          firstUnfixed.fixedCell = [r, c];
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
      const fixedCells = state.players.filter(p => p.fixed && p.fixedCell).map(p => p.fixedCell);
      if (dragging.type === 'bear') {
        if (Geometry.canPlaceEntity(state, fixedCells, 'bear', [r, c])) {
          state.bear.row = r; state.bear.col = c;
        }
      } else if (dragging.type === 'banner') {
        // temporarily move banner, check overlap excluding itself
        const bn = state.banners.find(b => b.id === dragging.id);
        if (bn && Geometry.canPlaceEntity(state, fixedCells, 'banner', [r, c])) {
          // canPlaceEntity includes this banner's own cell in occupiedCells (it's in state.banners),
          // so a 1-cell move to an adjacent free cell is allowed; moving onto its own current cell is also allowed.
          bn.row = r; bn.col = c;
        }
      }
      requestRender();
    });
    canvas.addEventListener('mouseup', () => { dragging = null; });
    canvas.addEventListener('mouseleave', () => { dragging = null; });
```

注意：旗帜拖动时 `canPlaceEntity('banner', newCell)` 会把该旗帜自身当前格也算进 occupiedCells，因此拖到「自身当前格」或「其它空闲格」都通过，拖到「已被别的建筑占的格」被拒——符合预期。

- [ ] **Step 2: node --check + 全套测试**

Run: `node --check js/editor.js && node --test`
Expected: 无语法错误，全套测试 PASS。

- [ ] **Step 3: 提交**

```bash
git add js/editor.js
git commit -m "refactor(editor): multi-banner creation and global non-overlap enforcement"
```

---

### Task M7: Exporter — 校验与变动图适配多旗帜

**Files:**
- Modify: `D:\PythonProject\map\js\exporter.js`

**Interfaces:**
- Consumes: `Geometry.computeView`（已适配 banners）
- Produces: loadJSON 校验 `obj.banners`；exportFinalImage/exportChangesImage 通过 Renderer.draw 自动适配（无需改逻辑，因 Renderer 已遍历 banners）。

- [ ] **Step 1: 改 exporter.js**

`loadJSON` 中校验行：
```js
        if (!obj.bear || !obj.banner) throw new Error('无效的项目文件');
```
改为：
```js
        if (!obj.bear || !Array.isArray(obj.banners)) throw new Error('无效的项目文件');
```

exportFinalImage / exportChangesImage 无需改动（它们调用 Renderer.draw，Renderer 已遍历 banners）。

- [ ] **Step 2: node --check + 全套测试**

Run: `node --check js/exporter.js && node --test`
Expected: 无语法错误，全套 PASS。

- [ ] **Step 3: 提交**

```bash
git add js/exporter.js
git commit -m "refactor(exporter): validate banners array on load"
```

---

### Task M8: 手动浏览器验证

**Files:** 无（验证步骤）

- [ ] **Step 1: 启动本地服务器**

Run: `python -m http.server 8000`（在 D:\PythonProject\map）
打开浏览器 http://localhost:8000

- [ ] **Step 2: 验证清单**

1. 默认 1 个旗帜在 (3,0)，7×7 黄色覆盖区显示。
2. 选「旗帜」工具点击地图空格 → 新增第 2 个旗帜，各自 7×7 覆盖区显示。
3. 旗帜放熊坑/障碍/玩家格上 → 被拒（无变化）。
4. 拖动未锁定旗帜可移动；双击某旗帜切换 fixed（金边、不可拖）。
5. 熊坑拖到旗帜/障碍/玩家格上 → 被拒。
6. 山/湖/矿涂到熊坑/旗帜/玩家格上 → 被拒；涂在空地可加；再点障碍格可擦。
7. 「批量导入名单」5 个名字 → 列表 5 项。
8. 模式「严格」→ 一键排位 → 玩家落在任一旗帜覆盖区内，优先级高者离熊坑更近。
9. 切「最小修改」→ 移动某玩家后排位 → 该玩家尽量不动，变动图箭头正确。
10. 「导出项目」JSON → 「加载项目」还原（多旗帜都还原）。
11. 「最终图」「变动图」PNG 下载，含所有旗帜及覆盖区、箭头与图例。
12. 撤销/重做生效。
13. 地图随内容落到边界外自动扩张。

- [ ] **Step 3: 如有问题修复后提交，否则无新提交**

---

## Self-Review

**1. Spec 覆盖：**
- 多旗帜（`banners[]`） → M1（geometry）+ M4（store）+ M5（renderer）+ M6（editor）+ M7（exporter）✓
- 全局不重叠 → M2（canPlaceEntity/occupiedCells）+ M6（editor 调用）✓
- inCoverage 任一旗帜 → M1 ✓
- solvers 适配 → M3 ✓
- 向后兼容：初始仍 1 旗帜 ✓

**2. 占位扫描：** 无 TBD。M8 是真实验证清单。

**3. 命名一致性：**
- `state.banners`、`Geometry.inCoverage(cell, banners)`、`Geometry.occupiedCells`、`Geometry.canPlaceEntity` 全计划一致 ✓
- 现有 `Geometry.canPlace`（2×2 玩家专用，基于 buildableCells）保留，M2 新增 `canPlaceEntity` 通用版；editor 玩家放置用 `canPlaceEntity('player',...)` 统一 ✓

无问题。
