import fs from 'fs';
import {spawnSync} from 'child_process';

const v18Path=new URL('./fullrun-v310-no-recharge-v18.mjs',import.meta.url);
const v18StagePath=new URL('./.generated-fullrun-v310-no-recharge-v19-v18stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v19 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v19 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V18 highchain reached realm37 normally. Its first tribulation-prep attempt failed only because
// ensureNamed() legitimately travelled away from 九霄劫台 to obtain materials, while the runner
// invoked a terrace-only action without returning. V19 changes itinerary only: after each batch
// of normal material procurement, return to 九霄劫台 before both prep actions and formation build.
let v18=fs.readFileSync(v18Path,'utf8');
v18=replaceOnce(
 v18,
 "await import(finalRunnerPath.href+'?v18final='+Date.now());",
 "// v19 executes the final runner after fixing tribulation-stage return travel.",
 'suppress v18 final auto-import'
);
fs.writeFileSync(v18StagePath,v18);
await import(v18StagePath.href+'?v19stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v19 did not obtain v18 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const prepBefore="for(const k of prepKeys){let guard=0;while((state().player.v38TribulationPrep?.[k]||0)<60){if(++guard>20)fail('tribulation-prep-loop',{kind:k});for(const [id,n] of Object.entries(prepCosts[k]))ensureNamed(id,n);const r=spendAction(`tribulation-prep:${k}`,()=>invoke('v38PrepareTribulation',k));heal();if(!r?.ok)fail('tribulation-prep-blocked',{kind:k,result:r})}}";
const prepAfter="for(const k of prepKeys){let guard=0;while((state().player.v38TribulationPrep?.[k]||0)<60){if(++guard>20)fail('tribulation-prep-loop',{kind:k});for(const [id,n] of Object.entries(prepCosts[k]))ensureNamed(id,n);if(!goTo('九霄劫台'))fail('tribulation-prep-return-unreachable',{kind:k});const r=spendAction(`tribulation-prep:${k}`,()=>invoke('v38PrepareTribulation',k));heal();if(!r?.ok)fail('tribulation-prep-blocked',{kind:k,result:r,location:state().player.location})}}";
runner=replaceOnce(runner,prepBefore,prepAfter,'return to 九霄劫台 after normal prep-material procurement');

const formationBefore="const formation='formation-v39-five-elements';const f=registry.formations[formation];if(!f)fail('formation-registry-missing',{formation});for(const [id,n] of Object.entries(f.cost||{}))ensureNamed(id,n);const built=spendAction('build-tribulation-formation',()=>invoke('v39BuildTribulationFormation',formation));if(!built?.ok)fail('formation-build-blocked',{result:built});";
const formationAfter="const formation='formation-v39-five-elements';const f=registry.formations[formation];if(!f)fail('formation-registry-missing',{formation});for(const [id,n] of Object.entries(f.cost||{}))ensureNamed(id,n);if(!goTo('九霄劫台'))fail('tribulation-formation-return-unreachable',{formation});const built=spendAction('build-tribulation-formation',()=>invoke('v39BuildTribulationFormation',formation));if(!built?.ok)fail('formation-build-blocked',{result:built,location:state().player.location});";
runner=replaceOnce(runner,formationBefore,formationAfter,'return to 九霄劫台 after formation-material procurement');

if(!runner.includes("fail('tribulation-prep-return-unreachable',{kind:k})"))throw new Error('V3.10 v19 prep terrace-return guard missing');
if(!runner.includes("fail('tribulation-formation-return-unreachable',{formation})"))throw new Error('V3.10 v19 formation terrace-return guard missing');
if(!runner.includes("invoke('v38PrepareTribulation',k)"))throw new Error('V3.10 v19 normal tribulation-prep API lost');
if(!runner.includes("invoke('v39BuildTribulationFormation',formation)"))throw new Error('V3.10 v19 normal formation-build API lost');
if(!runner.includes("tryAuctionMaterial('mat-v36-void-essence',n,160)"))throw new Error('V3.10 v19 lost v17 void-essence patience');
if(!runner.includes("['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-world-essence-dew','mat-v38-heaven-vein-marrow'].includes(id)&&tryAuctionMaterial(id,n,160)"))throw new Error('V3.10 v19 lost V3.8 recovery routing');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v38-tribulation-stone'"))throw new Error('forbidden tribulation shortcut leaked into V3.10 v19 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v19 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V19_FINAL_RUNNER_PASS '+JSON.stringify({tribulationPrepReturnsToTerrace:true,tribulationFormationReturnsToTerrace:true,normalMaterialProcurementPreserved:true,normalPrepApiPreserved:true,normalFormationApiPreserved:true,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v19final='+Date.now());
