import fs from 'fs';
import {spawnSync} from 'child_process';

const v45Path=new URL('./fullrun-v310-no-recharge-v45.mjs',import.meta.url);
const v45StagePath=new URL('./.generated-fullrun-v310-no-recharge-v46-v45stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v46 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v46 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v46 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v46 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v46 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V45 proved the effect-aware escape selection itself works: body completed the full legal fresh-save,
// no-recharge route to True Immortal. Flame/spirit then isolated logistics exposure instead:
// - spirit safely bought 5/9 required relic fragments, but the inherited 24-refresh auction patience
//   expired and the runner voluntarily fell back to +3-realm 古河 exploration;
// - flame's inherited V6 unity-seed "JIT" policy bought exactly one law crystal + one soul covenant per
//   stochastic 三元归一 attempt. That forced a full 苍梧 auction <-> 归一圣墟 hazardous commute after
//   nearly every attempt, consuming more than 100 normal Lightbody Pills before one return trip started
//   with zero stock and ended in a realm33 encounter death.
// V46 changes autonomous logistics only. Relic auction patience becomes a finite 96 refreshes. Unity-seed
// procurement becomes a bounded mini-batch (max 8 attempts): enough normal auction inputs for several
// integrations are bought together, then the player stays in 归一圣墟 for those attempts before returning.
// A normal 16-pill route reserve is replenished before each expedition. This avoids both V4's speculative
// dozens-of-items bulk stock and V6's one-item-per-dangerous-roundtrip extreme. Game prices, auction stock,
// refresh cadence, flee chance, pill effects, enemy stats, drops, progression costs, RNG and death rules
// remain unchanged.
let v45=fs.readFileSync(v45Path,'utf8');
v45=replaceOnce(
 v45,
 "await import(finalRunnerPath.href+'?v45final='+Date.now());",
 "// v46 executes the final runner after evidence-driven safe logistics batching.",
 'suppress v45 final gameplay auto-import'
);
fs.writeFileSync(v45StagePath,v45);
const staged=spawnSync(process.execPath,['--check',v45StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v46 staged V45 syntax check failed: '+(staged.stderr||staged.stdout||'unknown syntax error'));
await import(v45StagePath.href+'?v46stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v46 did not obtain V45 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

// 1. Keep the legitimate dangerous relic maps as fallback, but do not abandon the existing paid auction
// after only 24 refreshes when a mandatory breakthrough target is already more than half fulfilled safely.
runner=replaceOnce(
 runner,
 "if(tryRelicAuction(n,24))return;",
 "if(tryRelicAuction(n,96))return;",
 'extend bounded normal relic-auction patience before dangerous exploration'
);

// 2. Replace V6's one-resource-per-roundtrip JIT with small evidence-bounded expedition batches.
// The stochastic integration cap remains 80 total normal attempts. Each batch carries at most 8 of each
// input, and actual integration stops immediately once the target seed count is reached.
const miniBatchUnitySeeds=`function ensureUnitySeeds(n){
 let attemptsTotal=0;
 while(materialCount('mat-v37-unity-seed')<n){
  if(attemptsTotal>=80)fail('unity-seed-integration-deadlock',{target:n,current:materialCount('mat-v37-unity-seed'),attempts:attemptsTotal,lawProficiency:state().player.v37LawProficiency,unity:state().player.v37Unity});
  ensureSwordEscapeSkill();ensureLaw(35);
  const missing=Math.max(1,n-materialCount('mat-v37-unity-seed'));
  const batch=Math.min(8,80-attemptsTotal,Math.max(3,Math.ceil(missing/.45)+2));
  tryAuctionMaterial('mat-v37-law-crystal',batch,120);ensureNamed('mat-v37-law-crystal',batch);
  tryAuctionMaterial('mat-v37-soul-covenant-stone',batch,240);ensureNamed('mat-v37-soul-covenant-stone',batch);
  ensureLightbodyStock(16);
  if(!goTo('归一圣墟'))fail('unity-seed-integration-location-unreachable',{target:n,batch,attempts:attemptsTotal});
  let used=0;
  while(materialCount('mat-v37-unity-seed')<n&&used<batch){
   used++;attemptsTotal++;
   const before=materialCount('mat-v37-unity-seed');
   const r=spendAction('integrate-unity-for-seed',()=>invoke('v37IntegrateUnity'));heal();
   if(!r?.ok)fail('unity-seed-integration-blocked',{target:n,result:r,attempt:attemptsTotal,batch});
   const after=materialCount('mat-v37-unity-seed');
   if(after>before)console.log('V310_FULLRUN_MATERIAL',JSON.stringify({source:'unity-integration-minibatch',id:'mat-v37-unity-seed',name:'合体道胎',count:after,target:n,attempt:attemptsTotal,batch,actions}));
  }
  console.log('V310_FULLRUN_V46_UNITY_BATCH',JSON.stringify({target:n,current:materialCount('mat-v37-unity-seed'),batch,used,attemptsTotal,pills:lightbodyPillCount(),location:state().player.location,actions}));
 }
}`;
runner=replaceFunction(runner,'function ensureUnitySeeds(',miniBatchUnitySeeds,'replace dangerous per-attempt commute with bounded mini-batch integration');

if(!runner.includes("if(tryRelicAuction(n,96))return;"))throw new Error('V3.10 v46 relic auction patience missing');
if(runner.includes("if(tryRelicAuction(n,24))return;"))throw new Error('V3.10 v46 stale 24-cycle relic fallback survived');
if(!runner.includes("source:'unity-integration-minibatch'"))throw new Error('V3.10 v46 mini-batch integration evidence missing');
if(!runner.includes('V310_FULLRUN_V46_UNITY_BATCH'))throw new Error('V3.10 v46 unity batch summary missing');
if(!runner.includes("const batch=Math.min(8,80-attemptsTotal,Math.max(3,Math.ceil(missing/.45)+2));"))throw new Error('V3.10 v46 bounded batch sizing missing');
if(!runner.includes("ensureLightbodyStock(16);"))throw new Error('V3.10 v46 normal expedition pill reserve missing');
if(runner.includes("tryAuctionMaterial('mat-v37-law-crystal',1,120);ensureNamed('mat-v37-law-crystal',1);tryAuctionMaterial('mat-v37-soul-covenant-stone',1,240)"))throw new Error('V3.10 v46 stale one-attempt commute survived');
if(!runner.includes("invoke('useV33Pill','recipe-v33-lightbody','common')"))throw new Error('V3.10 v46 lost normal Lightbody consumption');
if(!runner.includes('V310_FULLRUN_V45_ESCAPE_OPTIONS'))throw new Error('V3.10 v46 lost effect-aware V45 escape policy');
if(!runner.includes('V310_FULLRUN_V44_SECRET_ROTATED'))throw new Error('V3.10 v46 lost secret-realm rotation revalidation');
if(!runner.includes('V310_FULLRUN_V41_RISK_PROBE'))throw new Error('V3.10 v46 lost public-registry risk mapping');
if(!runner.includes("source:'auction'"))throw new Error('V3.10 v46 lost normal auction evidence');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("v33AddMaterial('mat-v37-unity-seed'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v46 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v46 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V46_FINAL_RUNNER_PASS '+JSON.stringify({
 relicAuctionMaxCycles:96,
 dangerousRelicFallbackPreserved:true,
 unitySeedMiniBatchMax:8,
 unityIntegrationAttemptCap:80,
 expeditionLightbodyReserve:16,
 normalMarketAndAuctionOnly:true,
 v45EffectAwareEscapePreserved:true,
 v44SecretRotationPreserved:true,
 v41RiskMappingPreserved:true,
 enemyStatsUnchanged:true,
 fleeChanceUnchanged:true,
 pillEffectsUnchanged:true,
 marketPricesAndStockCadenceUnchanged:true,
 progressionCostsUnchanged:true,
 rngUnchanged:true,
 deathRiskUnchanged:true,
 noDirectResourceInjection:true,
 noRunnerGameplayMutation:true,
 generatedRunnerSyntaxChecked:true,
 finalRunner:finalRunnerPath.pathname
}));
await import(finalRunnerPath.href+'?v46final='+Date.now());
