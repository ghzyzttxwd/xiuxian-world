import fs from 'fs';
import {spawnSync} from 'child_process';

const v67Path=new URL('./fullrun-v310-no-recharge-v67.mjs',import.meta.url);
const v67StagePath=new URL('./.generated-fullrun-v310-no-recharge-v68-v67stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v68 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v68 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V67 correctly moved unity-seed production to a larger single expedition, but its prestock still
// inherited V50's auction timeouts. On the flame proof, 160 auction cycles bought 46/48 法纹晶 and
// 240 cycles bought only 31/44 元神契石; the following generic ensureNamed() then silently fell back
// to 法则古原, where a realm29 player died to a realm32 encounter before the expedition even began.
// V68 changes only that autonomous logistics choice: the dangerous-site expedition must complete its
// exact prestock through the already-authored normal auction source, with larger but finite wait caps.
// If the bounded market wait cannot complete, fail closed instead of falling back to a dangerous map.
// Prices, stock, auction rotation, material sources, RNG, enemies, route danger and action cap are unchanged.
let v67=fs.readFileSync(v67Path,'utf8');
v67=replaceOnce(
 v67,
 "await import(finalRunnerPath.href+'?v67final='+Date.now());",
 "// v68 executes after fail-closed safe unity prestock.",
 'suppress v67 final gameplay auto-import'
);
fs.writeFileSync(v67StagePath,v67);
const staged=spawnSync(process.execPath,['--check',v67StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v68 staged V67 syntax failure: '+(staged.stderr||staged.stdout||''));
await import(v67StagePath.href+'?v68stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v68 did not obtain V67 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
runner=replaceOnce(
 runner,
 "tryAuctionMaterial('mat-v37-law-crystal',lawTarget,160);ensureNamed('mat-v37-law-crystal',lawTarget);",
 "if(!tryAuctionMaterial('mat-v37-law-crystal',lawTarget,220))fail('v68-unity-law-prestock-auction-exhausted',{target:n,lawTarget,current:materialCount('mat-v37-law-crystal'),attemptsTotal,expeditions,actions});",
 'keep bulk law-crystal prestock on bounded auction path'
);
runner=replaceOnce(
 runner,
 "tryAuctionMaterial('mat-v37-soul-covenant-stone',covenantTarget,240);ensureNamed('mat-v37-soul-covenant-stone',covenantTarget);",
 "if(!tryAuctionMaterial('mat-v37-soul-covenant-stone',covenantTarget,420))fail('v68-unity-covenant-prestock-auction-exhausted',{target:n,covenantTarget,current:materialCount('mat-v37-soul-covenant-stone'),attemptsTotal,expeditions,actions});",
 'keep bulk soul-covenant prestock on bounded auction path'
);

if(!runner.includes("tryAuctionMaterial('mat-v37-law-crystal',lawTarget,220)"))throw new Error('V68 law-crystal safe prestock missing');
if(!runner.includes("tryAuctionMaterial('mat-v37-soul-covenant-stone',covenantTarget,420)"))throw new Error('V68 covenant safe prestock missing');
if(runner.includes("tryAuctionMaterial('mat-v37-law-crystal',lawTarget,160);ensureNamed('mat-v37-law-crystal',lawTarget);"))throw new Error('V68 old law fallback survived');
if(runner.includes("tryAuctionMaterial('mat-v37-soul-covenant-stone',covenantTarget,240);ensureNamed('mat-v37-soul-covenant-stone',covenantTarget);"))throw new Error('V68 old covenant fallback survived');
for(const marker of ['V310_FULLRUN_V67_UNITY_LOGISTICS','V310_FULLRUN_V66_MID_GUARD','V310_FULLRUN_V65_DWELLING','V310_FULLRUN_V64_PRODUCTIVE_SOURCE','V310_FULLRUN_V62_ESCAPE_GUARD','V310_FULLRUN_V61_LIVE_TRIBULATION_ENTRY','V310_FULLRUN_V57_GEAR_CALL'])if(!runner.includes(marker))throw new Error('V68 lost inherited marker '+marker);
if(runner.includes("else if(i===33){ensureV63MahayanaStabilizer();"))throw new Error('V68 must retain no-auto-pill active path');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("invoke('v34ActivateBuildForTest'")||runner.includes("v33AddMaterial('mat-v37-unity-seed'"))throw new Error('forbidden progression/resource shortcut leaked into V68 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V68 final runner syntax failure: '+(syntax.stderr||syntax.stdout||''));
console.log('V310_FULLRUN_V68_FINAL_RUNNER_PASS '+JSON.stringify({lawAuctionCycleCap:220,covenantAuctionCycleCap:420,failClosedBeforeDangerousFallback:true,v67FortyAttemptExpeditionPreserved:true,v66MidGuardPreserved:true,v65MaxDwellingPreserved:true,v64ProductiveDomainSandPreserved:true,v62EscapeGuardPreserved:true,v61LiveTribulationGearPreserved:true,automaticMahayanaPillChasing:false,gameDataUnchanged:true,auctionPricesStockRotationUnchanged:true,materialSourcesUnchanged:true,rngUnchanged:true,routeDangerUnchanged:true,fleeChanceUnchanged:true,enemyStatsUnchanged:true,seedUnchanged:true,actionCapUnchanged:true,noDirectResourceInjection:true,noDirectStateMutation:true}));
await import(finalRunnerPath.href+'?v68final='+Date.now());
