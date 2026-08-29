import fs from 'fs';
import {spawnSync} from 'child_process';

const v48Path=new URL('./fullrun-v310-no-recharge-v48.mjs',import.meta.url);
const v48StagePath=new URL('./.generated-fullrun-v310-no-recharge-v49-v48stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);
const gamePath=new URL('../src/game-v310.js',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v49 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v49 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v49 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v49 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v49 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V48 proved ordinary 三元归一 can and should happen at the safest of its three legal sites, but its
// flame evidence then died in prepareMajor -> ensureUnityEssence -> goTo. This is a different rule:
// the game intentionally permits 合体归一髓 crafting ONLY in 归一圣墟. We preserve that hard location
// gate. The old autonomous runner, however, acquired and crafted one essence at a time, repeatedly
// leaving the mandatory danger zone to buy the next identical ingredient set and re-entering it.
// V49 performs exact requirement batching only: prepare all normal ingredients for the requested count,
// replenish the normal route consumable, enter 归一圣墟 once, then execute the same legal craft action n
// times. At realm29 n is exactly the coreRequirements unityEssence=4. Before the realm33 five-copy
// 大乘本源髓 chain, exactly five unity essences are pre-crafted because each official Mahayana essence
// consumes exactly one. No location, cost, yield, enemy, route, economy, RNG, flee or death rule changes.
let v48=fs.readFileSync(v48Path,'utf8');
v48=replaceOnce(
 v48,
 "await import(finalRunnerPath.href+'?v48final='+Date.now());",
 "// v49 executes the final runner after exact mandatory unity-essence batching.",
 'suppress v48 final gameplay auto-import'
);
fs.writeFileSync(v48StagePath,v48);
const staged=spawnSync(process.execPath,['--check',v48StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v49 staged V48 syntax check failed: '+(staged.stderr||staged.stdout||'unknown syntax error'));
await import(v48StagePath.href+'?v49stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v49 did not obtain V48 final runner');

// Machine-check the candidate game itself before touching runner strategy. These are fixed game rules,
// not assumptions made by the harness.
const game=fs.readFileSync(gamePath,'utf8');
if(!game.includes("if(p.location!=='归一圣墟'&&!force)return {ok:false,reason:'location'}"))throw new Error('V3.10 v49 candidate no longer has mandatory 归一圣墟 unity-essence location gate');
if(!game.includes("const cost={'mat-v37-unity-seed':2,'mat-v37-law-crystal':2,'mat-v37-soul-covenant-stone':1,'mat-v36-void-essence':1}"))throw new Error('V3.10 v49 candidate unity-essence ingredient cost drifted');
if(!game.includes("if(i===29)return {kind:'合体归一',unityEssence:4"))throw new Error('V3.10 v49 candidate realm29 four-unity-essence gate drifted');
if(!game.includes("if(i===33)return {kind:'大乘证道',mahayanaEssence:5"))throw new Error('V3.10 v49 candidate realm33 five-Mahayana-essence gate drifted');
if(!game.includes("const cost={'mat-v38-origin-crystal':2,'mat-v38-heaven-vein-marrow':1,'mat-v38-world-essence-dew':1,'mat-v37-unity-essence':1}"))throw new Error('V3.10 v49 candidate Mahayana one-unity-essence ingredient cost drifted');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const batchedEssence=`function ensureUnityEssence(n){
 let guard=0;
 while(materialCount('mat-v37-unity-essence')<n){
  if(++guard>8)fail('unity-essence-loop',{target:n,current:materialCount('mat-v37-unity-essence')});
  ensureLaw(35);ensureUnity(30);
  const current=materialCount('mat-v37-unity-essence'),missing=n-current;
  if(missing<=0)return;
  ensureUnitySeeds(2*missing);
  tryAuctionMaterial('mat-v37-law-crystal',2*missing,160);ensureNamed('mat-v37-law-crystal',2*missing);
  tryAuctionMaterial('mat-v37-soul-covenant-stone',missing,240);ensureNamed('mat-v37-soul-covenant-stone',missing);
  ensureVoidEssence(missing);
  ensureLightbodyStock(16);
  console.log('V310_FULLRUN_V49_ESSENCE_PREP',JSON.stringify({target:n,current,missing,seeds:materialCount('mat-v37-unity-seed'),law:materialCount('mat-v37-law-crystal'),covenant:materialCount('mat-v37-soul-covenant-stone'),voidEssence:materialCount('mat-v36-void-essence'),pills:lightbodyPillCount(),from:state().player.location,actions}));
  if(!goTo('归一圣墟'))fail('unity-essence-location-unreachable',{target:n,current,missing});
  for(let k=0;k<missing;k++){
   const before=materialCount('mat-v37-unity-essence');
   const r=spendAction('craft-unity-essence',()=>invoke('v37CraftUnityEssence'));
   if(!r?.ok||materialCount('mat-v37-unity-essence')<=before)fail('unity-essence-craft-blocked',{result:r,target:n,current:materialCount('mat-v37-unity-essence'),batchMissing:missing,index:k});
  }
  console.log('V310_FULLRUN_V49_ESSENCE_BATCH',JSON.stringify({target:n,count:materialCount('mat-v37-unity-essence'),crafted:missing,location:state().player.location,actions}));
 }
}`;
runner=replaceFunction(runner,'function ensureUnityEssence(',batchedEssence,'batch exact mandatory unity essence crafts into one 归一圣墟 entry');

// Realm33 needs exactly five 大乘本源髓 and each official recipe consumes one unity essence.
// Pre-craft those exact five before the existing Mahayana loop so its inherited ensureUnityEssence(1)
// calls become no-ops while the stocked legal ingredients are consumed one by one.
const pm=functionSpan(runner,'function prepareMajor(','prepareMajor');
let prepare=runner.slice(pm.start,pm.end+1);
const prefetchBefore="ensureNatalMarks(req.natalMarks||1);ensureMahayanaEssence(req.mahayanaEssence||5);";
const prefetchAfter="ensureNatalMarks(req.natalMarks||1);ensureUnityEssence(req.mahayanaEssence||5);ensureMahayanaEssence(req.mahayanaEssence||5);";
if(!prepare.includes(prefetchBefore))throw new Error('V3.10 v49 realm33 transitive unity-essence prefetch anchor missing');
if(prepare.indexOf(prefetchBefore)!==prepare.lastIndexOf(prefetchBefore))throw new Error('V3.10 v49 realm33 prefetch anchor ambiguous');
prepare=prepare.replace(prefetchBefore,prefetchAfter);
runner=runner.slice(0,pm.start)+prepare+runner.slice(pm.end+1);

if(!runner.includes('V310_FULLRUN_V49_ESSENCE_PREP')||!runner.includes('V310_FULLRUN_V49_ESSENCE_BATCH'))throw new Error('V3.10 v49 exact essence-batch evidence missing');
if(!runner.includes("ensureUnitySeeds(2*missing);"))throw new Error('V3.10 v49 exact 2-per-essence seed requirement missing');
if(!runner.includes("tryAuctionMaterial('mat-v37-law-crystal',2*missing,160)"))throw new Error('V3.10 v49 exact 2-per-essence law acquisition missing');
if(!runner.includes("tryAuctionMaterial('mat-v37-soul-covenant-stone',missing,240)"))throw new Error('V3.10 v49 exact 1-per-essence covenant acquisition missing');
if(!runner.includes('ensureVoidEssence(missing);'))throw new Error('V3.10 v49 exact 1-per-essence void requirement missing');
if(!runner.includes("if(!goTo('归一圣墟'))fail('unity-essence-location-unreachable'"))throw new Error('V3.10 v49 mandatory 归一圣墟 craft destination missing');
if(!runner.includes("spendAction('craft-unity-essence',()=>invoke('v37CraftUnityEssence'))"))throw new Error('V3.10 v49 normal unity essence gameplay craft missing');
if(!runner.includes(prefetchAfter))throw new Error('V3.10 v49 exact realm33 transitive unity-essence pre-craft missing');
if(!runner.includes('V310_FULLRUN_V48_UNITY_SITE'))throw new Error('V3.10 v49 lost V48 safe ordinary unity-site selection');
if(!runner.includes('V310_FULLRUN_V47_UNITY_BATCH'))throw new Error('V3.10 v49 lost V47 ordinary unity minibatch');
if(!runner.includes('V310_FULLRUN_V46_UNITY_BATCH'))throw new Error('V3.10 v49 lost V46 unity-seed minibatch');
if(!runner.includes("if(tryRelicAuction(n,96))return;"))throw new Error('V3.10 v49 lost V46 relic auction patience');
if(!runner.includes('V310_FULLRUN_V45_ESCAPE_OPTIONS'))throw new Error('V3.10 v49 lost V45 effect-aware escape');
if(!runner.includes('V310_FULLRUN_V44_SECRET_ROTATED'))throw new Error('V3.10 v49 lost V44 secret rotation guard');
if(!runner.includes('V310_FULLRUN_V41_RISK_PROBE'))throw new Error('V3.10 v49 lost corrected route risk mapping');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-v37-unity-essence'")||runner.includes("v33AddMaterial('mat-v37-unity-seed'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v49 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v49 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V49_FINAL_RUNNER_PASS '+JSON.stringify({mandatoryUnityEssenceSite:'归一圣墟',realm29ExactUnityEssences:4,realm33ExactMahayanaEssences:5,unityEssenceIngredientCostsPreserved:true,mahayanaUnityEssenceCostPreserved:true,exactBatchingOnly:true,oneCraftEntryPerRequestedBatch:true,v48SafeOrdinaryUnitySitePreserved:true,normalGameplayActionsOnly:true,enemyStatsUnchanged:true,routeRiskUnchanged:true,fleeChanceUnchanged:true,pillEffectsUnchanged:true,marketPricesAndStockCadenceUnchanged:true,rngUnchanged:true,deathRiskUnchanged:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v49final='+Date.now());
