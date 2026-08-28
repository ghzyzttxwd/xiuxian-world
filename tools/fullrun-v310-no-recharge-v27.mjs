import fs from 'fs';
import {spawnSync} from 'child_process';

const v26Path=new URL('./fullrun-v310-no-recharge-v26.mjs',import.meta.url);
const v26StagePath=new URL('./.generated-fullrun-v310-no-recharge-v27-v26stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v27 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v27 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V26 legally reached 渡劫初期 (realm 37) with progress full, no deaths and no forbidden calls,
// but exhausted the 180000-action proof budget while preparing the five V38 tribulation slots.
// The terminal runner fetched each cost ONE UNIT AT A TIME, so every 8-14 point preparation tick
// could bounce between 九霄劫台, remote high-danger material maps and the normal auction recovery route.
// That is poor autonomous-player routing, not evidence that the game costs themselves must change.
//
// V27 keeps every gameplay value, material source, drop rate, auction stock, breakthrough requirement,
// RNG and time cost unchanged. For each preparation category it computes the worst-case remaining
// number of legal V38 preparation calls from the real minimum gain (8), stocks only that bounded
// quantity through existing ensureNamed/auction/map gameplay, then returns once to 九霄劫台 and
// spends those materials through the unchanged v38PrepareTribulation API. Diagnostics make any
// remaining terminal grind visible instead of hiding it behind a larger action cap.
let v26=fs.readFileSync(v26Path,'utf8');
v26=replaceOnce(
 v26,
 "await import(finalRunnerPath.href+'?v26final='+Date.now());",
 "// v27 executes the final runner after terminal tribulation-prep route batching.",
 'suppress v26 final auto-import'
);
fs.writeFileSync(v26StagePath,v26);
await import(v26StagePath.href+'?v27stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v27 did not obtain v26 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
runner=replaceOnce(runner,'function prepareTribulation(){','function prepareTribulationV26(){','preserve v26 terminal preparation for audit comparison');

const finishAnchor='function finishTribulation(){prepareTribulation();';
const v27Prep=`function v27PrepareTribulationKind(kind,cost){
 const startPrep=Number(state().player.v38TribulationPrep?.[kind]||0);
 if(startPrep>=60)return;
 const missing=Math.max(0,60-startPrep),plannedCalls=Math.ceil(missing/8);
 const actionStart=actions,ageStart=ageYears();
 const stockBefore=Object.fromEntries(Object.keys(cost).map(id=>[id,materialCount(id)]));
 for(const [id,perCall] of Object.entries(cost)){
  const target=materialCount(id)+plannedCalls*perCall;
  ensureNamed(id,target);
 }
 const stockReady=Object.fromEntries(Object.keys(cost).map(id=>[id,materialCount(id)]));
 if(!goTo('九霄劫台'))fail('tribulation-terrace-unreachable',{kind,stage:'v27-batched-return'});
 let guard=0;
 while((state().player.v38TribulationPrep?.[kind]||0)<60){
  if(++guard>plannedCalls)fail('tribulation-prep-v27-call-overrun',{kind,startPrep,plannedCalls,current:state().player.v38TribulationPrep?.[kind]||0,stock:stockReady});
  const before=Number(state().player.v38TribulationPrep?.[kind]||0);
  const r=spendAction('tribulation-prep:'+kind,()=>invoke('v38PrepareTribulation',kind));
  heal();
  const after=Number(state().player.v38TribulationPrep?.[kind]||0);
  if(!r?.ok)fail('tribulation-prep-blocked',{kind,result:r,before,after,plannedCalls});
  if(after<=before)fail('tribulation-prep-v27-no-progress',{kind,result:r,before,after,plannedCalls});
 }
 console.log('V310_FULLRUN_V27_TRIB_PREP',JSON.stringify({kind,startPrep,finalPrep:state().player.v38TribulationPrep?.[kind]||0,plannedCalls,usedCalls:guard,stockBefore,stockReady,stockAfter:Object.fromEntries(Object.keys(cost).map(id=>[id,materialCount(id)])),actionsUsed:actions-actionStart,ageYearsUsed:Number((ageYears()-ageStart).toFixed(2)),totalActions:actions,totalAge:Number(ageYears().toFixed(2))}));
}
function prepareTribulation(){
 ensureSpace(80);ensureLaw(230);ensureUnity(110);ensureOrigin(300);ensureAuthority(170);ensureNatalMarks(7);
 const prepCosts={body:{'mat-v38-tribulation-stone':1,'mat-v38-heaven-vein-marrow':1},soul:{'mat-v38-soulstar-dew':1,'mat-v38-tribulation-stone':1},law:{'mat-v38-origin-crystal':1,'mat-v38-immortal-mortal-dust':1},artifact:{'mat-v38-natal-source-crystal':1,'mat-v38-tribulation-stone':1},formation:{'mat-v38-tribulation-array-core':1,'mat-v38-origin-gold':1}};
 for(const kind of ['body','soul','law','artifact','formation'])v27PrepareTribulationKind(kind,prepCosts[kind]);
 if(!goTo('九霄劫台'))fail('tribulation-terrace-unreachable',{stage:'v27-before-formation'});
 const formation='formation-v39-five-elements',f=registry.formations[formation];
 if(!f)fail('formation-registry-missing',{formation});
 for(const [id,n] of Object.entries(f.cost||{}))ensureNamed(id,n);
 if(!goTo('九霄劫台'))fail('tribulation-terrace-unreachable',{stage:'v27-after-formation-materials'});
 const built=spendAction('build-tribulation-formation',()=>invoke('v39BuildTribulationFormation',formation));
 if(!built?.ok)fail('formation-build-blocked',{result:built});
 const ready=invoke('v39TribulationReadiness');
 if(!ready?.ready)fail('tribulation-readiness',{readiness:ready});
 console.log('V310_FULLRUN_V27_TRIB_READY',JSON.stringify({readiness:ready,prep:state().player.v38TribulationPrep,formationId:state().player.v39FormationId,actions,age:Number(ageYears().toFixed(2))}));
}
function finishTribulation(){prepareTribulation();`;
runner=replaceOnce(runner,finishAnchor,v27Prep,'install batched route-aware terminal preparation');

if(!runner.includes('function prepareTribulationV26(){'))throw new Error('V3.10 v27 did not preserve v26 terminal prep for comparison');
if(!runner.includes('function v27PrepareTribulationKind(kind,cost)'))throw new Error('V3.10 v27 batching helper missing');
if(!runner.includes('Math.ceil(missing/8)'))throw new Error('V3.10 v27 real minimum preparation gain planning missing');
if(!runner.includes('V310_FULLRUN_V27_TRIB_PREP'))throw new Error('V3.10 v27 per-category diagnostics missing');
if(!runner.includes('V310_FULLRUN_V27_TRIB_READY'))throw new Error('V3.10 v27 readiness diagnostic missing');
if(!runner.includes("invoke('v38PrepareTribulation',kind)"))throw new Error('V3.10 v27 normal V38 preparation API lost');
if(!runner.includes("invoke('v39BuildTribulationFormation',formation)"))throw new Error('V3.10 v27 normal V39 formation API lost');
if(!runner.includes("invoke('v39BeginTribulation')")||!runner.includes("invoke('v39AscendToTrueImmortal')"))throw new Error('V3.10 v27 terminal V39 chain lost');
if(runner.includes('v37SetPlayerForTest')||runner.includes('v33AddMaterial(\'mat-v38-tribulation-stone\'')||runner.includes('v33AddMaterial(\'mat-v38-soulstar-dew\'')||runner.includes('v33AddMaterial(\'mat-v38-tribulation-array-core\''))throw new Error('forbidden terminal resource shortcut leaked into V3.10 v27 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v27 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V27_FINAL_RUNNER_PASS '+JSON.stringify({terminalPreparationBatched:true,minimumRealPrepGain:8,worstCaseBoundedStock:true,normalNamedMaterialRoutesOnly:true,existingAuctionRoutesPreserved:true,normalV38PreparationApi:true,normalV39FormationAndAscensionApis:true,actionCapUnchanged:true,materialCostsUnchanged:true,dropRatesUnchanged:true,enemyTablesUnchanged:true,rngUnchanged:true,timeCostsUnchanged:true,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v27final='+Date.now());
