import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v16.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';
const REGIONS=['青石村','青石镇','临江城','黑风岭','青云山','云梦泽','苍梧郡城','赤霞谷','落星矿脉','万兽山脉','古河遗迹','玄阴禁地'];

assert(source.includes("const VERSION='1.6.0'"),'V1.6 gameplay version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=13'),'save schema unexpectedly changed');
for(const marker of ['TRAVEL_ROUTES','routesFrom','effectiveRouteRisk','resolveTravelEncounter','routeEnemy','guarded-caravan','marsh-trail','data-route'])assert(source.includes(marker),`travel marker missing: ${marker}`);
for(const system of ['startRegionalEvent','weightedSecretRealmTemplate','renderSect','marketPrices','brewAlchemy','GEAR_ITEMS','processSocialEvents','attemptBreakthrough','renderDwelling','reincarnate','renderSecretRealm','updateFactionConflict'])assert(source.includes(system),`existing system marker lost: ${system}`);
for(const region of REGIONS)assert(source.includes(`'${region}'`),`V1.5 region lost: ${region}`);

function cleanHtml(html){return html.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'')}
function makeDom(seed=null){
 const dom=new JSDOM(cleanHtml(htmlRaw),{url:'http://example.test/',runScripts:'outside-only',pretendToBeVisual:true});
 dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
 dom.window.console=console;
 if(seed!==null)dom.window.localStorage.setItem(SAVE_KEY,seed);
 dom.window.eval(source);
 return dom;
}

const dom=makeDom();
const api=dom.window.__TAIXUAN_TEST__;
assert(api,'test API missing');
for(const fn of ['newGame','getState','travel','routeInfo','routeRisk','advanceDays','startCombat'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);
api.newGame('V16行旅回归');
let state=api.getState();
assert.equal(state.version,'1.6.0');
assert.equal(state.saveSchemaVersion,13);
assert.equal(dom.window.document.querySelectorAll('#mapList .map-node').length,12,'12-region map regressed');
assert(dom.window.document.getElementById('mapList').textContent.includes('青石村道'),'route name missing from map UI');
assert(dom.window.document.getElementById('mapList').textContent.includes('风险'),'route risk missing from map UI');

const ljToMarsh=api.routeInfo('临江城','云梦泽');
assert.equal(ljToMarsh.length,2,'临江城→云梦泽 should have two route choices');
assert.deepEqual(new Set(ljToMarsh.map(r=>r.id)),new Set(['xuanshui-boat','marsh-trail']));
assert(ljToMarsh.some(r=>r.fee===1&&r.days===2),'paid fast water route missing');
assert(ljToMarsh.some(r=>r.fee===0&&r.days===3),'free risky marsh route missing');
const ljToCangwu=api.routeInfo('临江城','苍梧郡城');
assert.equal(ljToCangwu.length,2,'临江城→苍梧郡城 should have two route choices');

const qingyunMember=api.routeRisk('qingyun-road','青云宗',0,24);
const qingyunOutsider=api.routeRisk('qingyun-road','散修',0,24);
assert(qingyunMember<qingyunOutsider,'青云宗身份 did not reduce 青云山道 risk');
const bloodForMember=api.routeRisk('red-cliff-path','青云宗',0,24);
const bloodForOutsider=api.routeRisk('red-cliff-path','散修',0,24);
assert(bloodForMember>bloodForOutsider,'青云宗身份 did not increase blood territory risk');
assert(api.routeRisk('red-cliff-path','青云宗',2,80)>bloodForMember,'injury/tension did not increase route risk');
assert(api.routeRisk('beast-track','散修',0,24)>api.routeRisk('village-road','散修',0,24),'dangerous frontier route is not riskier than village road');

// Real travel still consumes world time and changes location. A random encounter
// may open combat, but it must not cancel the already completed journey.
const beforeDay=JSON.stringify(state.time);
api.travel('青石镇','village-road');
state=api.getState();
assert.equal(state.player.location,'青石镇','successful route did not arrive');
assert.notEqual(JSON.stringify(state.time),beforeDay,'travel did not consume world time');
assert(state.personalLog.some(x=>String(x.text).includes('青石村道')),'route travel was not recorded in personal history');

// Paid route must reject before time/risk resolution if the player cannot pay.
const raw=dom.window.localStorage.getItem(SAVE_KEY);
assert(raw,'save missing after travel');
const poor=JSON.parse(raw);
poor.player.location='临江城';
poor.player.spiritStones=0;
poor.version='1.5.0';
poor.saveSchemaVersion=13;
const poorDom=makeDom(JSON.stringify(poor));
poorDom.window.document.getElementById('continueBtn').click();
const poorApi=poorDom.window.__TAIXUAN_TEST__;
const poorTime=JSON.stringify(poorApi.getState().time);
poorApi.travel('云梦泽','xuanshui-boat');
const poorAfter=poorApi.getState();
assert.equal(poorAfter.player.location,'临江城','unaffordable paid route incorrectly moved player');
assert.equal(poorAfter.player.spiritStones,0,'unaffordable paid route charged stones');
assert.equal(JSON.stringify(poorAfter.time),poorTime,'unaffordable paid route consumed time');

// A V1.5 current-schema save must load directly into V1.6.
const prior={...poor,player:{...poor.player,spiritStones:3},version:'1.5.0',saveSchemaVersion:13};
const priorDom=makeDom(JSON.stringify(prior));
priorDom.window.document.getElementById('continueBtn').click();
const priorState=priorDom.window.__TAIXUAN_TEST__.getState();
assert.equal(priorState.version,'1.6.0','V1.5 save did not upgrade to V1.6');
assert.equal(priorState.saveSchemaVersion,13,'V1.6 changed schema for current save');
assert(REGIONS.includes(priorState.player.location),'player region invalid after V1.6 load');

// Future schema protection remains intact.
const future={...prior,saveSchemaVersion:14,version:'future-test'};
const futureRaw=JSON.stringify(future);
const futureDom=makeDom(futureRaw);
futureDom.window.document.getElementById('continueBtn').click();
assert.equal(futureDom.window.localStorage.getItem(SAVE_KEY),futureRaw,'future save was overwritten by V1.6');
assert.equal(futureDom.window.__TAIXUAN_TEST__.getState(),null,'future save unexpectedly loaded in V1.6');

console.log('V16_REGRESSION_PASS',JSON.stringify({
 version:'1.6.0',regions:12,routeChoices:true,alternateRoutes:true,routeFees:true,
 factionRisk:true,injuryTensionRisk:true,travelTime:true,currentSchemaUpgrade:true,futureSaveProtected:true
}));
