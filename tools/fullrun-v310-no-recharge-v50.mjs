import fs from 'fs';
import {spawnSync} from 'child_process';

const v49Path=new URL('./fullrun-v310-no-recharge-v49.mjs',import.meta.url);
const v49StagePath=new URL('./.generated-fullrun-v310-no-recharge-v50-v49stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v50 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v50 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v50 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v50 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v50 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V49 proved exact four-copy essence batching works, then a normal realm29 breakthrough failure consumed
// all four essences as designed. On the legal retry, the inherited seed helper generated the dangerous
// 合体道胎 first, then left 归一圣墟 to buy the final craft law/covenant inputs and died on that avoidable
// return trip. V50 preserves every retry cost and the 归一圣墟 hard craft gate. It only reserves the final
// craft inputs while generating seeds, so the final seed batch ends in the mandatory zone with those
// inputs still on hand and can craft immediately. Seed batches stay capped at 8 attempts / 80 total.
let v49=fs.readFileSync(v49Path,'utf8');
v49=replaceOnce(
 v49,
 "await import(finalRunnerPath.href+'?v49final='+Date.now());",
 "// v50 executes after reserve-aware dangerous-zone logistics.",
 'suppress v49 final gameplay auto-import'
);
fs.writeFileSync(v49StagePath,v49);
const staged=spawnSync(process.execPath,['--check',v49StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v50 staged V49 syntax check failed: '+(staged.stderr||staged.stdout||'unknown syntax error'));
await import(v49StagePath.href+'?v50stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v50 did not obtain V49 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const reserveAwareSeeds=`function ensureUnitySeeds(n,reserveLaw=0,reserveCovenant=0){
 let attemptsTotal=0;
 while(materialCount('mat-v37-unity-seed')<n){
  if(attemptsTotal>=80)fail('unity-seed-integration-deadlock',{target:n,current:materialCount('mat-v37-unity-seed'),attempts:attemptsTotal,lawProficiency:state().player.v37LawProficiency,unity:state().player.v37Unity,reserveLaw,reserveCovenant});
  ensureSwordEscapeSkill();ensureLaw(35);
  const missing=Math.max(1,n-materialCount('mat-v37-unity-seed'));
  const batch=Math.min(8,80-attemptsTotal,Math.max(3,Math.ceil(missing/.45)+2));
  const lawTarget=batch+Math.max(0,reserveLaw),covenantTarget=batch+Math.max(0,reserveCovenant);
  tryAuctionMaterial('mat-v37-law-crystal',lawTarget,160);ensureNamed('mat-v37-law-crystal',lawTarget);
  tryAuctionMaterial('mat-v37-soul-covenant-stone',covenantTarget,240);ensureNamed('mat-v37-soul-covenant-stone',covenantTarget);
  ensureLightbodyStock(16);
  if(!goTo('归一圣墟'))fail('unity-seed-integration-location-unreachable',{target:n,batch,attempts:attemptsTotal,reserveLaw,reserveCovenant});
  let used=0;
  while(materialCount('mat-v37-unity-seed')<n&&used<batch){
   used++;attemptsTotal++;
   const before=materialCount('mat-v37-unity-seed');
   const r=spendAction('integrate-unity-for-seed',()=>invoke('v37IntegrateUnity'));heal();
   if(!r?.ok)fail('unity-seed-integration-blocked',{target:n,result:r,attempt:attemptsTotal,batch,reserveLaw,reserveCovenant});
   const after=materialCount('mat-v37-unity-seed');
   if(after>before)console.log('V310_FULLRUN_MATERIAL',JSON.stringify({source:'unity-integration-minibatch-reserved',id:'mat-v37-unity-seed',name:'合体道胎',count:after,target:n,attempt:attemptsTotal,batch,reserveLaw,reserveCovenant,actions}));
  }
  console.log('V310_FULLRUN_V50_UNITY_SEED_BATCH',JSON.stringify({target:n,current:materialCount('mat-v37-unity-seed'),batch,used,attemptsTotal,reserveLaw,reserveCovenant,lawRemaining:materialCount('mat-v37-law-crystal'),covenantRemaining:materialCount('mat-v37-soul-covenant-stone'),pills:lightbodyPillCount(),location:state().player.location,actions}));
 }
}`;
runner=replaceFunction(runner,'function ensureUnitySeeds(',reserveAwareSeeds,'make unity-seed minibatch preserve final craft inputs');

const safeOrderedEssence=`function ensureUnityEssence(n){
 let guard=0;
 while(materialCount('mat-v37-unity-essence')<n){
  if(++guard>8)fail('unity-essence-loop',{target:n,current:materialCount('mat-v37-unity-essence')});
  ensureLaw(35);ensureUnity(30);
  const current=materialCount('mat-v37-unity-essence'),missing=n-current;
  if(missing<=0)return;
  ensureVoidEssence(missing);
  ensureLightbodyStock(16);
  ensureUnitySeeds(2*missing,2*missing,missing);
  if(materialCount('mat-v37-law-crystal')<2*missing||materialCount('mat-v37-soul-covenant-stone')<missing||materialCount('mat-v36-void-essence')<missing||materialCount('mat-v37-unity-seed')<2*missing)fail('unity-essence-reserve-lost',{target:n,missing,seeds:materialCount('mat-v37-unity-seed'),law:materialCount('mat-v37-law-crystal'),covenant:materialCount('mat-v37-soul-covenant-stone'),voidEssence:materialCount('mat-v36-void-essence'),location:state().player.location});
  console.log('V310_FULLRUN_V50_ESSENCE_READY',JSON.stringify({target:n,current,missing,seeds:materialCount('mat-v37-unity-seed'),law:materialCount('mat-v37-law-crystal'),covenant:materialCount('mat-v37-soul-covenant-stone'),voidEssence:materialCount('mat-v36-void-essence'),pills:lightbodyPillCount(),location:state().player.location,actions}));
  if(state().player.location!=='归一圣墟'&&!goTo('归一圣墟'))fail('unity-essence-location-unreachable',{target:n,current,missing});
  for(let k=0;k<missing;k++){
   const before=materialCount('mat-v37-unity-essence');
   const r=spendAction('craft-unity-essence',()=>invoke('v37CraftUnityEssence'));
   if(!r?.ok||materialCount('mat-v37-unity-essence')<=before)fail('unity-essence-craft-blocked',{result:r,target:n,current:materialCount('mat-v37-unity-essence'),batchMissing:missing,index:k});
  }
  console.log('V310_FULLRUN_V50_ESSENCE_BATCH',JSON.stringify({target:n,count:materialCount('mat-v37-unity-essence'),crafted:missing,location:state().player.location,actions}));
 }
}`;
runner=replaceFunction(runner,'function ensureUnityEssence(',safeOrderedEssence,'prepare safe inputs before final dangerous seed expedition and craft in place');

if(!runner.includes('V310_FULLRUN_V50_UNITY_SEED_BATCH')||!runner.includes('V310_FULLRUN_V50_ESSENCE_READY')||!runner.includes('V310_FULLRUN_V50_ESSENCE_BATCH'))throw new Error('V3.10 v50 evidence markers missing');
if(!runner.includes("ensureUnitySeeds(2*missing,2*missing,missing);"))throw new Error('V3.10 v50 exact final-input reservation call missing');
if(!runner.includes("const lawTarget=batch+Math.max(0,reserveLaw),covenantTarget=batch+Math.max(0,reserveCovenant);"))throw new Error('V3.10 v50 reserve-aware seed batching missing');
if(!runner.includes('V310_FULLRUN_V49_FINAL_RUNNER_PASS'))throw new Error('V3.10 v50 lost V49 hard-rule proof');
if(!runner.includes('V310_FULLRUN_V48_UNITY_SITE'))throw new Error('V3.10 v50 lost V48 safe ordinary unity-site selection');
if(!runner.includes('V310_FULLRUN_V45_ESCAPE_OPTIONS'))throw new Error('V3.10 v50 lost V45 effect-aware escape');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-v37-unity-essence'")||runner.includes("v33AddMaterial('mat-v37-unity-seed'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v50 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v50 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V50_FINAL_RUNNER_PASS '+JSON.stringify({seedBatchMax:8,seedAttemptCap:80,finalCraftInputsReservedDuringSeedGeneration:true,safeInputsPreparedBeforeFinalDangerousExpedition:true,mandatoryUnityEssenceSitePreserved:true,breakthroughCostsAndRngUnchanged:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v50final='+Date.now());
