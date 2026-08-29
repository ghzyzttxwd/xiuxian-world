import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v27.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';

assert(source.includes("const VERSION='2.7.0'"),'V2.7 gameplay version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=24'),'schema 24 missing');
assert(!source.includes('天道酬勤'),'removed cultivation cheat text returned');
for(const marker of ['ensureNpcLifeShape','npcMemorials','npcLifeEvents','simulateNpcAdventure','simulateNpcSecretRealm','simulateNpcFactionBattle','simulateNpcNetworkTick','findNpcBattleAlly','npcBattleAllyTurn','renderNpcFatePanel','SECT_MENTOR_LIFE_DEFAULTS','simulateSectLife','finalizeLifespanDeath'])assert(source.includes(marker),`V2.7 marker missing: ${marker}`);

function cleanHtml(html){return html.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'')}
function makeDom(seed=null){const dom=new JSDOM(cleanHtml(htmlRaw),{url:'http://example.test/',runScripts:'outside-only',pretendToBeVisual:true});dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});dom.window.scrollTo=()=>{};dom.window.console=console;if(seed!==null)dom.window.localStorage.setItem(SAVE_KEY,seed);dom.window.eval(source);return dom}
function loadState(obj){const d=makeDom(JSON.stringify(obj));d.window.document.getElementById('continueBtn').click();return d}
function baseState(){const d=makeDom();const api=d.window.__TAIXUAN_TEST__;api.newGame('V27回归');return api.getState()}
function hardySeed(){const s=baseState();Object.assign(s.player,{realmIndex:14,progress:0,location:'青云山',hp:450,qi:340,injury:0,spiritStones:500,herbs:50,sect:'青云宗',sectRank:'真传弟子',sectContribution:500,sectTasksCompleted:20,sectSeniorTasksCompleted:5,factionStanding:{qingyun:80,xuanshui:0,blood:-20}});s.flags={};return s}

