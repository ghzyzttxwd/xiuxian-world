const fs=require('fs');
const input=process.env.TASKBOOK_INPUT||'docs/PROJECT_TASKBOOK.md';
const output=process.env.TASKBOOK_OUTPUT||input;
let s=fs.readFileSync(input,'utf8');
function must(search,replacement,label){if(!s.includes(search))throw new Error('V3.4 taskbook anchor missing: '+label);s=s.replace(search,replacement)}

must('> 最近重大修订：2026-08-24 · V3.3 炼丹、材料与资源闭环正式完成','> 最近重大修订：2026-08-24 · V3.4 战斗与四大道途完整 Build 正式完成','header revision');
must('> 当前正式基线：V3.3.0 · 炼丹材料资源闭环 · build 3301 · save schema 30','> 当前正式基线：V3.4.0 · 战斗与四大道途 Build · build 3401 · save schema 31','header baseline');
must('# 2. V3.3 当前真实基线','# 2. V3.4 当前真实基线','baseline heading');
must('| 道途 | 剑 / 火 / 体 / 神魂，共 4 条 | 有框架，内容不足 |','| 道途 | 剑 / 火 / 体 / 神魂，共 4 条；8 套中高阶 Build | V3.4 最低深度门槛已达成；每条道途均有 2 套可行构筑 |','dao baseline');
must('| 敌人 | 29 个现有模板均已获得稳定 enemyId | 数量仍不足 |','| 敌人 | 48 个，其中 V3.4 新增 19 个独立机制敌人 | V3.4 数量与机制门槛已达成 |','enemy baseline');
must('| 掉落表 | 29 份，与现有敌人逐一对应 | 统一结构已建立 |','| 掉落表 | 48 份，与当前敌人逐一对应 | 统一结构继续覆盖全部敌人 |','drop baseline');
must('| 技能体系 | 60 技能均有稳定 spellId；6 格主动栏 + 1 被动槽；冷却与状态已进入真实战斗 | V3.1 完成，V3.4 继续深化敌人与 Build 平衡 |','| 技能体系 | 60 技能均有稳定 spellId；6 格主动栏 + 1 被动槽；冷却、状态、道途 Build 与敌方机制进入真实战斗 | V3.4 战斗构筑深化完成 |','skill baseline');
must('| 存档 | schema30；保留 `xiuxian_world_v02` | schema29 → 30 迁移 PASS，future schema31 保护 PASS |','| 存档 | schema31；保留 `xiuxian_world_v02` | schema30 → 31 迁移 PASS，future schema32 保护 PASS |','save baseline');

must('V3.3 已经把炼丹、命名材料与地图资源真正接成闭环：24 种丹药 / 丹方、48 类材料注册（其中 40 种新命名材料）进入统一物品、材料与丹方体系；丹方需要真实来源与资源，成丹拥有四档品质，失败会耗材，服丹受到丹毒与短期耐受约束，地图采集和敌人掉落承担明确材料来源。\n\n当前最明显短板转移到：\n\n> **敌人仍只有 29 个模板，四大道途虽然已有技能、法宝和丹药协同，但尚未形成每条至少两套中高阶完整战斗 Build，独立机制敌人数量也不足。**\n\n因此下一阶段进入 V3.4，统一深化战斗机制、四大道途构筑与敌人生态。',
'V3.4 已经把战斗从“拥有技能和法宝”推进到可识别、可验证的真实 Build：敌人扩展至 48 个，新增 19 个敌人均拥有独立机制；青云剑道、赤霞火道、万兽炼体、太虚神道各形成 2 套中高阶构筑，并由当前功法、六格主动术法、被动秘术与同道法宝共同识别。重甲、虚化、反伤、再生、抽灵、持续伤害、冷却压制、控制抗性、斩杀等机制已进入实际战斗。\n\n当前最明显短板转移到：\n\n> **正常经济与世界资源交换仍然偏薄：坊市、宗门兑换、黑市 / 特殊商人、高阶拍卖、势力冲突对商路和资源的影响，以及任务 / 秘境 / 交易之间的价值关系尚未形成完整闭环。**\n\n因此下一阶段进入 V3.5，优先完成无充值环境下的正常经济与世界整合。','baseline narrative');
must('- V3.3 schema30 是当前正式存档基线，后续版本必须继续提供逐级迁移。','- V3.4 schema31 是当前正式存档基线，后续版本必须继续提供逐级迁移。','save compatibility');

