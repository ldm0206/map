export const Geometry = {
  distance(playerCell, bear) {
    const [r, c] = playerCell;
    const cx = c + 0.5;
    const cy = r + 0.5;
    const bx = bear.col + 1;
    const by = bear.row + 1;
    return Math.hypot(cx - bx, cy - by);
  },

  buildableCells(state, occupiedByFixed) {
    const blocked = new Set();
    const add = (r, c) => blocked.add(`${r},${c}`);
    // bear 3x3
    for (let r = state.bear.row; r < state.bear.row + 3; r++)
      for (let c = state.bear.col; c < state.bear.col + 3; c++) add(r, c);
    // banners
    for (const bn of state.banners || []) add(bn.row, bn.col);
    // obstacles
    for (const o of state.obstacles || [])
      for (const [r, c] of o.cells) add(r, c);
    // fixed players 2x2
    for (const [fr, fc] of occupiedByFixed || []) {
      add(fr, fc); add(fr, fc + 1); add(fr + 1, fc); add(fr + 1, fc + 1);
    }
    // buildable = map cells minus blocked. Map size computed by caller via computeView;
    // here we return blocked set inverted over a bounding region derived from state.
    // Determine bounding region: union of bear, banners, obstacles, fixed, expanded by 8.
    const rows = [], cols = [];
    for (let r = state.bear.row; r < state.bear.row + 3; r++) { rows.push(r); cols.push(state.bear.col); cols.push(state.bear.col+2); }
    for (const bn of state.banners || []) { rows.push(bn.row); cols.push(bn.col); }
    for (const o of state.obstacles || []) for (const [r,c] of o.cells) { rows.push(r); cols.push(c); }
    for (const [fr, fc] of occupiedByFixed || []) { rows.push(fr); rows.push(fr+1); cols.push(fc); cols.push(fc+1); }
    const minR = Math.min(...rows) - 8, maxR = Math.max(...rows) + 8;
    const minC = Math.min(...cols) - 8, maxC = Math.max(...cols) + 8;
    const result = new Set();
    for (let r = minR; r <= maxR; r++)
      for (let c = minC; c <= maxC; c++)
        if (!blocked.has(`${r},${c}`)) result.add(`${r},${c}`);
    return result;
  },

  candidateCells(state, occupiedByFixed) {
    const buildable = this.buildableCells(state, occupiedByFixed);
    // bounding region from buildable set
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const k of buildable) {
      const [r, c] = k.split(',').map(Number);
      if (r < minR) minR = r; if (r > maxR) maxR = r;
      if (c < minC) minC = c; if (c > maxC) maxC = c;
    }
    const result = [];
    for (let r = minR; r <= maxR - 1; r++)
      for (let c = minC; c <= maxC - 1; c++) {
        if (buildable.has(`${r},${c}`) && buildable.has(`${r},${c+1}`)
            && buildable.has(`${r+1},${c}`) && buildable.has(`${r+1},${c+1}`)) {
          result.push([r, c]);
        }
      }
    result.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return result;
  },

  bannerCoverage(banner) {
    return { minRow: banner.row - 3, minCol: banner.col - 3, maxRow: banner.row + 3, maxCol: banner.col + 3 };
  },

  overlapsRect(a, b) {
    return !(a.maxRow < b.minRow || b.maxRow < a.minRow || a.maxCol < b.minCol || b.maxCol < a.minCol);
  },

  computeView(state, placedPlayers, minView) {
    const rows = [], cols = [];
    for (let r = state.bear.row; r < state.bear.row + 3; r++) { rows.push(r); cols.push(state.bear.col); cols.push(state.bear.col+2); }
    for (const bn of state.banners || []) {
      rows.push(bn.row); cols.push(bn.col);
      const cov = this.bannerCoverage(bn);
      rows.push(cov.minRow, cov.maxRow); cols.push(cov.minCol, cov.maxCol);
    }
    for (const o of state.obstacles || []) for (const [r, c] of o.cells) { rows.push(r); cols.push(c); }
    for (const [r, c] of placedPlayers || []) { rows.push(r, r + 1); cols.push(c, c + 1); }
    let minR = Math.min(...rows) - 1, maxR = Math.max(...rows) + 1;
    let minC = Math.min(...cols) - 1, maxC = Math.max(...cols) + 1;
    if (minView) {
      const curW = maxC - minC + 1, curH = maxR - minR + 1;
      if (curW < minView.w) { const extra = minView.w - curW; minC -= Math.floor(extra / 2); maxC += Math.ceil(extra / 2); }
      if (curH < minView.h) { const extra = minView.h - curH; minR -= Math.floor(extra / 2); maxR += Math.ceil(extra / 2); }
    }
    return { minRow: minR, minCol: minC, maxRow: maxR, maxCol: maxC };
  },

  canPlace(state, occupiedByFixed, cell) {
    const [r, c] = cell;
    const b = this.buildableCells(state, occupiedByFixed);
    return b.has(`${r},${c}`) && b.has(`${r},${c+1}`) && b.has(`${r+1},${c}`) && b.has(`${r+1},${c+1}`);
  },

  inCoverage(cell, banners) {
    const [r, c] = cell;
    for (const bn of banners || []) {
      const cov = this.bannerCoverage(bn);
      const inside = (rr, cc) => rr >= cov.minRow && rr <= cov.maxRow && cc >= cov.minCol && cc <= cov.maxCol;
      if (inside(r, c) && inside(r, c+1) && inside(r+1, c) && inside(r+1, c+1)) return true;
    }
    return false;
  },

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
};
