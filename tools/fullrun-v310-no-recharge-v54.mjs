import fs from 'fs';
import {spawnSync} from 'child_process';

const v53Path=new URL('./fullrun-v310-no-recharge-v53.mjs',import.meta.url);
const v53StagePath=new URL('./.generated-fullrun-v310-no-recharge-v54-v53stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);
const V54_SAFETY_MARGIN=.20;

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v54 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v54 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v54 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v54 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v54 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V53 removed the low-yield work-location action sink. Flame then reached 大乘圆满 with full
// cultivation progress inside the 300k proof, but exhausted the fuse while terminal prep was farming
// 抗劫阵核. The material has two legal sources: 九霄劫台 and 人界议庭. The inherited generic
// ensureNamed() blindly chooses the first reachable source. At 九霄劫台 danger is 0.99, so almost
// every explore action expands into a full combat; at 人界议庭 danger is 0.42 and ordinary exploration
// can directly gather the same named material. This is a runner source-selection defect, not a request
// to change drop rates, danger, combat, material costs, action accounting or the 300k validation fuse.
//
// V54 keeps the normal legal gather action and all game data intact. It only allows ensureNamed() to
// switch from its original first-reachable source when another reachable source is materially safer
// (>= 0.20 lower region danger). Route days/risk and registry-declared combat drop capability are used
// only as tie/quality signals. If no materially safer source exists, original source ordering is kept.
let v53=fs.readFileSync(v53Path,'utf8');
v53=replaceOnce(
 v53,
 "await import(finalRunnerPath.href+'?v53final='+Date.now());",
 "// v54 executes after safer legal named-material source selection.",
 'suppress v53 final gameplay auto-import'
);
fs.writeFileSync(v53StagePath,v53);
const staged=spawnSync(process.execPath,['--check',v53StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v54 staged V53 syntax check failed: '+(staged.stderr||staged.stdout||'unknown syntax error'));
await import(v53StagePath.href+'?v54stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v54 did not obtain V53 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const namedSourceLogistics=`const V54_SAFETY_MARGIN=.20;
function v54RegionByName(name){return Object.values(registry.regions||{}).find(r=>r&&r.name===name)||null}
function v54RouteDays(path){return (path||[]).reduce((sum,r)=>sum+Math.max(0,Number(r?.days)||0),0)}
function v54CombatDropRatio(id,regionId){
 if(!regionId)return 0;
 const dropsByEnemy=new Map(Object.values(registry.drops||{}).map(d=>[d.enemyId,d]));
 let total=0,capable=0;
 for(const e of Object.values(registry.enemies||{})){
  if(!(e?.areas||[]).includes(regionId))continue;
  const realmGap=Math.abs((Number(e.realmIndex)||0)-state().player.realmIndex);
  const weight=Math.max(0,Number(e.weight)||0)/(1+realmGap*.65);
  if(weight<=0)continue;
  total+=weight;
  if((dropsByEnemy.get(e.id)?.entries||[]).some(row=>row.materialId===id))capable+=weight;
 }
 return total>0?capable/total:0;
}
function v54NamedSourceCandidate(origin,location,index,id){
 const route=location===origin?[]:findPath(origin,location);
 if(location!==origin&&!route)return null;
 const risk=route.length?pathRiskProfile(route,origin):{totalRisk:0,majorGap:0,rawGap:0,maxRisk:0};
 const region=v54RegionByName(location);
 const danger=Math.max(0,Number(region?.danger)||0);
 const routeDays=v54RouteDays(route),routeRisk=Math.max(0,Number(risk?.totalRisk)||0);
 const combatDropRatio=v54CombatDropRatio(id,region?.id||null);
 const score=danger*100+routeDays*.20+routeRisk*3-combatDropRatio*4;
 return {location,index,route,danger,routeDays,routeRisk,combatDropRatio,score};
}
function v54ChooseNamedSource(id,sources){
 const origin=state().player.location,candidates=[];
 for(let i=0;i<sources.length;i++){
  const row=v54NamedSourceCandidate(origin,sources[i],i,id);
  if(row)candidates.push(row);
 }
 if(!candidates.length)return null;
 const first=candidates[0];
 const best=[...candidates].sort((a,b)=>a.score-b.score||a.index-b.index)[0];
 const safer=best.location!==first.location&&best.danger+V54_SAFETY_MARGIN<=first.danger;
 return {origin,first,best,chosen:safer?best:first,safer,candidates};
}
function ensureNamed(id,n){
 if(materialCount(id)>=n)return;
 const m=registry.materials[id];
 if(!m)fail('material-registry-missing',{id,target:n});
 const sources=(m.locations||[]).filter(Boolean),plan=v54ChooseNamedSource(id,sources);
 if(!plan)fail('named-material-source-unreachable',{id,name:m.name,target:n,sources});
 const chosen=plan.chosen.location;
 console.log('V310_FULLRUN_V54_NAMED_SOURCE',JSON.stringify({id,name:m.name,target:n,origin:plan.origin,chosen,firstReachable:plan.first.location,bestScored:plan.best.location,switchedForSafety:plan.safer,chosenDanger:Number(plan.chosen.danger.toFixed(3)),firstDanger:Number(plan.first.danger.toFixed(3)),routeDays:plan.chosen.routeDays,routeRisk:Number(plan.chosen.routeRisk.toFixed(4)),combatDropRatio:Number(plan.chosen.combatDropRatio.toFixed(4)),safetyMargin:V54_SAFETY_MARGIN,actions}));
 if(state().player.location!==chosen&&!goTo(chosen))fail('named-material-source-unreachable',{id,name:m.name,target:n,sources,chosen});
 let guard=0,last=materialCount(id),wins0=state().player.battleWins;
 while(materialCount(id)<n){
  if(++guard>MAX_FARM_ACTIONS)fail('named-material-farm-deadlock',{id,name:m.name,target:n,current:materialCount(id),location:chosen,battleWinsGained:state().player.battleWins-wins0});
  act('explore',true);
  const cur=materialCount(id);
  if(cur>last){console.log('V310_FULLRUN_MATERIAL',JSON.stringify({id,name:m.name,count:cur,target:n,location:chosen,actions}));last=cur}
 }
}`;

runner=replaceFunction(runner,'function ensureNamed(',namedSourceLogistics,'prefer materially safer legal named-material source while preserving normal exploration');

if(!runner.includes('V310_FULLRUN_V54_NAMED_SOURCE'))throw new Error('V3.10 v54 named-source evidence marker missing');
if(!runner.includes('const V54_SAFETY_MARGIN=.20;'))throw new Error('V3.10 v54 material safety margin missing');
if(!runner.includes("act('explore',true);"))throw new Error('V3.10 v54 normal legal exploration loop missing');
if(!runner.includes('best.danger+V54_SAFETY_MARGIN<=first.danger'))throw new Error('V3.10 v54 conservative safer-source guard missing');
if(!runner.includes('registry.regions')||!runner.includes('registry.enemies')||!runner.includes('registry.drops'))throw new Error('V3.10 v54 stable registry source analysis missing');
if(!runner.includes('V310_FULLRUN_V53_WORK_RELOCATE'))throw new Error('V3.10 v54 lost V53 work relocation');
if(!runner.includes('V310_FULLRUN_V52_MAHAYANA_BATCH'))throw new Error('V3.10 v54 lost V52 Mahayana batching');
if(!runner.includes('V310_FULLRUN_V51_ORIGIN_SITE'))throw new Error('V3.10 v54 lost V51 origin-site selection');
if(!runner.includes('V310_FULLRUN_V50_ESSENCE_READY'))throw new Error('V3.10 v54 lost V50 unity reserve handling');
if(!runner.includes('V310_FULLRUN_V45_ESCAPE_OPTIONS'))throw new Error('V3.10 v54 lost V45 escape policy');
if(!runner.includes('V310_FULLRUN_V41_RISK_PROBE'))throw new Error('V3.10 v54 lost V41 route-risk mapping');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-v38-mahayana-essence'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v54 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v54 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V54_FINAL_RUNNER_PASS '+JSON.stringify({saferNamedMaterialSources:true,materialSafetyMargin:V54_SAFETY_MARGIN,normalExploreActionsOnly:true,materialCostsUnchanged:true,dropRatesUnchanged:true,regionDangerUnchanged:true,combatUnchanged:true,routeFeesAndRiskUnchanged:true,actionCapUnchanged:true,maxActions:Number(process.env.V310_FULLRUN_MAX_ACTIONS||180000),rngUnchanged:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v54final='+Date.now());
