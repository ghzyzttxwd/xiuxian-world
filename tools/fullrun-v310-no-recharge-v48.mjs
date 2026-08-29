import fs from 'fs';
import {spawnSync} from 'child_process';

const v47Path=new URL('./fullrun-v310-no-recharge-v47.mjs',import.meta.url);
const v47StagePath=new URL('./.generated-fullrun-v310-no-recharge-v48-v47stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v48 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v48 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v48 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v48 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v48 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V47 removed the per-attempt market commute, but flame's completed artifact exposed a second,
// independent routing defect. v37IntegrateUnity is legal in 天衡战城, 万象法坛 and 归一圣墟,
// while the inherited goAny() simply picks the first reachable candidate. The flame runner had already
// reached 天衡战城, yet was ordered onward through 万象法坛 to 归一圣墟 and died on the unnecessary
// +realm travel. V48 changes only this autonomous destination choice. It reuses the already-audited
// V41/V38 public-registry risk-aware findPath/pathRiskProfile logic and chooses the safest legal unity
// site. If already standing in any legal site, it integrates there immediately. Game routes, risks,
// enemies, integration cost/yield, auction economy, pills, flee chance, RNG and death rules are unchanged.
let v47=fs.readFileSync(v47Path,'utf8');
v47=replaceOnce(
 v47,
 "await import(finalRunnerPath.href+'?v47final='+Date.now());",
 "// v48 executes the final runner after safe legal unity-site selection.",
 'suppress v47 final gameplay auto-import'
);
fs.writeFileSync(v47StagePath,v47);
const staged=spawnSync(process.execPath,['--check',v47StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v48 staged V47 syntax check failed: '+(staged.stderr||staged.stdout||'unknown syntax error'));
await import(v47StagePath.href+'?v48stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v48 did not obtain V47 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const safeUnity=`function chooseUnityIntegrationSite(){
 const candidates=['天衡战城','万象法坛','归一圣墟'];
 const here=state().player.location;
 if(candidates.includes(here))return {dest:here,score:-1,profile:{maxRisk:0,totalRisk:0,maxCeiling:state().player.realmIndex,majorGap:0,rawGap:0},path:[]};
 let best=null;
 for(const dest of candidates){
  const path=findPath(here,dest);if(!path)continue;
  const profile=pathRiskProfile(path,here);
  const travelDays=path.reduce((n,r)=>n+Math.max(0,Number(r?.days)||0),0);
  const score=(profile.majorGap||0)*100000+(profile.rawGap||0)*5000+(profile.maxRisk||0)*500+(profile.totalRisk||0)*100+travelDays;
  if(!best||score<best.score)best={dest,score,profile,path};
 }
 return best;
}
function ensureUnity(n){
 ensureLaw(Math.min(35,Math.max(20,n)));ensureSwordEscapeSkill();
 let attempts=0;
 while((state().player.v37Unity||0)<n){
  if(attempts>=MAX_FARM_ACTIONS)fail('unity-deadlock',{target:n,current:state().player.v37Unity||0,attempts});
  const deficit=Math.max(1,n-(state().player.v37Unity||0));
  const batch=Math.min(8,MAX_FARM_ACTIONS-attempts,Math.max(3,Math.ceil(deficit/4)+2));
  tryAuctionMaterial('mat-v37-law-crystal',batch,120);ensureNamed('mat-v37-law-crystal',batch);
  tryAuctionMaterial('mat-v37-soul-covenant-stone',batch,160);ensureNamed('mat-v37-soul-covenant-stone',batch);
  ensureLightbodyStock(16);
  const site=chooseUnityIntegrationSite();
  if(!site)fail('unity-location-unreachable',{target:n,batch,current:state().player.v37Unity||0,from:state().player.location});
  console.log('V310_FULLRUN_V48_UNITY_SITE',JSON.stringify({target:n,current:state().player.v37Unity||0,from:state().player.location,dest:site.dest,score:Number(site.score.toFixed?.(2)??site.score),profile:site.profile,actions}));
  if(state().player.location!==site.dest&&!goTo(site.dest))fail('unity-location-travel-blocked',{target:n,batch,current:state().player.v37Unity||0,site});
  let used=0;
  while((state().player.v37Unity||0)<n&&used<batch){
   used++;attempts++;
   const before=state().player.v37Unity||0;
   const r=spendAction('integrate-unity',()=>invoke('v37IntegrateUnity'));heal();
   if(!r?.ok||(state().player.v37Unity||0)<=before)fail('unity-action-blocked',{result:r,target:n,before,after:state().player.v37Unity||0,attempts,batch,site:site.dest});
  }
  console.log('V310_FULLRUN_V47_UNITY_BATCH',JSON.stringify({target:n,current:state().player.v37Unity||0,batch,used,attempts,pills:lightbodyPillCount(),location:state().player.location,actions}));
 }
}`;
runner=replaceFunction(runner,'function ensureUnity(',safeUnity,'risk-aware legal unity integration site');

if(!runner.includes('function chooseUnityIntegrationSite()'))throw new Error('V3.10 v48 unity-site selector missing');
if(!runner.includes("const candidates=['天衡战城','万象法坛','归一圣墟'];"))throw new Error('V3.10 v48 legal unity sites missing');
if(!runner.includes('V310_FULLRUN_V48_UNITY_SITE'))throw new Error('V3.10 v48 unity-site evidence missing');
if(!runner.includes('pathRiskProfile(path,here)'))throw new Error('V3.10 v48 corrected risk profile not used for destination choice');
if(!runner.includes("if(candidates.includes(here))return {dest:here"))throw new Error('V3.10 v48 in-place legal integration preference missing');
if(!runner.includes('V310_FULLRUN_V47_UNITY_BATCH'))throw new Error('V3.10 v48 lost V47 ordinary unity minibatch');
if(!runner.includes('V310_FULLRUN_V46_UNITY_BATCH'))throw new Error('V3.10 v48 lost V46 seed minibatch');
if(!runner.includes("if(tryRelicAuction(n,96))return;"))throw new Error('V3.10 v48 lost V46 relic auction patience');
if(!runner.includes('V310_FULLRUN_V45_ESCAPE_OPTIONS'))throw new Error('V3.10 v48 lost V45 effect-aware escape');
if(!runner.includes('V310_FULLRUN_V44_SECRET_ROTATED'))throw new Error('V3.10 v48 lost V44 secret rotation guard');
if(!runner.includes('V310_FULLRUN_V41_RISK_PROBE'))throw new Error('V3.10 v48 lost corrected route risk mapping');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-v37-law-crystal'")||runner.includes("v33AddMaterial('mat-v37-soul-covenant-stone'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v48 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v48 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V48_FINAL_RUNNER_PASS '+JSON.stringify({unitySites:['天衡战城','万象法坛','归一圣墟'],riskAwareUnityDestination:true,inPlaceUnityPreferred:true,ordinaryUnityMiniBatchPreserved:true,unitySeedMiniBatchPreserved:true,relicAuction96Preserved:true,normalMarketAndAuctionOnly:true,enemyStatsUnchanged:true,routeRiskUnchanged:true,integrationCostAndYieldUnchanged:true,fleeChanceUnchanged:true,pillEffectsUnchanged:true,rngUnchanged:true,deathRiskUnchanged:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v48final='+Date.now());
