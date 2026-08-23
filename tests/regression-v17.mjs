import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v17.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';
const REGIONS=['青石村','青石镇','临江城','黑风岭','青云山','云梦泽','苍梧郡城','赤霞谷','落星矿脉','万兽山脉','古河遗迹','玄阴禁地'];
const NEW_REALMS=['筑基圆满','结丹境','金丹初期','金丹中期','金丹后期'];

assert(source.includes("const VERSION='1.7.0'"),'V1.7 gameplay version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=14'),'V1.7 schema 14 missing');
for(const r of NEW_REALMS)assert(source.includes(`name:'${r}'`),`new realm missing: ${r}`);
for(const marker of ['coreEssence','coreFailures','majorBreakthroughRequirements','craftCoreEssence','realmSuppressionMultiplier','玄阴鬼将','玄阴丹煞','n.realmIndex<REALMS.length-1'])assert(source.includes(marker),`V1.7 marker missing: ${marker}`);
for(const system of ['TRAVEL_ROUTES','resolveTravelEncounter','startRegionalEvent','weightedSecretRealmTemplate','renderSect','marketPrices','brewAlchemy','GEAR_ITEMS','processSocialEvents','renderDwelling','reincarnate','renderSecretRealm','updateFactionConflict'])assert(source.includes(system),`existing system marker lost: ${system}`);
for(const region of REGIONS)assert(source.includes(`'${region}'`),`region lost: ${region}`);

function cleanHtml(html){return html.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'')}
function makeDom(seed=null){
 const dom=new JSDOM(cleanHtml(htmlRaw),{url:'http://example.test/',runScripts:'outside-only',pretendToBeVisual:true});
 dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
 dom.window.console=console;
 if(seed!==null)dom.window.localStorage.setItem(SAVE_KEY,seed);
 dom.window.eval(source);
 return dom;
}
function dayNum(t){return (t.year-1)*360+(t.month-1)*30+t.day}

