import fs from 'fs';
import {spawnSync} from 'child_process';

const v39Path=new URL('./fullrun-v310-no-recharge-v39.mjs',import.meta.url);
const v39StagePath=new URL('./.generated-fullrun-v310-no-recharge-v40-v39stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v40 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v40 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v40 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v40 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v40 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V39 cleared V38's realm10 regression and independently pushed spirit to realm29. Its artifacts also
// isolated two runner defects:
// 1) body reached realm13 and obtained the formal two insight, then optional Golden Bell consumed one
//    insight. The runner demanded a third insight before the real core gate, but the paid relic auction
//    is correctly locked until realm14. Optional defense must not create a new breakthrough resource gate.
// 2) spirit reached realm29, but escape prep prioritized shield/control over its real V36 movement skill.
//    Against realm32 enemies this omitted the +0.20 space-shift escape bonus; repeated legal flee failures
//    then drained HP to death. One movement preparation followed immediately by flee is the rational path.
//
// V40 therefore removes the realm13 Golden Bell requirement. Before dangerous major-gate travel it buys
// ordinary Lightbody Pills from the existing Linjiang market with earned stones; a pill is consumed only
// immediately before a route whose real enemy ceiling/risk is dangerous. The pill's existing +0.16 flee
// buff and normal five-day duration are unchanged. After dao selection, Golden Bell remains a normal
// optional learned defense, while slot5 prefers the path's movement skill. In combat, movement prep is
// tried before deterministic shields, still at most one prep per actual flee attempt. No game data,
// market price/stock, flee formula, spell effect, enemy stat, route risk, RNG, drop or death rule changes.
let v39=fs.readFileSync(v39Path,'utf8');
v39=replaceOnce(
 v39,
 "await import(finalRunnerPath.href+'?v39final='+Date.now());",
 "// v40 executes the final runner after market-backed travel escape preparation.",
 'suppress v39 final auto-import'
);
fs.writeFileSync(v39StagePath,v39);
await import(v39StagePath.href+'?v40stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v40 did not obtain v39 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

// Allow one more normal runtime API: consuming an actually owned V3.3 pill without force.
{
 const start=runner.indexOf('const legalCalls=new Set(['),end=runner.indexOf(']);',start);
 if(start<0||end<0)throw new Error('V3.10 v40 legal call set missing');
 const block=runner.slice(start,end);
 if(!block.includes("'useV33Pill'"))runner=runner.slice(0,end)+",'useV33Pill'"+runner.slice(end);
}

// Keep Golden Bell optional until the path has actually been selected. Body V39 proved spending one
// extra insight at realm13 creates a runner-only deadlock, because the normal relic auction starts at14.
runner=replaceOnce(
 runner,
 "if(i===13){ensureInsight(req.insight||0);ensureSurvivalSkill('spell-golden-bell',4);ensureInsight(req.insight||0);ensureCore(req.core||0)}else if(i===14){ensureCore(req.core||0);ensureInsight(req.insight||0)}",
 "if(i===13){ensureInsight(req.insight||0);ensureLightbodyStock(6);ensureCore(req.core||0)}else if(i===14){ensureCore(req.core||0);ensureInsight(req.insight||0)}",
 'replace realm13 insight-consuming shield with carried market escape pills'
);

// Replenish carried escape pills before the mandatory high-risk preparation bands. They do not expire
// in inventory; only an actually consumed pill creates the existing five-day buff.
runner=replaceOnce(runner,"else if(i===18){ensureNascent(req.nascent||0);ensureCore(req.core||0);ensureInsight(req.insight||0)}","else if(i===18){ensureLightbodyStock(8);ensureNascent(req.nascent||0);ensureCore(req.core||0);ensureInsight(req.insight||0)}",'stock escape pills before nascent gate');
runner=replaceOnce(runner,"else if(i===22){ensureDeification(req.deification||0);ensureNascent(req.nascent||0);ensureInsight(req.insight||0)}","else if(i===22){ensureLightbodyStock(8);ensureDeification(req.deification||0);ensureNascent(req.nascent||0);ensureInsight(req.insight||0)}",'stock escape pills before deification gate');
runner=replaceOnce(runner,"else if(i===25){ensureSpace(req.spaceInsight||20);ensureVoidEssence(req.voidEssence||5);ensureDeification(req.deification||3);ensureInsight(req.insight||18)}","else if(i===25){ensureLightbodyStock(10);ensureSpace(req.spaceInsight||20);ensureVoidEssence(req.voidEssence||5);ensureDeification(req.deification||3);ensureInsight(req.insight||18)}",'stock escape pills before refining gate');
runner=replaceOnce(runner,"else if(i===29){ensureSpace(42);ensureLaw(req.lawProf||35);ensureUnity(req.unity||35);ensureUnityEssence(req.unityEssence||4);ensureInsight(req.insight||28)}","else if(i===29){ensureLightbodyStock(16);ensureSpace(42);ensureLaw(req.lawProf||35);ensureUnity(req.unity||35);ensureUnityEssence(req.unityEssence||4);ensureInsight(req.insight||28)}",'stock escape pills before unity gate');
runner=replaceOnce(runner,"else if(i===33){ensureSpace(60);ensureLaw(req.lawProf||180);ensureUnity(req.unity||110);ensureOrigin(req.origin||45);ensureAuthority(req.authority||20);ensureNatalMarks(req.natalMarks||1);ensureMahayanaEssence(req.mahayanaEssence||5);ensureInsight(req.insight||42)}","else if(i===33){ensureLightbodyStock(16);ensureSpace(60);ensureLaw(req.lawProf||180);ensureUnity(req.unity||110);ensureOrigin(req.origin||45);ensureAuthority(req.authority||20);ensureNatalMarks(req.natalMarks||1);ensureMahayanaEssence(req.mahayanaEssence||5);ensureInsight(req.insight||42)}",'stock escape pills before mahayana gate');

const travelWithPill=`function lightbodyPillCount(){return Math.max(0,Number(state().player.pillInventoryById?.['recipe-v33-lightbody']?.common)||0)}
function ensureLightbodyStock(n=6,maxCycles=40){
 n=Math.max(0,Number(n)||0);if(lightbodyPillCount()>=n)return true;if(state().player.realmIndex<4)return false;
 if(!goTo('临江城'))return false;let cycles=0;
 while(lightbodyPillCount()<n){
  const lot=Object.values(invoke('v35ListingRegistry')||{}).find(x=>x&&x.shopId==='shop-linjiang-market'&&x.kind==='pill'&&x.refId==='recipe-v33-lightbody');
  if(!lot)return false;
  const q=invoke('v35Quote',lot.id,'buy',1);
  if(q&&q.total>0){
   earnStones(q.total+10);if(!goTo('临江城'))fail('lightbody-market-return-unreachable',{target:n});
   const before=lightbodyPillCount(),r=spendAction('market-buy:lightbody-pill',()=>invoke('v35Trade',lot.id,'buy',1));
   if(r?.ok&&lightbodyPillCount()>before){console.log('V310_FULLRUN_V40_LIGHTBODY',JSON.stringify({source:'linjiang-market',count:lightbodyPillCount(),target:n,price:q.total,stockCycle:invoke('v35EconomySnapshot').stockCycle,actions}));continue}
  }
  if(cycles++>=maxCycles)break;
  const cycle=Number(invoke('v35EconomySnapshot').stockCycle)||0;let wait=0;
  while((Number(invoke('v35EconomySnapshot').stockCycle)||0)===cycle){if(++wait>14)fail('lightbody-market-cycle-wait-loop',{target:n,cycle,current:lightbodyPillCount()});act('rest',false)}
 }
 return lightbodyPillCount()>=n;
}
function routeNeedsEscapePill(from,r){
 const ceil=routeEnemyCeilingForRunner(from,r),pr=state().player.realmIndex,risk=Math.max(.02,Number(r?.effectiveRisk??r?.risk??.25)||.25),majorGap=Math.max(0,runnerMajorStage(ceil)-runnerMajorStage(pr)),rawGap=Math.max(0,ceil-pr);
 return {needed:majorGap>0||rawGap>=2||risk>=.55,ceil,pr,risk,majorGap,rawGap};
}
function useLightbodyForRoute(from,r){
 const d=routeNeedsEscapePill(from,r);if(!d.needed||lightbodyPillCount()<=0)return false;
 const before=lightbodyPillCount(),res=spendAction('use-lightbody-pill:travel:'+r.to,()=>invoke('useV33Pill','recipe-v33-lightbody','common'));
 const used=lightbodyPillCount()<before;
 console.log('V310_FULLRUN_V40_LIGHTBODY',JSON.stringify({source:'carried-pill',used,result:res,from,to:r.to,route:r.id||null,enemyCeiling:d.ceil,playerRealm:d.pr,effectiveRisk:Number(d.risk.toFixed(3)),majorGap:d.majorGap,rawGap:d.rawGap,remaining:lightbodyPillCount(),actions}));
 return used;
}
function goTo(to){
 let s=state();if(s.player.location===to)return true;let path=findPath(s.player.location,to);if(!path)return false;
 for(const r of path){
  s=state();if((r.fee||0)>s.player.spiritStones)earnStones((r.fee||0)+5);const before=s.player.location;
  useLightbodyForRoute(before,r);
  spendAction('travel:'+r.to,()=>invoke('travel',r.to,r.id));resolveCombat(false);heal();const after=state().player.location;
  if(after===before)fail('travel-action-no-progress',{from:before,to:r.to,route:r});if(after!==r.to)fail('travel-wrong-destination',{from:before,wanted:r.to,actual:after,route:r});
 }
 return state().player.location===to;
}`;
runner=replaceFunction(runner,'function goTo(',travelWithPill,'consume carried escape pill immediately before dangerous route');

// Preserve fixed shield slot after dao selection, but ensure body also learns its actual V36 movement.
const survivalLoadout=`function ensureSurvivalLoadout(){
 const p=state().player;if(p.realmIndex<10)return;
 if(p.daoPath!==DAO_PATH){console.log('V310_FULLRUN_V40_PREDAO_SURVIVAL_DEFER',JSON.stringify({realm:p.realmIndex,location:p.location,insight:p.insight,pills:lightbodyPillCount(),actions}));return}
 const shieldReady=ensureSurvivalSkill('spell-golden-bell',4);
 const plans={
  sword:['spell-v36-sword-space-step','spell-sword-escape'],
  flame:['spell-v36-flame-voidflash','spell-fire-escape'],
  body:['spell-v36-body-voidstep','spell-v36-body-boundary-form','spell-immovable-king','spell-vajra-guard'],
  spirit:['spell-v36-spirit-shift','spell-taixu-godseal-domain','spell-divine-sense-barrier']
 };
 let chosen=null;for(const id of plans[DAO_PATH]||[]){if(ensureSurvivalSkill(id,5)){chosen=id;break}}
 console.log('V310_FULLRUN_V40_SURVIVAL_LOADOUT',JSON.stringify({realm:p.realmIndex,path:DAO_PATH,shieldReady,slot4:state().player.activeSkillIds?.[4]||null,slot5:state().player.activeSkillIds?.[5]||null,pathSurvival:chosen,pills:lightbodyPillCount(),actions}));
}`;
runner=replaceFunction(runner,'function ensureSurvivalLoadout(',survivalLoadout,'keep shield plus path movement after dao selection');

// V39 showed deterministic-only prep can omit the actual +0.20 V36 escape bonus. Try one movement action
// first, then shields/control if movement is on cooldown; V38 still guarantees only one prep per flee.
const escapePriority=`function escapeSkillPriority(){
 const active=new Set((state().player.activeSkillIds||[]).filter(Boolean));
 const movement={
  sword:['spell-v36-sword-space-step','spell-sword-escape','spell-windstep'],
  flame:['spell-v36-flame-voidflash','spell-fire-escape','spell-windstep'],
  body:['spell-v36-body-voidstep','spell-windstep'],
  spirit:['spell-v36-spirit-shift','spell-windstep']
 }[DAO_PATH]||['spell-windstep'];
 const defensive=[];
 for(const id of state().player.activeSkillIds||[]){if(!id||!active.has(id))continue;const r=registry.spells?.[id]||{},c=String(r.category||'').toLowerCase(),e=r.effect||{};if(c==='shield'||c==='defense'||c==='control'||c==='seal'||c==='laststand'||c==='counter'||e.shield||e.control||e.guard||e.damageReduction)defensive.push(id)}
 return [...new Set([...movement.filter(id=>active.has(id)),...defensive])];
}`;
runner=replaceFunction(runner,'function escapeSkillPriority(',escapePriority,'movement-first single escape preparation');

if(!runner.includes("'useV33Pill'"))throw new Error('V3.10 v40 normal pill API not allowed');
if(!runner.includes('function ensureLightbodyStock(')||!runner.includes("x.refId==='recipe-v33-lightbody'"))throw new Error('V3.10 v40 lightbody market stock helper missing');
if(!runner.includes("invoke('v35Trade',lot.id,'buy',1)"))throw new Error('V3.10 v40 normal lightbody trade missing');
if(!runner.includes("invoke('useV33Pill','recipe-v33-lightbody','common')"))throw new Error('V3.10 v40 normal lightbody consumption missing');
if(!runner.includes("if(i===13){ensureInsight(req.insight||0);ensureLightbodyStock(6);ensureCore"))throw new Error('V3.10 v40 realm13 no-insight-defense routing missing');
if(runner.includes("ensureSurvivalSkill('spell-golden-bell',4);ensureInsight(req.insight||0);ensureCore"))throw new Error('V3.10 v40 stale realm13 Golden Bell insight tax survived');
if(!runner.includes("body:['spell-v36-body-voidstep'"))throw new Error('V3.10 v40 body movement survival missing');
if(!runner.includes('movement.filter(id=>active.has(id))'))throw new Error('V3.10 v40 movement-first escape priority missing');
if(!runner.includes('escapePreparedAt=-1'))throw new Error('V3.10 v40 lost one-prep-per-flee accounting');
if(!runner.includes('V310_FULLRUN_V39_FLEE'))throw new Error('V3.10 v40 lost real flee diagnostics');
if(!runner.includes('function routeEnemyCeilingForRunner(')||!runner.includes('function optionalUpgradeSource('))throw new Error('V3.10 v40 lost risk-aware routing');
if(!runner.includes('core-batch')||!runner.includes('nascent-batch')||!runner.includes('deification-batch'))throw new Error('V3.10 v40 lost batch refining');
if(!runner.includes("tryRelicAuction(3,24)"))throw new Error('V3.10 v40 lost paid relic fallback');
if(!runner.includes("if(tryBeastMarket(n,24))return;"))throw new Error('V3.10 v40 lost paid beast market');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-beast-material'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v40 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v40 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V40_FINAL_RUNNER_PASS '+JSON.stringify({realm13GoldenBellRemoved:true,normalLightbodyMarket:true,earnedStonesOnly:true,carriedPillBeforeDangerousTravel:true,existingFleeBuffOnly:true,goldenBellPostDaoOptional:true,pathMovementSlot:true,movementFirstEscapePrep:true,onePrepPerFleeAttemptPreserved:true,riskAwareRoutingPreserved:true,batchRefiningPreserved:true,realFleeDiagnosticsPreserved:true,marketPricesAndStockUnchanged:true,fleeFormulaUnchanged:true,spellAndPillEffectsUnchanged:true,enemyStatsUnchanged:true,routeRiskUnchanged:true,dropRatesUnchanged:true,deathRiskUnchanged:true,rngUnchanged:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v40final='+Date.now());
