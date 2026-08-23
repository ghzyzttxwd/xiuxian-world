const fs=require('fs');
const input=process.env.TASKBOOK_INPUT||'docs/PROJECT_TASKBOOK.md';
const output=process.env.TASKBOOK_OUTPUT||input;
let s=fs.readFileSync(input,'utf8');
function must(search,replacement,label){if(!s.includes(search))throw new Error('V3.5 taskbook anchor missing: '+label);s=s.replace(search,replacement)}

must('> 最近重大修订：2026-08-24 · V3.4 战斗与四大道途完整 Build 正式完成','> 最近重大修订：2026-08-24 · V3.5 正常经济与世界整合正式完成','header revision');
must('> 当前正式基线：V3.4.0 · 战斗与四大道途 Build · build 3401 · save schema 31','> 当前正式基线：V3.5.0 · 正常经济与世界整合 · build 3501 · save schema 32','header baseline');
must('# 2. V3.4 当前真实基线','# 2. V3.5 当前真实基线','baseline heading');
must('| 存档 | schema31；保留 `xiuxian_world_v02` | schema30 → 31 迁移 PASS，future schema32 保护 PASS |','| 存档 | schema32；保留 `xiuxian_world_v02` | schema31 → 32 迁移 PASS，future schema33 保护 PASS |','save baseline');
must('| NPC / 轮回 | 求援、人情债、仇怨伤亡、动态势力、重大人生、前尘旧缘等 | 旧系统完整保留 |','| NPC / 轮回 | 求援、人情债、仇怨伤亡、动态势力、重大人生、前尘旧缘等；V3.5 求援可指向具体命名材料 | 旧系统完整保留，并进入资源经济闭环 |\n| 正常经济 | 4 个稳定 shopId 场所；32 个固定交易定义；12 个拍卖候选；每期 5 个限量拍卖 lot | V3.5 完成坊市 / 宗门秘库 / 暗市 / 拍卖及世界联动 |','economy baseline row');
must('V3.4 已经把战斗从“拥有技能和法宝”推进到可识别、可验证的真实 Build：敌人扩展至 48 个，新增 19 个敌人均拥有独立机制；青云剑道、赤霞火道、万兽炼体、太虚神道各形成 2 套中高阶构筑，并由当前功法、六格主动术法、被动秘术与同道法宝共同识别。重甲、虚化、反伤、再生、抽灵、持续伤害、冷却压制、控制抗性、斩杀等机制已进入实际战斗。\n\n当前最明显短板转移到：\n\n> **正常经济与世界资源交换仍然偏薄：坊市、宗门兑换、黑市 / 特殊商人、高阶拍卖、势力冲突对商路和资源的影响，以及任务 / 秘境 / 交易之间的价值关系尚未形成完整闭环。**\n\n因此下一阶段进入 V3.5，优先完成无充值环境下的正常经济与世界整合。',
'V3.5 已经把原本彼此孤立的资源系统接成无充值经济闭环：临江坊市、青云秘库、黑风暗市、苍梧拍卖场建立稳定 shopId 和独立货源 / 币种 / 库存；命名材料与丹药可以真实买卖，宗门贡献进入专属兑换，势力关系与战乱会影响价格，NPC 会提出具体命名材料需求，秘境核心可产出区域特产并补全未知丹方。高阶关键资源已验证至少存在两类来源，但全项目经济死锁与终局稀缺性仍留待 V3.10 从凡人到真仙总平衡。\n\n当前最明显短板转移到：\n\n> **当前境界仍止于化神后期，高境界玩法还没有真正进入“空间 / 虚空”层级；炼虚必须新增独立空间感悟、空间能力、高阶地图、空间材料与专属突破代价，不能只继续提高经验和数值。**\n\n因此下一阶段进入 V3.6，正式开发化神后篇章 I：炼虚。','baseline narrative');
must('- V3.4 schema31 是当前正式存档基线，后续版本必须继续提供逐级迁移。','- V3.5 schema32 是当前正式存档基线，后续版本必须继续提供逐级迁移。','save compatibility');
must('`shopId` 与 `tribulationId` 留到对应系统出现时建立，不提前制造无用途空数据。','V3.5 已正式建立 `shopId`，并接入四类真实交易场所。`tribulationId` 留到渡劫系统出现时建立，不提前制造无用途空数据。','shopId architecture');

