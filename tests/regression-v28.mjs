import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v28.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';

assert(source.includes("const VERSION='2.8.0'"),'V2.8 gameplay version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=25'),'schema 25 missing');
assert(!source.includes('天道酬勤'),'removed cultivation cheat text returned');
for(const marker of ['ensureNpcConsequenceShape','npcPendingRequest','favorDebt','resolveNpcHelpRequest','triggerNpcFavorReturn','simulateNpcFeud','simulateNpcFactionShift','simulateNpcMajorLifeEvent','simulateNPCsV28','renderNpcConsequencePanel','ensureNpcLifeShape','simulateNpcAdventure','findNpcBattleAlly','simulateSectLife','finalizeLifespanDeath'])assert(source.includes(marker),`V2.8 marker missing: ${marker}`);

function cleanHtml(html){return html.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'')}
function makeDom(seed=null){const dom=new JSDOM(cleanHtml(htmlRaw),{url:'http://example.test/',runScripts:'outside-only',pretendToBeVisual:true});dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});dom.window.scrollTo=()=>{};dom.window.console=console;if(seed!==null)dom.window.localStorage.setItem(SAVE_KEY,seed);dom.window.eval(source);return dom}
function loadState(obj){const d=makeDom(JSON.stringify(obj));d.window.document.getElementById('continueBtn').click();return d}
function baseState(){const d=makeDom();const api=d.window.__TAIXUAN_TEST__;api.newGame('V28回归');return api.getState()}
function hardySeed(){const s=baseState();Object.assign(s.player,{realmIndex:14,progress:0,location:'临江城',hp:450,qi:340,injury:0,spiritStones:500,herbs:50,healingPills:5,sect:'青云宗',sectRank:'真传弟子',sectContribution:500,sectTasksCompleted:20,sectSeniorTasksCompleted:5,factionStanding:{qingyun:80,xuanshui:0,blood:-20}});s.flags={};return s}

