const fs=require('fs');
const crypto=require('crypto');

// Layer evidence-driven V3.10 balance repairs over the deterministic base builder.
// This is build-time only: the produced src/game-v310.js remains one direct complete source.
require('./build-v310-balance.cjs');

const OUTPUT='src/game-v310.js',REPORT='BUILD_V310_BALANCE.json';
let src=fs.readFileSync(OUTPUT,'utf8');
const anchor='{"id":"auction-v38-sourcecrystal","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v38-natal-source-crystal","basePrice":2400,"stock":1,"minRealm":33}';
const originGoldListing='{"id":"auction-v38-origingold","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v38-origin-gold","basePrice":3200,"stock":1,"minRealm":33}';
const dewListing='{"id":"auction-v38-worldessencedew","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v38-world-essence-dew","basePrice":3800,"stock":1,"minRealm":33}';
const marrowListing='{"id":"auction-v38-heavenveinmarrow","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v38-heaven-vein-marrow","basePrice":4200,"stock":1,"minRealm":33}';
const first=src.indexOf(anchor);
if(first<0)throw new Error('V3.10 V3.8 recovery anchor missing');
if(src.indexOf(anchor,first+1)>=0)throw new Error('V3.10 V3.8 recovery anchor ambiguous');
if(src.includes('"id":"auction-v38-origingold"'))throw new Error('V3.10 origin-gold recovery listing already exists');
if(src.includes('"id":"auction-v38-worldessencedew"'))throw new Error('V3.10 world-essence-dew recovery listing already exists');
if(src.includes('"id":"auction-v38-heavenveinmarrow"'))throw new Error('V3.10 heaven-vein-marrow recovery listing already exists');
src=src.slice(0,first+anchor.length)+','+originGoldListing+','+dewListing+','+marrowListing+src.slice(first+anchor.length);

// Preserve dangerous map sources, material tiers, enemy/drop content and breakthrough costs.
// Recovery lots only add expensive stock-1 realm33 market routes; no map/enemy/gate is weakened.
if(!src.includes('"id":"mat-v38-origin-gold","name":"界源玄金"'))throw new Error('界源玄金 material catalog missing');
if(!src.includes('"locations":["界源海"],"minRealm":34'))throw new Error('界源玄金 dangerous map source/minRealm unexpectedly changed');
if(!src.includes(originGoldListing))throw new Error('界源玄金 scarce recovery listing missing');
if(!src.includes('"id":"mat-v38-world-essence-dew","name":"世界真露"'))throw new Error('世界真露 material catalog missing');
if(!src.includes('"locations":["界源海","天穹祖脉"],"minRealm":34,"combatKinds":[]'))throw new Error('世界真露 dangerous map sources/minRealm unexpectedly changed');
if(!src.includes(dewListing))throw new Error('世界真露 scarce recovery listing missing');
if(!src.includes('"id":"mat-v38-heaven-vein-marrow","name":"天脉髓"'))throw new Error('天脉髓 material catalog missing');
if(!src.includes('"locations":["天穹祖脉"],"minRealm":34,"combatKinds":["祖脉异兽"]'))throw new Error('天脉髓 dangerous 天穹祖脉 source/minRealm/combat kind unexpectedly changed');
if(!src.includes(marrowListing))throw new Error('天脉髓 scarce recovery listing missing');
if(!src.includes("const cost={'mat-v38-origin-crystal':2,'mat-v38-heaven-vein-marrow':1,'mat-v38-world-essence-dew':1,'mat-v37-unity-essence':1}"))throw new Error('大乘本源髓 ingredient cost drifted');
if(!src.includes("if(i===33)return {kind:'大乘证道',mahayanaEssence:5,lawProf:180,unity:110,origin:45,authority:20,natalMarks:1,insight:42"))throw new Error('大乘证道 five-essence requirement drifted');

fs.writeFileSync(OUTPUT,src);
const sha=crypto.createHash('sha256').update(Buffer.from(src)).digest('hex');
const report=JSON.parse(fs.readFileSync(REPORT,'utf8'));
report.source_sha256=sha;
report.source_bytes=Buffer.byteLength(src);
report.changes=[...(report.changes||[]),
 '界源玄金 keeps its dangerous 界源海 source and gains one expensive stock-1 realm33 rotating auction recovery lot after repeated legal full-run deaths on the mandatory first natal-origin mark',
 '世界真露 keeps its realm34 界源海 / 天穹祖脉 sources and gains one 3800-stone stock-1 realm33 rotating auction recovery lot after the legal v15 highchain bought 天脉髓 normally but then died in 界源海 while continuing the mandatory five-copy 大乘本源髓 chain',
 '天脉髓 keeps its realm34 天穹祖脉 / 祖脉异兽 source and gains one 4200-stone stock-1 realm33 rotating auction recovery lot after a fully max-prepared legal realm33 sword build still could not obtain the five mandatory 大乘本源髓 inputs'
];
report.invariants=(report.invariants||[]).filter(x=>x!=='界源玄金 remains map-sourced at realm 33; no new auction listing was added');
report.invariants.push('界源玄金 dangerous 界源海 source, material minRealm34 and combat difficulty are unchanged; its only added recovery path is a 3200-stone stock-1 rotating auction lot');
report.invariants.push('世界真露 remains minRealm34 and map-sourced from 界源海 / 天穹祖脉; map danger, enemy tables and generic gathering/drop behavior are unchanged; its only added recovery path is a 3800-stone stock-1 realm33 rotating auction lot');
report.invariants.push('天脉髓 remains minRealm34 and map-sourced only from 天穹祖脉 with 祖脉异兽 combat drops; enemy/drop difficulty is unchanged; its only added recovery path is a 4200-stone stock-1 realm33 rotating auction lot');
report.invariants.push('大乘本源髓 still consumes two 界源晶, one 天脉髓, one 世界真露 and one 合体归一髓 each; 大乘证道 still requires five 大乘本源髓');
fs.writeFileSync(REPORT,JSON.stringify(report,null,2)+'\n');
console.log('V310_BUILD_V2_PASS '+JSON.stringify({source_sha256:sha,originGoldRecovery:{basePrice:3200,stock:1,minRealm:33},worldEssenceDewRecovery:{basePrice:3800,stock:1,minRealm:33},heavenVeinMarrowRecovery:{basePrice:4200,stock:1,minRealm:33},dangerousMapSourcesPreserved:true,mahayanaRequirementsPreserved:true,directSource:true}));
