import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v29.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';

assert(source.includes("const VERSION='2.9.0'"),'V2.9 gameplay version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=26'),'schema 26 missing');
assert(!source.includes('天道酬勤'),'removed cultivation cheat text returned');
for(const marker of ['ensurePastLifeShape','capturePastLifeBonds','pastLifeBonds','pastLifeEncounters','recognizePastLifeNpc','resetPlayerNpcTiesForRebirth','renderPastLifePanel','ensureNpcConsequenceShape','favorDebt','simulateNpcFeud','simulateNpcFactionShift','simulateNpcMajorLifeEvent','simulateSectLife','finalizeLifespanDeath'])assert(source.includes(marker),`V2.9 marker missing: ${marker}`);

function cleanHtml(html){return html.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'')}
function makeDom(seed=null){const dom=new JSDOM(cleanHtml(htmlRaw),{url:'http://example.test/',runScripts:'outside-only',pretendToBeVisual:true});dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});dom.window.scrollTo=()=>{};dom.window.console=console;if(seed!==null)dom.window.localStorage.setItem(SAVE_KEY,seed);dom.window.eval(source);return dom}
function loadState(obj){const d=makeDom(JSON.stringify(obj));d.window.document.getElementById('continueBtn').click();return d}
function baseState(){const d=makeDom();const api=d.window.__TAIXUAN_TEST__;api.newGame('V29回归');return api.getState()}
function safeSeed(){const s=baseState();Object.assign(s.player,{realmIndex:14,progress:0,location:'青石村',hp:450,qi:340,injury:0,spiritStones:500,herbs:50,healingPills:5});s.flags={};for(const n of s.npcs){n.realmIndex=Math.max(n.realmIndex,10);n.bornDay=-18*360;n.retiredUntilDay=999999}return s}

