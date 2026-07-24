import { Store } from './store.js';
import { Renderer } from './renderer.js';
import { Editor } from './editor.js';
import { Exporter } from './exporter.js';
import { StrictSolver } from './strictSolver.js';
import { MinimalSolver } from './minimalSolver.js';
import { Geometry } from './geometry.js';

const store = Store.create();
let tool = 'bear';
let cellSize = 40;
let lastOldPlacement = {};
let selectedPlayerId = null;

const canvas = document.getElementById('canvas');
const $ = (id) => document.getElementById(id);

function getView() {
  const state = store.get();
  const placed = Object.values(state.placement);
  return Geometry.computeView(state, placed, state.minView);
}

function render() {
  Renderer.draw(canvas, store, { cellSize, view: getView() });
  renderPlayerList();
}

function renderPlayerList() {
  const ul = $('player-list');
  ul.innerHTML = '';
  const state = store.get();
  state.players.forEach((p, i) => {
    p.priority = i + 1;
    const li = document.createElement('li');
    li.draggable = true;
    li.dataset.id = p.id;
    if (p.id === selectedPlayerId) li.style.background = '#bfdbfe';
    li.innerHTML = `<span>${i + 1}.</span><input value="${p.name}" data-id="${p.id}" class="pname" style="flex:1">
      <input type="checkbox" data-id="${p.id}" class="pfix" ${p.fixed ? 'checked' : ''}>
      <button data-id="${p.id}" class="pdel">×</button>`;
    ul.appendChild(li);
  });
  // drag to reorder
  let dragId = null;
  ul.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', (e) => {
      if (e.target.closest('input, button')) return; // ignore clicks on name/checkbox/delete
      selectedPlayerId = (selectedPlayerId === li.dataset.id) ? null : li.dataset.id;
      render();
    });
    li.addEventListener('dragstart', () => dragId = li.dataset.id);
    li.addEventListener('dragover', (e) => e.preventDefault());
    li.addEventListener('drop', () => {
      const state = store.get();
      const from = state.players.findIndex(p => p.id === dragId);
      const to = state.players.findIndex(p => p.id === li.dataset.id);
      if (from < 0 || to < 0 || from === to) return;
      store.push();
      const [moved] = state.players.splice(from, 1);
      state.players.splice(to, 0, moved);
      render();
    });
  });
  ul.querySelectorAll('.pname').forEach(inp => inp.addEventListener('change', (e) => {
    const p = store.get().players.find(p => p.id === e.target.dataset.id);
    store.push(); p.name = e.target.value;
  }));
  ul.querySelectorAll('.pfix').forEach(inp => inp.addEventListener('change', (e) => {
    const state = store.get();
    const p = state.players.find(p => p.id === e.target.dataset.id);
    store.push();
    p.fixed = e.target.checked;
    if (p.fixed && state.placement[p.id]) p.fixedCell = state.placement[p.id];
    if (!p.fixed) p.fixedCell = null;
  }));
  ul.querySelectorAll('.pdel').forEach(b => b.addEventListener('click', (e) => {
    const state = store.get();
    const idx = state.players.findIndex(p => p.id === e.target.dataset.id);
    if (idx < 0) return;
    store.push();
    const [removed] = state.players.splice(idx, 1);
    delete state.placement[removed.id];
    if (selectedPlayerId === removed.id) selectedPlayerId = null;
    render();
  }));
}

Editor.init(canvas, store, () => tool, render, () => cellSize, getView, () => {
  const p = store.get().players.find(p => p.id === selectedPlayerId);
  return p || null;
}, () => { selectedPlayerId = null; }); // onPlayerPlaced: clear selection after a manual place

document.querySelectorAll('.tool').forEach(b => b.addEventListener('click', () => {
  tool = b.dataset.tool;
  document.querySelectorAll('.tool').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
}));

$('btn-undo').addEventListener('click', () => { store.undo(); render(); });
$('btn-redo').addEventListener('click', () => { store.redo(); render(); });
$('btn-save').addEventListener('click', () => Exporter.saveJSON(store));
$('btn-load').addEventListener('click', () => $('file-input').click());
$('file-input').addEventListener('change', (e) => {
  const f = e.target.files[0]; if (!f) return;
  Exporter.loadJSON(f, store, render);
  e.target.value = '';
});
$('btn-import-names').addEventListener('click', () => {
  const text = prompt('粘贴玩家名单，每行一个：');
  if (text) { Exporter.importNames(text, store); render(); }
});
document.querySelectorAll('input[name=mode]').forEach(r => r.addEventListener('change', (e) => {
  store.get().mode = e.target.value;
}));
$('zoom').addEventListener('input', (e) => { cellSize = +e.target.value; render(); });

$('btn-solve').addEventListener('click', () => {
  const state = store.get();
  lastOldPlacement = JSON.parse(JSON.stringify(state.placement));
  store.push();
  const sorted = [...state.players];
  if (state.mode === 'strict') {
    const res = StrictSolver.solve(state, sorted);
    state.placement = res.placement;
    if (res.error) alert(res.error + '\n未放置：' + res.unplaced.join(', '));
  } else {
    const res = MinimalSolver.solve(state, sorted, lastOldPlacement);
    state.placement = res.placement;
    if (res.error) alert(res.error);
  }
  render();
});
$('btn-clear').addEventListener('click', () => {
  store.push();
  const state = store.get();
  for (const p of state.players) if (!p.fixed) delete state.placement[p.id];
  render();
});
$('btn-final').addEventListener('click', () => Exporter.exportFinalImage(store));
$('btn-changes').addEventListener('click', () => Exporter.exportChangesImage(store, lastOldPlacement));
$('btn-reset') && $('btn-reset').addEventListener('click', () => {
  if (!confirm('重置将清空所有旗帜/障碍/玩家/排位，熊坑归位。确认？')) return;
  store.push();
  const state = store.get();
  state.bear = { row: 0, col: 0 };
  state.banners = [{ id: 'b1', row: 3, col: 0, fixed: false }];
  state.obstacles = [];
  state.players = [];
  state.placement = {};
  lastOldPlacement = {};
  render();
});

render();
