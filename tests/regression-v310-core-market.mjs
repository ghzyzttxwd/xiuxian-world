import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX='index.html',GAME='src/game-v310.js';
const html=fs.readFileSync(INDEX,'utf8').replace(/<script[^>]+src=["'][^"']*app\.js[^"']*[^>]*><\/script>/i,'');
const source=fs.readFileSync(GAME,'utf8');
const beastListing='{"id":"listing-market-beast","shopId":"shop-linjiang-market","kind":"material","refId":"mat-beast-material","basePrice":18,"stock":4,"minRealm":10,"sellable":true,"sellRate":0.45}';

assert(source.includes(beastListing),'paid 临江坊市兽材 recovery listing missing');
assert(source.includes('"mat-beast-material":{"id":"mat-beast-material","name":"兽材","qualityId":"huang","kind":"craft","field":"beastMaterials","locations":["黑风岭","万兽山脉"],"minRealm":1,"named":false}'),'兽材 dangerous map sources/minRealm drifted');
assert(source.includes("if(p.herbs<4||p.beastMaterials<2||p.spiritStones<6)return showResult('材料不足','每份结丹灵髓需要：灵草 4、兽材 2、灵石 6。"),'结丹灵髓 2-兽材 cost drifted');
assert(source.includes("if(i===13)return {kind:'结丹',core:3,nascent:0,deification:0,insight:2"),'结丹 three-core gate drifted');
assert(source.includes("if(i===14)return {kind:'凝结金丹',core:2,nascent:0,deification:0,insight:3"),'凝结金丹 two-core gate drifted');

function fresh(){
 const d=new JSDOM(html,{url:'http://v310-core-market.test/',runScripts:'outside-only',pretendToBeVisual:true});
 d.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
 d.window.scrollTo=()=>{};
 d.window.console=console;
 d.window.eval(source);
 const api=d.window.__TAIXUAN_TEST__;
 api.newGame('V310兽材经济回归');
 return {d,api};
}

const {api}=fresh();
api.v35SetPlayerForTest({realmIndex:13,location:'临江城',stones:10000});
const lot=Object.values(api.v35ListingRegistry()||{}).find(x=>x&&x.id==='listing-market-beast');
assert(lot,'临江坊市兽材 listing not exposed by normal registry');
// v35ListingRegistry exposes the immutable listing configuration. Effective fixed-shop stock is
// stored in world.v35StockByListing and is exposed by the normal v35Trade result, not by lot.stock.
assert.equal(Number(lot.stock),4,'兽材 configured fixed-market stock cap must remain 4');
assert.equal(Number(lot.minRealm),10,'兽材 market access must remain 筑基初期 realm index 10');
assert.equal(Number(lot.basePrice),18,'兽材 configured base price drifted');
const q=api.v35Quote(lot.id,'buy',1);assert(q&&q.total>0,'兽材 market quote must be a positive normal price');

// Zero currency must reject the purchase and grant nothing.
const zeroBefore=api.v33MaterialCount('mat-beast-material');
api.v35SetPlayerForTest({realmIndex:13,location:'临江城',stones:0});
const rejected=api.v35Trade(lot.id,'buy',1);
assert.notEqual(rejected?.ok,true,'zero-stone buyer must not receive兽材');
assert.equal(api.v33MaterialCount('mat-beast-material'),zeroBefore,'zero-stone rejection granted兽材');

// Buy exactly one full effective stock through the normal trade API. The trade result reports
// remaining effective stock after v35SetStock; the static registry intentionally continues to say 4.
api.v35SetPlayerForTest({realmIndex:13,location:'临江城',stones:10000});
let trade=api.v35Trade(lot.id,'buy',4);
assert.equal(trade?.ok,true,'normal first-cycle兽材 purchase failed: '+JSON.stringify(trade));
assert.equal(Number(trade.stock),0,'兽材 effective stock must exhaust after four purchases in one cycle');
assert.equal(api.v33MaterialCount('mat-beast-material'),zeroBefore+4,'first cycle did not deliver exactly four兽材');
const exhausted=api.v35Trade(lot.id,'buy',1);
assert.notEqual(exhausted?.ok,true,'exhausted兽材 stock supplied a fifth same-cycle unit');
assert.equal(exhausted?.reason,'stock','fifth same-cycle兽材 purchase must be rejected specifically by stock');

// The existing V3.5 fixed-market rule restocks every 10-day economy cycle. Prove the reset by
// successfully buying two more and observing two units remain from the configured cap of four.
const cycleBefore=api.v35EconomySnapshot().stockCycle;
api.advanceDays(10);
const cycleAfter=api.v35EconomySnapshot().stockCycle;
assert(cycleAfter>cycleBefore,'normal 10-day advance did not move the fixed-shop stock cycle');
trade=api.v35Trade(lot.id,'buy',2);
assert.equal(trade?.ok,true,'second-cycle two-unit兽材 purchase failed: '+JSON.stringify(trade));
assert.equal(Number(trade.stock),2,'second-cycle purchase should leave two effective兽材 in stock');
assert.equal(api.v33MaterialCount('mat-beast-material'),zeroBefore+6,'two normal market cycles did not provide six paid兽材');

// Six paid兽材 are exactly enough for the unchanged three-copy 结丹灵髓 gate.
// Test helpers only establish unrelated herbs/location/stones; each essence itself is crafted
// through the normal non-force craftCoreEssence action and must consume two purchased兽材.
api.v33AddMaterial('mat-spirit-herb',12);
api.v35SetPlayerForTest({realmIndex:13,location:'赤霞谷',stones:10000});
const beastBeforeCraft=api.v33MaterialCount('mat-beast-material');
for(let i=0;i<3;i++){
 const before=api.getState().player.coreEssence||0;
 api.craftCoreEssence();
 assert.equal(api.getState().player.coreEssence,before+1,'normal 结丹灵髓 craft '+(i+1)+' failed');
}
assert.equal(beastBeforeCraft,6,'regression setup should enter core crafting with exactly six兽材');
assert.equal(api.v33MaterialCount('mat-beast-material'),0,'three normal core crafts must consume exactly six兽材');
assert.equal(api.getState().player.coreEssence,3,'three paid-market-supported normal core crafts not completed');

const modes=api.v35EconomySnapshot().health.resources['mat-beast-material']||[];
assert(modes.includes('gather'),'兽材 dangerous map/gather source disappeared from economy health');
assert(modes.includes('trade'),'兽材 new trade source missing from economy health');

console.log('V310_CORE_MARKET_REGRESSION_PASS '+JSON.stringify({basePrice:18,configuredStockPerCycle:4,minRealm:10,restockDays:10,zeroStoneRejected:true,firstCycleBought:4,firstCycleRemaining:0,sameCycleFifthRejected:true,secondCycleBought:2,secondCycleRemaining:2,normalCoreCrafts:3,beastSpent:6,dangerousSourcesPreserved:true,coreCostsPreserved:true,multiSourceModes:modes}));
