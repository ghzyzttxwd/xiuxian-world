import fs from 'fs';

const v12Path=new URL('./fullrun-v310-no-recharge-v12.mjs',import.meta.url);
const v12StagePath=new URL('./.generated-fullrun-v310-no-recharge-v13-v12stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v13 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v13 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V12 finally proved the unavoidable 天脉髓 route, but the autonomous combat policy still
// auto-fled every enemy one realm above the player before using the legal realm33 sword gear.
// V13 changes runner decision-making only: a prepared realm33 sword cultivator may deliberately
// fight exactly a realm34 祖脉异兽 while preferWin=true. All realm35/37 enemies, unrelated realm34
// enemies, travel ambushes and low-HP situations retain the existing flee policy.
let v12=fs.readFileSync(v12Path,'utf8');
v12=replaceOnce(
 v12,
 "await import(finalRunnerPath.href+'?v12final='+Date.now());",
 "// v13 executes the narrowly corrected combat-policy runner below.",
 'suppress v12 final auto-import'
);
fs.writeFileSync(v12StagePath,v12);
await import(v12StagePath.href+'?v13stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v13 did not obtain v12 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
runner=replaceOnce(runner,'let actions=0;','let actions=0;let realm34MarrowChallenges=0;','add diagnostic-only challenge counter');

const oldDecision="if(!preferWin||enemyRealm>s.player.realmIndex||hpRatio<.28){spendAction('combat-flee',()=>invoke('combatAction','flee'));continue}";
const newDecision="const loadout=s.player.artifactLoadout||{},preparedRealm33Sword=s.player.realmIndex===33&&s.player.daoPath==='sword'&&loadout.assault==='item-v37-lawcleaver-sword'&&loadout.guard==='item-v32-swordguard-wheel'&&loadout.natal==='item-v32-sevenstar-swordcase',marrowSerpentChallenge=preferWin&&preparedRealm33Sword&&enemyRealm===34&&c.enemy?.kind==='祖脉异兽';if(marrowSerpentChallenge){realm34MarrowChallenges++;if(realm34MarrowChallenges<=8)console.log('V310_FULLRUN_V13_MARROW_CHALLENGE',JSON.stringify({count:realm34MarrowChallenges,enemy:c.enemy?.name,enemyRealm,playerRealm:s.player.realmIndex,hpRatio:Number(hpRatio.toFixed(3)),location:s.player.location,loadout:{assault:loadout.assault,guard:loadout.guard,natal:loadout.natal},actions}))}if(!preferWin||(enemyRealm>s.player.realmIndex&&!marrowSerpentChallenge)||hpRatio<.28){spendAction('combat-flee',()=>invoke('combatAction','flee'));continue}";
runner=replaceOnce(runner,oldDecision,newDecision,'allow only prepared realm33 sword build to fight realm34 marrow serpent');

if(!runner.includes("marrowSerpentChallenge=preferWin&&preparedRealm33Sword&&enemyRealm===34&&c.enemy?.kind==='祖脉异兽'"))throw new Error('V3.10 v13 narrow marrow challenge policy missing');
if(!runner.includes("loadout.assault==='item-v37-lawcleaver-sword'&&loadout.guard==='item-v32-swordguard-wheel'&&loadout.natal==='item-v32-sevenstar-swordcase'"))throw new Error('V3.10 v13 legal realm33 gear prerequisite missing');
if(!runner.includes("enemyRealm>s.player.realmIndex&&!marrowSerpentChallenge"))throw new Error('V3.10 v13 higher-realm flee guard not preserved');
if(!runner.includes("x.materialId===id&&x.mode==='named-source'"))throw new Error('V3.10 v13 lost v12 actual drop-table routing');
if(!runner.includes("domainOrdered[0]!=='万象法坛'"))throw new Error('V3.10 v13 lost v12 domain-sand runtime assertion');
if(!runner.includes("mat-v38-heaven-vein-marrow','天穹祖脉'"))throw new Error('V3.10 v13 lost v12 marrow source assertion');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v38-heaven-vein-marrow'"))throw new Error('forbidden shortcut leaked into V3.10 v13 runner');

fs.writeFileSync(finalRunnerPath,runner);
console.log('V310_FULLRUN_V13_FINAL_RUNNER_PASS '+JSON.stringify({preparedRealm33SwordMayFightRealm34AncestralBeast:true,unrelatedHigherRealmFleePreserved:true,actualDropTableRoutingPreserved:true,noGameplayMutation:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v13final='+Date.now());
