import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'');
const source=fs.readFileSync('src/game-v310.js','utf8');
const dom=new JSDOM(html,{url:'http://v310-v60-gear.test/',runScripts:'outside-only',pretendToBeVisual:true});
dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
dom.window.scrollTo=()=>{};
dom.window.console={...console,log(){},info(){},debug(){}};
dom.window.eval(source);
const api=dom.window.__TAIXUAN_TEST__;
assert(api,'V60 tribulation gear audit missing test API');
api.newGame('V60抗劫装备审计');
const reg=api.contentRegistrySnapshot();
const items=reg.items||{};
const materials=reg.materials||{};
const umbrella=items['item-v39-thunder-umbrella'];
const disc=items['item-v39-tribulation-array-disc'];
assert(umbrella&&disc,'V60 dedicated tribulation artifacts missing');
for(const row of [umbrella,disc]){
 assert.equal(row.unlock,37,`${row.itemId}: must unlock before first immortal tribulation`);
 assert.equal(row.path,'none',`${row.itemId}: must remain four-path accessible`);
 assert((row.sources||[]).includes('九霄劫台'),`${row.itemId}: must be craftable at 九霄劫台 before tribulation`);
 assert(row.trueArtifact===true,`${row.itemId}: must remain a true artifact`);
}
assert.equal(umbrella.artifactSlot,'guard','thunder umbrella slot drifted');
assert.equal(disc.artifactSlot,'support','tribulation array disc slot drifted');
assert(Number(umbrella.passive?.tribulationGuard)>=.24,'umbrella generic tribulation guard weakened');
assert(Number(umbrella.passive?.thunderGuard)>=.32,'umbrella thunder guard weakened');
assert(Number(disc.passive?.tribulationGuard)>=.14,'disc tribulation guard weakened');
assert(Number(disc.passive?.formationGuard)>=.34,'disc formation guard weakened');

const requiredNamed={
 'mat-v39-thunder-crystal':3,
 'mat-v39-tribulation-gold':5,
 'mat-v38-tribulation-array-core':2
};
for(const [id,n] of Object.entries(requiredNamed)){
 const m=materials[id];assert(m,`V60 required material missing: ${id}`);
 assert(Number(m.minRealm)<=37,`V60 required material unlocks after first tribulation: ${id}`);
 assert((m.locations||[]).includes('九霄劫台')||(m.locations||[]).includes('人界议庭'),`V60 required material lacks pre-tribulation source: ${id}`);
 assert(n>0);
}
assert((materials['mat-v39-thunder-crystal'].combatKinds||[]).includes('劫雷异灵'),'thunder crystal lost 劫雷异灵 combat source');
assert((materials['mat-v39-tribulation-gold'].combatKinds||[]).includes('劫雷异灵'),'tribulation gold lost 劫雷异灵 combat source');
assert(source.includes('"id":"enemy-v39-thunder-spirit"')&&source.includes('"kind":"劫雷异灵"')&&source.includes('"areas":["九霄劫台"]'),'pre-tribulation 劫雷化灵 encounter missing from 九霄劫台');

const totalStoneCost=Number(umbrella.cost?.stones||0)+Number(disc.cost?.stones||0);
assert(totalStoneCost>=18800,'V60 dedicated preparation became trivially cheap');
const thunderArtifactGuard=Number(umbrella.passive?.tribulationGuard||0)+Number(umbrella.passive?.thunderGuard||0)+Number(disc.passive?.tribulationGuard||0);
const formationArtifactGuard=Number(umbrella.passive?.tribulationGuard||0)+Number(disc.passive?.tribulationGuard||0)+Number(disc.passive?.formationGuard||0);
assert(thunderArtifactGuard>=.70,'V60 late-thunder artifact guard insufficient');
assert(formationArtifactGuard>=.72,'V60 stage-five formation artifact guard insufficient');
console.log('V310_V60_TRIBULATION_GEAR_REGRESSION_PASS '+JSON.stringify({totalStoneCost,thunderArtifactGuard,formationArtifactGuard,preTribulationNamedCosts:requiredNamed,fourPathAccessible:true,preTribulationThunderEnemy:true}));