const dom=makeDom(),api=dom.window.__TAIXUAN_TEST__;
assert(api,'test API missing');
for(const fn of ['newGame','getState','npcLifeInfo','simulateNpcAdventureById','simulateNpcSecretRealmById','simulateNpcFactionBattleById','simulateNpcNetworkTick','npcRelationBetweenById','changeNpcRelationPairById','npcDieById','forceNpcBattleAlly','startCombat','combatAction','advanceDays','sectLifeInfo','realmBalance'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);

api.newGame('人物命运测试');let state=api.getState();
assert.equal(state.version,'2.7.0');assert.equal(state.saveSchemaVersion,24);assert.equal(state.player.npcBattleAssists,0);assert.equal(state.player.npcFriendDeaths,0);assert.equal(typeof state.world.npcRelations,'object');assert(Array.isArray(state.world.npcMemorials));assert.equal(state.world.npcLifeEvents,0);assert(state.npcs.every(n=>Number.isFinite(n.bornDay)&&n.injury===0&&n.adventures===0&&n.secretRealmTrips===0&&n.factionBattles===0),'new NPC fate fields missing');

// V2.6 schema23 -> V2.7 schema24: preserve existing NPC identity/relations while adding fate fields.
const old=baseState();old.version='2.6.0';old.saveSchemaVersion=23;old.npcs[0].relation=47;old.npcs[0].grudge=6;delete old.player.npcBattleAssists;delete old.player.npcFriendDeaths;delete old.world.npcRelations;delete old.world.npcMemorials;delete old.world.npcLifeEvents;for(const n of old.npcs)for(const k of ['bornDay','injury','adventures','secretRealmTrips','factionBattles','deathCause','deathDay','lastFateDay','lastSecretRealmKey','lastFactionLifeDay','battleAssists'])delete n[k];const od=loadState(old),os=od.window.__TAIXUAN_TEST__.getState();assert.equal(os.version,'2.7.0');assert.equal(os.saveSchemaVersion,24);assert.equal(os.npcs[0].relation,47);assert.equal(os.npcs[0].grudge,6);assert(Number.isFinite(os.npcs[0].bornDay));assert.equal(os.npcs[0].injury,0);assert.equal(os.player.npcBattleAssists,0);assert.equal(os.player.npcFriendDeaths,0);assert(Array.isArray(os.world.npcMemorials));

// Future schema25 must not load or overwrite.
const future={...old,saveSchemaVersion:25,version:'future-v27'};const futureRaw=JSON.stringify(future);const fd=makeDom(futureRaw);fd.window.document.getElementById('continueBtn').click();assert.equal(fd.window.localStorage.getItem(SAVE_KEY),futureRaw,'future schema was overwritten');assert.equal(fd.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded');

// Dynamic age + realm lifespan can truly remove an ordinary NPC from the world.
const ls=hardySeed();ls.npcs[0].known=true;ls.npcs[0].realmIndex=0;ls.npcs[0].bornDay=-999999;ls.npcs[0].alive=true;const ld=loadState(ls),la=ld.window.__TAIXUAN_TEST__;la.advanceDays(1);const linfo=la.npcLifeInfo(),ln=linfo.npcs.find(n=>n.id===ls.npcs[0].id);assert.equal(ln.alive,false,'over-age ordinary NPC did not die');assert.equal(ln.deathCause,'寿元耗尽坐化');assert(linfo.memorials.some(x=>x.id===ln.id),'lifespan death missing from memorials');

// A close friend's death becomes a permanent memorial and a player-facing loss counter.
const fsd=hardySeed();Object.assign(fsd.npcs[1],{known:true,relation:72,grudge:0,alive:true});const fdd=loadState(fsd),fa=fdd.window.__TAIXUAN_TEST__;const friendId=fa.getState().npcs[1].id;fa.npcDieById(friendId,'秘境重伤不治');const finfo=fa.npcLifeInfo(),fn=finfo.npcs.find(n=>n.id===friendId);assert.equal(fn.alive,false);assert.equal(fn.deathCause,'秘境重伤不治');assert.equal(finfo.friendDeaths,1);assert(finfo.memorials.some(x=>x.id===friendId&&x.cause==='秘境重伤不治'),'friend death not memorialized');

// NPC-to-NPC relations are persistent and can cross both friendship and feud thresholds.
const ns=hardySeed();ns.npcs[0].known=true;ns.npcs[1].known=true;ns.npcs[0].location='临江城';ns.npcs[1].location='临江城';const nd=loadState(ns),na=nd.window.__TAIXUAN_TEST__;const idA=na.getState().npcs[0].id,idB=na.getState().npcs[1].id;assert.equal(na.changeNpcRelationPairById(idA,idB,45),45);assert.equal(na.npcRelationBetweenById(idA,idB),45);assert.equal(na.changeNpcRelationPairById(idA,idB,-95),-50);assert.equal(na.npcRelationBetweenById(idA,idB),-50);assert(Object.keys(na.npcLifeInfo().relations).length>=1,'NPC relation network was not stored');

// Independent dangerous-region adventure has real success/injury/death state.
const adv=hardySeed();Object.assign(adv.npcs[2],{known:true,location:'玄阴禁地',injury:0,alive:true});const avd=loadState(adv),ava=avd.window.__TAIXUAN_TEST__,advId=ava.getState().npcs[2].id;ava.simulateNpcAdventureById(advId,'injury');let avn=ava.npcLifeInfo().npcs.find(n=>n.id===advId);assert.equal(avn.adventures,1);assert.equal(avn.injury,1);ava.simulateNpcAdventureById(advId,'success');avn=ava.npcLifeInfo().npcs.find(n=>n.id===advId);assert.equal(avn.adventures,2);assert.equal(avn.alive,true);

// NPC can independently enter the active secret realm and return injured.
const ss=hardySeed();Object.assign(ss.npcs[3],{known:true,location:'古河遗迹',injury:0,alive:true});ss.world.secretRealm={id:'test-secret',name:'测试古河秘境',location:'古河遗迹',threat:12,openDay:1,closeDay:999,stage:0,cleared:false};const sd=loadState(ss),sa=sd.window.__TAIXUAN_TEST__,sid=sa.getState().npcs[3].id;assert.equal(sa.simulateNpcSecretRealmById(sid,'injury'),'injury');const sn=sa.npcLifeInfo().npcs.find(n=>n.id===sid);assert.equal(sn.secretRealmTrips,1);assert.equal(sn.injury,1);assert.equal(sa.simulateNpcSecretRealmById(sid,'success'),'already','same NPC re-entered the same secret realm twice');

// Faction-aligned NPC participates in an actual active Qingyun/Blood Blade conflict and can die there.
const ws=hardySeed();Object.assign(ws.npcs[4],{known:true,faction:'青云宗',location:'青云山',alive:true,injury:0});ws.major.factionWar={id:'factionWar',status:'active',location:'临江城',start:1,end:999,participated:false};const wd=loadState(ws),wa=wd.window.__TAIXUAN_TEST__,wid=wa.getState().npcs[4].id;assert.equal(wa.simulateNpcFactionBattleById(wid,'death'),'death');const wn=wa.npcLifeInfo().npcs.find(n=>n.id===wid);assert.equal(wn.alive,false);assert.equal(wn.factionBattles,1);assert.equal(wn.deathCause,'在青云宗与血刀门的大战中战死');assert(wa.npcLifeInfo().memorials.some(x=>x.id===wid),'war death missing from memorials');

// A close living friend can be forced into a real combat assist; the ally must actually damage the enemy.
const bs=hardySeed();Object.assign(bs.player,{realmIndex:14,hp:450,qi:340,location:'古河遗迹'});Object.assign(bs.npcs[0],{known:true,relation:85,grudge:0,location:'古河遗迹',alive:true,injury:0,realmIndex:3,talent:100});const bd=loadState(bs),ba=bd.window.__TAIXUAN_TEST__,bid=ba.getState().npcs[0].id;ba.forceNpcBattleAlly(bid);ba.startCombat('古河尸傀');let combat=ba.getCombat();assert.equal(combat.allyNpcId,bid,'forced close friend was not attached to combat');const enemyHp0=combat.enemyHp;ba.combatAction('defend');combat=ba.getCombat();assert(combat,'ally test combat ended unexpectedly');assert(combat.enemyHp<enemyHp0,'ally did not deal real enemy HP damage');assert.equal(ba.npcLifeInfo().battleAssists,1);assert.equal(ba.npcLifeInfo().npcs.find(n=>n.id===bid).battleAssists,1);

// V2.6 living sect and V2.4 survival foundations remain intact.
assert.equal(api.realmBalance().length,26);assert.equal(typeof api.sectLifeInfo,'function');assert.equal(api.sectLifeInfo().peers.length,6);

console.log('V27_REGRESSION_PASS',JSON.stringify({version:'2.7.0',schema:24,dynamicNpcAge:true,npcLifespanDeath:true,memorials:true,npcNetwork:true,adventures:true,secretRealmParticipation:true,factionWarParticipation:true,realFriendAssist:true,v26SectLifePreserved:true,futureSaveProtected:true}));
