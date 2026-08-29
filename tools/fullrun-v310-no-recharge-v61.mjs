import fs from 'fs';
import {spawnSync} from 'child_process';

const v60Path=new URL('./fullrun-v310-no-recharge-v60.mjs',import.meta.url);
const v60StagePath=new URL('./.generated-fullrun-v310-no-recharge-v61-v60stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v61 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v61 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V60 correctly defined a legal four-path anti-tribulation loadout, but attached the call to the
// inherited prepareTribulation() entry. V57's recoverable tribulation retry had already replaced the
// live finale path with finishTribulation(attempt=0), leaving prepareTribulation() present but dead.
// V61 changes RUNNER CALL PLACEMENT ONLY: the same V60 normal forge/bind/equip/refine routine now
// executes at the live finishTribulation() entry before every initial/retry attempt. Candidate game
// source, item stats/costs, enemy/drop tables, tribulation formulas, RNG seed and action cap are unchanged.
let v60=fs.readFileSync(v60Path,'utf8');
v60=replaceOnce(
 v60,
 "await import(finalRunnerPath.href+'?v60final='+Date.now());",
 "// v61 executes after moving the V60 gear call onto the live tribulation entry.",
 'suppress v60 final gameplay auto-import'
);
fs.writeFileSync(v60StagePath,v60);
const staged=spawnSync(process.execPath,['--check',v60StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v61 staged V60 syntax failure: '+(staged.stderr||staged.stdout||''));
await import(v60StagePath.href+'?v61stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v61 did not obtain V60 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const liveEntry=`function finishTribulation(attempt=0){
 ensureV60TribulationGear();
 const v61p=state().player,v61loadout=v61p.artifactLoadout||{},v61inventory=v61p.equipmentInventory||{};
 const v61guard='item-v39-thunder-umbrella',v61support='item-v39-tribulation-array-disc';
 if(v61loadout.guard!==v61guard||v61loadout.support!==v61support||!v61inventory[v61guard]?.bound||!v61inventory[v61support]?.bound)fail('v61-live-tribulation-gear-not-ready',{attempt,loadout:v61loadout,guard:v61inventory[v61guard],support:v61inventory[v61support]});
 console.log('V310_FULLRUN_V61_LIVE_TRIBULATION_ENTRY',JSON.stringify({path:DAO_PATH,attempt,realm:v61p.realmIndex,guard:v61loadout.guard,guardRefinement:v61inventory[v61guard]?.refinement||0,support:v61loadout.support,supportRefinement:v61inventory[v61support]?.refinement||0,location:v61p.location,actions}));`;
runner=replaceOnce(runner,'function finishTribulation(attempt=0){',liveEntry,'attach V60 legal gear to current V57 live finale entry');

if(!runner.includes("function finishTribulation(attempt=0){\n ensureV60TribulationGear();"))throw new Error('V61 live finishTribulation gear call missing');
if(!runner.includes('V310_FULLRUN_V61_LIVE_TRIBULATION_ENTRY'))throw new Error('V61 live-entry evidence marker missing');
if(!runner.includes("fail('v61-live-tribulation-gear-not-ready'"))throw new Error('V61 live-entry fail-closed guard missing');
if(!runner.includes('V310_FULLRUN_V60_TRIBULATION_GEAR'))throw new Error('V61 lost V60 legal anti-tribulation loadout');
if(!runner.includes("ensureArtifactLoadoutItem(guard,'guard',3)"))throw new Error('V61 lost normal V39 guard acquisition');
if(!runner.includes("ensureArtifactLoadoutItem(support,'support',3)"))throw new Error('V61 lost normal V39 support acquisition');
if(!runner.includes('V310_FULLRUN_V57_GEAR_CALL'))throw new Error('V61 lost V57 live high-realm combat gear evidence');
if(!runner.includes("function ensureMahayanaEssence(n){\n ensureRealm33SwordCombatGear();"))throw new Error('V61 lost V57 live Mahayana gear call');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("invoke('v34ActivateBuildForTest'")||runner.includes("v33AddMaterial('mat-v39-thunder-crystal'")||runner.includes("v33AddMaterial('mat-v39-tribulation-gold'"))throw new Error('forbidden shortcut leaked into V61 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V61 final runner syntax failure: '+(syntax.stderr||syntax.stdout||''));
console.log('V310_FULLRUN_V61_FINAL_RUNNER_PASS '+JSON.stringify({liveEntry:'finishTribulation(attempt=0)',v60GearCallLive:true,v39ThunderUmbrella:true,v39TribulationArrayDisc:true,normalForgeBindEquipRefineOnly:true,v57LiveGearPreserved:true,v59GameplaySourcePreserved:true,gameBalanceUnchanged:true,seedUnchanged:true,actionCapUnchanged:true,noDirectResourceInjection:true}));
await import(finalRunnerPath.href+'?v61final='+Date.now());
