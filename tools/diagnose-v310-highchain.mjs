import fs from 'fs';

const v18Path=new URL('./fullrun-v310-no-recharge-v18.mjs',import.meta.url);
const v18StagePath=new URL('./.generated-diagnostic-v310-v18stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 highchain diagnostic transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 highchain diagnostic transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// Build the exact current v18 autonomous runner without executing the fresh-save proof.
// NON-PROOF: test helpers are used only before the realm34 checkpoint. The diagnostic now starts
// immediately after a forced Mahayana-success milestone because highchain #27 already proved the
// realm33 stock-1 marrow/dew route reaches a real Mahayana attempt; repeating that expensive prefix
// consumed the entire 30-minute diagnostic budget. After the checkpoint, all gameplay remains normal.
let v18=fs.readFileSync(v18Path,'utf8');
v18=replaceOnce(
 v18,
 "await import(finalRunnerPath.href+'?v18final='+Date.now());",
 "// highchain diagnostic executes a transformed copy below; never counts as full-run proof.",
 'suppress v18 proof execution'
);
fs.writeFileSync(v18StagePath,v18);
await import(v18StagePath.href+'?diagstage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 highchain diagnostic did not obtain v18 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
runner=replaceOnce(
 runner,
 "const out={status,seed:SEED,daoPath:DAO_PATH,actions,maxRealm,realmLog,legalCallCount:calls.length,forbiddenCalls:[],final:slimState(),...extra};",
 "const out={status,nonProofDiagnostic:true,diagnosticStart:'realm34-after-forced-mahayana-milestone',seed:SEED,daoPath:DAO_PATH,actions,maxRealm,realmLog,legalCallCount:calls.length,forbiddenCalls:[],final:slimState(),...extra};",
 'label every diagnostic result as non-proof'
);

const freshStart="invoke('newGame',`V310无充值-${DAO_PATH}-${SEED}`);\ncheckpoint('new-game');";
const diagnosticStart=`invoke('newGame',\`V310高链诊断-NONPROOF-\${DAO_PATH}-\${SEED}\`);
if(!api.v34ActivateBuildForTest('build-sword-burst'))throw new Error('diagnostic sword build setup failed');
api.v35SetPlayerForTest({sect:'青云宗',sectRank:'真传弟子',contribution:500,standing:{qingyun:60,blood:-20}});
api.v37SetPlayerForTest({realmIndex:29,location:'归一圣墟',lawId:'law-severing',lawProficiency:180,unity:110,unityEssence:4,spaceInsight:60,insight:500,progressFull:true,stones:500000});
const diagnosticUnity=api.v37AttemptUnityBreakthrough('success');
if(!diagnosticUnity?.ok||diagnosticUnity.realmIndex!==30)throw new Error('diagnostic unity lifespan milestone setup failed: '+JSON.stringify(diagnosticUnity));
api.v38SetPlayerForTest({realmIndex:33,location:'界源海',originInsight:50,authority:20,lawProficiency:180,unity:110,mahayanaEssence:5,natalMarks:1,insight:500,progressFull:true,injury:0});
const diagnosticMahayana=api.v38AttemptMahayanaBreakthrough('success');
if(!diagnosticMahayana?.ok||diagnosticMahayana.realmIndex!==34||state().player.lifespan<25000)throw new Error('diagnostic Mahayana lifespan milestone setup failed: '+JSON.stringify({result:diagnosticMahayana,lifespan:state().player.lifespan}));
api.v37SetPlayerForTest({realmIndex:34,location:'界源海',lawId:'law-severing',lawProficiency:220,unity:120,unityEssence:20,spaceInsight:80,insight:500,stones:500000});
api.v38SetPlayerForTest({realmIndex:34,location:'界源海',originInsight:90,authority:60,lawProficiency:220,unity:120,mahayanaEssence:0,natalMarks:2,insight:500,injury:0});
console.log('V310_HIGHCHAIN_NON_PROOF_START',JSON.stringify({realmIndex:state().player.realmIndex,lifespan:state().player.lifespan,age:ageYears(),location:state().player.location,daoPath:state().player.daoPath,sect:state().player.sect,law:state().player.v37LawId,origin:state().player.v38OriginInsight,authority:state().player.v38WorldAuthority,natalMarks:state().player.v38NatalOriginMarks,diagnosticUnityEssence:materialCount('mat-v37-unity-essence'),stones:state().player.spiritStones,note:'forced Unity and Mahayana success plus diagnostic buffers were applied before this checkpoint; result is NON-PROOF only'}));
checkpoint('NON-PROOF-realm34-start');`;
runner=replaceOnce(runner,freshStart,diagnosticStart,'replace fresh start with explicit non-proof realm34 post-Mahayana diagnostic start');

runner=replaceOnce(
 runner,
 "const out=writeResult('PASS',{blockerHistory,proof:{freshSave:true,noRecharge:true,noDirectStateMutation:true,legalGameplayCallsOnly:true,ascensionComplete:true,realmIndex:final.player.realmIndex,lifeCycles:final.legacy?.cycles||0,totalDeaths:final.legacy?.totalDeaths||0}});\nconsole.log('V310_FULLRUN_PASS',JSON.stringify(out));",
 "const out=writeResult('NON_PROOF_DIAGNOSTIC_PASS',{blockerHistory,proof:{freshSave:false,diagnosticOnly:true,testHelpersUsedBeforeCheckpoint:true,forcedMahayanaBeforeCheckpoint:true,noRechargeAfterCheckpoint:true,normalGameplayPolicyAfterCheckpoint:true,ascensionComplete:true,realmIndex:final.player.realmIndex}});\nconsole.log('V310_HIGHCHAIN_NON_PROOF_PASS',JSON.stringify(out));",
 'prevent diagnostic success from masquerading as V3.10 full-run proof'
);

if(!runner.includes("nonProofDiagnostic:true"))throw new Error('diagnostic result label missing');
if(!runner.includes("api.v35SetPlayerForTest({sect:'青云宗'"))throw new Error('diagnostic skipped-prefix sect fact missing');
if(!runner.includes("api.v37AttemptUnityBreakthrough('success')"))throw new Error('diagnostic unity lifespan setup missing');
if(!runner.includes("api.v38AttemptMahayanaBreakthrough('success')"))throw new Error('diagnostic Mahayana lifespan setup missing');
if(!runner.includes("diagnosticStart:'realm34-after-forced-mahayana-milestone'"))throw new Error('diagnostic realm34 start label missing');
if(!runner.includes("forcedMahayanaBeforeCheckpoint:true"))throw new Error('diagnostic proof disclaimer missing forced-Mahayana marker');
if(!runner.includes("diagnosticOnly:true"))throw new Error('diagnostic proof disclaimer missing');
if(!runner.includes("tryAuctionMaterial('mat-v36-void-essence',n,160)"))throw new Error('diagnostic lost v17 void-essence auction horizon');
if(!runner.includes("['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-world-essence-dew','mat-v38-heaven-vein-marrow'].includes(id)&&tryAuctionMaterial(id,n,160)"))throw new Error('diagnostic lost V3.8 recovery auction preference');
if(!runner.includes("'mat-v38-origin-gold','mat-v38-world-essence-dew','mat-v38-heaven-vein-marrow']);"))throw new Error('diagnostic lost V3.8 recovery auction whitelist');
if(!runner.includes("ensureArtifactLoadoutItem('item-v37-lawcleaver-sword','assault',3)"))throw new Error('diagnostic lost v18 normal assault');
if(!runner.includes("ensureArtifactLoadoutItem('item-v32-swordguard-wheel','guard',3)"))throw new Error('diagnostic lost v18 normal guard');
if(!runner.includes("ensureArtifactLoadoutItem('item-v37-sword-domain-banner','support',3)"))throw new Error('diagnostic lost v18 normal support');
if(runner.includes("ensureArtifactMaxPreparation('item-v32-sevenstar-swordcase',9,100)"))throw new Error('diagnostic retained retired max-artifact preparation');
if(!runner.includes("x.materialId===id&&x.mode==='named-source'"))throw new Error('diagnostic lost actual drop-table fallback routing');
if(!runner.includes("domainOrdered[0]!=='万象法坛'"))throw new Error('diagnostic lost runtime domain-sand assertion');
if(!runner.includes("mat-v38-heaven-vein-marrow','天穹祖脉'"))throw new Error('diagnostic lost runtime heaven-vein-marrow map assertion');
if(!runner.includes('function finishTribulation(attempt=0)'))throw new Error('diagnostic lost recoverable tribulation retry');

fs.writeFileSync(finalRunnerPath,runner);
console.log('V310_HIGHCHAIN_DIAGNOSTIC_RUNNER_READY '+JSON.stringify({nonProof:true,startRealm:34,currentV18Policy:true,forcedUnityAndMahayanaBeforeCheckpoint:true,realisticMahayanaLifespanFloor:true,diagnosticStones:500000,diagnosticUnityEssence:20,voidEssenceAuctionMaxCycles:160,realm33SwordGearRefinement:3,worldEssenceDewAuctionRouteStaticallyPreserved:true,heavenVeinMarrowAuctionRouteStaticallyPreserved:true,actualDropTableMaterialRouting:true,runtimeDomainSandAssertion:true,runtimeHeavenVeinMarrowAssertion:true,normalGameplayAfterCheckpoint:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?highchain='+Date.now());
