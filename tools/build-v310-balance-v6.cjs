const fs=require('fs');
const crypto=require('crypto');

// Layer the V38 pill-effect repair over the validated V59 gameplay candidate.
// Several V38 recipes were authored with effect keys that useV33Pill never consumes:
// healPct, qiPct, direct breakthrough and artifactWarmth. Normalize the first three to the
// established V33 effect schema, and add one narrowly-scoped consumer for artifactWarmth so
// 本命融源丹 actually warms the current natal artifact as described. Costs, alchemy odds,
// toxicity, breakthrough formula, enemies, drops, RNG and action caps remain unchanged.
require('./build-v310-balance-v5.cjs');

const OUTPUT='src/game-v310.js',REPORT='BUILD_V310_BALANCE.json';
let src=fs.readFileSync(OUTPUT,'utf8');

function replaceOnce(before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 V38 pill repair anchor missing: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 V38 pill repair anchor ambiguous: '+label);
 src=src.slice(0,first)+after+src.slice(first+before.length);
}

replaceOnce(
 '"id":"recipe-v38-worldbody","itemId":"item-pill-v38-worldbody","name":"界脉锻体丹","unlock":34,"qualityId":"tian","sources":["天穹祖脉"],"ingredients":{"mat-v38-heaven-vein-marrow":2,"mat-v38-worldheart-wood":1,"mat-v37-dao-blood":1},"effect":{"healPct":0.55,"progress":0.024}',
 '"id":"recipe-v38-worldbody","itemId":"item-pill-v38-worldbody","name":"界脉锻体丹","unlock":34,"qualityId":"tian","sources":["天穹祖脉"],"ingredients":{"mat-v38-heaven-vein-marrow":2,"mat-v38-worldheart-wood":1,"mat-v37-dao-blood":1},"effect":{"hp":0.55,"progress":0.024}',
 '界脉锻体丹 healPct -> hp'
);
replaceOnce(
 '"id":"recipe-v38-worldsoul","itemId":"item-pill-v38-worldsoul","name":"天心养神丹","unlock":35,"qualityId":"tian","sources":["人界议庭"],"ingredients":{"mat-v38-soulstar-dew":2,"mat-v38-world-essence-dew":1,"mat-v37-soul-covenant-stone":1},"effect":{"qiPct":0.5,"manualProf":70}',
 '"id":"recipe-v38-worldsoul","itemId":"item-pill-v38-worldsoul","name":"天心养神丹","unlock":35,"qualityId":"tian","sources":["人界议庭"],"ingredients":{"mat-v38-soulstar-dew":2,"mat-v38-world-essence-dew":1,"mat-v37-soul-covenant-stone":1},"effect":{"qi":0.5,"manualProf":70}',
 '天心养神丹 qiPct -> qi'
);
replaceOnce(
 '"id":"recipe-v38-authority","itemId":"item-pill-v38-authority","name":"镇世归元丹","unlock":35,"qualityId":"tian","sources":["人界议庭"],"ingredients":{"mat-v38-sovereign-seal":1,"mat-v38-origin-crystal":2,"mat-v38-heaven-vein-marrow":1},"effect":{"progress":0.035,"breakthrough":0.035}',
 '"id":"recipe-v38-authority","itemId":"item-pill-v38-authority","name":"镇世归元丹","unlock":35,"qualityId":"tian","sources":["人界议庭"],"ingredients":{"mat-v38-sovereign-seal":1,"mat-v38-origin-crystal":2,"mat-v38-heaven-vein-marrow":1},"effect":{"progress":0.035,"buff":{"breakthrough":0.035},"buffDays":25}',
 '镇世归元丹 direct breakthrough -> V33 buff'
);
replaceOnce(
 '"id":"recipe-v38-tribulation-body","itemId":"item-pill-v38-tribulation-body","name":"抗劫炼体丹","unlock":36,"qualityId":"tian","sources":["九霄劫台"],"ingredients":{"mat-v38-tribulation-stone":2,"mat-v38-heaven-vein-marrow":1,"mat-v38-immortal-mortal-dust":1},"effect":{"healPct":0.65,"breakthrough":0.04}',
 '"id":"recipe-v38-tribulation-body","itemId":"item-pill-v38-tribulation-body","name":"抗劫炼体丹","unlock":36,"qualityId":"tian","sources":["九霄劫台"],"ingredients":{"mat-v38-tribulation-stone":2,"mat-v38-heaven-vein-marrow":1,"mat-v38-immortal-mortal-dust":1},"effect":{"hp":0.65,"buff":{"breakthrough":0.04},"buffDays":25}',
 '抗劫炼体丹 recovery/breakthrough schema'
);
replaceOnce(
 '"id":"recipe-v38-tribulation-soul","itemId":"item-pill-v38-tribulation-soul","name":"定神抗劫丹","unlock":36,"qualityId":"tian","sources":["九霄劫台"],"ingredients":{"mat-v38-soulstar-dew":2,"mat-v38-tribulation-stone":1,"mat-v38-immortal-mortal-dust":1},"effect":{"qiPct":0.6,"breakthrough":0.04}',
 '"id":"recipe-v38-tribulation-soul","itemId":"item-pill-v38-tribulation-soul","name":"定神抗劫丹","unlock":36,"qualityId":"tian","sources":["九霄劫台"],"ingredients":{"mat-v38-soulstar-dew":2,"mat-v38-tribulation-stone":1,"mat-v38-immortal-mortal-dust":1},"effect":{"qi":0.6,"buff":{"breakthrough":0.04},"buffDays":25}',
 '定神抗劫丹 recovery/breakthrough schema'
);
replaceOnce(
 '"id":"recipe-v38-mahayana-break","itemId":"item-pill-v38-mahayana-break","name":"大乘证道丹","unlock":33,"qualityId":"tian","sources":["界源海","天穹祖脉"],"ingredients":{"mat-v38-mahayana-essence":1,"mat-v38-origin-crystal":2,"mat-v38-world-essence-dew":1},"effect":{"breakthrough":0.07,"insight":1}',
 '"id":"recipe-v38-mahayana-break","itemId":"item-pill-v38-mahayana-break","name":"大乘证道丹","unlock":33,"qualityId":"tian","sources":["界源海","天穹祖脉"],"ingredients":{"mat-v38-mahayana-essence":1,"mat-v38-origin-crystal":2,"mat-v38-world-essence-dew":1},"effect":{"buff":{"breakthrough":0.07},"buffDays":25,"insight":1}',
 '大乘证道丹 direct breakthrough -> V33 buff'
);

