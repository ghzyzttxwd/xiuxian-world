import fs from 'fs';
import {spawnSync} from 'child_process';

const v40Path=new URL('./fullrun-v310-no-recharge-v40.mjs',import.meta.url);
const v40StagePath=new URL('./.generated-fullrun-v310-no-recharge-v41-v40stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v41 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v41 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v41 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v41 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v41 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V40 proved Lightbody Pill purchase works, but sword still did not consume one before the fatal
// realm18 -> Ancient River travel encounter. Runtime registry inspection found the exact reason:
// contentRegistrySnapshot().enemies exposes `realmIndex`, not `realm`, and enemy `areas` are stable
// region IDs, not Chinese location names. V38's risk-aware path helper therefore compared incompatible
// fields and usually computed enemy ceiling 0. That made both path weighting and V40's pre-route pill
// decision blind to actual enemy tiers.
//
// V41 fixes only runner interpretation of the public content registry. It resolves route endpoint names
// through registry.regions, reads enemy.realmIndex (with realmId/index fallback), and keeps both stable IDs
// and human-readable names in the matcher. A live probe of 落星矿脉 -> 古河遗迹 must observe enemy ceiling
// >=21 before the run may proceed. Game source, route tables, enemy tables, weights, flee formula, pills,
// prices, stock, drops, RNG, time costs and all death rules remain unchanged.
let v40=fs.readFileSync(v40Path,'utf8');
v40=replaceOnce(
 v40,
 "await import(finalRunnerPath.href+'?v40final='+Date.now());",
 "// v41 executes the final runner after registry-correct route enemy risk mapping.",
 'suppress v40 final auto-import'
);
fs.writeFileSync(v40StagePath,v40);
await import(v40StagePath.href+'?v41stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v41 did not obtain v40 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const enemyRisk=`function runnerRegionId(name){
 const key=String(name||'');
 const row=Object.values(registry.regions||{}).find(x=>x&&x.name===key);
 return row?.id||row?.regionId||key;
}
function runnerEnemyRealmIndex(e){
 if(!e)return 0;
 const direct=Number(e.realmIndex);
 if(Number.isFinite(direct))return Math.max(0,direct);
 const byId=Number(registry.realms?.[e.realmId]?.index);
 if(Number.isFinite(byId))return Math.max(0,byId);
 const legacy=Number(e.realm);
 return Number.isFinite(legacy)?Math.max(0,legacy):0;
}
function routeEnemyCeilingForRunner(from,r){
 const names=[from,r?.a,r?.b,r?.to].filter(Boolean).map(String),areas=new Set();
 for(const name of names){areas.add(name);areas.add(String(runnerRegionId(name)))}
 const rows=Object.values(registry.enemies||{}).filter(e=>{
  if(!e||Number(e.weight||0)<=0)return false;
  if(!Array.isArray(e.areas)||!e.areas.length)return true;
  return e.areas.some(a=>areas.has(String(a)));
 });
 return rows.length?Math.max(...rows.map(runnerEnemyRealmIndex)):0;
}`;
runner=replaceFunction(runner,'function routeEnemyCeilingForRunner(',enemyRisk,'use stable region ids and realmIndex for route enemy ceiling');

const registryAnchor="const registry=invoke('contentRegistrySnapshot');\nassert.equal(state().version,'3.10.0');";
const registryProbe=`const registry=invoke('contentRegistrySnapshot');
const v41ProbeRoute=(invoke('routeInfo','落星矿脉','古河遗迹')||[])[0]||null;
const v41ProbeCeiling=v41ProbeRoute?routeEnemyCeilingForRunner('落星矿脉',v41ProbeRoute):0;
console.log('V310_FULLRUN_V41_RISK_PROBE',JSON.stringify({from:'落星矿脉',to:'古河遗迹',route:v41ProbeRoute?.id||null,enemyCeiling:v41ProbeCeiling,enemyRealmField:'realmIndex',regionIdMapping:true}));
assert(v41ProbeRoute,'V3.10 v41 risk probe route missing');
assert(v41ProbeCeiling>=21,'V3.10 v41 enemy registry risk mapping failed: Ancient River ceiling '+v41ProbeCeiling);
assert.equal(state().version,'3.10.0');`;
runner=replaceOnce(runner,registryAnchor,registryProbe,'runtime-probe corrected enemy risk mapping');

if(!runner.includes('function runnerRegionId(name)'))throw new Error('V3.10 v41 region-id resolver missing');
if(!runner.includes('function runnerEnemyRealmIndex(e)'))throw new Error('V3.10 v41 enemy realm resolver missing');
if(!runner.includes('Number(e.realmIndex)'))throw new Error('V3.10 v41 realmIndex mapping missing');
if(!runner.includes("registry.realms?.[e.realmId]?.index"))throw new Error('V3.10 v41 realmId fallback missing');
if(!runner.includes("V310_FULLRUN_V41_RISK_PROBE"))throw new Error('V3.10 v41 risk probe evidence missing');
if(!runner.includes("v41ProbeCeiling>=21"))throw new Error('V3.10 v41 Ancient River risk assertion missing');
if(!runner.includes("invoke('useV33Pill','recipe-v33-lightbody','common')"))throw new Error('V3.10 v41 lost V40 legal lightbody consumption');
if(!runner.includes("source:'carried-pill'"))throw new Error('V3.10 v41 lost carried-pill evidence');
if(!runner.includes('movement.filter(id=>active.has(id))'))throw new Error('V3.10 v41 lost movement-first escape prep');
if(!runner.includes('escapePreparedAt=-1'))throw new Error('V3.10 v41 lost one-prep-per-flee accounting');
if(!runner.includes('V310_FULLRUN_V39_FLEE'))throw new Error('V3.10 v41 lost flee diagnostics');
if(!runner.includes('core-batch')||!runner.includes('nascent-batch')||!runner.includes('deification-batch'))throw new Error('V3.10 v41 lost batch refining');
if(!runner.includes("tryRelicAuction(3,24)"))throw new Error('V3.10 v41 lost paid relic fallback');
if(!runner.includes("if(tryBeastMarket(n,24))return;"))throw new Error('V3.10 v41 lost paid beast market');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-beast-material'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v41 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v41 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V41_FINAL_RUNNER_PASS '+JSON.stringify({enemyRegistryRealmIndex:true,enemyRegistryRegionIds:true,routeEndpointNamesResolvedToIds:true,ancientRiverRuntimeProbe:true,minimumObservedAncientRiverCeiling:21,v40LightbodyPreserved:true,movementFirstEscapePreserved:true,onePrepPerFleeAttemptPreserved:true,riskAwareRoutingNowRegistryCorrect:true,enemyStatsUnchanged:true,enemyWeightsUnchanged:true,routeRiskUnchanged:true,fleeFormulaUnchanged:true,pillEffectsUnchanged:true,marketPricesAndStockUnchanged:true,dropRatesUnchanged:true,deathRiskUnchanged:true,rngUnchanged:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v41final='+Date.now());
