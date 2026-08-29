import fs from 'fs';
import assert from 'assert';
import {execFileSync} from 'child_process';
import {JSDOM} from 'jsdom';

function run(file){execFileSync(process.execPath,[file],{stdio:'pipe'});}
function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 assert(first>=0,`${label}: baseline anchor missing`);
 assert.equal(src.indexOf(before,first+1),-1,`${label}: baseline anchor ambiguous`);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

run('tools/build-v310-balance-v5.cjs');
const baseline=fs.readFileSync('src/game-v310.js','utf8');
run('tools/build-v310-balance-v6.cjs');
const fixed=fs.readFileSync('src/game-v310.js','utf8');

let expected=baseline;
const edits=[
 ['"id":"recipe-v38-worldbody","itemId":"item-pill-v38-worldbody","name":"界脉锻体丹","unlock":34,"qualityId":"tian","sources":["天穹祖脉"],"ingredients":{"mat-v38-heaven-vein-marrow":2,"mat-v38-worldheart-wood":1,"mat-v37-dao-blood":1},"effect":{"healPct":0.55,"progress":0.024}',
  '"id":"recipe-v38-worldbody","itemId":"item-pill-v38-worldbody","name":"界脉锻体丹","unlock":34,"qualityId":"tian","sources":["天穹祖脉"],"ingredients":{"mat-v38-heaven-vein-marrow":2,"mat-v38-worldheart-wood":1,"mat-v37-dao-blood":1},"effect":{"hp":0.55,"progress":0.024}', 'worldbody'],
 ['"id":"recipe-v38-worldsoul","itemId":"item-pill-v38-worldsoul","name":"天心养神丹","unlock":35,"qualityId":"tian","sources":["人界议庭"],"ingredients":{"mat-v38-soulstar-dew":2,"mat-v38-world-essence-dew":1,"mat-v37-soul-covenant-stone":1},"effect":{"qiPct":0.5,"manualProf":70}',
  '"id":"recipe-v38-worldsoul","itemId":"item-pill-v38-worldsoul","name":"天心养神丹","unlock":35,"qualityId":"tian","sources":["人界议庭"],"ingredients":{"mat-v38-soulstar-dew":2,"mat-v38-world-essence-dew":1,"mat-v37-soul-covenant-stone":1},"effect":{"qi":0.5,"manualProf":70}', 'worldsoul'],
 ['"id":"recipe-v38-authority","itemId":"item-pill-v38-authority","name":"镇世归元丹","unlock":35,"qualityId":"tian","sources":["人界议庭"],"ingredients":{"mat-v38-sovereign-seal":1,"mat-v38-origin-crystal":2,"mat-v38-heaven-vein-marrow":1},"effect":{"progress":0.035,"breakthrough":0.035}',
  '"id":"recipe-v38-authority","itemId":"item-pill-v38-authority","name":"镇世归元丹","unlock":35,"qualityId":"tian","sources":["人界议庭"],"ingredients":{"mat-v38-sovereign-seal":1,"mat-v38-origin-crystal":2,"mat-v38-heaven-vein-marrow":1},"effect":{"progress":0.035,"buff":{"breakthrough":0.035},"buffDays":25}', 'authority'],
 ['"id":"recipe-v38-tribulation-body","itemId":"item-pill-v38-tribulation-body","name":"抗劫炼体丹","unlock":36,"qualityId":"tian","sources":["九霄劫台"],"ingredients":{"mat-v38-tribulation-stone":2,"mat-v38-heaven-vein-marrow":1,"mat-v38-immortal-mortal-dust":1},"effect":{"healPct":0.65,"breakthrough":0.04}',
  '"id":"recipe-v38-tribulation-body","itemId":"item-pill-v38-tribulation-body","name":"抗劫炼体丹","unlock":36,"qualityId":"tian","sources":["九霄劫台"],"ingredients":{"mat-v38-tribulation-stone":2,"mat-v38-heaven-vein-marrow":1,"mat-v38-immortal-mortal-dust":1},"effect":{"hp":0.65,"buff":{"breakthrough":0.04},"buffDays":25}', 'trib-body'],
 ['"id":"recipe-v38-tribulation-soul","itemId":"item-pill-v38-tribulation-soul","name":"定神抗劫丹","unlock":36,"qualityId":"tian","sources":["九霄劫台"],"ingredients":{"mat-v38-soulstar-dew":2,"mat-v38-tribulation-stone":1,"mat-v38-immortal-mortal-dust":1},"effect":{"qiPct":0.6,"breakthrough":0.04}',
  '"id":"recipe-v38-tribulation-soul","itemId":"item-pill-v38-tribulation-soul","name":"定神抗劫丹","unlock":36,"qualityId":"tian","sources":["九霄劫台"],"ingredients":{"mat-v38-soulstar-dew":2,"mat-v38-tribulation-stone":1,"mat-v38-immortal-mortal-dust":1},"effect":{"qi":0.6,"buff":{"breakthrough":0.04},"buffDays":25}', 'trib-soul'],
 ['"id":"recipe-v38-mahayana-break","itemId":"item-pill-v38-mahayana-break","name":"大乘证道丹","unlock":33,"qualityId":"tian","sources":["界源海","天穹祖脉"],"ingredients":{"mat-v38-mahayana-essence":1,"mat-v38-origin-crystal":2,"mat-v38-world-essence-dew":1},"effect":{"breakthrough":0.07,"insight":1}',
  '"id":"recipe-v38-mahayana-break","itemId":"item-pill-v38-mahayana-break","name":"大乘证道丹","unlock":33,"qualityId":"tian","sources":["界源海","天穹祖脉"],"ingredients":{"mat-v38-mahayana-essence":1,"mat-v38-origin-crystal":2,"mat-v38-world-essence-dew":1},"effect":{"buff":{"breakthrough":0.07},"buffDays":25,"insight":1}', 'mahayana-break']
];
for(const [before,after,label] of edits)expected=replaceOnce(expected,before,after,label);
const warmthBefore=" if(e.lifespan){const n=Math.max(1,Math.floor(e.lifespan));p.lifespan+=n;p.lifeExtensionPillsUsed++;notes.push('寿元 +'+n+'年')}\n if(e.buff)v33ApplyBuffs(e.buff,e.buffDays||5,scale,r.name);";
const warmthAfter=" if(e.lifespan){const n=Math.max(1,Math.floor(e.lifespan));p.lifespan+=n;p.lifeExtensionPillsUsed++;notes.push('寿元 +'+n+'年')}\n if(e.artifactWarmth){const natalId=p.natalArtifactId,rec=natalId&&p.equipmentInventory?.[natalId];if(rec){const before=Number(rec.warmth)||0,gain=Math.max(1,Math.floor(Number(e.artifactWarmth)*scale));rec.warmth=Math.min(100,before+gain);notes.push('本命温养 +'+(rec.warmth-before))}}\n if(e.buff)v33ApplyBuffs(e.buff,e.buffDays||5,scale,r.name);";
expected=replaceOnce(expected,warmthBefore,warmthAfter,'artifactWarmth consumer');
assert.equal(fixed,expected,'V6 changed gameplay source outside the intended V38 pill-effect repair');

