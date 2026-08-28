import fs from 'fs';
import {spawnSync} from 'child_process';

const v27Path=new URL('./fullrun-v310-no-recharge-v27.mjs',import.meta.url);
const v27StagePath=new URL('./.generated-fullrun-v310-no-recharge-v28-v27stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v28 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v28 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V27 preserved legal gameplay but regressed terminal efficiency: the fresh-save sword run again
// hit the unchanged 180000-action cap at realm37, after completing only body preparation. Evidence
// shows 2192 wins and the terminal action label was a combat skill, so the cap is dominated by the
// autonomous combat loop rather than a missing realm/resource gate.
//
// The inherited resolver probes lawdomain, worldedict, every loaded artifact and every equipped skill
// through combatAction even when the rendered game UI marks those buttons disabled (already used,
// cooldown, damaged, insufficient qi, etc.). spendAction counts each rejected probe as a player action.
// A real player cannot reasonably be expected to click disabled controls every round.
//
// V28 therefore changes runner strategy only: before spending an audited combat action, require the
// corresponding current [data-combat] button to exist and be enabled. It also stops using V27's
// worst-case eight-gain up-front stockpile, which empirically regressed body/soul/law progress, and
// restores the already-proven V26 one-call-at-a-time terminal preparation route. Game source, RNG,
// enemies, drops, market stock/prices, preparation costs/gains, time costs and action cap are unchanged.
let v27=fs.readFileSync(v27Path,'utf8');
v27=replaceOnce(
 v27,
 "await import(finalRunnerPath.href+'?v27final='+Date.now());",
 "// v28 executes the final runner after UI-aware combat action selection.",
 'suppress v27 final auto-import'
);
fs.writeFileSync(v27StagePath,v27);
await import(v27StagePath.href+'?v28stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v28 did not obtain v27 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const tryBefore="const tryCombat=(a)=>{if(!combat())return true;const before=combat().round;spendAction(`combat-${a}`,()=>invoke('combatAction',a));const now=combat();if(!now||now.round!==before)advanced=true;return !now};";
const tryAfter="const tryCombat=(a)=>{if(!combat())return true;const enabled=[...dom.window.document.querySelectorAll('[data-combat]')].find(b=>b.dataset.combat===a&&!b.disabled);if(!enabled)return false;const before=combat().round;spendAction(`combat-${a}`,()=>invoke('combatAction',a));const now=combat();if(!now||now.round!==before)advanced=true;return !now};";
runner=replaceOnce(runner,tryBefore,tryAfter,'skip disabled combat controls before audited action spend');

const terminalBefore='function finishTribulation(attempt=0){prepareTribulation();';
const terminalAfter='function finishTribulation(attempt=0){prepareTribulationV26();';
runner=replaceOnce(runner,terminalBefore,terminalAfter,'retire regressed v27 worst-case terminal overstock path');

if(!runner.includes("querySelectorAll('[data-combat]')"))throw new Error('V3.10 v28 UI combat availability gate missing');
if(!runner.includes("b.dataset.combat===a&&!b.disabled"))throw new Error('V3.10 v28 enabled combat-button requirement missing');
if(!runner.includes('function finishTribulation(attempt=0){prepareTribulationV26();'))throw new Error('V3.10 v28 did not restore v26 terminal preparation route');
if(!runner.includes('function v27PrepareTribulationKind(kind,cost)'))throw new Error('V3.10 v28 lost v27 diagnostic implementation');
if(!runner.includes("invoke('v38PrepareTribulation',k)"))throw new Error('V3.10 v28 normal V38 preparation API lost');
if(!runner.includes("invoke('v39BuildTribulationFormation',formation)"))throw new Error('V3.10 v28 normal V39 formation API lost');
if(!runner.includes("invoke('v39BeginTribulation')")||!runner.includes("invoke('v39AscendToTrueImmortal')"))throw new Error('V3.10 v28 terminal V39 chain lost');
if(!runner.includes("tryAuctionMaterial('mat-v36-void-essence',n,160)"))throw new Error('V3.10 v28 lost legal auction patience routing');
if(!runner.includes("['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-world-essence-dew','mat-v38-heaven-vein-marrow'].includes(id)&&tryAuctionMaterial(id,n,160)"))throw new Error('V3.10 v28 lost V3.8 scarce recovery routing');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v38-tribulation-stone'")||runner.includes("v33AddMaterial('mat-v38-soulstar-dew'")||runner.includes("v33AddMaterial('mat-v38-tribulation-array-core'"))throw new Error('forbidden terminal resource shortcut leaked into V3.10 v28 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v28 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V28_FINAL_RUNNER_PASS '+JSON.stringify({uiEnabledCombatActionsOnly:true,disabledCombatProbesSkipped:true,v26TerminalPreparationRestored:true,v27WorstCaseOverstockRetired:true,actionCapUnchanged:true,normalAuctionRoutingPreserved:true,normalV38PreparationApi:true,normalV39FormationAndAscensionApis:true,gameplaySourceUnchanged:true,materialCostsUnchanged:true,prepGainsUnchanged:true,dropRatesUnchanged:true,enemyTablesUnchanged:true,rngUnchanged:true,timeCostsUnchanged:true,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v28final='+Date.now());
