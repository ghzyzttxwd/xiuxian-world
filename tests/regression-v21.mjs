import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v21.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';
const REGIONS=['青石村','青石镇','临江城','黑风岭','青云山','云梦泽','苍梧郡城','赤霞谷','落星矿脉','万兽山脉','古河遗迹','玄阴禁地'];
const PATHS=[['sword','青云剑道','御剑连斩'],['flame','赤霞火道','焚脉真火'],['body','万兽炼体','崩山式'],['spirit','太虚神道','摄魂印']];

assert(source.includes("const VERSION='2.1.0'"),'V2.1 gameplay version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=18'),'schema 18 missing');
for(const [,name,spell] of PATHS){assert(source.includes(name),`path missing: ${name}`);assert(source.includes(spell),`signature skill missing: ${spell}`)}
for(const marker of ['DAO_PATHS','chooseDaoPath','daoSignatureMultiplier','daoSecretRealmResonance','burn:0','bodyGuard:0','soulSeal:0'])assert(source.includes(marker),`V2.1 marker missing: ${marker}`);
for(const old of ['金元丹','养魂丹','太虚神剑','高阶灵材','craftDeificationEssence','TRAVEL_ROUTES','renderSect','renderSecretRealm','processSocialEvents'])assert(source.includes(old),`V2.0 system lost: ${old}`);
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
function baseState(){const d=makeDom();const api=d.window.__TAIXUAN_TEST__;api.newGame('V21回归');return api.getState()}
function richPathSeed(path,location){const s=baseState();Object.assign(s.player,{realmIndex:23,progress:0,location,spiritStones:500,rareMaterials:30,insight:30,beastMaterials:40,relicFragments:30,sect:'青云宗',sectRank:'内门弟子',sectContribution:200,hp:2800,qi:3100,daoPath:'none',daoMastery:0,daoSwitches:0});s.flags={};return s}

