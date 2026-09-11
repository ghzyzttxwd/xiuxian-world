# 太玄界 V4.0 重构进度

## R0：安全基线与工程边界

状态：完成。

- 创建独立分支 `refactor-v40`，未修改 `main`；
- 建立 `src/data/`、`src/core/`、`src/systems/`、`src/ui/`、`assets/` 边界；
- 建立重构计划、Codex 交接说明、现役运行文件清单；
- 建立独立 V4.0 regression gate；
- 重构前 V2.9→V3.9 连续 gameplay regression：PASS。

## R1：REALMS 境界表拆分

状态：完成第一次受保护迁移，等待独立门禁复验。

变更：

- 从 `src/game-v39.js` 移出 40 档 `REALMS`；
- 新文件：`src/data/realms.js`；
- `app.js` 在核心前预加载境界数据；
- `sw.js` 将境界数据纳入 PWA 离线缓存；
- `tests/regression-v39.mjs` 显式加载该数据模块；
- 原 `SAVE_KEY`、schema36、境界数据内容、玩法公式保持不变。

受保护迁移工作流结果：

- 提取脚本校验：PASS；
- JS syntax checks：PASS；
- V2.9→V3.9 gameplay regression：PASS；
- REALMS 40 档/首尾值/加载顺序契约：PASS；
- 通过后才由 GitHub Actions 提交迁移结果。

下一步：

1. 独立 regression gate 对 R1 最终提交再次复验；
2. 生成 Codex 精简工作区 ZIP；
3. 再决定是否进入 R2（ROOTS / LOCATIONS），不与图片系统同时施工。
