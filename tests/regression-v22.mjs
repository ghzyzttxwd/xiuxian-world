import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v22.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';
const REGIONS=['青石村','青石镇','临江城','黑风岭','青云山','云梦泽','苍梧郡城','赤霞谷','落星矿脉','万兽山脉','古河遗迹','玄阴禁地'];
const PATHS=[['sword','青云剑道','御剑连斩'],['flame','赤霞火道','焚脉真火'],['body','万兽炼体','崩山式'],['spirit','太虚神道','摄魂印']];
const WORLD_LOCS={sword:'青云山',flame:'赤霞谷',body:'万兽山脉',spirit:'古河遗迹'};

assert(source.includes("const VERSION='2.2.0'"),'V2.2 gameplay version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=19'),'schema 19 missing');
for(const [,name,spell] of PATHS){assert(source.includes(name),`path missing: ${name}`);assert(source.includes(spell),`signature skill missing: ${spell}`)}
for(const marker of ['DAO_WORLD_EVENTS','DAO_WORLD_LOCATIONS','daoWorldEventAvailable','resolveDaoWorldEvent','daoRenownValue','npcDaoAffinity','daoSocialResonance','道途共鸣','剑脉认可'])assert(source.includes(marker),`V2.2 marker missing: ${marker}`);
for(const old of ['DAO_PATHS','chooseDaoPath','daoSignatureMultiplier','金元丹','养魂丹','太虚神剑','高阶灵材','craftDeificationEssence','TRAVEL_ROUTES','renderSect','renderSecretRealm','processSocialEvents'])assert(source.includes(old),`prior system lost: ${old}`);
for(const region of REGIONS)assert(source.includes(`'${region}'`),`region lost: ${region}`);

function cleanHtml(html){return html.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'')}
function makeDom(seed=null){
 const dom=new JSDOM(cleanHtml(htmlRaw),{url:'http://example.test/',runScripts:'outside-only',pretendToBeVisual:true});
 dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
 dom.window.scrollTo=()=>{};dom.window.console=console;
 if(seed!==null)dom.window.localStorage.setItem(SAVE_KEY,seed);
 dom.window.eval(source);return dom;
}
function loadState(obj){const d=makeDom(JSON.stringify(obj));d.window.document.getElementById('continueBtn').click();return d}
function baseState(){const d=makeDom();const api=d.window.__TAIXUAN_TEST__;api.newGame('V22回归');return api.getState()}
function richSeed(path='none',location='临江城'){
 const s=baseState();Object.assign(s.player,{realmIndex:23,progress:0,location,spiritStones:500,rareMaterials:30,insight:30,beastMaterials:40,relicFragments:30,sect:'青云宗',sectRank:'内门弟子',sectContribution:200,hp:2800,qi:3100,daoPath:path,daoMastery:0,daoSwitches:0,daoRenown:{sword:0,flame:0,body:0,spirit:0},daoEncounters:0});s.flags={};return s;
}

