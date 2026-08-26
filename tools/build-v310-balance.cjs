const fs=require('fs');
const crypto=require('crypto');
const INPUT='src/game-v39.js',OUTPUT='src/game-v310.js',REPORT='BUILD_V310_BALANCE.json',BUILD='31001';
const v39=require('../content/v39-tribulation-ascension.cjs');
let src=fs.readFileSync(INPUT,'utf8');
function must(a,b,label){const i=src.indexOf(a);if(i<0)throw new Error('V3.10 transform miss: '+label);if(src.indexOf(a,i+1)>=0)throw new Error('V3.10 transform ambiguous: '+label);src=src.slice(0,i)+b+src.slice(i+a.length)}
function mustRegex(re,fn,label){let count=0;src=src.replace(re,m=>{count++;return fn(m)});if(count!==1)throw new Error('V3.10 regex transform count '+count+': '+label)}
function appendFrozenObject(name,entries,label){const start='const '+name+'=Object.freeze({',i=src.indexOf(start);if(i<0)throw new Error('V3.10 missing '+label);const end=src.indexOf('});',i+start.length);if(end<0)throw new Error('V3.10 unterminated '+label);const body=src.slice(i+start.length,end);src=src.slice(0,end)+(body.trim()?',':'')+entries+src.slice(end)}

must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='3.9.0'; const SAVE_SCHEMA_VERSION=36;","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='3.10.0'; const SAVE_SCHEMA_VERSION=36;",'version');
const oldGain="function cultivationGainForDays(days=1,retreatBoost=1){const p=state.player,d=Math.max(1,Math.floor(days)),base=rint(6*d,10*d),rootM=root().mult,manualM=manual().mult,injuryM=[1,.90,.70,.48][clamp(p.injury||0,0,3)],gain=Math.floor(base*rootM*manualM*injuryM*dwellingCultivationMultiplier()*Math.max(.1,retreatBoost));return Math.max(1,gain)}";
const newGain="function cultivationGainForDays(days=1,retreatBoost=1){const p=state.player,d=Math.max(1,Math.floor(days)),base=rint(6*d,10*d),rootM=root().mult,manualM=manual().mult,realmM=Math.max(1,Number(realm().rate)||1),injuryM=[1,.90,.70,.48][clamp(p.injury||0,0,3)],gain=Math.floor(base*rootM*manualM*realmM*injuryM*dwellingCultivationMultiplier()*Math.max(.1,retreatBoost));return Math.max(1,gain)}";
must(oldGain,newGain,'realm cultivation rate');

// V3.9 used a generic "append before };" helper against Object.freeze({...}); registries.
// The three terminal region IDs and ten terminal material descriptors therefore landed inside
// the low-tier factionContract object instead of the stable registries. Remove that pollution
// and register the already-existing V3.9 content in the intended canonical maps.
const contractStart="p.factionContract={faction:id,title:d.contract,progress:0,need:d.need,acceptedDay:dayNumber(),";
const ci=src.indexOf(contractStart);if(ci<0)throw new Error('V3.10 missing polluted factionContract');
const ce=src.indexOf("};addPersonal('你接下",ci);if(ce<0)throw new Error('V3.10 cannot bound polluted factionContract');
const polluted=src.slice(ci,ce);
for(const token of [...v39.regions.map(x=>x.name),...v39.materials.map(x=>x.id)])if(!polluted.includes(token))throw new Error('V3.10 expected pollution missing '+token);
src=src.slice(0,ci)+"p.factionContract={faction:id,title:d.contract,progress:0,need:d.need,acceptedDay:dayNumber()}"+src.slice(ce+1);

const regionIdEntries=v39.regions.map(r=>JSON.stringify(r.name)+':'+JSON.stringify(r.id)).join(',');
appendFrozenObject('REGION_ID_BY_NAME',regionIdEntries,'region id registry');
const materialEntries=v39.materials.map(m=>JSON.stringify(m.id)+':'+JSON.stringify({id:m.id,name:m.name,qualityId:m.qualityId,kind:m.kind,field:m.legacyField||null,locations:m.locations,minRealm:m.minRealm,named:true})).join(',');
appendFrozenObject('MATERIAL_REGISTRY',materialEntries,'material registry');