const dom=makeDom();const api=dom.window.__TAIXUAN_TEST__;
assert(api,'test API missing');
for(const fn of ['newGame','getState','chooseDaoPath','daoPathInfo','daoMeleeMultiplier','daoSpellMultiplier','daoIncomingMultiplier','daoSignatureMultiplier','maxHp','maxQi','startCombat','combatAction','claimSecretRealmCore'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);
api.newGame('V21新档');let state=api.getState();
assert.equal(state.version,'2.1.0');assert.equal(state.saveSchemaVersion,18);assert.equal(state.player.daoPath,'none');assert.equal(state.player.daoMastery,0);assert.equal(state.player.daoSwitches,0);
assert(dom.window.document.getElementById('daoPathPanel'),'dao path panel missing');
for(const [,name] of PATHS)assert(dom.window.document.getElementById('daoPathPanel').textContent.includes(name),`dao UI missing ${name}`);
assert.equal(dom.window.document.querySelectorAll('#mapList .map-node').length,12,'12-region map regressed');
assert.equal(api.routeInfo('临江城','云梦泽').length,2,'alternate travel routes regressed');

// V2.0 schema17 -> V2.1 schema18 migration.
const old=baseState();old.version='2.0.0';old.saveSchemaVersion=17;old.player.realmIndex=19;old.player.rareMaterials=4;old.player.goldenPills=2;old.player.soulPills=1;delete old.player.daoPath;delete old.player.daoMastery;delete old.player.daoSwitches;
const oldDom=loadState(old),oldState=oldDom.window.__TAIXUAN_TEST__.getState();
assert.equal(oldState.version,'2.1.0');assert.equal(oldState.saveSchemaVersion,18);assert.equal(oldState.player.daoPath,'none');assert.equal(oldState.player.daoMastery,0);assert.equal(oldState.player.daoSwitches,0);assert.equal(oldState.player.rareMaterials,4);assert.equal(oldState.player.goldenPills,2);assert.equal(oldState.player.soulPills,1);

// Future schema19 must not load or overwrite.
const future={...old,saveSchemaVersion:19,version:'future-v21'};const futureRaw=JSON.stringify(future);const futureDom=makeDom(futureRaw);futureDom.window.document.getElementById('continueBtn').click();
assert.equal(futureDom.window.localStorage.getItem(SAVE_KEY),futureRaw,'future schema was overwritten');assert.equal(futureDom.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded');

// Each path must consume real resources, equip its manual and grant its signature skill.
const setups={
 sword:{loc:'青云山',spell:'御剑连斩',manual:'青云剑典',stones:20,rare:2,insight:2,contribution:45},
 flame:{loc:'赤霞谷',spell:'焚脉真火',manual:'赤霞焚天诀',stones:35,rare:3,insight:2},
 body:{loc:'万兽山脉',spell:'崩山式',manual:'万兽锻体经',stones:30,rare:3,insight:2,materials:10},
 spirit:{loc:'古河遗迹',spell:'摄魂印',manual:'太虚观神录',stones:45,rare:2,insight:3,relic:5}
};
for(const id of Object.keys(setups)){
 const c=setups[id],seed=richPathSeed(id,c.loc),d=loadState(seed),a=d.window.__TAIXUAN_TEST__,before=a.getState();a.chooseDaoPath(id);const after=a.getState();
 assert.equal(after.player.daoPath,id,`${id} path not selected`);assert.equal(after.player.manual,c.manual,`${id} manual not equipped`);assert(c.spell in after.player.spells,`${id} signature not learned`);
 assert.equal(after.player.spiritStones,before.player.spiritStones-c.stones,`${id} stone cost wrong`);assert.equal(after.player.rareMaterials,before.player.rareMaterials-c.rare,`${id} rare cost wrong`);assert.equal(after.player.insight,before.player.insight-c.insight,`${id} insight cost wrong`);
 if(c.materials)assert.equal(after.player.beastMaterials,before.player.beastMaterials-c.materials,'body material cost wrong');
 if(c.relic)assert.equal(after.player.relicFragments,before.player.relicFragments-c.relic,'spirit relic cost wrong');
 if(c.contribution)assert.equal(after.player.sectContribution,before.player.sectContribution-c.contribution,'sword contribution cost wrong');
}

// Passives must create real stat tradeoffs.
const noneSeed=richPathSeed('none','临江城'),noneDom=loadState(noneSeed),noneApi=noneDom.window.__TAIXUAN_TEST__,noneHp=noneApi.maxHp(),noneQi=noneApi.maxQi();
const bodySeed=richPathSeed('body','万兽山脉');bodySeed.player.daoPath='body';bodySeed.player.manual='万兽锻体经';bodySeed.player.spells['崩山式']=0;const bodyDom=loadState(bodySeed),bodyApi=bodyDom.window.__TAIXUAN_TEST__;
assert(bodyApi.maxHp()>noneHp*1.25,'body path HP passive missing');assert(bodyApi.maxQi()<noneQi,'body path qi tradeoff missing');assert(bodyApi.daoIncomingMultiplier()<0.9,'body damage reduction missing');assert(bodyApi.daoSpellMultiplier()<0.9,'body spell tradeoff missing');
const spiritSeed=richPathSeed('spirit','古河遗迹');spiritSeed.player.daoPath='spirit';spiritSeed.player.manual='太虚观神录';spiritSeed.player.spells['摄魂印']=0;const spiritDom=loadState(spiritSeed),spiritApi=spiritDom.window.__TAIXUAN_TEST__;
assert(spiritApi.maxQi()>noneQi*1.2,'spirit qi passive missing');assert(spiritApi.maxHp()<noneHp,'spirit hp tradeoff missing');
const flameSeed=richPathSeed('flame','赤霞谷');flameSeed.player.daoPath='flame';flameSeed.player.manual='赤霞焚天诀';flameSeed.player.spells['焚脉真火']=0;const flameDom=loadState(flameSeed),flameApi=flameDom.window.__TAIXUAN_TEST__;
assert(flameApi.daoSpellMultiplier()>=1.3,'flame spell multiplier missing');assert(flameApi.daoIncomingMultiplier()>1,'flame fragility missing');
const swordSeed=richPathSeed('sword','青云山');swordSeed.player.daoPath='sword';swordSeed.player.manual='青云剑典';swordSeed.player.spells['御剑连斩']=0;const swordDom=loadState(swordSeed),swordApi=swordDom.window.__TAIXUAN_TEST__;
assert(swordApi.daoMeleeMultiplier()>1.2,'sword melee multiplier missing');

// Switching paths keeps prior learned skill, costs +3 insight, halves mastery and records a switch.
const switchSeed=richPathSeed('flame','万兽山脉');Object.assign(switchSeed.player,{daoPath:'flame',daoMastery:40,daoSwitches:0,manual:'赤霞焚天诀',insight:20});switchSeed.player.spells['焚脉真火']=12;
const switchDom=loadState(switchSeed),switchApi=switchDom.window.__TAIXUAN_TEST__,switchBefore=switchApi.getState();switchApi.chooseDaoPath('body');const switchAfter=switchApi.getState();
assert.equal(switchAfter.player.daoPath,'body');assert.equal(switchAfter.player.daoMastery,20,'switch did not halve mastery');assert.equal(switchAfter.player.daoSwitches,1);assert('焚脉真火'in switchAfter.player.spells,'old path spell was erased');assert('崩山式'in switchAfter.player.spells,'new path spell not learned');assert.equal(switchAfter.player.insight,switchBefore.player.insight-5,'switch insight surcharge wrong');

// Signature skills must execute in the real combat loop.
function combatSeed(id,loc,manual,spell){const s=richPathSeed(id,loc);Object.assign(s.player,{realmIndex:23,daoPath:id,daoMastery:60,manual,hp:2800,qi:3100});s.player.spells[spell]=20;return s}
for(const [id,,spell] of PATHS){const c=setups[id],seed=combatSeed(id,c.loc,c.manual,spell),d=loadState(seed),a=d.window.__TAIXUAN_TEST__;a.startCombat('玄阴化神残魂');const before=a.getCombat();a.combatAction('dao');const after=a.getCombat();assert(after,`${id} signature unexpectedly ended top combat`);assert(after.enemyHp<before.enemyHp,`${id} signature did not damage enemy`);assert(after.playerQi<before.playerQi,`${id} signature did not consume qi`);assert(a.getState().player.daoMastery>=63,`${id} signature did not train mastery`);if(id==='flame')assert(after.burn>=2,'flame burn did not persist');if(id==='body')assert(after.bodyGuard>=1,'body guard did not persist');if(id==='spirit')assert(after.soulSeal>=2,'spirit soul seal did not persist')}

// Matching secret realm should feed back into the active path mastery.
const resonance=richPathSeed('sword','青云山');Object.assign(resonance.player,{daoPath:'sword',daoMastery:10,manual:'青云剑典'});resonance.player.spells['御剑连斩']=0;resonance.world.secretRealm={id:'dao-resonance',name:'云隐遗府',location:'青云山',guardian:'青铜傀儡',desc:'test',openDay:1,closeDay:9999,threat:8,stage:2,foraged:false,cleared:false};resonance.world.nextSecretRealmDay=9999;
const resDom=loadState(resonance),resApi=resDom.window.__TAIXUAN_TEST__;resApi.claimSecretRealmCore();const resAfter=resApi.getState();assert(resAfter.player.daoMastery>=22,'matching secret realm did not grant path resonance');assert(resAfter.player.secretRealmClears>=1,'secret realm clear regressed');

console.log('V21_REGRESSION_PASS',JSON.stringify({version:'2.1.0',schema:18,realms:26,regions:12,routes:20,paths:4,pathCosts:true,pathSwitch:true,pathTradeoffs:true,signatureCombat:true,secretResonance:true,v20SaveUpgrade:true,futureSaveProtected:true}));