const warmthAnchor=" if(e.lifespan){const n=Math.max(1,Math.floor(e.lifespan));p.lifespan+=n;p.lifeExtensionPillsUsed++;notes.push('寿元 +'+n+'年')}\n if(e.buff)v33ApplyBuffs(e.buff,e.buffDays||5,scale,r.name);";
const warmthAfter=" if(e.lifespan){const n=Math.max(1,Math.floor(e.lifespan));p.lifespan+=n;p.lifeExtensionPillsUsed++;notes.push('寿元 +'+n+'年')}\n if(e.artifactWarmth){const natalId=p.natalArtifactId,rec=natalId&&p.equipmentInventory?.[natalId];if(rec){const before=Number(rec.warmth)||0,gain=Math.max(1,Math.floor(Number(e.artifactWarmth)*scale));rec.warmth=Math.min(100,before+gain);notes.push('本命温养 +'+(rec.warmth-before))}}\n if(e.buff)v33ApplyBuffs(e.buff,e.buffDays||5,scale,r.name);";
replaceOnce(warmthAnchor,warmthAfter,'useV33Pill artifactWarmth consumer');

for(const stale of [
 '"effect":{"healPct":0.55,"progress":0.024}',
 '"effect":{"qiPct":0.5,"manualProf":70}',
 '"effect":{"progress":0.035,"breakthrough":0.035}',
 '"effect":{"healPct":0.65,"breakthrough":0.04}',
 '"effect":{"qiPct":0.6,"breakthrough":0.04}',
 '"effect":{"breakthrough":0.07,"insight":1}'
])if(src.includes(stale))throw new Error('stale inert V38 pill schema survived: '+stale);
if(!src.includes("if(e.artifactWarmth){const natalId=p.natalArtifactId"))throw new Error('V38 natal pill warmth consumer missing');
if(!src.includes('"effect":{"buff":{"breakthrough":0.07},"buffDays":25,"insight":1}'))throw new Error('大乘证道丹 +7% runtime buff missing');

fs.writeFileSync(OUTPUT,src);
const sha=crypto.createHash('sha256').update(Buffer.from(src)).digest('hex');
const report=JSON.parse(fs.readFileSync(REPORT,'utf8'));
report.source_sha256=sha;
report.source_bytes=Buffer.byteLength(src);
report.changes=[...(report.changes||[]),
 'V38 high-tier pill effects now use the established V33 runtime schema: one-shot hp/qi recovery, 25-day breakthrough buffs at the originally authored magnitudes, and 本命融源丹 applies artifactWarmth to the current natal artifact up to the existing 100 warmth cap'
];
report.invariants=[...(report.invariants||[]),
 'V38 pill ingredients, learn costs, alchemy base success rates, toxicity values and authored effect magnitudes are unchanged; breakthrough formulas, enemies, drops, realm gates, RNG and action caps are unchanged'
];
fs.writeFileSync(REPORT,JSON.stringify(report,null,2)+'\n');
console.log('V310_BUILD_V6_PASS '+JSON.stringify({source_sha256:sha,v38PillRuntimeEffects:true,mahayanaBreakthroughBuff:0.07,buffDays:25,natalWarmthCap:100,gameBalanceCoefficientsPreserved:true,directSource:true}));
