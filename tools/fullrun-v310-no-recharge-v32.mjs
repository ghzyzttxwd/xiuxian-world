import fs from 'fs';
import {spawnSync} from 'child_process';

const v31Path=new URL('./fullrun-v310-no-recharge-v31.mjs',import.meta.url);
const v31StagePath=new URL('./.generated-fullrun-v310-no-recharge-v32-v31stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v32 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v32 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V31 exposed two harness facts:
// - contentRegistrySnapshot().items exposes realmRequirement, not a numeric unlock field;
// - breakRealm() prepared major-gate resources before finishing the current realm's cultivation.
// V32 fixes only autonomous-player scheduling. It resolves the item's formal unlock through the realm
// registry and cultivates to the realm cap before deliberately farming breakthrough resources. No
// gameplay requirement, reward, RNG, cost, lifespan, map gate, drop rate or runtime state is changed.
let v31=fs.readFileSync(v31Path,'utf8');
v31=replaceOnce(
 v31,
 "await import(finalRunnerPath.href+'?v31final='+Date.now());",
 "// v32 executes the final runner after registry-aware unlock and human-order breakthrough scheduling.",
 'suppress v31 final auto-import'
);
fs.writeFileSync(v31StagePath,v31);
await import(v31StagePath.href+'?v32stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v32 did not obtain v31 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const unlockBefore="const unlock=Math.max(0,Number(item.unlock)||0);if(p.realmIndex<unlock){console.log('V310_FULLRUN_V31_DEFER_NATAL',JSON.stringify({daoPath:DAO_PATH,itemId:plan.itemId,realm:p.realmIndex,unlock,actions}));return}";
const unlockAfter="const unlock=Math.max(0,Number(registry.realms?.[item.realmRequirement]?.index)||0);if(p.realmIndex<unlock){console.log('V310_FULLRUN_V32_DEFER_NATAL',JSON.stringify({daoPath:DAO_PATH,itemId:plan.itemId,realm:p.realmIndex,realmRequirement:item.realmRequirement||null,unlock,actions}));return}";
runner=replaceOnce(runner,unlockBefore,unlockAfter,'resolve natal unlock via item.realmRequirement');

const breakBefore="function breakRealm(){const before=state().player.realmIndex;const i=before;prepareMajor(i);prepareMinorSideGate(i);cultivateFull();heal();let result;";
const breakAfter="function breakRealm(){const before=state().player.realmIndex;const i=before;cultivateFull();prepareMajor(i);prepareMinorSideGate(i);heal();let result;";
runner=replaceOnce(runner,breakBefore,breakAfter,'cultivate before deliberate breakthrough-resource preparation');

// Improve failure telemetry only; this makes future blockers machine-verifiable without changing play.
const insightFailBefore="fail('insight-farm-deadlock',{target:n,current:state().player.insight,location:state().player.location,relicFragments:state().player.relicFragments,secretRealm:state().world.secretRealm||null})";
const insightFailAfter="fail('insight-farm-deadlock',{target:n,current:state().player.insight,location:state().player.location,relicFragments:state().player.relicFragments,secretRealm:state().world.secretRealm||null,secretRealmCount:state().world.secretRealmCount||0,nextSecretRealmDay:state().world.nextSecretRealmDay||null,day:(state().time.year-1)*360+(state().time.month-1)*30+state().time.day,progress:state().player.progress,need:realmRow().need})";
runner=replaceOnce(runner,insightFailBefore,insightFailAfter,'add secret-realm scheduler evidence to insight deadlock');

if(!runner.includes("registry.realms?.[item.realmRequirement]?.index"))throw new Error('V3.10 v32 registry-aware natal unlock missing');
if(!runner.includes("function breakRealm(){const before=state().player.realmIndex;const i=before;cultivateFull();prepareMajor(i);prepareMinorSideGate(i);"))throw new Error('V3.10 v32 human-order breakthrough scheduling missing');
if(!runner.includes('secretRealmCount:state().world.secretRealmCount||0'))throw new Error('V3.10 v32 insight telemetry missing');
if(!runner.includes('function ensureBloodContractRare(n)'))throw new Error('V3.10 v32 lost v30 legal rare route');
if(!runner.includes('V310_FULLRUN_V30_SKIP_OPTIONAL_PREPATH_MANUAL'))throw new Error('V3.10 v32 lost v30 pre-path manual strategy');
if(!runner.includes('function ensureNonSwordDaoResources()'))throw new Error('V3.10 v32 lost v29 exact path preparation');
if(!runner.includes("source:'secret-realm'"))throw new Error('V3.10 v32 lost normal secret-realm insight strategy');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v32 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v32 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V32_FINAL_RUNNER_PASS '+JSON.stringify({natalUnlockFromRealmRegistry:true,cultivationBeforeMajorPreparation:true,breakthroughRequirementsUnchanged:true,secretRealmTelemetryOnly:true,v30RareStrategyPreserved:true,v30ManualStrategyPreserved:true,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v32final='+Date.now());
