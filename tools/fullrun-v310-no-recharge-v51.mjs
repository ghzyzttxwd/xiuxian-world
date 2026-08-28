import fs from 'fs';
import {spawnSync} from 'child_process';

const v50Path=new URL('./fullrun-v310-no-recharge-v50.mjs',import.meta.url);
const v50StagePath=new URL('./.generated-fullrun-v310-no-recharge-v51-v50stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v51 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v51 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v51 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v51 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v51 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V50 flame reached realm33 and proved the reserve-aware unity retry chain. Its next failure exposed
// another destination-order defect: v38ContemplateOrigin is legal in 界源海, 天穹祖脉, 人界议庭 and
// 九霄劫台, but the inherited goAny() checked 九霄 -> 天穹 -> 议庭 -> 界源. The runner travelled from
// 归一圣墟 through the already-legal 界源海, refused to stop there, then died on the unnecessary second
// leg to 天穹祖脉. V51 changes only autonomous site choice. It reuses the corrected public-registry
// findPath/pathRiskProfile logic, prefers an already-occupied legal site, otherwise chooses the least-risk
// reachable legal origin site and stays there until the requested origin insight is reached. Origin tiers,
// action days, gains, backlash, routes, enemies, pills, flee, progression requirements and RNG are unchanged.
let v50=fs.readFileSync(v50Path,'utf8');
v50=replaceOnce(
 v50,
 "await import(finalRunnerPath.href+'?v50final='+Date.now());",
 "// v51 executes after risk-aware legal origin-contemplation site selection.",
 'suppress v50 final gameplay auto-import'
);
fs.writeFileSync(v50StagePath,v50);
const staged=spawnSync(process.execPath,['--check',v50StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v51 staged V50 syntax check failed: '+(staged.stderr||staged.stdout||'unknown syntax error'));
await import(v50StagePath.href+'?v51stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v51 did not obtain V50 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const safeOrigin=`function chooseOriginContemplationSite(){
 const candidates=['界源海','天穹祖脉','人界议庭','九霄劫台'];
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
function ensureOrigin(n){
 ensureLaw(160);ensureUnity(100);
 if((state().player.v38OriginInsight||0)>=n)return;
 ensureSwordEscapeSkill();
 let site=chooseOriginContemplationSite();
 if(!site)fail('origin-source-unreachable',{target:n,from:state().player.location});
 if(state().player.location!==site.dest){
  ensureLightbodyStock(16);
  site=chooseOriginContemplationSite();
  if(!site)fail('origin-source-unreachable-after-supply',{target:n,from:state().player.location});
 }
 console.log('V310_FULLRUN_V51_ORIGIN_SITE',JSON.stringify({target:n,current:state().player.v38OriginInsight||0,from:state().player.location,dest:site.dest,score:Number(site.score.toFixed?.(2)??site.score),profile:site.profile,pills:lightbodyPillCount(),actions}));
 if(state().player.location!==site.dest&&!goTo(site.dest))fail('origin-site-travel-blocked',{target:n,site});
 let guard=0;
 while((state().player.v38OriginInsight||0)<n){
  if(++guard>MAX_FARM_ACTIONS)fail('origin-insight-deadlock',{target:n,current:state().player.v38OriginInsight||0,site:site.dest});
  const before=state().player.v38OriginInsight||0;
  const r=spendAction('contemplate-origin',()=>invoke('v38ContemplateOrigin'));heal();
  if(!r?.ok||(state().player.v38OriginInsight||0)<=before)fail('origin-action-blocked',{result:r,target:n,before,after:state().player.v38OriginInsight||0,site:site.dest});
 }
}`;
runner=replaceFunction(runner,'function ensureOrigin(',safeOrigin,'risk-aware legal origin contemplation site');

if(!runner.includes('function chooseOriginContemplationSite()'))throw new Error('V3.10 v51 origin-site selector missing');
if(!runner.includes("const candidates=['界源海','天穹祖脉','人界议庭','九霄劫台'];"))throw new Error('V3.10 v51 exact legal origin sites missing');
if(!runner.includes('V310_FULLRUN_V51_ORIGIN_SITE'))throw new Error('V3.10 v51 origin-site evidence missing');
if(!runner.includes('pathRiskProfile(path,here)'))throw new Error('V3.10 v51 corrected route risk profile not used');
if(!runner.includes("if(candidates.includes(here))return {dest:here"))throw new Error('V3.10 v51 in-place legal origin preference missing');
if(!runner.includes('V310_FULLRUN_V50_ESSENCE_READY')||!runner.includes('V310_FULLRUN_V50_UNITY_SEED_BATCH'))throw new Error('V3.10 v51 lost V50 reserve-aware unity retry');
if(!runner.includes('V310_FULLRUN_V48_UNITY_SITE'))throw new Error('V3.10 v51 lost V48 safe ordinary unity site');
if(!runner.includes('V310_FULLRUN_V45_ESCAPE_OPTIONS'))throw new Error('V3.10 v51 lost V45 effect-aware escape');
if(!runner.includes('V310_FULLRUN_V41_RISK_PROBE'))throw new Error('V3.10 v51 lost corrected route risk mapping');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-v38-mahayana-essence'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v51 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v51 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V51_FINAL_RUNNER_PASS '+JSON.stringify({originSites:['界源海','天穹祖脉','人界议庭','九霄劫台'],riskAwareOriginDestination:true,inPlaceOriginPreferred:true,stayAtChosenSiteUntilTarget:true,originActionRulesUnchanged:true,v50ReserveAwareUnityRetryPreserved:true,enemyStatsUnchanged:true,routeRiskUnchanged:true,fleeChanceUnchanged:true,pillEffectsUnchanged:true,originTierDaysGainBacklashUnchanged:true,rngUnchanged:true,deathRiskUnchanged:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v51final='+Date.now());
