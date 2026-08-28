import fs from 'fs';
import {spawnSync} from 'child_process';

const v37Path=new URL('./fullrun-v310-no-recharge-v37.mjs',import.meta.url);
const v37StagePath=new URL('./.generated-fullrun-v310-no-recharge-v38-v37stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v38 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v38 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v38 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v38 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v38 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V37 proved that six active slots are real and that normal survival skills can be equipped, but its
// evidence exposed four autonomous-player defects rather than a game-balance failure:
// - body died at realm13 while repeatedly crossing dangerous refinery/resource routes;
// - spirit died at realm19 while travelling for an OPTIONAL skill upgrade through a +major-realm route;
// - sword reached realm29, but V37 repeatedly cast several escape-prep actions before one actual flee,
//   taking a full enemy counterattack after every preparation action;
// - legacy BFS routing chooses the first reachable path, not the safest path a rational player sees in
//   the UI via effectiveRisk.
//
// V38 changes runner strategy only. It uses effectiveRisk + route enemy ceiling for path selection,
// refuses optional manual/skill upgrades that require crossing a lethal major-realm route, prepares a
// common pre-dao shield, batches core/nascent/deification ingredients before entering refining regions,
// and permits at most ONE defensive preparation action per flee attempt. Game data, enemy stats, route
// risk, flee chance, recipe costs, drops, RNG and death rules are unchanged.
let v37=fs.readFileSync(v37Path,'utf8');
v37=replaceOnce(
 v37,
 "await import(finalRunnerPath.href+'?v37final='+Date.now());",
 "// v38 executes the final runner after risk-aware routing and single-prep escape scheduling.",
 'suppress v37 final auto-import'
);
fs.writeFileSync(v37StagePath,v37);
await import(v37StagePath.href+'?v38stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v38 did not obtain v37 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

// --- 1. Replace first-hit BFS with UI-grounded risk-aware path selection. ---
const riskPath=`function routeEnemyCeilingForRunner(from,r){
 const areas=new Set([from,r?.a,r?.b,r?.to].filter(Boolean));
 const rows=Object.values(registry.enemies||{}).filter(e=>e&&Number(e.weight||0)>0&&(!Array.isArray(e.areas)||!e.areas.length||e.areas.some(a=>areas.has(a))));
 return rows.length?Math.max(...rows.map(e=>Math.max(0,Number(e.realm)||0))):0;
}
function runnerRouteCost(from,r){
 const risk=Math.max(.02,Number(r?.effectiveRisk??r?.risk??.25)||.25),days=Math.max(0,Number(r?.days)||0),ceil=routeEnemyCeilingForRunner(from,r),pr=state().player.realmIndex;
 const majorGap=Math.max(0,runnerMajorStage(ceil)-runnerMajorStage(pr)),rawGap=Math.max(0,ceil-pr);
 return risk*100+days+majorGap*650+Math.max(0,rawGap-1)*90+Math.max(0,Number(r?.fee)||0)*.2;
}
function findPath(from,to){
 if(from===to)return [];
 const q=[{loc:from,path:[],cost:0}],best=new Map([[from,0]]);
 while(q.length){
  q.sort((a,b)=>a.cost-b.cost);const cur=q.shift();if(cur.cost!==(best.get(cur.loc)??Infinity))continue;
  for(const r of invoke('routeInfo',cur.loc)||[]){
   if(!routeAccessible(r))continue;const next=r.to,step=runnerRouteCost(cur.loc,r),cost=cur.cost+step;
   if(cost>=(best.get(next)??Infinity))continue;
   const path=[...cur.path,r];if(next===to)return path;best.set(next,cost);q.push({loc:next,path,cost});
  }
 }
 return null;
}
function pathRiskProfile(path,from=state().player.location){
 let loc=from,maxRisk=0,maxCeiling=0,totalRisk=0;
 for(const r of path||[]){const risk=Math.max(.02,Number(r?.effectiveRisk??r?.risk??.25)||.25),ceil=routeEnemyCeilingForRunner(loc,r);maxRisk=Math.max(maxRisk,risk);maxCeiling=Math.max(maxCeiling,ceil);totalRisk+=risk;loc=r.to}
 const pr=state().player.realmIndex;return {maxRisk,totalRisk,maxCeiling,majorGap:Math.max(0,runnerMajorStage(maxCeiling)-runnerMajorStage(pr)),rawGap:Math.max(0,maxCeiling-pr)};
}
function optionalUpgradeSource(sources,label='optional-upgrade'){
 let best=null;
 for(const dest of sources||[]){const path=findPath(state().player.location,dest);if(!path)continue;const p=pathRiskProfile(path);const safe=p.majorGap===0&&p.rawGap<2&&p.maxRisk<=.46;const score=p.totalRisk*100+(path||[]).reduce((n,r)=>n+(Number(r.days)||0),0);if(safe&&(!best||score<best.score))best={dest,path,profile:p,score}}
 if(!best){console.log('V310_FULLRUN_V38_SKIP_OPTIONAL_RISK',JSON.stringify({label,realm:state().player.realmIndex,location:state().player.location,sources,actions}));return null}
 return best.dest;
}`;
runner=replaceFunction(runner,'function findPath(',riskPath,'risk-aware findPath');

// --- 2. Optional upgrades may not drag the character through a lethal route. ---
const manualSafe=`function improveManual(){
 choosePath();const row=bestManualCandidate();if(!row)return;const current=registry.manuals[state().player.manualId]||Object.values(registry.manuals).find(x=>x.name===state().player.manual);if(current&&Number(current.mult||1)>=Number(row.mult||1)-.001)return;const meta=registry.manuals[row.id]||row;
 const source=optionalUpgradeSource(meta.sources||[],'manual:'+row.id);if(!source)return;ensureCost(meta.cost||{});if(!goTo(source))return;const res=spendAction('learn-manual:'+row.id,()=>invoke('learnV31Manual',row.id));if(!['learned','known'].includes(res))return;spendAction('switch-manual:'+row.id,()=>invoke('switchV31Manual',row.id));
}`;
runner=replaceFunction(runner,'function improveManual(',manualSafe,'risk-aware optional manual upgrade');

const skillsSafe=`function improveSkills(){
 choosePath();if(state().player.realmIndex<10)return;
 if(state().player.daoPath!==DAO_PATH){ensureSurvivalLoadout();return}
 const spells=Object.values(registry.spells).filter(r=>r.unlock<=state().player.realmIndex&&r.category!=='passive'&&(!r.path||r.path==='none'||r.path===DAO_PATH)&&Number(r.power||0)>0).sort((a,b)=>Number(b.power||0)-Number(a.power||0)).slice(0,4);let slot=0;
 for(const row of spells){
  if(row.name in state().player.spells){spendAction('equip-skill:'+row.id,()=>invoke('equipV31Skill',slot++,row.id));if(slot>=4)break;continue}
  const source=optionalUpgradeSource(row.sources||[],'skill:'+row.id);if(!source)continue;ensureCost(row.cost||{});if(!goTo(source))continue;const res=spendAction('learn-skill:'+row.id,()=>invoke('learnV31Spell',row.id));if(['learned','known'].includes(res))spendAction('equip-skill:'+row.id,()=>invoke('equipV31Skill',slot++,row.id));if(slot>=4)break;
 }
 ensureSurvivalLoadout();
}`;
runner=replaceFunction(runner,'function improveSkills(',skillsSafe,'risk-aware optional skill upgrade');

const survivalSkill=`function ensureSurvivalSkill(id,slot){
 const p=state().player,row=registry.spells?.[id];if(!row||Number(row.unlock||0)>p.realmIndex)return false;if(row.path&&row.path!=='none'&&row.path!==DAO_PATH)return false;
 if(!(row.name in p.spells)){
  if(row.legacy)return false;const source=optionalUpgradeSource(row.sources||[],'survival:'+id);if(!source)return false;ensureCost(row.cost||{});if(!goTo(source))return false;const learned=spendAction('learn-survival:'+id,()=>invoke('learnV31Spell',id));if(!['learned','known'].includes(learned)&&!(row.name in state().player.spells))return false;
 }
 if(state().player.activeSkillIds?.[slot]!==id)spendAction('equip-survival:'+id,()=>invoke('equipV31Skill',slot,id));return state().player.activeSkillIds?.[slot]===id;
}`;
runner=replaceFunction(runner,'function ensureSurvivalSkill(',survivalSkill,'risk-aware survival skill acquisition');

const survivalLoadout=`function ensureSurvivalLoadout(){
 const p=state().player;if(p.realmIndex<10)return;
 ensureSurvivalSkill('spell-windstep',4);ensureSurvivalSkill('spell-golden-bell',5);
 if(p.daoPath!==DAO_PATH){console.log('V310_FULLRUN_V38_COMMON_SURVIVAL',JSON.stringify({realm:p.realmIndex,slot4:state().player.activeSkillIds?.[4]||null,slot5:state().player.activeSkillIds?.[5]||null,actions}));return}
 const plans={sword:['spell-v36-sword-space-step','spell-sword-escape'],flame:['spell-v36-flame-voidflash','spell-fire-escape'],body:['spell-v36-body-boundary-form','spell-immovable-king','spell-vajra-guard'],spirit:['spell-v36-spirit-shift','spell-taixu-godseal-domain','spell-divine-sense-barrier']};
 let chosen=state().player.activeSkillIds?.[5]||null;for(const id of plans[DAO_PATH]||[]){if(ensureSurvivalSkill(id,5)){chosen=id;break}}
 console.log('V310_FULLRUN_V38_SURVIVAL_LOADOUT',JSON.stringify({realm:p.realmIndex,path:DAO_PATH,slot4:state().player.activeSkillIds?.[4]||null,slot5:state().player.activeSkillIds?.[5]||null,preferred:chosen,actions}));
}`;
runner=replaceFunction(runner,'function ensureSurvivalLoadout(',survivalLoadout,'common pre-dao and path survival loadout');

// Prefer deterministic shield/control prep. Movement remains learned for passive flee bonus but is not
// worth an extra enemy counterattack merely to roll another evade/shift effect.
const escapePriority=`function escapeSkillPriority(){
 const active=(state().player.activeSkillIds||[]).filter(Boolean),rank=id=>{const r=registry.spells?.[id]||{},c=String(r.category||'').toLowerCase(),e=r.effect||{};if(c==='shield'||c==='defense'||c==='control'||c==='seal'||c==='laststand'||c==='counter'||e.shield||e.control||e.guard||e.damageReduction)return 0;return 9};
 return active.filter(id=>rank(id)===0).sort((a,b)=>rank(a)-rank(b));
}`;
runner=replaceFunction(runner,'function escapeSkillPriority(',escapePriority,'deterministic escape preparation priority');

// --- 3. One defensive preparation action per flee attempt; never stand still casting a chain. ---
runner=replaceOnce(runner,'let guard=0,fleeAttempts=0,policyLogged=false,escapePrepUses=0;','let guard=0,fleeAttempts=0,policyLogged=false,escapePrepUses=0,escapePreparedAt=-1;','track preparation per flee attempt');
runner=replaceOnce(runner,"const prepWanted=fleeAttempts===0||fleeAttempts%2===0||hpRatio<.58;","const prepWanted=(fleeAttempts===0||fleeAttempts%2===0||hpRatio<.58)&&escapePreparedAt!==fleeAttempts;",'gate repeated preparation for same flee attempt');
runner=replaceOnce(runner,'if(prepAdvanced)continue;','if(prepAdvanced){escapePreparedAt=fleeAttempts;continue;}','mark skill preparation consumed for this flee attempt');
runner=replaceOnce(runner,'if(!afterGuard||afterGuard.round!==beforeRound)continue;','if(!afterGuard||afterGuard.round!==beforeRound){escapePreparedAt=fleeAttempts;continue;}','mark artifact preparation consumed for this flee attempt');

// --- 4. Batch refining resources before entering dangerous zones, and obtain realm13 insight first. ---
const coreBatch=`function ensureCore(n){
 let guard=0;while(state().player.coreEssence<n){if(++guard>20)fail('core-essence-loop',{target:n});const missing=n-state().player.coreEssence;ensureHerbs(state().player.herbs+4*missing);ensureBeast(state().player.beastMaterials+2*missing);if(!goAnyFunded(['赤霞谷','落星矿脉','古河遗迹'],6*missing,'core-batch'))fail('core-craft-location-unreachable',{});for(let k=0;k<missing;k++){const before=state().player.coreEssence;spendAction('craft-core',()=>invoke('craftCoreEssence'));if(state().player.coreEssence<=before)fail('core-craft-no-progress',{target:n,missing,k})}}
}`;
runner=replaceFunction(runner,'function ensureCore(',coreBatch,'batch core refining');

const nascentBatch=`function ensureNascent(n){
 let guard=0;while(state().player.nascentEssence<n){if(++guard>20)fail('nascent-essence-loop',{target:n});const missing=n-state().player.nascentEssence;ensureCore(state().player.coreEssence+missing);ensureRelic(state().player.relicFragments+2*missing);ensureHerbs(state().player.herbs+6*missing);if(!goAnyFunded(['古河遗迹','玄阴禁地'],12*missing,'nascent-batch'))fail('nascent-craft-location-unreachable',{});for(let k=0;k<missing;k++){const before=state().player.nascentEssence;spendAction('craft-nascent',()=>invoke('craftNascentEssence'));if(state().player.nascentEssence<=before)fail('nascent-craft-no-progress',{target:n,missing,k})}}
}`;
runner=replaceFunction(runner,'function ensureNascent(',nascentBatch,'batch nascent refining');

const deifBatch=`function ensureDeification(n){
 let guard=0;while(state().player.deificationEssence<n){if(++guard>20)fail('deification-essence-loop',{target:n});const missing=n-state().player.deificationEssence;ensureNascent(state().player.nascentEssence+missing);ensureRelic(state().player.relicFragments+3*missing);ensureBeast(state().player.beastMaterials+4*missing);ensureHerbs(state().player.herbs+8*missing);if(!goAnyFunded(['古河遗迹','玄阴禁地'],25*missing,'deification-batch'))fail('deification-craft-location-unreachable',{});for(let k=0;k<missing;k++){const before=state().player.deificationEssence;spendAction('craft-deification',()=>invoke('craftDeificationEssence'));if(state().player.deificationEssence<=before)fail('deification-craft-no-progress',{target:n,missing,k})}}
}`;
runner=replaceFunction(runner,'function ensureDeification(',deifBatch,'batch deification refining');

runner=replaceOnce(runner,"if(i===13||i===14){ensureCore(req.core||0);ensureInsight(req.insight||0)}","if(i===13){ensureInsight(req.insight||0);ensureCore(req.core||0)}else if(i===14){ensureCore(req.core||0);ensureInsight(req.insight||0)}",'prepare realm13 safe resources before refinery entry');

// Machine-verifiable invariants.
for(const s of ['function routeEnemyCeilingForRunner(','function optionalUpgradeSource(','V310_FULLRUN_V38_SKIP_OPTIONAL_RISK','V310_FULLRUN_V38_COMMON_SURVIVAL','core-batch','nascent-batch','deification-batch','escapePreparedAt=-1'])if(!runner.includes(s))throw new Error('V3.10 v38 invariant missing '+s);
if(!runner.includes("const prepWanted=(fleeAttempts===0||fleeAttempts%2===0||hpRatio<.58)&&escapePreparedAt!==fleeAttempts;"))throw new Error('V3.10 v38 single-prep gate missing');
if(!runner.includes('if(prepAdvanced){escapePreparedAt=fleeAttempts;continue;}'))throw new Error('V3.10 v38 skill prep accounting missing');
if(!runner.includes("if(i===13){ensureInsight(req.insight||0);ensureCore(req.core||0)}"))throw new Error('V3.10 v38 realm13 preparation order missing');
if(runner.includes('const prepWanted=fleeAttempts===0||fleeAttempts%2===0||hpRatio<.58;'))throw new Error('V3.10 v38 stale repeated escape prep survived');
if(!runner.includes("if(tryBeastMarket(n,24))return;"))throw new Error('V3.10 v38 lost paid beast market');
if(!runner.includes("tryRelicAuction(3,24)"))throw new Error('V3.10 v38 lost paid insight fallback');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-beast-material'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v38 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v38 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V38_FINAL_RUNNER_PASS '+JSON.stringify({riskAwarePathfinding:true,effectiveRiskUsed:true,routeEnemyCeilingUsed:true,optionalUpgradeRiskGate:true,commonPreDaoShield:true,deterministicEscapePrep:true,onePrepPerFleeAttempt:true,batchCore:true,batchNascent:true,batchDeification:true,realm13InsightBeforeRefinery:true,fleeChanceUnchanged:true,routeRiskUnchanged:true,enemyStatsUnchanged:true,recipeCostsUnchanged:true,dropRatesUnchanged:true,rngUnchanged:true,v37SixSlotSupportPreserved:true,v36InsightAndFundedCraftPreserved:true,v35BeastMarketPreserved:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v38final='+Date.now());
