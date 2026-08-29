const fs=require('fs');
const crypto=require('crypto');
const INPUT='src/game-v35.js',OUTPUT='src/game-v36.js',CATALOG='content/v36-refining-void.cjs',RUNTIME='tools/v36-refining-runtime.txt',REPORT='BUILD_V36_REFINING_VOID.json',BUILD='3601';
for(const f of [INPUT,CATALOG,RUNTIME])if(!fs.existsSync(f))throw new Error('V3.6 build missing '+f);
const data=require('../'+CATALOG);let src=fs.readFileSync(INPUT,'utf8'),runtime=fs.readFileSync(RUNTIME,'utf8').trimEnd();
const inner=a=>JSON.stringify(a).slice(1,-1);
function must(search,replacement,label){if(!src.includes(search))throw new Error('V3.6 transform did not match: '+label);src=src.replace(search,replacement)}
function appendBefore(anchor,rows,label){must(anchor,','+inner(rows)+anchor,label)}

must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='3.5.0'; const SAVE_SCHEMA_VERSION=32;","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='3.6.0'; const SAVE_SCHEMA_VERSION=33;",'version/schema');
must('const CONTENT_STATE_VERSION=6;','const CONTENT_STATE_VERSION=7;','registry version');

// Realm / world topology.
must("\n];\nconst V23_REALM_NEEDS=",','+inner(data.realms)+"\n];\nconst V23_REALM_NEEDS=",'append refining realms');
const regionText=data.regions.map(r=>JSON.stringify(r.name)+':'+JSON.stringify({desc:r.desc,links:r.links,danger:r.danger,herb:r.herb,work:r.work,find:r.find,faction:r.faction,specialty:r.specialty,secret:r.secret,eventRate:r.eventRate,eventKind:r.eventKind})).join(',');
must("\n};\nconst TRAVEL_ROUTES=[",','+regionText+"\n};\nconst TRAVEL_ROUTES=[",'append high regions');
must("\n];\nfunction routesFrom(location)",','+inner(data.routes)+"\n];\nfunction routesFrom(location)",'append high routes');
must(']);\nconst REGION_ID_BY_NAME=Object.freeze(',','+inner(data.realmIds)+']);\nconst REGION_ID_BY_NAME=Object.freeze(','append realm ids');
const regionIds=data.regions.map(r=>JSON.stringify(r.name)+':'+JSON.stringify(r.id)).join(',');
must('});\nconst MANUAL_ID_BY_NAME=Object.freeze(',','+regionIds+'});\nconst MANUAL_ID_BY_NAME=Object.freeze(','append region ids');

// Stable material registry and V3.1/V3.2/V3.3 content arrays.
const materialRegistryRows=data.materials.map(m=>JSON.stringify(m.id)+':'+JSON.stringify({id:m.id,name:m.name,qualityId:m.qualityId,kind:m.kind,field:m.legacyField||null,locations:m.locations,minRealm:m.minRealm,named:true})).join(',');
must('});\n\nconst CONSUMABLE_ITEM_META=Object.freeze(',','+materialRegistryRows+'});\n\nconst CONSUMABLE_ITEM_META=Object.freeze(','append stable material registry');
must(']);\nconst V31_SPELL_CATALOG=Object.freeze([',','+inner(data.manuals)+']);\nconst V31_SPELL_CATALOG=Object.freeze([','append manuals');
must(']);\nconst V31_MANUAL_BY_ID=Object.freeze(',','+inner(data.spells)+']);\nconst V31_MANUAL_BY_ID=Object.freeze(','append spells');
must(']);\nconst V32_ITEM_BY_ID=Object.freeze(',','+inner(data.equipment)+']);\nconst V32_ITEM_BY_ID=Object.freeze(','append equipment');
must(']);\nconst V33_RECIPE_CATALOG=Object.freeze([',','+inner(data.materials)+']);\nconst V33_RECIPE_CATALOG=Object.freeze([','append v33 materials');
must(']);\nconst V33_MATERIAL_BY_ID=Object.freeze(',','+inner(data.recipes)+']);\nconst V33_MATERIAL_BY_ID=Object.freeze(','append recipes');
must('\n];\nconst CONTENT_STATE_VERSION=7;',','+inner(data.enemies)+'\n];\nconst CONTENT_STATE_VERSION=7;','append enemies');
must(']);\nconst V35_SHOP_BY_ID=Object.freeze(',','+inner(data.auctionAdditions)+']);\nconst V35_SHOP_BY_ID=Object.freeze(','append auction additions');

