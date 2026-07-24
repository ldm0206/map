# Claude 风格 UI 重构设计

日期：2026-07-25
项目：无尽冬日熊坑排座(D:\PythonProject\map)
范围：整页 UI 重构(布局 + 样式 + 画布调色),不改交互行为

## 目标

把现有「系统默认灰」的三栏编辑器换成 Claude.ai 主站那种米白 + 赤陶 + 衬线标题的视觉语言,同时重组布局让信息层级更清晰。

## 硬约束

- **纯静态无依赖**:不引入任何构建工具、框架、字体 CDN。所有样式写在 `style.css`,图标用内联 SVG。
- **仅亮色**:不做深色模式,不做跟随系统。
- **不动交互行为**:拖放、Shift+点击、点选玩家、撤销/重做、求解器调用等逻辑一行不改。允许新增「纯 CSS 就能做」的 UI 反馈(tooltip、过渡动画、focus ring)。
- **测试必须通过**:`npm test` 现有 21 个测试全部通过,不修改测试。

## 实现方案(已确认方案 A)

单文件 CSS 重写 + 最小化 JS 改动:

1. 新增 `style.css`,内含设计令牌(CSS 自定义属性)+ 全部组件样式,替代 `index.html` 里的 `<style>` 内联块。
2. 重写 `index.html` 的 DOM 结构,按分组组织顶栏 / 左栏 / 右栏。
3. 修改 `js/renderer.js` 顶部的 `COLORS` 常量,换暖调配色。
4. 不修改 `js/ui.js`、`js/editor.js`、`js/store.js` 等任何 JS 文件。

新增交互元素(纯 CSS 实现,零 JS):
- 工具按钮 / 顶栏按钮 hover tooltip(`data-tip` + `::after`)
- 按钮、卡片、工具项的过渡动画(120–150ms)
- 焦点环(2px 赤陶 outline,键盘可达)
- 拖拽玩家项时的阴影加深 + 微旋转 0.5deg(如果现有 drag 事件已加 class,纯 CSS 即可命中;若没有 class 钩子则不做旋转,只做阴影)

## 设计令牌

写入 `style.css` 顶部 `:root`:

```css
:root {
  /* 背景层 */
  --bg-app:      #F5F1EA;   /* 整页米白 */
  --bg-panel:    #FBF8F2;   /* 侧栏 / 顶栏 奶油 */
  --bg-canvas:   #EFEAE0;   /* 画布外圈 略深奶油 */
  --bg-card:     #FFFFFF;   /* 玩家项 / 工具按钮白卡 */
  --bg-hover:    #F1EBE0;   /* hover 米褐 */
  --bg-active:   #E9DCC8;   /* active 沙色 */

  /* 文字 */
  --text-primary:   #1F1A14;
  --text-secondary: #6B6156;
  --text-tertiary:  #9C9184;

  /* 主色(赤陶) */
  --accent:        #C15A3C;
  --accent-hover:  #A94D32;
  --accent-soft:   #F6E3D9;
  --accent-text:   #FFFFFF;

  /* 边框 / 分隔 */
  --border-soft:   #E5DDCF;
  --border-strong: #C9BFA9;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(31, 26, 20, .06);
  --shadow-md: 0 4px 12px rgba(31, 26, 20, .08);

  /* 圆角 */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;

  /* 字体 */
  --font-serif: Georgia, "Songti SC", "STSong", "SimSun", serif;
  --font-sans:  -apple-system, "Segoe UI", "PingFang SC",
                "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
  --font-mono:  ui-monospace, "SF Mono", Consolas, monospace;
}
```

**用法约定**:
- 标题(顶栏 logo、面板分组标题)用 `--font-serif`,体现"杂志感"
- 正文 / 按钮 / 列表用 `--font-sans`
- 快捷键提示用 `--font-mono`,小字号 + `--text-tertiary`

**字阶**:12px(辅助)/ 13px(正文)/ 14px(按钮)/ 16px(面板标题)/ 20px(logo)

## 整体布局