const dom=makeDom(),api=dom.window.__TAIXUAN_TEST__;
assert(api,'test API missing');
for(const fn of ['newGame','getState','npcConsequenceInfo','forceNpcHelpRequestById','resolveNpcHelpRequestForTest','triggerNpcFavorReturnById','simulateNpcFeudByIds','simulateNpcFactionShiftById','simulateNpcMajorLifeEventById','npcLifeInfo','simulateNpcAdventureById','changeNpcRelationPairById','forceNpcBattleAlly','startCombat','combatAction','advanceDays','sectLifeInfo','realmBalance'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);

api.newGame('人生后果测试');let state=api.getState(),info=api.npcConsequenceInfo();
assert.equal(state.version,'2.8.0');assert.equal(state.saveSchemaVersion,25);assert.equal(state.player.npcRequestsHelped,0);assert.equal(state.player.npcRequestsRefused,0);assert.equal(state.player.npcFavorReturns,0);assert.equal(state.world.npcPendingRequest,null);assert.equal(state.world.npcConsequenceEvents,0);assert.equal(state.world.npcConflictDeaths,0);assert.equal(state.world.npcFactionChanges,0);assert.equal(state.world.npcMajorLifeEvents,0);assert(state.npcs.every(n=>n.favorDebt===0&&n.lastRequestDay===0&&n.lastConflictDay===0&&n.lastFactionChangeDay===0&&n.majorLifeEvents===0&&n.retiredUntilDay===0),'new NPC consequence fields missing');
assert.equal(info.helped,0);

// V2.7 schema24 -> V2.8 schema25 preserves fate state while adding consequence fields.
const old=baseState();old.version='2.7.0';old.saveSchemaVersion=24;old.npcs[0].relation=51;old.npcs[0].adventures=3;delete old.player.npcRequestsHelped;delete old.player.npcRequestsRefused;delete old.player.npcFavorReturns;for(const k of ['npcPendingRequest','npcConsequenceEvents','npcConflictDeaths','npcFactionChanges','npcMajorLifeEvents'])delete old.world[k];for(const n of old.npcs)for(const k of ['favorDebt','lastRequestDay','lastFavorReturnDay','lastConflictDay','lastFactionChangeDay','majorLifeEvents','lastMajorLifeDay','retiredUntilDay','lifeTag'])delete n[k];const od=loadState(old),oa=od.window.__TAIXUAN_TEST__,os=oa.getState();assert.equal(os.version,'2.8.0');assert.equal(os.saveSchemaVersion,25);assert.equal(os.npcs[0].relation,51);assert.equal(os.npcs[0].adventures,3);assert.equal(os.npcs[0].favorDebt,0);assert.equal(os.player.npcRequestsHelped,0);assert.equal(os.world.npcConsequenceEvents,0);

// Future schema26 must not load or overwrite.
const future={...old,saveSchemaVersion:26,version:'future-v28'};const futureRaw=JSON.stringify(future);const fd=makeDom(futureRaw);fd.window.document.getElementById('continueBtn').click();assert.equal(fd.window.localStorage.getItem(SAVE_KEY),futureRaw,'future schema was overwritten');assert.equal(fd.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded');

// A close injured NPC can ask for concrete aid. Helping consumes real resources and creates favor debt.
const hs=hardySeed();Object.assign(hs.npcs[0],{known:true,relation:55,grudge:0,location:'临江城',alive:true,injury:2,favorDebt:0});const hd=loadState(hs),ha=hd.window.__TAIXUAN_TEST__,hid=ha.getState().npcs[0].id;const hReq=ha.forceNpcHelpRequestById(hid,'healing');assert(hReq&&hReq.type==='healing');const healBefore=ha.getState().player.healingPills;assert.equal(ha.resolveNpcHelpRequestForTest('help'),'helped');let hstate=ha.getState(),hn=hstate.npcs.find(n=>n.id===hid);assert.equal(hstate.player.healingPills,healBefore-1);assert(hn.injury<=0,'help did not heal NPC');assert(hn.relation>55,'help did not improve relation');assert(hn.favorDebt>=2,'help did not create favor debt');assert.equal(hstate.player.npcRequestsHelped,1);

// Refusing a request has a persistent relationship consequence.
const rs=hardySeed();Object.assign(rs.npcs[1],{known:true,relation:50,location:'临江城',alive:true,injury:0});const rd=loadState(rs),ra=rd.window.__TAIXUAN_TEST__,rid=ra.getState().npcs[1].id;ra.forceNpcHelpRequestById(rid,'stones');assert.equal(ra.resolveNpcHelpRequestForTest('refuse'),'refused');const rn=ra.getState().npcs.find(n=>n.id===rid);assert.equal(rn.relation,44);assert.equal(ra.getState().player.npcRequestsRefused,1);

// Favor debt can return as actual resources later, and the debt is paid down rather than being decorative.
const fsd=hardySeed();Object.assign(fsd.npcs[2],{known:true,relation:70,location:'临江城',alive:true,favorDebt:2});const fdd=loadState(fsd),fa=fdd.window.__TAIXUAN_TEST__,fid=fa.getState().npcs[2].id,stones0=fa.getState().player.spiritStones;const ret=fa.triggerNpcFavorReturnById(fid);assert(ret&&ret.stones>0);const fst=fa.getState(),fn=fst.npcs.find(n=>n.id===fid);assert(fst.player.spiritStones>stones0);assert.equal(fn.favorDebt,1);assert.equal(fst.player.npcFavorReturns,1);

// A deeply hostile NPC pair can escalate into a real lethal feud, creating the existing V2.7 memorial record.
const es=hardySeed();Object.assign(es.npcs[3],{known:true,alive:true,location:'古河遗迹',injury:0,relation:0,grudge:0});Object.assign(es.npcs[4],{known:true,alive:true,location:'古河遗迹',injury:0,relation:0,grudge:0});const ed=loadState(es),ea=ed.window.__TAIXUAN_TEST__,eidA=ea.getState().npcs[3].id,eidB=ea.getState().npcs[4].id;ea.changeNpcRelationPairById(eidA,eidB,-80);const feud=ea.simulateNpcFeudByIds(eidA,eidB,'death');assert(feud&&feud.outcome==='death');const est=ea.getState(),alivePair=est.npcs.filter(n=>n.id===eidA||n.id===eidB);assert.equal(alivePair.filter(n=>n.alive).length,1);assert.equal(est.world.npcConflictDeaths,1);assert(ea.npcLifeInfo().memorials.some(x=>x.id===feud.loserId&&String(x.cause).includes('旧怨决战')),'lethal feud missing from memorials');

// A wanderer can actually join a faction and affect the faction population/power state.
const ss=hardySeed();Object.assign(ss.npcs[5],{known:true,alive:true,faction:'散修',location:'临江城',lastFactionChangeDay:0});const sd=loadState(ss),sa=sd.window.__TAIXUAN_TEST__,sid=sa.getState().npcs[5].id,q0=sa.getState().world.qingyunPower;assert.equal(sa.simulateNpcFactionShiftById(sid,'青云宗'),'青云宗');const sst=sa.getState(),sn=sst.npcs.find(n=>n.id===sid);assert.equal(sn.faction,'青云宗');assert.equal(sst.world.npcFactionChanges,1);assert(sst.world.qingyunPower>=q0,'faction join did not affect Qingyun power');

// Major life events change durable NPC state instead of only writing logs.
const ms=hardySeed();Object.assign(ms.npcs[6],{known:true,alive:true,progress:10,wealth:1,lastMajorLifeDay:0});const md=loadState(ms),ma=md.window.__TAIXUAN_TEST__,mid=ma.getState().npcs[6].id,m0=ma.getState().npcs.find(n=>n.id===mid);assert.equal(ma.simulateNpcMajorLifeEventById(mid,'opportunity'),'opportunity');let mst=ma.getState(),mn=mst.npcs.find(n=>n.id===mid);assert(mn.progress>m0.progress);assert(mn.wealth>m0.wealth);assert.equal(mn.majorLifeEvents,1);assert.equal(mst.world.npcMajorLifeEvents,1);
assert.equal(ma.simulateNpcMajorLifeEventById(mid,'injuryRetreat'),'injuryRetreat');mst=ma.getState();mn=mst.npcs.find(n=>n.id===mid);assert(mn.injury>=2);assert(mn.retiredUntilDay>0);assert.equal(mn.majorLifeEvents,2);

// V2.7 fate network and older foundations remain present.
assert.equal(api.realmBalance().length,26);assert.equal(typeof api.npcLifeInfo,'function');assert.equal(typeof api.sectLifeInfo,'function');assert.equal(api.sectLifeInfo().peers.length,6);

console.log('V28_REGRESSION_PASS',JSON.stringify({version:'2.8.0',schema:25,helpRequests:true,favorDebt:true,favorReturns:true,lethalNpcFeuds:true,dynamicFactionMembership:true,statefulMajorLifeEvents:true,v27FatePreserved:true,futureSaveProtected:true}));
