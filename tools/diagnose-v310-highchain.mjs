import fs from 'fs';

const v13Path=new URL('./fullrun-v310-no-recharge-v13.mjs',import.meta.url);
const v13StagePath=new URL('./.generated-diagnostic-v310-v13stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 highchain diagnostic transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 highchain diagnostic transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// Build the exact current v13 autonomous runner without executing the fresh-save proof.
// NON-PROOF: test helpers are used only before the realm33 checkpoint. After it, the same
// normal v13 economy, drop-table routing, legal gearing and narrowly-scoped marrow-serpent
// combat policy is used.
let v13=fs.readFileSync(v13Path,'utf8');
v13=replaceOnce(
 v13,
 "await import(finalRunnerPath.href+'?v13final='+Date.now());",
 "// highchain diagnostic executes a transformed copy below; never counts as full-run proof.",
 'suppress v13 proof execution'
);
fs.writeFileSync(v13StagePath,v13);
await import(v13StagePath.href+'?diagstage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 highchain diagnostic did not obtain v13 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
runner=replaceOnce(
 runner,
 "const out={status,seed:SEED,daoPath:DAO_PATH,actions,maxRealm,realmLog,legalCallCount:calls.length,forbiddenCalls:[],final:slimState(),...extra};",
 "const out={status,nonProofDiagnostic:true,diagnosticStart:'realm33-after-forced-unity-lifespan-milestone',seed:SEED,daoPath:DAO_PATH,actions,maxRealm,realmLog,legalCallCount:calls.length,forbiddenCalls:[],final:slimState(),...extra};",
 'label every diagnostic result as non-proof'
);

const freshStart="invoke('newGame',`V310无充值-${DAO_PATH}-${SEED}`);\ncheckpoint('new-game');";
const diagnosticStart=`invoke('newGame',\`V310高链诊断-NONPROOF-\${DAO_PATH}-\${SEED}\`);
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
if(!runner.includes("marrowSerpentChallenge=preferWin&&preparedRealm33Sword&&enemyRealm===34&&c.enemy?.kind==='祖脉异兽'"))throw new Error('diagnostic lost v13 narrow marrow fight policy');
if(!runner.includes("enemyRealm>s.player.realmIndex&&!marrowSerpentChallenge"))throw new Error('diagnostic lost v13 higher-realm flee guard');
if(!runner.includes("x.materialId===id&&x.mode==='named-source'"))throw new Error('diagnostic lost v12 actual drop-table routing');
if(!runner.includes("domainOrdered[0]!=='万象法坛'"))throw new Error('diagnostic lost v12 runtime domain-sand assertion');
if(!runner.includes("mat-v38-heaven-vein-marrow','天穹祖脉'"))throw new Error('diagnostic lost v12 runtime heaven-vein-marrow assertion');
if(!runner.includes("ensureArtifactLoadoutItem('item-v37-lawcleaver-sword','assault',3)"))throw new Error('diagnostic lost v9 legal sword assault gearing');
if(!runner.includes("ensureArtifactLoadoutItem('item-v32-swordguard-wheel','guard',3)"))throw new Error('diagnostic lost v9 legal sword guard gearing');
if(!runner.includes('function finishTribulation(attempt=0)'))throw new Error('diagnostic lost recoverable tribulation retry');

fs.writeFileSync(finalRunnerPath,runner);
console.log('V310_HIGHCHAIN_DIAGNOSTIC_RUNNER_READY '+JSON.stringify({nonProof:true,startRealm:33,currentV13Policy:true,preparedRealm33SwordMayFightRealm34AncestralBeast:true,actualDropTableMaterialRouting:true,runtimeDomainSandAssertion:true,runtimeHeavenVeinMarrowAssertion:true,normalGameplayAfterCheckpoint:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?highchain='+Date.now());
