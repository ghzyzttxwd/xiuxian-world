import fs from 'fs';
import {spawnSync} from 'child_process';

const v62Path=new URL('./fullrun-v310-no-recharge-v62.mjs',import.meta.url);
const v62StagePath=new URL('./.generated-fullrun-v310-no-recharge-v63-v62stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v63 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v63 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V60 flame showed repeated Mahayana failures can consume several complete five-essence batches before
// the normal pity curve reaches its cap. Separately, build-v6 repaired the real gameplay bug that made
// the authored +7% 大乘证道丹 breakthrough effect inert. V63 uses that now-functional game content as a
// normal player would, but only AFTER at least one genuine Mahayana failure. The first attempt remains
// completely unchanged. The recipe must be obtained from the ordinary 苍梧 auction, each brew consumes
// normal ingredients and 13 in-game days, alchemy success is the real RNG roll, and at most three brew
// attempts are made for one breakthrough attempt. If all three brews fail, the runner proceeds without
// the pill. No forced recipe learn, forced brew, direct buff assignment, seed change or action-cap change.
let v62=fs.readFileSync(v62Path,'utf8');
v62=replaceOnce(
 v62,
 "await import(finalRunnerPath.href+'?v62final='+Date.now());",
 "// v63 executes after optional post-failure Mahayana stabilizer routing is attached.",
 'suppress v62 final gameplay auto-import'
);
fs.writeFileSync(v62StagePath,v62);
const staged=spawnSync(process.execPath,['--check',v62StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v63 staged V62 syntax failure: '+(staged.stderr||staged.stdout||''));
await import(v62StagePath.href+'?v63stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v63 did not obtain V62 final runner');

const game=fs.readFileSync('src/game-v310.js','utf8');
if(!game.includes('"id":"recipe-v38-mahayana-break"')||!game.includes('"effect":{"buff":{"breakthrough":0.07},"buffDays":25,"insight":1}'))throw new Error('V63 requires build-v6 live Mahayana pill effect');
if(game.includes('"effect":{"breakthrough":0.07,"insight":1}'))throw new Error('V63 stale inert Mahayana pill schema detected');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

// Add exactly one new normal gameplay call to the harness allowlist. Recipe acquisition continues through
// the already-allowed V3.5 auction APIs; useV33Pill was already allowed by V40.
{
 const start=runner.indexOf('const legalCalls=new Set(['),end=runner.indexOf(']);',start);
 if(start<0||end<0)throw new Error('V63 legal call set missing');
 const block=runner.slice(start,end);
 if(!block.includes("'brewV33Alchemy'"))runner=runner.slice(0,end)+",'brewV33Alchemy'"+runner.slice(end);
}

const helpers=`
function v63MahayanaPillCount(){
 const s=state().player.pillInventoryById?.['recipe-v38-mahayana-break']||{};
 return Object.values(s).reduce((a,n)=>a+(Number(n)||0),0);
}
function ensureV63MahayanaRecipe(maxAuctionCycles=8){
 if(state().player.knownRecipeIds?.includes('recipe-v38-mahayana-break'))return true;
 if(state().player.realmIndex<33)return false;
 let waited=0;
 while(!state().player.knownRecipeIds?.includes('recipe-v38-mahayana-break')){
  if(!goTo('苍梧郡城'))fail('v63-mahayana-recipe-auction-unreachable',{});
  const rows=Object.values(invoke('v35ListingRegistry')||{}),lot=rows.find(x=>x&&x.kind==='recipe'&&x.refId==='recipe-v38-mahayana-break');
  if(lot){
   const q=invoke('v35Quote',lot.id,'buy',1);if(!q||!(q.total>0))fail('v63-mahayana-recipe-quote-missing',{lot});
   ensureStones(q.total+80);if(!goTo('苍梧郡城'))fail('v63-mahayana-recipe-auction-return-unreachable',{lot:lot.id});
   const before=state().player.v35AuctionWins||0,r=spendAction('v63-buy-mahayana-recipe',()=>invoke('v35Trade',lot.id,'buy',1));
   const known=state().player.knownRecipeIds?.includes('recipe-v38-mahayana-break');
   console.log('V310_FULLRUN_V63_MAHAYANA_RECIPE',JSON.stringify({lot:lot.id,cycle:invoke('v35EconomySnapshot').auctionCycle,price:q.total,result:r,known,auctionWinsBefore:before,auctionWinsAfter:state().player.v35AuctionWins||0,actions}));
   if(r?.ok&&known)return true;
   if(r?.reason&&r.reason!=='stock'&&r.reason!=='known')fail('v63-mahayana-recipe-trade-blocked',{lot:lot.id,result:r});
  }
  if(waited++>=maxAuctionCycles)return false;
  const cycle=Number(invoke('v35EconomySnapshot').auctionCycle)||0;let guard=0;
  while((Number(invoke('v35EconomySnapshot').auctionCycle)||0)===cycle){if(++guard>40)fail('v63-mahayana-recipe-cycle-wait-loop',{cycle,waited});act('rest',false)}
 }
 return true;
}
function ensureV63MahayanaStabilizer(){
 const p0=state().player;
 if(p0.realmIndex!==33||!(p0.v38MahayanaFailures>0)){
  console.log('V310_FULLRUN_V63_MAHAYANA_PILL',JSON.stringify({stage:'defer-first-attempt',failures:p0.v38MahayanaFailures||0,actions}));
  return false;
 }
 if(!ensureV63MahayanaRecipe(8)){
  console.log('V310_FULLRUN_V63_MAHAYANA_PILL',JSON.stringify({stage:'recipe-unavailable',failures:state().player.v38MahayanaFailures||0,actions}));
  return false;
 }
 for(let brewAttempt=1;brewAttempt<=3;brewAttempt++){
  // Preserve the five essences required by the actual breakthrough: craft/buy a sixth for the pill.
  ensureMahayanaEssence(6);
  ensureNamed('mat-v38-origin-crystal',2);
  ensureNamed('mat-v38-world-essence-dew',1);
  const site=chooseMahayanaCraftSite();if(!site?.dest||!goTo(site.dest))fail('v63-mahayana-pill-site-unreachable',{site,brewAttempt});
  const beforePills=v63MahayanaPillCount(),beforeEssence=materialCount('mat-v38-mahayana-essence'),beforeOrigin=materialCount('mat-v38-origin-crystal'),beforeDew=materialCount('mat-v38-world-essence-dew');
  const brew=spendAction('v63-brew-mahayana-pill:'+brewAttempt,()=>invoke('brewV33Alchemy','recipe-v38-mahayana-break'));
  const afterPills=v63MahayanaPillCount();
  console.log('V310_FULLRUN_V63_MAHAYANA_BREW',JSON.stringify({brewAttempt,site:site.dest,siteScore:site.score,result:brew,pillsBefore:beforePills,pillsAfter:afterPills,essenceBefore:beforeEssence,essenceAfter:materialCount('mat-v38-mahayana-essence'),originBefore:beforeOrigin,originAfter:materialCount('mat-v38-origin-crystal'),dewBefore:beforeDew,dewAfter:materialCount('mat-v38-world-essence-dew'),alchemyProf:state().player.alchemyProf||0,actions}));
  if(afterPills<=beforePills)continue;
  if(materialCount('mat-v38-mahayana-essence')<5)fail('v63-mahayana-pill-stole-breakthrough-essence',{brewAttempt,essence:materialCount('mat-v38-mahayana-essence')});
  const use=spendAction('v63-use-mahayana-pill',()=>invoke('useV33Pill','recipe-v38-mahayana-break'));
  const buff=state().player.alchemyBuffs?.breakthrough||null,value=Number(buff?.value)||0;
  console.log('V310_FULLRUN_V63_MAHAYANA_PILL',JSON.stringify({stage:'used',brewAttempt,result:use,buffValue:value,buffExpiresDay:buff?.expiresDay||null,toxicity:state().player.pillToxicity||0,remainingPills:v63MahayanaPillCount(),essenceForBreakthrough:materialCount('mat-v38-mahayana-essence'),chanceNow:invoke('breakthroughChance'),failures:state().player.v38MahayanaFailures||0,actions}));
  if(!use||typeof use!=='object'||!(value>0))fail('v63-mahayana-pill-effect-missing',{use,buff,brewAttempt});
  return true;
 }
 console.log('V310_FULLRUN_V63_MAHAYANA_PILL',JSON.stringify({stage:'three-brews-failed',failures:state().player.v38MahayanaFailures||0,alchemyProf:state().player.alchemyProf||0,essence:materialCount('mat-v38-mahayana-essence'),actions}));
 return false;
}
`;
const breakPos=runner.indexOf('function breakRealm(){');
if(breakPos<0||runner.indexOf('function breakRealm(){',breakPos+1)>=0)throw new Error('V63 breakRealm insertion point missing/ambiguous');
runner=runner.slice(0,breakPos)+helpers+runner.slice(breakPos);

runner=replaceOnce(
 runner,
 "else if(i===33)result=spendAction('breakthrough-mahayana',()=>invoke('v38AttemptMahayanaBreakthrough'));",
 "else if(i===33){ensureV63MahayanaStabilizer();result=spendAction('breakthrough-mahayana',()=>invoke('v38AttemptMahayanaBreakthrough'));}",
 'use optional normal Mahayana stabilizer immediately before real breakthrough'
);

if(!runner.includes("'brewV33Alchemy'"))throw new Error('V63 normal alchemy API not allowed');
if(!runner.includes("invoke('v35Trade',lot.id,'buy',1)"))throw new Error('V63 normal auction trade missing');
if(!runner.includes("invoke('brewV33Alchemy','recipe-v38-mahayana-break')"))throw new Error('V63 normal Mahayana brew missing');
if(!runner.includes("invoke('useV33Pill','recipe-v38-mahayana-break')"))throw new Error('V63 normal Mahayana pill use missing');
if(!runner.includes("p0.v38MahayanaFailures>0"))throw new Error('V63 first Mahayana attempt was not preserved');
if(!runner.includes('brewAttempt<=3'))throw new Error('V63 bounded brew retry missing');
if(!runner.includes('ensureMahayanaEssence(6)'))throw new Error('V63 sixth-essence reserve missing');
if(!runner.includes("if(!site?.dest||!goTo(site.dest))"))throw new Error('V63 Mahayana craft-site selector object was not resolved to site.dest');
if(!runner.includes("materialCount('mat-v38-mahayana-essence')<5"))throw new Error('V63 five-essence breakthrough reserve gate missing');
if(!runner.includes('V310_FULLRUN_V63_MAHAYANA_RECIPE')||!runner.includes('V310_FULLRUN_V63_MAHAYANA_BREW')||!runner.includes('V310_FULLRUN_V63_MAHAYANA_PILL'))throw new Error('V63 Mahayana evidence markers incomplete');
if(!runner.includes('V310_FULLRUN_V62_ESCAPE_GUARD')||!runner.includes('V310_FULLRUN_V61_LIVE_TRIBULATION_ENTRY')||!runner.includes('V310_FULLRUN_V57_GEAR_CALL'))throw new Error('V63 lost inherited live survival markers');
if(runner.includes("invoke('brewV33Alchemy','recipe-v38-mahayana-break',{force")||runner.includes('forceSuccess')||runner.includes("invoke('learnV33Recipe','recipe-v38-mahayana-break',true")||runner.includes("alchemyBuffs.breakthrough="))throw new Error('forbidden forced Mahayana pill shortcut leaked into V63 runner');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("invoke('v34ActivateBuildForTest'")||runner.includes("v33AddMaterial('mat-v38-mahayana-essence'"))throw new Error('forbidden progression/resource shortcut leaked into V63 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V63 final runner syntax failure: '+(syntax.stderr||syntax.stdout||''));
console.log('V310_FULLRUN_V63_FINAL_RUNNER_PASS '+JSON.stringify({v6MahayanaPillEffectRequired:true,firstMahayanaAttemptUnchanged:true,postFailureStabilizerOnly:true,normalAuctionRecipeOnly:true,normalAlchemyOnly:true,maxBrewAttemptsPerBreakthrough:3,fiveBreakthroughEssencesReserved:true,mahayanaCraftSiteObjectResolvedToDest:true,normalPillToxicityAndQualityScaling:true,v62EscapeGuardPreserved:true,v61LiveTribulationGearPreserved:true,fleeChanceUnchanged:true,enemyStatsUnchanged:true,alchemyOddsUnchanged:true,pillMagnitudeUnchanged:true,seedUnchanged:true,actionCapUnchanged:true,noDirectResourceInjection:true,noDirectStateMutation:true}));
await import(finalRunnerPath.href+'?v63final='+Date.now());
