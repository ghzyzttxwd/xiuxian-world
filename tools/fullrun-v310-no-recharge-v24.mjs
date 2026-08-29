import fs from 'fs';
import {spawnSync} from 'child_process';

const v23Path=new URL('./fullrun-v310-no-recharge-v23.mjs',import.meta.url);
const v23StagePath=new URL('./.generated-fullrun-v310-no-recharge-v24-v23stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v24 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v24 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V23 proved the secret-realm route guard, then the run died for a different reason:
// ensureNatalArtifact speculatively forced relicFragments to 8 at realm 15. That stockpile is not a
// normal requirement for the sword natal sequence being performed here. The sword base artifact costs
// zero relic fragments; binding costs 1 insight + 8 stones; refinement layers 0->3 cost zero relics;
// and making the artifact natal costs 5 insight + 3 rare + 50 stones. Relics only begin being consumed
// by artifact refinement from layer 5 onward. The inherited ensureRelic(8) was therefore runner-only
// over-preparation that sent a 金丹初期 character to dangerous 古河/玄阴 farming for no immediate gate.
// V24 removes only that speculative stockpile. Any later system that genuinely requires relics still
// goes through ensureCost/ensureRelic normally; no game cost, source, enemy, chance or state is changed.
let v23=fs.readFileSync(v23Path,'utf8');
v23=replaceOnce(
 v23,
 "await import(finalRunnerPath.href+'?v23final='+Date.now());",
 "// v24 executes the final runner after removing the unnecessary realm15 relic stockpile.",
 'suppress v23 final auto-import'
);
fs.writeFileSync(v23StagePath,v23);
await import(v23StagePath.href+'?v24stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v24 did not obtain v23 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const prepBefore="ensureInsight(8);ensureStones(Math.max(350,state().player.spiritStones));ensureRare(Math.max(16,state().player.rareMaterials));ensureRelic(Math.max(8,state().player.relicFragments));";
const prepAfter="ensureInsight(8);ensureStones(Math.max(350,state().player.spiritStones));ensureRare(Math.max(16,state().player.rareMaterials));";
runner=replaceOnce(runner,prepBefore,prepAfter,'remove speculative realm15 relic stockpile');

if(runner.includes("ensureRelic(Math.max(8,state().player.relicFragments))"))throw new Error('V3.10 v24 speculative relic stockpile still present');
if(!runner.includes("ensureInsight(8);ensureStones(Math.max(350,state().player.spiritStones));ensureRare(Math.max(16,state().player.rareMaterials));"))throw new Error('V3.10 v24 required natal preparation lost');
if(!runner.includes("invoke('bindV32Artifact',plan.itemId)"))throw new Error('V3.10 v24 normal natal binding API lost');
if(!runner.includes("invoke('refineV32Artifact',plan.itemId)"))throw new Error('V3.10 v24 normal natal refinement API lost');
if(!runner.includes("invoke('makeNatalV32Artifact',plan.itemId)"))throw new Error('V3.10 v24 normal make-natal API lost');
if(!runner.includes("regionalIncidentalCeiling<=state().player.realmIndex-3"))throw new Error('V3.10 v24 lost v23 regional risk gate');
if(!runner.includes("source:'stocked-relic'"))throw new Error('V3.10 v24 lost stocked-relic insight use');
if(runner.includes("bindV32Artifact',plan.itemId,true")||runner.includes("makeNatalV32Artifact',plan.itemId,true")||runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-relic-fragment'"))throw new Error('forbidden natal/relic shortcut leaked into V3.10 v24 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v24 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V24_FINAL_RUNNER_PASS '+JSON.stringify({speculativeRealm15RelicStockpileRemoved:true,baseSwordArtifactRelicCost:0,bindRelicCost:0,refineToLayer3RelicCost:0,makeNatalRelicCost:0,genuineLaterRelicCostsPreserved:true,v23RegionalRiskGatePreserved:true,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v24final='+Date.now());
