import fs from 'fs';

const v10Path=new URL('./fullrun-v310-no-recharge-v10.mjs',import.meta.url);
const v10StagePath=new URL('./.generated-fullrun-v310-no-recharge-v11-v10stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v11 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v11 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V10 compared human-readable location names with enemyRegistry().areas, but the stable enemy
// registry deliberately stores REGION IDs. That made every combat-kind viability probe false and
// preserved the original first-source ordering. V11 fixes only the autonomous runner: resolve a
// material source name through registry.regions first, then compare that stable region id with
// enemy.areas. Game maps, enemies, drops, danger, prices and resources remain untouched.
let v10=fs.readFileSync(v10Path,'utf8');
v10=replaceOnce(
 v10,
 "await import(finalRunnerPath.href+'?v10final='+Date.now());",
 "// v11 executes the corrected final runner below.",
 'suppress v10 final auto-import'
);
fs.writeFileSync(v10StagePath,v10);
await import(v10StagePath.href+'?v11stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v11 did not obtain v10 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const buggy="const rawSources=(m.locations||[]).filter(Boolean),combatKinds=(m.combatKinds||[]).filter(Boolean),enemyRows=Object.values(registry.enemies||{});const sourceHasMatchingEnemy=(loc)=>!combatKinds.length||enemyRows.some(e=>(e.areas||[]).includes(loc)&&combatKinds.includes(e.kind));const sources=combatKinds.length?[...rawSources].sort((a,b)=>Number(sourceHasMatchingEnemy(b))-Number(sourceHasMatchingEnemy(a))):rawSources;let chosen=null;for(const loc of sources){if(goTo(loc)){chosen=loc;break}}";
const fixed="const rawSources=(m.locations||[]).filter(Boolean),combatKinds=(m.combatKinds||[]).filter(Boolean),enemyRows=Object.values(registry.enemies||{}),regionRows=Object.values(registry.regions||{});const regionIdForName=(loc)=>regionRows.find(r=>r&&r.name===loc)?.id||null;const sourceHasMatchingEnemy=(loc)=>{if(!combatKinds.length)return true;const regionId=regionIdForName(loc);return !!regionId&&enemyRows.some(e=>(e.areas||[]).includes(regionId)&&combatKinds.includes(e.kind))};const sources=combatKinds.length?[...rawSources].sort((a,b)=>Number(sourceHasMatchingEnemy(b))-Number(sourceHasMatchingEnemy(a))):rawSources;let chosen=null;for(const loc of sources){if(goTo(loc)){chosen=loc;break}}";
runner=replaceOnce(runner,buggy,fixed,'compare enemy stable region ids instead of Chinese location names');

const registryAnchor="const registry=invoke('contentRegistrySnapshot');";
const runtimeCheck=`const registry=invoke('contentRegistrySnapshot');
{
 const probe=registry.materials?.['mat-v37-domain-sand'];
 if(!probe)throw new Error('V3.10 v11 runtime route check missing 领域砂 registry row');
 const regionRows=Object.values(registry.regions||{}),enemyRows=Object.values(registry.enemies||{}),combatKinds=(probe.combatKinds||[]).filter(Boolean);
 const regionIdForName=(loc)=>regionRows.find(r=>r&&r.name===loc)?.id||null;
 const viable=(loc)=>{const regionId=regionIdForName(loc);return !!regionId&&enemyRows.some(e=>(e.areas||[]).includes(regionId)&&combatKinds.includes(e.kind))};
 const ordered=[...(probe.locations||[])].sort((a,b)=>Number(viable(b))-Number(viable(a)));
 if(ordered[0]!=='万象法坛'||viable('天衡战城')||!viable('万象法坛'))throw new Error('V3.10 v11 runtime source routing assertion failed: '+JSON.stringify({ordered,tianheng:viable('天衡战城'),wanxiang:viable('万象法坛')}));
 console.log('V310_FULLRUN_V11_RUNTIME_ROUTE_CHECK '+JSON.stringify({material:'mat-v37-domain-sand',ordered,tianhengViable:false,wanxiangViable:true,stableRegionIds:true}));
}`;
runner=replaceOnce(runner,registryAnchor,runtimeCheck,'lock real runtime domain-sand route ordering');

if(!runner.includes("regionRows.find(r=>r&&r.name===loc)?.id||null"))throw new Error('V3.10 v11 missing location-name to stable-region-id resolution');
if(!runner.includes("(e.areas||[]).includes(regionId)&&combatKinds.includes(e.kind)"))throw new Error('V3.10 v11 missing stable-region enemy viability comparison');
if(!runner.includes("ordered[0]!=='万象法坛'"))throw new Error('V3.10 v11 missing real runtime 领域砂 route assertion');
if(!runner.includes("ensureArtifactLoadoutItem('item-v37-lawcleaver-sword','assault',3)"))throw new Error('V3.10 v11 lost v9 legal sword gearing');
if(!runner.includes("ensureArtifactLoadoutItem('item-v32-swordguard-wheel','guard',3)"))throw new Error('V3.10 v11 lost v9 legal guard gearing');
if(!runner.includes("'mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold']);"))throw new Error('V3.10 v11 lost v8 origin-gold auction whitelist');
if(!runner.includes('function finishTribulation(attempt=0)'))throw new Error('V3.10 v11 lost recoverable tribulation retry');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v37-domain-sand'"))throw new Error('forbidden shortcut leaked into V3.10 v11 runner');

fs.writeFileSync(finalRunnerPath,runner);
console.log('V310_FULLRUN_V11_FINAL_RUNNER_PASS '+JSON.stringify({stableRegionIdMaterialRouting:true,runtimeDomainSandAssertion:true,domainSandPrefersWanxiang:true,legalRealm33SwordGearPreserved:true,originGoldAuctionWhitelistPreserved:true,noGameplayMutation:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v11final='+Date.now());