must('## V3.5 — 正常游戏经济与世界整合\n\n在完全没有模拟充值的情况下形成闭环：','## V3.5 — 正常游戏经济与世界整合\n\n**状态：DONE**\n\n在完全没有模拟充值的情况下形成闭环：','v35 status');
const v35End='- 前尘旧缘继续保持“小而有意义”，不能跨世复制高阶资源。';
const v35Record=[
'- 前尘旧缘继续保持“小而有意义”，不能跨世复制高阶资源。',
'',
'### V3.5 正式完成记录',
'',
'- 正式版本：V3.5.0 / build 3501 / save schema32 / content registry v6。',
'- 建立 4 个稳定 shopId 场所：临江坊市、青云秘库、黑风暗市、苍梧拍卖场。',
'- 固定交易定义 32 个，拍卖候选 12 个；苍梧拍卖每 30 日确定 5 个限量 lot，普通商店按 10 日库存周期刷新。',
'- 命名材料与常用丹药进入真实买卖；买卖采用原子检查，失败购买不会扣币、扣库存或改变物品。',
'- 青云秘库使用宗门贡献并校验宗门 / 身份；黑风暗市受血刀门关系影响价格；公开坊市受玄水关系与市场指数影响。',
'- 宗门战争会制造“商路短缺 / 战后缓和”价格冲击；暗市与公开市场对冲击的反应不同。',
'- NPC 求援可指向具体稳定 materialId；秘境核心可带出本区域命名材料，并在符合条件时补全一张未知丹方。',
'- 高阶关键资源已通过多来源健康检查；V3.5 证明当前化神内容不存在单一来源锁死，但凡人→真仙全局死锁 / 稀缺性仍保留到 V3.10 总平衡判定。',
'- schema31 → 32 迁移 PASS；future schema33 防覆盖 PASS；V3.4 战斗 Build、V3.3 炼丹材料、V3.2 法宝与旧 NPC / 轮回系统均完整保留。',
'- PR #47 功能验证、PR #48 发布兜底验证、PR #49 最终发布均 PASS，全部关闭且未合并。',
'- 正式 runtime commit：`cf99063b4be9d0ce38ef8b1039e3efc839a79cc6`。',
'- 正式源码 SHA256：`b533cd28b803c1da0823adb3c02e4cd85a54d804b744416d9f688a36c47260ed`。',
'- `PUBLIC_V35_STATUS.json = PASS` 已由真实 GitHub Pages 重新下载验证并同步 main。',
'- runtime → final release main `fb4b935d9f41aff232704686010b59ff3e156ecd` 仅新增 `PUBLIC_V35_STATUS.json`。',
'',
'**结论：V3.5 DONE。下一阶段：V3.6 化神后篇章 I：炼虚。**'
].join('\n');
must(v35End,v35Record,'v35 completion record');
must('## V3.6 — 化神后篇章 I：炼虚\n\n目标：第一次真正改变高境界玩法，而不是继续增加经验数字。','## V3.6 — 化神后篇章 I：炼虚\n\n**状态：TODO / 当前最高优先级**\n\n目标：第一次真正改变高境界玩法，而不是继续增加经验数字。','v36 current status');
must('| V3.5 正常经济 / 世界整合 | TODO / CURRENT |\n| V3.6 炼虚篇 | TODO |','| V3.5 正常经济 / 世界整合 | DONE |\n| V3.6 炼虚篇 | TODO / CURRENT |','progress table');

const changelog=[
'',
'## 2026-08-24 · V3.5 正常经济与世界整合',
'',
'- 正式版本：V3.5.0 / build 3501 / save schema32。',
'- 4 个稳定 shopId 交易场所、32 个固定交易定义、12 个拍卖候选与每期 5 个限量拍卖 lot 正式落地。',
'- 命名材料 / 丹药真实买卖、宗门贡献兑换、黑市声望差价、战乱价格冲击、NPC 指名材料求援、秘境区域特产与未知丹方奖励均进入真实玩法。',
'- 交易原子性、高阶资源多来源健康检查、schema31 → 32、V2.9～V3.5 七代回归链、真实 Pages、公网源码 SHA、manifest 与固定 V6 图标全部 PASS。',
'- 正式 runtime：`cf99063b4be9d0ce38ef8b1039e3efc839a79cc6`；final PASS main：`fb4b935d9f41aff232704686010b59ff3e156ecd`。',
'- `PUBLIC_V35_STATUS.json` 已从真实 GitHub Pages 可达验证，并以相同 blob 同步 main；runtime → final main 仅新增该状态文件。',
'- 模拟充值前 Gate 中“正常经济无严重死锁 / 高阶资源有多来源但仍然稀缺”仍保持未勾选，等待 V3.10 对凡人→真仙全流程做最终判定。',
'- 下一阶段：V3.6 化神后篇章 I：炼虚。',
''
].join('\n');
if(s.includes('## 2026-08-24 · V3.5 正常经济与世界整合'))throw new Error('V3.5 changelog already exists');
s=s.trimEnd()+changelog;
fs.writeFileSync(output,s.endsWith('\n')?s:s+'\n','utf8');
console.log('V35_TASKBOOK_FINALIZE_PASS',JSON.stringify({output,version:'3.5.0',build:'3501',schema:32,runtime:'cf99063b4be9d0ce38ef8b1039e3efc839a79cc6',final:'fb4b935d9f41aff232704686010b59ff3e156ecd',next:'V3.6'}));
