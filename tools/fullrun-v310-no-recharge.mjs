import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX='index.html';
const GAME='src/game-v310.js';
const RESULT='V310_FULLRUN_RESULT.json';
const DAO_PATH=process.env.V310_DAO_PATH||'sword';
const SEED=Number(process.env.V310_FULLRUN_SEED||31006701)>>>0;
const MAX_ACTIONS=Math.max(2000,Number(process.env.V310_FULLRUN_MAX_ACTIONS||180000));
const MAX_FARM_ACTIONS=Math.max(200,Number(process.env.V310_FULLRUN_MAX_FARM_ACTIONS||2400));
const VALID_PATHS=new Set(['sword','flame','body','spirit']);
assert(VALID_PATHS.has(DAO_PATH),`unsupported dao path ${DAO_PATH}`);

const html=fs.readFileSync(INDEX,'utf8').replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'');
const source=fs.readFileSync(GAME,'utf8');
assert(source.includes("const VERSION='3.10.0'"),'V3.10 source not built');
assert(source.includes('realmM=Math.max(1,Number(realm().rate)||1)'),'realm-rate balance patch missing');
assert(!/\beval\s*\(/.test(source),'eval forbidden');

function seededRandom(seed){let x=seed>>>0;return()=>{x=(x+0x6D2B79F5)>>>0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
const dom=new JSDOM(html,{url:'http://v310-fullrun.test/',runScripts:'outside-only',pretendToBeVisual:true});
dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
dom.window.scrollTo=()=>{};
dom.window.console=console;
dom.window.Math.random=seededRandom(SEED);
dom.window.eval(source);
const api=dom.window.__TAIXUAN_TEST__;
assert(api,'test surface missing');

const legalCalls=new Set([
 'newGame','getState','getCombat','action','travel','routeInfo','realmBalance','remainingLifespanYears','maxHp','maxQi',
 'attemptBreakthrough','coreRequirements','breakthroughChance','chooseDaoPath','retreatSevenDays','combatAction',
 'contentRegistrySnapshot','v31CatalogSnapshot','learnV31Manual','switchV31Manual','learnV31Spell','equipV31Skill','equipV31Passive',
 'forgeV32Item','bindV32Artifact','refineV32Artifact','repairV32Artifact','warmV32Artifact','makeNatalV32Artifact','equipV32Artifact',
 'craftCoreEssence','craftNascentEssence','craftDeificationEssence',
 'v36StateSnapshot','v36ContemplateSpace','v36CraftVoidEssence','v36AttemptRefiningBreakthrough',
 'v37StateSnapshot','v37ChooseLaw','v37ContemplateLaw','v37IntegrateUnity','v37CraftUnityEssence','v37AttemptUnityBreakthrough','v37MinorGate',
 'v38StateSnapshot','v38ContemplateOrigin','v38ExerciseWorldAuthority','v38CraftMahayanaEssence','v38TemperNatalOrigin','v38PrepareTribulation','v38AttemptMahayanaBreakthrough','v38MinorGate','v38TribulationPrepSnapshot',
 'v39StateSnapshot','v39TribulationReadiness','v39BuildTribulationFormation','v39BeginTribulation','v39ThunderStage','v39ResolveThunder','v39ResolveHeartDemon','v39ResolveTransformation','v39AscendToTrueImmortal'
]);
const deniedFragments=['SetPlayerForTest','AddMaterial','forceNpc','ForTest','ActivateBuildForTest'];
const calls=[];
let actions=0;
let maxRealm=0;
const realmLog=[];
const blockerHistory=[];

function invoke(name,...args){
 if(!legalCalls.has(name))throw new Error(`illegal harness call blocked: ${name}`);
 if(deniedFragments.some(x=>name.includes(x)))throw new Error(`forbidden harness call blocked: ${name}`);
 const fn=api[name];
 if(typeof fn!=='function')throw new Error(`required legal API missing: ${name}`);
 calls.push({name,args:args.map(x=>typeof x==='object'?'[object]':x)});
 return fn(...args);
}
function state(){return invoke('getState')}
function combat(){return invoke('getCombat')}
function realmRow(i=state().player.realmIndex){return invoke('realmBalance')[i]}
function materialCount(id){const p=state().player;return Math.max(0,Number(p.materialInventoryById?.[id]??p.materialCountsById?.[id])||0)}
function ageYears(s=state()){const d=((s.time.year-1)*360+(s.time.month-1)*30+s.time.day)-1;return s.player.startAge+d/360}
function checkpoint(label){const s=state(),p=s.player;maxRealm=Math.max(maxRealm,p.realmIndex);const last=realmLog.at(-1);if(!last||last.realmIndex!==p.realmIndex){realmLog.push({label,realmIndex:p.realmIndex,realm:realmRow(p.realmIndex)?.name,age:Number(ageYears(s).toFixed(2)),lifespan:p.lifespan,location:p.location,stones:p.spiritStones,insight:p.insight,path:p.daoPath});console.log('V310_FULLRUN_REALM',JSON.stringify(realmLog.at(-1)))}}
function spendAction(label,fn){if(++actions>MAX_ACTIONS)fail('action-limit',{label,limit:MAX_ACTIONS});const before=state();const out=fn();const after=state();if(after.flags?.dead)fail('death',{label,cause:after.flags.deathCause||'unknown',deathAge:after.flags.deathAge,deathRealm:after.flags.deathRealm});if(after.player.realmIndex!==before.player.realmIndex)checkpoint(label);return out}
function slimState(){const s=state(),p=s.player;return {version:s.version,realmIndex:p.realmIndex,realm:realmRow(p.realmIndex)?.name,progress:p.progress,need:realmRow(p.realmIndex)?.need,age:Number(ageYears(s).toFixed(2)),lifespan:p.lifespan,remaining:invoke('remainingLifespanYears'),location:p.location,daoPath:p.daoPath,manual:p.manual,stones:p.spiritStones,herbs:p.herbs,beastMaterials:p.beastMaterials,rareMaterials:p.rareMaterials,relicFragments:p.relicFragments,insight:p.insight,coreEssence:p.coreEssence,nascentEssence:p.nascentEssence,deificationEssence:p.deificationEssence,spaceInsight:p.v36SpaceInsight,lawProficiency:p.v37LawProficiency,unity:p.v37Unity,originInsight:p.v38OriginInsight,worldAuthority:p.v38WorldAuthority,natalMarks:p.v38NatalOriginMarks,tribulationPrep:p.v38TribulationPrep,formationId:p.v39FormationId,tribulationStatus:p.v39TribulationStatus,thunderStage:p.v39ThunderStage,transformStep:p.v39TransformationStep,ascended:!!p.v39AscensionComplete,battleWins:p.battleWins,battleLosses:p.battleLosses}}
function writeResult(status,extra={}){const out={status,seed:SEED,daoPath:DAO_PATH,actions,maxRealm,realmLog,legalCallCount:calls.length,forbiddenCalls:[],final:slimState(),...extra};fs.writeFileSync(RESULT,JSON.stringify(out,null,2)+'\n');return out}
function fail(kind,details={}){const entry={kind,details,state:slimState(),actions};blockerHistory.push(entry);const out=writeResult('BLOCKED',{blocker:entry,blockerHistory});console.error('V310_FULLRUN_BLOCKED',JSON.stringify(out));throw new Error(`V3.10 full-run blocked: ${kind}`)}

invoke('newGame',`V310无充值-${DAO_PATH}-${SEED}`);
checkpoint('new-game');
const registry=invoke('contentRegistrySnapshot');
assert.equal(state().version,'3.10.0');
assert.equal(state().saveSchemaVersion,36);

function resolveCombat(preferWin=false){
 let guard=0;
 while(combat()){
  if(++guard>120)fail('combat-loop',{combat:combat()});
  const c=combat(),s=state(),enemyRealm=Number(c.enemy?.realm)||0;
  const hpRatio=c.playerHp/Math.max(1,invoke('maxHp'));
  if(!preferWin||enemyRealm>s.player.realmIndex||hpRatio<.28){spendAction('combat-flee',()=>invoke('combatAction','flee'));continue}
  let advanced=false;
  const tryCombat=(a)=>{if(!combat())return true;const before=combat().round;spendAction(`combat-${a}`,()=>invoke('combatAction',a));const now=combat();if(!now||now.round!==before)advanced=true;return !now};
  if(s.player.v37LawId&&tryCombat('lawdomain'))continue;
  if(s.player.realmIndex>=34&&tryCombat('worldedict'))continue;
  const loadout=Object.values(s.player.artifactLoadout||{}).filter(Boolean);
  for(const id of loadout){if(tryCombat(`artifact:${id}`))break;if(advanced)break}
  if(!combat())continue;
  if(advanced)continue;
  for(const id of s.player.activeSkillIds||[]){if(!id)continue;if(tryCombat(`skill:${id}`))break;if(advanced)break}
  if(!combat())continue;
  if(!advanced)spendAction('combat-attack',()=>invoke('combatAction','attack'));
 }
}
function heal(){let guard=0;while(true){const s=state(),p=s.player;if(!p.injury&&p.hp>=invoke('maxHp')*.82)return;if(++guard>10)fail('healing-loop',{});spendAction('rest',()=>invoke('action','rest'));resolveCombat(false)}}
function act(name,preferWin=false){const out=spendAction(name,()=>invoke('action',name));resolveCombat(preferWin);heal();return out}

function routeAccessible(r,s=state()){
 const p=s.player;
 if((r.minRealm||0)>p.realmIndex)return false;
 if((r.spaceInsight||0)>(p.v36SpaceInsight||0))return false;
 if((r.lawProf||0)>(p.v37LawProficiency||0))return false;
 if((r.originInsight||0)>(p.v38OriginInsight||0))return false;
 if(r.tribulationState&&p.v39TribulationStatus!==r.tribulationState)return false;
 return true;
}
function findPath(from,to){
 if(from===to)return [];
 const q=[[from,[]]],seen=new Set([from]);
 while(q.length){const [loc,path]=q.shift();const rows=invoke('routeInfo',loc)||[];for(const r of rows){if(!routeAccessible(r))continue;const next=r.to;if(seen.has(next))continue;const np=[...path,r];if(next===to)return np;seen.add(next);q.push([next,np])}}
 return null;
}
function earnStones(target){let stagnant=0,last=state().player.spiritStones;while(state().player.spiritStones<target){act('work',false);const cur=state().player.spiritStones;stagnant=cur>last?0:stagnant+1;last=cur;if(stagnant>30)fail('stone-income-deadlock',{target})}}
function goTo(to){let s=state();if(s.player.location===to)return true;let path=findPath(s.player.location,to);if(!path)return false;for(const r of path){s=state();if((r.fee||0)>s.player.spiritStones)earnStones((r.fee||0)+5);const before=s.player.location;spendAction(`travel:${r.to}`,()=>invoke('travel',r.to,r.id));resolveCombat(false);heal();const after=state().player.location;if(after===before)fail('travel-action-no-progress',{from:before,to:r.to,route:r});if(after!==r.to)fail('travel-wrong-destination',{from:before,wanted:r.to,actual:after,route:r})}return state().player.location===to}
function goAny(candidates){for(const x of candidates){if(goTo(x))return x}return null}

function ensureHerbs(n){if(state().player.herbs>=n)return;const loc=goAny(['青石村','青石镇','云梦泽','青云山'])||state().player.location;let guard=0;while(state().player.herbs<n){if(++guard>MAX_FARM_ACTIONS)fail('herb-farm-deadlock',{target:n,location:loc});act('gather',false)}}
function ensureBeast(n){if(state().player.beastMaterials>=n)return;const loc=goAny(['黑风岭','万兽山脉']);if(!loc)fail('beast-source-unreachable',{target:n});let guard=0;while(state().player.beastMaterials<n){if(++guard>MAX_FARM_ACTIONS)fail('beast-farm-deadlock',{target:n,location:loc});act('explore',true)}}
function ensureRelic(n){if(state().player.relicFragments>=n)return;const loc=goAny(['古河遗迹','玄阴禁地']);if(!loc)fail('relic-source-unreachable',{target:n});let guard=0;while(state().player.relicFragments<n){if(++guard>MAX_FARM_ACTIONS)fail('relic-farm-deadlock',{target:n,location:loc});act('explore',true)}}
function ensureRare(n){if(state().player.rareMaterials>=n)return;const loc=goAny(['古河遗迹','玄阴禁地','万兽山脉','赤霞谷']);if(!loc)fail('rare-source-unreachable',{target:n});let guard=0;while(state().player.rareMaterials<n){if(++guard>MAX_FARM_ACTIONS)fail('rare-farm-deadlock',{target:n,location:loc});act('explore',true)}}
function ensureInsight(n){if(state().player.insight>=n)return;const loc=goAny(['玄阴禁地','上古断界台','法则古原','古河遗迹']);if(!loc)fail('insight-source-unreachable',{target:n});let guard=0;while(state().player.insight<n){if(++guard>MAX_FARM_ACTIONS)fail('insight-farm-deadlock',{target:n,location:loc});act('explore',true)}}
function ensureStones(n){if(state().player.spiritStones>=n)return;const workLoc=goAny(['临江城','苍梧郡城','天渊城','青石镇'])||state().player.location;if(state().player.location!==workLoc&&!goTo(workLoc))fail('work-source-unreachable',{target:n});earnStones(n)}
function ensureField(field,n){if((state().player[field]||0)>=n)return;({spiritStones:ensureStones,herbs:ensureHerbs,beastMaterials:ensureBeast,rareMaterials:ensureRare,relicFragments:ensureRelic,insight:ensureInsight}[field]||(()=>fail('unknown-basic-field',{field,n})))(n)}

function ensureNamed(id,n){if(materialCount(id)>=n)return;const m=registry.materials[id];if(!m)fail('material-registry-missing',{id,target:n});const sources=(m.locations||[]).filter(Boolean);let chosen=null;for(const loc of sources){if(goTo(loc)){chosen=loc;break}}if(!chosen)fail('named-material-source-unreachable',{id,name:m.name,target:n,sources});let guard=0,last=materialCount(id),wins0=state().player.battleWins;while(materialCount(id)<n){if(++guard>MAX_FARM_ACTIONS)fail('named-material-farm-deadlock',{id,name:m.name,target:n,current:materialCount(id),location:chosen,battleWinsGained:state().player.battleWins-wins0});act('explore',true);const cur=materialCount(id);if(cur>last){console.log('V310_FULLRUN_MATERIAL',JSON.stringify({id,name:m.name,count:cur,target:n,location:chosen,actions}));last=cur}}
}
function ensureCost(cost={}){for(const [k,v] of Object.entries(cost||{})){if(!v)continue;if(k==='stones')ensureStones(v);else if(k==='materials')ensureBeast(v);else if(k==='rare')ensureRare(v);else if(k==='relic')ensureRelic(v);else if(k==='core')ensureCore(v);else if(k==='nascent')ensureNascent(v);else if(k==='deification')ensureDeification(v);else if(k==='insight')ensureInsight(v);else if(k==='named')for(const [id,n] of Object.entries(v))ensureNamed(id,n)}}

function ensureCore(n){let guard=0;while(state().player.coreEssence<n){if(++guard>40)fail('core-essence-loop',{target:n});ensureHerbs(state().player.herbs+4);ensureBeast(state().player.beastMaterials+2);ensureStones(state().player.spiritStones+6);if(!goAny(['赤霞谷','落星矿脉','古河遗迹']))fail('core-craft-location-unreachable',{});const before=state().player.coreEssence;spendAction('craft-core',()=>invoke('craftCoreEssence'));if(state().player.coreEssence<=before)fail('core-craft-no-progress',{target:n})}}
function ensureNascent(n){let guard=0;while(state().player.nascentEssence<n){if(++guard>40)fail('nascent-essence-loop',{target:n});ensureCore(state().player.coreEssence+1);ensureRelic(state().player.relicFragments+2);ensureHerbs(state().player.herbs+6);ensureStones(state().player.spiritStones+12);if(!goAny(['古河遗迹','玄阴禁地']))fail('nascent-craft-location-unreachable',{});const before=state().player.nascentEssence;spendAction('craft-nascent',()=>invoke('craftNascentEssence'));if(state().player.nascentEssence<=before)fail('nascent-craft-no-progress',{target:n})}}
function ensureDeification(n){let guard=0;while(state().player.deificationEssence<n){if(++guard>50)fail('deification-essence-loop',{target:n});ensureNascent(state().player.nascentEssence+1);ensureRelic(state().player.relicFragments+3);ensureBeast(state().player.beastMaterials+4);ensureHerbs(state().player.herbs+8);ensureStones(state().player.spiritStones+25);if(!goAny(['古河遗迹','玄阴禁地']))fail('deification-craft-location-unreachable',{});const before=state().player.deificationEssence;spendAction('craft-deification',()=>invoke('craftDeificationEssence'));if(state().player.deificationEssence<=before)fail('deification-craft-no-progress',{target:n})}}

function choosePath(){const p=state().player;if(p.daoPath===DAO_PATH)return;if(p.daoPath!=='none'&&p.daoPath!==DAO_PATH)fail('dao-path-mismatch',{current:p.daoPath,wanted:DAO_PATH});if(p.realmIndex<10)return;ensureInsight(2);spendAction('choose-dao-path',()=>invoke('chooseDaoPath',DAO_PATH));if(state().player.daoPath!=='none'&&state().player.daoPath!==DAO_PATH)fail('dao-path-changed-wrong',{current:state().player.daoPath})}
function bestManualCandidate(){const s=state(),p=s.player,cat=invoke('v31CatalogSnapshot').manuals||[];const rows=cat.filter(r=>(r.unlock||0)<=p.realmIndex&&(!r.path||r.path==='none'||r.path===DAO_PATH)&&Number(r.mult||0)>0).sort((a,b)=>Number(b.mult||0)-Number(a.mult||0));return rows[0]||null}
function improveManual(){choosePath();const row=bestManualCandidate();if(!row)return;const current=registry.manuals[state().player.manualId]||Object.values(registry.manuals).find(x=>x.name===state().player.manual);if(current&&Number(current.mult||1)>=Number(row.mult||1)-.001)return;const meta=registry.manuals[row.id]||row;if(!(meta.sources||[]).some(x=>findPath(state().player.location,x)!==null))return;ensureCost(meta.cost||{});const loc=goAny(meta.sources||[]);if(!loc)return;const res=spendAction(`learn-manual:${row.id}`,()=>invoke('learnV31Manual',row.id));if(!['learned','known'].includes(res))return;spendAction(`switch-manual:${row.id}`,()=>invoke('switchV31Manual',row.id))}
function improveSkills(){choosePath();if(state().player.realmIndex<10)return;const spells=Object.values(registry.spells).filter(r=>r.unlock<=state().player.realmIndex&&r.category!=='passive'&&(!r.path||r.path==='none'||r.path===DAO_PATH)&&Number(r.power||0)>0).sort((a,b)=>Number(b.power||0)-Number(a.power||0)).slice(0,4);let slot=0;for(const row of spells){if(row.name in state().player.spells){spendAction(`equip-skill:${row.id}`,()=>invoke('equipV31Skill',slot++,row.id));continue}if(!(row.sources||[]).some(x=>findPath(state().player.location,x)!==null))continue;ensureCost(row.cost||{});if(!goAny(row.sources||[]))continue;const res=spendAction(`learn-skill:${row.id}`,()=>invoke('learnV31Spell',row.id));if(['learned','known'].includes(res))spendAction(`equip-skill:${row.id}`,()=>invoke('equipV31Skill',slot++,row.id));if(slot>=4)break}}

const natalPlan={
 sword:{itemId:'item-v32-sevenstar-swordcase',sources:['青云山']},
 flame:{itemId:'item-gear-danxia',sources:['赤霞谷']},
 body:{itemId:'item-v32-mountainseal',sources:['万兽山脉']},
 spirit:{itemId:'item-v32-banbreaker-ruler',sources:['古河遗迹']}
};
function ensureNatalArtifact(){const p=state().player;if(p.natalArtifactId)return;if(p.realmIndex<15)return;const plan=natalPlan[DAO_PATH],item=registry.items[plan.itemId];if(!item)fail('natal-item-registry-missing',{itemId:plan.itemId});let guard=0;while(!state().player.equipmentInventory?.[plan.itemId]){if(++guard>16)fail('natal-forge-loop',{itemId:plan.itemId});ensureCost(item.cost||{});if(!goAny(item.sources||plan.sources))fail('natal-forge-location-unreachable',{itemId:plan.itemId});spendAction(`forge-natal-base:${plan.itemId}`,()=>invoke('forgeV32Item',plan.itemId));heal()}
 ensureInsight(8);ensureStones(Math.max(350,state().player.spiritStones));ensureRare(Math.max(16,state().player.rareMaterials));ensureRelic(Math.max(8,state().player.relicFragments));
 let r=spendAction('bind-natal-base',()=>invoke('bindV32Artifact',plan.itemId));if(!['ok','bound'].includes(r))fail('natal-bind-blocked',{result:r,itemId:plan.itemId});
 guard=0;while((state().player.equipmentInventory?.[plan.itemId]?.refinement||0)<3){if(++guard>24)fail('natal-refine-loop',{itemId:plan.itemId});ensureStones(500);ensureRare(20);const x=spendAction('refine-natal-base',()=>invoke('refineV32Artifact',plan.itemId));if(x==='damage'){ensureStones(500);ensureRare(20);const rr=spendAction('repair-natal-base',()=>invoke('repairV32Artifact',plan.itemId));if(!['ok','healthy'].includes(rr))fail('natal-repair-blocked',{result:rr})}}
 guard=0;while((state().player.equipmentInventory?.[plan.itemId]?.warmth||0)<20){if(++guard>12)fail('natal-warm-loop',{itemId:plan.itemId});ensureStones(500);spendAction('warm-natal-base',()=>invoke('warmV32Artifact',plan.itemId))}
 ensureInsight(5);ensureRare(3);ensureStones(50);r=spendAction('make-natal',()=>invoke('makeNatalV32Artifact',plan.itemId));if(!['ok','natal'].includes(r))fail('make-natal-blocked',{result:r,itemId:plan.itemId})}

function ensureSpace(n){let guard=0;while((state().player.v36SpaceInsight||0)<n){if(++guard>MAX_FARM_ACTIONS)fail('space-insight-deadlock',{target:n});const loc=goAny(['上古断界台','虚空裂隙','空冥裂谷','天渊城']);if(!loc)fail('space-contemplation-source-unreachable',{target:n});const before=state().player.v36SpaceInsight;spendAction('contemplate-space',()=>invoke('v36ContemplateSpace'));heal();if((state().player.v36SpaceInsight||0)<=before&&guard>20)fail('space-contemplation-no-progress',{target:n,location:loc})}}
function ensureVoidEssence(n){let guard=0;while(materialCount('mat-v36-void-essence')<n){if(++guard>40)fail('void-essence-loop',{target:n});ensureSpace(12);ensureNamed('mat-v36-space-crystal',2);ensureNamed('mat-v36-void-sand',2);ensureNamed('mat-v36-rift-silk',1);ensureDeification(state().player.deificationEssence+1);if(!goAny(['虚空裂隙','空冥裂谷','上古断界台']))fail('void-craft-location-unreachable',{});const before=materialCount('mat-v36-void-essence');const r=spendAction('craft-void-essence',()=>invoke('v36CraftVoidEssence'));if(!r?.ok||materialCount('mat-v36-void-essence')<=before)fail('void-craft-blocked',{result:r})}}
const lawByPath={sword:'law-severing',flame:'law-annihilation',body:'law-immovable',spirit:'law-soulorder'};
function ensureLawChosen(){if(state().player.v37LawId)return;if(state().player.realmIndex<29)return;ensureInsight(state().player.insight+10);ensureNamed('mat-v37-law-crystal',2);ensureNamed('mat-v37-rule-dust',1);if(!goAny(['法则古原','万象法坛']))fail('law-choice-location-unreachable',{});const r=spendAction('choose-law',()=>invoke('v37ChooseLaw',lawByPath[DAO_PATH]));if(!r?.ok)fail('law-choice-blocked',{result:r})}
function ensureLaw(n){ensureLawChosen();let guard=0;while((state().player.v37LawProficiency||0)<n){if(++guard>MAX_FARM_ACTIONS)fail('law-proficiency-deadlock',{target:n});const loc=goAny(['归一圣墟','万象法坛','天衡战城','法则古原']);if(!loc)fail('law-contemplation-source-unreachable',{target:n});const before=state().player.v37LawProficiency;const r=spendAction('contemplate-law',()=>invoke('v37ContemplateLaw'));heal();if(!r?.ok||state().player.v37LawProficiency<=before)fail('law-contemplation-blocked',{result:r,target:n})}}
function ensureUnity(n){ensureLaw(Math.min(35,Math.max(20,n)));let guard=0;while((state().player.v37Unity||0)<n){if(++guard>MAX_FARM_ACTIONS)fail('unity-deadlock',{target:n});ensureNamed('mat-v37-law-crystal',1);ensureNamed('mat-v37-soul-covenant-stone',1);if(!goAny(['归一圣墟','万象法坛','天衡战城']))fail('unity-location-unreachable',{target:n});const before=state().player.v37Unity;const r=spendAction('integrate-unity',()=>invoke('v37IntegrateUnity'));heal();if(!r?.ok||state().player.v37Unity<=before)fail('unity-action-blocked',{result:r,target:n})}}
function ensureUnityEssence(n){let guard=0;while(materialCount('mat-v37-unity-essence')<n){if(++guard>50)fail('unity-essence-loop',{target:n});ensureLaw(35);ensureUnity(30);ensureNamed('mat-v37-unity-seed',2);ensureNamed('mat-v37-law-crystal',2);ensureNamed('mat-v37-soul-covenant-stone',1);ensureVoidEssence(materialCount('mat-v36-void-essence')+1);if(!goTo('归一圣墟'))fail('unity-essence-location-unreachable',{});const before=materialCount('mat-v37-unity-essence');const r=spendAction('craft-unity-essence',()=>invoke('v37CraftUnityEssence'));if(!r?.ok||materialCount('mat-v37-unity-essence')<=before)fail('unity-essence-craft-blocked',{result:r})}}
function ensureOrigin(n){ensureLaw(160);ensureUnity(100);let guard=0;while((state().player.v38OriginInsight||0)<n){if(++guard>MAX_FARM_ACTIONS)fail('origin-insight-deadlock',{target:n});const loc=goAny(['九霄劫台','天穹祖脉','人界议庭','界源海']);if(!loc)fail('origin-source-unreachable',{target:n});const before=state().player.v38OriginInsight;const r=spendAction('contemplate-origin',()=>invoke('v38ContemplateOrigin'));heal();if(!r?.ok||state().player.v38OriginInsight<=before)fail('origin-action-blocked',{result:r,target:n})}}
function ensureAuthority(n){ensureOrigin(25);let guard=0;while((state().player.v38WorldAuthority||0)<n){if(++guard>MAX_FARM_ACTIONS)fail('authority-deadlock',{target:n});ensureSpace(60);ensureLaw(180);if(!goTo('人界议庭'))fail('authority-location-unreachable',{target:n});const before=state().player.v38WorldAuthority;const r=spendAction('exercise-authority',()=>invoke('v38ExerciseWorldAuthority'));heal();if(!r?.ok||state().player.v38WorldAuthority<=before)fail('authority-action-blocked',{result:r,target:n})}}
function ensureNatalMarks(n){ensureNatalArtifact();let guard=0;while((state().player.v38NatalOriginMarks||0)<n){if(++guard>24)fail('natal-origin-mark-loop',{target:n});ensureNamed('mat-v38-natal-source-crystal',1);ensureNamed('mat-v38-origin-crystal',1);ensureNamed('mat-v38-origin-gold',1);ensureSpace(60);if(!goAny(['天穹祖脉','九霄劫台']))fail('natal-origin-location-unreachable',{target:n});const before=state().player.v38NatalOriginMarks;const r=spendAction('temper-natal-origin',()=>invoke('v38TemperNatalOrigin'));heal();if(!r?.ok||state().player.v38NatalOriginMarks<=before)fail('natal-origin-action-blocked',{result:r,target:n})}}
function ensureMahayanaEssence(n){let guard=0;while(materialCount('mat-v38-mahayana-essence')<n){if(++guard>60)fail('mahayana-essence-loop',{target:n});ensureOrigin(35);ensureAuthority(10);ensureNamed('mat-v38-origin-crystal',2);ensureNamed('mat-v38-heaven-vein-marrow',1);ensureNamed('mat-v38-world-essence-dew',1);ensureUnityEssence(materialCount('mat-v37-unity-essence')+1);if(!goAny(['界源海','天穹祖脉']))fail('mahayana-essence-location-unreachable',{});const before=materialCount('mat-v38-mahayana-essence');const r=spendAction('craft-mahayana-essence',()=>invoke('v38CraftMahayanaEssence'));heal();if(!r?.ok||materialCount('mat-v38-mahayana-essence')<=before)fail('mahayana-essence-craft-blocked',{result:r})}}

function prepareMajor(i){const req=invoke('coreRequirements');if(!req)return;if(i===13||i===14){ensureCore(req.core||0);ensureInsight(req.insight||0)}else if(i===18){ensureNascent(req.nascent||0);ensureCore(req.core||0);ensureInsight(req.insight||0)}else if(i===22){ensureDeification(req.deification||0);ensureNascent(req.nascent||0);ensureInsight(req.insight||0)}else if(i===25){ensureSpace(req.spaceInsight||20);ensureVoidEssence(req.voidEssence||5);ensureDeification(req.deification||3);ensureInsight(req.insight||18)}else if(i===29){ensureSpace(42);ensureLaw(req.lawProf||35);ensureUnity(req.unity||35);ensureUnityEssence(req.unityEssence||4);ensureInsight(req.insight||28)}else if(i===33){ensureSpace(60);ensureLaw(req.lawProf||180);ensureUnity(req.unity||110);ensureOrigin(req.origin||45);ensureAuthority(req.authority||20);ensureNatalMarks(req.natalMarks||1);ensureMahayanaEssence(req.mahayanaEssence||5);ensureInsight(req.insight||42)}}
function prepareMinorSideGate(i){if(i>=30&&i<=32){const g=invoke('v37MinorGate',i);if(!g.ok){ensureLaw(g.lawProf||0);ensureUnity(g.unity||0)}}if(i>=34&&i<=36){const g=invoke('v38MinorGate',i);if(!g.ok){ensureOrigin(g.origin||0);ensureAuthority(g.authority||0);ensureNatalMarks(g.natalMarks||0)}}}

function cultivateFull(){improveManual();const r=realmRow(),p=state().player;if(p.progress>=r.need)return;let guard=0;while(state().player.progress<realmRow().need){if(++guard>MAX_ACTIONS)fail('cultivation-loop',{realm:realmRow().name});heal();spendAction('cultivate',()=>invoke('action','cultivate'));if(guard%180===0){improveManual();checkpoint('cultivation')}}}
function breakRealm(){const before=state().player.realmIndex;const i=before;prepareMajor(i);prepareMinorSideGate(i);cultivateFull();heal();let result;if(i===25)result=spendAction('breakthrough-refining',()=>invoke('v36AttemptRefiningBreakthrough'));else if(i===29)result=spendAction('breakthrough-unity',()=>invoke('v37AttemptUnityBreakthrough'));else if(i===33)result=spendAction('breakthrough-mahayana',()=>invoke('v38AttemptMahayanaBreakthrough'));else result=spendAction('breakthrough',()=>invoke('attemptBreakthrough'));resolveCombat(true);const after=state().player.realmIndex;if(after===before){console.log('V310_FULLRUN_BREAKTHROUGH_RETRY',JSON.stringify({realm:realmRow(before).name,chance:invoke('breakthroughChance'),result,actions,state:slimState()}));heal();return false}checkpoint('breakthrough-success');return true}

function prepareTribulation(){
 ensureSpace(80);ensureLaw(230);ensureUnity(110);ensureOrigin(300);ensureAuthority(170);ensureNatalMarks(7);
 if(!goTo('九霄劫台'))fail('tribulation-terrace-unreachable',{});
 const prepKeys=['body','soul','law','artifact','formation'];
 const prepCosts={body:{'mat-v38-tribulation-stone':1,'mat-v38-heaven-vein-marrow':1},soul:{'mat-v38-soulstar-dew':1,'mat-v38-tribulation-stone':1},law:{'mat-v38-origin-crystal':1,'mat-v38-immortal-mortal-dust':1},artifact:{'mat-v38-natal-source-crystal':1,'mat-v38-tribulation-stone':1},formation:{'mat-v38-tribulation-array-core':1,'mat-v38-origin-gold':1}};
 for(const k of prepKeys){let guard=0;while((state().player.v38TribulationPrep?.[k]||0)<60){if(++guard>20)fail('tribulation-prep-loop',{kind:k});for(const [id,n] of Object.entries(prepCosts[k]))ensureNamed(id,n);const r=spendAction(`tribulation-prep:${k}`,()=>invoke('v38PrepareTribulation',k));heal();if(!r?.ok)fail('tribulation-prep-blocked',{kind:k,result:r})}}
 const formation='formation-v39-five-elements';const f=registry.formations[formation];if(!f)fail('formation-registry-missing',{formation});for(const [id,n] of Object.entries(f.cost||{}))ensureNamed(id,n);const built=spendAction('build-tribulation-formation',()=>invoke('v39BuildTribulationFormation',formation));if(!built?.ok)fail('formation-build-blocked',{result:built});
 const ready=invoke('v39TribulationReadiness');if(!ready?.ready)fail('tribulation-readiness',{readiness:ready});
}
function finishTribulation(){prepareTribulation();let r=spendAction('begin-tribulation',()=>invoke('v39BeginTribulation'));if(!r?.ok)fail('tribulation-begin-blocked',{result:r,readiness:invoke('v39TribulationReadiness')});let guard=0;while(state().player.v39TribulationStatus==='thunder'){if(++guard>20)fail('thunder-loop',{state:invoke('v39StateSnapshot')});r=spendAction('resolve-thunder',()=>invoke('v39ResolveThunder'));heal();if(r?.outcome==='failure'||r?.ok===false)fail('thunder-failure',{result:r,state:invoke('v39StateSnapshot')})}
 guard=0;while(state().player.v39TribulationStatus==='heart'){if(++guard>10)fail('heart-loop',{state:invoke('v39StateSnapshot')});r=spendAction('resolve-heart-demon',()=>invoke('v39ResolveHeartDemon'));heal();if(r?.outcome==='failure'||r?.ok===false)fail('heart-demon-failure',{result:r,state:invoke('v39StateSnapshot')})}
 guard=0;while(state().player.v39TribulationStatus==='transformation'){if(++guard>10)fail('transformation-loop',{state:invoke('v39StateSnapshot')});r=spendAction('resolve-transformation',()=>invoke('v39ResolveTransformation'));heal();if(r?.outcome==='failure'||r?.ok===false)fail('transformation-failure',{result:r,state:invoke('v39StateSnapshot')})}
 if(state().player.v39TribulationStatus==='ascension'&&state().player.location!=='飞升天门'){if(!goTo('飞升天门'))fail('heaven-gate-unreachable',{status:state().player.v39TribulationStatus})}
 if(!state().player.v39AscensionComplete){r=spendAction('ascend-true-immortal',()=>invoke('v39AscendToTrueImmortal'));if(!r?.ok)fail('ascension-blocked',{result:r,state:invoke('v39StateSnapshot')})}
}

let loop=0;
while(state().player.realmIndex<39&&!state().player.v39AscensionComplete){
 if(++loop>500)fail('realm-loop-limit',{loop});
 choosePath();
 if(state().player.realmIndex>=15&&!state().player.natalArtifactId)ensureNatalArtifact();
 if([10,15,19,23,26,30,34,37].includes(state().player.realmIndex)){improveManual();improveSkills()}
 if(state().player.realmIndex===37){finishTribulation();break}
 breakRealm();
}
const final=state();if(final.player.realmIndex!==39||!final.player.v39AscensionComplete)fail('true-immortal-not-reached',{});
const out=writeResult('PASS',{blockerHistory,proof:{freshSave:true,noRecharge:true,noDirectStateMutation:true,legalGameplayCallsOnly:true,ascensionComplete:true,realmIndex:final.player.realmIndex,lifeCycles:final.legacy?.cycles||0,totalDeaths:final.legacy?.totalDeaths||0}});
console.log('V310_FULLRUN_PASS',JSON.stringify(out));