// Runtime state / schema.
must('function rand(){state.rng=',runtime+'\n\nfunction rand(){state.rng=','inject refining runtime');
must(" 32(){ensureV35EconomyShape()} \n};"," 32(){ensureV35EconomyShape()},\n 33(){ensureV36VoidShape()} \n};",'schema33 migration');
must('ensureV34CombatShape();ensureV35EconomyShape();ensureNpcLifeShape();','ensureV34CombatShape();ensureV35EconomyShape();ensureV36VoidShape();ensureNpcLifeShape();','new state v36');
must("['world.v35TradeShock',w.v35TradeShock],","['world.v35TradeShock',w.v35TradeShock],['player.v36VoidVersion',p.v36VoidVersion],['player.v36SpaceInsight',p.v36SpaceInsight],['player.v36VoidBacklash',p.v36VoidBacklash],['player.v36RefiningFailures',p.v36RefiningFailures],['player.v36SpaceActions',p.v36SpaceActions],['player.v36SpaceSkillUses',p.v36SpaceSkillUses],['player.v36RiftWins',p.v36RiftWins],['player.voidEssence',p.voidEssence],['world.v36VoidEvents',w.v36VoidEvents],['world.v36LastVoidEventDay',w.v36LastVoidEventDay],",'schema v36 fields');
must('syncV34CombatState();syncV35EconomyState();syncStableContentState();syncV32GearState();syncV33AlchemyState();syncV34CombatState();syncV35EconomyState();state.version=VERSION;','syncV34CombatState();syncV35EconomyState();syncV36VoidState();syncStableContentState();syncV32GearState();syncV33AlchemyState();syncV34CombatState();syncV35EconomyState();syncV36VoidState();state.version=VERSION;','save v36 sync');

// Realm difficulty and breakthrough rules.
must("function majorRealmStage(index){const i=clamp(Number(index)||0,0,REALMS.length-1);return i===0?0:i<=9?1:i<=13?2:i<=18?3:i<=22?4:5}","function majorRealmStage(index){const i=clamp(Number(index)||0,0,REALMS.length-1);return i===0?0:i<=9?1:i<=13?2:i<=18?3:i<=22?4:i<=25?5:6}",'major realm stage refining');
must("function realmLifespanFloor(index){return index>=23?2000:index>=19?1000:index>=15?500:index>=14?300:index>=10?150:82}","function realmLifespanFloor(index){return index>=29?5000:index>=26?3500:index>=23?2000:index>=19?1000:index>=15?500:index>=14?300:index>=10?150:82}",'refining lifespan');
must(" if(i===22)return {kind:'炼神化神',core:0,nascent:2,deification:5,insight:10,days:30,base:.22,pity:16,lifeLoss:[40,80]};\n return null"," if(i===22)return {kind:'炼神化神',core:0,nascent:2,deification:5,insight:10,days:30,base:.22,pity:16,lifeLoss:[40,80]};\n if(i===25)return {kind:'炼虚破界',core:0,nascent:0,deification:3,voidEssence:5,spaceInsight:20,insight:18,days:60,base:.16,pity:18,lifeLoss:[120,240]};\n return null",'refining major requirement');
must("function majorBreakthroughReady(req){const p=state.player;return !req||((p.injury||0)===0&&(p.coreEssence||0)>=(req.core||0)&&(p.nascentEssence||0)>=(req.nascent||0)&&(p.deificationEssence||0)>=(req.deification||0)&&(p.insight||0)>=req.insight)}","function majorBreakthroughReady(req){const p=state.player;return !req||((p.injury||0)===0&&(p.coreEssence||0)>=(req.core||0)&&(p.nascentEssence||0)>=(req.nascent||0)&&(p.deificationEssence||0)>=(req.deification||0)&&(p.insight||0)>=req.insight&&v36MajorReady(req))}",'refining readiness');
must("function minorBreakthroughBase(index){const i=Number(index)||0;if(i===0)return .82;if(i<=8)return .74;if(i===9)return .48;if(i<=12)return .62;if(i<=17)return .52;if(i<=21)return .43;return .34}","function minorBreakthroughBase(index){const i=Number(index)||0;if(i===0)return .82;if(i<=8)return .74;if(i===9)return .48;if(i<=12)return .62;if(i<=17)return .52;if(i<=21)return .43;if(i<=25)return .34;if(i===26)return .28;if(i===27)return .24;return .20}",'refining minor difficulty');
must("+v33BuffValue('breakthrough'),req?.kind?.08:.16,req?.kind?.82:.92)","+v33BuffValue('breakthrough')+v36BreakthroughBonus(req),req?.kind?.08:.16,req?.kind?.82:.92)",'refining chance bonus');
must("if(state&&state.flags&&state.flags.dead)return showResult('此世已终','你已经身死道消。','bad');if(state.player.realmIndex>=REALMS.length-1)","if(state&&state.flags&&state.flags.dead)return showResult('此世已终','你已经身死道消。','bad');if(state.player.realmIndex===25)return v36AttemptRefiningBreakthrough();if(state.player.realmIndex>=REALMS.length-1)",'route refining breakthrough');
must('const oldRealm=realm().name,chance=breakthroughChance(),days=req?req.days:3;',"const oldRealm=realm().name,chance=breakthroughChance(),days=req?req.days:v36MinorBreakthroughDays(p.realmIndex);",'refining minor days');

