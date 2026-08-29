import fs from 'fs';
import {spawnSync} from 'child_process';

const v61Path=new URL('./fullrun-v310-no-recharge-v61.mjs',import.meta.url);
const v61StagePath=new URL('./.generated-fullrun-v310-no-recharge-v62-v61stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v62 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v62 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V60 flame proved the mandatory realm33 natal-origin trip is reachable but can roll a realm35
// enemy at 天穹祖脉. The runner already owned/equipped its normal guard artifact, yet V38's
// one-preparation-per-flee policy always let shield/control spells consume the preparation turn first,
// so the guard artifact fallback was never reached. Six ordinary flee rolls then failed in sequence.
//
// V62 keeps the one-preparation rule and the exact flee probability. After TWO completed flee failures,
// the next eligible preparation turn prioritizes the already-equipped guard artifact once. The artifact
// is activated through the ordinary combatAction('artifact:<id>') API; its normal cooldown, shield value,
// enemy counterattack, RNG and action cost all remain in force. If unavailable, the inherited spell
// preparation path runs unchanged. No state mutation, forced flee, stat change, or resource grant exists.
let v61=fs.readFileSync(v61Path,'utf8');
v61=replaceOnce(
 v61,
 "await import(finalRunnerPath.href+'?v61final='+Date.now());",
 "// v62 executes after repeated-flee guard-artifact priority is attached to the generated runner.",
 'suppress v61 final gameplay auto-import'
);
fs.writeFileSync(v61StagePath,v61);
const staged=spawnSync(process.execPath,['--check',v61StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v62 staged V61 syntax failure: '+(staged.stderr||staged.stdout||''));
await import(v61StagePath.href+'?v62stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v62 did not obtain V61 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const before=`if(prepWanted){
    let prepAdvanced=false;`;
const after=`if(prepWanted){
    // Two genuine flee failures are enough evidence to spend the next single preparation turn on
    // the already-equipped guard artifact before trying another shield/control spell.
    if(fleeAttempts===2){
     const escapeGuardId=s.player.artifactLoadout?.guard||null,guardAction=escapeGuardId?'artifact:'+escapeGuardId:null;
     if(guardAction&&combatEnabled(guardAction)){
      const beforeGuard=combat(),beforeRound=beforeGuard?.round,beforeHp=beforeGuard?.playerHp,beforeShield=beforeGuard?.v31Shield||0;
      spendAction('combat-v62-escape-guard:'+escapeGuardId,()=>invoke('combatAction',guardAction));
      const afterGuard=combat(),advanced=!afterGuard||afterGuard.round!==beforeRound;
      console.log('V310_FULLRUN_V62_ESCAPE_GUARD',JSON.stringify({id:escapeGuardId,enemy:c.enemy?.name||null,enemyRealm,playerRealm:s.player.realmIndex,location:s.player.location,fleeAttempts,roundBefore:beforeRound,roundAfter:afterGuard?.round||null,hpBefore:beforeHp,hpAfter:afterGuard?.playerHp||null,shieldBefore:beforeShield,shieldAfter:afterGuard?.v31Shield||0,advanced,actions}));
      if(advanced){escapePreparedAt=fleeAttempts;continue;}
     }
    }
    let prepAdvanced=false;`;
runner=replaceOnce(runner,before,after,'prioritize equipped guard artifact after two real flee failures');

if(!runner.includes("if(fleeAttempts===2){"))throw new Error('V62 two-failure guard threshold missing');
if(!runner.includes("spendAction('combat-v62-escape-guard:'+escapeGuardId,()=>invoke('combatAction',guardAction))"))throw new Error('V62 ordinary guard combat API missing');
if(!runner.includes('V310_FULLRUN_V62_ESCAPE_GUARD'))throw new Error('V62 runtime escape-guard marker missing');
if(!runner.includes('if(advanced){escapePreparedAt=fleeAttempts;continue;}'))throw new Error('V62 one-preparation accounting missing');
if(!runner.includes("const prepWanted=(fleeAttempts===0||fleeAttempts%2===0||hpRatio<.58)&&escapePreparedAt!==fleeAttempts;"))throw new Error('V62 lost V38 single-preparation gate');
if(!runner.includes('V310_FULLRUN_V61_LIVE_TRIBULATION_ENTRY'))throw new Error('V62 lost V61 live tribulation gear entry');
if(!runner.includes('V310_FULLRUN_V57_GEAR_CALL'))throw new Error('V62 lost V57 high-realm gear live marker');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("invoke('v34ActivateBuildForTest'")||runner.includes("v33AddMaterial('mat-v39-thunder-crystal'")||runner.includes("v33AddMaterial('mat-v39-tribulation-gold'"))throw new Error('forbidden shortcut leaked into V62 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V62 final runner syntax failure: '+(syntax.stderr||syntax.stdout||''));
console.log('V310_FULLRUN_V62_FINAL_RUNNER_PASS '+JSON.stringify({guardPriorityAfterRealFleeFailures:2,ordinaryArtifactCombatActionOnly:true,onePreparationPerFleeAttemptPreserved:true,fleeChanceUnchanged:true,enemyStatsUnchanged:true,artifactStatsAndCooldownsUnchanged:true,gameBalanceUnchanged:true,seedUnchanged:true,actionCapUnchanged:true,noDirectResourceInjection:true,noDirectStateMutation:true,v61LiveTribulationGearPreserved:true}));
await import(finalRunnerPath.href+'?v62final='+Date.now());
