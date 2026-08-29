import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v15.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';
const LOCATIONS=['青石村','青石镇','临江城','黑风岭','青云山','云梦泽','苍梧郡城','赤霞谷','落星矿脉','万兽山脉','古河遗迹','玄阴禁地'];
const NEW_REGIONS=['云梦泽','苍梧郡城','赤霞谷','落星矿脉','万兽山脉','古河遗迹','玄阴禁地'];

assert(source.includes("const VERSION='1.5.0'"),'V1.5 gameplay version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=13'),'save schema unexpectedly changed');
for(const name of LOCATIONS)assert(source.includes(`'${name}'`),`location missing: ${name}`);
for(const marker of ['npcMoveTarget','startRegionalEvent','weightedSecretRealmTemplate','locationDangerText','secretActivityText'])assert(source.includes(marker),`world ecology marker missing: ${marker}`);
for(const enemy of ['水匪斥候','云梦鳄妖','赤砂火蜥','矿洞魈','苍梧邪修','铁羽妖鹰','古河尸傀','万兽猿王','玄阴鬼修'])assert(source.includes(enemy),`regional enemy missing: ${enemy}`);
for(const system of ['renderSect','marketPrices','brewAlchemy','GEAR_ITEMS','processSocialEvents','attemptBreakthrough','renderDwelling','reincarnate','renderSecretRealm','updateFactionConflict'])assert(source.includes(system),`existing system marker lost: ${system}`);

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
for(const fn of ['newGame','getState','action','travel','advanceDays','startCombat','getCombat'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);
api.newGame('V15地域回归');
let state=api.getState();
assert.equal(state.version,'1.5.0');
assert.equal(state.saveSchemaVersion,13);
assert.equal(dom.window.document.querySelectorAll('#mapList .map-node').length,12,'map did not render 12 regions');
const mapText=dom.window.document.getElementById('mapList').textContent;
for(const name of NEW_REGIONS)assert(mapText.includes(name),`map UI missing ${name}`);
for(const label of ['危险：','势力：','特产：','秘境：'])assert(mapText.includes(label),`map ecology label missing: ${label}`);
assert((state.npcs||[]).every(n=>LOCATIONS.includes(n.location)),'new NPC spawned outside known regions');

// Verify the road network reaches the expanded world and time is consumed.
const day0=JSON.stringify(state.time);
api.travel('青石镇');
assert.equal(api.getState().player.location,'青石镇');
api.travel('临江城');
assert.equal(api.getState().player.location,'临江城');
api.travel('云梦泽');
state=api.getState();
assert.equal(state.player.location,'云梦泽');
assert.notEqual(JSON.stringify(state.time),day0,'regional travel did not consume world time');

// 云梦泽 has herb bonus +2, so one gather action must yield at least 3 herbs.
const herbsBefore=state.player.herbs;
api.action('gather');
state=api.getState();
assert(state.player.herbs-herbsBefore>=3,'regional gather bonus was not applied in 云梦泽');

// 苍梧郡城 offers richer work (2-4 stones/day).
api.travel('苍梧郡城');
state=api.getState();
const stonesBefore=state.player.spiritStones;
api.action('work');
state=api.getState();
assert(state.player.spiritStones-stonesBefore>=2,'regional work range was not applied in 苍梧郡城');

// We are roughly at day 10 here. Advance to about day 20: the first realm
// has definitely spawned at day 18, while its earliest close day is day 32.
api.advanceDays(10);
state=api.getState();
assert((state.npcs||[]).every(n=>LOCATIONS.includes(n.location)),'NPC movement escaped the regional network');
assert(state.world.secretRealm,'regional secret realm did not appear after world time advanced');
assert(LOCATIONS.includes(state.world.secretRealm.location),'secret realm spawned outside known regions');
assert(['云隐遗府','黑风古窟','临江水府','云梦沉宫','赤霞炎窟','星陨矿宫','万兽祖穴','古河沉城','玄阴古冢'].includes(state.world.secretRealm.name),'unexpected secret realm template');

// New regional enemies must enter the real combat system.
api.startCombat('水匪斥候');
assert(api.getCombat(),'regional combat did not start');
assert.equal(api.getCombat().enemy.name,'水匪斥候');

// A current-schema V1.4 save must load directly into V1.5 without changing the save key/schema.
const currentRaw=dom.window.localStorage.getItem(SAVE_KEY);
assert(currentRaw,'V1.5 save missing');
const prior=JSON.parse(currentRaw);
prior.version='1.3.0';
prior.saveSchemaVersion=13;
const priorDom=makeDom(JSON.stringify(prior));
priorDom.window.document.getElementById('continueBtn').click();
const priorState=priorDom.window.__TAIXUAN_TEST__.getState();
assert.equal(priorState.version,'1.5.0','V1.4/V1.3 gameplay save did not load into V1.5');
assert.equal(priorState.saveSchemaVersion,13,'V1.5 changed schema while loading current save');
assert(LOCATIONS.includes(priorState.player.location),'player location invalid after upgrade');

// Future schema protection from V1.4 must remain intact.
const future={...prior,saveSchemaVersion:14,version:'future-test'};
const futureRaw=JSON.stringify(future);
const futureDom=makeDom(futureRaw);
futureDom.window.document.getElementById('continueBtn').click();
assert.equal(futureDom.window.localStorage.getItem(SAVE_KEY),futureRaw,'future save was overwritten by V1.5');
assert.equal(futureDom.window.__TAIXUAN_TEST__.getState(),null,'future save unexpectedly loaded in V1.5');

console.log('V15_REGRESSION_PASS',JSON.stringify({
 version:'1.5.0',locations:LOCATIONS.length,newRegions:NEW_REGIONS.length,
 regionalGather:true,regionalWork:true,npcRegionalMovement:true,weightedSecretRealm:true,
 currentSchemaUpgrade:true,futureSaveProtected:true
}));
