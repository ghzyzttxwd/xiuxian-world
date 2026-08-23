import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v26.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';

assert(source.includes("const VERSION='2.6.0'"),'V2.6 gameplay version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=23'),'schema 23 missing');
assert(!source.includes('天道酬勤'),'removed cultivation cheat text returned');
for(const marker of ['SECT_MENTOR_LIFE_DEFAULTS','SECT_PEER_DEFAULTS','simulateSectLife','sectPersonAge','finishMentorRetreat','sectInternalDuel','秘库配额评议','诸峰讲法会','sectPrestige','sectRivalWins','SECT_RANKS','finalizeLifespanDeath'])assert(source.includes(marker),`V2.6 marker missing: ${marker}`);

function cleanHtml(html){return html.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'')}
function makeDom(seed=null){const dom=new JSDOM(cleanHtml(htmlRaw),{url:'http://example.test/',runScripts:'outside-only',pretendToBeVisual:true});dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});dom.window.scrollTo=()=>{};dom.window.console=console;if(seed!==null)dom.window.localStorage.setItem(SAVE_KEY,seed);dom.window.eval(source);return dom}
function loadState(obj){const d=makeDom(JSON.stringify(obj));d.window.document.getElementById('continueBtn').click();return d}
function baseState(){const d=makeDom();const api=d.window.__TAIXUAN_TEST__;api.newGame('V26回归');return api.getState()}
function sectSeed(rank='内门弟子',realmIndex=23){const s=baseState();Object.assign(s.player,{realmIndex,progress:0,location:'青云山',sect:'青云宗',sectRank:rank,sectContribution:1000,sectTasksCompleted:30,sectSeniorTasksCompleted:10,sectMentor:null,sectMentorBond:0,sectLastMentorDay:0,sectAssessmentLevel:4,sectLastAssessmentDay:0,sectTask:null,sectLastStipend:0,sectPrestige:0,sectRivalId:null,sectRivalWins:0,sectRivalLosses:0,sectInternalEvents:0,spiritStones:1000,herbs:100,rareMaterials:30,insight:20,hp:4200,qi:5100,injury:0,daoPath:'none',daoMastery:0,factionStanding:{qingyun:100,xuanshui:0,blood:0}});s.flags={};s.world.sectEvent=null;s.world.nextSectEventDay=999999;return s}
function winCurrent(api){let guard=0;while(api.getCombat()&&guard++<40)api.combatAction('attack');assert.equal(api.getCombat(),null,'combat did not finish')}