const dom=makeDom(),api=dom.window.__TAIXUAN_TEST__;
assert(api,'test API missing');
for(const fn of ['newGame','getState','chooseDaoPath','daoPathInfo','resolveDaoWorldEvent','startDaoWorldEvent','daoWorldEventAvailable','daoWorldResonance','daoRenownValue','npcDaoAffinity','discussDaoNPC','sparNPC','claimSectStipend','startRegionalEvent','startCombat','combatAction','claimSecretRealmCore'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);
api.newGame('V22新档');let state=api.getState();
assert.equal(state.version,'2.2.0');assert.equal(state.saveSchemaVersion,19);assert.equal(state.player.daoPath,'none');assert.equal(state.player.daoMastery,0);assert.equal(state.player.daoEncounters,0);assert.deepEqual(JSON.parse(JSON.stringify(state.player.daoRenown)),{sword:0,flame:0,body:0,spirit:0});
assert(state.npcs.every(n=>['sword','flame','body','spirit'].includes(n.daoAffinity)),'new NPC dao affinity missing');
assert(dom.window.document.getElementById('daoPathPanel'),'dao path panel missing');assert.equal(dom.window.document.querySelectorAll('#mapList .map-node').length,12,'12-region map regressed');assert.equal(api.routeInfo('临江城','云梦泽').length,2,'alternate routes regressed');

// V2.1 schema18 -> V2.2 schema19 migration, including old NPCs.
const old=baseState();old.version='2.1.0';old.saveSchemaVersion=18;delete old.player.daoRenown;delete old.player.daoEncounters;for(const n of old.npcs)delete n.daoAffinity;
const oldDom=loadState(old),oldState=oldDom.window.__TAIXUAN_TEST__.getState();
assert.equal(oldState.version,'2.2.0');assert.equal(oldState.saveSchemaVersion,19);assert.deepEqual(JSON.parse(JSON.stringify(oldState.player.daoRenown)),{sword:0,flame:0,body:0,spirit:0});assert.equal(oldState.player.daoEncounters,0);assert(oldState.npcs.every(n=>['sword','flame','body','spirit'].includes(n.daoAffinity)),'old NPC affinity migration failed');

// Future schema20 must be rejected without overwrite.
const future={...old,saveSchemaVersion:20,version:'future-v22'};const futureRaw=JSON.stringify(future),futureDom=makeDom(futureRaw);futureDom.window.document.getElementById('continueBtn').click();
assert.equal(futureDom.window.localStorage.getItem(SAVE_KEY),futureRaw,'future save overwritten');assert.equal(futureDom.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded');

// V2.1 path selection and costs remain real.
const setups={
 sword:{loc:'青云山',spell:'御剑连斩',manual:'青云剑典',stones:20,rare:2,insight:2,contribution:45},
 flame:{loc:'赤霞谷',spell:'焚脉真火',manual:'赤霞焚天诀',stones:35,rare:3,insight:2},
 body:{loc:'万兽山脉',spell:'崩山式',manual:'万兽锻体经',stones:30,rare:3,insight:2,materials:10},
 spirit:{loc:'古河遗迹',spell:'摄魂印',manual:'太虚观神录',stones:45,rare:2,insight:3,relic:5}
};
for(const id of Object.keys(setups)){
 const c=setups[id],seed=richSeed('none',c.loc),d=loadState(seed),a=d.window.__TAIXUAN_TEST__,before=a.getState();a.chooseDaoPath(id);const after=a.getState();
 assert.equal(after.player.daoPath,id);assert.equal(after.player.manual,c.manual);assert(c.spell in after.player.spells);assert.equal(after.player.spiritStones,before.player.spiritStones-c.stones);assert.equal(after.player.rareMaterials,before.player.rareMaterials-c.rare);assert.equal(after.player.insight,before.player.insight-c.insight);if(c.materials)assert.equal(after.player.beastMaterials,before.player.beastMaterials-c.materials);if(c.relic)assert.equal(after.player.relicFragments,before.player.relicFragments-c.relic);if(c.contribution)assert.equal(after.player.sectContribution,before.player.sectContribution-c.contribution);
}

// Switching still keeps old skill and exact penalty.
const switchSeed=richSeed('flame','万兽山脉');Object.assign(switchSeed.player,{daoMastery:40,daoSwitches:0,manual:'赤霞焚天诀',insight:20});switchSeed.player.spells['焚脉真火']=12;
const switchDom=loadState(switchSeed),switchApi=switchDom.window.__TAIXUAN_TEST__,switchBefore=switchApi.getState();switchApi.chooseDaoPath('body');const switchAfter=switchApi.getState();
assert.equal(switchAfter.player.daoPath,'body');assert.equal(switchAfter.player.daoMastery,20);assert.equal(switchAfter.player.daoSwitches,1);assert('焚脉真火'in switchAfter.player.spells);assert('崩山式'in switchAfter.player.spells);assert.equal(switchAfter.player.insight,switchBefore.player.insight-5);

// Signature combat still executes for all four paths.
function combatSeed(id,loc,manual,spell){const s=richSeed(id,loc);Object.assign(s.player,{daoMastery:60,manual,hp:2800,qi:3100});s.player.spells[spell]=20;return s}
for(const [id,,spell] of PATHS){const c=setups[id],d=loadState(combatSeed(id,c.loc,c.manual,spell)),a=d.window.__TAIXUAN_TEST__;a.startCombat('玄阴化神残魂');const before=a.getCombat();a.combatAction('dao');const after=a.getCombat();assert(after,`${id} signature unexpectedly ended combat`);assert(after.enemyHp<before.enemyHp,`${id} signature no damage`);assert(after.playerQi<before.playerQi,`${id} signature no qi cost`);if(id==='flame')assert(after.burn>=2);if(id==='body')assert(after.bodyGuard>=1);if(id==='spirit')assert(after.soulSeal>=2)}

// Four deterministic world-event settlements must differ and persist renown.
{
 const s=richSeed('sword','青云山');s.player.manual='青云剑典';s.player.spells['御剑连斩']=0;const d=loadState(s),a=d.window.__TAIXUAN_TEST__,b=a.getState();a.resolveDaoWorldEvent('safe');const x=a.getState();assert.equal(x.player.daoEncounters,b.player.daoEncounters+1);assert.equal(x.player.daoRenown.sword,1);assert.equal(x.player.daoMastery,b.player.daoMastery+16);assert.equal(x.player.manualProf,b.player.manualProf+10);
}
{
 const s=richSeed('flame','赤霞谷');s.player.manual='赤霞焚天诀';s.player.spells['焚脉真火']=0;const d=loadState(s),a=d.window.__TAIXUAN_TEST__,b=a.getState();a.resolveDaoWorldEvent('bold');const x=a.getState();assert.equal(x.player.daoRenown.flame,2);assert.equal(x.player.rareMaterials,b.player.rareMaterials+2);assert(x.player.hp<b.player.hp);assert.equal(x.player.daoMastery,b.player.daoMastery+28);
}
{
 const s=richSeed('body','万兽山脉');s.player.manual='万兽锻体经';s.player.spells['崩山式']=0;const d=loadState(s),a=d.window.__TAIXUAN_TEST__,b=a.getState();a.resolveDaoWorldEvent('safe');const x=a.getState();assert.equal(x.player.daoRenown.body,1);assert.equal(x.player.beastMaterials,b.player.beastMaterials+2);assert.equal(x.player.daoMastery,b.player.daoMastery+16);
}
{
 const s=richSeed('spirit','古河遗迹');s.player.manual='太虚观神录';s.player.spells['摄魂印']=0;const d=loadState(s),a=d.window.__TAIXUAN_TEST__,b=a.getState();a.resolveDaoWorldEvent('bold');const x=a.getState();assert.equal(x.player.daoRenown.spirit,2);assert.equal(x.player.relicFragments,b.player.relicFragments+1);assert.equal(x.player.insight,b.player.insight+1);assert.equal(x.player.qi,0);assert.equal(x.player.daoMastery,b.player.daoMastery+28);
}

// Regional exploration event path is genuinely wired to the world-event chooser.
let regionalWired=false;
for(let seedNo=1;seedNo<=200&&!regionalWired;seedNo++){
 const s=richSeed('flame','赤霞谷');s.player.manual='赤霞焚天诀';s.player.spells['焚脉真火']=0;s.rng=seedNo;const d=loadState(s),a=d.window.__TAIXUAN_TEST__;a.startRegionalEvent();const text=d.window.document.getElementById('modal').textContent;if(text.includes('地火潮汐'))regionalWired=true;
}
assert(regionalWired,'regional event never entered path-specific world event');

// Map visually marks resonance locations for current path.
const mapSeed=richSeed('spirit','古河遗迹');mapSeed.player.manual='太虚观神录';mapSeed.player.spells['摄魂印']=0;const mapDom=loadState(mapSeed);assert.equal((mapDom.window.document.getElementById('mapList').textContent.match(/道途共鸣/g)||[]).length,2,'spirit resonance map badges wrong');

// Same-path NPC discussion: more relation plus mastery/renown.
{
 const s=richSeed('sword','青云山');s.player.manual='青云剑典';s.player.spells['御剑连斩']=0;s.player.daoRenown.sword=5;const n=s.npcs[0];Object.assign(n,{known:true,alive:true,location:'青云山',daoAffinity:'sword',realmIndex:23,lastDaoDay:0,relation:0});const d=loadState(s),a=d.window.__TAIXUAN_TEST__,b=a.getState();a.discussDaoNPC(n.id);const x=a.getState(),xn=x.npcs.find(v=>v.id===n.id);assert(x.player.daoMastery>=b.player.daoMastery+6,'same-path discussion mastery missing');assert.equal(x.player.daoRenown.sword,b.player.daoRenown.sword+1,'same-path discussion renown missing');assert(xn.relation>=7,'same-path discussion relation bonus missing');
}

// Same-path sparring trains the path regardless of win/loss and is visible on NPC card.
{
 const s=richSeed('body','万兽山脉');s.player.manual='万兽锻体经';s.player.spells['崩山式']=0;s.player.manualProf=1000;const n=s.npcs[1];Object.assign(n,{known:true,alive:true,location:'万兽山脉',daoAffinity:'body',realmIndex:0,lastSparDay:0,relation:0,grudge:0});const d=loadState(s),a=d.window.__TAIXUAN_TEST__,b=a.getState();assert(d.window.document.getElementById('npcList').textContent.includes('与你同道'),'NPC same-path label missing');a.sparNPC(n.id);const x=a.getState();assert(x.player.daoMastery>=b.player.daoMastery+8,'same-path spar mastery missing');assert.equal(x.player.daoRenown.body,b.player.daoRenown.body+1,'same-path spar renown missing');
}

// Qingyun monthly stipend recognizes sword-path renown.
{
 const s=richSeed('sword','青云山');s.player.manual='青云剑典';s.player.spells['御剑连斩']=0;s.player.daoRenown.sword=10;s.player.sectLastStipend=0;const d=loadState(s),a=d.window.__TAIXUAN_TEST__,b=a.getState();a.claimSectStipend();const x=a.getState();assert.equal(x.player.sectContribution,b.player.sectContribution+4,'sword recognition contribution wrong');assert(x.player.spiritStones>b.player.spiritStones,'stipend stones regressed');
}

// Matching secret realm still feeds active-path mastery.
const resonance=richSeed('sword','青云山');Object.assign(resonance.player,{daoMastery:10,manual:'青云剑典'});resonance.player.spells['御剑连斩']=0;resonance.world.secretRealm={id:'dao-resonance-v22',name:'云隐遗府',location:'青云山',guardian:'青铜傀儡',desc:'test',openDay:1,closeDay:9999,threat:8,stage:2,foraged:false,cleared:false};resonance.world.nextSecretRealmDay=9999;
const resDom=loadState(resonance),resApi=resDom.window.__TAIXUAN_TEST__;resApi.claimSecretRealmCore();const resAfter=resApi.getState();assert(resAfter.player.daoMastery>=22,'secret realm resonance regressed');assert(resAfter.player.secretRealmClears>=1);

console.log('V22_REGRESSION_PASS',JSON.stringify({version:'2.2.0',schema:19,realms:26,regions:12,routes:20,paths:4,worldEvents:4,npcAffinity:true,socialResonance:true,sectRecognition:true,mapResonance:true,v21CombatPreserved:true,v21SaveUpgrade:true,futureSaveProtected:true}));
