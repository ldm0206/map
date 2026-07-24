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
        if (Geometry.canPlaceEntity(state, fixedCells, 'bear', [r, c], { ignoreSelf: { kind: 'bear', cell: [state.bear.row, state.bear.col] } })) {
          state.bear.row = r; state.bear.col = c;
        }
      } else if (dragging.type === 'banner') {
        // temporarily move banner, check overlap excluding itself
        const bn = state.banners.find(b => b.id === dragging.id);
        if (bn && Geometry.canPlaceEntity(state, fixedCells, 'banner', [r, c], { ignoreSelf: { kind: 'banner', cell: [bn.row, bn.col] } })) {
          bn.row = r; bn.col = c;
        }
      }
      requestRender();
    });
    canvas.addEventListener('mouseup', () => { dragging = null; });
    canvas.addEventListener('mouseleave', () => { dragging = null; });

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
  }
};
