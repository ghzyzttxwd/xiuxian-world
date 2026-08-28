import fs from 'fs';
import {spawnSync} from 'child_process';

const v34Path=new URL('./fullrun-v310-no-recharge-v34.mjs',import.meta.url);
const v34StagePath=new URL('./.generated-fullrun-v310-no-recharge-v35-v34stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v35 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v35 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V34 produced two independent low-realm deaths while obtaining mandatory generic 兽材 for
// 结丹灵髓, and one spirit-route death caused by runner-only over-preparation of 14 relic fragments.
// The V3 build now exposes a paid stock-4 临江坊市 beast-material listing that refreshes on the normal
// 10-day fixed-shop cycle. V35 changes autonomous route selection only: buy that legitimate listing
// first, wait through normal market cycles when needed, and retain dangerous 黑风岭/万兽山脉 farming
// as bounded fallback. For spirit inheritance, obtain the formal 3 insight normally and then preserve
// exactly the formal 5 relic fragments instead of pre-buying 9 extra fragments merely to decipher them.
let v34=fs.readFileSync(v34Path,'utf8');
v34=replaceOnce(
 v34,
 "await import(finalRunnerPath.href+'?v34final='+Date.now());",
 "// v35 executes the final runner after paid beast-market routing and exact spirit inheritance preparation.",
 'suppress v34 final auto-import'
);
fs.writeFileSync(v34StagePath,v34);
await import(v34StagePath.href+'?v35stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v35 did not obtain v34 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const beastBefore="function ensureBeast(n){if(state().player.beastMaterials>=n)return;const loc=goAny(['黑风岭','万兽山脉']);if(!loc)fail('beast-source-unreachable',{target:n});let guard=0;while(state().player.beastMaterials<n){if(++guard>MAX_FARM_ACTIONS)fail('beast-farm-deadlock',{target:n,location:loc});act('explore',true)}}";
const beastAfter=`function tryBeastMarket(n,maxCycles=24){
 if((state().player.beastMaterials||0)>=n)return true;
 if(state().player.realmIndex<10)return false;
 if(!goTo('临江城'))return false;
 let cycles=0;
 while((state().player.beastMaterials||0)<n){
  const lot=Object.values(invoke('v35ListingRegistry')||{}).find(x=>x&&x.shopId==='shop-linjiang-market'&&x.kind==='material'&&x.refId==='mat-beast-material'&&Number(x.stock||0)>0);
  if(lot){
   const need=Math.max(1,n-(state().player.beastMaterials||0)),count=Math.min(need,Number(lot.stock)||0),q=invoke('v35Quote',lot.id,'buy',count);
   if(q&&q.total>0&&count>0){
    earnStones(q.total+10);
    if(!goTo('临江城'))fail('beast-market-return-unreachable',{target:n});
    const before=state().player.beastMaterials||0;
    const r=spendAction('market-buy:mat-beast-material',()=>invoke('v35Trade',lot.id,'buy',count));
    if(r?.ok&&(state().player.beastMaterials||0)>before){
     console.log('V310_FULLRUN_BEAST',JSON.stringify({source:'linjiang-market',count:state().player.beastMaterials,target:n,bought:count,price:q.total,stockCycle:invoke('v35EconomySnapshot').stockCycle,actions}));
     continue;
    }
   }
  }
  if(cycles++>=maxCycles)break;
  const cycle=Number(invoke('v35EconomySnapshot').stockCycle)||0;
  let wait=0;
  while((Number(invoke('v35EconomySnapshot').stockCycle)||0)===cycle){
   if(++wait>14)fail('beast-market-cycle-wait-loop',{target:n,cycle,current:state().player.beastMaterials||0});
   act('rest',false);
  }
 }
 return (state().player.beastMaterials||0)>=n;
}
function ensureBeast(n){
 if((state().player.beastMaterials||0)>=n)return;
 if(tryBeastMarket(n,24))return;
 const loc=goAny(['黑风岭','万兽山脉']);
 if(!loc)fail('beast-source-unreachable',{target:n});
 let guard=0;
 while((state().player.beastMaterials||0)<n){
  if(++guard>MAX_FARM_ACTIONS)fail('beast-farm-deadlock',{target:n,location:loc,current:state().player.beastMaterials||0,marketAttempted:true});
  act('explore',true);
 }
}`;
runner=replaceOnce(runner,beastBefore,beastAfter,'prefer paid Linjiang market before dangerous generic beast farming');

const spiritBefore=` if(plan.relic){
  const insightDeficit=Math.max(0,plan.insight-(state().player.insight||0));
  ensureRelic(plan.relic+insightDeficit*3);
  ensureInsight(plan.insight);
  ensureRelic(plan.relic);
 }else ensureInsight(plan.insight);`;
const spiritAfter=` if(plan.relic){
  ensureInsight(plan.insight);
  ensureRelic(plan.relic);
 }else ensureInsight(plan.insight);`;
runner=replaceOnce(runner,spiritBefore,spiritAfter,'remove runner-only spirit relic over-preparation');

if(!runner.includes("function tryBeastMarket(n,maxCycles=24)"))throw new Error('V3.10 v35 beast market strategy missing');
if(!runner.includes("x.refId==='mat-beast-material'"))throw new Error('V3.10 v35 beast market listing lookup missing');
if(!runner.includes("invoke('v35Trade',lot.id,'buy',count)"))throw new Error('V3.10 v35 normal beast trade API call missing');
if(!runner.includes("source:'linjiang-market'"))throw new Error('V3.10 v35 beast market evidence missing');
if(!runner.includes("if(tryBeastMarket(n,24))return;"))throw new Error('V3.10 v35 market-first beast priority missing');
if(!runner.includes("const loc=goAny(['黑风岭','万兽山脉']);"))throw new Error('V3.10 v35 dangerous beast fallback missing');
if(runner.includes('plan.relic+insightDeficit*3'))throw new Error('V3.10 v35 obsolete spirit relic over-preparation survived');
if(!runner.includes("ensureInsight(plan.insight);\n  ensureRelic(plan.relic);"))throw new Error('V3.10 v35 exact spirit insight/relic order missing');
if(!runner.includes("spirit:{locations:['古河遗迹','玄阴禁地'],stones:45,rare:2,insight:3,materials:0,relic:5"))throw new Error('V3.10 v35 formal spirit inheritance cost drifted');
if(!runner.includes('V310_FULLRUN_V34_FINAL_RUNNER_PASS'))throw new Error('V3.10 v35 lost v34 auction-first relic layer');
if(!runner.includes('V310_FULLRUN_V33_COMBAT_POLICY'))throw new Error('V3.10 v35 lost v33 bounded flee policy');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-beast-material'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v35 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v35 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V35_FINAL_RUNNER_PASS '+JSON.stringify({paidBeastMarketFirst:true,normalFixedShopRestock:true,earnedCurrencyOnly:true,dangerousBeastFallbackPreserved:true,formalSpiritRelicCost:5,spiritInsightPreparedNormally:true,noSpiritRelicOverprep:true,v34RelicAuctionPreserved:true,v33CombatPolicyPreserved:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v35final='+Date.now());
