import fs from 'fs';
import {spawnSync} from 'child_process';

const v33Path=new URL('./fullrun-v310-no-recharge-v33.mjs',import.meta.url);
const v33StagePath=new URL('./.generated-fullrun-v310-no-recharge-v34-v33stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v34 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v34 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V33 reached 金丹圆满 through the real game, then exposed a route-selection defect in ensureRelic():
// the inherited runner still ignored V3.5's legitimate 苍梧拍卖场 relic-fragment listing and instead
// repeatedly explored 古河遗迹. At realm18 that region can spawn realm21 ordinary enemies, turning a
// mandatory breakthrough-material routine into an avoidable +3-realm combat lottery.
//
// V34 changes only autonomous route selection. From the game's existing minRealm 14 auction access,
// the runner first buys normal mat-relic-fragment lots with earned spirit stones and waits for normal
// 30-day auction refreshes when necessary. If that route is unavailable after a bounded number of
// cycles, the inherited dangerous exploration route remains as a fallback. Auction stock, price,
// refresh cadence, RNG, material costs/yields, enemy stats, breakthrough requirements and runtime game
// state rules are unchanged.
let v33=fs.readFileSync(v33Path,'utf8');
v33=replaceOnce(
 v33,
 "await import(finalRunnerPath.href+'?v33final='+Date.now());",
 "// v34 executes the final runner after normal-auction-first relic routing.",
 'suppress v33 final auto-import'
);
fs.writeFileSync(v33StagePath,v33);
await import(v33StagePath.href+'?v34stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v34 did not obtain v33 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const relicBefore="function ensureRelic(n){if(state().player.relicFragments>=n)return;const loc=goAny(['古河遗迹','玄阴禁地']);if(!loc)fail('relic-source-unreachable',{target:n});let guard=0;while(state().player.relicFragments<n){if(++guard>MAX_FARM_ACTIONS)fail('relic-farm-deadlock',{target:n,location:loc});act('explore',true)}}";
const relicAfter=`function tryRelicAuction(n,maxCycles=24){
 if((state().player.relicFragments||0)>=n)return true;
 if(state().player.realmIndex<14)return false;
 if(!goTo('苍梧郡城'))return false;
 let cycles=0;
 while((state().player.relicFragments||0)<n){
  const lots=Object.values(invoke('v35ListingRegistry')||{}).filter(x=>x&&x.shopId==='shop-cangwu-auction'&&x.kind==='material'&&x.refId==='mat-relic-fragment'&&Number(x.stock||0)>0);
  if(lots.length){
   const lot=lots[0],q=invoke('v35Quote',lot.id,'buy',1);
   if(q&&q.total>0){
    earnStones(q.total+20);
    if(!goTo('苍梧郡城'))fail('relic-auction-return-unreachable',{target:n});
    const before=state().player.relicFragments||0;
    const r=spendAction('auction-buy:mat-relic-fragment',()=>invoke('v35Trade',lot.id,'buy',1));
    if(r?.ok&&(state().player.relicFragments||0)>before){
     console.log('V310_FULLRUN_RELIC',JSON.stringify({source:'auction',count:state().player.relicFragments,target:n,price:q.total,cycle:invoke('v35EconomySnapshot').auctionCycle,actions}));
     continue;
    }
   }
  }
  if(cycles++>=maxCycles)break;
  const cycle=Number(invoke('v35EconomySnapshot').auctionCycle)||0;
  let wait=0;
  while((Number(invoke('v35EconomySnapshot').auctionCycle)||0)===cycle){
   if(++wait>35)fail('relic-auction-cycle-wait-loop',{target:n,cycle,current:state().player.relicFragments||0});
   act('rest',false);
  }
 }
 return (state().player.relicFragments||0)>=n;
}
function ensureRelic(n){
 if((state().player.relicFragments||0)>=n)return;
 if(tryRelicAuction(n,24))return;
 const loc=goAny(['古河遗迹','玄阴禁地']);
 if(!loc)fail('relic-source-unreachable',{target:n});
 let guard=0;
 while((state().player.relicFragments||0)<n){
  if(++guard>MAX_FARM_ACTIONS)fail('relic-farm-deadlock',{target:n,location:loc,current:state().player.relicFragments||0,auctionAttempted:true});
  act('explore',true);
 }
}`;
runner=replaceOnce(runner,relicBefore,relicAfter,'prefer normal auction before dangerous relic exploration');

if(!runner.includes("function tryRelicAuction(n,maxCycles=24)"))throw new Error('V3.10 v34 relic auction strategy missing');
if(!runner.includes("x.refId==='mat-relic-fragment'"))throw new Error('V3.10 v34 relic auction listing lookup missing');
if(!runner.includes("invoke('v35Trade',lot.id,'buy',1)"))throw new Error('V3.10 v34 normal trade API call missing');
if(!runner.includes("source:'auction'"))throw new Error('V3.10 v34 relic auction evidence missing');
if(!runner.includes("if(tryRelicAuction(n,24))return;"))throw new Error('V3.10 v34 auction-first relic priority missing');
if(!runner.includes("const loc=goAny(['古河遗迹','玄阴禁地']);"))throw new Error('V3.10 v34 inherited relic fallback missing');
if(!runner.includes('V310_FULLRUN_V33_COMBAT_POLICY'))throw new Error('V3.10 v34 lost v33 bounded flee policy');
if(!runner.includes("combat-escape-guard"))throw new Error('V3.10 v34 lost v25 guard-before-flee policy');
if(!runner.includes("registry.realms?.[item.realmRequirement]?.index"))throw new Error('V3.10 v34 lost v32 natal unlock lookup');
if(!runner.includes("cultivateFull();prepareMajor(i);prepareMinorSideGate(i);"))throw new Error('V3.10 v34 lost v32 breakthrough ordering');
if(!runner.includes('function ensureBloodContractRare(n)'))throw new Error('V3.10 v34 lost v30 legal rare route');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v34 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v34 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V34_FINAL_RUNNER_PASS '+JSON.stringify({auctionFirstRelicRouting:true,normalTradeApi:true,normalAuctionRefresh:true,earnedCurrencyOnly:true,dangerousExplorationFallbackPreserved:true,auctionStockUnchanged:true,auctionPriceUnchanged:true,auctionRefreshUnchanged:true,relicYieldUnchanged:true,enemyStatsUnchanged:true,breakthroughRequirementsUnchanged:true,rngUnchanged:true,v33CombatPolicyPreserved:true,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v34final='+Date.now());
