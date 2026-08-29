# 太玄界 · 修仙大世界

当前核心版本：**V3.9.0 · 渡劫飞升与真仙终局篇（build 3901）**  
当前产品阶段：**Playable UI V3.9.1 · 先做成真正能玩的版本**

## 当前方向

长期主线已经完整贯通：

**凡人 → 炼气 → 筑基 → 结丹 / 金丹 → 元婴 → 化神 → 炼虚 → 合体 → 大乘 → 渡劫 → 飞升 → 真仙。**

V3.9 已完成渡劫、飞升与真仙终局。2026-08-29 起停止继续扩张境界与内容规模，先冻结 V3.9 核心并完成可玩版 UI / UX 收口；原 V3.10「无充值从凡人到真仙总平衡」暂缓到实际试玩之后。

最新执行说明见 [`docs/PLAYABLE_UI_PHASE.md`](docs/PLAYABLE_UI_PHASE.md)。长期系统任务书仍保留在 [`docs/PROJECT_TASKBOOK.md`](docs/PROJECT_TASKBOOK.md)。

## 当前规模

- 境界：40 档，凡人至真仙；
- 地图：27 区域；
- 路线：41 条；
- 功法：44 本；
- 法术 / 神通：108 个；
- 装备 / 法宝：92 件，其中真正法宝 56 件；
- 丹药 / 丹方：54 种；
- 材料：94 类；
- 敌人：94 个；
- 六重雷劫、独立心魔劫、三重仙凡蜕变与飞升天门均已落地；
- 存档：schema36，`SAVE_KEY = xiuxian_world_v02`。

## 正式运行结构

`index.html -> app.js -> src/game-v39.js`

浏览器直接加载完整可读源码，不使用历史 patch chain 或 `eval`。V3.9 核心源码在 Playable UI 阶段冻结，UI 改造不得通过重写核心机制实现。

## 发布与验收

V3.9 核心已通过真实 GitHub Pages、公网源码 SHA、headless regression、存档迁移与固定 V6 图标校验。

Playable UI 阶段新增独立终端验收：只有 GitHub Pages 实际返回新 UI、V3.9 核心 SHA 保持不变、V2.9～V3.9 回归通过并生成 `PUBLIC_UI_STATUS.json = PASS`，才算第一版可玩 UI 完成。

V6 App 图标继续固定，不修改。
