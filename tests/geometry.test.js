import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Geometry } from '../js/geometry.js';

test('distance from player at bear center is small', () => {
  // bear at (0,0), 3x3 occupies rows0-2 cols0-2, center=(1,1)
  // player 2x2 at (3,3): center=(3.5,3.5); distance to (1,1)=sqrt(2.5^2+2.5^2)
  const d = Geometry.distance([3, 3], { row: 0, col: 0 });
  assert.ok(Math.abs(d - Math.hypot(2.5, 2.5)) < 1e-9);
});

test('buildableCells excludes bear, banner, obstacles', () => {
  const state = {
    bear: { row: 0, col: 0 },
    banner: { row: 3, col: 0, fixed: false },
    obstacles: [{ id: 'o1', type: 'mine', cells: [[5, 5]] }]
  };
  const cells = Geometry.buildableCells(state, []);
  // bear cells rows0-2 cols0-2 not buildable
  assert.equal(cells.has('0,0'), false);
  assert.equal(cells.has('2,2'), false);
  // banner cell not buildable
  assert.equal(cells.has('3,0'), false);
  // mine not buildable
  assert.equal(cells.has('5,5'), false);
  // a free cell is buildable
  assert.equal(cells.has('3,3'), true);
});

test('buildableCells excludes fixed player 2x2', () => {
  const state = {
    bear: { row: 0, col: 0 },
    banner: { row: 3, col: 0, fixed: false },
    obstacles: []
  };
  const cells = Geometry.buildableCells(state, [[4, 4]]);
  // fixed player occupies 4,4 4,5 5,4 5,5
  assert.equal(cells.has('4,4'), false);
  assert.equal(cells.has('5,5'), false);
  assert.equal(cells.has('4,6'), true);
});

test('candidateCells returns sorted 2x2 left corners', () => {
  const state = {
    bear: { row: 0, col: 0 },
    banner: { row: 3, col: 0, fixed: false },
    obstacles: []
  };
  const cands = Geometry.candidateCells(state, []);
  // (0,3): cells (0,3)(0,4)(1,3)(1,4) — none in bear, none banner → valid
  assert.ok(cands.some(([r, c]) => r === 0 && c === 3));
  // (0,0) invalid (bear)
  assert.ok(!cands.some(([r, c]) => r === 0 && c === 0));
  // sorted
  for (let i = 1; i < cands.length; i++) {
    const [pr, pc] = cands[i - 1], [cr, cc] = cands[i];
    assert.ok(pr < cr || (pr === cr && pc <= cc));
  }
});

test('bannerCoverage is 7x7 centered on banner', () => {
  const cov = Geometry.bannerCoverage({ row: 5, col: 5 });
  // 7x7 centered: rows 5-3=2..5+3=8
  assert.equal(cov.minRow, 2); assert.equal(cov.maxRow, 8);
  assert.equal(cov.minCol, 2); assert.equal(cov.maxCol, 8);
});

test('computeView expands and respects minView', () => {
  const state = { bear: { row: 0, col: 0 }, banner: { row: 3, col: 0 }, obstacles: [] };
  const v = Geometry.computeView(state, [[6, 6]], null);
  // bear rows0-2, banner row3, player row6-7 → maxRow 7, +1 = 8; min 0-1=-1
  assert.equal(v.maxRow, 8);
  assert.equal(v.minRow, -1);
  const v2 = Geometry.computeView(state, [], { w: 20, h: 20 });
  // minView 20x20 centered around content → at least 20 wide
  assert.ok(v2.maxRow - v2.minRow + 1 >= 20);
});

test('overlapsRect detects overlap', () => {
  assert.equal(Geometry.overlapsRect({minRow:0,minCol:0,maxRow:2,maxCol:2}, {minRow:2,minCol:2,maxRow:4,maxCol:4}), true);
  assert.equal(Geometry.overlapsRect({minRow:0,minCol:0,maxRow:1,maxCol:1}, {minRow:3,minCol:3,maxRow:4,maxCol:4}), false);
});
