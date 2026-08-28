import fs from 'fs';
import {spawnSync} from 'child_process';

const v42Path=new URL('./fullrun-v310-no-recharge-v42.mjs',import.meta.url);
const v42StagePath=new URL('./.generated-fullrun-v310-no-recharge-v43-v42stage.mjs',import.meta.url);
const v41FixedPath=new URL('./.generated-fullrun-v310-no-recharge-v42-v41fixed.mjs',import.meta.url);
const v41NoRunPath=new URL('./.generated-fullrun-v310-no-recharge-v43-v41norun.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v43 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v43 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v43 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v43 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v43 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V42 finally validated the corrected public-registry risk mapping in real full-runs. Sword, flame and
// spirit all reached realm29; body reached realm37 with 169k legal actions. The remaining blockers are
// autonomous-player scheduling defects, not evidence for changing game balance:
// - sword/spirit fought an optional same-realm regenerating enemy for 121 rounds until the harness loop
//   guard fired; a normal player can disengage from a non-mandatory stalemate;
// - flame consumed scarce Lightbody Pills on high-risk routes whose actual enemy ceiling was not above
//   the player, then had none left for realm31+ overmatches;
// - escape preparation always preferred movement even at critical HP, although an equipped shield or
//   control action is the rational first preparation when already wounded;
// - body was already fully cultivated at realm37, but cultivateFull() called optional improveManual()
//   before checking the cap, detouring into an unrelated low-tier secret realm during tribulation prep.
//
// V43 changes runner decisions only. At a full cultivation bar it returns before any optional upgrade.
// Non-mandatory same/lower-realm fights may disengage after a long stalemate using the normal flee API.
// Lightbody Pills are reserved for routes whose real enemy ceiling exceeds the player's realm, with a
// larger normally purchased realm29 travel stock. Low-HP escape prep prefers existing defense/control,
// while healthy escape prep still prefers movement. Enemy stats/regeneration, flee chance, pill effects,
// prices/stock cadence, routes, drops, costs, RNG, death rules and all progression requirements remain
// unchanged.

// Stage V42 without launching its generated V41 runner yet.
let v42=fs.readFileSync(v42Path,'utf8');
v42=replaceOnce(
 v42,
 "await import(v41FixedPath.href+'?v42fixed='+Date.now());",
 "// v43 executes the fixed V41 generator after suppressing its final gameplay auto-import.",
 'suppress v42 fixed-generator auto-import'
);
fs.writeFileSync(v42StagePath,v42);
await import(v42StagePath.href+'?v43stage='+Date.now());
if(!fs.existsSync(v41FixedPath))throw new Error('V3.10 v43 did not obtain V42 fixed V41 generator');

// Run the corrected V41 generator to produce the final runner, but stop before gameplay so V43 can
// alter only autonomous policy in the generated runner.
let v41fixed=fs.readFileSync(v41FixedPath,'utf8');
v41fixed=replaceOnce(
 v41fixed,
 "await import(finalRunnerPath.href+'?v41final='+Date.now());",
 "// v43 executes the final runner after evidence-driven scheduling fixes.",
 'suppress nested V41 final gameplay auto-import'
);
fs.writeFileSync(v41NoRunPath,v41fixed);
const v41Syntax=spawnSync(process.execPath,['--check',v41NoRunPath.pathname],{encoding:'utf8'});
if(v41Syntax.status!==0)throw new Error('V3.10 v43 staged V41 syntax check failed: '+(v41Syntax.stderr||v41Syntax.stdout||'unknown syntax error'));
await import(v41NoRunPath.href+'?v43norun='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v43 did not obtain corrected final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

// 1. A full cultivation bar is a hard no-op for cultivation. Optional manual optimization must not
// relocate the player while a breakthrough/tribulation gate is being prepared.
const cultivateFull=`function cultivateFull(){
 const r=realmRow();
 if(state().player.progress>=r.need){console.log('V310_FULLRUN_V43_CULTIVATION_CAP',JSON.stringify({realm:state().player.realmIndex,name:r.name,progress:state().player.progress,need:r.need,location:state().player.location,actions}));return}
 improveManual();
 if(state().player.progress>=realmRow().need)return;
 ensureDwelling();
 if(!goTo(state().player.dwellingLocation||'青石镇'))fail('cultivation-home-unreachable',{});
 let guard=0;
 while(state().player.progress<realmRow().need){
  if(++guard>Math.ceil(MAX_ACTIONS/4))fail('cultivation-loop',{realm:realmRow().name});
  heal();spendAction('retreat-seven-days',()=>invoke('retreatSevenDays'));
  if(guard%40===0){improveManual();if(state().player.location!==state().player.dwellingLocation)goTo(state().player.dwellingLocation);checkpoint('cultivation')}
 }
}`;
runner=replaceFunction(runner,'function cultivateFull(',cultivateFull,'skip optional manual work when cultivation is already capped');

// 2. Preserve carried pills for actual higher-realm travel exposure. UI risk still informs pathfinding,
// but risk alone no longer burns a scarce escape consumable against enemies the player already matches.
const routeNeedsEscapePill=`function routeNeedsEscapePill(from,r){
 const ceil=routeEnemyCeilingForRunner(from,r),pr=state().player.realmIndex,risk=Math.max(.02,Number(r?.effectiveRisk??r?.risk??.25)||.25),majorGap=Math.max(0,runnerMajorStage(ceil)-runnerMajorStage(pr)),rawGap=Math.max(0,ceil-pr);
 return {needed:ceil>pr,ceil,pr,risk,majorGap,rawGap};
}`;
runner=replaceFunction(runner,'function routeNeedsEscapePill(',routeNeedsEscapePill,'reserve Lightbody Pills for real higher-realm exposure');
runner=replaceOnce(runner,'else if(i===29){ensureLightbodyStock(16);','else if(i===29){ensureLightbodyStock(32);','carry sufficient normally purchased Lightbody stock through law/unity travel');

// 3. Healthy disengagement still uses movement first. Once already badly wounded, prefer a currently
// equipped shield/control/guard action before the next normal flee attempt.
const escapePriority=`function escapeSkillPriority(){
 const active=new Set((state().player.activeSkillIds||[]).filter(Boolean));
 const movement={
  sword:['spell-v36-sword-space-step','spell-sword-escape','spell-windstep'],
  flame:['spell-v36-flame-voidflash','spell-fire-escape','spell-windstep'],
  body:['spell-v36-body-voidstep','spell-windstep'],
  spirit:['spell-v36-spirit-shift','spell-windstep']
 }[DAO_PATH]||['spell-windstep'];
 const defensive=[];
 for(const id of state().player.activeSkillIds||[]){
  if(!id||!active.has(id))continue;
  const r=registry.spells?.[id]||{},c=String(r.category||'').toLowerCase(),e=r.effect||{};
  if(c==='shield'||c==='defense'||c==='control'||c==='seal'||c==='laststand'||c==='counter'||e.shield||e.control||e.guard||e.damageReduction)defensive.push(id)
 }
 const c=combat(),hpRatio=c?c.playerHp/Math.max(1,invoke('maxHp')):1;
 const movementReady=movement.filter(id=>active.has(id));
 return [...new Set(hpRatio<.45?[...defensive,...movementReady]:[...movementReady,...defensive])];
}`;
runner=replaceFunction(runner,'function escapeSkillPriority(',escapePriority,'low-HP defense-first escape preparation');

// 4. A non-mandatory same/lower-realm fight that survives sixty decision rounds is a stalemate, not a
// progression requirement. Feed it into the existing legal single-prep -> flee path rather than letting
// the harness die at its 120-round safety guard. Explicit preferWin combats are never affected.
runner=replaceOnce(
 runner,
 'const overmatchFlee=lethalOvermatch;',
 "const stalledIncidental=!preferWin&&guard>=60&&enemyRealm<=s.player.realmIndex;\n  if(stalledIncidental&&guard===60)console.log('V310_FULLRUN_V43_STALEMATE_ESCAPE',JSON.stringify({enemy:c.enemy?.name||null,enemyRealm,playerRealm:s.player.realmIndex,round:c.round||guard,hpRatio:Number(hpRatio.toFixed(3)),actions}));\n  const overmatchFlee=lethalOvermatch||stalledIncidental;",
 'retreat from optional same/lower-realm combat stalemate'
);

// Machine-verifiable invariants.
if(!runner.includes('V310_FULLRUN_V41_RISK_PROBE'))throw new Error('V3.10 v43 lost corrected V41 runtime risk probe');
if(!runner.includes("if(state().player.progress>=r.need){console.log('V310_FULLRUN_V43_CULTIVATION_CAP'"))throw new Error('V3.10 v43 cultivation cap short-circuit missing');
if(!runner.includes('return {needed:ceil>pr,ceil,pr,risk,majorGap,rawGap};'))throw new Error('V3.10 v43 higher-realm-only pill policy missing');
if(!runner.includes('else if(i===29){ensureLightbodyStock(32);'))throw new Error('V3.10 v43 realm29 travel stock missing');
if(!runner.includes("hpRatio<.45?[...defensive,...movementReady]"))throw new Error('V3.10 v43 low-HP defense-first priority missing');
if(!runner.includes('stalledIncidental=!preferWin&&guard>=60&&enemyRealm<=s.player.realmIndex'))throw new Error('V3.10 v43 optional combat stalemate exit missing');
if(!runner.includes('lethalOvermatch||stalledIncidental'))throw new Error('V3.10 v43 stalemate not routed through legal flee path');
if(!runner.includes("invoke('useV33Pill','recipe-v33-lightbody','common')"))throw new Error('V3.10 v43 lost normal Lightbody consumption');
if(!runner.includes('escapePreparedAt=-1'))throw new Error('V3.10 v43 lost one-prep-per-flee accounting');
if(!runner.includes('V310_FULLRUN_V39_FLEE'))throw new Error('V3.10 v43 lost real flee diagnostics');
if(!runner.includes('core-batch')||!runner.includes('nascent-batch')||!runner.includes('deification-batch'))throw new Error('V3.10 v43 lost batch refining');
if(!runner.includes("tryRelicAuction(3,24)"))throw new Error('V3.10 v43 lost paid relic fallback');
if(!runner.includes("if(tryBeastMarket(n,24))return;"))throw new Error('V3.10 v43 lost paid beast market');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-beast-material'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v43 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v43 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V43_FINAL_RUNNER_PASS '+JSON.stringify({cultivationCapBeforeOptionalUpgrade:true,optionalStalemateNormalFlee:true,explicitPreferWinUnaffected:true,higherRealmOnlyLightbodyConsumption:true,realm29LightbodyStock:32,lowHpDefenseFirst:true,healthyMovementFirst:true,v41RegistryRiskMappingPreserved:true,onePrepPerFleeAttemptPreserved:true,normalMarketAndPillApis:true,enemyStatsAndRegenerationUnchanged:true,fleeChanceUnchanged:true,pillEffectsUnchanged:true,marketPricesAndStockCadenceUnchanged:true,routeRiskUnchanged:true,dropRatesUnchanged:true,progressionCostsUnchanged:true,deathRiskUnchanged:true,rngUnchanged:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v43final='+Date.now());
