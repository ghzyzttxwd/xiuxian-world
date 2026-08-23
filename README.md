# 太玄界 · 修仙大世界

当前工程版本：**V1.4.0 · 源码合并重构（build 1401）**  
当前玩法版本：**V1.3.0 · 宗门大战与势力演化**

## 当前运行结构

V1.4 已把历史运行时的 `V0.2 bundle2 + V03~V13 十一层补丁` 机器合并为一份可读源码：

```text
index.html
  -> app.js
  -> src/game-v13.js
```

浏览器不再下载、拼接或 `eval` 十一层补丁。旧 `bundle2/` 与 `v03-patch.js` ~ `v13-patch.js` 暂时保留，仅用于构建历史、回归和回退，不再进入正式运行链。

## 已完成玩法

战斗、宗门、坊市经济、炼丹、法器锻造、NPC 人情恩怨、主动破境、洞府闭关与药圃、身死传承与转世、动态秘境、宗门大战与势力演化。

## 存档兼容

为避免旧玩家存档消失，当前仍保留历史 key：`xiuxian_world_v02`。V1.4 回归测试会用裁剪后的 V0.2 形态存档重新加载，检查 V0.3~V1.3 新字段迁移。后续会再把迁移逻辑整理成显式 `saveSchemaVersion` pipeline；在此之前不要直接改存档 key。

## 工程约定

- `main`：唯一开发源。
- `gh-pages`：公开部署产物，不与 `main` 直接 merge。
- `tools/build-v13-source.cjs`：从历史 bundle + patches 可重复生成 `src/game-v13.js`。
- `tests/regression-v14.mjs`：统一回归入口。
- V6 App 图标已定稿，V1.4 继续做 SHA-256 回归，不修改图标。

## 本地/CI 验证

```bash
node tools/build-v13-source.cjs
node --check src/game-v13.js
npm install --no-save jsdom@24
node tests/regression-v14.mjs
```
