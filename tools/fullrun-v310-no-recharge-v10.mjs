import fs from 'fs';

const v9Path=new URL('./fullrun-v310-no-recharge-v9.mjs',import.meta.url);
const v9StagePath=new URL('./.generated-fullrun-v310-no-recharge-v10-v9stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v10 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v10 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V9 exposed a generic source-selection flaw: ensureNamed() always chose the first reachable
// material location even when the material's combatKinds could never drop from any enemy there.
// Example: 领域砂 lists 天衡战城 / 万象法坛 but requires 法则异灵; 天衡战城 only has 边荒战敌,
// while 万象法坛 actually contains 法则异灵. V10 changes only runner routing and leaves all
// game source lists, enemies, drops, danger and economy untouched.
let v9=fs.readFileSync(v9Path,'utf8');
v9=replaceOnce(
 v9,
 "await import(finalRunnerPath.href+'?v9final='+Date.now());",
 "// v10 executes the final runner after adding combat-kind-aware source selection.",
 'suppress v9 final auto-import'
);
fs.writeFileSync(v9StagePath,v9);
await import(v9StagePath.href+'?v10stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v10 did not obtain v9 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const sourceLine="const sources=(m.locations||[]).filter(Boolean);let chosen=null;for(const loc of sources){if(goTo(loc)){chosen=loc;break}}";
const sourceAware="const rawSources=(m.locations||[]).filter(Boolean),combatKinds=(m.combatKinds||[]).filter(Boolean),enemyRows=Object.values(registry.enemies||{});const sourceHasMatchingEnemy=(loc)=>!combatKinds.length||enemyRows.some(e=>(e.areas||[]).includes(loc)&&combatKinds.includes(e.kind));const sources=combatKinds.length?[...rawSources].sort((a,b)=>Number(sourceHasMatchingEnemy(b))-Number(sourceHasMatchingEnemy(a))):rawSources;let chosen=null;for(const loc of sources){if(goTo(loc)){chosen=loc;break}}";
runner=replaceOnce(runner,sourceLine,sourceAware,'prefer material locations with compatible combat-kind enemies');

if(!runner.includes("enemyRows.some(e=>(e.areas||[]).includes(loc)&&combatKinds.includes(e.kind))"))throw new Error('V3.10 v10 missing combat-kind source viability test');
if(!runner.includes("sort((a,b)=>Number(sourceHasMatchingEnemy(b))-Number(sourceHasMatchingEnemy(a)))"))throw new Error('V3.10 v10 does not prioritize viable combat sources');
if(!runner.includes("ensureArtifactLoadoutItem('item-v37-lawcleaver-sword','assault',3)"))throw new Error('V3.10 v10 lost v9 legal sword gearing');
if(!runner.includes("ensureArtifactLoadoutItem('item-v32-swordguard-wheel','guard',3)"))throw new Error('V3.10 v10 lost v9 legal guard gearing');
if(!runner.includes("'mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold']);"))throw new Error('V3.10 v10 lost v8 origin-gold auction whitelist');
if(!runner.includes("source:'unity-integration-jit'"))throw new Error('V3.10 v10 lost v6 JIT unity policy');
if(!runner.includes('function finishTribulation(attempt=0)'))throw new Error('V3.10 v10 lost recoverable tribulation retry');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v37-domain-sand'"))throw new Error('forbidden shortcut leaked into V3.10 v10 runner');

fs.writeFileSync(finalRunnerPath,runner);
console.log('V310_FULLRUN_V10_FINAL_RUNNER_PASS '+JSON.stringify({combatKindAwareMaterialSources:true,domainSandPrefersWanxiang:true,legalRealm33SwordGearPreserved:true,originGoldAuctionWhitelistPreserved:true,noGameplayMutation:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v10final='+Date.now());
