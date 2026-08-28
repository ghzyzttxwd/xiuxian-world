import fs from 'fs';
import {spawnSync} from 'child_process';

const v35Path=new URL('./fullrun-v310-no-recharge-v35.mjs',import.meta.url);
const v35StagePath=new URL('./.generated-fullrun-v310-no-recharge-v36-v35stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v36 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v36 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function replaceFirstGoAnyInFunction(src,signature,replacement,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v36 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v36 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v36 function-close miss: '+label);
 const fn=src.slice(start,end+1);
 const matches=[...fn.matchAll(/goAny\(\[[^\]]+\]\)/g)];
 if(matches.length!==1)throw new Error('V3.10 v36 expected one refining goAny in '+label+', got '+matches.length+' :: '+fn.slice(0,800));
 const m=matches[0],patched=fn.slice(0,m.index)+replacement+fn.slice(m.index+m[0].length);
 return src.slice(0,start)+patched+src.slice(end+1);
}

// V35 proved the new paid beast-material route by moving all four seeds beyond the old realm13
// blocker. Its four artifacts then exposed three independent autonomous-player defects:
// 1) body reached realm14 with 2/3 insight, but the runner spent years waiting only for an extremely
//    conservative secret-realm location even though the normal game allows 3 relic fragments -> 1
//    insight and V34 already provides a paid normal relic auction route.
// 2) spirit/flame reached realm20/25, then craftNascentEssence/craftDeificationEssence failed because
//    the runner funded the recipe BEFORE travelling to the refining region; route fees could leave
//    11/12 or 24/25 stones at the final click.
// 3) sword reached realm22, failed two flee rolls against a realm23 incidental enemy, fell to 34% HP,
//    then V33's two-attempt bound forced it to fight the higher-major-realm enemy while already hurt.
//
// V36 changes runner strategy only. Secret realms remain first-choice insight; after a bounded period
// without a safe realm, the runner buys three relics through the existing V3.5 auction and clicks the
// real [data-relic] UI. Refining travel is funded for route fees PLUS the unchanged recipe stone cost.
// Structurally overmatched encounters may make up to six normal flee attempts instead of being forced
// into a low-HP fight after two. No resource grant, price/drop/enemy/flee chance, recipe cost, realm
// requirement, RNG, time cost or runtime game rule is changed.
let v35=fs.readFileSync(v35Path,'utf8');
v35=replaceOnce(
 v35,
 "await import(finalRunnerPath.href+'?v35final='+Date.now());",
 "// v36 executes the final runner after evidence-driven insight/craft/escape routing fixes.",
 'suppress v35 final auto-import'
);
fs.writeFileSync(v35StagePath,v35);
await import(v35StagePath.href+'?v36stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v36 did not obtain v35 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

// --- 1. Paid relic->insight fallback after prolonged absence of a safe secret realm. ---
runner=replaceOnce(
 runner,
 "function ensureInsight(n){if(state().player.insight>=n)return;let guard=0;while(state().player.insight<n){",
 "function ensureInsight(n){if(state().player.insight>=n)return;let guard=0,paidInsightWait=0;while(state().player.insight<n){",
 'track bounded wait before paid insight fallback'
);
const unsafeBefore="if(sr&&!sr.cleared&&!safe&&regionalIncidentalCeiling>state().player.realmIndex-3)console.log('V310_FULLRUN_SECRET_SKIP_RISK',JSON.stringify({location:sr.location,guardianThreat:Number(sr.threat)||0,regionalIncidentalCeiling,playerRealm:state().player.realmIndex,actions}));if(!safe){";
const unsafeAfter=`if(sr&&!sr.cleared&&!safe&&regionalIncidentalCeiling>state().player.realmIndex-3)console.log('V310_FULLRUN_SECRET_SKIP_RISK',JSON.stringify({location:sr.location,guardianThreat:Number(sr.threat)||0,regionalIncidentalCeiling,playerRealm:state().player.realmIndex,actions}));if(!safe){
 if(state().player.realmIndex>=14&&++paidInsightWait>=60){
  const beforePaid=state().player.insight||0;
  if(tryRelicAuction(3,24)){
   spendAction('decipher-paid-auction-relic-ui',()=>{const b=dom.window.document.querySelector('[data-relic]');if(!b)fail('paid-relic-decipher-ui-missing',{target:n,relicFragments:state().player.relicFragments,location:state().player.location,secretRealm:state().world.secretRealm||null});b.click()});
   if((state().player.insight||0)<=beforePaid)fail('paid-relic-decipher-no-insight',{target:n,before:beforePaid,after:state().player.insight,relicFragments:state().player.relicFragments});
   console.log('V310_FULLRUN_INSIGHT',JSON.stringify({source:'paid-auction-relic',insight:state().player.insight,target:n,relicFragments:state().player.relicFragments,actions}));
   paidInsightWait=0;
   continue;
  }
  paidInsightWait=0;
 }`;
runner=replaceOnce(runner,unsafeBefore,unsafeAfter,'use normal auction relics when safe insight realm does not arrive');

// --- 2. Preserve recipe stones across travel to refining locations. ---
// This helper recalculates route cost if ensureStones() itself relocated the player to a work city.
// The three historical ensure* functions have evolved in earlier runner layers, so patch by function
// scope rather than assuming their complete minified text is still identical to the base runner.
const goAnyAnchor="function goAny(candidates){for(const x of candidates){if(goTo(x))return x}return null}";
const goAnyFunded=`function goAny(candidates){for(const x of candidates){if(goTo(x))return x}return null}
function goAnyFunded(candidates,reserve,label){
 let guard=0;
 while(++guard<=8){
  const from=state().player.location;
  let dest=null,route=null;
  for(const x of candidates){const p=findPath(from,x);if(p){dest=x;route=p;break}}
  if(!dest)return null;
  const fee=(route||[]).reduce((sum,r)=>sum+Math.max(0,Number(r.fee)||0),0);
  if(state().player.spiritStones<reserve+fee){ensureStones(reserve+fee);continue}
  if(!goTo(dest))return null;
  if(state().player.spiritStones>=reserve){console.log('V310_FULLRUN_FUNDED_ROUTE',JSON.stringify({label,dest,reserve,stones:state().player.spiritStones,actions}));return dest}
 }
 fail('funded-route-loop',{label,candidates,reserve,location:state().player.location,stones:state().player.spiritStones});
}`;
runner=replaceOnce(runner,goAnyAnchor,goAnyFunded,'add route-fee-aware refining travel helper');
runner=replaceFirstGoAnyInFunction(runner,'function ensureCore(',"goAnyFunded(['赤霞谷','落星矿脉','古河遗迹'],6,'core')",'ensureCore');
runner=replaceFirstGoAnyInFunction(runner,'function ensureNascent(',"goAnyFunded(['古河遗迹','玄阴禁地'],12,'nascent')",'ensureNascent');
runner=replaceFirstGoAnyInFunction(runner,'function ensureDeification(',"goAnyFunded(['古河遗迹','玄阴禁地'],25,'deification')",'ensureDeification');

// --- 3. Do not force a wounded lower-major-realm player to fight after only two failed escapes. ---
runner=replaceOnce(
 runner,
 "const overmatchFlee=structurallyOvermatched&&hpRatio>=.38&&fleeAttempts<2;",
 "const overmatchFlee=structurallyOvermatched&&fleeAttempts<6;",
 'allow additional normal flee attempts against structurally overmatched enemies'
);

// Machine-verifiable strategy invariants.
if(!runner.includes('let guard=0,paidInsightWait=0;'))throw new Error('V3.10 v36 paid insight wait state missing');
if(!runner.includes("source:'paid-auction-relic'"))throw new Error('V3.10 v36 paid relic insight evidence missing');
if(!runner.includes("decipher-paid-auction-relic-ui"))throw new Error('V3.10 v36 normal relic UI fallback missing');
if(!runner.includes("tryRelicAuction(3,24)"))throw new Error('V3.10 v36 normal relic auction fallback missing');
if(!runner.includes('function goAnyFunded(candidates,reserve,label)'))throw new Error('V3.10 v36 funded travel helper missing');
if(!runner.includes("goAnyFunded(['赤霞谷','落星矿脉','古河遗迹'],6,'core')"))throw new Error('V3.10 v36 core reserve missing');
if(!runner.includes("goAnyFunded(['古河遗迹','玄阴禁地'],12,'nascent')"))throw new Error('V3.10 v36 nascent reserve missing');
if(!runner.includes("goAnyFunded(['古河遗迹','玄阴禁地'],25,'deification')"))throw new Error('V3.10 v36 deification reserve missing');
if(!runner.includes('const overmatchFlee=structurallyOvermatched&&fleeAttempts<6;'))throw new Error('V3.10 v36 overmatched escape budget missing');
if(runner.includes('const overmatchFlee=structurallyOvermatched&&hpRatio>=.38&&fleeAttempts<2;'))throw new Error('V3.10 v36 stale two-flee overmatch policy survived');
if(!runner.includes("if(tryBeastMarket(n,24))return;"))throw new Error('V3.10 v36 lost v35 paid beast route');
if(!runner.includes("if(tryRelicAuction(n,24))return;"))throw new Error('V3.10 v36 lost v34 relic route');
if(!runner.includes('V310_FULLRUN_V33_COMBAT_POLICY'))throw new Error('V3.10 v36 lost combat diagnostics');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-beast-material'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v36 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v36 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V36_FINAL_RUNNER_PASS '+JSON.stringify({safeSecretInsightFirst:true,paidAuctionRelicInsightFallback:true,paidInsightWaitActions:60,normalRelicUi:true,coreStoneReserve:6,nascentStoneReserve:12,deificationStoneReserve:25,routeFeesFundedBeforeCraft:true,overmatchedFleeAttempts:6,fleeChanceUnchanged:true,recipeCostsUnchanged:true,enemyStatsUnchanged:true,pricesAndDropsUnchanged:true,rngUnchanged:true,v35BeastMarketPreserved:true,v34RelicAuctionPreserved:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v36final='+Date.now());
