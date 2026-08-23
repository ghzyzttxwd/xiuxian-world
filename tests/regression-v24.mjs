import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v24.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';

assert(source.includes("const VERSION='2.4.0'"),'V2.4 gameplay version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=21'),'schema 21 missing');
assert(!source.includes('天道酬勤'),'old cultivation cheat text still present');
for(const marker of ['majorRealmStage','cultivationGainForDays','finalizeLifespanDeath','remainingLifespanYears','minorBreakthroughBase','FACTION_META','DAO_WORLD_EVENTS','金元丹','太虚神剑'])assert(source.includes(marker),`V2.4 marker missing: ${marker}`);

function cleanHtml(html){return html.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'')}
function makeDom(seed=null){
 const dom=new JSDOM(cleanHtml(htmlRaw),{url:'http://example.test/',runScripts:'outside-only',pretendToBeVisual:true});
 dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
 dom.window.scrollTo=()=>{};
 dom.window.console=console;
 if(seed!==null)dom.window.localStorage.setItem(SAVE_KEY,seed);
 dom.window.eval(source);
 return dom;
}
function loadState(obj){const d=makeDom(JSON.stringify(obj));d.window.document.getElementById('continueBtn').click();return d}
function baseState(){const d=makeDom();const api=d.window.__TAIXUAN_TEST__;api.newGame('V24回归');return api.getState()}
function richSeed(location='临江城'){const s=baseState();Object.assign(s.player,{realmIndex:23,progress:0,location,sect:'散修',sectRank:'无',spiritStones:500,herbs:80,rareMaterials:30,beastMaterials:40,hp:2800,qi:3100,injury:0,manual:'太虚观神录',manualProf:0,factionStanding:{qingyun:0,xuanshui:0,blood:0},factionContracts:{qingyun:0,xuanshui:0,blood:0},factionContract:null,factionLastContractDay:{qingyun:0,xuanshui:0,blood:0}});s.flags={};return s}
function winFight(api,name){api.startCombat(name);let guard=0;while(api.getCombat()&&guard++<12)api.combatAction('attack');assert.equal(api.getCombat(),null,`fight did not finish: ${name}`)}

