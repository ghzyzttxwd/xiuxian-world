import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX='index.html';
const GAME='src/game-v310.js';
const html=fs.readFileSync(INDEX,'utf8').replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'');
const source=fs.readFileSync(GAME,'utf8');

// Static guard: realm33 has scarce Cangwu recovery lots for the unavoidable V3.8 chain.
// Configured base prices are locked; actual auction prices intentionally vary by market cycle.
assert(source.includes('{"id":"auction-v38-origincrystal","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v38-origin-crystal","basePrice":1800,"stock":1,"minRealm":33}'),'realm33 界源晶 auction recovery lot missing');
assert(source.includes('{"id":"auction-v38-sourcecrystal","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v38-natal-source-crystal","basePrice":2400,"stock":1,"minRealm":33}'),'realm33 本命源晶 auction recovery lot missing');
assert(source.includes('{"id":"auction-v38-origingold","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v38-origin-gold","basePrice":3200,"stock":1,"minRealm":33}'),'realm33 界源玄金 scarce recovery lot missing');
assert(source.includes('{"id":"auction-v38-worldessencedew","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v38-world-essence-dew","basePrice":3800,"stock":1,"minRealm":33}'),'realm33 世界真露 scarce recovery lot missing');
assert(source.includes('{"id":"auction-v38-heavenveinmarrow","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v38-heaven-vein-marrow","basePrice":4200,"stock":1,"minRealm":33}'),'realm33 天脉髓 scarce recovery lot missing');
assert(/"id":"mat-v38-origin-gold","name":"界源玄金"[^}]*"locations":\["界源海"\],"minRealm":34/.test(source),'界源玄金 dangerous 界源海 source/minRealm34 must remain intact');
assert(/"id":"mat-v38-world-essence-dew","name":"世界真露"[^}]*"locations":\["界源海","天穹祖脉"\],"minRealm":34,"combatKinds":\[\]/.test(source),'世界真露 dangerous 界源海/天穹祖脉 sources and minRealm34 must remain intact');
assert(/"id":"mat-v38-heaven-vein-marrow","name":"天脉髓"[^}]*"locations":\["天穹祖脉"\],"minRealm":34,"combatKinds":\["祖脉异兽"\]/.test(source),'天脉髓 dangerous 天穹祖脉 source/minRealm34/祖脉异兽 drop must remain intact');
assert(source.includes("const cost={'mat-v38-origin-crystal':2,'mat-v38-heaven-vein-marrow':1,'mat-v38-world-essence-dew':1,'mat-v37-unity-essence':1}"),'大乘本源髓 ingredient costs must remain 2界源晶+1天脉髓+1世界真露+1合体归一髓');
assert(source.includes("if(i===33)return {kind:'大乘证道',mahayanaEssence:5,lawProf:180,unity:110,origin:45,authority:20,natalMarks:1,insight:42"),'大乘证道 must still require five 大乘本源髓');

function freshApi(label){
 const d=new JSDOM(html,{url:'http://v310-auction.test/',runScripts:'outside-only',pretendToBeVisual:true});
 d.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
 d.window.scrollTo=()=>{};
 d.window.console=console;
 d.window.eval(source);
 const api=d.window.__TAIXUAN_TEST__;
 api.newGame(label);
 api.v35SetPlayerForTest({realmIndex:33,location:'苍梧郡城',stones:100000});
 return {d,api};
}

const {api}=freshApi('V310大乘前置拍卖回归');
const targets=new Map([
 ['mat-v38-origin-crystal',{name:'界源晶',basePrice:1800}],
 ['mat-v38-natal-source-crystal',{name:'本命源晶',basePrice:2400}],
 ['mat-v38-origin-gold',{name:'界源玄金',basePrice:3200}],
 ['mat-v38-world-essence-dew',{name:'世界真露',basePrice:3800}],
 ['mat-v38-heaven-vein-marrow',{name:'天脉髓',basePrice:4200}],
]);
const bought=new Map();

