import fs from 'fs';
import {spawnSync} from 'child_process';

const v32Path=new URL('./fullrun-v310-no-recharge-v32.mjs',import.meta.url);
const v32StagePath=new URL('./.generated-fullrun-v310-no-recharge-v33-v32stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v33 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v33 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V32 moved all three non-sword paths beyond the earlier resource/order blockers, then exposed a
// separate autonomous-combat defect: V22's risk policy plus V25's pre-law guard policy can still end
// in a fresh flee roll every round after each failed escape. In the real combat rules every failed
// flee grants the enemy a normal counterattack, so the runner can kill an otherwise viable character
// by repeatedly gambling on escape.
//
// V33 keeps V22/V23's risk classification, V25's pre-law guard action, the realm34 marrow exception
// and sword space-step escape, but bounds ordinary flee attempts per encounter. A near-peer incidental
// encounter gets at most one healthy flee roll; a genuinely overmatched encounter gets at most two.
// Once those attempts are used, or HP is already too low to keep gambling, execution falls through to
// the existing normal combat skills/artifacts/attack logic. Flee chance, enemies, damage, death risk,
// healing, rewards, RNG and all game data remain unchanged.
let v32=fs.readFileSync(v32Path,'utf8');
v32=replaceOnce(
 v32,
 "await import(finalRunnerPath.href+'?v32final='+Date.now());",
 "// v33 executes the final runner after rational non-suicidal flee scheduling.",
 'suppress v32 final auto-import'
);
fs.writeFileSync(v32StagePath,v32);
await import(v32StagePath.href+'?v33stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v33 did not obtain v32 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
runner=replaceOnce(
 runner,
 "function resolveCombat(preferWin=false){\n let guard=0;",
 "function resolveCombat(preferWin=false){\n let guard=0,fleeAttempts=0,policyLogged=false;",
 'track flee attempts per encounter'
);

// Patch the CURRENT V22 condition separately from the CURRENT V25 flee tail. This deliberately
// avoids replacing the whole branch so V25's normal guard-artifact action and the earlier sword
// space-step escape action remain byte-for-byte intact inside the branch.
const decisionBefore="const cautiousIncidentalFloor=s.player.realmIndex>=3?s.player.realmIndex-3:-1;if((!preferWin&&enemyRealm>cautiousIncidentalFloor)||(preferWin&&enemyRealm>s.player.realmIndex&&!marrowSerpentChallenge)||hpRatio<.36){";
const decisionAfter=`const cautiousIncidentalFloor=s.player.realmIndex>=3?s.player.realmIndex-3:-1;
  const unsafeIncidental=!preferWin&&enemyRealm>cautiousIncidentalFloor;
  const overmatchedTarget=preferWin&&enemyRealm>s.player.realmIndex&&!marrowSerpentChallenge;
  const structurallyOvermatched=enemyRealm>s.player.realmIndex&&!marrowSerpentChallenge;
  const optionalFlee=unsafeIncidental&&!structurallyOvermatched&&hpRatio>=.58&&fleeAttempts<1;
  const overmatchFlee=structurallyOvermatched&&hpRatio>=.38&&fleeAttempts<2;
  const boundedFleeDecision=optionalFlee||overmatchFlee;
  if(boundedFleeDecision){`;
runner=replaceOnce(runner,decisionBefore,decisionAfter,'bound the current v22 flee-entry condition');

const fleeTailBefore="spendAction('combat-flee',()=>invoke('combatAction','flee'));continue}";
const fleeTailAfter=`fleeAttempts++;
  spendAction('combat-flee',()=>invoke('combatAction','flee'));
  continue;
  }
  if((unsafeIncidental||overmatchedTarget||hpRatio<.36)&&!policyLogged){
   policyLogged=true;
   console.log('V310_FULLRUN_V33_COMBAT_POLICY',JSON.stringify({preferWin,enemy:c.enemy?.name||null,enemyRealm,playerRealm:s.player.realmIndex,hpRatio:Number(hpRatio.toFixed(3)),fleeAttempts,unsafeIncidental,overmatchedTarget,decision:'fight-after-bounded-flee',actions}));
  }`;
runner=replaceOnce(runner,fleeTailBefore,fleeTailAfter,'count final v25-compatible flee and fall through to combat');

if(!runner.includes('let guard=0,fleeAttempts=0,policyLogged=false;'))throw new Error('V3.10 v33 flee attempt state missing');
if(!runner.includes('const cautiousIncidentalFloor=s.player.realmIndex>=3?s.player.realmIndex-3:-1;'))throw new Error('V3.10 v33 lost v22 incidental safety margin');
if(!runner.includes('const optionalFlee=unsafeIncidental&&!structurallyOvermatched&&hpRatio>=.58&&fleeAttempts<1;'))throw new Error('V3.10 v33 optional flee bound missing');
if(!runner.includes('const overmatchFlee=structurallyOvermatched&&hpRatio>=.38&&fleeAttempts<2;'))throw new Error('V3.10 v33 overmatch flee bound missing');
if(!runner.includes('V310_FULLRUN_V33_COMBAT_POLICY'))throw new Error('V3.10 v33 combat policy evidence missing');
if(runner.includes("||hpRatio<.36){if(DAO_PATH==='sword'"))throw new Error('V3.10 v33 retained v22 repeated panic-flee entry');
if(!runner.includes("combat-escape-guard"))throw new Error('V3.10 v33 lost v25 guard-before-flee policy');
if(!runner.includes("invoke('combatAction','artifact:'+guardId)"))throw new Error('V3.10 v33 lost v25 normal guard combat API');
if(!runner.includes("marrowSerpentChallenge=preferWin&&preparedRealm33Sword&&enemyRealm===34&&c.enemy?.kind==='祖脉异兽'"))throw new Error('V3.10 v33 lost realm34 marrow exception');
if(!runner.includes("combat-escape-shift"))throw new Error('V3.10 v33 lost sword space-step escape policy');
if(!runner.includes("registry.realms?.[item.realmRequirement]?.index"))throw new Error('V3.10 v33 lost v32 natal unlock lookup');
if(!runner.includes("cultivateFull();prepareMajor(i);prepareMinorSideGate(i);"))throw new Error('V3.10 v33 lost v32 breakthrough ordering');
if(!runner.includes('function ensureBloodContractRare(n)'))throw new Error('V3.10 v33 lost v30 legal rare route');
if(!runner.includes('V310_FULLRUN_V30_SKIP_OPTIONAL_PREPATH_MANUAL'))throw new Error('V3.10 v33 lost v30 pre-path manual strategy');
if(!runner.includes('function ensureNonSwordDaoResources()'))throw new Error('V3.10 v33 lost v29 exact path preparation');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v33 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v33 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V33_FINAL_RUNNER_PASS '+JSON.stringify({boundedFleeAttempts:true,noRepeatedLowHpPanicFlee:true,v22RiskClassificationPreserved:true,v25GuardBeforeFleePreserved:true,realm34MarrowExceptionPreserved:true,swordSpaceEscapePreserved:true,fleeChanceUnchanged:true,enemyStatsUnchanged:true,damageUnchanged:true,deathRiskUnchanged:true,healingUnchanged:true,rewardsUnchanged:true,rngUnchanged:true,v32UnlockAndOrderPreserved:true,v30RareStrategyPreserved:true,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v33final='+Date.now());
