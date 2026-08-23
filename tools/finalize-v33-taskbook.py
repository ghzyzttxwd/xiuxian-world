from pathlib import Path

p=Path('docs/PROJECT_TASKBOOK.md')
text=p.read_text(encoding='utf-8')

def rep(old,new,label):
    global text
    count=text.count(old)
    if count!=1:
        raise SystemExit(f'{label}: expected 1 match, got {count}')
    text=text.replace(old,new,1)

rep('最近重大修订：2026-08-24 · V3.2 法宝、装备与炼器正式完成','最近重大修订：2026-08-24 · V3.3 炼丹、材料与资源闭环正式完成','header revision')
rep('当前正式基线：V3.2.0 · 法宝炼器体系 · build 3201 · save schema 29','当前正式基线：V3.3.0 · 炼丹材料资源闭环 · build 3301 · save schema 30','header baseline')
rep('# 2. V3.2 当前真实基线','# 2. V3.3 当前真实基线','baseline heading')
rep('| 丹药 / 丹方 | 4 种 | 严重不足 |','| 丹药 / 丹方 | 24 种 | V3.3 最低数量门槛已达成；包含四档品质、丹毒、耐受与多类真实效果 |','pill baseline')
rep('| 命名材料注册 | 8 类当前核心材料 | 仅为底座，V3.3 扩容 |','| 材料注册 | 48 类，其中 40 种 V3.3 命名材料 | V3.3 最低数量门槛已达成；材料来源已绑定地图采集与敌人掉落 |','material baseline')
rep('| 存档 | schema29；保留 `xiuxian_world_v02` | schema28 → 29 迁移 PASS，future schema30 保护 PASS |','| 存档 | schema30；保留 `xiuxian_world_v02` | schema29 → 30 迁移 PASS，future schema31 保护 PASS |','save baseline')
rep('V3.2 已经解决法宝与装备数量过少、养成过浅的问题：60 件器物、24 件真正法宝已进入统一注册、炼制、装备与战斗体系；认主、祭炼、温养、本命化、重大失败受损与修复均有真实状态。\n\n当前最明显短板转移到：\n\n> **丹药仍只有 4 种，命名材料仍只有 8 类核心材料；地图危险、敌人掉落、炼丹配方与高境界资源之间还没有形成足够深的资源闭环。**\n\n因此下一阶段进入 V3.3，优先扩展丹药、丹方、命名材料与明确来源。','V3.3 已经把炼丹、命名材料与地图资源真正接成闭环：24 种丹药 / 丹方、48 类材料注册（其中 40 种新命名材料）进入统一物品、材料与丹方体系；丹方需要真实来源与资源，成丹拥有四档品质，失败会耗材，服丹受到丹毒与短期耐受约束，地图采集和敌人掉落承担明确材料来源。\n\n当前最明显短板转移到：\n\n> **敌人仍只有 29 个模板，四大道途虽然已有技能、法宝和丹药协同，但尚未形成每条至少两套中高阶完整战斗 Build，独立机制敌人数量也不足。**\n\n因此下一阶段进入 V3.4，统一深化战斗机制、四大道途构筑与敌人生态。','baseline conclusion')
rep('- V3.2 schema29 是当前正式存档基线，后续版本必须继续提供逐级迁移。','- V3.3 schema30 是当前正式存档基线，后续版本必须继续提供逐级迁移。','schema current')
rep('## V3.3 — 炼丹、材料与资源闭环\n\n**状态：TODO / 当前最高优先级**','## V3.3 — 炼丹、材料与资源闭环\n\n**状态：DONE**','v33 status')
rep('加入：\n\n- 丹方获取；\n- 炼丹熟练度；\n- 成丹品质；\n- 成功 / 失败；\n- 丹毒或短期耐受；\n- 材料明确来源。\n\n---\n\n## V3.4 — 战斗与四大道途完整 Build','加入：\n\n- 丹方获取；\n- 炼丹熟练度；\n- 成丹品质；\n- 成功 / 失败；\n- 丹毒或短期耐受；\n- 材料明确来源。\n\n### V3.3 正式完成记录\n\n- 正式版本：V3.3.0 / build 3301 / save schema30 / content registry v4。\n- 丹药 / 丹方总量：24 种；覆盖疗伤、回灵、破境辅助、炼体、神魂、解毒、身法、临时攻防、道途爆发、元婴 / 化神高阶丹与限次延寿。\n- 材料注册总量：48 类，其中 40 种为 V3.3 新命名材料；全部 12 个现有区域均有明确材料来源，并接入地图采集与敌人掉落。\n- 成丹分普通 / 上品 / 极品 / 丹纹四档；品质越高效果越强、丹毒越低。\n- 炼丹熟练度真实影响成功率与品质；失败会消耗材料但保留少量失败经验。\n- 丹毒、同丹短期耐受与世界时间衰减正式进入存档；高风险爆发丹同时拥有真实收益与副作用。\n- schema29 → 30 迁移 PASS；旧 4 种丹药与 8 类核心材料字段完整保留；future schema31 防覆盖 PASS。\n- PR #39 功能验证、PR #40 发布兜底验证、PR #41 最终发布均 PASS，全部关闭且未合并。\n- 正式 runtime commit：`0409590948171580921f11416ab1af26360b199a`。\n- 正式源码 SHA256：`f478196139011917072db71697bb306e2de105d5be1abdb1e0d71820be88d425`。\n- `PUBLIC_V33_STATUS.json = PASS` 已由真实 GitHub Pages 重新下载验证并同步 main。\n- runtime → final release main `aa0b7360fca032959ee9fac3c8e43d9b34007114` 仅新增 `PUBLIC_V33_STATUS.json`。\n\n**结论：V3.3 DONE。下一阶段：V3.4 战斗与四大道途完整 Build。**\n\n---\n\n## V3.4 — 战斗与四大道途完整 Build\n\n**状态：TODO / 当前最高优先级**','v33 completion block')
rep('- [ ] 丹药 ≥ 20','- [x] 丹药 ≥ 20','gate pills')
rep('- [ ] 材料 ≥ 40','- [x] 材料 ≥ 40','gate materials')
rep('| V3.3 炼丹 / 材料 | TODO / CURRENT |','| V3.3 炼丹 / 材料 | DONE |','progress v33')
rep('| V3.4 战斗 / 四大道途 Build | TODO |','| V3.4 战斗 / 四大道途 Build | TODO / CURRENT |','progress v34')

