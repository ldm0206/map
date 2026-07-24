### Task 1: 初始化仓库与项目骨架

**Files:**
- Create: `D:\PythonProject\map\index.html`
- Create: `D:\PythonProject\map\js\geometry.js`
- Create: `D:\PythonProject\map\js\store.js`
- Create: `D:\PythonProject\map\package.json`
- Create: `D:\PythonProject\map\.gitignore`

**Interfaces:**
- Produces: `Geometry`、`Store` 对象占位（空导出），供后续任务填充。

- [ ] **Step 1: git init**

Run:
```bash
cd /d/PythonProject/map
git init
```
Expected: 初始化空仓库。

- [ ] **Step 2: 写 package.json**

`D:\PythonProject\map\package.json`:
```json
{
  "name": "bear-rally-seat-planner",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 3: 写 .gitignore**

`D:\PythonProject\map\.gitignore`:
```
node_modules/
*.log
```

- [ ] **Step 4: 写 geometry.js 占位**

`D:\PythonProject\map\js\geometry.js`:
```js
export const Geometry = {};
```

- [ ] **Step 5: 写 store.js 占位**

`D:\PythonProject\map\js\store.js`:
```js
export const Store = {};
```

- [ ] **Step 6: 写 index.html 骨架**

`D:\PythonProject\map\index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>熊坑排座</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; display: flex; flex-direction: column; height: 100vh; }
    #topbar { display: flex; gap: 8px; padding: 8px; background: #1f2937; color: #fff; }
    #main { display: flex; flex: 1; overflow: hidden; }
    #leftbar { width: 140px; padding: 8px; background: #f3f4f6; overflow-y: auto; }
    #canvas-wrap { flex: 1; overflow: auto; background: #e5e7eb; }
    #rightbar { width: 280px; padding: 8px; background: #f3f4f6; overflow-y: auto; }
    .tool { display: block; width: 100%; margin-bottom: 4px; padding: 6px; text-align: left; }
    .tool.active { background: #3b82f6; color: #fff; }
    #player-list { list-style: none; padding: 0; margin: 8px 0; }
    #player-list li { display: flex; align-items: center; gap: 4px; padding: 4px; border: 1px solid #d1d5db; margin-bottom: 2px; background: #fff; }
  </style>
</head>
<body>
  <div id="topbar">
    <b>熊坑排座</b>
    <button id="btn-load">加载项目</button>
    <button id="btn-save">导出项目</button>
    <button id="btn-final">最终图</button>
    <button id="btn-changes">变动图</button>
    <input id="zoom" type="range" min="20" max="80" value="40">
  </div>
  <div id="main">
    <div id="leftbar">
      <div>工具</div>
      <button class="tool" data-tool="bear">熊坑</button>
      <button class="tool" data-tool="banner">旗帜</button>
      <button class="tool" data-tool="mountain">山</button>
      <button class="tool" data-tool="lake">湖</button>
      <button class="tool" data-tool="mine">矿</button>
      <button class="tool" data-tool="player">手动放玩家</button>
      <hr>
      <button id="btn-undo">撤销</button>
      <button id="btn-redo">重做</button>
    </div>
    <div id="canvas-wrap">
      <canvas id="canvas"></canvas>
    </div>
    <div id="rightbar">
      <div>玩家优先级（顶部最高）</div>
      <ul id="player-list"></ul>
      <button id="btn-import-names">批量导入名单</button>
      <hr>
      <div>模式</div>
      <label><input type="radio" name="mode" value="strict" checked> 严格</label>
      <label><input type="radio" name="mode" value="minimal"> 最小修改</label>
      <button id="btn-solve">一键排位</button>
      <button id="btn-clear">清空排位</button>
    </div>
  </div>
  <input id="file-input" type="file" accept=".json" style="display:none">
  <script type="module" src="js/ui.js"></script>
</body>
</html>
```

- [ ] **Step 7: 提交**

Run:
```bash
git add .
git commit -m "chore: init repo skeleton"
```
Expected: 提交成功。

---

