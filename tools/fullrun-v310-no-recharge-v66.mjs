import fs from 'fs';
import {spawnSync} from 'child_process';

const v65Path=new URL('./fullrun-v310-no-recharge-v65.mjs',import.meta.url);
const v65StagePath=new URL('./.generated-fullrun-v310-no-recharge-v66-v65stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);
const gamePath=new URL('../src/game-v310.js',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v66 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v66 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V64/V65 evidence separated two independent runner-policy defects from gameplay balance:
// 1) automatically chasing 大乘证道丹 after every failed Mahayana attempt can be much more expensive
//    than simply rebuilding the authored five-essence requirement (body hit 300k after nine legal brews),
//    so V66 removes that autonomous policy while keeping build-v6's real pill-effect bug fix available;
// 2) V65 flame entered realm29 法则古原 with guardArtifact:null even though every dao path already has
//    an authored, low/mid-tier guard artifact available many realms earlier. V66 equips that ordinary guard
//    before the first law-region work. Realm33 still upgrades/replaces it through V56's existing path gear.
// No game data, RNG, flee chance, enemy stat, cultivation formula, breakthrough chance or action cap changes.
let v65=fs.readFileSync(v65Path,'utf8');
v65=replaceOnce(
 v65,
 "await import(finalRunnerPath.href+'?v65final='+Date.now());",
 "// v66 executes after removing automatic Mahayana-pill chasing and attaching legal midgame guards.",
 'suppress v65 final gameplay auto-import'
);
fs.writeFileSync(v65StagePath,v65);
const staged=spawnSync(process.execPath,['--check',v65StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v66 staged V65 syntax failure: '+(staged.stderr||staged.stdout||''));
await import(v65StagePath.href+'?v66stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v66 did not obtain V65 final runner');

const game=fs.readFileSync(gamePath,'utf8');
for(const authored of [
 '"itemId":"item-v32-swordguard-wheel"',
 '"itemId":"item-v32-firecloud-aegis"',
 '"itemId":"item-v32-goldenbody-drum"',
 '"itemId":"item-v32-nether-armor"'
])if(!game.includes(authored))throw new Error('V66 authored midgame guard missing: '+authored);
if(!game.includes('"itemId":"item-v32-firecloud-aegis"')||!game.includes('"artifactSlot":"guard"')||!game.includes('"shieldPct":0.24'))throw new Error('V66 flame guard authored contract drifted');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
runner=replaceOnce(
 runner,
 "else if(i===33){ensureV63MahayanaStabilizer();result=spendAction('breakthrough-mahayana',()=>invoke('v38AttemptMahayanaBreakthrough'));}",
 "else if(i===33)result=spendAction('breakthrough-mahayana',()=>invoke('v38AttemptMahayanaBreakthrough'));",
 'disable expensive automatic post-failure Mahayana pill chasing'
);

const guardHelpers=`const V66_MID_GUARD_PLANS=Object.freeze({
 sword:'item-v32-swordguard-wheel',
 flame:'item-v32-firecloud-aegis',
 body:'item-v32-goldenbody-drum',
 spirit:'item-v32-nether-armor'
});
function ensureV66MidGuard(){
 if(state().player.realmIndex<29)return;
 const itemId=V66_MID_GUARD_PLANS[DAO_PATH];if(!itemId)fail('v66-midguard-plan-missing',{path:DAO_PATH});
 ensureArtifactLoadoutItem(itemId,'guard',3);
 const p=state().player,rec=p.equipmentInventory?.[itemId],loadout=p.artifactLoadout||{};
 if(loadout.guard!==itemId||!rec?.bound||rec?.damaged||(rec?.refinement||0)<3)fail('v66-midguard-not-ready',{path:DAO_PATH,itemId,guard:loadout.guard,record:rec||null});
 console.log('V310_FULLRUN_V66_MID_GUARD',JSON.stringify({path:DAO_PATH,realm:p.realmIndex,itemId,guard:loadout.guard,refinement:rec.refinement||0,warmth:rec.warmth||0,actions}));
}`;
const lawAnchor="const lawByPath={sword:'law-severing',flame:'law-annihilation',body:'law-immovable',spirit:'law-soulorder'};";
runner=replaceOnce(runner,lawAnchor,guardHelpers+'\n'+lawAnchor,'insert legal midgame guard helper before law phase');
runner=replaceOnce(
 runner,
 "function ensureLawChosen(){if(state().player.v37LawId)return;if(state().player.realmIndex<29)return;ensureInsight(state().player.insight+10);",
 "function ensureLawChosen(){if(state().player.v37LawId)return;if(state().player.realmIndex<29)return;ensureV66MidGuard();ensureInsight(state().player.insight+10);",
 'equip guard at live first-law entry before dangerous law-region farming'
);

if(runner.includes("else if(i===33){ensureV63MahayanaStabilizer();"))throw new Error('V66 automatic Mahayana pill policy still active');
if(!runner.includes("else if(i===33)result=spendAction('breakthrough-mahayana',()=>invoke('v38AttemptMahayanaBreakthrough'));"))throw new Error('V66 ordinary Mahayana breakthrough path missing');
if(!runner.includes('const V66_MID_GUARD_PLANS=Object.freeze({')||!runner.includes('V310_FULLRUN_V66_MID_GUARD'))throw new Error('V66 midgame guard strategy missing');
if(!runner.includes("ensureArtifactLoadoutItem(itemId,'guard',3)"))throw new Error('V66 must reuse ordinary forge/bind/equip/refine helper');
if(!runner.includes('ensureV66MidGuard();ensureInsight(state().player.insight+10);'))throw new Error('V66 guard call not attached to live law-choice entry');
for(const id of ['item-v32-swordguard-wheel','item-v32-firecloud-aegis','item-v32-goldenbody-drum','item-v32-nether-armor'])if(!runner.includes(id))throw new Error('V66 guard plan missing '+id);
for(const marker of ['V310_FULLRUN_V65_DWELLING','V310_FULLRUN_V64_PRODUCTIVE_SOURCE','V310_FULLRUN_V62_ESCAPE_GUARD','V310_FULLRUN_V61_LIVE_TRIBULATION_ENTRY','V310_FULLRUN_V57_GEAR_CALL'])if(!runner.includes(marker))throw new Error('V66 lost inherited marker '+marker);
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("invoke('v34ActivateBuildForTest'")||runner.includes("v33AddMaterial('mat-v37-law-crystal'"))throw new Error('forbidden progression/resource shortcut leaked into V66 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V66 final runner syntax failure: '+(syntax.stderr||syntax.stdout||''));
console.log('V310_FULLRUN_V66_FINAL_RUNNER_PASS '+JSON.stringify({automaticMahayanaPillChasing:false,buildV6PillGameplayFixPreserved:true,midGuardAtRealm:29,midGuardRefinementTarget:3,pathSpecificMidGuards:true,normalForgeBindEquipRefineOnly:true,v65MaxDwellingPreserved:true,v64ProductiveDomainSandPreserved:true,v62EscapeGuardPreserved:true,v61LiveTribulationGearPreserved:true,gameDataUnchanged:true,rngUnchanged:true,fleeChanceUnchanged:true,enemyStatsUnchanged:true,cultivationFormulaUnchanged:true,breakthroughOddsUnchanged:true,seedUnchanged:true,actionCapUnchanged:true,noDirectResourceInjection:true,noDirectStateMutation:true}));
await import(finalRunnerPath.href+'?v66final='+Date.now());
