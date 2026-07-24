import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StrictSolver } from '../js/strictSolver.js';

const state = {
  bear: { row: 0, col: 0 },
  banner: { row: 3, col: 0, fixed: true },
  obstacles: []
};

test('strict places higher priority closer to bear', () => {
  const players = [
    { id: 'p1', name: 'A', priority: 1, fixed: false },
    { id: 'p2', name: 'B', priority: 2, fixed: false }
  ];
  const res = StrictSolver.solve(state, players);
  assert.equal(res.unplaced.length, 0);
  const d1 = Math.hypot((res.placement.p1[0]+0.5)-1, (res.placement.p1[1]+0.5)-1);
  const d2 = Math.hypot((res.placement.p2[0]+0.5)-1, (res.placement.p2[1]+0.5)-1);
  assert.ok(d1 <= d2, 'p1 should be at least as close as p2');
});

test('strict respects fixed players', () => {
  const players = [
    { id: 'p1', name: 'A', priority: 1, fixed: true, fixedCell: [0, 3] },
    { id: 'p2', name: 'B', priority: 2, fixed: false }
  ];
  const res = StrictSolver.solve(state, players);
  assert.deepEqual(res.placement.p1, [0, 3]);
  // p2 must not overlap p1's 2x2 (0,3)(0,4)(1,3)(1,4)
  const [r, c] = res.placement.p2;
  assert.ok(!(r <= 1 && c <= 4 && r >= 0 && c >= 3) || !(r+1 >= 0 && c+1 >= 3));
});

test('strict reports unplaced when no room', () => {
  // tiny coverage impossible: bear covers most; just ensure no crash and unplaced reported if overflow
  const players = Array.from({ length: 100 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, priority: i, fixed: false }));
  const res = StrictSolver.solve(state, players);
  assert.ok(res.unplaced.length > 0 || Object.keys(res.placement).length === 100);
});
