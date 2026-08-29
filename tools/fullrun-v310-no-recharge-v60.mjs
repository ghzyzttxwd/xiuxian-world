import fs from 'fs';
import {spawnSync} from 'child_process';

const source=fs.readFileSync('src/game-v310.js','utf8');
const report=JSON.parse(fs.readFileSync('BUILD_V310_BALANCE.json','utf8'));
if(!source.includes("if(row?.itemId&&row.itemId===state.player.natalArtifactId)m+=marks*.035"))throw new Error('V60 requires V58 natal identity fix');
if(!source.includes('"mat-v39-tribulation-essence":1'))throw new Error('V60 requires V59 tribulation essence sink');
if(report.status!=='PASS'||report.gameplay_version!=='3.10.0'||report.build!=='31001')throw new Error('V60 V3.10 build report mismatch');

const v57Path=new URL('./fullrun-v310-no-recharge-v57.mjs',import.meta.url);
const stagePath=new URL('./.generated-fullrun-v310-no-recharge-v60-v57stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);
function replaceOnce(src,before,after,label){const i=src.indexOf(before);if(i<0)throw new Error('V60 transform miss: '+label);if(src.indexOf(before,i+1)>=0)throw new Error('V60 transform ambiguous: '+label);return src.slice(0,i)+after+src.slice(i+before.length)}

let v57=fs.readFileSync(v57Path,'utf8');
v57=replaceOnce(v57,"await import(finalRunnerPath.href+'?v57final='+Date.now());","// V60 executes after adding legal V39 tribulation-specific gear.",'suppress V57 final gameplay import');
fs.writeFileSync(stagePath,v57);
const staged=spawnSync(process.execPath,['--check',stagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V60 staged V57 syntax failure: '+(staged.stderr||staged.stdout||''));
await import(stagePath.href+'?v60stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V60 did not obtain V57 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const gearFn=`function ensureV60TribulationGear(){
 if(state().player.realmIndex<37)return;
 const guard='item-v39-thunder-umbrella',support='item-v39-tribulation-array-disc';
 ensureArtifactLoadoutItem(guard,'guard',3);
 ensureArtifactLoadoutItem(support,'support',3);
 const p=state().player,loadout=p.artifactLoadout||{},inventory=p.equipmentInventory||{};
 if(loadout.guard!==guard||loadout.support!==support)fail('v60-tribulation-gear-equip-incomplete',{loadout,guard,support});
 if(!inventory[guard]?.bound||!inventory[support]?.bound)fail('v60-tribulation-gear-unbound',{guard:inventory[guard],support:inventory[support]});
 console.log('V310_FULLRUN_V60_TRIBULATION_GEAR',JSON.stringify({path:DAO_PATH,realm:p.realmIndex,guard,guardRefinement:inventory[guard]?.refinement||0,support,supportRefinement:inventory[support]?.refinement||0,loadout:{guard:loadout.guard,support:loadout.support},actions}));
}`;
runner=replaceOnce(runner,'function prepareTribulation(){',gearFn+'\nfunction prepareTribulation(){\n ensureV60TribulationGear();','prepare V39-specific anti-tribulation gear before readiness work');

if(!runner.includes("ensureArtifactLoadoutItem(guard,'guard',3)"))throw new Error('V60 lost normal V39 guard acquisition');
if(!runner.includes("ensureArtifactLoadoutItem(support,'support',3)"))throw new Error('V60 lost normal V39 support acquisition');
if(!runner.includes('V310_FULLRUN_V60_TRIBULATION_GEAR'))throw new Error('V60 runtime gear marker missing');
if(!runner.includes('function finishTribulation(attempt=0)'))throw new Error('V60 lost recoverable tribulation retries');
if(!runner.includes("function ensureMahayanaEssence(n){\n ensureRealm33SwordCombatGear();"))throw new Error('V60 lost V57 live high-realm gear call');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("invoke('v34ActivateBuildForTest'")||runner.includes("v33AddMaterial('mat-v39-thunder-crystal'")||runner.includes("v33AddMaterial('mat-v39-tribulation-gold'"))throw new Error('forbidden shortcut leaked into V60 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V60 final runner syntax failure: '+(syntax.stderr||syntax.stdout||''));
console.log('V310_FULLRUN_V60_FINAL_RUNNER_PASS '+JSON.stringify({v39ThunderUmbrella:true,v39TribulationArrayDisc:true,normalForgeBindEquipRefineOnly:true,v57LiveGearPreserved:true,v59SourcePreserved:true,gameBalanceUnchanged:true,seedUnchanged:true,actionCapUnchanged:true,noDirectResourceInjection:true}));
await import(finalRunnerPath.href+'?v60final='+Date.now());