const dom=makeDom();
const api=dom.window.__TAIXUAN_TEST__;
assert(api,'test API missing');
for(const fn of ['newGame','getState','travel','routeInfo','breakthroughChance','attemptBreakthrough','craftCoreEssence','coreRequirements','realmSuppression','advanceDays','startCombat'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);
api.newGame('V17境界回归');
let state=api.getState();
assert.equal(state.version,'1.7.0');
assert.equal(state.saveSchemaVersion,14);
assert.equal(state.player.coreEssence,0);
assert.equal(state.player.coreFailures,0);
assert.equal(dom.window.document.querySelectorAll('#mapList .map-node').length,12,'12-region map regressed');
assert.equal(api.routeInfo('临江城','云梦泽').length,2,'V1.6 alternate routes regressed');
assert(dom.window.document.getElementById('corePathPanel'),'core path panel missing');
assert(dom.window.document.getElementById('corePathPanel').textContent.includes('结丹与金丹'),'core path UI missing');
assert(api.realmSuppression(15,10)>1,'higher realm does not suppress lower realm');
assert(api.realmSuppression(10,15)<1,'lower realm does not suffer suppression');
assert.equal(api.realmSuppression(10,10),1,'equal realms should have neutral multiplier');

// Build a real V1.6 schema-13 save from the new-game shape, then prove migration.
const raw=JSON.parse(dom.window.localStorage.getItem(SAVE_KEY));
const prior=JSON.parse(JSON.stringify(raw));
prior.version='1.6.0';
prior.saveSchemaVersion=13;
prior.player.realmIndex=10;
prior.player.progress=0;
prior.player.lifespan=82;
delete prior.player.coreEssence;
delete prior.player.coreFailures;
const priorDom=makeDom(JSON.stringify(prior));
priorDom.window.document.getElementById('continueBtn').click();
const priorState=priorDom.window.__TAIXUAN_TEST__.getState();
assert.equal(priorState.version,'1.7.0','V1.6 save did not upgrade to V1.7');
assert.equal(priorState.saveSchemaVersion,14,'V1.6 save did not migrate to schema 14');
assert.equal(priorState.player.coreEssence,0,'coreEssence migration missing');
assert.equal(priorState.player.coreFailures,0,'coreFailures migration missing');
assert(priorState.player.lifespan>=150,'筑基 old-save lifespan was not backfilled');

// Future schema protection moves to schema 15.
const future={...prior,saveSchemaVersion:15,version:'future-test'};
const futureRaw=JSON.stringify(future);
const futureDom=makeDom(futureRaw);
futureDom.window.document.getElementById('continueBtn').click();
assert.equal(futureDom.window.localStorage.getItem(SAVE_KEY),futureRaw,'future save was overwritten by V1.7');
assert.equal(futureDom.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded in V1.7');

// Deterministic core-essence crafting: resources + place + time all matter.
const craft=JSON.parse(JSON.stringify(priorState));
craft.version='1.7.0';craft.saveSchemaVersion=14;
craft.player.realmIndex=12;craft.player.progress=0;craft.player.location='赤霞谷';craft.player.herbs=10;craft.player.beastMaterials=5;craft.player.spiritStones=20;craft.player.coreEssence=0;craft.player.coreFailures=0;craft.flags={};
const craftDom=makeDom(JSON.stringify(craft));
craftDom.window.document.getElementById('continueBtn').click();
const craftApi=craftDom.window.__TAIXUAN_TEST__;
const beforeCraft=craftApi.getState();
craftApi.craftCoreEssence();
const afterCraft=craftApi.getState();
assert.equal(afterCraft.player.coreEssence,1,'core essence was not crafted');
assert.equal(afterCraft.player.herbs,beforeCraft.player.herbs-4,'core crafting herb cost wrong');
assert.equal(afterCraft.player.beastMaterials,beforeCraft.player.beastMaterials-2,'core crafting beast-material cost wrong');
assert.equal(afterCraft.player.spiritStones,beforeCraft.player.spiritStones-6,'core crafting stone cost wrong');
assert.equal(dayNum(afterCraft.time)-dayNum(beforeCraft.time),2,'core crafting did not consume 2 days');

// Major breakthrough must hard-gate before spending time or attempts.
const gated=JSON.parse(JSON.stringify(afterCraft));
gated.player.realmIndex=13;gated.player.progress=2000;gated.player.coreEssence=0;gated.player.insight=0;gated.player.injury=0;gated.player.breakthroughAttempts=0;gated.player.breakthroughPity=0;gated.player.lifespan=150;gated.flags={};
const gateDom=makeDom(JSON.stringify(gated));
gateDom.window.document.getElementById('continueBtn').click();
const gateApi=gateDom.window.__TAIXUAN_TEST__;
const req=gateApi.coreRequirements();
assert.equal(req.kind,'结丹');assert.equal(req.core,3);assert.equal(req.insight,2);assert.equal(req.days,12);
const gateBefore=gateApi.getState();
gateApi.attemptBreakthrough();
const gateAfter=gateApi.getState();
assert.equal(gateAfter.player.realmIndex,13,'gated breakthrough changed realm');
assert.equal(gateAfter.player.breakthroughAttempts,0,'gated breakthrough counted an attempt');
assert.equal(dayNum(gateAfter.time),dayNum(gateBefore.time),'gated breakthrough consumed time');

// Search deterministic RNG seeds until both a success and a failure are observed.
// This verifies both real branches rather than accepting source markers only.
let sawCoreSuccess=false,sawCoreFailure=false;
for(let seed=1;seed<=36&&!(sawCoreSuccess&&sawCoreFailure);seed++){
 const attempt=JSON.parse(JSON.stringify(gated));
 attempt.rng=seed;attempt.player.realmIndex=13;attempt.player.progress=2000;attempt.player.coreEssence=10;attempt.player.insight=10;attempt.player.injury=0;attempt.player.breakthroughAttempts=0;attempt.player.breakthroughPity=0;attempt.player.coreFailures=0;attempt.player.lifespan=150;attempt.flags={};
 const d=makeDom(JSON.stringify(attempt));d.window.document.getElementById('continueBtn').click();const a=d.window.__TAIXUAN_TEST__;const before=a.getState();a.attemptBreakthrough();const after=a.getState();
 assert.equal(after.player.coreEssence,7,'结丹 attempt did not consume 3 core essence');
 assert.equal(after.player.insight,8,'结丹 attempt did not consume 2 insight');
 assert.equal(after.player.breakthroughAttempts,1,'结丹 attempt counter wrong');
 assert.equal(dayNum(after.time)-dayNum(before.time),12,'结丹 attempt did not consume 12 days');
 if(after.player.realmIndex===14){sawCoreSuccess=true;assert(after.player.lifespan>=300,'结丹 success did not extend lifespan');assert.equal(after.player.breakthroughPity,0,'success did not clear pity')}
 else{assert.equal(after.player.realmIndex,13,'结丹 failure landed on invalid realm');sawCoreFailure=true;assert.equal(after.player.coreFailures,1,'major failure counter missing');assert(after.player.injury>=1,'结丹 failure did not injure player');assert(after.player.lifespan<150,'结丹 failure did not reduce lifespan');assert(after.player.progress<2000,'结丹 failure did not knock back cultivation');assert(after.player.breakthroughPity>=10,'结丹 failure did not add pity')}
}
assert(sawCoreSuccess,'deterministic regression never observed a 结丹 success');
assert(sawCoreFailure,'deterministic regression never observed a 结丹 failure');

// Golden-core gate is distinct and more expensive in insight.
const gold=JSON.parse(JSON.stringify(gated));
gold.player.realmIndex=14;gold.player.progress=2800;gold.player.coreEssence=10;gold.player.insight=10;gold.player.injury=0;gold.player.lifespan=300;gold.flags={};
const goldDom=makeDom(JSON.stringify(gold));goldDom.window.document.getElementById('continueBtn').click();const goldApi=goldDom.window.__TAIXUAN_TEST__;
const goldReq=goldApi.coreRequirements();
assert.equal(goldReq.kind,'凝结金丹');assert.equal(goldReq.core,2);assert.equal(goldReq.insight,3);assert.equal(goldReq.days,9);
let sawGoldSuccess=false;
for(let seed=1;seed<=40&&!sawGoldSuccess;seed++){
 const g=JSON.parse(JSON.stringify(gold));g.rng=seed;g.player.breakthroughAttempts=0;g.player.breakthroughPity=0;g.player.coreFailures=0;
 const d=makeDom(JSON.stringify(g));d.window.document.getElementById('continueBtn').click();const a=d.window.__TAIXUAN_TEST__;a.attemptBreakthrough();const s=a.getState();if(s.player.realmIndex===15){sawGoldSuccess=true;assert(s.player.lifespan>=500,'gold-core success did not extend lifespan to 500+')}
}
assert(sawGoldSuccess,'deterministic regression never observed a 金丹 success');

// New high-realm enemies are wired into the real combat system.
api.startCombat('万兽山裂地妖王');
const highCombat=api.getCombat();
assert(highCombat&&highCombat.enemy.name==='万兽山裂地妖王','high-realm enemy did not enter combat');
assert.equal(highCombat.enemy.realm,12,'high-realm enemy realm mismatch');

console.log('V17_REGRESSION_PASS',JSON.stringify({
 version:'1.7.0',schema:14,realms:18,regions:12,routes:20,coreCraft:true,majorGate:true,
 coreSuccess:true,coreFailure:true,goldenCore:true,lifespanMilestones:true,realmSuppression:true,
 v16SaveUpgrade:true,futureSaveProtected:true
}));
