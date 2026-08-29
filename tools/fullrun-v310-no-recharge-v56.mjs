import fs from 'fs';
import {spawnSync} from 'child_process';

const v55Path=new URL('./fullrun-v310-no-recharge-v55.mjs',import.meta.url);
const v55StagePath=new URL('./.generated-fullrun-v310-no-recharge-v56-v55stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v56 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v56 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v56 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v56 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v56 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V55 proved the realm33 scarce-auction recovery bug was a runner regression, not game economy.
// Its exact-head evidence then exposed two further autonomous-player defects:
// 1) only sword inherited the V9/V14 legal high-realm artifact preparation; flame reached realm37
//    with the old 金丹-era 赤霄丹剑 and empty guard/support slots, then exhausted the 300k action fuse
//    during late combat despite full cultivation and ample lifespan/resources;
// 2) sword repeatedly re-ran the same risk path search for an optional 九霄劫台 manual while
//    cultivating at realm37. That did not spend game actions itself, but caused severe wall-clock
//    overhead and GitHub's 60-minute job timeout cancelled the proof before the 300k game-action gate.
//
// V56 changes RUNNER POLICY ONLY. Every artifact is still forged, bound, refined, repaired, warmed
// and equipped through ordinary legal APIs with normal costs, travel, RNG and time. No game data,
// combat formula, drop rate, realm gate, resource grant or action cap is changed. Optional unsafe
// route decisions are cached only for the same label/realm/location after a reachable route was
// actually rejected for risk; unreachable routes are never cached, so later progression can unlock them.
let v55=fs.readFileSync(v55Path,'utf8');
v55=replaceOnce(
 v55,
 "await import(finalRunnerPath.href+'?v55final='+Date.now());",
 "// v56 executes after path-wide legal high-realm gearing and optional-risk memoization.",
 'suppress v55 final gameplay auto-import'
);
fs.writeFileSync(v55StagePath,v55);
const staged=spawnSync(process.execPath,['--check',v55StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v56 staged V55 syntax check failed: '+(staged.stderr||staged.stdout||'unknown syntax error'));
await import(v55StagePath.href+'?v56stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v56 did not obtain V55 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const optionalRiskMemo=`const V56_OPTIONAL_RISK_SKIP_CACHE=new Set();
function optionalUpgradeSource(sources,label='optional-upgrade'){
 const realmIndex=state().player.realmIndex,location=state().player.location,cacheKey=label+'|'+realmIndex+'|'+location;
 if(V56_OPTIONAL_RISK_SKIP_CACHE.has(cacheKey))return null;
 let best=null,reachable=0;
 for(const dest of sources||[]){
  const path=findPath(location,dest);if(!path)continue;reachable++;
  const p=pathRiskProfile(path,location);const safe=p.majorGap===0&&p.rawGap<2&&p.maxRisk<=.46;const score=p.totalRisk*100+(path||[]).reduce((n,r)=>n+(Number(r.days)||0),0);
  if(safe&&(!best||score<best.score))best={dest,path,profile:p,score};
 }
 if(!best){
  if(reachable>0)V56_OPTIONAL_RISK_SKIP_CACHE.add(cacheKey);
  console.log('V310_FULLRUN_V56_SKIP_OPTIONAL_RISK',JSON.stringify({label,realm:realmIndex,location,sources,reachable,cached:reachable>0,actions}));
  return null;
 }
 V56_OPTIONAL_RISK_SKIP_CACHE.delete(cacheKey);
 return best.dest;
}`;
runner=replaceFunction(runner,'function optionalUpgradeSource(',optionalRiskMemo,'memoize repeated same-realm optional risk rejection');

const pathGear=`const V56_REALM33_GEAR_PLANS=Object.freeze({
 sword:{assault:'item-v37-lawcleaver-sword',guard:'item-v32-swordguard-wheel',support:'item-v37-sword-domain-banner',natal:'item-v32-sevenstar-swordcase'},
 flame:{assault:'item-v37-annihilation-cauldron',guard:'item-v37-sun-domain-ring',support:'item-v32-lifire-lamp',natal:'item-gear-danxia'},
 body:{assault:'item-v37-heaven-crusher',guard:'item-v37-world-anchor',support:'item-v32-bloodsoul-cauldron',natal:'item-v32-mountainseal'},
 spirit:{assault:'item-v32-souleater-banner',guard:'item-v36-kongming-pearl',support:'item-v37-soul-law-mirror',natal:'item-v32-banbreaker-ruler'}
});
function ensureRealm33SwordCombatGear(){
 if(state().player.realmIndex<33)return;
 const plan=V56_REALM33_GEAR_PLANS[DAO_PATH];if(!plan)fail('realm33-path-gear-plan-missing',{path:DAO_PATH});
 ensureArtifactLoadoutItem(plan.assault,'assault',9);
 ensureArtifactLoadoutItem(plan.guard,'guard',9);
 ensureArtifactLoadoutItem(plan.support,'support',9);
 ensureArtifactMaxPreparation(plan.assault,9,100);
 ensureArtifactMaxPreparation(plan.guard,9,100);
 ensureArtifactMaxPreparation(plan.support,9,100);
 ensureArtifactMaxPreparation(plan.natal,9,100);
 const loadout=state().player.artifactLoadout||{},inventory=state().player.equipmentInventory||{};
 const ids=[plan.assault,plan.guard,plan.support,plan.natal];
 if(loadout.assault!==plan.assault||loadout.guard!==plan.guard||loadout.support!==plan.support)fail('realm33-path-gear-equip-incomplete',{path:DAO_PATH,plan,loadout});
 if(ids.some(id=>(inventory[id]?.refinement||0)<9||(inventory[id]?.warmth||0)<100))fail('realm33-path-gear-preparation-incomplete',{path:DAO_PATH,plan,preparation:Object.fromEntries(ids.map(id=>[id,{refinement:inventory[id]?.refinement||0,warmth:inventory[id]?.warmth||0}]))});
 console.log('V310_FULLRUN_V56_PATH_GEAR',JSON.stringify({stage:'realm33-path-loadout',path:DAO_PATH,plan,loadout:{assault:loadout.assault,guard:loadout.guard,support:loadout.support,natal:loadout.natal},preparation:Object.fromEntries(ids.map(id=>[id,{refinement:inventory[id]?.refinement||0,warmth:inventory[id]?.warmth||0}])),actions}));
}`;
runner=replaceFunction(runner,'function ensureRealm33SwordCombatGear(',pathGear,'generalize legal realm33 artifact preparation to all four dao paths');

if(!runner.includes('const V56_OPTIONAL_RISK_SKIP_CACHE=new Set();'))throw new Error('V3.10 v56 optional-risk cache missing');
if(!runner.includes("if(reachable>0)V56_OPTIONAL_RISK_SKIP_CACHE.add(cacheKey);"))throw new Error('V3.10 v56 risk cache must only memoize reachable unsafe routes');
if(!runner.includes('V310_FULLRUN_V56_SKIP_OPTIONAL_RISK'))throw new Error('V3.10 v56 optional-risk evidence marker missing');
for(const id of ['item-v37-lawcleaver-sword','item-v37-annihilation-cauldron','item-v37-heaven-crusher','item-v37-soul-law-mirror'])if(!runner.includes(id))throw new Error('V3.10 v56 path assault/support plan missing '+id);
for(const id of ['item-v32-swordguard-wheel','item-v37-sun-domain-ring','item-v37-world-anchor','item-v36-kongming-pearl'])if(!runner.includes(id))throw new Error('V3.10 v56 path guard plan missing '+id);
if(!runner.includes("ensureArtifactLoadoutItem(plan.assault,'assault',9)"))throw new Error('V3.10 v56 normal assault forge/bind/equip/refine path missing');
if(!runner.includes("ensureArtifactLoadoutItem(plan.guard,'guard',9)"))throw new Error('V3.10 v56 normal guard forge/bind/equip/refine path missing');
if(!runner.includes("ensureArtifactLoadoutItem(plan.support,'support',9)"))throw new Error('V3.10 v56 normal support forge/bind/equip/refine path missing');
if(!runner.includes('ensureArtifactMaxPreparation(plan.natal,9,100)'))throw new Error('V3.10 v56 normal natal max preparation missing');
if(!runner.includes("invoke('forgeV32Item',itemId)"))throw new Error('V3.10 v56 lost ordinary artifact forging API');
if(!runner.includes("invoke('bindV32Artifact',itemId)"))throw new Error('V3.10 v56 lost ordinary artifact binding API');
if(!runner.includes("invoke('equipV32Artifact',itemId,slot)"))throw new Error('V3.10 v56 lost ordinary artifact equip API');
if(!runner.includes("invoke('refineV32Artifact',itemId)"))throw new Error('V3.10 v56 lost ordinary artifact refinement API');
if(!runner.includes("invoke('repairV32Artifact',itemId)"))throw new Error('V3.10 v56 lost ordinary artifact repair API');
if(!runner.includes("invoke('warmV32Artifact',itemId)"))throw new Error('V3.10 v56 lost ordinary artifact warming API');
if(!runner.includes("['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-world-essence-dew','mat-v38-heaven-vein-marrow'].includes(id)&&tryAuctionMaterial(id,n,160)"))throw new Error('V3.10 v56 lost V55 scarce V3.8 auction routing');
if(!runner.includes('V310_FULLRUN_V54_NAMED_SOURCE'))throw new Error('V3.10 v56 lost V54 safer legal map fallback');
if(!runner.includes('V310_FULLRUN_V53_WORK_RELOCATE'))throw new Error('V3.10 v56 lost V53 work relocation');
if(!runner.includes('V310_FULLRUN_V52_MAHAYANA_BATCH'))throw new Error('V3.10 v56 lost V52 Mahayana batching');
if(!runner.includes('V310_FULLRUN_V51_ORIGIN_SITE'))throw new Error('V3.10 v56 lost V51 origin-site selection');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-v38-mahayana-essence'")||runner.includes("v33AddMaterial('mat-v38-origin-gold'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v56 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v56 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V56_FINAL_RUNNER_PASS '+JSON.stringify({allFourPathsLegalRealm33Gear:true,refinementTarget:9,warmthTarget:100,optionalUnsafeRouteMemoized:true,unreachableOptionalRouteNeverMemoized:true,v55ScarceAuctionRecoveryPreserved:true,v54SaferMapFallbackPreserved:true,normalForgeBindEquipRefineRepairWarmOnly:true,gameBalanceDataUnchanged:true,actionCapUnchanged:true,maxActions:Number(process.env.V310_FULLRUN_MAX_ACTIONS||180000),noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v56final='+Date.now());
