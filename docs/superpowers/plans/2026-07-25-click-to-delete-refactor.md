# 交互重构：同工具再点删除 + 移除右键菜单

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** 把删除交互从「右键菜单」改为「同工具再点同实体即删除」，移除 D1 的右键菜单，旗帜锁定改为 Shift+点击。

**Architecture:** editor.js mousedown 分支重写：旗帜点已有→删除（Shift修饰→切换锁定，否则删除）；玩家点已落座→取消座位；移除 contextmenu 整块及 #ctx-menu。重置按钮保留。

**Tech Stack:** 原生 JS、Canvas、`node:test`。

## Global Constraints

- 删除触发：同一工具再次点击该工具对应的已有实体。
  - 旗帜工具 + 点已有旗帜 + 无 Shift → **删除**该旗帜。
  - 旗帜工具 + 点已有旗帜 + 按 Shift → 切换该旗帜 `fixed`（锁定）。
  - 旗帜工具 + 点空格 → 新建旗帜（需过 canPlaceEntity）。
  - 玩家工具 + 点已落座玩家（2×2 命中）→ **取消其座位**（delete placement[id]，player.fixed=false, fixedCell=null）。
  - 玩家工具 + 点空格（可建）→ 放置第一个未落座玩家。
  - 障碍工具 + 点已有障碍格 → 擦除（不变）；点空格 → 涂（不变）。
  - 熊坑工具 → 拖动放置（不变，不可删）。
- 移除 D1 的 contextmenu 处理、entityAt、deleteEntity、hideMenu、#ctx-menu div、document click/mousedown 关闭逻辑。
- 旗帜拖动：保留（mousedown 在已有旗帜且非 Shift 时……需决定：拖动 vs 删除冲突）。**决定：去掉旗帜拖动**——点已有旗帜=删除，避免与拖动冲突。旗帜要移动就先删再建。（简化，符合「再点删除」心智模型。）
- 所有删除/取消操作 store.push() 先行。
- 现有 21 个单测须仍全绿。

---

### Task R1: 移除右键菜单 + 重写删除交互

**Files:**
- Modify: `D:\PythonProject\map\js\editor.js`
- Modify: `D:\PythonProject\map\index.html`

**Interfaces:**
- Produces: editor.js 的 mousedown 分支改为上述语义；删除 contextmenu 整块；index.html 移除 `#ctx-menu` div。

- [ ] **Step 1: index.html 移除 #ctx-menu**

删除 index.html 中的 `<div id="ctx-menu" ...>...</div>` 整行。

- [ ] **Step 2: editor.js 重写**

整体替换 `Editor.init` 函数体（保留 `import`、`cellFromEvent`、`export const Editor = { init(...) {`）。新体：