// V3.8 circular gate repair. V3.9 required realm 33 (合体圆满) to already have
// world authority >=20 and one natal-origin mark before entering 大乘, while the only
// normal authority/natal actions and the routes to their locations required realm 34.
// Keep the breakthrough requirements and resource costs; only make those two preparation
// chains reachable at realm 33 so a real player can satisfy the existing gate.
mustRegex(/\{"id":"originsea-ancestral"[^}]*"minRealm":34[^}]*\}/,m=>m.replace('"minRealm":34','"minRealm":33'),'pre-mahayana ancestral route');
mustRegex(/\{"id":"ancestral-council"[^}]*"minRealm":34[^}]*\}/,m=>m.replace('"minRealm":34','"minRealm":33'),'pre-mahayana council route');
must("if(p.realmIndex<34)return {ok:false,reason:'realm'};if((p.v38OriginInsight||0)<25)return {ok:false,reason:'origin'};","if(p.realmIndex<33)return {ok:false,reason:'realm'};if((p.v38OriginInsight||0)<25)return {ok:false,reason:'origin'};",'pre-mahayana world authority action');
must("if(p.realmIndex<34&&!force)return {ok:false,reason:'realm'};if((inv.originMarks||0)>=9)","if(p.realmIndex<33&&!force)return {ok:false,reason:'realm'};if((inv.originMarks||0)>=9)",'pre-mahayana natal origin action');
must("if(p.location==='人界议庭'&&p.realmIndex>=34)html+='<button data-v38-authority>处理世界事务</button>';","if(p.location==='人界议庭'&&p.realmIndex>=33)html+='<button data-v38-authority>处理世界事务</button>';",'pre-mahayana authority UI');

// Full-run evidence showed that repeated normal 三元归一 needs many 元神契石 before
// the first 合体 breakthrough. In V3.9 this material only came from dangerous random
// exploration in 法则古原 / 归一圣墟, while 法纹晶 already had a realm29 auction source.
// Add one expensive, low-stock auction lot. The map sources remain unchanged and are still
// useful; this only creates a second scarce economic recovery path instead of a free grant.
const soulAuctionOld='{"id":"auction-v37-lawcrystal","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v37-law-crystal","basePrice":520,"stock":2,"minRealm":29},{"id":"auction-v37-domain-sand","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v37-domain-sand","basePrice":680,"stock":1,"minRealm":30}';
const soulAuctionNew='{"id":"auction-v37-lawcrystal","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v37-law-crystal","basePrice":520,"stock":2,"minRealm":29},{"id":"auction-v37-soulcovenant","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v37-soul-covenant-stone","basePrice":780,"stock":1,"minRealm":29},{"id":"auction-v37-domain-sand","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v37-domain-sand","basePrice":680,"stock":1,"minRealm":30}';
must(soulAuctionOld,soulAuctionNew,'soul-covenant scarce auction source');

// V2.6 sect-life rendering appends to actions.innerHTML. V3.9 bound the core sect
// buttons first and then called renderSectLifePanel(), so the append reparsed the action
// container and silently discarded every already-bound handler. Render the extension first,
// then bind the complete current DOM once. This changes no task requirements or rewards.
const sectBindings="actions.querySelectorAll('[data-sect-task]').forEach(b=>b.onclick=()=>acceptSectTask(b.dataset.sectTask));const c=actions.querySelector('[data-sect-complete]');if(c)c.onclick=completeRoutineSectTask;const st=actions.querySelector('[data-sect-stipend]');if(st)st.onclick=claimSectStipend;actions.querySelectorAll('[data-sect-exchange]').forEach(b=>b.onclick=()=>sectExchange(b.dataset.sectExchange));actions.querySelectorAll('[data-sect-mentor]').forEach(b=>b.onclick=()=>chooseSectMentor(b.dataset.sectMentor));const mg=actions.querySelector('[data-mentor-guidance]');if(mg)mg.onclick=seekMentorGuidance;const ass=actions.querySelector('[data-sect-assessment]');if(ass)ass.onclick=takeSectAssessment;const pr=actions.querySelector('[data-sect-promote]');if(pr)pr.onclick=promoteSect;renderSectLifePanel(info,actions)";
const sectBindingsFixed="renderSectLifePanel(info,actions);actions.querySelectorAll('[data-sect-task]').forEach(b=>b.onclick=()=>acceptSectTask(b.dataset.sectTask));const c=actions.querySelector('[data-sect-complete]');if(c)c.onclick=completeRoutineSectTask;const st=actions.querySelector('[data-sect-stipend]');if(st)st.onclick=claimSectStipend;actions.querySelectorAll('[data-sect-exchange]').forEach(b=>b.onclick=()=>sectExchange(b.dataset.sectExchange));actions.querySelectorAll('[data-sect-mentor]').forEach(b=>b.onclick=()=>chooseSectMentor(b.dataset.sectMentor));const mg=actions.querySelector('[data-mentor-guidance]');if(mg)mg.onclick=seekMentorGuidance;const ass=actions.querySelector('[data-sect-assessment]');if(ass)ass.onclick=takeSectAssessment;const pr=actions.querySelector('[data-sect-promote]');if(pr)pr.onclick=promoteSect";
must(sectBindings,sectBindingsFixed,'Qingyun sect UI event handler preservation');

