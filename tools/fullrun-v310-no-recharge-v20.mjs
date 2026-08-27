import fs from 'fs';
import {spawnSync} from 'child_process';

const v19Path=new URL('./fullrun-v310-no-recharge-v19.mjs',import.meta.url);
const v19StagePath=new URL('./.generated-fullrun-v310-no-recharge-v20-v19stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v20 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v20 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V19 fresh-save reached realm33 normally and forged the same-stage sword artifact, then binding
// returned "cost" because binding has its own independent normal cost (1 insight + 8 spirit stones).
// The inherited gearing helper prepared forge costs but not this separate bind cost. V20 changes
// autonomous-player preparation only: obtain those resources through existing legal gameplay before
// calling the unchanged bindV32Artifact API. No artifact/game cost, chance or state is modified.
let v19=fs.readFileSync(v19Path,'utf8');
v19=replaceOnce(
 v19,
 "await import(finalRunnerPath.href+'?v19final='+Date.now());",
 "// v20 executes the final runner after preparing the normal independent artifact-bind cost.",
 'suppress v19 final auto-import'
);
fs.writeFileSync(v19StagePath,v19);
await import(v19StagePath.href+'?v20stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v20 did not obtain v19 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const bindBefore="let r=spendAction('bind-realm33-gear:'+itemId,()=>invoke('bindV32Artifact',itemId));";
const bindAfter="ensureInsight(1);ensureStones(8);let r=spendAction('bind-realm33-gear:'+itemId,()=>invoke('bindV32Artifact',itemId));";
runner=replaceOnce(runner,bindBefore,bindAfter,'prepare independent normal artifact binding cost');

if(!runner.includes("ensureInsight(1);ensureStones(8);let r=spendAction('bind-realm33-gear:'"))throw new Error('V3.10 v20 bind-cost preparation missing');
if(!runner.includes("invoke('bindV32Artifact',itemId)"))throw new Error('V3.10 v20 normal binding API lost');
if(!runner.includes("tryAuctionMaterial('mat-v36-void-essence',n,160)"))throw new Error('V3.10 v20 lost v17 void-essence patience');
if(!runner.includes("fail('tribulation-prep-return-unreachable',{kind:k})"))throw new Error('V3.10 v20 lost v19 tribulation terrace return');
if(!runner.includes("ensureOrigin(300);ensureAuthority(170);ensureNatalMarks(9);"))throw new Error('V3.10 v20 lost v19 nine-mark readiness');
if(runner.includes("bindV32Artifact',itemId,true")||runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v37-lawcleaver-sword'"))throw new Error('forbidden artifact-bind shortcut leaked into V3.10 v20 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v20 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V20_FINAL_RUNNER_PASS '+JSON.stringify({artifactBindInsightPrepared:1,artifactBindStonesPrepared:8,normalBindApiPreserved:true,v19TribulationFixesPreserved:true,voidEssenceAuctionMaxCycles:160,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v20final='+Date.now());
