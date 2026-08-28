import fs from 'fs';
import {spawnSync} from 'child_process';

const v46Path=new URL('./fullrun-v310-no-recharge-v46.mjs',import.meta.url);
const v46StagePath=new URL('./.generated-fullrun-v310-no-recharge-v47-v46stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v47 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v47 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v47 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v47 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v47 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V46 fixed the one-attempt commute in ensureUnitySeeds(), but flame's completed artifact proved the
// ordinary ensureUnity() loop still retained the older per-attempt auction commute. At realm29 it died
// on ensureUnity -> tryAuctionMaterial -> goTo after reaching unity 31/35: every stochastic integration
// could still force 苍梧 auction <-> high-risk unity-region travel. V47 applies the same bounded mini-batch
// logistics principle to ordinary unity progression. At most eight normal law/covenant inputs are carried
// per expedition, and the player performs those ordinary v37IntegrateUnity actions in place before another
// market trip. MAX_FARM_ACTIONS remains the hard attempt guard. Game RNG, integration yield/cost, auction
// prices/stock/refresh, routes, enemy stats, flee chance, pills, progression costs and death rules are unchanged.
let v46=fs.readFileSync(v46Path,'utf8');
v46=replaceOnce(
 v46,
 "await import(finalRunnerPath.href+'?v46final='+Date.now());",
 "// v47 executes the final runner after ordinary-unity mini-batch logistics.",
 'suppress v46 final gameplay auto-import'
);
fs.writeFileSync(v46StagePath,v46);
const staged=spawnSync(process.execPath,['--check',v46StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v47 staged V46 syntax check failed: '+(staged.stderr||staged.stdout||'unknown syntax error'));
await import(v46StagePath.href+'?v47stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v47 did not obtain V46 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const batchedUnity=`function ensureUnity(n){
 ensureLaw(Math.min(35,Math.max(20,n)));ensureSwordEscapeSkill();
 let attempts=0;
 while((state().player.v37Unity||0)<n){
  if(attempts>=MAX_FARM_ACTIONS)fail('unity-deadlock',{target:n,current:state().player.v37Unity||0,attempts});
  const deficit=Math.max(1,n-(state().player.v37Unity||0));
  const batch=Math.min(8,MAX_FARM_ACTIONS-attempts,Math.max(3,Math.ceil(deficit/4)+2));
  tryAuctionMaterial('mat-v37-law-crystal',batch,120);ensureNamed('mat-v37-law-crystal',batch);
  tryAuctionMaterial('mat-v37-soul-covenant-stone',batch,160);ensureNamed('mat-v37-soul-covenant-stone',batch);
  ensureLightbodyStock(16);
  if(!goAny(['归一圣墟','万象法坛','天衡战城']))fail('unity-location-unreachable',{target:n,batch,current:state().player.v37Unity||0});
  let used=0;
  while((state().player.v37Unity||0)<n&&used<batch){
   used++;attempts++;
   const before=state().player.v37Unity||0;
   const r=spendAction('integrate-unity',()=>invoke('v37IntegrateUnity'));heal();
   if(!r?.ok||(state().player.v37Unity||0)<=before)fail('unity-action-blocked',{result:r,target:n,before,after:state().player.v37Unity||0,attempts,batch});
  }
  console.log('V310_FULLRUN_V47_UNITY_BATCH',JSON.stringify({target:n,current:state().player.v37Unity||0,batch,used,attempts,pills:lightbodyPillCount(),location:state().player.location,actions}));
 }
}`;
runner=replaceFunction(runner,'function ensureUnity(',batchedUnity,'replace ordinary per-attempt unity commute with bounded mini-batch progression');

if(!runner.includes('V310_FULLRUN_V47_UNITY_BATCH'))throw new Error('V3.10 v47 ordinary unity batch evidence missing');
if(!runner.includes("const batch=Math.min(8,MAX_FARM_ACTIONS-attempts,Math.max(3,Math.ceil(deficit/4)+2));"))throw new Error('V3.10 v47 ordinary unity batch sizing missing');
if(!runner.includes("tryAuctionMaterial('mat-v37-law-crystal',batch,120)"))throw new Error('V3.10 v47 batched law-crystal acquisition missing');
if(!runner.includes("tryAuctionMaterial('mat-v37-soul-covenant-stone',batch,160)"))throw new Error('V3.10 v47 batched covenant acquisition missing');
if(!runner.includes("spendAction('integrate-unity',()=>invoke('v37IntegrateUnity'))"))throw new Error('V3.10 v47 normal unity gameplay action missing');
if(!runner.includes('V310_FULLRUN_V46_UNITY_BATCH'))throw new Error('V3.10 v47 lost V46 seed minibatch logistics');
if(!runner.includes("if(tryRelicAuction(n,96))return;"))throw new Error('V3.10 v47 lost V46 relic auction patience');
if(!runner.includes('V310_FULLRUN_V45_ESCAPE_OPTIONS'))throw new Error('V3.10 v47 lost V45 effect-aware escape');
if(!runner.includes('V310_FULLRUN_V44_SECRET_ROTATED'))throw new Error('V3.10 v47 lost V44 secret rotation guard');
if(!runner.includes('V310_FULLRUN_V41_RISK_PROBE'))throw new Error('V3.10 v47 lost corrected route risk mapping');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-v37-law-crystal'")||runner.includes("v33AddMaterial('mat-v37-soul-covenant-stone'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v47 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v47 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V47_FINAL_RUNNER_PASS '+JSON.stringify({ordinaryUnityMiniBatchMax:8,unityAttemptGuard:'MAX_FARM_ACTIONS',normalV37IntegrationOnly:true,unitySeedMiniBatchPreserved:true,relicAuction96Preserved:true,normalMarketAndAuctionOnly:true,enemyStatsUnchanged:true,fleeChanceUnchanged:true,pillEffectsUnchanged:true,marketPricesAndStockCadenceUnchanged:true,progressionCostsUnchanged:true,rngUnchanged:true,deathRiskUnchanged:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v47final='+Date.now());
