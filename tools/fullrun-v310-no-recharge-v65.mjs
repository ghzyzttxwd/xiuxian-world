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
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v65 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V64 flame reaches Mahayana completion but still hits the 300k action fuse while cultivating realm37.
// Static audit found the autonomous player keeps the very first dwelling (凡阶静室) forever even though
// the authored game provides two normal paid upgrades. At realm14 those costs are trivial relative to the
// later economy and the higher dwelling is the game's intended way to improve repeated cultivation.
// V65 changes only autonomous player strategy: keep tier1 during fragile early realms, then after reaching
// 结丹境 pay the exact authored stone/beast-material costs and click the existing dwelling-upgrade UI until
// tier3 青云洞府. No cultivation coefficient, realm need, breakthrough chance, RNG seed, action cap, game
// source or test-only state setter is changed.
let v64=fs.readFileSync(v64Path,'utf8');
v64=replaceOnce(
 v64,
 "await import(finalRunnerPath.href+'?v64final='+Date.now());",
 "// v65 executes after attaching normal staged dwelling upgrades.",
 'suppress v64 final gameplay auto-import'
);
fs.writeFileSync(v64StagePath,v64);
const staged=spawnSync(process.execPath,['--check',v64StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v65 staged V64 syntax failure: '+(staged.stderr||staged.stdout||''));
await import(v64StagePath.href+'?v65stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v65 did not obtain V64 final runner');

const game=fs.readFileSync(gamePath,'utf8');
for(const authored of [
 "{name:'凡阶静室',stones:15,materials:0,cultivate:1.08,plot:4}",
 "{name:'聚灵小院',stones:30,materials:4,cultivate:1.18,plot:7}",
 "{name:'青云洞府',stones:60,materials:10,cultivate:1.32,plot:10}"
])if(!game.includes(authored))throw new Error('V65 authored dwelling tier/cost drifted: '+authored);
if(!game.includes('gain=cultivationGainForDays(7,1.14+tier*.06)'))throw new Error('V65 authored seven-day retreat multiplier drifted');
if(!game.includes("if(p.dwellingTier&&p.location!==p.dwellingLocation)return showResult('不在洞府'"))throw new Error('V65 authored dwelling-location rule drifted');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const upgradedDwelling=`function ensureDwelling(){
 const p=state().player,desired=p.realmIndex>=14?3:1;
 if((p.dwellingTier||0)>=desired)return true;
 if(!p.dwellingTier){
  if(!goTo('青石镇'))fail('dwelling-location-unreachable',{});
 }
 const costs={1:{stones:15,beast:0,name:'凡阶静室'},2:{stones:30,beast:4,name:'聚灵小院'},3:{stones:60,beast:10,name:'青云洞府'}};
 let guard=0;
 while((state().player.dwellingTier||0)<desired){
  if(++guard>3)fail('v65-dwelling-upgrade-loop',{desired,tier:state().player.dwellingTier||0});
  const before=state().player,tier=before.dwellingTier||0,next=tier+1,cost=costs[next];
  if(!cost)fail('v65-dwelling-cost-missing',{tier,next,desired});
  const home=before.dwellingLocation||'青石镇';
  if(!goTo(home))fail('v65-dwelling-home-unreachable',{home,tier,next});
  ensureStones(cost.stones);ensureBeast(cost.beast);
  if(!goTo(state().player.dwellingLocation||home))fail('v65-dwelling-return-unreachable',{home,tier,next});
  const ready=state().player,stonesBefore=ready.spiritStones,beastBefore=ready.beastMaterials,ageBefore=ageYears();
  spendAction('upgrade-dwelling:'+next,()=>{const b=dom.window.document.querySelector('[data-dwelling="upgrade"]');if(!b)fail('v65-dwelling-ui-missing',{tier,next,desired});b.click()});
  const after=state().player;
  if((after.dwellingTier||0)!==next)fail('v65-dwelling-upgrade-no-progress',{tier,next,actual:after.dwellingTier||0});
  const stonesPaid=stonesBefore-after.spiritStones,beastPaid=beastBefore-after.beastMaterials;
  if(stonesPaid!==cost.stones||beastPaid!==cost.beast)fail('v65-dwelling-cost-drift',{tier,next,expected:cost,stonesPaid,beastPaid});
  console.log('V310_FULLRUN_V65_DWELLING',JSON.stringify({realm:after.realmIndex,fromTier:tier,toTier:next,name:cost.name,stonesPaid,beastPaid,days:Number(((ageYears()-ageBefore)*360).toFixed(2)),location:after.dwellingLocation,actions}));
 }
 return true;
}`;
runner=replaceFunction(runner,'function ensureDwelling(',upgradedDwelling,'upgrade ordinary dwelling after realm14');

if(!runner.includes("const p=state().player,desired=p.realmIndex>=14?3:1"))throw new Error('V65 staged dwelling target missing');
if(!runner.includes("ensureStones(cost.stones);ensureBeast(cost.beast);"))throw new Error('V65 normal dwelling resource acquisition missing');
if(!runner.includes("dom.window.document.querySelector('[data-dwelling=\"upgrade\"]')"))throw new Error('V65 normal dwelling UI action missing');
if(!runner.includes('V310_FULLRUN_V65_DWELLING'))throw new Error('V65 runtime dwelling evidence missing');
for(const marker of ['V310_FULLRUN_V64_PRODUCTIVE_SOURCE','V310_FULLRUN_V63_MAHAYANA_PILL','V310_FULLRUN_V62_ESCAPE_GUARD','V310_FULLRUN_V61_LIVE_TRIBULATION_ENTRY','V310_FULLRUN_V57_GEAR_CALL'])if(!runner.includes(marker))throw new Error('V65 lost inherited marker '+marker);
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("invoke('v34ActivateBuildForTest'")||runner.includes('dwellingTier=3')||runner.includes('dwellingTier = 3'))throw new Error('forbidden direct dwelling/progression shortcut leaked into V65 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V65 final runner syntax failure: '+(syntax.stderr||syntax.stdout||''));
console.log('V310_FULLRUN_V65_FINAL_RUNNER_PASS '+JSON.stringify({earlyDwellingTier:1,postCoreDwellingTier:3,upgradeAtRealm:14,exactAuthoredUpgradeCosts:true,normalStoneIncomeOnly:true,normalBeastMaterialAcquisitionOnly:true,normalDwellingUiOnly:true,sevenDayRetreatMechanicUnchanged:true,cultivationCoefficientsUnmodified:true,realmNeedsUnmodified:true,breakthroughOddsUnmodified:true,v64ProductiveSourcePreserved:true,v63MahayanaStrategyPreserved:true,v62EscapeGuardPreserved:true,v61LiveTribulationGearPreserved:true,seedUnchanged:true,actionCapUnchanged:true,noDirectResourceInjection:true,noDirectStateMutation:true}));
await import(finalRunnerPath.href+'?v65final='+Date.now());
