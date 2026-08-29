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

// V63/V65 diagnosis showed the autonomous player can enter 大乘圆满 and spend thousands of legal
// seven-day retreats there while V56 still skips the authored realm-37 terminal manual as optional
// high-risk content. The stable game explicitly unlocks one path-specific 半仙阶 manual at realm 37,
// all sourced from 九霄劫台, and normal learning uses the same public learn/switch APIs as every other
// manual. V66 does not reduce map danger or bypass the route: it earns the authored default cost,
// travels normally under the inherited escape policy, learns without force, switches without force,
// then returns to the ordinary cultivation loop. V65 tier-3 dwelling strategy remains unchanged.
let v65=fs.readFileSync(v65Path,'utf8');
v65=replaceOnce(
 v65,
 "await import(finalRunnerPath.href+'?v65final='+Date.now());",
 "// v66 executes after attaching normal realm-37 terminal-manual acquisition.",
 'suppress v65 final gameplay auto-import'
);
fs.writeFileSync(v65StagePath,v65);
const staged=spawnSync(process.execPath,['--check',v65StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v66 staged V65 syntax failure: '+(staged.stderr||staged.stdout||''));
await import(v65StagePath.href+'?v66stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v66 did not obtain V65 final runner');

const game=fs.readFileSync(gamePath,'utf8');
const terminalManuals={
 sword:{id:'manual-v39-sword-tribulation',name:'斩劫飞仙经',mult:3.95},
 flame:{id:'manual-v39-flame-tribulation',name:'涅槃渡劫典',mult:4},
 body:{id:'manual-v39-body-tribulation',name:'万劫不灭仙身',mult:3.82},
 spirit:{id:'manual-v39-spirit-tribulation',name:'太上明心飞仙章',mult:3.98}
};
for(const [path,row] of Object.entries(terminalManuals)){
 const token=`\"id\":\"${row.id}\",\"name\":\"${row.name}\",\"quality\":\"半仙阶\",\"mult\":${row.mult},\"unlock\":37,\"path\":\"${path}\",\"sources\":[\"九霄劫台\"]`;
 if(!game.includes(token))throw new Error('V66 terminal manual authored contract drifted: '+path);
}
if(!game.includes("function v31DefaultCost(row,kind='spell'){const u=Math.max(0,Number(row?.unlock)||0),manualKind=kind==='manual';return {stones:(manualKind?6:4)+u*(manualKind?3:2),insight:u>=10?1+Math.floor((u-10)/6):0,relic:u>=15?1+Math.floor((u-15)/5):0,rare:u>=19?1:0,days:u>=19?3:u>=10?2:1}"))throw new Error('V66 manual default-cost formula drifted');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const helper=`function ensureV66TribulationManual(){
 const p=state().player;if(p.realmIndex<37)return true;
 const rows={sword:{id:'manual-v39-sword-tribulation',name:'斩劫飞仙经',mult:3.95},flame:{id:'manual-v39-flame-tribulation',name:'涅槃渡劫典',mult:4},body:{id:'manual-v39-body-tribulation',name:'万劫不灭仙身',mult:3.82},spirit:{id:'manual-v39-spirit-tribulation',name:'太上明心飞仙章',mult:3.98}};
 const wanted=rows[DAO_PATH];if(!wanted)fail('v66-terminal-manual-path-missing',{path:DAO_PATH});
 const catalog=(invoke('v31CatalogSnapshot').manuals||[]),row=catalog.find(x=>x.id===wanted.id);
 if(!row||row.unlock!==37||row.path!==DAO_PATH||Number(row.mult)!==wanted.mult||!(row.sources||[]).includes('九霄劫台'))fail('v66-terminal-manual-registry-drift',{path:DAO_PATH,wanted,row});
 if(!p.manualLibraryIds?.includes(wanted.id)){
  const cost={stones:117,insight:5,relic:5,rare:1,days:3};
  ensureStones(cost.stones);ensureInsight(cost.insight);ensureRelic(cost.relic);ensureRare(cost.rare);
  if(!goTo('九霄劫台'))fail('v66-terminal-manual-route-unreachable',{path:DAO_PATH,wanted,realm:p.realmIndex,location:state().player.location});
  const before={stones:state().player.spiritStones,insight:state().player.insight,relic:state().player.relicFragments,rare:state().player.rareMaterials,age:Number(ageYears().toFixed(2))};
  const learned=spendAction('v66-learn-terminal-manual:'+wanted.id,()=>invoke('learnV31Manual',wanted.id));
  if(!['learned','known'].includes(learned)||!state().player.manualLibraryIds?.includes(wanted.id))fail('v66-terminal-manual-learn-failed',{path:DAO_PATH,wanted,learned,before,after:slimState()});
  console.log('V310_FULLRUN_V66_TERMINAL_MANUAL',JSON.stringify({stage:'learned',path:DAO_PATH,id:wanted.id,name:wanted.name,mult:wanted.mult,cost,before,after:{stones:state().player.spiritStones,insight:state().player.insight,relic:state().player.relicFragments,rare:state().player.rareMaterials,age:Number(ageYears().toFixed(2))},actions}));
 }
 if(state().player.manual!==wanted.name){
  const switched=spendAction('v66-switch-terminal-manual:'+wanted.id,()=>invoke('switchV31Manual',wanted.id));
  if(!switched||state().player.manual!==wanted.name)fail('v66-terminal-manual-switch-failed',{path:DAO_PATH,wanted,current:state().player.manual});
  console.log('V310_FULLRUN_V66_TERMINAL_MANUAL',JSON.stringify({stage:'switched',path:DAO_PATH,id:wanted.id,name:wanted.name,mult:wanted.mult,realm:state().player.realmIndex,location:state().player.location,actions}));
 }
 return true
}
`;
runner=replaceOnce(runner,'function cultivateFull(){improveManual();',helper+'function cultivateFull(){ensureV66TribulationManual();improveManual();','attach legal terminal manual before realm cultivation');

if(!runner.includes('function ensureV66TribulationManual(){'))throw new Error('V66 terminal manual helper missing');
if(!runner.includes("invoke('learnV31Manual',wanted.id)"))throw new Error('V66 normal learn API missing');
if(!runner.includes("invoke('switchV31Manual',wanted.id)"))throw new Error('V66 normal switch API missing');
if(!runner.includes("goTo('九霄劫台')"))throw new Error('V66 normal route acquisition missing');
if(!runner.includes('V310_FULLRUN_V65_DWELLING'))throw new Error('V66 lost V65 dwelling strategy');
for(const marker of ['V310_FULLRUN_V64_PRODUCTIVE_SOURCE','V310_FULLRUN_V63_MAHAYANA_PILL','V310_FULLRUN_V62_ESCAPE_GUARD','V310_FULLRUN_V61_LIVE_TRIBULATION_ENTRY','V310_FULLRUN_V60_TRIBULATION_GEAR','V310_FULLRUN_V57_GEAR_CALL'])if(!runner.includes(marker))throw new Error('V66 lost inherited marker '+marker);
if(runner.includes("learnV31Manual',wanted.id,true")||runner.includes("switchV31Manual',wanted.id,true")||runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden force/test shortcut leaked into V66 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V66 final runner syntax failure: '+(syntax.stderr||syntax.stdout||''));
console.log('V310_FULLRUN_V66_FINAL_RUNNER_PASS '+JSON.stringify({realmThreshold:37,terminalManuals,authoredDefaultCost:{stones:117,insight:5,relic:5,rare:1,days:3},normalTravelOnly:true,normalLearnSwitchOnly:true,forceDisabled:true,v65Tier3DwellingPreserved:true,v64ProductiveSourcePreserved:true,v63MahayanaStrategyPreserved:true,v62EscapeGuardPreserved:true,v61TribulationStrategyPreserved:true,gameSourceUnchanged:true,mapDangerUnchanged:true,realmNeedsUnchanged:true,seedUnchanged:true,actionCapUnchanged:true,noDirectResourceInjection:true,noDirectStateMutation:true}));
await import(finalRunnerPath.href+'?v66final='+Date.now());
