import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v23.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';
const REGIONS=['青石村','青石镇','临江城','黑风岭','青云山','云梦泽','苍梧郡城','赤霞谷','落星矿脉','万兽山脉','古河遗迹','玄阴禁地'];

assert(source.includes("const VERSION='2.3.0'"),'V2.3 gameplay version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=20'),'schema 20 missing');
for(const marker of ['FACTION_META','factionStandingValue','acceptFactionContract','onFactionContractCombatWin','renderFactionStanding','factionRouteStanding','玄水帮','血刀门'])assert(source.includes(marker),`V2.3 marker missing: ${marker}`);
for(const old of ['青云剑道','赤霞火道','万兽炼体','太虚神道','DAO_WORLD_EVENTS','daoRenown','金元丹','养魂丹','太虚神剑','craftDeificationEssence','TRAVEL_ROUTES','renderSecretRealm'])assert(source.includes(old),`V2.2 system lost: ${old}`);
for(const region of REGIONS)assert(source.includes(`'${region}'`),`region lost: ${region}`);

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
function baseState(){const d=makeDom();const api=d.window.__TAIXUAN_TEST__;api.newGame('V23回归');return api.getState()}
function richSeed(location='临江城'){const s=baseState();Object.assign(s.player,{realmIndex:23,progress:0,location,sect:'散修',sectRank:'无',spiritStones:500,herbs:40,rareMaterials:20,beastMaterials:30,hp:2800,qi:3100,factionStanding:{qingyun:0,xuanshui:0,blood:0},factionContracts:{qingyun:0,xuanshui:0,blood:0},factionContract:null,factionLastContractDay:{qingyun:0,xuanshui:0,blood:0}});s.flags={};return s}
function winFight(api,name){api.startCombat(name);let guard=0;while(api.getCombat()&&guard++<12)api.combatAction('attack');assert.equal(api.getCombat(),null,`fight did not finish: ${name}`)}