must('## V3.4 — 战斗与四大道途完整 Build\n\n**状态：TODO / 当前最高优先级**','## V3.4 — 战斗与四大道途完整 Build\n\n**状态：DONE**','v34 status');
const v34End='每条至少形成 2 套中高阶可行构筑。\n\n敌人 ≥ 45，其中独立机制敌人 ≥ 12。';
const v34Record=[
 '每条至少形成 2 套中高阶可行构筑。',
 '',
 '敌人 ≥ 45，其中独立机制敌人 ≥ 12。',
 '',
 '### V3.4 正式完成记录',
 '',
 '- 正式版本：V3.4.0 / build 3401 / save schema31 / content registry v5。',
 '- 敌人总量：48；V3.4 新增 19 个敌人，并为 19 个新敌人分别建立独立机制。',
 '- 四大道途共 8 套中高阶 Build：青云剑道 2 套、赤霞火道 2 套、万兽炼体 2 套、太虚神道 2 套。',
 '- Build 不靠手工选择标签，而由主修道途、当前功法、六格主动术法、被动秘术与同道法宝共同自动识别；完整成型后进入真实伤害、防御、反击、灼烧、资源恢复等战斗结算。',
 '- 敌方机制已覆盖开场冲撞、持续毒伤 / 灼伤、再生、抽灵、重甲、反伤、虚化、狂化、火道抗性、法宝压制、多段爆发、冷却压制、神魂吸取、低血再生、镜魂反照、控制抗性、法域压制与斩杀。',
 '- 修复历史遗留的悬空 `onGearCombatWin` 胜利钩子，避免真实击杀流程在旧钩子处崩溃。',
 '- schema30 → 31 迁移 PASS；future schema32 防覆盖 PASS；V3.3 炼丹材料、V3.2 法宝、V3.1 技能体系均完整保留。',
 '- PR #43 功能验证、PR #44 发布兜底验证、PR #45 最终发布均 PASS，全部关闭且未合并。',
 '- 正式 runtime commit：`aa2c0e690ee8cf282602edeb047c3acd37914c0f`。',
 '- 正式源码 SHA256：`d00f7d441478fe79513b4f191e18d09cde40d4c98ebad7f0429bb8cbe969e8ec`。',
 '- `PUBLIC_V34_STATUS.json = PASS` 已由真实 GitHub Pages 重新下载验证并同步 main。',
 '- runtime → final release main `c231ba93d8647d1cadbe2d60ed9e1dac0813e59f` 仅新增 `PUBLIC_V34_STATUS.json`。',
 '',
 '**结论：V3.4 DONE。下一阶段：V3.5 正常游戏经济与世界整合。**'
].join('\n');
must(v34End,v34Record,'v34 completion record');

must('- [ ] 敌人 ≥ 45\n- [ ] 四大道途各至少 2 套中高阶构筑','- [x] 敌人 ≥ 45\n- [x] 独立战斗机制敌人 ≥ 12\n- [x] 四大道途各至少 2 套中高阶构筑','precharge combat gates');
must('| V3.4 战斗 / 四大道途 Build | TODO / CURRENT |\n| V3.5 正常经济 / 世界整合 | TODO |','| V3.4 战斗 / 四大道途 Build | DONE |\n| V3.5 正常经济 / 世界整合 | TODO / CURRENT |','progress table');

const changelog='\n\n## 2026-08-24 · V3.4 战斗与四大道途完整 Build\n\n- 正式版本：V3.4.0 / build 3401 / save schema31。\n- 敌人扩展至 48 个，其中 19 个 V3.4 新敌人全部拥有独立机制；超过“敌人 ≥45、独立机制敌人 ≥12”的最低门槛。\n- 四大道途正式形成 8 套中高阶 Build，每道 2 套；Build 由功法、主动术法、被动秘术和同道法宝共同识别，并真实影响战斗结算。\n- schema30 → 31、V2.9～V3.4 六代 headless、真实 Pages、公网源码 SHA、manifest 与固定 V6 图标全部 PASS。\n- 正式 runtime：`aa2c0e690ee8cf282602edeb047c3acd37914c0f`；final PASS main：`c231ba93d8647d1cadbe2d60ed9e1dac0813e59f`。\n- `PUBLIC_V34_STATUS.json` 已从真实 GitHub Pages 可达验证，并以相同 blob 同步 main；runtime → final main 仅新增该状态文件。\n- 充值前 Gate 的“敌人 ≥45”“独立战斗机制敌人 ≥12”“四大道途各至少 2 套中高阶构筑”正式勾选。\n- 下一阶段：V3.5 正常游戏经济与世界整合。\n';
if(s.includes('## 2026-08-24 · V3.4 战斗与四大道途完整 Build'))throw new Error('V3.4 changelog already exists');
s=s.trimEnd()+changelog;
fs.writeFileSync(output,s.endsWith('\n')?s:s+'\n','utf8');
console.log('V34_TASKBOOK_FINALIZE_PASS',JSON.stringify({output,version:'3.4.0',build:'3401',schema:31,runtime:'aa2c0e690ee8cf282602edeb047c3acd37914c0f',final:'c231ba93d8647d1cadbe2d60ed9e1dac0813e59f',next:'V3.5'}));