// Long-lived worlds can legitimately reach a point where every original NPC has died.
// V3.9 still assumed random minor-person events always had at least one living NPC and
// dereferenced undefined. Preserve mortality: do not respawn/revive anyone; the person event
// simply becomes an empty-road event when no living NPC exists.
must("function startMinorEvent(){\n const type=pick(['wounded','merchant','cave','npc']);\n if(type==='wounded'){\n  const npc=pick(state.npcs.filter(n=>n.alive));npc.known=true;",
"function startMinorEvent(){\n const type=pick(['wounded','merchant','cave','npc']),aliveNpcs=state.npcs.filter(n=>n.alive);\n if((type==='wounded'||type==='npc')&&!aliveNpcs.length){addPersonal('你在荒野转了一圈，昔日常见的同道踪迹已经难寻。');save();render();showResult('荒野寂寥','附近已经没有能与你相遇的活人。');return}\n if(type==='wounded'){\n  const npc=pick(aliveNpcs);npc.known=true;",'minor event empty living-NPC guard');
must(" else {const npc=pick(state.npcs.filter(n=>n.alive));npc.known=true;showChoice('偶遇同道'"," else {const npc=pick(aliveNpcs);npc.known=true;showChoice('偶遇同道'",'minor event shared living-NPC pool');

// V3.10 full-run exposed a real pre-Unity resource deadlock. At 炼虚圆满 the player
// needs 合体道胎 to craft 合体归一髓, but the only map source is 归一圣墟 (danger .97),
// whose encounter table starts at realm 31. The generic explore branch cannot reach its
// material-gather arm at that danger level, so the old data effectively required a realm29
// character to kill cross-major-realm enemies. Keep that dangerous combat source, but add a
// second costly normal source: genuine 三元归一 performed inside 归一圣墟 can condense one
// 合体道胎 at a modest rate. Each attempt still consumes 法纹晶 + 元神契石 and 8 days.
const unityOld="const gain=forceGain==null?rint(5,10):Math.max(1,Number(forceGain)||1);p.v37Unity=Math.min(120,(p.v37Unity||0)+gain);p.v37LawActions++;addPersonal('【三元归一】你以肉身承载、元神统御、'+row.name+'定序，归一度 +'+gain+'。','major');save();render();return {ok:true,gain,unity:p.v37Unity}}";
const unityNew="const gain=forceGain==null?rint(5,10):Math.max(1,Number(forceGain)||1);p.v37Unity=Math.min(120,(p.v37Unity||0)+gain);p.v37LawActions++;let unitySeed=0;if(forceGain==null&&p.location==='归一圣墟'&&rand()<.28){v33AddMaterial('mat-v37-unity-seed',1);unitySeed=1;addPersonal('【合体道胎】三元归一时，肉身、元神与法则短暂凝成稳定道胎，你收住了一枚合体道胎。','major')}addPersonal('【三元归一】你以肉身承载、元神统御、'+row.name+'定序，归一度 +'+gain+'。','major');save();render();return {ok:true,gain,unity:p.v37Unity,unitySeed}}";
must(unityOld,unityNew,'unity-seed second normal source');