const dom=makeDom(),api=dom.window.__TAIXUAN_TEST__;
assert(api,'test API missing');
for(const fn of ['newGame','getState','sectLifeInfo','forceSectInternalEvent','startSectInternalEvent','resolveSectInternalEvent','finishMentorRetreat','simulateSectLife','chooseSectMentor','seekMentorGuidance','sectCareerInfo','startCombat','combatAction','realmBalance'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);

api.newGame('宗门人物测试');let state=api.getState();
assert.equal(state.version,'2.6.0');assert.equal(state.saveSchemaVersion,23);assert.equal(state.player.sectPrestige,0);assert.equal(state.player.sectRivalId,null);assert.equal(Object.keys(state.world.sectMentors).length,4);assert.equal(state.world.sectPeers.length,6);assert.equal(state.world.nextSectEventDay,75);

// V2.5 schema22 -> V2.6 schema23 initializes only the new living-sect layer and preserves identity/resources.
const old=baseState();old.version='2.5.0';old.saveSchemaVersion=22;old.player.sect='青云宗';old.player.sectRank='内门弟子';old.player.sectContribution=188;for(const k of ['sectPrestige','sectRivalId','sectRivalWins','sectRivalLosses','sectInternalEvents'])delete old.player[k];for(const k of ['sectMentors','sectPeers','sectEvent','nextSectEventDay','sectEventCount'])delete old.world[k];const od=loadState(old),os=od.window.__TAIXUAN_TEST__.getState();assert.equal(os.version,'2.6.0');assert.equal(os.saveSchemaVersion,23);assert.equal(os.player.sectRank,'内门弟子');assert.equal(os.player.sectContribution,188);assert.equal(Object.keys(os.world.sectMentors).length,4);assert.equal(os.world.sectPeers.length,6);assert.equal(os.player.sectPrestige,0);

// Future schema24 must not load or overwrite.
const future={...old,saveSchemaVersion:24,version:'future-v26'};const futureRaw=JSON.stringify(future);const fd=makeDom(futureRaw);fd.window.document.getElementById('continueBtn').click();assert.equal(fd.window.localStorage.getItem(SAVE_KEY),futureRaw,'future schema was overwritten');assert.equal(fd.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded');

// Mentor retreat is a real unavailable state; successful retreat changes the mentor realm.
const ms=sectSeed();Object.assign(ms.player,{sectMentor:'flame',sectMentorBond:2,sectContribution:100,manualProf:0});ms.world.sectMentors.flame.retreatUntil=50;const md=loadState(ms),ma=md.window.__TAIXUAN_TEST__;ma.seekMentorGuidance();assert.equal(ma.getState().player.sectMentorBond,2,'guidance bypassed mentor retreat');const beforeRealm=ma.sectLifeInfo().mentors.flame.realmIndex;assert.equal(ma.finishMentorRetreat('flame',true),true);assert.equal(ma.sectLifeInfo().mentors.flame.realmIndex,beforeRealm+1,'mentor retreat success did not break through');assert.equal(ma.sectLifeInfo().mentors.flame.retreatUntil,0);

// A dead mentor cannot teach; transferring to a living mentor preserves only half the old bond.
const ds=sectSeed();Object.assign(ds.player,{sectMentor:'sword',sectMentorBond:7,sectContribution:100});ds.world.sectMentors.sword.alive=false;const dd=loadState(ds),da=dd.window.__TAIXUAN_TEST__;da.seekMentorGuidance();assert.equal(da.getState().player.sectMentorBond,7,'dead mentor somehow taught a lesson');da.chooseSectMentor('body');const dafter=da.getState();assert.equal(dafter.player.sectMentor,'body');assert.equal(dafter.player.sectMentorBond,3,'dead-mentor transfer did not halve bond');

// Lifespan can really remove a mentor from the living world.
const lifeSeed=sectSeed();lifeSeed.world.sectMentors.sword.bornDay=-999999;lifeSeed.world.sectMentors.sword.alive=true;const lifeApi=loadState(lifeSeed).window.__TAIXUAN_TEST__;lifeApi.simulateSectLife();assert.equal(lifeApi.sectLifeInfo().mentors.sword.alive,false,'over-age mentor did not die');

// Sect peers progress independently and their rank is recomputed from realm + merit.
const ps=sectSeed();ps.world.sectPeers[0].realmIndex=10;ps.world.sectPeers[0].merit=200;ps.world.sectPeers[0].rank='外门弟子';const pd=loadState(ps),pa=pd.window.__TAIXUAN_TEST__;pa.simulateSectLife();const peer=pa.sectLifeInfo().peers.find(x=>x.id==='qin-wuya');assert.equal(peer.rank,'真传弟子','sect peer rank did not evolve from merit and realm');

// Inner disciples automatically acquire a persistent rival from the living peer pool.
const rs=sectSeed('内门弟子',10);const rd=loadState(rs),ra=rd.window.__TAIXUAN_TEST__;const rinfo=ra.sectLifeInfo();assert(rinfo.rival&&rinfo.rival.id,'inner disciple did not acquire a rival');assert.equal(ra.getState().player.sectRivalId,rinfo.rival.id);

// Rival duel is real combat, but nonlethal: no kill, no high-tier loot; victory changes prestige and rivalry.
const ws=sectSeed('真传弟子',23);const wd=loadState(ws),wa=wd.window.__TAIXUAN_TEST__;wa.sectLifeInfo();const w0=wa.getState(),kills0=w0.player.kills,rare0=w0.player.rareMaterials;wa.forceSectInternalEvent('duel');wa.startSectInternalEvent();assert(wa.getCombat()?.enemy?.sectInternalDuel,'internal duel did not enter real combat');winCurrent(wa);const w1=wa.getState();assert.equal(w1.player.kills,kills0,'nonlethal rival duel counted as kill');assert.equal(w1.player.rareMaterials,rare0,'rival duel generated high-tier loot');assert.equal(w1.player.sectRivalWins,1);assert.equal(w1.player.sectPrestige,5);assert.equal(w1.world.sectEvent,null,'rival event did not resolve');assert.equal(w1.player.sectInternalEvents,1);

// Losing the same duel cannot kill the life or take spirit stones.
const ls=sectSeed('内门弟子',3);Object.assign(ls.player,{hp:1,qi:0,spiritStones:77});const ld=loadState(ls),la=ld.window.__TAIXUAN_TEST__;la.sectLifeInfo();la.forceSectInternalEvent('duel');la.startSectInternalEvent();la.combatAction('attack');const l1=la.getState();assert.notEqual(l1.flags.dead,true,'rival duel defeat killed the player');assert.equal(l1.player.spiritStones,77,'rival duel defeat took spirit stones');assert.equal(l1.player.sectRivalLosses,1);assert.equal(l1.world.sectEvent,null);

// Resource allocation and lecture are independent internal-event loops, not decorative text.
const as=sectSeed('宗门执事',19);Object.assign(as.player,{sectPrestige:100,sectContribution:1000,rareMaterials:4,insight:0});const ad=loadState(as),aa=ad.window.__TAIXUAN_TEST__;aa.sectLifeInfo();aa.forceSectInternalEvent('allocation');const ar0=aa.getState().player.rareMaterials;aa.resolveSectInternalEvent('attend');const ar1=aa.getState();assert(ar1.player.rareMaterials>ar0,'high-prestige allocation did not grant real resources');assert.equal(ar1.world.sectEvent,null);assert.equal(ar1.player.sectInternalEvents,1);
const hs=sectSeed('内门弟子',10);Object.assign(hs.player,{sectMentor:'sword',sectMentorBond:2,manualProf:10});const hd=loadState(hs),ha=hd.window.__TAIXUAN_TEST__;ha.forceSectInternalEvent('lecture');const hb=ha.getState().player.sectMentorBond,hm=ha.getState().player.manualProf;ha.resolveSectInternalEvent('attend');const h1=ha.getState();assert.equal(h1.player.sectMentorBond,hb+1,'mentor lecture did not deepen bond');assert.equal(h1.player.manualProf,hm+25,'lecture did not improve manual');assert.equal(h1.player.sectInternalEvents,1);

// V2.5 career and V2.4 survival foundations remain present.
assert.equal(api.realmBalance().length,26);assert.equal(typeof api.sectCareerInfo,'function');assert.equal(typeof api.takeSectAssessment,'function');assert.equal(typeof api.promoteSect,'function');

console.log('V26_REGRESSION_PASS',JSON.stringify({version:'2.6.0',schema:23,mentors:4,peers:6,mentorLife:true,mentorTransfer:true,peerProgression:true,rival:true,realNonlethalDuel:true,internalEvents:true,v25CareerPreserved:true,futureSaveProtected:true}));
