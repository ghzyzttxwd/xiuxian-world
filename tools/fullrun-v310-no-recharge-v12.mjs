import fs from 'fs';

const v11Path=new URL('./fullrun-v310-no-recharge-v11.mjs',import.meta.url);
const v11StagePath=new URL('./.generated-fullrun-v310-no-recharge-v12-v11stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v12 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v12 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V11 proved that MATERIAL_REGISTRY intentionally omits V33 combatKinds. Instead of copying
// hidden catalog semantics into the runner, V12 consumes the public stable drop registry that
// the game itself derives from rewardEntries(e) + v33MaterialDropEntries(e). Thus source routing
// asks the same factual question as the runtime: does an enemy in this stable region actually
// have a named-source drop entry for this material? No game state, drop rate or combat value changes.
let v11=fs.readFileSync(v11Path,'utf8');
v11=replaceOnce(
 v11,
 "await import(finalRunnerPath.href+'?v11final='+Date.now());",
 "// v12 executes the drop-table-corrected final runner below.",
 'suppress v11 final auto-import'
);
fs.writeFileSync(v11StagePath,v11);
await import(v11StagePath.href+'?v12stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v12 did not obtain v11 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const v11Routing="const rawSources=(m.locations||[]).filter(Boolean),combatKinds=(m.combatKinds||[]).filter(Boolean),enemyRows=Object.values(registry.enemies||{}),regionRows=Object.values(registry.regions||{});const regionIdForName=(loc)=>regionRows.find(r=>r&&r.name===loc)?.id||null;const sourceHasMatchingEnemy=(loc)=>{if(!combatKinds.length)return true;const regionId=regionIdForName(loc);return !!regionId&&enemyRows.some(e=>(e.areas||[]).includes(regionId)&&combatKinds.includes(e.kind))};const sources=combatKinds.length?[...rawSources].sort((a,b)=>Number(sourceHasMatchingEnemy(b))-Number(sourceHasMatchingEnemy(a))):rawSources;let chosen=null;for(const loc of sources){if(goTo(loc)){chosen=loc;break}}";
const v12Routing="const rawSources=(m.locations||[]).filter(Boolean),regionRows=Object.values(registry.regions||{}),enemyById=registry.enemies||{},dropRows=Object.values(registry.drops||{});const regionIdForName=(loc)=>regionRows.find(r=>r&&r.name===loc)?.id||null;const sourceHasNamedDrop=(loc)=>{const regionId=regionIdForName(loc);if(!regionId)return false;return dropRows.some(d=>(d.entries||[]).some(x=>x.materialId===id&&x.mode==='named-source')&&(enemyById[d.enemyId]?.areas||[]).includes(regionId))};const hasNamedDropSource=rawSources.some(sourceHasNamedDrop);const sources=hasNamedDropSource?[...rawSources].sort((a,b)=>Number(sourceHasNamedDrop(b))-Number(sourceHasNamedDrop(a))):rawSources;let chosen=null;for(const loc of sources){if(goTo(loc)){chosen=loc;break}}";
runner=replaceOnce(runner,v11Routing,v12Routing,'route named materials by actual stable drop tables');

const v11Check=`{
 const probe=registry.materials?.['mat-v37-domain-sand'];
 if(!probe)throw new Error('V3.10 v11 runtime route check missing 领域砂 registry row');
 const regionRows=Object.values(registry.regions||{}),enemyRows=Object.values(registry.enemies||{}),combatKinds=(probe.combatKinds||[]).filter(Boolean);
 const regionIdForName=(loc)=>regionRows.find(r=>r&&r.name===loc)?.id||null;
 const viable=(loc)=>{const regionId=regionIdForName(loc);return !!regionId&&enemyRows.some(e=>(e.areas||[]).includes(regionId)&&combatKinds.includes(e.kind))};
 const ordered=[...(probe.locations||[])].sort((a,b)=>Number(viable(b))-Number(viable(a)));
 if(ordered[0]!=='万象法坛'||viable('天衡战城')||!viable('万象法坛'))throw new Error('V3.10 v11 runtime source routing assertion failed: '+JSON.stringify({ordered,tianheng:viable('天衡战城'),wanxiang:viable('万象法坛')}));
 console.log('V310_FULLRUN_V11_RUNTIME_ROUTE_CHECK '+JSON.stringify({material:'mat-v37-domain-sand',ordered,tianhengViable:false,wanxiangViable:true,stableRegionIds:true}));
}`;
const v12Check=`{
 const regionRows=Object.values(registry.regions||{}),enemyById=registry.enemies||{},dropRows=Object.values(registry.drops||{});
 const regionIdForName=(loc)=>regionRows.find(r=>r&&r.name===loc)?.id||null;
 const namedDropAt=(materialId,loc)=>{const regionId=regionIdForName(loc);if(!regionId)return false;return dropRows.some(d=>(d.entries||[]).some(x=>x.materialId===materialId&&x.mode==='named-source')&&(enemyById[d.enemyId]?.areas||[]).includes(regionId))};
 const domain=registry.materials?.['mat-v37-domain-sand'];
 if(!domain)throw new Error('V3.10 v12 runtime route check missing 领域砂 registry row');
 const domainOrdered=[...(domain.locations||[])].sort((a,b)=>Number(namedDropAt('mat-v37-domain-sand',b))-Number(namedDropAt('mat-v37-domain-sand',a)));
 const tianheng=namedDropAt('mat-v37-domain-sand','天衡战城'),wanxiang=namedDropAt('mat-v37-domain-sand','万象法坛');
 if(domainOrdered[0]!=='万象法坛'||tianheng||!wanxiang)throw new Error('V3.10 v12 domain-sand drop routing assertion failed: '+JSON.stringify({domainOrdered,tianheng,wanxiang}));
 const marrow=registry.materials?.['mat-v38-heaven-vein-marrow'];
 if(!marrow||JSON.stringify(marrow.locations)!==JSON.stringify(['天穹祖脉'])||!namedDropAt('mat-v38-heaven-vein-marrow','天穹祖脉'))throw new Error('V3.10 v12 heaven-vein-marrow source assertion failed: '+JSON.stringify({locations:marrow?.locations,ancestralDrop:namedDropAt('mat-v38-heaven-vein-marrow','天穹祖脉')}));
 console.log('V310_FULLRUN_V12_RUNTIME_ROUTE_CHECK '+JSON.stringify({domainSand:{ordered:domainOrdered,tianhengViable:tianheng,wanxiangViable:wanxiang},heavenVeinMarrow:{locations:marrow.locations,ancestralDrop:true},stableDropTables:true}));
}`;
runner=replaceOnce(runner,v11Check,v12Check,'replace combatKinds assertion with real drop-table assertions');

if(!runner.includes("x.materialId===id&&x.mode==='named-source'"))throw new Error('V3.10 v12 missing actual named-source drop entry routing');
if(!runner.includes("enemyById[d.enemyId]?.areas||[]"))throw new Error('V3.10 v12 missing drop enemy stable-region check');
if(!runner.includes("domainOrdered[0]!=='万象法坛'"))throw new Error('V3.10 v12 missing runtime 领域砂 drop assertion');
if(!runner.includes("mat-v38-heaven-vein-marrow','天穹祖脉'"))throw new Error('V3.10 v12 missing runtime 天脉髓 unavoidable-source assertion');
if(!runner.includes("ensureArtifactLoadoutItem('item-v37-lawcleaver-sword','assault',3)"))throw new Error('V3.10 v12 lost v9 legal sword gearing');
if(!runner.includes("ensureArtifactLoadoutItem('item-v32-swordguard-wheel','guard',3)"))throw new Error('V3.10 v12 lost v9 legal guard gearing');
if(!runner.includes("'mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold']);"))throw new Error('V3.10 v12 lost v8 origin-gold auction whitelist');
if(!runner.includes('function finishTribulation(attempt=0)'))throw new Error('V3.10 v12 lost recoverable tribulation retry');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v37-domain-sand'"))throw new Error('forbidden shortcut leaked into V3.10 v12 runner');

fs.writeFileSync(finalRunnerPath,runner);
console.log('V310_FULLRUN_V12_FINAL_RUNNER_PASS '+JSON.stringify({actualDropTableMaterialRouting:true,runtimeDomainSandAssertion:true,runtimeHeavenVeinMarrowAssertion:true,legalRealm33SwordGearPreserved:true,originGoldAuctionWhitelistPreserved:true,noGameplayMutation:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v12final='+Date.now());