```js
    let dragging = null;

    canvas.addEventListener('mousedown', (e) => {
      const tool = getTool();
      const cellSize = getCellSize();
      const view = getView();
      const [r, c] = cellFromEvent(e, canvas, view, cellSize);
      const state = store.get();
      const fixedCells = state.players.filter(p => p.fixed && p.fixedCell).map(p => p.fixedCell);

      if (tool === 'bear') {
        if (Geometry.canPlaceEntity(state, fixedCells, 'bear', [r, c])) {
          store.push();
          state.bear.row = r; state.bear.col = c;
          dragging = { type: 'bear' };
        }
      } else if (tool === 'banner') {
        const hit = (state.banners || []).find(bn => bn.row === r && bn.col === c);
        if (hit) {
          store.push();
          if (e.shiftKey) {
            hit.fixed = !hit.fixed;
          } else {
            const idx = state.banners.indexOf(hit);
            if (idx >= 0) state.banners.splice(idx, 1);
          }
        } else if (Geometry.canPlaceEntity(state, fixedCells, 'banner', [r, c])) {
          store.push();
          state.banners.push({ id: 'b' + Date.now() + Math.random().toString(36).slice(2, 5), row: r, col: c, fixed: false });
        }
      } else if (['mountain', 'lake', 'mine'].includes(tool)) {
        const occ = Geometry.occupiedCells(state, fixedCells);
        if (!occ.has(`${r},${c}`)) {
          store.push();
          let obs = state.obstacles.find(o => o.type === tool);
          if (!obs) { obs = { id: tool + Date.now(), type: tool, cells: [] }; state.obstacles.push(obs); }
          const idx = obs.cells.findIndex(cc => cc[0] === r && cc[1] === c);
          if (idx >= 0) obs.cells.splice(idx, 1);
          else obs.cells.push([r, c]);
        } else {
          store.push();
          for (const o of state.obstacles) {
            const idx = o.cells.findIndex(cc => cc[0] === r && cc[1] === c);
            if (idx >= 0) { o.cells.splice(idx, 1); break; }
          }
        }
      } else if (tool === 'player') {
        // hit-test placed player (2x2)
        const hitPlayer = state.players.find(p => {
          const pc = state.placement[p.id];
          return pc && r >= pc[0] && r <= pc[0]+1 && c >= pc[1] && c <= pc[1]+1;
        });
        if (hitPlayer) {
          store.push();
          delete state.placement[hitPlayer.id];
          hitPlayer.fixed = false;
          hitPlayer.fixedCell = null;
        } else {
          const firstUnfixed = state.players.find(p => !p.fixed && !state.placement[p.id]);
          if (firstUnfixed && Geometry.canPlaceEntity(state, fixedCells, 'player', [r, c])) {
            store.push();
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
      const fixedCells = state.players.filter(p => p.fixed && p.fixedCell).map(p => p.fixedCell);
      if (dragging.type === 'bear') {
        if (Geometry.canPlaceEntity(state, fixedCells, 'bear', [r, c], { ignoreSelf: { kind: 'bear', cell: [state.bear.row, state.bear.col] } })) {
          state.bear.row = r; state.bear.col = c;
        }
      }
      requestRender();
    });
    canvas.addEventListener('mouseup', () => { dragging = null; });
    canvas.addEventListener('mouseleave', () => { dragging = null; });
```

注意变化：
- 移除 `lastClickCell/lastClickTime`（不再需要双击检测）。
- 旗帜分支：hit→Shift切换锁定/否则删除；无 hit 且可放→新建。**移除旗帜拖动**。
- 玩家分支：先命中已落座玩家→取消座位；否则放置第一个未落座。
- mousemove 只剩 bear 拖动（移除 banner 拖动分支）。
- 移除整块 contextmenu/entityAt/deleteEntity/hideMenu/menu 变量。

- [ ] **Step 3: node --check + 全套测试**

Run: `node --check js/editor.js && node --test`
Expected: 无语法错误，21/21 PASS。

- [ ] **Step 4: 提交**

```bash
git add js/editor.js index.html
git commit -m "refactor(editor): click-same-tool-to-delete, shift-click banner lock, remove context menu"
```

---

### Task R2: 浏览器验证

**Files:** 无

- [ ] **Step 1** 浏览器（强制刷新 ignoreCache）验证：
1. 旗帜工具点空格→新建；点已有旗帜→删除；Shift+点已有旗帜→金边锁定/解锁。
2. 玩家工具点空格→放置；点已落座玩家→取消座位（变回未落座）。
3. 障碍工具点空格→涂；点已有障碍格→擦除。
4. 右键→浏览器默认菜单（不再有自定义菜单）；#ctx-menu 不存在。
5. 重置按钮→二次确认→全清。
6. 严格/最小排位、导入导出、图片导出正常。

---

## Self-Review

**1. 覆盖：**
- 同工具再点删除（旗帜/玩家）→ R1 ✓；障碍已有 ✓
- 移除右键菜单 → R1 ✓
- 旗帜锁定换 Shift+点击 → R1 ✓
- 重置按钮 → 保留（D2 已做）✓

**2. 占位：** 无。R2 验证清单。

**3. 一致性：** mousedown 分支语义清晰；不再有 lastClickCell/dragging.banner。