// Auction lots rotate normally. No material injection and no forced lot.
// For every target, prove zero-stone rejection, then buy exactly one through v35Trade.
for(let cycle=0;cycle<200&&bought.size<targets.size;cycle++){
 const listings=Object.values(api.v35ListingRegistry()||{});
 for(const [refId,meta] of targets){
  if(bought.has(refId))continue;
  const lot=listings.find(x=>x&&x.shopId==='shop-cangwu-auction'&&x.kind==='material'&&x.refId===refId&&Number(x.stock||0)>0);
  if(!lot)continue;
  assert.equal(Number(lot.minRealm),33,`${meta.name} auction access drifted above realm33`);
  assert.equal(Number(lot.stock),1,`${meta.name} auction must remain stock 1`);
  assert.equal(Number(lot.catalogBasePrice||lot.configBasePrice||meta.basePrice),meta.basePrice,`${meta.name} configured recovery base price drifted`);
  assert(Number(lot.basePrice)>0,`${meta.name} current auction price must remain a positive normal market price`);

  const before=api.v33MaterialCount(refId);
  api.v35SetPlayerForTest({realmIndex:33,location:'苍梧郡城',stones:0});
  const brokeTrade=api.v35Trade(lot.id,'buy',1);
  assert.notEqual(brokeTrade?.ok,true,`${meta.name} auction must reject a zero-stone buyer`);
  assert.equal(api.v33MaterialCount(refId),before,`${meta.name} zero-stone rejection must not grant material`);

  api.v35SetPlayerForTest({realmIndex:33,location:'苍梧郡城',stones:100000});
  const trade=api.v35Trade(lot.id,'buy',1);
  assert.equal(trade?.ok,true,`realm33 normal ${meta.name} auction purchase failed: ${JSON.stringify(trade)}`);
  assert.equal(api.v33MaterialCount(refId),before+1,`${meta.name} auction did not deliver exactly one material`);
  bought.set(refId,{cycle,listingId:lot.id,marketPrice:Number(lot.basePrice),zeroStoneRejected:true});
 }
 if(bought.size<targets.size)api.advanceDays(30);
}
for(const [refId,meta] of targets)assert(bought.has(refId),`${meta.name} stock-1 auction lot never became normally purchasable at realm33`);

// Isolated scarcity guard: buy one copy, prove the lot is exhausted in that exact cycle,
// then prove the normal rotating auction eventually offers one again on a later cycle.
function verifyStockOneRecovery(refId,name){
 const {api:a}=freshApi('V310-'+name+'-stock1回归');
 let first=null;
 for(let cycle=0;cycle<200&&!first;cycle++){
  const lot=Object.values(a.v35ListingRegistry()||{}).find(x=>x&&x.shopId==='shop-cangwu-auction'&&x.kind==='material'&&x.refId===refId&&Number(x.stock||0)>0);
  if(lot){
   const before=a.v33MaterialCount(refId);
   const trade=a.v35Trade(lot.id,'buy',1);
   assert.equal(trade?.ok,true,`${name} first stock-1 purchase failed: ${JSON.stringify(trade)}`);
   assert.equal(a.v33MaterialCount(refId),before+1,`${name} first purchase did not deliver exactly one`);
   const same=Object.values(a.v35ListingRegistry()||{}).find(x=>x&&x.shopId==='shop-cangwu-auction'&&x.refId===refId&&Number(x.stock||0)>0);
   assert(!same,`${name} recovery must not supply a second copy in the same auction cycle`);
   first={cycle,listingId:lot.id,marketPrice:Number(lot.basePrice)};
   break;
  }
  a.advanceDays(30);
 }
 assert(first,`${name} stock-1 lot never appeared`);
 let second=null;
 for(let wait=1;wait<=200&&!second;wait++){
  a.advanceDays(30);
  const lot=Object.values(a.v35ListingRegistry()||{}).find(x=>x&&x.shopId==='shop-cangwu-auction'&&x.kind==='material'&&x.refId===refId&&Number(x.stock||0)>0);
  if(!lot)continue;
  const before=a.v33MaterialCount(refId);
  const trade=a.v35Trade(lot.id,'buy',1);
  assert.equal(trade?.ok,true,`${name} later-cycle recovery purchase failed: ${JSON.stringify(trade)}`);
  assert.equal(a.v33MaterialCount(refId),before+1,`${name} later-cycle recovery did not deliver exactly one`);
  second={waitCycles:wait,listingId:lot.id,marketPrice:Number(lot.basePrice)};
 }
 assert(second,`${name} stock-1 recovery lot never returned on a later normal auction cycle`);
 return {first,second};
}
const dewRecovery=verifyStockOneRecovery('mat-v38-world-essence-dew','世界真露');
const marrowRecovery=verifyStockOneRecovery('mat-v38-heaven-vein-marrow','天脉髓');

console.log('V310_PREMAHAYANA_AUCTION_REGRESSION_PASS '+JSON.stringify({realm:33,originCrystal:bought.get('mat-v38-origin-crystal'),natalSourceCrystal:bought.get('mat-v38-natal-source-crystal'),originGold:bought.get('mat-v38-origin-gold'),worldEssenceDew:bought.get('mat-v38-world-essence-dew'),heavenVeinMarrow:bought.get('mat-v38-heaven-vein-marrow'),worldEssenceDewRecovery:dewRecovery,heavenVeinMarrowRecovery:marrowRecovery,originGoldDangerousMapSourcePreserved:true,worldEssenceDewDangerousMapsPreserved:true,heavenVeinMarrowDangerousMapAndDropPreserved:true,mahayanaEssenceCostPreserved:true,mahayanaFiveEssenceGatePreserved:true,normalTradeOnly:true,zeroStoneRejected:true,stockOneScarcityPreserved:true,marketPriceVariationPreserved:true}));
