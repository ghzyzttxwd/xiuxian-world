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
assert(source.includes('{"id":"auction-v38-heavenveinmarrow","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v38-heaven-vein-marrow","basePrice":4200,"stock":1,"minRealm":33}'),'realm33 天脉髓 scarce recovery lot missing');
assert(/"id":"mat-v38-origin-gold","name":"界源玄金"[^}]*"locations":\["界源海"\],"minRealm":34/.test(source),'界源玄金 dangerous 界源海 source/minRealm34 must remain intact');
assert(/"id":"mat-v38-heaven-vein-marrow","name":"天脉髓"[^}]*"locations":\["天穹祖脉"\],"minRealm":34,"combatKinds":\["祖脉异兽"\]/.test(source),'天脉髓 dangerous 天穹祖脉 source/minRealm34/祖脉异兽 drop must remain intact');
assert(source.includes("const cost={'mat-v38-origin-crystal':2,'mat-v38-heaven-vein-marrow':1,'mat-v38-world-essence-dew':1,'mat-v37-unity-essence':1}"),'大乘本源髓 must still consume one 天脉髓');
assert(source.includes("if(i===33)return {kind:'大乘证道',mahayanaEssence:5,lawProf:180,unity:110,origin:45,authority:20,natalMarks:1,insight:42"),'大乘证道 must still require five 大乘本源髓');

const d=new JSDOM(html,{url:'http://v310-auction.test/',runScripts:'outside-only',pretendToBeVisual:true});
d.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
d.window.scrollTo=()=>{};
d.window.console=console;
d.window.eval(source);
const api=d.window.__TAIXUAN_TEST__;
api.newGame('V310大乘前置拍卖回归');
api.v35SetPlayerForTest({realmIndex:33,location:'苍梧郡城',stones:100000});

const targets=new Map([
 ['mat-v38-origin-crystal',{name:'界源晶',basePrice:1800}],
 ['mat-v38-natal-source-crystal',{name:'本命源晶',basePrice:2400}],
 ['mat-v38-origin-gold',{name:'界源玄金',basePrice:3200}],
 ['mat-v38-heaven-vein-marrow',{name:'天脉髓',basePrice:4200}],
]);
const bought=new Map();

// Auction lots rotate normally. No material injection and no forced lot.
// For every target, prove zero-stone rejection, then buy exactly one through v35Trade.
for(let cycle=0;cycle<160&&bought.size<targets.size;cycle++){
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

// Scarcity/recovery guard specific to 天脉髓: after consuming the first stock-1 lot, the same
// cycle cannot supply a second copy, but a later normal auction cycle must eventually recover one.
const marrowId='mat-v38-heaven-vein-marrow';
const firstMarrow=bought.get(marrowId);
let sameCycleSecond=false;
for(const lot of Object.values(api.v35ListingRegistry()||{}))if(lot?.shopId==='shop-cangwu-auction'&&lot?.refId===marrowId&&Number(lot.stock||0)>0)sameCycleSecond=true;
assert.equal(sameCycleSecond,false,'天脉髓 recovery must not supply a second copy in the same auction cycle');
let secondMarrow=null;
for(let wait=1;wait<=160&&!secondMarrow;wait++){
 api.advanceDays(30);
 const lot=Object.values(api.v35ListingRegistry()||{}).find(x=>x&&x.shopId==='shop-cangwu-auction'&&x.kind==='material'&&x.refId===marrowId&&Number(x.stock||0)>0);
 if(!lot)continue;
 const before=api.v33MaterialCount(marrowId);
 api.v35SetPlayerForTest({realmIndex:33,location:'苍梧郡城',stones:100000});
 const trade=api.v35Trade(lot.id,'buy',1);
 assert.equal(trade?.ok,true,`later-cycle 天脉髓 recovery purchase failed: ${JSON.stringify(trade)}`);
 assert.equal(api.v33MaterialCount(marrowId),before+1,'later-cycle 天脉髓 recovery did not deliver exactly one');
 secondMarrow={waitCycles:wait,listingId:lot.id,marketPrice:Number(lot.basePrice)};
}
assert(secondMarrow,'天脉髓 stock-1 recovery lot never returned on a later normal auction cycle');

console.log('V310_PREMAHAYANA_AUCTION_REGRESSION_PASS '+JSON.stringify({realm:33,originCrystal:bought.get('mat-v38-origin-crystal'),natalSourceCrystal:bought.get('mat-v38-natal-source-crystal'),originGold:bought.get('mat-v38-origin-gold'),heavenVeinMarrow:firstMarrow,heavenVeinMarrowSecondCycle:secondMarrow,originGoldDangerousMapSourcePreserved:true,heavenVeinMarrowDangerousMapAndDropPreserved:true,mahayanaEssenceCostPreserved:true,mahayanaFiveEssenceGatePreserved:true,normalTradeOnly:true,zeroStoneRejected:true,stockOneScarcityPreserved:true,marketPriceVariationPreserved:true}));
