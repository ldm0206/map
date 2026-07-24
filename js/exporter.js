export const Exporter = {
  saveJSON(store) {
    const data = JSON.stringify(store.get(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bear-rally-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  loadJSON(file, store, onLoaded) {
    if (!confirm('加载项目将覆盖当前状态，确认？')) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        if (!obj.bear || !obj.banner) throw new Error('无效的项目文件');
        store.push();
        const state = store.get();
        Object.assign(state, obj);
        onLoaded();
      } catch (err) { alert('加载失败：' + err.message); }
    };
    reader.readAsText(file);
  },

  importNames(text, store) {
    const names = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    store.push();
    const state = store.get();
    let prio = state.players.length;
    for (const name of names) {
      state.players.push({ id: 'p' + Date.now() + Math.random().toString(36).slice(2, 6), name, priority: ++prio, fixed: false });
    }
  }
};
