const fs=require('fs');
const crypto=require('crypto');

// Layer the next evidence-driven V3.10 balance repair over V2.
// V34 four-path evidence showed that two independent fresh-save seeds reached 筑基圆满
// and then died while farming the mandatory 兽材 for 结丹灵髓 in 黑风岭. V3.5 describes
// 临江坊市 as a stable low/mid-tier market, but generic low-tier 兽材 had no normal trade
// listing at all. Preserve the dangerous map sources and every breakthrough cost, while adding
// one paid, low-stock, 10-day-restocking economic recovery path.
require('./build-v310-balance-v2.cjs');

const OUTPUT='src/game-v310.js',REPORT='BUILD_V310_BALANCE.json';
let src=fs.readFileSync(OUTPUT,'utf8');
const anchor='{"id":"listing-market-waterroot","shopId":"shop-linjiang-market","kind":"material","refId":"mat-v33-water-lotus-root","basePrice":8,"stock":8,"minRealm":3,"sellable":true,"sellRate":0.56}';
const beastListing='{"id":"listing-market-beast","shopId":"shop-linjiang-market","kind":"material","refId":"mat-beast-material","basePrice":18,"stock":4,"minRealm":10,"sellable":true,"sellRate":0.45}';
const first=src.indexOf(anchor);
if(first<0)throw new Error('V3.10 low-tier market anchor missing');
if(src.indexOf(anchor,first+1)>=0)throw new Error('V3.10 low-tier market anchor ambiguous');
if(src.includes('"id":"listing-market-beast"'))throw new Error('V3.10 beast-material market listing already exists');
src=src.slice(0,first+anchor.length)+','+beastListing+src.slice(first+anchor.length);

// Make the economy health audit explicitly include generic 兽材 now that it has a second source.
const healthBefore="const key=['mat-v33-earthvein-milk','mat-v33-dragon-saliva-fruit','mat-v33-souljade-shard','mat-v33-ghostface-lingzhi','mat-v33-yin-soul-dew','mat-v33-nether-river-sand','mat-rare-material','mat-relic-fragment'];";
const healthAfter="const key=['mat-beast-material','mat-v33-earthvein-milk','mat-v33-dragon-saliva-fruit','mat-v33-souljade-shard','mat-v33-ghostface-lingzhi','mat-v33-yin-soul-dew','mat-v33-nether-river-sand','mat-rare-material','mat-relic-fragment'];";
const hi=src.indexOf(healthBefore);
if(hi<0)throw new Error('V3.10 economy health key anchor missing');
if(src.indexOf(healthBefore,hi+1)>=0)throw new Error('V3.10 economy health key anchor ambiguous');
src=src.slice(0,hi)+healthAfter+src.slice(hi+healthBefore.length);

// Invariants: this is a second paid source, not a nerf or resource grant.
if(!src.includes('"mat-beast-material":{"id":"mat-beast-material","name":"兽材","qualityId":"huang","kind":"craft","field":"beastMaterials","locations":["黑风岭","万兽山脉"],"minRealm":1,"named":false}'))throw new Error('兽材 dangerous source catalog drifted');
if(!src.includes(beastListing))throw new Error('兽材 low-stock market recovery listing missing');
if(!src.includes("if(p.herbs<4||p.beastMaterials<2||p.spiritStones<6)return showResult('材料不足','每份结丹灵髓需要：灵草 4、兽材 2、灵石 6。"))throw new Error('结丹灵髓 material cost drifted');
if(!src.includes("if(i===13)return {kind:'结丹',core:3,nascent:0,deification:0,insight:2"))throw new Error('结丹 three-core gate drifted');
if(!src.includes("if(i===14)return {kind:'凝结金丹',core:2,nascent:0,deification:0,insight:3"))throw new Error('金丹 two-core gate drifted');

fs.writeFileSync(OUTPUT,src);
const sha=crypto.createHash('sha256').update(Buffer.from(src)).digest('hex');
const report=JSON.parse(fs.readFileSync(REPORT,'utf8'));
report.source_sha256=sha;
report.source_bytes=Buffer.byteLength(src);
report.changes=[...(report.changes||[]),
 '基础兽材 keeps its 黑风岭 / 万兽山脉 dangerous sources and gains a paid 临江坊市 recovery listing at 筑基初期: base price 18, stock 4, normal 10-day fixed-shop restock; this repairs the V34 fresh-save 结丹 resource deadlock without weakening enemies or breakthrough costs'
];
report.invariants=(report.invariants||[]);
report.invariants.push('兽材 remains quality 黄 and map-sourced from 黑风岭 / 万兽山脉; the added 临江坊市 route costs normal spirit stones, is limited to stock 4 per 10-day economy cycle, and starts only at realm index 10');
report.invariants.push('每份结丹灵髓 still consumes 灵草4 + 兽材2 + 灵石6; 结丹 still requires 3 结丹灵髓 and 凝结金丹 still requires 2');
fs.writeFileSync(REPORT,JSON.stringify(report,null,2)+'\n');
console.log('V310_BUILD_V3_PASS '+JSON.stringify({source_sha256:sha,beastMarketRecovery:{basePrice:18,stock:4,minRealm:10,restockDays:10},dangerousBeastSourcesPreserved:true,coreEssenceCostPreserved:true,coreGatesPreserved:true,directSource:true}));
