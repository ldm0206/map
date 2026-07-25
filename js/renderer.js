import { Geometry } from './geometry.js';

const COLORS = {
  grid: '#D6CDBB',
  bear: '#8B4A42',
  banner: '#D9B974',
  coverage: 'rgba(217, 185, 116, 0.10)',
  coverageBorder: '#B08F4F',
  mountain: '#8B8C89',
  lake: '#7FA8C9',
  mine: '#9B86BD',
  playerRings: ['#C89A6F', '#94AC8B', '#C08A9B', '#8295BC', '#A89B88', '#89A6A9'],
  playerIdText: 'rgba(31, 26, 20, 0.55)',
  fixed: '#C9A961',
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

    // players — dynamic equal-width bucketing over actual distance range
    const seatedDists = [];
    for (const p of state.players) {
      const cell0 = state.placement[p.id];
      if (cell0) seatedDists.push(Geometry.distance(cell0, state.bear));
    }
    const bucketCount = COLORS.playerRings.length;
    let minD = 0, maxD = 1;
    if (seatedDists.length) {
      minD = Math.min(...seatedDists);
      maxD = Math.max(...seatedDists);
      if (maxD - minD < 1e-6) maxD = minD + 1; // avoid zero-width range
    }
    const bucketWidth = (maxD - minD) / bucketCount;
    const ringIndexFor = (dist) => {
      const idx = Math.floor((dist - minD) / bucketWidth);
      return Math.min(bucketCount - 1, Math.max(0, idx));
    };

    for (const p of state.players) {
      const cell0 = state.placement[p.id];
      if (!cell0) continue;
      let [x, y] = toPx(cell0[0], cell0[1]);
      const dist = Geometry.distance(cell0, state.bear);
      const ring = ringIndexFor(dist);
      const bodyColor = COLORS.playerRings[ring];
      ctx.fillStyle = bodyColor;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x, y, 2 * cell, 2 * cell);
      ctx.globalAlpha = 1;
      // white separator between adjacent player blocks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, y + 1.5, 2 * cell - 3, 2 * cell - 3);
      // fixed players get a soft gold frame
      if (p.fixed) {
        ctx.strokeStyle = COLORS.fixed;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 0.5, y + 0.5, 2 * cell - 1, 2 * cell - 1);
      }
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const name = String(p.name);
      const maxWidth = 2 * cell - 6;
      ctx.font = `600 ${cell * 0.4}px sans-serif`;
      if (ctx.measureText(name).width <= maxWidth) {
        ctx.fillText(name, x + cell, y + cell * 0.85);
      } else {
        // split into two lines, prefer break near middle at ASCII space/hyphen
        const mid = Math.floor(name.length / 2);
        let split = -1;
        for (let i = 0; i < name.length - 1; i++) {
          const ch = name[i];
          if (ch === ' ' || ch === '-' || ch === '·' || ch === '_' || ch === '/') {
            if (split < 0 || Math.abs(i + 1 - mid) < Math.abs(split - mid)) split = i + 1;
          }
        }
        if (split <= 0 || split >= name.length) split = mid;
        const line1 = name.slice(0, split).trim();
        const line2 = name.slice(split).trim();
        ctx.font = `600 ${cell * 0.32}px sans-serif`;
        ctx.fillText(line1, x + cell, y + cell * 0.55);
        ctx.fillText(line2, x + cell, y + cell * 1.15);
      }
      ctx.fillStyle = COLORS.playerIdText;
      ctx.font = `${cell * 0.18}px sans-serif`;
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(`#${p.priority}`, x + 2 * cell - 3, y + 2 * cell - 2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    }
  }
};
