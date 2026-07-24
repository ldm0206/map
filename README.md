# 无尽冬日熊坑排座

一个纯静态网页工具，为「无尽冬日」（Whiteout Survival）熊集结按优先级排座。

## 打开方式

由于使用 ES 模块（`<script type="module">`），**不能直接双击 `index.html`**（浏览器 file:// 协议会拦截模块加载）。需起一个本地静态服务器：

```bash
cd D:\PythonProject\map
python -m http.server 8000
```

然后浏览器打开 `http://localhost:8000`。

> 也可用任何静态服务器（VS Code Live Server、`npx serve` 等）。

## 功能

- **地图编辑**：熊坑（3×3，全局唯一）、旗帜（1×1，可多个，各管 7×7 覆盖）、山/湖/矿障碍。所有建筑两两不可重叠。
- **排位**：玩家优先级列表（拖拽排序、固定、删除、点选指定），严格模式（贪心）与最小修改模式（匈牙利算法，最小化移动人数）。
- **导入导出**：JSON 项目存档、批量导入玩家名单、最终排位图 PNG、座位变动示意图 PNG。

## 交互速查

| 操作 | 方式 |
|---|---|
| 放熊坑 | 熊坑工具 + 拖动 |
| 放/删旗帜 | 旗帜工具：点空格新建，点已有旗帜删除 |
| 锁定旗帜 | 旗帜工具 + Shift+点旗帜 |
| 涂/擦障碍 | 山/湖/矿工具点格子切换 |
| 放指定玩家 | 列表点选玩家（高亮）→ 玩家工具点地图 |
| 取消玩家座位 | 玩家工具点已落座玩家 |
| 重置 | 顶栏「重置」按钮 |

## 技术栈

原生 JS（ES 模块）、Canvas 2D、`node:test`（纯逻辑单测）。无构建步骤、无运行时依赖。

## 项目结构

```
index.html        页面骨架（三栏布局）
js/geometry.js    候选格、距离、冲突检测、地图扩张（单测）
js/strictSolver.js   严格模式贪心（单测）
js/minimalSolver.js  最小修改匈牙利算法（单测）
js/store.js        状态管理 + 撤销/重做（单测）
js/renderer.js     Canvas 渲染
js/editor.js       工具交互
js/exporter.js     JSON + 图片导入导出
js/ui.js           入口、按钮绑定
tests/             node:test 单测（21 个）
```

跑测试：`npm test`（或 `node --test`）。
