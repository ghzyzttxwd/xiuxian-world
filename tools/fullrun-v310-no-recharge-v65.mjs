import fs from 'fs';
import {spawnSync} from 'child_process';

const v64Path=new URL('./fullrun-v310-no-recharge-v64.mjs',import.meta.url);
const v64StagePath=new URL('./.generated-fullrun-v310-no-recharge-v65-v64stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);
const gamePath=new URL('../src/game-v310.js',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v65 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v65 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v65 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v65 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  if(src[i]==='{')depth++;
  else if(src[i]==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v65 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V63 flame proved that the normal Mahayana-pill strategy works, but the run still exhausted the
// 300k validation fuse during ordinary realm-37 retreat. The inherited V2 autonomous player builds
// only a tier-1 凡阶静室 forever, although the stable game exposes normal tier-2 / tier-3 dwelling
// upgrades. V65 changes runner strategy only: early progression remains tier 1, while a cultivator
// who reaches 合体 (realm 30+) pays the authored stone/beast-material costs through normal gameplay,
// returns to the actual dwelling, and clicks the same public upgrade UI twice to reach 青云洞府.
// No cultivation coefficient, realm need, action cap, RNG seed, source/drop table or game file changes.
let v64=fs.readFileSync(v64Path,'utf8');
v64=replaceOnce(
 v64,
 "await import(finalRunnerPath.href+'?v64final='+Date.now());",
 "// v65 executes after attaching normal high-realm dwelling upgrades.",
 'suppress v64 final gameplay auto-import'
);
fs.writeFileSync(v64StagePath,v64);
const staged=spawnSync(process.execPath,['--check',v64StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v65 staged V64 syntax failure: '+(staged.stderr||staged.stdout||''));
await import(v64StagePath.href+'?v65stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v65 did not obtain V64 final runner');

const game=fs.readFileSync(gamePath,'utf8');
const dwellingContract="const DWELLINGS=[\n {name:'无洞府',stones:0,materials:0,cultivate:1,plot:0},\n {name:'凡阶静室',stones:15,materials:0,cultivate:1.08,plot:4},\n {name:'聚灵小院',stones:30,materials:4,cultivate:1.18,plot:7},\n {name:'青云洞府',stones:60,materials:10,cultivate:1.32,plot:10}\n];";
if(!game.includes(dwellingContract))throw new Error('V65 dwelling cost/cultivation contract drifted');
if(!game.includes('gain=cultivationGainForDays(7,1.14+tier*.06)'))throw new Error('V65 seven-day retreat tier boost contract drifted');
if(!game.includes("if(!p.dwellingTier&&!['青石镇','临江城','青云山'].includes(p.location))"))throw new Error('V65 normal dwelling location rule drifted');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const upgradedEnsureDwelling=`function ensureDwelling(){
 const p=state().player,target=p.realmIndex>=30?3:1;
 if((p.dwellingTier||0)>=target)return true;
 if(!p.dwellingTier){
  if(!goTo('青石镇'))fail('dwelling-location-unreachable',{});
  ensureStones(15);
  if(!goTo('青石镇'))fail('dwelling-build-return-unreachable',{});
  const before=state().player.dwellingTier||0;
  spendAction('build-dwelling-ui',()=>{const b=dom.window.document.querySelector('[data-dwelling="upgrade"]');if(!b)fail('dwelling-ui-missing',{});b.click()});
  if((state().player.dwellingTier||0)<=before)fail('dwelling-build-no-progress',{before,after:state().player.dwellingTier||0});
  console.log('V310_FULLRUN_V65_DWELLING',JSON.stringify({stage:'built',tier:state().player.dwellingTier,location:state().player.dwellingLocation,realm:state().player.realmIndex,actions}));
 }
 while((state().player.dwellingTier||0)<target){
  const before=state().player.dwellingTier||0,next=before+1;
  const cost=next===2?{stones:30,materials:4}:next===3?{stones:60,materials:10}:null;
  if(!cost)fail('v65-dwelling-tier-contract',{before,next,target});
  ensureStones(cost.stones);ensureBeast(cost.materials);
  const home=state().player.dwellingLocation||'青石镇';
  if(!goTo(home))fail('v65-dwelling-upgrade-return-unreachable',{home,before,next});
  if((state().player.spiritStones||0)<cost.stones||(state().player.beastMaterials||0)<cost.materials)fail('v65-dwelling-upgrade-cost-missing',{before,next,cost,stones:state().player.spiritStones,materials:state().player.beastMaterials});
  spendAction('upgrade-dwelling-tier-'+next,()=>{const b=dom.window.document.querySelector('[data-dwelling="upgrade"]');if(!b)fail('v65-dwelling-upgrade-ui-missing',{before,next});b.click()});
  const after=state().player.dwellingTier||0;
  if(after!==next)fail('v65-dwelling-upgrade-no-progress',{before,next,after,cost});
  console.log('V310_FULLRUN_V65_DWELLING',JSON.stringify({stage:'upgraded',before,after,cost,location:state().player.dwellingLocation,realm:state().player.realmIndex,actions}));
 }
 return true
}`;
runner=replaceFunction(runner,'function ensureDwelling(){',upgradedEnsureDwelling,'use authored tier-3 dwelling for high-realm cultivation');

if(!runner.includes("target=p.realmIndex>=30?3:1"))throw new Error('V65 high-realm dwelling target missing');
if(!runner.includes('ensureBeast(cost.materials)')||!runner.includes('ensureStones(cost.stones)'))throw new Error('V65 normal dwelling resource acquisition missing');
if(!runner.includes("querySelector('[data-dwelling=\"upgrade\"]')"))throw new Error('V65 normal dwelling UI upgrade missing');
if(!runner.includes('V310_FULLRUN_V65_DWELLING'))throw new Error('V65 dwelling runtime evidence missing');
for(const marker of ['V310_FULLRUN_V64_PRODUCTIVE_SOURCE','V310_FULLRUN_V63_MAHAYANA_PILL','V310_FULLRUN_V62_ESCAPE_GUARD','V310_FULLRUN_V61_LIVE_TRIBULATION_ENTRY','V310_FULLRUN_V60_TRIBULATION_GEAR','V310_FULLRUN_V57_GEAR_CALL'])if(!runner.includes(marker))throw new Error('V65 lost inherited marker '+marker);
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("invoke('v34ActivateBuildForTest'")||runner.includes("v33AddMaterial('mat-beast-material'"))throw new Error('forbidden shortcut leaked into V65 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V65 final runner syntax failure: '+(syntax.stderr||syntax.stdout||''));
console.log('V310_FULLRUN_V65_FINAL_RUNNER_PASS '+JSON.stringify({earlyDwellingTier:1,highRealmThreshold:30,highRealmDwellingTier:3,tier2Cost:{stones:30,materials:4},tier3Cost:{stones:60,materials:10},tier1EffectiveRetreatMultiplier:1.296,tier3EffectiveRetreatMultiplier:1.7424,relativeGain:Number((1.7424/1.296).toFixed(4)),normalPublicUiOnly:true,normalResourceAcquisitionOnly:true,v64ProductiveSourcePreserved:true,v63MahayanaStrategyPreserved:true,v62EscapeGuardPreserved:true,v61TribulationStrategyPreserved:true,gameSourceUnchanged:true,realmNeedsUnchanged:true,seedUnchanged:true,actionCapUnchanged:true,noDirectResourceInjection:true,noDirectStateMutation:true}));
await import(finalRunnerPath.href+'?v65final='+Date.now());
