import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v18.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';
const REGIONS=['青石村','青石镇','临江城','黑风岭','青云山','云梦泽','苍梧郡城','赤霞谷','落星矿脉','万兽山脉','古河遗迹','玄阴禁地'];
const NEW_REALMS=['金丹圆满','元婴初期','元婴中期','元婴后期'];

assert(source.includes("const VERSION='1.8.0'"),'V1.8 gameplay version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=15'),'V1.8 schema 15 missing');
for(const r of NEW_REALMS)assert(source.includes(`name:'${r}'`),`new realm missing: ${r}`);
for(const marker of ['nascentEssence','nascentFailures','craftNascentEssence','claimGoldenCoreInheritance','丹霞金章','金焰剑诀','护体灵罡','玄阴鬼婴','碎丹化婴'])assert(source.includes(marker),`V1.8 marker missing: ${marker}`);
for(const system of ['TRAVEL_ROUTES','resolveTravelEncounter','startRegionalEvent','weightedSecretRealmTemplate','renderSect','marketPrices','brewAlchemy','GEAR_ITEMS','processSocialEvents','renderDwelling','reincarnate','renderSecretRealm','updateFactionConflict','craftCoreEssence','realmSuppressionMultiplier'])assert(source.includes(system),`existing system marker lost: ${system}`);
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
for(const fn of ['newGame','getState','travel','routeInfo','breakthroughChance','attemptBreakthrough','craftCoreEssence','craftNascentEssence','claimGoldenCoreInheritance','coreRequirements','realmSuppression','advanceDays','startCombat','combatAction'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);
api.newGame('V18元婴回归');
let state=api.getState();
assert.equal(state.version,'1.8.0');
assert.equal(state.saveSchemaVersion,15);
assert.equal(state.player.nascentEssence,0);
assert.equal(state.player.nascentFailures,0);
assert.equal(dom.window.document.querySelectorAll('#mapList .map-node').length,12,'12-region map regressed');
assert.equal(api.routeInfo('临江城','云梦泽').length,2,'V1.6 alternate routes regressed');
assert(dom.window.document.getElementById('corePathPanel'),'core path panel missing');
assert(dom.window.document.getElementById('corePathPanel').textContent.includes('元婴'),'nascent path UI missing');
assert(api.realmSuppression(19,14)>1,'nascent realm suppression missing');

// V1.7 schema-14 save must migrate to schema 15 and backfill Yuan Ying lifespan.
const raw=JSON.parse(dom.window.localStorage.getItem(SAVE_KEY));
const prior=JSON.parse(JSON.stringify(raw));
prior.version='1.7.0';prior.saveSchemaVersion=14;prior.player.realmIndex=19;prior.player.progress=0;prior.player.lifespan=500;
prior.player.coreEssence=2;prior.player.coreFailures=0;delete prior.player.nascentEssence;delete prior.player.nascentFailures;
const priorDom=makeDom(JSON.stringify(prior));priorDom.window.document.getElementById('continueBtn').click();
const priorState=priorDom.window.__TAIXUAN_TEST__.getState();
assert.equal(priorState.version,'1.8.0','V1.7 save did not upgrade to V1.8');
assert.equal(priorState.saveSchemaVersion,15,'V1.7 save did not migrate to schema 15');
assert.equal(priorState.player.nascentEssence,0,'nascentEssence migration missing');
assert.equal(priorState.player.nascentFailures,0,'nascentFailures migration missing');
assert(priorState.player.lifespan>=1000,'Yuan Ying old-save lifespan was not backfilled');

// Future schema 16 stays protected.
const future={...prior,saveSchemaVersion:16,version:'future-test'};
const futureRaw=JSON.stringify(future);const futureDom=makeDom(futureRaw);futureDom.window.document.getElementById('continueBtn').click();
assert.equal(futureDom.window.localStorage.getItem(SAVE_KEY),futureRaw,'future save was overwritten by V1.8');
assert.equal(futureDom.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded in V1.8');

// High-realm inheritance must consume resources and enter real manual/spell state.
const inherit=JSON.parse(JSON.stringify(raw));
inherit.version='1.8.0';inherit.saveSchemaVersion=15;inherit.player.realmIndex=15;inherit.player.progress=0;inherit.player.location='青云山';inherit.player.spiritStones=80;inherit.player.insight=8;inherit.player.relicFragments=5;inherit.player.nascentEssence=0;inherit.player.nascentFailures=0;inherit.flags={};
const inheritDom=makeDom(JSON.stringify(inherit));inheritDom.window.document.getElementById('continueBtn').click();const inheritApi=inheritDom.window.__TAIXUAN_TEST__;
const inheritBefore=inheritApi.getState();inheritApi.claimGoldenCoreInheritance();const inheritAfter=inheritApi.getState();
assert.equal(inheritAfter.player.manual,'丹霞金章','high manual was not equipped');
assert('金焰剑诀'in inheritAfter.player.spells,'golden sword spell not learned');
assert('护体灵罡'in inheritAfter.player.spells,'guard spell not learned');
assert.equal(inheritAfter.player.spiritStones,inheritBefore.player.spiritStones-40,'inheritance stone cost wrong');
assert.equal(inheritAfter.player.insight,inheritBefore.player.insight-3,'inheritance insight cost wrong');
assert.equal(inheritAfter.player.relicFragments,inheritBefore.player.relicFragments-2,'inheritance relic cost wrong');

// High spell buttons must use the actual combat system.
inheritApi.startCombat('灰背野狼');
let combat=inheritApi.getCombat();const hpBefore=combat.enemyHp,qiBefore=combat.playerQi;
inheritApi.combatAction('golden');combat=inheritApi.getCombat();
assert(combat===null||combat.enemyHp<hpBefore,'金焰剑诀 did not damage enemy');
if(combat)assert(combat.playerQi<qiBefore,'金焰剑诀 did not consume qi');
inheritApi.startCombat('灰背野狼');combat=inheritApi.getCombat();const qiGuard=combat.playerQi;inheritApi.combatAction('guard');combat=inheritApi.getCombat();
assert(combat&&combat.guard>=1,'护体灵罡 did not create persistent guard');
assert(combat.playerQi<qiGuard,'护体灵罡 did not consume qi');

// 化婴灵胎 crafting has a real place, material and time cost.
const craft=JSON.parse(JSON.stringify(raw));
craft.version='1.8.0';craft.saveSchemaVersion=15;craft.player.realmIndex=17;craft.player.progress=0;craft.player.location='古河遗迹';craft.player.coreEssence=3;craft.player.relicFragments=6;craft.player.herbs=20;craft.player.spiritStones=50;craft.player.nascentEssence=0;craft.player.nascentFailures=0;craft.flags={};
const craftDom=makeDom(JSON.stringify(craft));craftDom.window.document.getElementById('continueBtn').click();const craftApi=craftDom.window.__TAIXUAN_TEST__;
const beforeCraft=craftApi.getState();craftApi.craftNascentEssence();const afterCraft=craftApi.getState();
assert.equal(afterCraft.player.nascentEssence,1,'nascent essence was not crafted');
assert.equal(afterCraft.player.coreEssence,beforeCraft.player.coreEssence-1,'nascent crafting core cost wrong');
assert.equal(afterCraft.player.relicFragments,beforeCraft.player.relicFragments-2,'nascent crafting relic cost wrong');
assert.equal(afterCraft.player.herbs,beforeCraft.player.herbs-6,'nascent crafting herb cost wrong');
assert.equal(afterCraft.player.spiritStones,beforeCraft.player.spiritStones-12,'nascent crafting stone cost wrong');
assert.equal(dayNum(afterCraft.time)-dayNum(beforeCraft.time),3,'nascent crafting did not consume 3 days');

// 碎丹化婴 hard gate before spending time.
const gated=JSON.parse(JSON.stringify(afterCraft));
gated.player.realmIndex=18;gated.player.progress=9000;gated.player.coreEssence=0;gated.player.nascentEssence=0;gated.player.insight=0;gated.player.injury=0;gated.player.breakthroughAttempts=0;gated.player.breakthroughPity=0;gated.player.nascentFailures=0;gated.player.lifespan=500;gated.flags={};
const gateDom=makeDom(JSON.stringify(gated));gateDom.window.document.getElementById('continueBtn').click();const gateApi=gateDom.window.__TAIXUAN_TEST__;
const req=gateApi.coreRequirements();
assert.equal(req.kind,'碎丹化婴');assert.equal(req.core,2);assert.equal(req.nascent,4);assert.equal(req.insight,6);assert.equal(req.days,18);
const gateBefore=gateApi.getState();gateApi.attemptBreakthrough();const gateAfter=gateApi.getState();
assert.equal(gateAfter.player.realmIndex,18,'gated nascent breakthrough changed realm');
assert.equal(gateAfter.player.breakthroughAttempts,0,'gated nascent breakthrough counted attempt');
assert.equal(dayNum(gateAfter.time),dayNum(gateBefore.time),'gated nascent breakthrough consumed time');

// Deterministically observe both real success and failure branches.
let sawSuccess=false,sawFailure=false;
for(let seed=1;seed<=100&&!(sawSuccess&&sawFailure);seed++){
 const attempt=JSON.parse(JSON.stringify(gated));attempt.rng=seed;attempt.player.coreEssence=10;attempt.player.nascentEssence=10;attempt.player.insight=12;attempt.player.breakthroughAttempts=0;attempt.player.breakthroughPity=0;attempt.player.nascentFailures=0;attempt.player.injury=0;attempt.player.lifespan=500;attempt.flags={};
 const d=makeDom(JSON.stringify(attempt));d.window.document.getElementById('continueBtn').click();const a=d.window.__TAIXUAN_TEST__;const before=a.getState();a.attemptBreakthrough();const after=a.getState();
 assert.equal(after.player.coreEssence,8,'碎丹化婴 did not consume 2 core essence');
 assert.equal(after.player.nascentEssence,6,'碎丹化婴 did not consume 4 nascent essence');
 assert.equal(after.player.insight,6,'碎丹化婴 did not consume 6 insight');
 assert.equal(after.player.breakthroughAttempts,1,'碎丹化婴 attempt counter wrong');
 assert.equal(dayNum(after.time)-dayNum(before.time),18,'碎丹化婴 did not consume 18 days');
 if(after.player.realmIndex===19){sawSuccess=true;assert(after.player.lifespan>=1000,'Yuan Ying success did not extend lifespan to 1000');assert.equal(after.player.breakthroughPity,0,'success did not clear pity')}
 else{assert.equal(after.player.realmIndex,18,'Yuan Ying failure landed on invalid realm');sawFailure=true;assert.equal(after.player.nascentFailures,1,'nascent failure counter missing');assert(after.player.injury>=2,'Yuan Ying failure did not cause severe injury');assert(after.player.lifespan<500,'Yuan Ying failure did not reduce lifespan');assert(after.player.progress<9000,'Yuan Ying failure did not knock back cultivation');assert(after.player.breakthroughPity>=14,'Yuan Ying failure did not add pity')}
}
assert(sawSuccess,'deterministic regression never observed a Yuan Ying success');
assert(sawFailure,'deterministic regression never observed a Yuan Ying failure');

api.startCombat('玄阴鬼婴');
const highCombat=api.getCombat();assert(highCombat&&highCombat.enemy.name==='玄阴鬼婴','Yuan Ying enemy did not enter combat');assert.equal(highCombat.enemy.realm,20,'Yuan Ying enemy realm mismatch');

console.log('V18_REGRESSION_PASS',JSON.stringify({version:'1.8.0',schema:15,realms:22,regions:12,routes:20,inheritance:true,highSpells:true,nascentCraft:true,nascentGate:true,nascentSuccess:true,nascentFailure:true,lifespan1000:true,v17SaveUpgrade:true,futureSaveProtected:true}));
