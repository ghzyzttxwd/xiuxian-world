import fs from 'fs';

const v7Path=new URL('./fullrun-v310-no-recharge-v7.mjs',import.meta.url);
const v7StagePath=new URL('./.generated-fullrun-v310-no-recharge-v8-v7stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v8 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v8 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V7 already contains the legal realm33 origin-gold auction preference in ensureNamed(),
// but the shared tryAuctionMaterial() helper rejects ids absent from AUCTION_MATERIAL_IDS.
// Runs #74 / highchain #3 proved that mismatch by falling through to dangerous 界源海
// despite the candidate exposing a normal stock-1 realm33 auction lot. V8 fixes only that
// autonomous-runner whitelist. No candidate game source, price, stock, drop rate or gate changes.
let v7=fs.readFileSync(v7Path,'utf8');
v7=replaceOnce(
 v7,
 "await import(finalRunnerPath.href+'?v7final='+Date.now());",
 "// v8 executes the final runner after completing the legal auction whitelist.",
 'suppress v7 final auto-import'
);
fs.writeFileSync(v7StagePath,v7);
await import(v7StagePath.href+'?v8stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v8 did not obtain v7 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const before="const AUCTION_MATERIAL_IDS=new Set(['mat-v36-space-crystal','mat-v36-void-sand','mat-v36-void-essence','mat-v37-law-crystal','mat-v37-soul-covenant-stone','mat-v37-domain-sand','mat-v38-origin-crystal','mat-v38-natal-source-crystal']);";
const after="const AUCTION_MATERIAL_IDS=new Set(['mat-v36-space-crystal','mat-v36-void-sand','mat-v36-void-essence','mat-v37-law-crystal','mat-v37-soul-covenant-stone','mat-v37-domain-sand','mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold']);";
runner=replaceOnce(runner,before,after,'allow normal realm33 origin-gold auction recovery');

// Guard both halves of the route. This specifically prevents the earlier false-positive where
// ensureNamed attempted auction recovery but tryAuctionMaterial silently rejected origin gold.
if(!runner.includes("['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold'].includes(id)&&tryAuctionMaterial(id,n,160)"))throw new Error('V3.10 v8 lost origin-gold ensureNamed auction route');
if(!runner.includes("'mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold']);"))throw new Error('V3.10 v8 origin-gold auction whitelist missing');
if(!runner.includes("if(!AUCTION_MATERIAL_IDS.has(id)||state().player.realmIndex<25)return false"))throw new Error('V3.10 v8 cannot prove auction whitelist is enforcement point');
if(!runner.includes("source:'auction'"))throw new Error('V3.10 v8 auction evidence logging missing');
if(!runner.includes("if(!(state().player.activeSkillIds||[]).includes(id)){spendAction('equip-sword-escape-skill'"))throw new Error('V3.10 v8 lost v7 escape membership fix');
if(!runner.includes("source:'unity-integration-jit'"))throw new Error('V3.10 v8 lost v6 JIT unity policy');
if(!runner.includes('function finishTribulation(attempt=0)'))throw new Error('V3.10 v8 lost recoverable tribulation retry');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v38-origin-gold'"))throw new Error('forbidden progression shortcut leaked into V3.10 v8 runner');

fs.writeFileSync(finalRunnerPath,runner);
console.log('V310_FULLRUN_V8_FINAL_RUNNER_PASS '+JSON.stringify({originGoldAuctionWhitelist:true,originGoldEnsureNamedRoute:true,normalTradeOnly:true,escapeMembershipFixPreserved:true,jitUnityPreserved:true,tribulationRetryPreserved:true,noGameplayMutation:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v8final='+Date.now());