const dom=makeDom(),api=dom.window.__TAIXUAN_TEST__;
assert(api,'test API missing');
for(const fn of ['newGame','getState','action','realmBalance','majorRealmStage','realmSuppression','remainingLifespanYears','cultivationGainForDays','retreatSevenDays','breakthroughChance','advanceDays','acceptFactionContract','factionContractInfo','startCombat','combatAction'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);

api.newGame('凡修测试');let state=api.getState();
assert.equal(state.version,'2.4.0');assert.equal(state.saveSchemaVersion,21);
const curve=api.realmBalance();assert.equal(curve.length,26);assert.equal(curve[0].need,120);assert.equal(curve[9].need,2000);assert.equal(curve[10].need,3500);assert.equal(curve[19].need,95000);assert.equal(curve[23].need,500000);assert.equal(curve[25].need,1300000);
for(let i=1;i<curve.length;i++)assert(curve[i].need>curve[i-1].need,`realm need not increasing at ${i}`);

// No free cheat multiplier / no diligence -> insight conversion.
const beforeCult=api.getState();for(let i=0;i<7;i++)api.action('cultivate');const afterCult=api.getState();
assert(afterCult.player.progress>beforeCult.player.progress,'cultivation made no progress');
assert(afterCult.player.progress<=curve[0].need,'mortal cultivation exceeded realm need');
assert.equal(afterCult.player.insight,0,'practice history still generated free insight');
assert.equal(afterCult.player.diligence,7,'practice history did not record real cultivation days');

// V2.3 schema20 -> V2.4 schema21 preserves percentage under the new curve.
const old=baseState();old.version='2.3.0';old.saveSchemaVersion=20;old.player.realmIndex=19;old.player.progress=6000; // 50% of old 12000
const oldDom=loadState(old),oldState=oldDom.window.__TAIXUAN_TEST__.getState();
assert.equal(oldState.version,'2.4.0');assert.equal(oldState.saveSchemaVersion,21);assert.equal(oldState.player.progress,47500,'schema21 did not preserve 50% progress');

// Future schema22 must not load or overwrite.
const future={...old,saveSchemaVersion:22,version:'future-v24'};const futureRaw=JSON.stringify(future);const futureDom=makeDom(futureRaw);futureDom.window.document.getElementById('continueBtn').click();
assert.equal(futureDom.window.localStorage.getItem(SAVE_KEY),futureRaw,'future schema was overwritten');assert.equal(futureDom.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded');

// Major-realm suppression must be much stronger than small-realm differences.
assert.equal(api.majorRealmStage(9),1);assert.equal(api.majorRealmStage(10),2);assert.equal(api.majorRealmStage(19),4);assert.equal(api.majorRealmStage(23),5);
assert.equal(api.realmSuppression(10,9),2.2,'one major realm advantage incorrect');assert.equal(api.realmSuppression(9,10),0.38,'one major realm disadvantage incorrect');
assert.equal(api.realmSuppression(19,1),7,'three-major advantage incorrect');assert.equal(api.realmSuppression(1,19),0.07,'three-major disadvantage incorrect');
assert(api.realmSuppression(9,8)<1.2&&api.realmSuppression(9,8)>1,'small realm advantage became too extreme');

// Later ordinary breakthroughs are harder with identical root/manual/injury/pity.
const early=baseState();Object.assign(early.player,{realmIndex:8,rootIndex:1,manual:'基础吐纳诀',manualProf:0,injury:0,breakthroughPity:0});const earlyChance=loadState(early).window.__TAIXUAN_TEST__.breakthroughChance();
const late=baseState();Object.assign(late.player,{realmIndex:17,rootIndex:1,manual:'基础吐纳诀',manualProf:0,injury:0,breakthroughPity:0});const lateChance=loadState(late).window.__TAIXUAN_TEST__.breakthroughChance();
assert(lateChance<earlyChance,'later breakthrough was not harder');

// Seven-day retreat uses real daily-scale gains, not a percentage of realm need.
const rs=baseState();Object.assign(rs.player,{realmIndex:19,progress:0,rootIndex:1,manual:'太虚观神录',manualProf:0,location:'青石镇',dwellingTier:3,dwellingLocation:'青石镇',injury:0,hp:1250,qi:1150});const rd=loadState(rs),ra=rd.window.__TAIXUAN_TEST__;ra.retreatSevenDays();const rAfter=ra.getState();
assert(rAfter.player.progress>0,'retreat gave no cultivation');assert(rAfter.player.progress<5000,'retreat still jumps a large percentage of high-realm progress');assert.equal(rAfter.time.day,8,'retreat did not advance seven real days');

// Lifespan death is terminal for this life and immediately persists.
const ds=baseState();ds.player.lifespan=82;ds.player.startAge=16;ds.player.birthDay=-23758;ds.player.progress=10;const dd=loadState(ds),da=dd.window.__TAIXUAN_TEST__;assert.equal(da.remainingLifespanYears(),1);da.advanceDays(1);let dead=da.getState();
assert.equal(dead.flags.dead,true,'lifespan expiration did not kill the life');assert.equal(dead.flags.deathCause,'寿元耗尽');assert.equal(dead.flags.deathAge,82);assert.equal(dead.flags.deathRealm,'凡人');
const lockedProgress=dead.player.progress;da.action('cultivate');dead=da.getState();assert.equal(dead.player.progress,lockedProgress,'dead life could still cultivate');
const persisted=JSON.parse(dd.window.localStorage.getItem(SAVE_KEY));assert.equal(persisted.flags.dead,true,'terminal lifespan death was not persisted');

// V2.3 faction contract still resolves through real combat under the new combat hierarchy.
const q0=richSeed('青云山'),qd=loadState(q0),qa=qd.window.__TAIXUAN_TEST__;qa.acceptFactionContract('qingyun');let qs=qa.getState();assert.equal(qs.player.factionContract?.faction,'qingyun');qs.player.location='黑风岭';const qd2=loadState(qs),qa2=qd2.window.__TAIXUAN_TEST__;winFight(qa2,'黑风岭狼妖');winFight(qa2,'黑风岭狼妖');const qAfter=qa2.getState();assert.equal(qAfter.player.factionContract,null);assert.equal(qAfter.player.factionContracts.qingyun,1);assert(qAfter.player.factionStanding.qingyun>=10,'V2.3 faction system regressed');

console.log('V24_REGRESSION_PASS',JSON.stringify({version:'2.4.0',schema:21,realms:26,noCheat:true,progressMigration:true,majorSuppression:true,laterBreakthroughHarder:true,retreatBalanced:true,lifespanTerminal:true,v23FactionPreserved:true,futureSaveProtected:true}));