```
┌──────────────────────────────────────────────────────────────┐
│ 顶栏 (56px, --bg-panel, 底部 1px 分隔线)                      │
├──────────┬────────────────────────────────────┬──────────────┤
│ 工具栏    │  画布区                            │  玩家面板     │
│ (200px)  │  (弹性)                            │  (320px)     │
└──────────┴────────────────────────────────────┴──────────────┘
```

### 顶栏(从左到右)
- **品牌区**:logo "熊坑排座",衬线 20px,左侧赤陶竖条装饰
- 分隔竖线
- **项目组**:加载项目 / 导出项目(幽灵按钮,图标 + 文字)
- **导出组**:最终图 / 变动图(幽灵按钮)
- **危险区**:重置(红色文字幽灵按钮,远离其他组)
- 右侧 **缩放滑杆**(自定义样式,赤陶 thumb)+ 缩略提示 "40px"

### 左栏 · 工具面板(200px)
分组:
- **建造** —— 熊坑 / 旗帜(旗帜带 7×7 角标)
- **障碍** —— 山 / 湖 / 矿
- **玩家** —— 手动放玩家

每个工具按钮 = 图标(内联 SVG,16px)+ 名称 + 右侧快捷键提示(浅褐小字)。
当前激活工具:左侧 3px 赤陶竖条 + 浅奶油底。

底部分隔线后放 **撤销 / 重做**(图标按钮并排,禁用态明显)。

### 右栏 · 玩家面板(320px)
- **优先级** 标题(衬线)+ 副标"顶部最高 · 拖拽调整"(浅褐小字)
- 玩家列表(卡片式,白色背景,圆角 10px,拖拽把手在左)
  - 每项:名次(等宽) · 名字 · 状态徽章
  - 点选高亮:左边框 3px 赤陶
  - 拖拽中:阴影加深
- **批量导入名单**(次要按钮,全宽)
- 分隔线
- **排位模式**:两张并排单选卡片,选中的赤陶描边 + 浅奶油底
- **一键排位**(主按钮,赤陶实底白字,全宽)
- **清空排位**(幽灵按钮,全宽)

### 画布区
- 背景 `--bg-canvas`
- Canvas 元素外套一个白色圆角卡片(padding 16px,阴影 `--shadow-md`),让地图看起来像放在桌上的纸

### 呼吸感
- 所有面板 padding 从 8px 升到 16–20px
- 按钮高度从默认升到 34–38px
- 列表项间距从 2px 升到 6px

## 组件细节

### 按钮(四种变体)

| 变体 | 用途 | 样式 |
|---|---|---|
| Primary | 一键排位 | 赤陶实底白字,hover 加深 `--accent-hover` |
| Secondary | 批量导入名单 | 白卡 + `--border-soft` 边框,hover `--bg-hover` |
| Ghost | 加载 / 导出 / 工具栏 | 透明,hover `--bg-hover` |
| Danger | 重置 | 透明 + 红文字 `#B3341F`,hover 浅红底 `#F9E5E0` |

**通用**:高 34px,padding 0 14px,圆角 8px,字号 14px。
**过渡**:`background-color 120ms ease, color 120ms ease, box-shadow 120ms ease`。
**焦点**:`outline: 2px solid var(--accent); outline-offset: 2px`。

### 工具按钮(左栏)
- 非激活:白卡 + 1px 浅边框 + 深褐文字,hover 浅奶油底
- 激活:`--bg-active` 底 + 左侧 3px 赤陶竖条 + 文字 600 加粗 + 图标换赤陶
- 布局:横向 flex `[图标][名称 1fr][快捷键]`,高 38px,圆角 10px

### 玩家列表项
```
┌────────────────────────────────────────┐
│ ⋮⋮  1   玩家名A             [固定]      │
└────────────────────────────────────────┘
```
- 拖拽把手 `⋮⋮` 浅褐,hover 变深
- 状态徽章:
  - **未落座** —— 浅褐描边 + 浅褐文字
  - **已落座** —— 浅绿底 `#E7F0E3` + 深绿文字 `#3E5A39`
  - **固定** —— 蜂蜜底 `#FBEEC8` + 深棕文字 `#6B4E0F`
