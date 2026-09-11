# 太玄界当前运行文件清单

> 目的：给维护者 / Codex 一个明确边界。这里记录“现役运行文件”“验证文件”“构建资料”“历史残留”，避免继续把所有文件都当成同等重要。

## A. 现役浏览器运行链

### 入口

- `index.html`
- `app.js`
- `style.css`
- `sw.js`
- `manifest.webmanifest`

### 当前核心

- `src/game-v39.js`

### 当前 UI / 商店扩展

由 `app.js` 动态加载：

- `ui-shop-v2.css`
- `ui-shop-v2.js`
- `ui-shop-v2-sync.js`
- `ui-shop-v2-power-adapter.js`
- `ui-shop-v2-vip8.js`
- `ui-shop-v2-vip12.js`
- `ui-shop-v2-vip15.js`
- `ui-shop-v2-dynamic-power.js`
- `ui-shop-v2-jade-sinks.js`
- `ui-final-v1.css`
- `ui-final-v1.js`
- `ui-phase8-qol.css`
- `ui-phase8-qol.js`

### App 图标

当前图标体系单独冻结，重构核心时不改图标。

## B. 现役验证资产

- `tests/regression-v29.mjs` ～ `tests/regression-v39.mjs`
- `tests/playtest-phase8.mjs`
- `shop-m7-final-regression.js`
- `PUBLIC_UI_STATUS.json`
- `PUBLIC_V39_STATUS.json`

V4.0 重构阶段以 `tests/regression-v39.mjs` 和 V2.9→V3.9 连续回归为主要兼容门。

## C. 构建资料 / 内容源

`content/` 中的 V3.1～V3.9 文件不是当前浏览器直接加载的主链，但包含已经结构化过的后期内容数据，可在重构时优先复用，而不是重新手抄：

- `content/v31-manuals.json`
- `content/v31-spells.json`
- `content/v32-equipment.cjs`
- `content/v33-alchemy-materials.cjs`
- `content/v34-combat-builds.cjs`
- `content/v35-economy-world.cjs`
- `content/v36-refining-void.cjs`
- `content/v37-unity-law.cjs`
- `content/v38-mahayana-origin.cjs`
- `content/v38-world-actors.cjs`
- `content/v39-tribulation-ascension.cjs`

`tools/` 下对应的 build/runtime/release/verify 文件属于历史构建工具与发布验证资产。暂不删除，待模块化完成后再决定归档。

## D. 明确属于历史版本快照的源码

当前浏览器入口不加载以下旧核心：

- `src/game-v02.js`
- `src/game-v13.js`
- `src/game-v15.js` ～ `src/game-v38.js`

它们目前只具有历史追溯 / 旧回归参考价值，不应继续作为新增功能修改目标。

## E. 明确属于历史 / 迁移残留的候选

以下内容暂不删除，但不应继续扩张：

- 根目录 `v03-patch.js` ～ `v13-patch.js`；
- `appchunks/`；
- `bundle/`；
- `bundle2/`；
- 大量旧版 `BUILD_V*.json`；
- 大量旧版 `PUBLIC_V*_STATUS.json`；
- 大量 `*.trigger`；
- 旧 UI 原型 / 旧商城版本；
- 旧版 release/build workflow。

这些将在“重构可运行且回归稳定”之后统一移动到 `archive/` 或从工作树清理；现阶段不做激进删除。

## F. V4.0 新目录

- `src/data/`：纯静态数据
- `src/core/`：状态 / 存档 / 时间 / 随机数等基础设施
- `src/systems/`：修炼 / 移动 / 战斗 / 宗门 / 炼丹 / 炼器 / 经济 / NPC
- `src/ui/`：新 UI 与美术适配层
- `assets/`：场景、立绘、物品、敌人、UI 美术资源

原则：**新功能只进入新结构，不再继续把 V4.0 功能追加进 `game-v39.js`。**
