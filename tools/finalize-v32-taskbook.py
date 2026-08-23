from pathlib import Path
p=Path('docs/PROJECT_TASKBOOK.md')
s=p.read_text(encoding='utf-8')

def repl(a,b,label):
    global s
    if a not in s:
        raise SystemExit(f'missing taskbook anchor: {label}')
    s=s.replace(a,b,1)

repl('最近重大修订：2026-08-23 · V3.1 功法、法术、神通大扩容正式完成','最近重大修订：2026-08-24 · V3.2 法宝、装备与炼器正式完成','header revision')
repl('当前正式基线：V3.1.0 · 功法术法大扩容 · build 3101 · save schema 28','当前正式基线：V3.2.0 · 法宝炼器体系 · build 3201 · save schema 29','header baseline')
repl('# 2. V3.1 当前真实基线','# 2. V3.2 当前真实基线','baseline title')
repl('| 装备 / 法宝 | 7 件，其中 4 件已接入 artifact 稳定接口 | 数量严重不足，V3.2 深化 |','| 装备 / 法宝 | 60 件，其中 24 件真正法宝；21 件拥有主动能力；24 件具备构筑级被动 | V3.2 最低数量与深度门槛已达成 |','equipment baseline')
repl('| 存档 | schema28；保留 `xiuxian_world_v02` | schema27 → 28 迁移 PASS，future schema29 保护 PASS |','| 存档 | schema29；保留 `xiuxian_world_v02` | schema28 → 29 迁移 PASS，future schema30 保护 PASS |','save baseline')
repl('V3.1 已经解决功法与术法内容密度过低的问题：28 本功法和 60 个法术 / 神通已真实进入统一注册、学习、装备与战斗体系。\n\n当前最明显短板转移到：\n\n> **法宝 / 装备仍只有 7 件，真正法宝养成、祭炼、本命化、主动法宝能力与炼器路线尚未成体系。**\n\n因此下一阶段进入 V3.2，优先把法宝、装备与炼器做成可长期收集和培养的核心系统。','V3.2 已经解决法宝与装备数量过少、养成过浅的问题：60 件器物、24 件真正法宝已进入统一注册、炼制、装备与战斗体系；认主、祭炼、温养、本命化、重大失败受损与修复均有真实状态。\n\n当前最明显短板转移到：\n\n> **丹药仍只有 4 种，命名材料仍只有 8 类核心材料；地图危险、敌人掉落、炼丹配方与高境界资源之间还没有形成足够深的资源闭环。**\n\n因此下一阶段进入 V3.3，优先扩展丹药、丹方、命名材料与明确来源。','baseline narrative')
repl('- V3.1 schema28 是当前正式存档基线，后续版本必须继续提供逐级迁移。','- V3.2 schema29 是当前正式存档基线，后续版本必须继续提供逐级迁移。','save compatibility')
repl('- V3.0 的稳定 ID 兼容镜像继续保留；V3.1 在此基础上新增 `manualLibraryIds`、`manualProficiencyById`、`activeSkillIds`、`passiveSkillId` 与 `skillLoadoutVersion`，旧功法、旧法术和旧熟练度不会因扩容丢失。','- V3.0 / V3.1 的稳定 ID 与功法术法兼容镜像继续保留；V3.2 在此基础上新增 `equipmentInventory`、`artifactLoadout`、`forgingProf`、`natalArtifactId`、祭炼层数、温养度与受损状态，旧 7 件装备与旧 artifactId 不会因重构丢失。','v32 compatibility')
repl('## V3.2 — 法宝、装备与炼器\n\n**状态：TODO / 当前最高优先级**\n\n目标：把当前 7 件固定装备升级为真正法宝系统。','## V3.2 — 法宝、装备与炼器\n\n**状态：DONE**\n\n已完成：60 件装备 / 法宝、24 件真正法宝、21 件主动法宝、24 件构筑级被动；三基础槽与四法宝槽；炼器成功率与品质波动；认主、祭炼、温养、本命化；重大祭炼失败受损与修复；法宝主动冷却进入真实战斗；旧 7 件装备无损迁移。','v32 status')
repl('## V3.3 — 炼丹、材料与资源闭环\n\n目标：让地图危险与成长资源直接对应。','## V3.3 — 炼丹、材料与资源闭环\n\n**状态：TODO / 当前最高优先级**\n\n目标：让地图危险与成长资源直接对应。','v33 current')
repl('| V3.2 法宝 / 炼器 | TODO / CURRENT |','| V3.2 法宝 / 炼器 | DONE |','progress v32')
repl('| V3.3 炼丹 / 材料 | TODO |','| V3.3 炼丹 / 材料 | TODO / CURRENT |','progress v33')
repl('- [ ] 装备 / 法宝 ≥ 60','- [x] 装备 / 法宝 ≥ 60','gate equipment')
repl('- [ ] 真正法宝 ≥ 24','- [x] 真正法宝 ≥ 24','gate artifacts')
if '## 2026-08-24 · V3.2 法宝、装备与炼器' not in s:
    s=s.rstrip()+'''\n\n\n## 2026-08-24 · V3.2 法宝、装备与炼器\n\n- 正式版本：V3.2.0 / build 3201 / save schema29。\n- 装备与法宝扩展至 60 件，其中 24 件为真正法宝；21 件拥有独立主动能力，24 件具备构筑级被动。\n- 三基础槽 + 攻伐 / 护身 / 辅助 / 本命四法宝槽正式落地。\n- 炼器品质波动、炼器熟练度、认主、祭炼 0～9 层、温养、本命化、重大失败受损与修复均进入真实存档与战斗。\n- schema28 → 29、V2.9～V3.2 四代 headless、真实 Pages HTTP、公网源码 SHA、manifest 与固定 V6 图标全部 PASS。\n- 正式 runtime：`6a19396cb6e487225f05b19109303dbc29128e71`；final PASS main：`147217d059757c698503597b318b3cad04ace671`。\n- `PUBLIC_V32_STATUS.json` 已从真实 GitHub Pages 可达验证，并以相同 blob 同步 main；runtime → final main 仅新增该状态文件。\n- 充值前 Gate 的“装备 / 法宝 ≥ 60”和“真正法宝 ≥ 24”正式勾选。\n- 下一阶段：V3.3 炼丹、材料与资源闭环。\n'''
p.write_text(s,encoding='utf-8')
print('V32_TASKBOOK_FINALIZE_PASS')
