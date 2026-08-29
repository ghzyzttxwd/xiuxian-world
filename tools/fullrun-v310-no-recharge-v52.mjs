import fs from 'fs';
import {spawnSync} from 'child_process';

const v51Path=new URL('./fullrun-v310-no-recharge-v51.mjs',import.meta.url);
const v51StagePath=new URL('./.generated-fullrun-v310-no-recharge-v52-v51stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);
const gamePath=new URL('../src/game-v310.js',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v52 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v52 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v52 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v52 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v52 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V50's late body/spirit evidence reached realm33 and exposed a second independent high-tier
// logistics defect. Each legal Mahayana essence costs exactly 2 origin crystals + 1 heaven-vein
// marrow + 1 world-essence dew + 1 unity essence and may be crafted in either 界源海 or 天穹祖脉.
// The inherited runner bought/crafted one copy at a time. Body and spirit therefore repeated the
// same 归一圣墟 <-> 界源海 effectiveRisk~.831 route about five times for the realm33 requirement.
// V52 preserves the exact five-copy requirement and every per-copy ingredient/action/day/RNG rule.
// It only batches the identical normal acquisitions, carries the exact stock to the least-risk
// reachable legal craft site, and performs the same legal craft action `missing` times in place.
// A failed Mahayana breakthrough consumes the five essences as before, so the next prepareMajor()
// must fund and craft a complete new batch under the same rules.
let v51=fs.readFileSync(v51Path,'utf8');
v51=replaceOnce(
 v51,
 "await import(finalRunnerPath.href+'?v51final='+Date.now());",
 "// v52 executes after exact Mahayana-essence acquisition/craft batching.",
 'suppress v51 final gameplay auto-import'
);
fs.writeFileSync(v51StagePath,v51);
const staged=spawnSync(process.execPath,['--check',v51StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v52 staged V51 syntax check failed: '+(staged.stderr||staged.stdout||'unknown syntax error'));
await import(v51StagePath.href+'?v52stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v52 did not obtain V51 final runner');

const game=fs.readFileSync(gamePath,'utf8');
if(!game.includes("if(!['界源海','天穹祖脉'].includes(p.location)&&!force)return {ok:false,reason:'location'}"))throw new Error('V3.10 v52 candidate Mahayana craft locations drifted');
if(!game.includes("const cost={'mat-v38-origin-crystal':2,'mat-v38-heaven-vein-marrow':1,'mat-v38-world-essence-dew':1,'mat-v37-unity-essence':1}"))throw new Error('V3.10 v52 candidate Mahayana ingredient cost drifted');
if(!game.includes("if(i===33)return {kind:'大乘证道',mahayanaEssence:5"))throw new Error('V3.10 v52 candidate realm33 five-Mahayana-essence gate drifted');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const batchedMahayana=`function chooseMahayanaCraftSite(){
 const candidates=['界源海','天穹祖脉'];
 const here=state().player.location;
 if(candidates.includes(here))return {dest:here,score:-1,profile:{maxRisk:0,totalRisk:0,maxCeiling:state().player.realmIndex,majorGap:0,rawGap:0},path:[]};
 let best=null;
 for(const dest of candidates){
  const path=findPath(here,dest);if(!path)continue;
  const profile=pathRiskProfile(path,here);
  const travelDays=path.reduce((sum,r)=>sum+Math.max(0,Number(r?.days)||0),0);
  const score=(profile.majorGap||0)*100000+(profile.rawGap||0)*5000+(profile.maxRisk||0)*500+(profile.totalRisk||0)*100+travelDays;
  if(!best||score<best.score)best={dest,score,profile,path};
 }
 return best;
}
function ensureMahayanaEssence(n){
 const current=materialCount('mat-v38-mahayana-essence');
 if(current>=n)return;
 ensureOrigin(35);ensureAuthority(10);
 const missing=n-current;
 const originNeed=2*missing,marrowNeed=missing,dewNeed=missing,unityNeed=missing;
 tryAuctionMaterial('mat-v38-origin-crystal',originNeed,160*missing);ensureNamed('mat-v38-origin-crystal',originNeed);
 tryAuctionMaterial('mat-v38-heaven-vein-marrow',marrowNeed,160*missing);ensureNamed('mat-v38-heaven-vein-marrow',marrowNeed);
 tryAuctionMaterial('mat-v38-world-essence-dew',dewNeed,160*missing);ensureNamed('mat-v38-world-essence-dew',dewNeed);
 ensureUnityEssence(unityNeed);
 if(materialCount('mat-v38-origin-crystal')<originNeed||materialCount('mat-v38-heaven-vein-marrow')<marrowNeed||materialCount('mat-v38-world-essence-dew')<dewNeed||materialCount('mat-v37-unity-essence')<unityNeed)fail('mahayana-essence-reserve-lost',{target:n,current,missing,originNeed,origin:materialCount('mat-v38-origin-crystal'),marrowNeed,marrow:materialCount('mat-v38-heaven-vein-marrow'),dewNeed,dew:materialCount('mat-v38-world-essence-dew'),unityNeed,unity:materialCount('mat-v37-unity-essence'),location:state().player.location});
 ensureLightbodyStock(16);
 const site=chooseMahayanaCraftSite();
 if(!site)fail('mahayana-essence-location-unreachable',{target:n,current,missing,from:state().player.location});
 console.log('V310_FULLRUN_V52_MAHAYANA_READY',JSON.stringify({target:n,current,missing,origin:materialCount('mat-v38-origin-crystal'),marrow:materialCount('mat-v38-heaven-vein-marrow'),dew:materialCount('mat-v38-world-essence-dew'),unity:materialCount('mat-v37-unity-essence'),from:state().player.location,dest:site.dest,score:Number(site.score.toFixed?.(2)??site.score),profile:site.profile,pills:lightbodyPillCount(),actions}));
 if(state().player.location!==site.dest&&!goTo(site.dest))fail('mahayana-essence-location-travel-blocked',{target:n,current,missing,site});
 for(let k=0;k<missing;k++){
  const before=materialCount('mat-v38-mahayana-essence');
  const r=spendAction('craft-mahayana-essence',()=>invoke('v38CraftMahayanaEssence'));heal();
  if(!r?.ok||materialCount('mat-v38-mahayana-essence')<=before)fail('mahayana-essence-craft-blocked',{result:r,target:n,current:materialCount('mat-v38-mahayana-essence'),batchMissing:missing,index:k,site:site.dest});
 }
 console.log('V310_FULLRUN_V52_MAHAYANA_BATCH',JSON.stringify({target:n,count:materialCount('mat-v38-mahayana-essence'),crafted:missing,location:state().player.location,actions}));
}`;

runner=replaceFunction(runner,'function ensureMahayanaEssence(',batchedMahayana,'batch exact realm33 Mahayana essence ingredients and crafts');

if(!runner.includes('function chooseMahayanaCraftSite()'))throw new Error('V3.10 v52 Mahayana craft-site selector missing');
if(!runner.includes("const candidates=['界源海','天穹祖脉'];"))throw new Error('V3.10 v52 exact legal Mahayana craft sites missing');
if(!runner.includes('V310_FULLRUN_V52_MAHAYANA_READY')||!runner.includes('V310_FULLRUN_V52_MAHAYANA_BATCH'))throw new Error('V3.10 v52 Mahayana batching evidence missing');
if(!runner.includes("const originNeed=2*missing,marrowNeed=missing,dewNeed=missing,unityNeed=missing;"))throw new Error('V3.10 v52 exact per-copy ingredient multiplier missing');
if(!runner.includes("tryAuctionMaterial('mat-v38-origin-crystal',originNeed,160*missing)"))throw new Error('V3.10 v52 batched origin-crystal normal auction patience missing');
if(!runner.includes("tryAuctionMaterial('mat-v38-heaven-vein-marrow',marrowNeed,160*missing)"))throw new Error('V3.10 v52 batched marrow normal auction patience missing');
if(!runner.includes("tryAuctionMaterial('mat-v38-world-essence-dew',dewNeed,160*missing)"))throw new Error('V3.10 v52 batched world-dew normal auction patience missing');
if(!runner.includes("ensureUnityEssence(unityNeed);"))throw new Error('V3.10 v52 exact unity-essence input missing');
if(!runner.includes("spendAction('craft-mahayana-essence',()=>invoke('v38CraftMahayanaEssence'))"))throw new Error('V3.10 v52 normal Mahayana gameplay craft missing');
if(!runner.includes('V310_FULLRUN_V51_ORIGIN_SITE'))throw new Error('V3.10 v52 lost V51 safe origin-site selection');
if(!runner.includes('V310_FULLRUN_V50_ESSENCE_READY')||!runner.includes('V310_FULLRUN_V50_UNITY_SEED_BATCH'))throw new Error('V3.10 v52 lost V50 reserve-aware unity retry');
if(!runner.includes('V310_FULLRUN_V48_UNITY_SITE'))throw new Error('V3.10 v52 lost V48 safe ordinary unity site');
if(!runner.includes('V310_FULLRUN_V45_ESCAPE_OPTIONS'))throw new Error('V3.10 v52 lost V45 effect-aware escape');
if(!runner.includes('V310_FULLRUN_V41_RISK_PROBE'))throw new Error('V3.10 v52 lost corrected route risk mapping');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-v38-mahayana-essence'")||runner.includes("v33AddMaterial('mat-v38-origin-crystal'")||runner.includes("v33AddMaterial('mat-v38-heaven-vein-marrow'")||runner.includes("v33AddMaterial('mat-v38-world-essence-dew'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v52 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v52 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V52_FINAL_RUNNER_PASS '+JSON.stringify({realm33ExactMahayanaEssences:5,perCopyOriginCrystals:2,perCopyHeavenVeinMarrow:1,perCopyWorldEssenceDew:1,perCopyUnityEssence:1,legalCraftSites:['界源海','天穹祖脉'],riskAwareCraftSite:true,exactBatchingOnly:true,oneCraftEntryPerRequestedBatch:true,failedBreakthroughRequiresNewFullBatch:true,v51OriginSitePreserved:true,v50ReserveAwareUnityRetryPreserved:true,normalMarketAndGameplayActionsOnly:true,enemyStatsUnchanged:true,routeRiskUnchanged:true,fleeChanceUnchanged:true,pillEffectsUnchanged:true,marketPricesAndStockCadenceUnchanged:true,craftDaysCostYieldUnchanged:true,rngUnchanged:true,deathRiskUnchanged:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v52final='+Date.now());
