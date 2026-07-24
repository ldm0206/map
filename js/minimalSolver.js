import { Geometry } from './geometry.js';

// Hungarian algorithm (Kuhn-Munkres) for square cost matrix. Returns assignment: row->col.
function hungarian(cost) {
  const n = cost.length;
  if (n === 0) return [];
  const m = cost[0].length;
  const INF = Infinity;
  // pad to square
  const size = Math.max(n, m);
  const c = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => i < n && j < m ? cost[i][j] : 0));
  const u = new Array(size + 1).fill(0);
  const v = new Array(size + 1).fill(0);
  const p = new Array(size + 1).fill(0);
  const way = new Array(size + 1).fill(0);
  for (let i = 1; i <= size; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(size + 1).fill(INF);
    const used = new Array(size + 1).fill(false);
    do {
      used[j0] = true;
      let i0 = p[j0], delta = INF, j1 = -1;
      for (let j = 1; j <= size; j++) {
        if (!used[j]) {
          const cur = c[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
          if (minv[j] < delta) { delta = minv[j]; j1 = j; }
        }
      }
      for (let j = 0; j <= size; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; }
        else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0 !== 0);
  }
  const assignment = new Array(n).fill(-1);
  for (let j = 1; j <= size; j++) {
    if (p[j] !== 0 && p[j] - 1 < n && j - 1 < m) assignment[p[j] - 1] = j - 1;
  }
  return assignment;
}

export const MinimalSolver = {
  solve(state, players, oldPlacement) {
    oldPlacement = oldPlacement || {};
    const placement = {};
    const occupiedByFixed = [];
    for (const p of players) {
      if (p.fixed && p.fixedCell) {
        placement[p.id] = p.fixedCell;
        occupiedByFixed.push(p.fixedCell);
      }
    }
    const movable = players.filter(p => !(p.fixed && p.fixedCell));
    const cands = Geometry.candidateCells(state, occupiedByFixed)
      .filter(cell => Geometry.inCoverage(cell, state.banner));
    if (movable.length === 0) return { placement, unplaced: [], moves: [] };
    if (cands.length < movable.length) {
      return { placement, unplaced: movable.map(p => p.id), moves: [], error: '容量不足' };
    }
    const M = 1e6;
    const cost = movable.map(p => {
      const oldCell = oldPlacement[p.id];
      return cands.map(cell => {
        const base = Geometry.distance(cell, state.bear);
        if (oldCell && oldCell[0] === cell[0] && oldCell[1] === cell[1]) return 0;
        if (oldCell) return base + M;
        return base;
      });
    });
    const assign = hungarian(cost);
    const moves = [];
    const unplaced = [];
    movable.forEach((p, i) => {
      const ci = assign[i];
      if (ci < 0 || ci >= cands.length) { unplaced.push(p.id); return; }
      const cell = cands[ci];
      placement[p.id] = cell;
      const oldCell = oldPlacement[p.id];
      if (!oldCell || oldCell[0] !== cell[0] || oldCell[1] !== cell[1]) {
        moves.push({ playerId: p.id, from: oldCell || null, to: cell });
      }
    });
    return { placement, unplaced, moves };
  }
};
