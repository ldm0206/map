import { Geometry } from './geometry.js';

function cellFromEvent(e, canvas, view, cellSize) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  const c = Math.floor(x / cellSize) + view.minCol;
  const r = Math.floor(y / cellSize) + view.minRow;
  return [r, c];
}

export const Editor = {
  init(canvas, store, getTool, requestRender, getCellSize, getView, getSelectedPlayer, onPlayerPlaced) {
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
      } else if (tool === 'mine') {
        state.mines = state.mines || [];
        const hitMine = state.mines.find(m => r >= m.row && r <= m.row + 1 && c >= m.col && c <= m.col + 1);
        if (hitMine) {
          store.push();
          const idx = state.mines.indexOf(hitMine);
          if (idx >= 0) state.mines.splice(idx, 1);
        } else if (Geometry.canPlaceEntity(state, fixedCells, 'mine', [r, c])) {
          store.push();
          state.mines.push({ id: 'm' + Date.now() + Math.random().toString(36).slice(2, 5), row: r, col: c });
        }
      } else if (['mountain', 'lake'].includes(tool)) {
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
          const sel = getSelectedPlayer ? getSelectedPlayer() : null;
          const target = (sel && !sel.fixed && !state.placement[sel.id])
            ? sel
            : state.players.find(p => !p.fixed && !state.placement[p.id]);
          if (target && Geometry.canPlaceEntity(state, fixedCells, 'player', [r, c])) {
            store.push();
            state.placement[target.id] = [r, c];
            target.fixed = true;
            target.fixedCell = [r, c];
            if (onPlayerPlaced) onPlayerPlaced();
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
  }
};
