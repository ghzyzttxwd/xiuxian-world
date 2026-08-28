import fs from 'fs';
import {spawnSync} from 'child_process';

const v52Path=new URL('./fullrun-v310-no-recharge-v52.mjs',import.meta.url);
const v52StagePath=new URL('./.generated-fullrun-v310-no-recharge-v53-v52stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v53 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v53 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v53 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v53 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v53 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V52 proved the legal high-tier chain itself is alive: spirit reached realm35 and body/flame reached
// realm33. Their action-limit evidence exposed an autonomous-economy defect rather than a gameplay
// balance defect. Mandatory auction code asks earnStones() for thousands of stones while already in
// 苍梧郡城. The inherited runner therefore works there at the default 2-4 stones/day even though the
// same character can legally commute to established work hubs (for example 天渊城 5-9/day and
// 天衡战城 6-12/day), earn the required cash, then return to the auction.
//
// V53 changes only the runner's work-location choice. Large funding requests may make a temporary,
// round-trip commute to the best safely reachable normal work hub. It first earns all route fees through
// the existing normal work action, uses the existing normal goTo()/travel path, earns the target plus
// return-fare reserve, and returns to the exact caller location before the auction/craft flow resumes.
// Small funding requests stay local. Game work yields, route fees/risks, enemies, auction prices/stock,
// refresh cadence, progression costs, action accounting, RNG and the 300k proof fuse are unchanged.
let v52=fs.readFileSync(v52Path,'utf8');
v52=replaceOnce(
 v52,
 "await import(finalRunnerPath.href+'?v52final='+Date.now());",
 "// v53 executes after temporary safe work-hub funding logistics.",
 'suppress v52 final gameplay auto-import'
);
fs.writeFileSync(v52StagePath,v52);
const staged=spawnSync(process.execPath,['--check',v52StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v53 staged V52 syntax check failed: '+(staged.stderr||staged.stdout||'unknown syntax error'));
await import(v52StagePath.href+'?v53stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v53 did not obtain V52 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const workHubFunding=`const V53_WORK_HUBS=[
 {location:'天衡战城',avg:9},
 {location:'蛮荒古城',avg:7.5},
 {location:'天渊城',avg:7},
 {location:'灵兽山',avg:7},
 {location:'云梦泽',avg:6},
 {location:'沧溟',avg:6}
];
const V53_WORK_AVG={天衡战城:9,蛮荒古城:7.5,天渊城:7,灵兽山:7,云梦泽:6,沧溟:6};
let v53WorkRelocationDepth=0;
function v53RouteFee(path){return (path||[]).reduce((sum,r)=>sum+Math.max(0,Number(r?.fee)||0),0)}
function v53RouteDays(path){return (path||[]).reduce((sum,r)=>sum+Math.max(0,Number(r?.days)||0),0)}
function v53WorkLocalUntil(target){
 let stagnant=0,last=state().player.spiritStones;
 while(state().player.spiritStones<target){
  act('work',false);
  const cur=state().player.spiritStones;
  stagnant=cur>last?0:stagnant+1;last=cur;
  if(stagnant>30)fail('stone-income-deadlock',{target,location:state().player.location,temporaryWorkHub:v53WorkRelocationDepth>0});
 }
}
function v53ChooseWorkHub(origin,target){
 const p=state().player,missing=Math.max(0,target-p.spiritStones),localAvg=Number(V53_WORK_AVG[origin]||3);
 if(missing<120)return null;
 let best=null;
 for(const row of V53_WORK_HUBS){
  if(row.location===origin||row.avg<=localAvg+.5)continue;
  const outward=findPath(origin,row.location),back=findPath(row.location,origin);
  if(!outward||!back)continue;
  const outRisk=pathRiskProfile(outward,origin),backRisk=pathRiskProfile(back,row.location);
  if((outRisk.majorGap||0)>0||(backRisk.majorGap||0)>0||(outRisk.rawGap||0)>=2||(backRisk.rawGap||0)>=2)continue;
  const travelDays=v53RouteDays(outward)+v53RouteDays(back);
  const risk=(outRisk.totalRisk||0)+(backRisk.totalRisk||0);
  const expectedSaved=missing/localAvg-missing/row.avg;
  const score=expectedSaved-travelDays*.2-risk*4;
  if(score<=0)continue;
  if(!best||score>best.score)best={...row,outward,back,outRisk,backRisk,travelDays,risk,score,localAvg,missing};
 }
 return best;
}
function earnStones(target){
 target=Math.max(0,Number(target)||0);
 if(state().player.spiritStones>=target)return;
 if(v53WorkRelocationDepth>0){v53WorkLocalUntil(target);return}
 const origin=state().player.location,hub=v53ChooseWorkHub(origin,target);
 if(!hub){v53WorkLocalUntil(target);return}
 const outwardFee=v53RouteFee(hub.outward),returnFee=v53RouteFee(hub.back);
 // Bootstrap only the legal route reserve locally. Nested goTo() funding is forced to stay local so
 // unexpected travel costs cannot recurse into another relocation.
 v53WorkLocalUntil(outwardFee+8);
 v53WorkRelocationDepth++;
 try{
  console.log('V310_FULLRUN_V53_WORK_RELOCATE',JSON.stringify({phase:'depart',origin,dest:hub.location,target,missing:hub.missing,localAvg:hub.localAvg,hubAvg:hub.avg,outwardFee,returnFee,travelDays:hub.travelDays,risk:Number(hub.risk.toFixed(4)),score:Number(hub.score.toFixed(2)),actions}));
  if(!goTo(hub.location))fail('work-hub-unreachable',{origin,dest:hub.location,target});
  // Keep enough cash that the caller still has its requested target after the return commute.
  v53WorkLocalUntil(target+returnFee+8);
  if(!goTo(origin))fail('work-hub-return-unreachable',{origin,dest:hub.location,target,stones:state().player.spiritStones});
 }finally{
  v53WorkRelocationDepth--;
 }
 if(state().player.location!==origin)fail('work-hub-return-location-desynced',{origin,actual:state().player.location,target});
 if(state().player.spiritStones<target)v53WorkLocalUntil(target);
 console.log('V310_FULLRUN_V53_WORK_RELOCATE',JSON.stringify({phase:'returned',origin,hub:hub.location,target,stones:state().player.spiritStones,actions}));
}`;

runner=replaceFunction(runner,'function earnStones(',workHubFunding,'temporarily commute large funding requests to safe higher-yield work hubs and return');

if(!runner.includes('V310_FULLRUN_V53_WORK_RELOCATE'))throw new Error('V3.10 v53 work-relocation evidence marker missing');
if(!runner.includes("{location:'天衡战城',avg:9}"))throw new Error('V3.10 v53 Tianheng normal work yield missing');
if(!runner.includes("{location:'天渊城',avg:7}"))throw new Error('V3.10 v53 Tianyuan normal work yield missing');
if(!runner.includes('if(missing<120)return null;'))throw new Error('V3.10 v53 small-request local-work guard missing');
if(!runner.includes('target+returnFee+8'))throw new Error('V3.10 v53 return-fare reserve missing');
if(!runner.includes("if(!goTo(origin))fail('work-hub-return-unreachable'"))throw new Error('V3.10 v53 exact caller-location return missing');
if(!runner.includes('pathRiskProfile(outward,origin)')||!runner.includes('pathRiskProfile(back,row.location)'))throw new Error('V3.10 v53 safe round-trip route profiling missing');
if(!runner.includes('V310_FULLRUN_V52_MAHAYANA_BATCH'))throw new Error('V3.10 v53 lost V52 Mahayana batching');
if(!runner.includes('V310_FULLRUN_V51_ORIGIN_SITE'))throw new Error('V3.10 v53 lost V51 origin-site selection');
if(!runner.includes('V310_FULLRUN_V50_ESSENCE_READY'))throw new Error('V3.10 v53 lost V50 unity reserve handling');
if(!runner.includes('V310_FULLRUN_V45_ESCAPE_OPTIONS'))throw new Error('V3.10 v53 lost V45 escape policy');
if(!runner.includes('V310_FULLRUN_V41_RISK_PROBE'))throw new Error('V3.10 v53 lost V41 route-risk mapping');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-v38-mahayana-essence'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v53 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v53 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V53_FINAL_RUNNER_PASS '+JSON.stringify({temporaryWorkHubFunding:true,callerLocationRestored:true,largeFundingThreshold:120,normalWorkActionsOnly:true,normalTravelOnly:true,roundTripRiskProfiled:true,workYieldsUnchanged:true,routeFeesAndRiskUnchanged:true,auctionPricesAndStockUnchanged:true,actionCapUnchanged:true,maxActions:Number(process.env.V310_FULLRUN_MAX_ACTIONS||180000),rngUnchanged:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v53final='+Date.now());
