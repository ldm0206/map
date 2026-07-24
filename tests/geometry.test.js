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
