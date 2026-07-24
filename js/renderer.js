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
    ctx.fillStyle = '#fff'; ctx.font = `${cell * 0.4}px sans-serif`;
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
