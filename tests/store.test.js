import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../js/store.js';

test('initial state defaults', () => {
  const s = Store.create();
  const st = s.get();
  assert.equal(st.mode, 'strict');
  assert.deepEqual(st.bear, { row: 0, col: 0 });
  assert.equal(st.banner.fixed, false);
  assert.equal(s.canUndo(), false);
});

test('push/undo/redo', () => {
  const s = Store.create();
  s.push(); // snapshot initial
  s.get().bear.row = 5;
  assert.equal(s.get().bear.row, 5);
  s.undo();
  assert.equal(s.get().bear.row, 0);
  assert.equal(s.canRedo(), true);
  s.redo();
  assert.equal(s.get().bear.row, 5);
});