// Expose the event entry point only on the existing internal test surface so regression can
// prove the empty-population case directly. It is not added to the legal full-run whitelist.
must("startRegionalEvent,factionStandingSnapshot,","startRegionalEvent,startMinorEvent,factionStandingSnapshot,",'minor event regression surface');

if(!src.includes("const SAVE_KEY='xiuxian_world_v02'"))throw new Error('SAVE_KEY changed');
if(/\beval\s*\(/.test(src))throw new Error('eval forbidden');
if(!src.includes("const VERSION='3.10.0'"))throw new Error('version missing');
if(!src.includes('const SAVE_SCHEMA_VERSION=36'))throw new Error('schema changed unexpectedly');
if(!src.includes('const CONTENT_STATE_VERSION=10'))throw new Error('registry version changed unexpectedly');
if(!src.includes('realmM=Math.max(1,Number(realm().rate)||1)'))throw new Error('realm rate missing');
if(!src.includes("if(p.realmIndex<33)return {ok:false,reason:'realm'};if((p.v38OriginInsight||0)<25)"))throw new Error('pre-mahayana authority repair missing');
if(!src.includes("if(p.realmIndex<33&&!force)return {ok:false,reason:'realm'};if((inv.originMarks||0)>=9)"))throw new Error('pre-mahayana natal repair missing');
if(!src.includes('"id":"auction-v37-soulcovenant","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v37-soul-covenant-stone","basePrice":780,"stock":1,"minRealm":29'))throw new Error('soul-covenant scarce auction source missing');
if(!src.includes("renderSectLifePanel(info,actions);actions.querySelectorAll('[data-sect-task]')"))throw new Error('Qingyun sect UI binding repair missing');
if(!src.includes("(type==='wounded'||type==='npc')&&!aliveNpcs.length"))throw new Error('empty living-NPC minor-event guard missing');
if(!src.includes("p.location==='归一圣墟'&&rand()<.28"))throw new Error('unity-seed second source missing');
for(const r of v39.regions)if(!src.includes(JSON.stringify(r.name)+':'+JSON.stringify(r.id)))throw new Error('region id repair missing '+r.name);
for(const m of v39.materials)if(!src.includes(JSON.stringify(m.id)+':'+JSON.stringify({id:m.id,name:m.name,qualityId:m.qualityId,kind:m.kind,field:m.legacyField||null,locations:m.locations,minRealm:m.minRealm,named:true})))throw new Error('material repair missing '+m.id);

fs.writeFileSync(OUTPUT,src);
const sha=crypto.createHash('sha256').update(Buffer.from(src)).digest('hex');
const report={status:'PASS',gameplay_version:'3.10.0',build:BUILD,milestone:'no-recharge-full-run-balance',source:OUTPUT,source_sha256:sha,source_bytes:Buffer.byteLength(src),save_schema_version:36,content_registry_version:10,changes:['realm cultivation rate is now applied to daily cultivation gain','V3.9 terminal region/material stable registries repaired and factionContract pollution removed','pre-Mahayana authority and natal-origin preparation routes/actions are reachable at realm 33 without lowering the existing breakthrough requirements','元神契石 gains an expensive stock-1 realm29 auction source while retaining its dangerous map sources','Qingyun sect-life rendering no longer invalidates already-bound sect action handlers','minor person events no longer crash when a long-lived world has no living NPCs','三元归一 in 归一圣墟 now provides a costly secondary 合体道胎 source so realm29 is not forced to kill realm31+ enemies'],invariants:['direct complete source','SAVE_KEY frozen','schema36 retained because no new state','content registry v10 retained','no eval','no runtime patch chain','NPC mortality remains meaningful; no respawn or revival added','法则古原 / 归一圣墟 danger and material gather rates are unchanged','元神契石 auction stock is one and still costs normal spirit stones','归一圣墟 remains dangerous; enemy tables and combat difficulty are unchanged','合体道胎 remains scarce and still consumes normal law/unity resources to obtain']};
fs.writeFileSync(REPORT,JSON.stringify(report,null,2)+'\n');
console.log('V310_BUILD_PASS '+JSON.stringify(report));
