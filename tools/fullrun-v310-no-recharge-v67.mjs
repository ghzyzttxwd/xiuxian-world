import fs from 'fs';
import {spawnSync} from 'child_process';

const v66Path=new URL('./fullrun-v310-no-recharge-v66.mjs',import.meta.url);
const v66StagePath=new URL('./.generated-fullrun-v310-no-recharge-v67-v66stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);
const gamePath=new URL('../src/game-v310.js',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v67 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v67 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v67 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v67 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v67 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V66 flame evidence reached realm29 with the legal midgame guard equipped, then died on the fifth
// supply trip through 万象法坛 while producing 合体道胎. The gameplay source grants one seed from
// normal 三元归一 in 归一圣墟 at exactly 28% per attempt; inherited V50 still budgets as if the yield
// were about 45% and caps each expedition at only eight attempts. V67 changes autonomous logistics
// only: prepare a larger lawful stock of 法纹晶 / 元神契石 before entering the dangerous site, execute
// up to 40 integrations in one expedition, and only resupply if that statistically conservative batch
// still misses the target. Total integration attempts remain hard-capped at 80. No game data, RNG,
// drop rate, route danger, flee chance, enemy stats, costs, seed or 300k action cap changes.
let v66=fs.readFileSync(v66Path,'utf8');
v66=replaceOnce(
 v66,
 "await import(finalRunnerPath.href+'?v66final='+Date.now());",
 "// v67 executes after correcting unity-seed expedition batching.",
 'suppress v66 final gameplay auto-import'
);
fs.writeFileSync(v66StagePath,v66);
const staged=spawnSync(process.execPath,['--check',v66StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v67 staged V66 syntax failure: '+(staged.stderr||staged.stdout||''));
await import(v66StagePath.href+'?v67stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v67 did not obtain V66 final runner');

const game=fs.readFileSync(gamePath,'utf8');
if(!game.includes("p.location==='归一圣墟'&&rand()<.28"))throw new Error('V67 authored unity-seed 28% source drifted');
if(!game.includes("v33AddMaterial('mat-v37-unity-seed',1)"))throw new Error('V67 authored unity-seed award missing');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const saferUnitySeeds=`function ensureUnitySeeds(n,reserveLaw=0,reserveCovenant=0){
 let attemptsTotal=0,expeditions=0;
 while(materialCount('mat-v37-unity-seed')<n){
  if(attemptsTotal>=80)fail('unity-seed-integration-deadlock',{target:n,current:materialCount('mat-v37-unity-seed'),attempts:attemptsTotal,expeditions,lawProficiency:state().player.v37LawProficiency,unity:state().player.v37Unity,reserveLaw,reserveCovenant});
  ensureSwordEscapeSkill();ensureLaw(35);
  const missing=Math.max(1,n-materialCount('mat-v37-unity-seed'));
  // Authored seed probability is 28%. For eight missing seeds this gives a 40-attempt first expedition;
  // P(getting fewer than 8 seeds in 40 Bernoulli(.28) attempts) is ~9.24%, so ordinary runs usually
  // pay the danger crossing once instead of V50's repeated eight-attempt shuttling.
  const expected=Math.ceil(missing/.28);
  const batch=Math.min(80-attemptsTotal,40,Math.max(12,expected+12));
  const lawTarget=batch+Math.max(0,reserveLaw),covenantTarget=batch+Math.max(0,reserveCovenant);
  tryAuctionMaterial('mat-v37-law-crystal',lawTarget,160);ensureNamed('mat-v37-law-crystal',lawTarget);
  tryAuctionMaterial('mat-v37-soul-covenant-stone',covenantTarget,240);ensureNamed('mat-v37-soul-covenant-stone',covenantTarget);
  ensureLightbodyStock(16);
  expeditions++;
  if(!goTo('归一圣墟'))fail('unity-seed-integration-location-unreachable',{target:n,batch,attempts:attemptsTotal,expeditions,reserveLaw,reserveCovenant});
  let used=0,gained=0;
  while(materialCount('mat-v37-unity-seed')<n&&used<batch){
   used++;attemptsTotal++;
   const before=materialCount('mat-v37-unity-seed');
   const r=spendAction('integrate-unity-for-seed',()=>invoke('v37IntegrateUnity'));heal();
   if(!r?.ok)fail('unity-seed-integration-blocked',{target:n,result:r,attempt:attemptsTotal,batch,expeditions,reserveLaw,reserveCovenant});
   const after=materialCount('mat-v37-unity-seed');
   if(after>before){gained+=after-before;console.log('V310_FULLRUN_MATERIAL',JSON.stringify({source:'unity-integration-v67-batched',id:'mat-v37-unity-seed',name:'合体道胎',count:after,target:n,attempt:attemptsTotal,batch,expeditions,reserveLaw,reserveCovenant,actions}))}
  }
  console.log('V310_FULLRUN_V67_UNITY_LOGISTICS',JSON.stringify({target:n,current:materialCount('mat-v37-unity-seed'),missingAtStart:missing,authoredProbability:.28,batch,used,gained,attemptsTotal,expeditions,reserveLaw,reserveCovenant,lawRemaining:materialCount('mat-v37-law-crystal'),covenantRemaining:materialCount('mat-v37-soul-covenant-stone'),location:state().player.location,actions}));
 }
}`;
runner=replaceFunction(runner,'function ensureUnitySeeds(',saferUnitySeeds,'batch unity-seed logistics around authored 28 percent source');

if(!runner.includes('V310_FULLRUN_V67_UNITY_LOGISTICS'))throw new Error('V67 unity logistics marker missing');
if(!runner.includes('const expected=Math.ceil(missing/.28);'))throw new Error('V67 authored-probability budgeting missing');
if(!runner.includes('const batch=Math.min(80-attemptsTotal,40,Math.max(12,expected+12));'))throw new Error('V67 expedition batch cap missing');
if(!runner.includes('if(attemptsTotal>=80)'))throw new Error('V67 80-attempt hard cap missing');
for(const marker of ['V310_FULLRUN_V66_MID_GUARD','V310_FULLRUN_V65_DWELLING','V310_FULLRUN_V64_PRODUCTIVE_SOURCE','V310_FULLRUN_V62_ESCAPE_GUARD','V310_FULLRUN_V61_LIVE_TRIBULATION_ENTRY','V310_FULLRUN_V57_GEAR_CALL'])if(!runner.includes(marker))throw new Error('V67 lost inherited marker '+marker);
if(runner.includes('V310_FULLRUN_V63_MAHAYANA_BREW'))throw new Error('V67 must retain V66 no-auto-pill policy');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("invoke('v34ActivateBuildForTest'")||runner.includes("v33AddMaterial('mat-v37-unity-seed'"))throw new Error('forbidden progression/resource shortcut leaked into V67 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V67 final runner syntax failure: '+(syntax.stderr||syntax.stdout||''));
console.log('V310_FULLRUN_V67_FINAL_RUNNER_PASS '+JSON.stringify({unitySeedAuthoredProbability:.28,maxExpeditionBatch:40,totalAttemptCap:80,prestockBeforeDangerousUnitySite:true,normalAuctionAndMapInputsOnly:true,v66MidGuardPreserved:true,v65MaxDwellingPreserved:true,v64ProductiveDomainSandPreserved:true,v62EscapeGuardPreserved:true,v61LiveTribulationGearPreserved:true,automaticMahayanaPillChasing:false,gameDataUnchanged:true,rngUnchanged:true,routeDangerUnchanged:true,fleeChanceUnchanged:true,enemyStatsUnchanged:true,progressionCostsUnchanged:true,seedUnchanged:true,actionCapUnchanged:true,noDirectResourceInjection:true,noDirectStateMutation:true}));
await import(finalRunnerPath.href+'?v67final='+Date.now());
