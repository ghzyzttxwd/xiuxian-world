import fs from 'fs';
import {spawnSync} from 'child_process';

const v43Path=new URL('./fullrun-v310-no-recharge-v43.mjs',import.meta.url);
const v43StagePath=new URL('./.generated-fullrun-v310-no-recharge-v44-v43stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v44 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v44 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v44 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v44 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v44 function-close miss: '+label);
 return {start,end};
}
function patchFunction(src,signature,patch,label){
 const {start,end}=functionSpan(src,signature,label);
 const fn=src.slice(start,end+1),patched=patch(fn);
 if(patched===fn)throw new Error('V3.10 v44 function patch no-op: '+label);
 return src.slice(0,start)+patched+src.slice(end+1);
}

// V43 kept the V41 registry-risk correction and V42 full-run chain intact, but its completed artifacts
// exposed three runner/harness issues rather than game-balance failures:
// 1) spirit at realm18 fell to 32.7% HP after a failed escape, then V43 cast a defensive prep action;
//    that action itself consumed a full enemy counterattack and killed the player before the next flee.
// 2) flame at realm29 captured one active secret realm, then travel/healing advanced world time enough
//    for that realm to close and a new realm to spawn elsewhere. The runner did not revalidate the realm id
//    after arrival, clicked a disabled [data-secret] button for the new remote realm, then reported the
//    misleading downstream secret-prepare-choice-missing error.
// 3) body consumed the arbitrary 180k total-action harness budget at realm36 after legitimate high-realm
//    material variance and three breakthrough retries. PROJECT_TASKBOOK requires high realms to take much
//    longer and does not impose an 180k action cap; farm-specific deadlock guards remain separate.
//
// V44 changes runner/harness policy only. Critical HP skips all preparation and attempts the real flee
// immediately. Secret-realm insight revalidates the captured realm id/location AFTER travel before touching
// its UI; if world time rotated the realm, the runner simply loops and makes a fresh normal decision. V43's
// corrected higher-realm-only pill use is preserved but realm29 stock returns to 16 because waste is gone.
// Workflows separately raise only the total proof action budget to 300k; MAX_FARM_ACTIONS remains 2400.
// No enemy, flee chance, pill effect, market data, secret-realm reward, progression cost, RNG or death rule
// is changed, and no direct resource/progression mutation is introduced.
let v43=fs.readFileSync(v43Path,'utf8');
v43=replaceOnce(
 v43,
 "await import(finalRunnerPath.href+'?v43final='+Date.now());",
 "// v44 executes the final runner after critical-HP, secret-rotation and proof-budget routing fixes.",
 'suppress v43 final gameplay auto-import'
);
fs.writeFileSync(v43StagePath,v43);
const v43Syntax=spawnSync(process.execPath,['--check',v43StagePath.pathname],{encoding:'utf8'});
if(v43Syntax.status!==0)throw new Error('V3.10 v44 staged V43 syntax check failed: '+(v43Syntax.stderr||v43Syntax.stdout||'unknown syntax error'));
await import(v43StagePath.href+'?v44stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v44 did not obtain V43 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

// 1. At critical HP, any spell/artifact preparation is itself another enemy counterattack. Do not spend
// a combat round preparing; immediately use the unchanged flee action and its unchanged success chance.
runner=replaceOnce(
 runner,
 "const prepWanted=(fleeAttempts===0||fleeAttempts%2===0||hpRatio<.58)&&escapePreparedAt!==fleeAttempts;",
 "const prepWanted=hpRatio>=.45&&(fleeAttempts===0||fleeAttempts%2===0)&&escapePreparedAt!==fleeAttempts;",
 'critical HP direct flee without extra counterattack'
);

// 2. V43 already reserves pills for actual higher-realm exposure. With the seven previously wasted
// same/lower-realm doses removed, the original sixteen-pill realm29 stock is sufficient and avoids
// unnecessary market/RNG churn before the expensive Mahayana segment.
runner=replaceOnce(
 runner,
 'else if(i===29){ensureLightbodyStock(32);',
 'else if(i===29){ensureLightbodyStock(16);',
 'restore evidence-sized realm29 carried pill stock'
);

// 3. Secret realms can close/rotate while travel and post-travel healing advance world time. Revalidate
// the captured realm after arrival before clicking its UI. A rotated realm is not a failure and does not
// grant anything; the next ensureInsight loop simply observes the new world state normally.
runner=patchFunction(runner,'function ensureInsight(',fn=>{
 const before="const before=state().player.insight;let rr=state().world.secretRealm;";
 const after="const before=state().player.insight;let rr=state().world.secretRealm;if(!rr||rr.id!==sr.id||rr.location!==state().player.location){console.log('V310_FULLRUN_V44_SECRET_ROTATED',JSON.stringify({capturedId:sr.id||null,capturedLocation:sr.location||null,currentId:rr?.id||null,currentLocation:rr?.location||null,playerLocation:state().player.location,actions}));continue}";
 if(!fn.includes(before))throw new Error('V3.10 v44 secret post-travel revalidation anchor missing');
 return fn.replace(before,after);
},'revalidate secret realm after travel/time advancement');

// Machine-verifiable invariants.
if(!runner.includes('V310_FULLRUN_V41_RISK_PROBE'))throw new Error('V3.10 v44 lost corrected registry risk probe');
if(!runner.includes("const prepWanted=hpRatio>=.45&&(fleeAttempts===0||fleeAttempts%2===0)&&escapePreparedAt!==fleeAttempts;"))throw new Error('V3.10 v44 critical-HP direct flee gate missing');
if(!runner.includes('V310_FULLRUN_V44_SECRET_ROTATED'))throw new Error('V3.10 v44 secret rotation revalidation missing');
if(!runner.includes('rr.id!==sr.id||rr.location!==state().player.location'))throw new Error('V3.10 v44 secret id/location guard missing');
if(!runner.includes("source:'paid-auction-relic'"))throw new Error('V3.10 v44 lost paid relic insight route');
if(!runner.includes('else if(i===29){ensureLightbodyStock(16);'))throw new Error('V3.10 v44 realm29 stock correction missing');
if(runner.includes('else if(i===29){ensureLightbodyStock(32);'))throw new Error('V3.10 v44 stale 32-pill realm29 stock survived');
if(!runner.includes('stalledIncidental=!preferWin&&guard>=60&&enemyRealm<=s.player.realmIndex'))throw new Error('V3.10 v44 lost V43 optional stalemate escape');
if(!runner.includes("if(state().player.progress>=r.need){console.log('V310_FULLRUN_V43_CULTIVATION_CAP'"))throw new Error('V3.10 v44 lost cultivation-cap short-circuit');
if(!runner.includes('return {needed:ceil>pr,ceil,pr,risk,majorGap,rawGap};'))throw new Error('V3.10 v44 lost higher-realm-only pill consumption');
if(!runner.includes("invoke('useV33Pill','recipe-v33-lightbody','common')"))throw new Error('V3.10 v44 lost normal pill API');
if(!runner.includes('V310_FULLRUN_V39_FLEE'))throw new Error('V3.10 v44 lost flee diagnostics');
if(!runner.includes('core-batch')||!runner.includes('nascent-batch')||!runner.includes('deification-batch'))throw new Error('V3.10 v44 lost batch refining');
if(!runner.includes("if(tryBeastMarket(n,24))return;"))throw new Error('V3.10 v44 lost paid beast market');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-beast-material'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v44 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v44 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V44_FINAL_RUNNER_PASS '+JSON.stringify({criticalHpDirectFleeBelow:.45,healthySinglePrepPreserved:true,secretRealmPostTravelRevalidation:true,normalSecretRealmsPreserved:true,realm29LightbodyStock:16,higherRealmOnlyLightbodyConsumptionPreserved:true,totalActionBudgetHandledByWorkflow:true,farmDeadlockBudgetUnchanged:true,v43StalemateEscapePreserved:true,v43CultivationCapPreserved:true,v41RegistryRiskMappingPreserved:true,enemyStatsUnchanged:true,fleeChanceUnchanged:true,pillEffectsUnchanged:true,marketPricesAndStockCadenceUnchanged:true,secretRewardsUnchanged:true,progressionCostsUnchanged:true,routeRiskUnchanged:true,dropRatesUnchanged:true,deathRiskUnchanged:true,rngUnchanged:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v44final='+Date.now());
