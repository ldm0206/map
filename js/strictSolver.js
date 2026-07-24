import { Geometry } from './geometry.js';

export const StrictSolver = {
  solve(state, players) {
    const placement = {};
    const occupiedByFixed = [];
    for (const p of players) {
      if (p.fixed && p.fixedCell) {
        placement[p.id] = p.fixedCell;
        occupiedByFixed.push(p.fixedCell);
      }
    }
    const allCands = Geometry.candidateCells(state, occupiedByFixed)
      .filter(cell => Geometry.inCoverage(cell, state.banners));
    const taken = new Set(); // occupied 2x2 corner keys
    const overlapsTaken = (cell) => {
      const [r, c] = cell;
      for (const [tr, tc] of taken) {
        if (Math.abs(r - tr) < 2 && Math.abs(c - tc) < 2) return true;
      }
      return false;
    };
    const unplaced = [];
    for (const p of players) {
      if (p.fixed && p.fixedCell) continue;
      let best = null, bestD = Infinity;
      for (const cell of allCands) {
        if (overlapsTaken(cell)) continue;
        const d = Geometry.distance(cell, state.bear);
        if (d < bestD - 1e-12 || (Math.abs(d - bestD) < 1e-12 && (best === null || cell[0] < best[0] || (cell[0] === best[0] && cell[1] < best[1])))) {
          bestD = d; best = cell;
        }
      }
      if (best === null) { unplaced.push(p.id); continue; }
      placement[p.id] = best;
      taken.add(best);
    }
    const result = { placement, unplaced };
    if (unplaced.length) result.error = `${unplaced.length} 名玩家无法放置（容量不足）`;
    return result;
  }
};
