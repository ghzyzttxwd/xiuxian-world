# 太玄界 V4.0 重构与图片化计划

> 工作分支：`refactor-v40`
> 基线：V3.9.0 / `src/game-v39.js`
> 原则：先保持可运行，再逐步拆分；每一步都能回退；不同时改玩法、存档和美术。

## 0. 当前事实

正式运行链：

`index.html -> app.js -> src/game-v39.js`

同时由 `app.js` 加载独立 UI / 商店脚本。

当前主要技术债不是“代码不能跑”，而是：

1. `game-v39.js` 是大型单体核心，数据、状态、系统逻辑、渲染逻辑混合；
2. `src/` 保留大量旧整包版本，容易让维护者误判当前入口；
3. 根目录存在大量历史 trigger / status / patch / workflow 产物，现役与历史边界不清；
4. 图片资源没有独立 asset manifest，未来直接把图片路径写进核心会继续加重耦合；
5. README 标注 build 3901，而当前 `app.js` 标注 build 3903，需要在整理阶段统一版本说明。

## 1. 第一阶段：只整理，不改行为

目标：让人和 Codex 一眼看懂“哪些是现役，哪些是历史”。

- 保留 V3.9 运行链不变；
- 新建模块目录骨架；
- 新建图片资源目录骨架；
- 补充架构说明和 Codex 交接说明；
- 暂不删除历史文件；
- 暂不修改 `game-v39.js`。

验收：V3.9 原入口、存档键、核心 SHA 均不因本阶段改变。

## 2. 第二阶段：拆“纯数据”，不拆行为

从 `game-v39.js` 里优先迁移无副作用常量：

- 境界表 REALMS；
- 灵根 ROOTS；
- 地图 LOCATIONS；
- 敌人 / 物品 / 功法 / 法术等静态表。

目标结构：

```text
src/
  game-v39.js              # 暂时保留兼容入口
  data/
    realms.js
    roots.js
    locations.js
    enemies.js
    items.js
    manuals.js
    spells.js
```

要求：只改变数据来源，不改变任何数值、键名、顺序、概率和存档结构。

## 3. 第三阶段：拆系统逻辑

按依赖从低到高拆：

```text
src/
  core/
    state.js
    save.js
    time.js
    rng.js
  systems/
    cultivation.js
    travel.js
    combat.js
    sect.js
    alchemy.js
    forging.js
    economy.js
    npc.js
```

每次只迁移一个系统，并做回归。

## 4. 第四阶段：建立独立美术层

图片绝不直接散写进核心逻辑。

```text
assets/
  art/
    scenes/
    portraits/
    items/
    enemies/
  ui/
    icons/
    frames/
  manifest.js

src/ui/
  art-layer.js
```

核心只暴露语义，例如：

- 当前地点 `青云山`
- 当前敌人 `赤焰狼`
- 当前 NPC `某角色`

美术层负责把语义映射到具体图片路径。

这样以后换图、压缩图片、增加高清资源都不需要改战斗或存档逻辑。

## 5. 第五阶段：图片化第一批

第一批只做高感知场景，不追求一次铺满：

- 主修炼页背景；
- 洞府；
- 宗门；
- 坊市；
- 野外；
- 秘境；
- 炼丹；
- 炼器；
- 战斗背景；
- 世界地图；
- 常见 NPC 头像；
- 主要装备 / 丹药 / 功法图标。

目标是“文字游戏 + 国风插画”的效果，而不是 3D 游戏。

## 6. 禁止事项

在重构完成前：

- 不改 `SAVE_KEY = xiuxian_world_v02`；
- 不改 schema36；
- 不顺手平衡数值；
- 不重写战斗公式；
- 不同时大改 UI 与核心；
- 不直接引用《想不想修真》的版权美术资源；
- 不把 Base64 图片重新塞进 JS 核心。

## 7. 每阶段验收

每一阶段至少验证：

1. 页面可以初始化；
2. 老存档可以读；
3. 新存档可以保存并再次读取；
4. 修炼 / 移动 / 战斗 / 宗门 / 商店主要入口不报错；
5. 当前阶段不涉及的数值结果保持一致。

只有验证通过才进入下一阶段。
