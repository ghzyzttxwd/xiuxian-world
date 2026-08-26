const fs=require('fs');
const crypto=require('crypto');

// Layer one evidence-driven V3.10 balance repair over the deterministic base builder.
// This is build-time only: the produced src/game-v310.js remains one direct complete source.
require('./build-v310-balance.cjs');

const OUTPUT='src/game-v310.js',REPORT='BUILD_V310_BALANCE.json';
let src=fs.readFileSync(OUTPUT,'utf8');
const anchor='{"id":"auction-v38-sourcecrystal","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v38-natal-source-crystal","basePrice":2400,"stock":1,"minRealm":33}';
const listing='{"id":"auction-v38-origingold","shopId":"shop-cangwu-auction","kind":"material","refId":"mat-v38-origin-gold","basePrice":3200,"stock":1,"minRealm":33}';
const first=src.indexOf(anchor);
if(first<0)throw new Error('V3.10 origin-gold repair anchor missing');
if(src.indexOf(anchor,first+1)>=0)throw new Error('V3.10 origin-gold repair anchor ambiguous');
if(src.includes('"id":"auction-v38-origingold"'))throw new Error('V3.10 origin-gold recovery listing already exists');
src=src.slice(0,first+anchor.length)+','+listing+src.slice(first+anchor.length);

// Preserve the dangerous map source and all material/breakthrough data. The only gameplay
// change here is one expensive stock-1 rotating auction recovery lot, justified by repeated
// legal full-run deaths while realm33 was obtaining the first mandatory natal-origin mark.
if(!src.includes('"id":"mat-v38-origin-gold","name":"界源玄金"'))throw new Error('界源玄金 material catalog missing');
if(!src.includes('"locations":["界源海"],"minRealm":34'))throw new Error('界源玄金 dangerous map source/minRealm unexpectedly changed');
if(!src.includes(listing))throw new Error('界源玄金 scarce recovery listing missing');

fs.writeFileSync(OUTPUT,src);
const sha=crypto.createHash('sha256').update(Buffer.from(src)).digest('hex');
const report=JSON.parse(fs.readFileSync(REPORT,'utf8'));
report.source_sha256=sha;
report.source_bytes=Buffer.byteLength(src);
report.changes=[...(report.changes||[]),'界源玄金 keeps its dangerous 界源海 source and gains one expensive stock-1 realm33 rotating auction recovery lot after repeated legal full-run deaths on the mandatory first natal-origin mark'];
report.invariants=(report.invariants||[]).filter(x=>x!=='界源玄金 remains map-sourced at realm 33; no new auction listing was added');
report.invariants.push('界源玄金 dangerous 界源海 source, material minRealm34 and combat difficulty are unchanged; its only added recovery path is a 3200-stone stock-1 rotating auction lot');
fs.writeFileSync(REPORT,JSON.stringify(report,null,2)+'\n');
console.log('V310_BUILD_V2_PASS '+JSON.stringify({source_sha256:sha,originGoldRecovery:{basePrice:3200,stock:1,minRealm:33},dangerousMapSourcePreserved:true,directSource:true}));
