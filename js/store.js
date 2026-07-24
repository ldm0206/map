const clone = (o) => JSON.parse(JSON.stringify(o));

const initial = () => ({
  bear: { row: 0, col: 0 },
  banner: { row: 3, col: 0, fixed: false },
  obstacles: [],
  players: [],
  placement: {},
  mode: 'strict',
  minView: null
});

export const Store = {
  create() {
    let state = initial();
    const undoStack = [];
    const redoStack = [];
    return {
      get() { return state; },
      canUndo() { return undoStack.length > 0; },
      canRedo() { return redoStack.length > 0; },
      push() { undoStack.push(clone(state)); redoStack.length = 0; },
      undo() {
        if (!undoStack.length) return;
        redoStack.push(clone(state));
        state = undoStack.pop();
      },
      redo() {
        if (!redoStack.length) return;
        undoStack.push(clone(state));
        state = redoStack.pop();
      }
    };
  }
};