const report=JSON.parse(fs.readFileSync('BUILD_V310_BALANCE.json','utf8'));
assert.equal(report.status,'PASS');
assert.equal(report.gameplay_version,'3.10.0');
assert.equal(report.build,'31001');
assert(report.changes.some(x=>String(x).includes('V38 high-tier pill effects')),'build report missing V38 pill repair');

const html=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'');
function makeApi(){
 const dom=new JSDOM(html,{url:'http://v310-v38-pill.test/',runScripts:'outside-only',pretendToBeVisual:true});
 dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
 dom.window.scrollTo=()=>{};
 dom.window.console={...console,log(){},info(){},debug(){}};
 dom.window.eval(fixed);
 const api=dom.window.__TAIXUAN_TEST__;
 assert(api,'V38 pill regression missing test API');
 api.newGame('V38丹药审计');
 return api;
}

{
 const api=makeApi();
 api.v38SetPlayerForTest({realmIndex:33,location:'界源海',insight:40,progressFull:true});
 const before=api.getState().player.insight;
 const used=api.useV33Pill('recipe-v38-mahayana-break','common',true);
 assert.equal(api.v33BuffValue('breakthrough'),0.07,'大乘证道丹 +7% breakthrough effect is inert');
 assert.equal(api.getState().player.insight,before+1,'大乘证道丹 insight effect drifted');
 assert(used?.notes?.some(x=>String(x).includes('悟道')),'大乘证道丹 runtime note missing insight effect');
}
{
 const api=makeApi();
 const body=api.useV33Pill('recipe-v38-worldbody','common',true);
 assert(body?.notes?.some(x=>String(x).startsWith('气血 +')),'界脉锻体丹 hp recovery consumer did not run');
}
{
 const api=makeApi();
 const soul=api.useV33Pill('recipe-v38-worldsoul','common',true);
 assert(soul?.notes?.some(x=>String(x).startsWith('灵力 +')),'天心养神丹 qi recovery consumer did not run');
}
{
 const api=makeApi();
 const authority=api.useV33Pill('recipe-v38-authority','common',true);
 assert.equal(api.v33BuffValue('breakthrough'),0.035,'镇世归元丹 breakthrough buff did not run');
 assert(authority&&typeof authority==='object');
}
{
 const api=makeApi();
 const body=api.useV33Pill('recipe-v38-tribulation-body','common',true);
 assert.equal(api.v33BuffValue('breakthrough'),0.04,'抗劫炼体丹 breakthrough buff did not run');
 assert(body?.notes?.some(x=>String(x).startsWith('气血 +')),'抗劫炼体丹 hp effect did not run');
}
{
 const api=makeApi();
 const soul=api.useV33Pill('recipe-v38-tribulation-soul','common',true);
 assert.equal(api.v33BuffValue('breakthrough'),0.04,'定神抗劫丹 breakthrough buff did not run');
 assert(soul?.notes?.some(x=>String(x).startsWith('灵力 +')),'定神抗劫丹 qi effect did not run');
}
{
 const api=makeApi();
 api.v38SetPlayerForTest({realmIndex:33,location:'界源海'});
 assert.notEqual(api.forgeV32Item('item-gear-danxia',true,'normal'),'missing');
 assert(['ok','bound'].includes(api.bindV32Artifact('item-gear-danxia',true)));
 assert(['ok','natal'].includes(api.makeNatalV32Artifact('item-gear-danxia',true)));
 const before=api.getState().player.equipmentInventory['item-gear-danxia'].warmth;
 const used=api.useV33Pill('recipe-v38-natal-source','common',true);
 const after=api.getState().player.equipmentInventory['item-gear-danxia'].warmth;
 assert(after>before,'本命融源丹 artifactWarmth remained inert');
 assert(after<=100,'本命融源丹 exceeded the existing warmth cap');
 assert(used?.notes?.some(x=>String(x).startsWith('本命温养 +')),'本命融源丹 runtime warmth note missing');
}
{
 const api=makeApi();
 const recipes=Object.values(api.contentRegistrySnapshot().recipes||{});
 const supported=new Set(['hp','qi','injury','toxicity','progress','insight','manualProf','lifespan','buff','buffDays','path','maxUses','artifactWarmth','v39Guard','v39Value']);
 const unknown=[];
 for(const r of recipes)for(const key of Object.keys(r.effect||{}))if(!supported.has(key))unknown.push(`${r.id}:${key}`);
 assert.deepEqual(unknown,[],'recipe effect keys exist without a runtime consumer');
}

console.log('V310_V38_PILL_EFFECT_REGRESSION_PASS '+JSON.stringify({singleGameplayPatch:true,worldbodyHp:true,worldsoulQi:true,breakthroughBuffs:[0.035,0.04,0.07],buffDays:25,natalArtifactWarmth:true,warmthCap:100,allRecipeEffectKeysConsumed:true,ingredientsAndAlchemyOddsUnchanged:true}));
