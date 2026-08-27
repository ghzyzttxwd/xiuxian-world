import fs from 'fs';
import {spawnSync} from 'child_process';

const v22Path=new URL('./fullrun-v310-no-recharge-v22.mjs',import.meta.url);
const v22StagePath=new URL('./.generated-fullrun-v310-no-recharge-v23-v22stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v23 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v23 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V22 showed that secret-realm guardian threat alone is not enough to decide whether a realm is safe
// to visit. At 金丹初期 the active realm could be in 玄阴禁地 with a guardian the player could beat,
// while ordinary regional encounters still include near-peer and higher-realm enemies. Travelling there
// therefore forced the autonomous runner into repeated flee rolls and a preventable death.
//
// V23 keeps the game untouched and makes the autonomous player use information already exposed by the
// normal content registry. It only travels to an active secret realm when BOTH the guardian threat is
// within the player's realm and the strongest ordinary enemy registered for that region is at least
// three realm indices below the player. Unsafe temporary realms are allowed to close naturally while
// the sword cultivator continues ordinary sect work; stocked relic fragments remain the first choice.
let v22=fs.readFileSync(v22Path,'utf8');
v22=replaceOnce(
 v22,
 "await import(finalRunnerPath.href+'?v22final='+Date.now());",
 "// v23 executes the final runner after adding region-incidental risk gating to insight travel.",
 'suppress v22 final auto-import'
);
fs.writeFileSync(v22StagePath,v22);
await import(v22StagePath.href+'?v23stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v23 did not obtain v22 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const safetyBefore="const sr=state().world.secretRealm,safe=!!sr&&!sr.cleared&&(Number(sr.threat)||0)<=state().player.realmIndex;if(!safe){";
const safetyAfter="const sr=state().world.secretRealm;let regionalIncidentalCeiling=Infinity;if(sr){const reg=Object.values(registry.regions||{}).find(x=>x.name===sr.location);if(reg){const rows=Object.values(registry.enemies||{}).filter(e=>(e.areas||[]).includes(reg.id));regionalIncidentalCeiling=rows.length?Math.max(...rows.map(e=>Number(e.realmIndex)||0)):-1}}const safe=!!sr&&!sr.cleared&&(Number(sr.threat)||0)<=state().player.realmIndex&&regionalIncidentalCeiling<=state().player.realmIndex-3;if(sr&&!sr.cleared&&!safe&&regionalIncidentalCeiling>state().player.realmIndex-3)console.log('V310_FULLRUN_SECRET_SKIP_RISK',JSON.stringify({location:sr.location,guardianThreat:Number(sr.threat)||0,regionalIncidentalCeiling,playerRealm:state().player.realmIndex,actions}));if(!safe){";
runner=replaceOnce(runner,safetyBefore,safetyAfter,'gate secret-realm travel by regional incidental enemy ceiling');

if(!runner.includes("regionalIncidentalCeiling<=state().player.realmIndex-3"))throw new Error('V3.10 v23 regional incidental safety margin missing');
if(!runner.includes("Object.values(registry.enemies||{}).filter(e=>(e.areas||[]).includes(reg.id))"))throw new Error('V3.10 v23 enemy-registry risk lookup missing');
if(!runner.includes("V310_FULLRUN_SECRET_SKIP_RISK"))throw new Error('V3.10 v23 unsafe-secret diagnostic missing');
if(!runner.includes("source:'stocked-relic'"))throw new Error('V3.10 v23 lost stocked-relic insight priority');
if(!runner.includes("!preferWin&&enemyRealm>cautiousIncidentalFloor"))throw new Error('V3.10 v23 lost v22 incidental combat policy');
if(!runner.includes("marrowSerpentChallenge=preferWin&&preparedRealm33Sword&&enemyRealm===34&&c.enemy?.kind==='祖脉异兽'"))throw new Error('V3.10 v23 lost realm34 marrow exception');
if(!runner.includes("invoke('bindV32Artifact',itemId)"))throw new Error('V3.10 v23 lost normal artifact binding API');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v38-heaven-vein-marrow'")||runner.includes("v33AddMaterial('mat-relic-fragment'"))throw new Error('forbidden progression/resource shortcut leaked into V3.10 v23 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v23 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V23_FINAL_RUNNER_PASS '+JSON.stringify({regionalIncidentalRiskGate:true,incidentalSafetyMargin:3,guardianThreatGatePreserved:true,stockedRelicInsightFirst:true,v22CombatPolicyPreserved:true,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v23final='+Date.now());
