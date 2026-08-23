from pathlib import Path

p=Path('docs/PROJECT_TASKBOOK.md')
text=p.read_text(encoding='utf-8')

def rep(old,new,label):
    global text
    count=text.count(old)
    if count!=1:
        raise SystemExit(f'{label}: expected 1 match, got {count}')
    text=text.replace(old,new,1)

rep('最近重大修订：2026-08-23 · V3.0 玩家成长数据底座正式完成','最近重大修订：2026-08-23 · V3.1 功法、法术、神通大扩容正式完成','header revision')
rep('当前正式基线：V3.0.0 · 成长数据底座 · build 3001 · save schema 27','当前正式基线：V3.1.0 · 功法术法大扩容 · build 3101 · save schema 28','header baseline')
rep('# 2. V3.0 当前真实基线','# 2. V3.1 当前真实基线','baseline heading')
rep('| 功法 | 9 本 | 明显不足，V3.1 扩容 |','| 功法 | 28 本 | V3.1 最低数量门槛已达成；拥有独立熟练度、来源、成本与功法效果 |','manual baseline')
rep('| 法术 / 神通 | 11 个（含基础拳脚） | 明显不足，V3.1 扩容 |','| 法术 / 神通 | 60 个（含基础拳脚） | V3.1 最低数量门槛已达成；已覆盖多击、持续伤害、护盾、控制、恢复、反击、保命等机制 |','spell baseline')
rep('| 技能底座 | 11 技能均有稳定 spellId；已建立分类、冷却、状态接口 | 底座完成，实际战斗深度待 V3.1 / V3.4 |','| 技能体系 | 60 技能均有稳定 spellId；6 格主动栏 + 1 被动槽；冷却与状态已进入真实战斗 | V3.1 完成，V3.4 继续深化敌人与 Build 平衡 |','skill baseline')
rep('| 状态系统 | 7 个基础状态定义 | 接口完成，内容待扩容 |','| 状态系统 | 14 个状态定义 | 护盾、束缚、破绽、回生、反震、燃战、聚灵等已进入统一状态接口 |','status baseline')
rep('| 存档 | schema27；保留 `xiuxian_world_v02` | schema26 → 27 迁移 PASS |','| 存档 | schema28；保留 `xiuxian_world_v02` | schema27 → 28 迁移 PASS，future schema29 保护 PASS |','save baseline')
rep('核心问题已经从“没有可扩展的玩家成长数据结构”变成：\n\n> **底座已建立，但实际可收集、可培养、可搭配的玩家内容密度仍明显不足。**\n\n因此下一阶段直接进入 V3.1，先扩功法、法术、神通，再继续法宝、炼丹和战斗 Build。','V3.1 已经解决功法与术法内容密度过低的问题：28 本功法和 60 个法术 / 神通已真实进入统一注册、学习、装备与战斗体系。\n\n当前最明显短板转移到：\n\n> **法宝 / 装备仍只有 7 件，真正法宝养成、祭炼、本命化、主动法宝能力与炼器路线尚未成体系。**\n\n因此下一阶段进入 V3.2，优先把法宝、装备与炼器做成可长期收集和培养的核心系统。','baseline conclusion')
rep('- V3.0 schema27 是当前正式存档基线，后续版本必须继续提供逐级迁移。','- V3.1 schema28 是当前正式存档基线，后续版本必须继续提供逐级迁移。','schema current')
rep('- V3.0 采用兼容镜像过渡：旧 V2.9 字段继续保留并可运行，同时同步 `realmId`、`regionId`、`manualId`、`spellProficiencyById`、`gearOwnedIds`、`equippedItemIds`、`artifactOwnedIds`、`materialCountsById`、`itemCountsById` 等稳定字段。','- V3.0 的稳定 ID 兼容镜像继续保留；V3.1 在此基础上新增 `manualLibraryIds`、`manualProficiencyById`、`activeSkillIds`、`passiveSkillId` 与 `skillLoadoutVersion`，旧功法、旧法术和旧熟练度不会因扩容丢失。','schema compatibility detail')
rep('## V3.1 — 功法、法术、神通大扩容\n\n**状态：TODO / 当前最高优先级**','## V3.1 — 功法、法术、神通大扩容\n\n**状态：DONE**','v31 status')
rep('实际战斗采用有限主动栏，建议 6 个主槽 + 被动 / 本命能力槽，禁止战斗中无限切换全部已学技能。\n\n---\n\n## V3.2 — 法宝、装备与炼器','实际战斗采用有限主动栏，建议 6 个主槽 + 被动 / 本命能力槽，禁止战斗中无限切换全部已学技能。\n\n### V3.1 正式完成记录\n\n- 正式版本：V3.1.0 / build 3101 / save schema28 / content registry v2。\n- 功法总量：28 本；每本保留独立熟练度，分为初窥 / 小成 / 大成 / 圆满，并拥有不同的气血、灵力、破境、伤害、恢复、承伤或法宝协同偏向。\n- 法术 / 神通总量：60 个；5 个被动秘术，战斗采用 6 格主动栏 + 1 被动槽。\n- 四大道途均获得成体系的新技能，并覆盖多击、持续伤害、护盾、身法、控制、封印、恢复、回灵、减益、神魂攻击、反击、处决、吸取与濒死保命等机制。\n- 新传承按境界、地点、道途和真实资源成本获取；不是创建角色后直接全送。\n- schema27 → 28 迁移 PASS；future schema29 防覆盖 PASS。\n- PR #31 功能验证、PR #32 发布兜底验证、PR #33 最终发布均 PASS，全部关闭且未合并。\n- 正式 runtime commit：`92c4d404354c34667b6b9838e2cede594e3dcc91`。\n- 正式源码 SHA256：`492a2808ba69727ab6232e753ed25f388cc324cff0a8032a1ccc35f8549180e7`。\n- `PUBLIC_V31_STATUS.json = PASS` 已由真实 GitHub Pages 重新下载验证并同步 main。\n- runtime → final release main `616f381be9d95826282eb9b39a3fc63c152c17cb` 仅新增 `PUBLIC_V31_STATUS.json`。\n\n**结论：V3.1 DONE。下一阶段：V3.2 法宝、装备与炼器。**\n\n---\n\n## V3.2 — 法宝、装备与炼器\n\n**状态：TODO / 当前最高优先级**','v31 completion block')
rep('- [ ] 功法 ≥ 28','- [x] 功法 ≥ 28','gate manuals')
rep('- [ ] 法术 / 神通 ≥ 60','- [x] 法术 / 神通 ≥ 60','gate spells')
rep('| V3.1 功法 / 法术 | TODO / CURRENT |','| V3.1 功法 / 法术 | DONE |','progress v31')
rep('| V3.2 法宝 / 炼器 | TODO |','| V3.2 法宝 / 炼器 | TODO / CURRENT |','progress v32')

if '## 2026-08-23 · V3.1 功法、法术、神通大扩容' not in text:
    text += '\n\n## 2026-08-23 · V3.1 功法、法术、神通大扩容\n\n- 正式版本：V3.1.0 / build 3101 / save schema28。\n- 28 本功法与 60 个法术 / 神通正式落地，六格主动栏与被动槽进入实际战斗。\n- schema27 → 28、三代 headless、真实 Pages、公网源码 SHA、manifest 与固定 V6 图标全部 PASS。\n- 正式 runtime：`92c4d404354c34667b6b9838e2cede594e3dcc91`；final PASS main：`616f381be9d95826282eb9b39a3fc63c152c17cb`。\n- 充值前 Gate 的“功法 ≥ 28”与“法术 / 神通 ≥ 60”正式勾选。\n- 下一阶段：V3.2 法宝、装备与炼器。\n'

p.write_text(text,encoding='utf-8')
print('V31_TASKBOOK_FINALIZE_PASS')