const dom=makeDom(),api=dom.window.__TAIXUAN_TEST__;
assert(api,'test API missing');
for(const fn of ['newGame','getState','pastLifeInfo','recognizePastLifeById','capturePastLifeBondsForTest','reincarnateForTest','npcConsequenceInfo','forceNpcHelpRequestById','triggerNpcFavorReturnById','simulateNpcFeudByIds','simulateNpcFactionShiftById','simulateNpcMajorLifeEventById','npcLifeInfo','sectLifeInfo','realmBalance'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);

api.newGame('前尘旧缘测试');let state=api.getState(),info=api.pastLifeInfo();
assert.equal(state.version,'2.9.0');assert.equal(state.saveSchemaVersion,26);assert.equal(state.player.pastLifeRecognitions,0);assert(Array.isArray(state.legacy.pastLifeBonds));assert.equal(typeof state.legacy.pastLifeEncounters,'object');assert.equal(state.legacy.pastLifeSnapshots,0);assert.equal(info.life,1);assert.equal(info.bonds.length,0);

// V2.8 schema25 -> V2.9 schema26 keeps consequence data and adds cross-life structures.
const old=baseState();old.version='2.8.0';old.saveSchemaVersion=25;old.npcs[0].favorDebt=2;old.world.npcConsequenceEvents=7;delete old.player.pastLifeRecognitions;delete old.legacy.pastLifeBonds;delete old.legacy.pastLifeEncounters;delete old.legacy.pastLifeSnapshots;const od=loadState(old),oa=od.window.__TAIXUAN_TEST__,os=oa.getState();assert.equal(os.version,'2.9.0');assert.equal(os.saveSchemaVersion,26);assert.equal(os.npcs[0].favorDebt,2);assert.equal(os.world.npcConsequenceEvents,7);assert.equal(os.player.pastLifeRecognitions,0);assert(Array.isArray(os.legacy.pastLifeBonds));assert.equal(typeof os.legacy.pastLifeEncounters,'object');

// Future schema27 must not load or overwrite.
const future={...old,saveSchemaVersion:27,version:'future-v29'};const futureRaw=JSON.stringify(future);const fd=makeDom(futureRaw);fd.window.document.getElementById('continueBtn').click();assert.equal(fd.window.localStorage.getItem(SAVE_KEY),futureRaw,'future schema was overwritten');assert.equal(fd.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded');

// Life end snapshots only genuinely deep ties. Rebirth clears old personal debts/requests and does not inherit relation.
const rs=safeSeed();const target=rs.npcs[0],shallow=rs.npcs[1];Object.assign(target,{known:true,alive:true,relation:92,grudge:0,favorDebt:3,location:'青石村',realmIndex:23,retiredUntilDay:999999});Object.assign(shallow,{known:true,alive:true,relation:59,grudge:0,favorDebt:1,location:'青石村',retiredUntilDay:999999});rs.world.npcPendingRequest={id:'old-life-request',npcId:target.id,type:'stones',label:'上一世借灵石',cost:3,costText:'灵石 3 块',createdDay:1,expiresDay:999};rs.flags={dead:true,deathCause:'测试寿尽',deathAge:90,deathRealm:'金丹初期',deathDay:1};const rd=loadState(rs),ra=rd.window.__TAIXUAN_TEST__;let before=ra.getState();assert(before.legacy.pastLifeBonds.some(x=>x.npcId===target.id&&x.relation===92),'deep bond was not captured at death');assert(!before.legacy.pastLifeBonds.some(x=>x.npcId===shallow.id),'shallow relation incorrectly became past-life bond');const oldDay=(before.time.year-1)*360+(before.time.month-1)*30+before.time.day;ra.reincarnateForTest('plain');let reborn=ra.getState(),rn=reborn.npcs.find(n=>n.id===target.id),sn=reborn.npcs.find(n=>n.id===shallow.id);const newDay=(reborn.time.year-1)*360+(reborn.time.month-1)*30+reborn.time.day;assert.equal(reborn.legacy.cycles,1);assert.equal(newDay-oldDay,30,'rebirth did not preserve world time and advance 30 days');assert.equal(rn.relation,0,'deep old relation was directly inherited');assert.equal(rn.grudge,0);assert.equal(rn.favorDebt,0,'old-life favor debt leaked into new incarnation');assert.equal(sn.favorDebt,0,'shallow old-life favor debt leaked into new incarnation');assert.equal(reborn.world.npcPendingRequest,null,'old-life pending request leaked into new incarnation');assert.equal(reborn.player.pastLifeRecognitions,0);

// First reunion is explicit and small: +6 at most here, with one high-bond insight. It cannot be farmed twice.
const insight0=reborn.player.insight;const meet=ra.recognizePastLifeById(target.id);assert(meet&&meet.relationGain===6);reborn=ra.getState();rn=reborn.npcs.find(n=>n.id===target.id);assert.equal(rn.relation,6,'past-life reunion gave more than small starting relation');assert.equal(reborn.player.insight,insight0+1,'very deep old bond did not grant its one-time small insight');assert.equal(reborn.player.pastLifeRecognitions,1);const relationAfter=rn.relation,insightAfter=reborn.player.insight;const meetAgain=ra.recognizePastLifeById(target.id);assert(meetAgain&&meetAgain.already===true,'repeat past-life encounter was not recognized as already used');reborn=ra.getState();rn=reborn.npcs.find(n=>n.id===target.id);assert.equal(rn.relation,relationAfter,'past-life recognition could be farmed repeatedly');assert.equal(reborn.player.insight,insightAfter,'past-life insight could be farmed repeatedly');assert.equal(reborn.player.pastLifeRecognitions,1);

// The old bond remains archival; current relation and recognition are tracked separately.
info=ra.pastLifeInfo();const bond=info.bonds.find(x=>x.npcId===target.id);assert(bond);assert.equal(bond.relation,92);assert.equal(bond.currentRelation,6);assert.equal(bond.recognized,true);assert.equal(info.life,2);

// V2.8 consequence and older foundations remain present.
assert.equal(api.realmBalance().length,26);assert.equal(typeof api.npcConsequenceInfo,'function');assert.equal(typeof api.npcLifeInfo,'function');assert.equal(typeof api.sectLifeInfo,'function');assert.equal(api.sectLifeInfo().peers.length,6);

console.log('V29_REGRESSION_PASS',JSON.stringify({version:'2.9.0',schema:26,deepBondSnapshot:true,noDirectRelationInheritance:true,oldFavorDebtCleared:true,oldPendingRequestCleared:true,oneTimeRecognition:true,smallOldFriendBenefit:true,v28ConsequencesPreserved:true,futureSaveProtected:true}));
