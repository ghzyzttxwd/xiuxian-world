import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX='index.html';
const GAME='src/game-v310.js';
const html=fs.readFileSync(INDEX,'utf8').replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'');
const source=fs.readFileSync(GAME,'utf8');

// Static guard: these are the two already-existing scarce Cangwu auction recovery lots.
// V3.10 only aligns their access with the repaired realm33 pre-Mahayana preparation stage.
assert(source.includes('{"id":"auction-v38-origincrystal","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v38-origin-crystal","basePrice":1800,"stock":1,"minRealm":33}'),'realm33 界源晶 auction recovery lot missing');
assert(source.includes('{"id":"auction-v38-sourcecrystal","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v38-natal-source-crystal","basePrice":2400,"stock":1,"minRealm":33}'),'realm33 本命源晶 auction recovery lot missing');
assert(!source.includes('"refId":"mat-v38-origin-gold","basePrice"'),'界源玄金 must remain map-sourced; regression detected an auction shortcut');

const d=new JSDOM(html,{url:'http://v310-auction.test/',runScripts:'outside-only',pretendToBeVisual:true});
d.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
d.window.scrollTo=()=>{};
d.window.console=console;
d.window.eval(source);
const api=d.window.__TAIXUAN_TEST__;
api.newGame('V310大乘前置拍卖回归');
api.v35SetPlayerForTest({realmIndex:33,location:'苍梧郡城',stones:100000});

const targets=new Map([
 ['mat-v38-origin-crystal',{name:'界源晶',expectedBase:1800}],
 ['mat-v38-natal-source-crystal',{name:'本命源晶',expectedBase:2400}],
]);
const bought=new Map();

// Auction lots rotate normally. We do not inject either material or force an auction lot.
// Find each scarce stock-1 lot through the normal listing registry, then buy it through v35Trade.
for(let cycle=0;cycle<80&&bought.size<targets.size;cycle++){
 const listings=Object.values(api.v35ListingRegistry()||{});
 for(const [refId,meta] of targets){
  if(bought.has(refId))continue;
  const lot=listings.find(x=>x&&x.shopId==='shop-cangwu-auction'&&x.kind==='material'&&x.refId===refId&&Number(x.stock||0)>0);
  if(!lot)continue;
  assert.equal(Number(lot.minRealm),33,`${meta.name} auction access drifted above realm33`);
  assert.equal(Number(lot.stock),1,`${meta.name} auction must remain stock 1`);
  assert.equal(Number(lot.basePrice),meta.expectedBase,`${meta.name} base price changed unexpectedly`);
  const before=api.v33MaterialCount(refId);
  const trade=api.v35Trade(lot.id,'buy',1);
  assert.equal(trade?.ok,true,`realm33 normal ${meta.name} auction purchase failed: ${JSON.stringify(trade)}`);
  assert.equal(api.v33MaterialCount(refId),before+1,`${meta.name} auction did not deliver exactly one material`);
  bought.set(refId,{cycle,listingId:lot.id});
 }
 if(bought.size<targets.size)api.advanceDays(30);
}

for(const [refId,meta] of targets)assert(bought.has(refId),`${meta.name} stock-1 auction lot never became normally purchasable at realm33`);
assert.equal(api.v33MaterialCount('mat-v38-origin-gold'),0,'regression must not inject or purchase 界源玄金');

console.log('V310_PREMAHAYANA_AUCTION_REGRESSION_PASS '+JSON.stringify({realm:33,originCrystal:bought.get('mat-v38-origin-crystal'),natalSourceCrystal:bought.get('mat-v38-natal-source-crystal'),originGoldStillMapSourced:true,normalTradeOnly:true}));
