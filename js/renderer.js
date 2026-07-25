import { Geometry } from './geometry.js';

const COLORS = {
  grid: '#D6CDBB',
  bear: '#7B2D26',
  banner: '#E8B84B',
  coverage: 'rgba(232, 184, 75, 0.10)',
  coverageBorder: '#C08A35',
  mountain: '#6B7280',
  lake: '#4A90D9',
  mine: '#8B5CF6',
  playerRings: ['#3D9970', '#2E86C1', '#9B59B6', '#E67E22', '#16A085'],
  playerRingBorders: ['#1F5C40', '#1B4F72', '#5B2C6F', '#9C4A0F', '#0B5345'],
  playerIdText: 'rgba(31, 26, 20, 0.55)',
  fixed: '#F59E0B',
  text: '#1F1A14'
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
    for (const bn of state.banners || []) {
      const cov = Geometry.bannerCoverage(bn);
      let [cx, cy] = toPx(cov.minRow, cov.minCol);
      ctx.fillStyle = COLORS.coverage;
      ctx.fillRect(cx, cy, 7 * cell, 7 * cell);
      ctx.strokeStyle = COLORS.coverageBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, cy, 7 * cell, 7 * cell);
    }

    // grid
    ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 0.5;
    for (let r = view.minRow; r <= view.maxRow + 1; r++) {
      let [x1, y1] = toPx(r, view.minCol); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + w, y1); ctx.stroke();
    }
    for (let c = view.minCol; c <= view.maxCol + 1; c++) {
      let [x1, y1] = toPx(view.minRow, c); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1, y1 + h); ctx.stroke();
    }

    // obstacles (mountain / lake) with per-component labels
    for (const o of state.obstacles) {
      ctx.fillStyle = COLORS[o.type] || '#888';
      for (const [r, c] of o.cells) {
        let [x, y] = toPx(r, c);
        ctx.fillRect(x, y, cell, cell);
      }
      const label = o.type === 'mountain' ? '山' : (o.type === 'lake' ? '湖' : '');
      if (label && o.cells.length) {
        const groups = Geometry.connectedComponents(o.cells);
        ctx.fillStyle = '#fff';
        ctx.font = `600 ${cell * 0.45}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (const g of groups) {
          let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
          for (const [r, c] of g) {
            if (r < minR) minR = r; if (r > maxR) maxR = r;
            if (c < minC) minC = c; if (c > maxC) maxC = c;
          }
          const cx = (minC + maxC + 1) / 2, cy = (minR + maxR + 1) / 2;
          const [px, py] = toPx(cy, cx);
          ctx.fillText(label, px, py);
        }
      }
    }

    // mines 2x2
    for (const m of state.mines || []) {
      let [mx, my] = toPx(m.row, m.col);
      ctx.fillStyle = COLORS.mine;
      ctx.fillRect(mx, my, 2 * cell, 2 * cell);
      ctx.fillStyle = '#fff';
      ctx.font = `600 ${cell * 0.5}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('矿', mx + cell, my + cell);
    }

    // bear 3x3
    let [bx, by] = toPx(state.bear.row, state.bear.col);
    ctx.fillStyle = COLORS.bear;
    ctx.fillRect(bx, by, 3 * cell, 3 * cell);
    ctx.fillStyle = '#fff'; ctx.font = `${cell * 0.4}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('熊', bx + 1.5 * cell, by + 1.5 * cell);

    // banner
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

    // players
    for (const p of state.players) {
      const cell0 = state.placement[p.id];
      if (!cell0) continue;
      let [x, y] = toPx(cell0[0], cell0[1]);
      const dist = Geometry.distance(cell0, state.bear);
      const ring = Math.max(0, Math.floor(dist / 2)) % COLORS.playerRings.length;
      const bodyColor = p.fixed ? COLORS.fixed : COLORS.playerRings[ring];
      const borderColor = p.fixed ? COLORS.fixed : COLORS.playerRingBorders[ring];
      ctx.fillStyle = bodyColor;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(x, y, 2 * cell, 2 * cell);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = borderColor; ctx.lineWidth = 1;
      ctx.strokeRect(x, y, 2 * cell, 2 * cell);
      ctx.fillStyle = COLORS.text;
      ctx.font = `600 ${cell * 0.4}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.name, x + cell, y + cell * 0.85);
      ctx.fillStyle = COLORS.playerIdText;
      ctx.font = `${cell * 0.18}px sans-serif`;
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(`#${p.priority}`, x + 2 * cell - 3, y + 2 * cell - 2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    }
  }
};