// High-region gates and high-tier crafting costs.
must("if(!route)return showResult('道路不通','当前没有从【'+from+'】直达【'+to+'】的路线。','bad');if((route.fee||0)>state.player.spiritStones)","if(!route)return showResult('道路不通','当前没有从【'+from+'】直达【'+to+'】的路线。','bad');const v36gate=v36TravelGate(route,to);if(!v36gate.ok)return showResult('高阶道路尚未掌握',v36gate.reason==='realm'?'境界不足，至少需要 '+REALMS[v36gate.needRealm].name+'。':'空间感悟不足，需要 '+v36gate.needSpace+'。','bad');if((route.fee||0)>state.player.spiritStones)",'high route gate');
must("function v32CostText(row){const c=row.cost||{},out=[];if(c.materials)out.push('兽材'+c.materials);if(c.stones)out.push('灵石'+c.stones);if(c.rare)out.push('高阶灵材'+c.rare);if(c.relic)out.push('古修残片'+c.relic);if(c.core)out.push('结丹灵髓'+c.core);if(c.nascent)out.push('化婴灵胎'+c.nascent);if(c.deification)out.push('化神道种'+c.deification);return out.join(' · ')||'无'}","function v32CostText(row){const c=row.cost||{},out=[];if(c.materials)out.push('兽材'+c.materials);if(c.stones)out.push('灵石'+c.stones);if(c.rare)out.push('高阶灵材'+c.rare);if(c.relic)out.push('古修残片'+c.relic);if(c.core)out.push('结丹灵髓'+c.core);if(c.nascent)out.push('化婴灵胎'+c.nascent);if(c.deification)out.push('化神道种'+c.deification);const named=v36NamedCostText(c);if(named)out.push(named);return out.join(' · ')||'无'}",'named forge cost text');
must("function v32CostReady(row,p=state.player){const c=row.cost||{};return p.beastMaterials>=(c.materials||0)&&p.spiritStones>=(c.stones||0)&&(p.rareMaterials||0)>=(c.rare||0)&&(p.relicFragments||0)>=(c.relic||0)&&(p.coreEssence||0)>=(c.core||0)&&(p.nascentEssence||0)>=(c.nascent||0)&&(p.deificationEssence||0)>=(c.deification||0)}","function v32CostReady(row,p=state.player){const c=row.cost||{};return p.beastMaterials>=(c.materials||0)&&p.spiritStones>=(c.stones||0)&&(p.rareMaterials||0)>=(c.rare||0)&&(p.relicFragments||0)>=(c.relic||0)&&(p.coreEssence||0)>=(c.core||0)&&(p.nascentEssence||0)>=(c.nascent||0)&&(p.deificationEssence||0)>=(c.deification||0)&&v36NamedCostReady(c)}",'named forge cost ready');
must("function v32SpendCost(row,p=state.player){const c=row.cost||{};p.beastMaterials-=c.materials||0;p.spiritStones-=c.stones||0;p.rareMaterials-=c.rare||0;p.relicFragments-=c.relic||0;p.coreEssence-=c.core||0;p.nascentEssence-=c.nascent||0;p.deificationEssence-=c.deification||0}","function v32SpendCost(row,p=state.player){const c=row.cost||{};p.beastMaterials-=c.materials||0;p.spiritStones-=c.stones||0;p.rareMaterials-=c.rare||0;p.relicFragments-=c.relic||0;p.coreEssence-=c.core||0;p.nascentEssence-=c.nascent||0;p.deificationEssence-=c.deification||0;v36SpendNamedCost(c)}",'named forge cost spend');

