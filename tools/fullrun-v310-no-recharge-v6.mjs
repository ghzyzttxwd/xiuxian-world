import fs from 'fs';

const v5Path=new URL('./fullrun-v310-no-recharge-v5.mjs',import.meta.url);
const v5StagePath=new URL('./.generated-fullrun-v310-no-recharge-v6-v5stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v6 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v6 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// Build the exact v5 legal runner without executing it. V6 changes only the autonomous
// player's purchasing policy: do not pre-buy dozens of unity-integration materials before
// knowing how many stochastic 三元归一 attempts are actually needed.
let v5=fs.readFileSync(v5Path,'utf8');
v5=replaceOnce(
 v5,
 "await import(finalRunnerPath.href+'?v5final='+Date.now());",
 "// v6 executes the final runner after just-in-time unity material budgeting.",
 'suppress v5 final auto-import'
);
fs.writeFileSync(v5StagePath,v5);
await import(v5StagePath.href+'?v6stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v6 did not obtain v5 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const start=runner.indexOf('function ensureUnitySeeds(n){');
const next='\nfunction ensureUnityEssence(n){';
const end=runner.indexOf(next,start);
if(start<0||end<0)throw new Error('V3.10 v6 cannot bound ensureUnitySeeds');
if(runner.indexOf('function ensureUnitySeeds(n){',start+1)>=0)throw new Error('V3.10 v6 ensureUnitySeeds ambiguous');

const jit=`function ensureUnitySeeds(n){let guard=0;while(materialCount('mat-v37-unity-seed')<n){if(++guard>80)fail('unity-seed-integration-deadlock',{target:n,current:materialCount('mat-v37-unity-seed'),attempts:guard-1,lawProficiency:state().player.v37LawProficiency,unity:state().player.v37Unity});ensureSwordEscapeSkill();ensureLaw(35);tryAuctionMaterial('mat-v37-law-crystal',1,120);ensureNamed('mat-v37-law-crystal',1);tryAuctionMaterial('mat-v37-soul-covenant-stone',1,240);ensureNamed('mat-v37-soul-covenant-stone',1);if(!goTo('归一圣墟'))fail('unity-seed-integration-location-unreachable',{target:n});const before=materialCount('mat-v37-unity-seed');const r=spendAction('integrate-unity-for-seed',()=>invoke('v37IntegrateUnity'));heal();if(!r?.ok)fail('unity-seed-integration-blocked',{target:n,result:r,attempt:guard});const after=materialCount('mat-v37-unity-seed');if(after>before)console.log('V310_FULLRUN_MATERIAL',JSON.stringify({source:'unity-integration-jit',id:'mat-v37-unity-seed',name:'合体道胎',count:after,target:n,attempt:guard,actions}))}}`;
runner=runner.slice(0,start)+jit+runner.slice(end);

// Machine-verifiable guardrails: V6 must reduce speculative stockpiling without adding any
// direct materials/state mutation or changing the game's RNG, prices, drop rates or gates.
if(!runner.includes("source:'unity-integration-jit'"))throw new Error('V3.10 v6 JIT unity evidence missing');
if(runner.includes('lawTarget=integrationBudget')||runner.includes('soulTarget=integrationBudget'))throw new Error('V3.10 v6 bulk unity pre-purchase survived');
if(!runner.includes("tryAuctionMaterial('mat-v37-law-crystal',1,120)"))throw new Error('V3.10 v6 per-attempt law purchase missing');
if(!runner.includes("tryAuctionMaterial('mat-v37-soul-covenant-stone',1,240)"))throw new Error('V3.10 v6 per-attempt soul-covenant purchase missing');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v37-unity-seed'")||runner.includes("v33AddMaterial('mat-v38-origin-gold'"))throw new Error('forbidden progression shortcut leaked into V3.10 v6 runner');
if(!runner.includes("['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold'].includes(id)&&tryAuctionMaterial(id,n,160)"))throw new Error('V3.10 v6 lost realm33 scarce auction recovery');
if(!runner.includes('function finishTribulation(attempt=0)'))throw new Error('V3.10 v6 lost recoverable tribulation retry');

fs.writeFileSync(finalRunnerPath,runner);
console.log('V310_FULLRUN_V6_FINAL_RUNNER_PASS '+JSON.stringify({unityMaterialsJustInTime:true,noSpeculativeBulkUnityStock:true,normalAuctionOnly:true,originGoldRecoveryPreserved:true,tribulationRetryPreserved:true,noDirectResourceInjection:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v6final='+Date.now());
