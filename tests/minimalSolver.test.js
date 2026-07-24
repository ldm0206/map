import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MinimalSolver } from '../js/minimalSolver.js';

const state = { bear: { row: 0, col: 0 }, banners: [{ id: 'b1', row: 3, col: 0, fixed: true }], obstacles: [] };

test('minimal keeps existing players in place when possible', () => {
  const players = [
    { id: 'p1', name: 'A', priority: 1, fixed: false },
    { id: 'p2', name: 'B', priority: 2, fixed: false }
  ];
  // [0,-2] and [3,2] are valid in-coverage buildable 2x2 cells (validated against Geometry)
  const old = { p1: [0, -2], p2: [3, 2] };
  const res = MinimalSolver.solve(state, players, old);
  assert.deepEqual(res.placement.p1, [0, -2]);
  assert.deepEqual(res.placement.p2, [3, 2]);
  assert.equal(res.moves.filter(m => m.playerId === 'p1' || m.playerId === 'p2').length, 0);
});

test('minimal moves player when old cell blocked by fixed', () => {
  const players = [
    { id: 'p1', name: 'A', priority: 1, fixed: true, fixedCell: [0, -2] },
    { id: 'p2', name: 'B', priority: 2, fixed: false }
  ];
  // p2's old cell [0,-2] is now p1's fixed cell, so p2 must move
  const old = { p1: [0, -2], p2: [0, -2] };
  const res = MinimalSolver.solve(state, players, old);
  assert.deepEqual(res.placement.p1, [0, -2]);
  const [r, c] = res.placement.p2;
  // p2's 2x2 must not overlap p1's 2x2 at [0,-2] (cells rows0-1 cols-2..-1)
  const p1cells = [[0,-2],[0,-1],[1,-2],[1,-1]];
  const p2cells = [[r,c],[r,c+1],[r+1,c],[r+1,c+1]];
  const overlap = p2cells.some(a => p1cells.some(b => a[0]===b[0] && a[1]===b[1]));
  assert.equal(overlap, false);
  const move = res.moves.find(m => m.playerId === 'p2');
  assert.ok(move);
  assert.deepEqual(move.from, [0, -2]);
});

test('minimal handles new player with no move penalty', () => {
  const players = [
    { id: 'p1', name: 'A', priority: 1, fixed: false },
    { id: 'p2', name: 'B', priority: 2, fixed: false }
  ];
  const old = { p1: [0, -2] };
  const res = MinimalSolver.solve(state, players, old);
  assert.deepEqual(res.placement.p1, [0, -2]);
  assert.ok(res.placement.p2);
  const moveP2 = res.moves.find(m => m.playerId === 'p2');
  assert.equal(moveP2.from, null);
});
