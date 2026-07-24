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
  }
};
