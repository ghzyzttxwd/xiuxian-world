import fs from 'fs';
import {spawnSync} from 'child_process';

const v16Path=new URL('./fullrun-v310-no-recharge-v16.mjs',import.meta.url);
const v16StagePath=new URL('./.generated-fullrun-v310-no-recharge-v17-v16stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v17 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v17 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V16 fresh-save bought four of five required 炼虚真髓 through the normal rotating auction,
// then the inherited 24-cycle runner horizon expired and it fell back into dangerous crafting.
// V17 changes runner patience only: wait up to 160 normal auction cycles for this stock-1 item.
// Game prices, stock, auction generation, recipes, map drops and combat are untouched.
let v16=fs.readFileSync(v16Path,'utf8');
v16=replaceOnce(
 v16,
 "await import(finalRunnerPath.href+'?v16final='+Date.now());",
 "// v17 executes the final runner after extending only the normal void-essence auction horizon.",
 'suppress v16 final auto-import'
);
fs.writeFileSync(v16StagePath,v16);
await import(v16StagePath.href+'?v17stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v17 did not obtain v16 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const oldVoid="function ensureVoidEssence(n){if(tryAuctionMaterial('mat-v36-void-essence',n,24))return;let guard=0;while(materialCount('mat-v36-void-essence')<n){";
const newVoid="function ensureVoidEssence(n){if(tryAuctionMaterial('mat-v36-void-essence',n,160))return;let guard=0;while(materialCount('mat-v36-void-essence')<n){";
runner=replaceOnce(runner,oldVoid,newVoid,'extend only direct 炼虚真髓 auction wait horizon');

if(!runner.includes("tryAuctionMaterial('mat-v36-void-essence',n,160)"))throw new Error('V3.10 v17 extended void-essence auction horizon missing');
if(runner.includes("tryAuctionMaterial('mat-v36-void-essence',n,24)"))throw new Error('V3.10 v17 obsolete 24-cycle void-essence horizon survived');
if(!runner.includes("'mat-v38-origin-gold','mat-v38-world-essence-dew','mat-v38-heaven-vein-marrow']);"))throw new Error('V3.10 v17 lost v16 V3.8 recovery whitelist');
if(!runner.includes("['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-world-essence-dew','mat-v38-heaven-vein-marrow'].includes(id)&&tryAuctionMaterial(id,n,160)"))throw new Error('V3.10 v17 lost v16 V3.8 recovery routing');
if(!runner.includes("source:'auction'"))throw new Error('V3.10 v17 auction evidence logging missing');
if(!runner.includes("x.materialId===id&&x.mode==='named-source'"))throw new Error('V3.10 v17 dangerous fallback routing lost');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v36-void-essence'"))throw new Error('forbidden void-essence shortcut leaked into V3.10 v17 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v17 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V17_FINAL_RUNNER_PASS '+JSON.stringify({voidEssenceAuctionMaxCycles:160,normalAuctionOnly:true,dangerousCraftFallbackPreserved:true,v16WorldDewAndMarrowRecoveryPreserved:true,generatedRunnerSyntaxChecked:true,noDirectResourceInjection:true,noGameplayMutation:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v17final='+Date.now());
