import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v19.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';
const REGIONS=['青石村','青石镇','临江城','黑风岭','青云山','云梦泽','苍梧郡城','赤霞谷','落星矿脉','万兽山脉','古河遗迹','玄阴禁地'];
const NEW_REALMS=['元婴圆满','化神初期','化神中期','化神后期'];

assert(source.includes("const VERSION='1.9.0'"),'V1.9 gameplay version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=16'),'V1.9 schema 16 missing');
for(const r of NEW_REALMS)assert(source.includes(`name:'${r}'`),`new realm missing: ${r}`);
for(const marker of ['deificationEssence','deificationFailures','craftDeificationEssence','claimSpiritTransformationInheritance','太虚化神篇','神念斩','元神法域','玄阴化神残魂'])assert(source.includes(marker),`V1.9 marker missing: ${marker}`);
for(const system of ['TRAVEL_ROUTES','resolveTravelEncounter','craftCoreEssence','craftNascentEssence','claimGoldenCoreInheritance','renderSect','marketPrices','brewAlchemy','GEAR_ITEMS','processSocialEvents','renderDwelling','reincarnate','renderSecretRealm','updateFactionConflict'])assert(source.includes(system),`existing system marker lost: ${system}`);
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
for(const fn of ['newGame','getState','travel','routeInfo','breakthroughChance','attemptBreakthrough','craftCoreEssence','craftNascentEssence','craftDeificationEssence','claimGoldenCoreInheritance','claimSpiritTransformationInheritance','coreRequirements','realmSuppression','startCombat','combatAction'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);
api.newGame('V19化神回归');
let state=api.getState();
assert.equal(state.version,'1.9.0');
assert.equal(state.saveSchemaVersion,16);
assert.equal(state.player.deificationEssence,0);
assert.equal(state.player.deificationFailures,0);
assert.equal(dom.window.document.querySelectorAll('#mapList .map-node').length,12,'12-region map regressed');
assert.equal(api.routeInfo('临江城','云梦泽').length,2,'V1.6 alternate routes regressed');
assert(dom.window.document.getElementById('corePathPanel'),'core path panel missing');
assert(dom.window.document.getElementById('corePathPanel').textContent.includes('化神'),'spirit transformation UI missing');
assert(api.realmSuppression(23,19)>1,'high realm suppression regressed');

// Build a real V1.8 schema-15 save and prove migration to schema 16.
const raw=JSON.parse(dom.window.localStorage.getItem(SAVE_KEY));
const prior=JSON.parse(JSON.stringify(raw));
prior.version='1.8.0';prior.saveSchemaVersion=15;prior.player.realmIndex=21;prior.player.progress=0;prior.player.lifespan=1000;prior.player.hp=1820;prior.player.qi=1820;
delete prior.player.deificationEssence;delete prior.player.deificationFailures;
const priorDom=makeDom(JSON.stringify(prior));
priorDom.window.document.getElementById('continueBtn').click();
const priorState=priorDom.window.__TAIXUAN_TEST__.getState();
assert.equal(priorState.version,'1.9.0','V1.8 save did not upgrade to V1.9');
assert.equal(priorState.saveSchemaVersion,16,'V1.8 save did not migrate to schema 16');
assert.equal(priorState.player.deificationEssence,0,'deificationEssence migration missing');
assert.equal(priorState.player.deificationFailures,0,'deificationFailures migration missing');
assert(priorState.player.lifespan>=1000,'old Yuan Ying lifespan regressed');

// Future schema 17 stays protected and is never overwritten.
const future={...prior,saveSchemaVersion:17,version:'future-test'};
const futureRaw=JSON.stringify(future);
const futureDom=makeDom(futureRaw);
futureDom.window.document.getElementById('continueBtn').click();
assert.equal(futureDom.window.localStorage.getItem(SAVE_KEY),futureRaw,'future save was overwritten by V1.9');
assert.equal(futureDom.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded in V1.9');

// 化神道种 crafting must consume real resources, correct location and four days.
const craft=JSON.parse(JSON.stringify(priorState));
craft.version='1.9.0';craft.saveSchemaVersion=16;craft.player.realmIndex=21;craft.player.progress=0;craft.player.location='古河遗迹';craft.player.nascentEssence=3;craft.player.relicFragments=8;craft.player.beastMaterials=10;craft.player.herbs=20;craft.player.spiritStones=100;craft.player.deificationEssence=0;craft.player.deificationFailures=0;craft.player.hp=1820;craft.player.qi=1820;craft.flags={};
const craftDom=makeDom(JSON.stringify(craft));craftDom.window.document.getElementById('continueBtn').click();const craftApi=craftDom.window.__TAIXUAN_TEST__;
const beforeCraft=craftApi.getState();craftApi.craftDeificationEssence();const afterCraft=craftApi.getState();
assert.equal(afterCraft.player.deificationEssence,1,'deification essence was not crafted');
assert.equal(afterCraft.player.nascentEssence,beforeCraft.player.nascentEssence-1,'deification crafting nascent cost wrong');
assert.equal(afterCraft.player.relicFragments,beforeCraft.player.relicFragments-3,'deification crafting relic cost wrong');
assert.equal(afterCraft.player.beastMaterials,beforeCraft.player.beastMaterials-4,'deification crafting beast-material cost wrong');
assert.equal(afterCraft.player.herbs,beforeCraft.player.herbs-8,'deification crafting herb cost wrong');
assert.equal(afterCraft.player.spiritStones,beforeCraft.player.spiritStones-25,'deification crafting stone cost wrong');
assert.equal(dayNum(afterCraft.time)-dayNum(beforeCraft.time),4,'deification crafting did not consume 4 days');

// 元婴圆满 -> 化神 must hard-gate before spending time or attempts.
const gated=JSON.parse(JSON.stringify(afterCraft));
gated.player.realmIndex=22;gated.player.progress=26000;gated.player.deificationEssence=0;gated.player.nascentEssence=0;gated.player.insight=0;gated.player.injury=0;gated.player.breakthroughAttempts=0;gated.player.breakthroughPity=0;gated.player.deificationFailures=0;gated.player.lifespan=1000;gated.player.hp=2200;gated.player.qi=2300;gated.flags={};
const gateDom=makeDom(JSON.stringify(gated));gateDom.window.document.getElementById('continueBtn').click();const gateApi=gateDom.window.__TAIXUAN_TEST__;
const req=gateApi.coreRequirements();
assert.equal(req.kind,'炼神化神');assert.equal(req.deification,5);assert.equal(req.nascent,2);assert.equal(req.insight,10);assert.equal(req.days,30);
const gateBefore=gateApi.getState();gateApi.attemptBreakthrough();const gateAfter=gateApi.getState();
assert.equal(gateAfter.player.realmIndex,22,'gated deification changed realm');
assert.equal(gateAfter.player.breakthroughAttempts,0,'gated deification counted attempt');
assert.equal(dayNum(gateAfter.time),dayNum(gateBefore.time),'gated deification consumed time');

// Observe both real success and failure branches with deterministic RNG seeds.
let sawSuccess=false,sawFailure=false;
for(let seed=1;seed<=96&&!(sawSuccess&&sawFailure);seed++){
 const attempt=JSON.parse(JSON.stringify(gated));
 attempt.rng=seed;attempt.player.realmIndex=22;attempt.player.progress=26000;attempt.player.deificationEssence=10;attempt.player.nascentEssence=10;attempt.player.insight=30;attempt.player.injury=0;attempt.player.breakthroughAttempts=0;attempt.player.breakthroughPity=0;attempt.player.deificationFailures=0;attempt.player.lifespan=1000;attempt.player.hp=2200;attempt.player.qi=2300;attempt.flags={};
 const d=makeDom(JSON.stringify(attempt));d.window.document.getElementById('continueBtn').click();const a=d.window.__TAIXUAN_TEST__;const before=a.getState();a.attemptBreakthrough();const after=a.getState();
 assert.equal(after.player.deificationEssence,5,'炼神化神 did not consume 5 deification essence');
 assert.equal(after.player.nascentEssence,8,'炼神化神 did not consume 2 nascent essence');
 assert.equal(after.player.insight,20,'炼神化神 did not consume 10 insight');
 assert.equal(after.player.breakthroughAttempts,1,'炼神化神 attempt counter wrong');
 assert.equal(dayNum(after.time)-dayNum(before.time),30,'炼神化神 did not consume 30 days');
 if(after.player.realmIndex===23){sawSuccess=true;assert(after.player.lifespan>=2000,'化神 success did not extend lifespan to 2000+');assert.equal(after.player.breakthroughPity,0,'化神 success did not clear pity')}
 else{assert.equal(after.player.realmIndex,22,'化神 failure landed on invalid realm');sawFailure=true;assert.equal(after.player.deificationFailures,1,'化神 failure counter missing');assert.equal(after.player.injury,3,'化神 failure should leave player near death');assert(after.player.lifespan<1000,'化神 failure did not reduce lifespan');assert(after.player.progress<26000,'化神 failure did not knock back cultivation');assert(after.player.breakthroughPity>=16,'化神 failure did not add pity')}
}
assert(sawSuccess,'deterministic regression never observed a 化神 success');
assert(sawFailure,'deterministic regression never observed a 化神 failure');

// 化神传承 must spend resources and become real combat state.
const inherit=JSON.parse(JSON.stringify(gated));
inherit.player.realmIndex=25;inherit.player.progress=0;inherit.player.location='玄阴禁地';inherit.player.spiritStones=250;inherit.player.insight=12;inherit.player.relicFragments=12;inherit.player.hp=4200;inherit.player.qi=5100;inherit.player.deificationEssence=0;inherit.player.deificationFailures=0;inherit.flags={};
const inheritDom=makeDom(JSON.stringify(inherit));inheritDom.window.document.getElementById('continueBtn').click();const inheritApi=inheritDom.window.__TAIXUAN_TEST__;
const inheritBefore=inheritApi.getState();inheritApi.claimSpiritTransformationInheritance();const inheritAfter=inheritApi.getState();
assert.equal(inheritAfter.player.manual,'太虚化神篇','spirit manual was not equipped');
assert('神念斩'in inheritAfter.player.spells,'divine slash not learned');
assert('元神法域'in inheritAfter.player.spells,'spirit domain not learned');
assert.equal(inheritAfter.player.spiritStones,inheritBefore.player.spiritStones-120,'spirit inheritance stone cost wrong');
assert.equal(inheritAfter.player.insight,inheritBefore.player.insight-5,'spirit inheritance insight cost wrong');
assert.equal(inheritAfter.player.relicFragments,inheritBefore.player.relicFragments-5,'spirit inheritance relic cost wrong');

// Both new abilities must execute through the actual combat loop.
inheritApi.startCombat('玄阴神识鬼王');
let combat=inheritApi.getCombat();const hpBefore=combat.enemyHp,qiBefore=combat.playerQi;
inheritApi.combatAction('divine');combat=inheritApi.getCombat();
assert(combat===null||combat.enemyHp<hpBefore,'神念斩 did not damage enemy');
if(combat)assert(combat.playerQi<qiBefore,'神念斩 did not consume qi');
inheritApi.startCombat('玄阴神识鬼王');combat=inheritApi.getCombat();const qiDomain=combat.playerQi;inheritApi.combatAction('domain');combat=inheritApi.getCombat();
assert(combat&&combat.domain>=1,'元神法域 did not create persistent domain');
assert(combat.playerQi<qiDomain,'元神法域 did not consume qi');

// The top enemy must be wired to real combat rewards and drop a guaranteed 化神道种.
const beforeDrop=inheritApi.getState().player.deificationEssence;
inheritApi.startCombat('玄阴化神残魂');
for(let i=0;i<20&&inheritApi.getCombat();i++)inheritApi.combatAction('divine');
assert.equal(inheritApi.getCombat(),null,'top spirit enemy combat did not finish');
const afterDrop=inheritApi.getState();
assert(afterDrop.player.battleWins>=1,'top spirit enemy was not defeated');
assert(afterDrop.player.deificationEssence>=beforeDrop+1,'top spirit enemy did not drop guaranteed deification essence');

console.log('V19_REGRESSION_PASS',JSON.stringify({
 version:'1.9.0',schema:16,realms:26,regions:12,routes:20,deificationCraft:true,majorGate:true,
 deificationSuccess:true,deificationFailure:true,lifespan2000:true,spiritInheritance:true,spiritCombat:true,
 v18SaveUpgrade:true,futureSaveProtected:true
}));
