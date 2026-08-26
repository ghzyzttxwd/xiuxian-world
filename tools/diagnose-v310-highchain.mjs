import fs from 'fs';

const v7Path=new URL('./fullrun-v310-no-recharge-v7.mjs',import.meta.url);
const v7StagePath=new URL('./.generated-diagnostic-v310-v7stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 highchain diagnostic transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 highchain diagnostic transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// Build the exact current v7 autonomous runner without executing the fresh-save proof.
// This file is explicitly NON-PROOF: it uses test helpers only to skip the already-proven
// mortal -> late-Unity prefix and expose realm33+ blockers faster. Every action after the
// checkpoint still goes through the same normal economy/gather/craft/breakthrough/tribulation
// policy as v7.
let v7=fs.readFileSync(v7Path,'utf8');
v7=replaceOnce(
 v7,
 "await import(finalRunnerPath.href+'?v7final='+Date.now());",
 "// highchain diagnostic executes a transformed copy below; never counts as full-run proof.",
 'suppress v7 proof execution'
);
fs.writeFileSync(v7StagePath,v7);
await import(v7StagePath.href+'?diagstage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 highchain diagnostic did not obtain v7 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
runner=replaceOnce(
 runner,
 "const out={status,seed:SEED,daoPath:DAO_PATH,actions,maxRealm,realmLog,legalCallCount:calls.length,forbiddenCalls:[],final:slimState(),...extra};",
 "const out={status,nonProofDiagnostic:true,diagnosticStart:'realm33-after-forced-unity-lifespan-milestone',seed:SEED,daoPath:DAO_PATH,actions,maxRealm,realmLog,legalCallCount:calls.length,forbiddenCalls:[],final:slimState(),...extra};",
 'label every diagnostic result as non-proof'
);

const freshStart="invoke('newGame',`V310无充值-${DAO_PATH}-${SEED}`);\ncheckpoint('new-game');";
const diagnosticStart=`invoke('newGame',\`V310高链诊断-NONPROOF-\${DAO_PATH}-\${SEED}\`);
// NON-PROOF SETUP ONLY. Build/path helper establishes a competent sword loadout. The sect
// helper records the Qingyun membership that a genuine sword full-run already earned in the
// skipped mortal prefix; otherwise the anti-shortcut guard correctly rejects a realm33 sword
// character that somehow never entered the sect. A forced realm29 -> 30 Unity breakthrough
// then applies the game's own lifespan milestone so the diagnostic is not poisoned by the
// fresh mortal lifespan of 82 years.
if(!api.v34ActivateBuildForTest('build-sword-burst'))throw new Error('diagnostic sword build setup failed');
api.v35SetPlayerForTest({sect:'青云宗',sectRank:'真传弟子',contribution:500,standing:{qingyun:60,blood:-20}});
api.v37SetPlayerForTest({realmIndex:29,location:'归一圣墟',lawId:'law-severing',lawProficiency:180,unity:110,unityEssence:4,spaceInsight:60,insight:100,progressFull:true,stones:10000});
const diagnosticUnity=api.v37AttemptUnityBreakthrough('success');
if(!diagnosticUnity?.ok||diagnosticUnity.realmIndex!==30)throw new Error('diagnostic lifespan milestone setup failed: '+JSON.stringify(diagnosticUnity));
api.v38SetPlayerForTest({realmIndex:33,location:'归一圣墟',originInsight:50,authority:20,lawProficiency:180,unity:110,insight:100,progressFull:true,injury:0});
console.log('V310_HIGHCHAIN_NON_PROOF_START',JSON.stringify({realmIndex:state().player.realmIndex,lifespan:state().player.lifespan,age:ageYears(),location:state().player.location,daoPath:state().player.daoPath,sect:state().player.sect,law:state().player.v37LawId,origin:state().player.v38OriginInsight,authority:state().player.v38WorldAuthority,note:'test helpers used before this checkpoint; result is diagnostic only'}));
checkpoint('NON-PROOF-realm33-start');`;
runner=replaceOnce(runner,freshStart,diagnosticStart,'replace fresh start with explicit non-proof realm33 diagnostic start');

runner=replaceOnce(
 runner,
 "const out=writeResult('PASS',{blockerHistory,proof:{freshSave:true,noRecharge:true,noDirectStateMutation:true,legalGameplayCallsOnly:true,ascensionComplete:true,realmIndex:final.player.realmIndex,lifeCycles:final.legacy?.cycles||0,totalDeaths:final.legacy?.totalDeaths||0}});\nconsole.log('V310_FULLRUN_PASS',JSON.stringify(out));",
 "const out=writeResult('NON_PROOF_DIAGNOSTIC_PASS',{blockerHistory,proof:{freshSave:false,diagnosticOnly:true,testHelpersUsedBeforeCheckpoint:true,noRechargeAfterCheckpoint:true,normalGameplayPolicyAfterCheckpoint:true,ascensionComplete:true,realmIndex:final.player.realmIndex}});\nconsole.log('V310_HIGHCHAIN_NON_PROOF_PASS',JSON.stringify(out));",
 'prevent diagnostic success from masquerading as V3.10 full-run proof'
);

if(!runner.includes("nonProofDiagnostic:true"))throw new Error('diagnostic result label missing');
if(!runner.includes("api.v35SetPlayerForTest({sect:'青云宗'"))throw new Error('diagnostic skipped-prefix sect fact missing');
if(!runner.includes("api.v37AttemptUnityBreakthrough('success')"))throw new Error('diagnostic lifespan setup missing');
if(!runner.includes("diagnosticOnly:true"))throw new Error('diagnostic proof disclaimer missing');
if(!runner.includes('function finishTribulation(attempt=0)'))throw new Error('diagnostic lost v5 tribulation recovery semantics');
if(!runner.includes("source:'unity-integration-jit'"))throw new Error('diagnostic lost v6 JIT unity policy');
if(!runner.includes("if(!(state().player.activeSkillIds||[]).includes(id)){spendAction('equip-sword-escape-skill'"))throw new Error('diagnostic lost v7 loadout membership fix');

fs.writeFileSync(finalRunnerPath,runner);
console.log('V310_HIGHCHAIN_DIAGNOSTIC_RUNNER_READY '+JSON.stringify({nonProof:true,startRealm:33,currentV7Policy:true,skippedPrefixSectFactRestored:true,escapeSkillMembershipFix:true,normalGameplayAfterCheckpoint:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?highchain='+Date.now());
