import fs from 'fs';
import {spawnSync} from 'child_process';

const v21Path=new URL('./fullrun-v310-no-recharge-v21.mjs',import.meta.url);
const v21StagePath=new URL('./.generated-fullrun-v310-no-recharge-v22-v21stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v22 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v22 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V21 fixed the real insight-source bug and immediately exposed a separate autonomous-player issue:
// at 金丹初期, while travelling to obtain ordinary rare materials for the natal artifact, the runner
// died after repeatedly choosing flee even against trivial lower-realm incidental encounters. The game
// did not force this behavior: resolveCombat(false) treated *all* incidental combat as flee-only.
// A normal cultivator with a large realm advantage should kill a trivial ambusher rather than gamble
// on repeated escape rolls. V22 changes only runner decision-making: for non-target encounters it fights
// enemies at least three realm indices below the player, keeps fleeing near-peer/higher enemies, and
// preserves the existing realm33 天脉髓 serpent exception plus sword space-step escape policy.
let v21=fs.readFileSync(v21Path,'utf8');
v21=replaceOnce(
 v21,
 "await import(finalRunnerPath.href+'?v21final='+Date.now());",
 "// v22 executes the final runner after correcting incidental-combat risk selection.",
 'suppress v21 final auto-import'
);
fs.writeFileSync(v21StagePath,v21);
await import(v21StagePath.href+'?v22stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v22 did not obtain v21 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const decisionBefore="if(!preferWin||(enemyRealm>s.player.realmIndex&&!marrowSerpentChallenge)||hpRatio<.28){";
const decisionAfter="const cautiousIncidentalFloor=s.player.realmIndex>=3?s.player.realmIndex-3:-1;if((!preferWin&&enemyRealm>cautiousIncidentalFloor)||(preferWin&&enemyRealm>s.player.realmIndex&&!marrowSerpentChallenge)||hpRatio<.36){";
runner=replaceOnce(runner,decisionBefore,decisionAfter,'fight only clearly trivial incidental encounters');

if(!runner.includes("cautiousIncidentalFloor=s.player.realmIndex>=3?s.player.realmIndex-3:-1"))throw new Error('V3.10 v22 incidental safety margin missing');
if(!runner.includes("!preferWin&&enemyRealm>cautiousIncidentalFloor"))throw new Error('V3.10 v22 cautious incidental flee guard missing');
if(!runner.includes("preferWin&&enemyRealm>s.player.realmIndex&&!marrowSerpentChallenge"))throw new Error('V3.10 v22 targeted higher-realm flee guard lost');
if(!runner.includes("marrowSerpentChallenge=preferWin&&preparedRealm33Sword&&enemyRealm===34&&c.enemy?.kind==='祖脉异兽'"))throw new Error('V3.10 v22 realm34 marrow exception lost');
if(!runner.includes("combat-escape-shift"))throw new Error('V3.10 v22 sword space-step escape policy lost');
if(!runner.includes("source:'stocked-relic'"))throw new Error('V3.10 v22 lost v21 stocked-relic insight route');
if(!runner.includes("invoke('bindV32Artifact',itemId)"))throw new Error('V3.10 v22 lost v20 normal artifact binding API');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v38-heaven-vein-marrow'")||runner.includes("v33AddMaterial('mat-rare-material'"))throw new Error('forbidden progression/resource shortcut leaked into V3.10 v22 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v22 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V22_FINAL_RUNNER_PASS '+JSON.stringify({trivialIncidentalFightMargin:3,lowHpFleeThreshold:.36,nearPeerFleePreserved:true,higherRealmFleePreserved:true,realm34MarrowExceptionPreserved:true,swordSpaceEscapePreserved:true,stockedRelicInsightPreserved:true,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v22final='+Date.now());
