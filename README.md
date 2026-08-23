# 太玄界 · 修仙大世界

当前工程版本：**V1.4.1 · 工程重构（build 1402）**  
当前玩法版本：**V1.3.0 · 宗门大战与势力演化**

## 正式运行结构

```text
index.html
  -> app.js
  -> src/game-v13.js
```

浏览器正式运行链不再下载 `bundle2/`，不再串行加载 V03~V13 补丁，也不使用 `eval` 拼装游戏源码。历史 bundle 与补丁暂时只保留为可重复构建来源和回退依据。

## 存档迁移

浏览器存档 key 继续使用 `xiuxian_world_v02`，避免旧玩家进度消失。当前显式存档结构版本为 `saveSchemaVersion = 13`。

没有 `saveSchemaVersion` 的历史存档按 schema 2 处理，然后严格执行：

```text
2 -> 3 战斗
  -> 4 宗门
  -> 5 坊市
  -> 6 炼丹
  -> 7 法器
  -> 8 NPC 社交
  -> 9 主动破境
  -> 10 洞府
  -> 11 轮回传承
  -> 12 动态秘境
  -> 13 宗门大战
```

每一步迁移都是幂等字段补全。当前客户端遇到 `saveSchemaVersion > 13` 的未来存档会拒绝加载，并且不会覆盖原存档。

## 已完成玩法

战斗、宗门、坊市经济、炼丹、法器锻造、NPC 人情恩怨、主动破境、洞府闭关与药圃、身死传承与转世、动态秘境、宗门大战与势力演化。

## 工程约定

- `main`：唯一开发源。
- `gh-pages`：公开部署产物，不与 `main` merge。
- `tools/build-v13-source.cjs`：从历史 V0.2 bundle + V03~V13 补丁重建当前直读源码，并注入 V1.4 工程迁移层。
- `tests/regression-v14.mjs`：统一玩法、旧存档迁移、幂等性、未来存档保护回归。
- `.github/workflows/v14-refactor.yml`：当前 V1.4 唯一正式发布链，负责构建、回归、部署、公网回归和 PASS 状态回写。
- V6 App 图标已定稿，发布时强制做 SHA-256 回归。

## 本地验证

```bash
node tools/build-v13-source.cjs
node --check src/game-v13.js
npm install --no-save jsdom@24
node tests/regression-v14.mjs
```