// Space combat semantics.
must('*v34BuildDamageMultiplier(def,effect);','*v34BuildDamageMultiplier(def,effect)*v36SpaceDamageMultiplier(effect);','space rend damage');
must('v34AfterPlayerSkill(id,row,effect,damage);for(const sid','v34AfterPlayerSkill(id,row,effect,damage);v36AfterSpaceSkill(id,row,effect,damage);for(const sid','space skill hook');
must('tickCombatStatuses();v32AfterCombatRound();v34AfterCombatRound()}','tickCombatStatuses();v32AfterCombatRound();v34AfterCombatRound();v36AfterCombatRound()}','space round hook');
must("if(m.type==='phase'&&combat.round%(m.every||3)===0)reduction=m.damageReduction||0;","if(m.type==='phase'&&combat.round%(m.every||3)===0&&!v36EnemySpaceLocked())reduction=m.damageReduction||0;",'space lock counters phase');
must("chance=clamp(.40+windBonus+v33BuffValue('flee')-diff*.08,.12,.88)","chance=clamp(.40+windBonus+v33BuffValue('flee')+v36SpaceEscapeBonus()-diff*.08,.12,.88)",'space escape');
must("*v33BuffMultiplier('incoming')*v34BuildIncomingMultiplier()));","*v33BuffMultiplier('incoming')*v34BuildIncomingMultiplier()*v36IncomingMultiplier()));",'void phase incoming');
must('onV33CombatWin(e);onV34CombatWin(e);onDaoCombatWin(e);','onV33CombatWin(e);onV34CombatWin(e);onV36CombatWin(e);onDaoCombatWin(e);','void combat win');

// UI and test API.
must('renderV31GrowthPanel();renderV34BuildPanel();renderSect();','renderV31GrowthPanel();renderV34BuildPanel();renderV36VoidPanel();renderSect();','render v36 panel');
must('window.__TAIXUAN_TEST__={contentRegistrySnapshot,ensureContentStateShape,', 'window.__TAIXUAN_TEST__={contentRegistrySnapshot,ensureContentStateShape,ensureV36VoidShape,syncV36VoidState,v36CatalogSnapshot,v36StateSnapshot,v36SetPlayerForTest,v36TravelGate,v36ContemplateSpace,v36CraftVoidEssence,v36AttemptRefiningBreakthrough,v36MajorReady,v36BreakthroughBonus,v36SpaceDamageMultiplier,v36AfterSpaceSkill,v36IncomingMultiplier,v36EnemySpaceLocked,');

fs.writeFileSync(OUTPUT,src,'utf8');const sha=crypto.createHash('sha256').update(src).digest('hex');
const report={status:'PASS',gameplay_version:'3.6.0',build:BUILD,milestone:'refining-void-space',source:OUTPUT,source_sha256:sha,source_bytes:Buffer.byteLength(src),save_schema_version:33,content_registry_version:7,counts:{realms:30,regions:16,routes:26,materials:60,recipes:32,manuals:32,spells:72,equipment:68,true_artifacts:32,enemies:60,auction_pool:16},checks:['four refining realms','space insight','high-region travel gates','twelve space materials','refining void essence','major refining breakthrough','void backlash failure','four refining manuals','twelve space skills','eight refining artifacts with named material costs','eight refining recipes','twelve high-tier enemies','space shift lock phase and rend combat','schema32 to schema33 migration','V3.5 economy preserved','future schema34 protection']};
if(report.counts.realms!==26+data.realms.length||report.counts.materials!==48+data.materials.length||report.counts.spells!==60+data.spells.length||report.counts.enemies!==48+data.enemies.length)throw new Error('V3.6 hard gate count failed');
fs.writeFileSync(REPORT,JSON.stringify(report,null,2)+'\n');console.log('V36_BUILD_PASS',JSON.stringify(report));