const dom=makeDom(),api=dom.window.__TAIXUAN_TEST__;
assert(api,'test API missing');
for(const fn of ['newGame','getState','factionStandingSnapshot','addFactionStanding','acceptFactionContract','factionContractInfo','factionRouteRisk','marketPrices','socialMeetCheckById','joinFactionWar','startCombat','combatAction'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);
api.newGame('V23新档');let state=api.getState();
assert.equal(state.version,'2.3.0');assert.equal(state.saveSchemaVersion,20);
assert.deepEqual(state.player.factionStanding,{qingyun:0,xuanshui:0,blood:0});
assert.deepEqual(state.player.factionContracts,{qingyun:0,xuanshui:0,blood:0});
assert.equal(state.player.factionContract,null);
assert(dom.window.document.getElementById('factionStandingPanel'),'faction standing panel missing');
for(const name of ['青云宗','玄水帮','血刀门'])assert(dom.window.document.getElementById('factionStandingPanel').textContent.includes(name),`faction UI missing ${name}`);
assert.equal(dom.window.document.querySelectorAll('#mapList .map-node').length,12,'12-region map regressed');

// V2.2 schema19 -> V2.3 schema20 migration.
const old=baseState();old.version='2.2.0';old.saveSchemaVersion=19;old.player.sect='青云宗';old.player.sectRank='外门弟子';delete old.player.factionStanding;delete old.player.factionContracts;delete old.player.factionContract;delete old.player.factionLastContractDay;
const oldDom=loadState(old),oldState=oldDom.window.__TAIXUAN_TEST__.getState();
assert.equal(oldState.version,'2.3.0');assert.equal(oldState.saveSchemaVersion,20);assert.equal(oldState.player.factionStanding.qingyun,20);assert.equal(oldState.player.factionStanding.xuanshui,0);assert.equal(oldState.player.factionContracts.blood,0);assert.equal(oldState.player.factionContract,null);

// Future schema21 must not load or overwrite.
const future={...old,saveSchemaVersion:21,version:'future-v23'};const futureRaw=JSON.stringify(future);const futureDom=makeDom(futureRaw);futureDom.window.document.getElementById('continueBtn').click();
assert.equal(futureDom.window.localStorage.getItem(SAVE_KEY),futureRaw,'future schema was overwritten');assert.equal(futureDom.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded');

// First contracts must be immediately available and complete through real combat.
const q0=richSeed('青云山'),qd=loadState(q0),qa=qd.window.__TAIXUAN_TEST__;qa.acceptFactionContract('qingyun');let qs=qa.getState();assert.equal(qs.player.factionContract?.faction,'qingyun','Qingyun contract not accepted on first availability');qs.player.location='黑风岭';let qd2=loadState(qs),qa2=qd2.window.__TAIXUAN_TEST__;const qBefore=qa2.getState().player.spiritStones;winFight(qa2,'黑风岭狼妖');assert.equal(qa2.factionContractInfo().progress,1,'Qingyun contract first kill missing');winFight(qa2,'黑风岭狼妖');const qAfter=qa2.getState();assert.equal(qAfter.player.factionContract,null);assert.equal(qAfter.player.factionContracts.qingyun,1);assert(qAfter.player.factionStanding.qingyun>=10,'Qingyun standing reward missing');assert(qAfter.player.factionStanding.blood<=-3,'Qingyun/Blood rivalry consequence missing');assert(qAfter.player.spiritStones>=qBefore+12,'Qingyun contract reward missing');

const x0=richSeed('云梦泽'),xd=loadState(x0),xa=xd.window.__TAIXUAN_TEST__;xa.acceptFactionContract('xuanshui');assert.equal(xa.factionContractInfo()?.faction,'xuanshui');winFight(xa,'云梦鳄妖');winFight(xa,'云梦鳄妖');const xAfter=xa.getState();assert.equal(xAfter.player.factionContracts.xuanshui,1);assert(xAfter.player.factionStanding.xuanshui>=10,'Xuanshui standing reward missing');assert(xAfter.player.herbs>=44,'Xuanshui contract herb reward missing');

const b0=richSeed('赤霞谷'),bd=loadState(b0),ba=bd.window.__TAIXUAN_TEST__;ba.acceptFactionContract('blood');assert.equal(ba.factionContractInfo()?.faction,'blood');winFight(ba,'赤砂火蜥');winFight(ba,'赤砂火蜥');const bAfter=ba.getState();assert.equal(bAfter.player.factionContracts.blood,1);assert(bAfter.player.factionStanding.blood>=10,'Blood standing reward missing');assert(bAfter.player.factionStanding.qingyun<=-3,'Blood/Qingyun rivalry consequence missing');assert(bAfter.player.rareMaterials>=21,'Blood rare material reward missing');

// Long-term standing must affect routes.
const routeSeed=richSeed('临江城'),routeDom=loadState(routeSeed),routeApi=routeDom.window.__TAIXUAN_TEST__;
const friendlyRisk=routeApi.factionRouteRisk('xuanshui-boat',{xuanshui:60}),neutralRisk=routeApi.factionRouteRisk('xuanshui-boat',{xuanshui:0}),hostileRisk=routeApi.factionRouteRisk('xuanshui-boat',{xuanshui:-60});
assert(friendlyRisk<neutralRisk,'friendly Xuanshui standing did not lower route risk');assert(hostileRisk>neutralRisk,'hostile Xuanshui standing did not raise route risk');

// Xuanshui standing must affect real market prices.
const mf=richSeed('临江城');mf.player.factionStanding.xuanshui=60;const friendlyMarket=loadState(mf).window.__TAIXUAN_TEST__.marketPrices();
const mn=richSeed('临江城');const neutralMarket=loadState(mn).window.__TAIXUAN_TEST__.marketPrices();
const mh=richSeed('临江城');mh.player.factionStanding.xuanshui=-60;const hostileMarket=loadState(mh).window.__TAIXUAN_TEST__.marketPrices();
assert(friendlyMarket.herbBuy<=neutralMarket.herbBuy,'Xuanshui friendly herb discount missing');assert(friendlyMarket.pillBuy<hostileMarket.pillBuy,'Xuanshui standing did not change pill pricing');assert(hostileMarket.modifier>1,'hostile market surcharge missing');

// Dead-enemy faction NPCs must refuse normal social interaction.
const ns=richSeed('临江城');ns.player.factionStanding.xuanshui=-70;ns.npcs[0].faction='玄水帮';ns.npcs[0].known=true;ns.npcs[0].alive=true;ns.npcs[0].location='临江城';const nd=loadState(ns),na=nd.window.__TAIXUAN_TEST__;const refusal=na.socialMeetCheckById(ns.npcs[0].id);assert(refusal.includes('死敌')&&refusal.includes('拒绝'),'hostile faction NPC did not refuse interaction');

// Faction war participation must write into persistent standing.
const ws=richSeed('临江城');ws.major.factionWar={id:'factionWar',title:'test',location:'临江城',status:'active',start:1,end:9999,participated:false,side:null,contribution:0,qingyunAid:0,bloodAid:0};const wd=loadState(ws),wa=wd.window.__TAIXUAN_TEST__;wa.joinFactionWar('qingyun');assert(wa.getCombat(),'war combat did not start');let wg=0;while(wa.getCombat()&&wg++<12)wa.combatAction('attack');const wAfter=wa.getState();assert(wAfter.player.factionStanding.qingyun>=4,'war did not raise supported faction standing');assert(wAfter.player.factionStanding.blood<=-4,'war did not lower enemy faction standing');

console.log('V23_REGRESSION_PASS',JSON.stringify({version:'2.3.0',schema:20,realms:26,regions:12,routes:20,factions:3,contracts:3,routeStanding:true,marketStanding:true,hostileNpc:true,warStanding:true,v22SaveUpgrade:true,futureSaveProtected:true}));