- 选中(点选放玩家):整卡左边框 3px 赤陶 + 浅奶油底
- 拖拽中:`--shadow-md`(若有 class 钩子再加 0.5deg 旋转)

### 单选卡片(排位模式)
- 未选中:白卡 + 浅边框
- 选中:`--bg-active` 底 + 赤陶描边 1.5px + radio 圆点赤陶填充
- 卡片内含:模式名(粗体 14px)+ 副标算法名(浅褐 12px)

### Tooltip(纯 CSS)
工具按钮、顶栏按钮 hover 时显示,`data-tip="..."` + `::after` 渲染。
深褐底 `--text-primary`、白字、圆角 6px、12px 字号,位置在按钮下方 6px,淡入 150ms。

### 缩放滑杆
赤陶色圆形 thumb(16px,白边 2px + 阴影),轨道 4px 浅褐。
hover 时 thumb 微放大。右侧跟小字 "40px" 等宽数字。

## 画布调色

`js/renderer.js` 顶部 `COLORS` 常量替换:

| 键 | 原值 | 新值 | 说明 |
|---|---|---|---|
| `grid` | `#9ca3af` | `#D6CDBB` | 暖沙网格线 |
| `bear` | `#7c2d12` | `#8A3B2A` | 赤陶棕 |
| `banner` | `#facc15` | `#D4A24E` | 蜂蜜 |
| `coverage` | `rgba(250,204,21,0.12)` | `rgba(212,162,78,0.10)` | 米金覆盖 |
| `coverageBorder` | `#eab308` | `#C08A35` | |
| `mountain` | `#78716c` | `#8B8075` | 暖石灰 |
| `lake` | `#0ea5e9` | `#7A9AB5` | 灰蓝 |
| `mine` | `#a16207` | `#9C6F3A` | 焦糖 |
| `player` | `#3b82f6` | `#C15A3C` | **赤陶**(品牌主色) |
| `fixed` | `#f59e0b` | `#D4A24E` | 蜂蜜 |
| `text` | `#000` | `#1F1A14` | 深褐黑 |

画布 `background` 从 `#e5e7eb` 改为 `transparent`,露出外层 `--bg-canvas`,加上白卡片容器,地图看起来像放在桌面上的图纸。

## 文件改动清单

| 文件 | 动作 | 说明 |
|---|---|---|
| `style.css` | 新增 | 设计令牌 + 全部组件样式 |
| `index.html` | 重写 | 移除 `<style>` 内联,重组 DOM,加 `data-tip` 属性 |
| `js/renderer.js` | 修改 | 替换 `COLORS` 常量(仅这一个常量,不动函数) |
| `js/ui.js` | 不改 | |
| `js/editor.js` | 不改 | |
| `js/store.js` | 不改 | |
| `js/exporter.js` | 不改 | |
| `js/geometry.js` | 不改 | |
| `js/strictSolver.js` | 不改 | |
| `js/minimalSolver.js` | 不改 | |
| `tests/` | 不改 | 21 个测试全部通过 |
| `README.md` | 修改 | 更新「项目结构」一节,提到 `style.css` |

## 验证

1. `npm test` 21 个测试通过。
2. 浏览器手测:
   - 打开 `http://localhost:8000`,首屏渲染无闪烁
   - 每个工具按钮 hover 出 tooltip
   - 拖放熊坑 / 点旗帜切换 / Shift+点旗帜锁定 —— 行为不变
   - 玩家列表拖拽排序、点选高亮、固定切换 —— 行为不变
   - 「一键排位」严格 / 最小修改两种模式跑出与改动前相同的结果
   - 导出最终图 / 变动图 PNG,画布颜色为新色板
   - Tab 键可在所有按钮间聚焦,焦点环可见

## 不做的事(YAGNI)

- 不做深色模式
- 不做面板折叠 / 拖拽改宽
- 不做命令面板 / 快捷键面板
- 不引入 Tailwind / 任何框架 / 任何字体 CDN
- 不改 JS 交互逻辑
- 不做响应式断点(假定桌面 1280+)
