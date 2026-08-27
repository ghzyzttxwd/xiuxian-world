import fs from 'fs';

const v19Path=new URL('./fullrun-v310-no-recharge-v19.mjs',import.meta.url);
const v19StagePath=new URL('./.generated-diagnostic-v310-terminal-v19stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 terminal diagnostic transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 terminal diagnostic transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// NON-PROOF focused diagnostic. Highchain already demonstrated normal realm34 -> realm37
// progression. This wrapper skips only that proven cultivation prefix so terminal readiness,
// material acquisition, formation, thunder, heart-demon, transformation and ascension can be
// diagnosed quickly. No result from this file may count as fresh-save proof.
let v19=fs.readFileSync(v19Path,'utf8');
v19=replaceOnce(
 v19,
 "await import(finalRunnerPath.href+'?v19final='+Date.now());",
 "// terminal diagnostic executes a transformed copy below; never counts as proof.",
 'suppress v19 proof execution'
);
fs.writeFileSync(v19StagePath,v19);
await import(v19StagePath.href+'?terminalstage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 terminal diagnostic did not obtain v19 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
runner=replaceOnce(
 runner,
 "const out={status,seed:SEED,daoPath:DAO_PATH,actions,maxRealm,realmLog,legalCallCount:calls.length,forbiddenCalls:[],final:slimState(),...extra};",
 "const out={status,nonProofDiagnostic:true,diagnosticStart:'realm37-terminal-after-forced-mahayana-and-proven-highchain-prefix',seed:SEED,daoPath:DAO_PATH,actions,maxRealm,realmLog,legalCallCount:calls.length,forbiddenCalls:[],final:slimState(),...extra};",
 'mark every terminal diagnostic result non-proof'
);

const freshStart="invoke('newGame',`V310无充值-${DAO_PATH}-${SEED}`);\ncheckpoint('new-game');";
const terminalStart=`invoke('newGame',\`V310终局诊断-NONPROOF-\${DAO_PATH}-\${SEED}\`);
if(!api.v34ActivateBuildForTest('build-sword-burst'))throw new Error('terminal diagnostic sword build setup failed');
api.v35SetPlayerForTest({sect:'青云宗',sectRank:'真传弟子',contribution:500,standing:{qingyun:60,blood:-20}});
api.v37SetPlayerForTest({realmIndex:29,location:'归一圣墟',lawId:'law-severing',lawProficiency:180,unity:110,unityEssence:4,spaceInsight:60,insight:500,progressFull:true,stones:500000});
const diagnosticUnity=api.v37AttemptUnityBreakthrough('success');
if(!diagnosticUnity?.ok||diagnosticUnity.realmIndex!==30)throw new Error('terminal diagnostic unity lifespan setup failed: '+JSON.stringify(diagnosticUnity));
api.v38SetPlayerForTest({realmIndex:33,location:'界源海',originInsight:50,authority:20,lawProficiency:180,unity:110,mahayanaEssence:5,natalMarks:1,insight:500,progressFull:true,injury:0});
const diagnosticMahayana=api.v38AttemptMahayanaBreakthrough('success');
if(!diagnosticMahayana?.ok||diagnosticMahayana.realmIndex!==34||state().player.lifespan<25000)throw new Error('terminal diagnostic Mahayana lifespan setup failed: '+JSON.stringify({result:diagnosticMahayana,lifespan:state().player.lifespan}));
api.v37SetPlayerForTest({realmIndex:37,location:'九霄劫台',lawId:'law-severing',lawProficiency:230,unity:120,unityEssence:20,spaceInsight:80,insight:500,progressFull:true,stones:500000});
api.v38SetPlayerForTest({realmIndex:37,location:'九霄劫台',originInsight:300,authority:170,lawProficiency:230,unity:120,mahayanaEssence:0,natalMarks:7,insight:500,progressFull:true,injury:0});
console.log('V310_TERMINAL_NON_PROOF_START',JSON.stringify({realmIndex:state().player.realmIndex,lifespan:state().player.lifespan,age:ageYears(),location:state().player.location,daoPath:state().player.daoPath,origin:state().player.v38OriginInsight,authority:state().player.v38WorldAuthority,natalMarks:state().player.v38NatalOriginMarks,stones:state().player.spiritStones,note:'test helpers skipped the already-proven realm34->37 prefix; all terminal gameplay after this checkpoint is normal and NON-PROOF'}));
checkpoint('NON-PROOF-realm37-terminal-start');`;
runner=replaceOnce(runner,freshStart,terminalStart,'replace fresh start with explicit realm37 terminal diagnostic checkpoint');

runner=replaceOnce(
 runner,
 "const out=writeResult('PASS',{blockerHistory,proof:{freshSave:true,noRecharge:true,noDirectStateMutation:true,legalGameplayCallsOnly:true,ascensionComplete:true,realmIndex:final.player.realmIndex,lifeCycles:final.legacy?.cycles||0,totalDeaths:final.legacy?.totalDeaths||0}});\nconsole.log('V310_FULLRUN_PASS',JSON.stringify(out));",
 "const out=writeResult('NON_PROOF_TERMINAL_PASS',{blockerHistory,proof:{freshSave:false,diagnosticOnly:true,testHelpersUsedBeforeCheckpoint:true,forcedMahayanaAndRealm37BeforeCheckpoint:true,noRechargeAfterCheckpoint:true,normalTerminalGameplayAfterCheckpoint:true,ascensionComplete:true,realmIndex:final.player.realmIndex}});\nconsole.log('V310_TERMINAL_NON_PROOF_PASS',JSON.stringify(out));",
 'prevent terminal diagnostic success from masquerading as fresh-run proof'
);

if(!runner.includes("diagnosticStart:'realm37-terminal-after-forced-mahayana-and-proven-highchain-prefix'"))throw new Error('terminal NON-PROOF result label missing');
if(!runner.includes("ensureOrigin(300);ensureAuthority(170);ensureNatalMarks(9);"))throw new Error('terminal diagnostic lost v19 nine-mark readiness preparation');
if(!runner.includes("fail('tribulation-prep-return-unreachable',{kind:k})"))throw new Error('terminal diagnostic lost v19 prep terrace return');
if(!runner.includes("fail('tribulation-formation-return-unreachable',{formation})"))throw new Error('terminal diagnostic lost v19 formation terrace return');
if(!runner.includes('function finishTribulation(attempt=0)'))throw new Error('terminal diagnostic lost recoverable tribulation retry');
if(!runner.includes('diagnosticOnly:true'))throw new Error('terminal proof disclaimer missing');
if(runner.includes("writeResult('PASS',{blockerHistory,proof:{freshSave:true"))throw new Error('fresh proof marker survived terminal diagnostic');

fs.writeFileSync(finalRunnerPath,runner);
console.log('V310_TERMINAL_DIAGNOSTIC_RUNNER_READY '+JSON.stringify({nonProof:true,startRealm:37,v19Policy:true,natalStartMarks:7,normalNineMarkCompletionAfterCheckpoint:true,normalPrep:true,normalFormation:true,recoverableTribulation:true,normalTerminalGameplayAfterCheckpoint:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?terminal='+Date.now());
