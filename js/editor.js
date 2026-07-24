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
