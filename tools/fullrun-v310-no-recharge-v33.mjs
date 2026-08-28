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

// V32 moved all three non-sword paths to Foundation Perfection, then each died during a failed flee.
// The inherited autonomous combat policy attempted flee on every round whenever preferWin=false, and
// also switched from fighting to repeated flee attempts below 28% HP. In the real combat rules a failed
// flee still grants the enemy a full counterattack, so repeated low-HP fleeing is self-destructive.
// V33 changes runner decision-making only: one optional flee attempt from an equal/lower encounter while
// healthy, at most two attempts against an overmatched enemy while still healthy, then normal combat.
// Flee chance, enemy stats, damage, death risk, healing, rewards, RNG and all game data remain unchanged.
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

const fleeBefore="if(!preferWin||enemyRealm>s.player.realmIndex||hpRatio<.28){spendAction('combat-flee',()=>invoke('combatAction','flee'));continue}";
const fleeAfter=`const overmatched=enemyRealm>s.player.realmIndex;
  const optionalFlee=!preferWin&&!overmatched&&hpRatio>=.58&&fleeAttempts<1;
  const overmatchFlee=overmatched&&hpRatio>=.38&&fleeAttempts<2;
  if(optionalFlee||overmatchFlee){
   fleeAttempts++;
   spendAction('combat-flee',()=>invoke('combatAction','flee'));
   continue;
  }
  if((!preferWin||overmatched)&&!policyLogged){
   policyLogged=true;
   console.log('V310_FULLRUN_V33_COMBAT_POLICY',JSON.stringify({preferWin,enemy:c.enemy?.name||null,enemyRealm,playerRealm:s.player.realmIndex,hpRatio:Number(hpRatio.toFixed(3)),fleeAttempts,decision:'fight-after-limited-flee',actions}));
  }`;
runner=replaceOnce(runner,fleeBefore,fleeAfter,'replace repeated panic-flee loop with bounded flee policy');

if(!runner.includes('let guard=0,fleeAttempts=0,policyLogged=false;'))throw new Error('V3.10 v33 flee attempt state missing');
if(!runner.includes('const optionalFlee=!preferWin&&!overmatched&&hpRatio>=.58&&fleeAttempts<1;'))throw new Error('V3.10 v33 optional flee bound missing');
if(!runner.includes('const overmatchFlee=overmatched&&hpRatio>=.38&&fleeAttempts<2;'))throw new Error('V3.10 v33 overmatch flee bound missing');
if(!runner.includes('V310_FULLRUN_V33_COMBAT_POLICY'))throw new Error('V3.10 v33 combat policy evidence missing');
if(runner.includes("hpRatio<.28){spendAction('combat-flee'"))throw new Error('V3.10 v33 retained low-HP panic flee');
if(!runner.includes("registry.realms?.[item.realmRequirement]?.index"))throw new Error('V3.10 v33 lost v32 natal unlock lookup');
if(!runner.includes("cultivateFull();prepareMajor(i);prepareMinorSideGate(i);"))throw new Error('V3.10 v33 lost v32 breakthrough ordering');
if(!runner.includes('function ensureBloodContractRare(n)'))throw new Error('V3.10 v33 lost v30 legal rare route');
if(!runner.includes('V310_FULLRUN_V30_SKIP_OPTIONAL_PREPATH_MANUAL'))throw new Error('V3.10 v33 lost v30 pre-path manual strategy');
if(!runner.includes('function ensureNonSwordDaoResources()'))throw new Error('V3.10 v33 lost v29 exact path preparation');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v33 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v33 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V33_FINAL_RUNNER_PASS '+JSON.stringify({boundedFleeAttempts:true,noLowHpPanicFlee:true,fleeChanceUnchanged:true,enemyStatsUnchanged:true,damageUnchanged:true,deathRiskUnchanged:true,healingUnchanged:true,rewardsUnchanged:true,rngUnchanged:true,v32UnlockAndOrderPreserved:true,v30RareStrategyPreserved:true,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v33final='+Date.now());