if '## 2026-08-24 · V3.3 炼丹、材料与资源闭环' not in text:
    text += '\n\n## 2026-08-24 · V3.3 炼丹、材料与资源闭环\n\n- 正式版本：V3.3.0 / build 3301 / save schema30。\n- 24 种丹药 / 丹方与 48 类材料注册正式落地，其中 40 种为新命名材料。\n- 丹方获取、炼丹熟练度、普通 / 上品 / 极品 / 丹纹品质、失败耗材、丹毒、短期耐受与世界时间衰减进入真实玩法。\n- 12 个现有区域均获得明确命名材料来源，并接入地图采集与敌人掉落。\n- schema29 → 30、V2.9～V3.3 五代 headless、真实 Pages、公网源码 SHA、manifest 与固定 V6 图标全部 PASS。\n- 正式 runtime：`0409590948171580921f11416ab1af26360b199a`；final PASS main：`aa0b7360fca032959ee9fac3c8e43d9b34007114`。\n- 充值前 Gate 的“丹药 ≥ 20”与“材料 ≥ 40”正式勾选。\n- 下一阶段：V3.4 战斗与四大道途完整 Build。\n'

text='\n'.join(line.rstrip() for line in text.splitlines())+'\n'
p.write_text(text,encoding='utf-8')
print('V33_TASKBOOK_FINALIZE_PASS')
