import { Geometry } from './geometry.js';
import { Renderer } from './renderer.js';

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
        if (!obj.bear || !Array.isArray(obj.banners)) throw new Error('无效的项目文件');
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
  },

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
    // NOTE: Renderer.draw already called ctx.scale(dpr, dpr) using window.devicePixelRatio,
    // and reset canvas.width/height. Do NOT scale again here — a second ctx.scale(dpr, dpr)
    // would double-scale all overlay coordinates and clobber the logical space Renderer set up.
    // All toPx / strokeRect / arrow calls below operate in the same CSS-pixel logical space
    // Renderer.draw uses: toPx(r,c) = [(c - view.minCol) * cellSize, (r - view.minRow) * cellSize]
    // is the top-left of cell (r,c). The brief's toPx helper below adds +cellSize to return the
    // CENTER of a 2x2 player block anchored at (r,c); strokeRect then subtracts cellSize to get
    // back to top-left. This aligns overlays with the grid Renderer painted.
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
};
