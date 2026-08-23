import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v34.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';
assert(source.includes("const VERSION='3.4.0'"),'V3.4 version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=31'),'schema31 missing');
for(const marker of ['V34_BUILD_CATALOG','V34_ENEMY_MECHANICS','v34ActiveBuild','v34EnemyAttackEffect','v34EnemyAfterPlayerAction','renderV34BuildPanel'])assert(source.includes(marker),`missing V3.4 marker ${marker}`);
function cleanHtml(html){return html.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'')}
function makeDom(seed=null){const dom=new JSDOM(cleanHtml(htmlRaw),{url:'http://example.test/',runScripts:'outside-only',pretendToBeVisual:true});dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});dom.window.scrollTo=()=>{};dom.window.console=console;if(seed!==null)dom.window.localStorage.setItem(SAVE_KEY,seed);dom.window.eval(source);return dom}
function loadState(obj){const d=makeDom(JSON.stringify(obj));d.window.document.getElementById('continueBtn').click();return d}
function fresh(){const d=makeDom(),api=d.window.__TAIXUAN_TEST__;api.newGame('V34回归');return {d,api}}
function stripV34(p){for(const k of ['v34CombatVersion','v34BuildWins','v34MechanicWinsById'])delete p[k]}

const {api}=fresh();assert(api,'test API missing');
for(const fn of ['v34CatalogSnapshot','v34BuildRegistry','v34MechanicRegistry','v34BuildScore','v34ActiveBuild','v34ActivateBuildForTest','v34SetPlayerForTest','v34EnemyMechanic','v34EnemyAttackEffect','v34EnemyAfterPlayerAction','v34AfterCombatRound','v34BuildDamageMultiplier','v34BuildIncomingMultiplier','contentRegistrySnapshot','v33CatalogSnapshot','v32CatalogSnapshot','v31CatalogSnapshot'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);
let s=api.getState();assert.equal(s.version,'3.4.0');assert.equal(s.saveSchemaVersion,31);assert.equal(s.player.contentStateVersion,5);assert.equal(s.player.v34CombatVersion,1);
const cat=api.v34CatalogSnapshot();assert.equal(cat.enemies,48);assert.equal(cat.newEnemies,19);assert(cat.mechanicEnemies>=12);assert(cat.mechanics>=12);assert.equal(cat.builds,8);for(const p of ['sword','flame','body','spirit'])assert.equal(cat.perPath[p],2,`${p} build count`);
const reg=api.contentRegistrySnapshot();assert.equal(reg.registryVersion,5);assert.equal(reg.counts.enemies,48);assert.equal(reg.counts.drops,48);assert.equal(reg.counts.manuals,28);assert.equal(reg.counts.spells,60);assert.equal(reg.counts.materials,48);assert.equal(reg.counts.recipes,24);assert.equal(Object.keys(reg.artifacts).length,24);
const mechanics=api.v34MechanicRegistry();assert(Object.keys(mechanics).length>=12);for(const m of Object.values(mechanics)){assert(m.enemyId&&m.enemyName&&m.type,'mechanic registry incomplete')}

// schema30 -> 31 preserves V3.3 while adding V3.4 combat/build tracking.
const old=api.getState();old.version='3.3.0';old.saveSchemaVersion=30;old.player.contentStateVersion=4;old.player.pillToxicity=37;old.player.materialInventoryById['mat-v33-greenleaf']=7;stripV34(old.player);
const od=loadState(old),oa=od.window.__TAIXUAN_TEST__,os=oa.getState();assert.equal(os.version,'3.4.0');assert.equal(os.saveSchemaVersion,31);assert.equal(os.player.v34CombatVersion,1);assert.equal(os.player.pillToxicity,37);assert.equal(os.player.materialInventoryById['mat-v33-greenleaf'],7);assert.equal(typeof os.player.v34BuildWins,'object');assert.equal(typeof os.player.v34MechanicWinsById,'object');

// Every declared build is actually recognizable from its manual + skills + passive loadout.
const builds=oa.v34BuildRegistry();assert.equal(Object.keys(builds).length,8);for(const id of Object.keys(builds)){assert.equal(oa.v34ActivateBuildForTest(id),true,`build did not activate: ${id}`);const active=oa.v34ActiveBuild();assert(active&&active.build.id===id,`wrong active build for ${id}`);assert(active.score>=5,`build not fully formed: ${id}`)}

// Build bonuses are mechanical, not display-only.
oa.v34ActivateBuildForTest('build-sword-burst');assert(oa.v34BuildDamageMultiplier({category:'execute',path:'sword'},{})>1,'sword burst bonus inactive');
oa.v34ActivateBuildForTest('build-body-bastion');assert(oa.v34BuildIncomingMultiplier()<1,'body mitigation inactive');
oa.v34ActivateBuildForTest('build-flame-burst');assert(oa.v34BuildIncomingMultiplier()>1,'flame burst downside inactive');

// Armor, reflection and control resistance run through the real combat path.
oa.v34ActivateBuildForTest('build-sword-burst');oa.v34SetPlayerForTest(23);oa.startCombat('落星石傀');oa.combatAction('attack');let c=oa.getCombat();assert(!c||c.logs.some(x=>x.includes('星铁重甲')&&x.includes('抵消')),'heavy armor mechanic did not fire');
oa.v34SetPlayerForTest(23);oa.startCombat('青云试剑傀');oa.combatAction('attack');c=oa.getCombat();assert(!c||c.logs.some(x=>x.includes('借力反剑')&&x.includes('反照')),'reflect mechanic did not fire');
oa.v34ActivateBuildForTest('build-spirit-seal');oa.v34SetPlayerForTest(23);oa.startCombat('玄阴摄魂使');oa.combatAction('skill:spell-soul-fixing-curse');c=oa.getCombat();assert(c&&c.soulSeal<=2,'control resistance did not reduce soul seal');

// Qi drain, poison DOT, regeneration and cooldown tax are observable in live combat state/logs.
oa.v34SetPlayerForTest(8);let q0=oa.getState().player.qi;oa.startCombat('苍梧破法客');oa.combatAction('attack');c=oa.getCombat();assert(c&&c.playerQi<q0,'qi burn did not drain qi');
oa.v34SetPlayerForTest(4);oa.startCombat('黑风毒蛛');oa.combatAction('attack');c=oa.getCombat();assert(c&&c.logs.some(x=>x.includes('蚀脉毒')),'venom DOT did not tick');
oa.v34SetPlayerForTest(5);oa.startCombat('云梦水灵');oa.combatAction('attack');c=oa.getCombat();assert(c&&c.logs.some(x=>x.includes('水泽再生')&&x.includes('恢复')),'regeneration did not fire');
oa.v34ActivateBuildForTest('build-spirit-seal');oa.v34SetPlayerForTest(18);oa.startCombat('古河禁制灵');oa.combatAction('attack');c=oa.getCombat();assert(c&&Object.values(c.cooldowns||{}).some(n=>n>=1),'cooldown tax did not persist');

// Existing V3.3/V3.2/V3.1 content remains intact.
assert.equal(oa.v33CatalogSnapshot().materials,48);assert.equal(oa.v33CatalogSnapshot().recipes,24);assert.equal(oa.v32CatalogSnapshot().equipment,60);assert.equal(oa.v32CatalogSnapshot().artifacts,24);assert.equal(oa.v31CatalogSnapshot().manuals.length,28);assert.equal(oa.v31CatalogSnapshot().spells.length,60);assert.equal(oa.realmBalance().length,26);

// Save/reload keeps V3.4 tracking fields.
const saved=oa.getState(),rd=loadState(saved),ra=rd.window.__TAIXUAN_TEST__,rs=ra.getState();assert.equal(rs.saveSchemaVersion,31);assert.equal(rs.player.v34CombatVersion,1);assert(rs.player.v34BuildWins&&typeof rs.player.v34BuildWins==='object');assert(rs.player.v34MechanicWinsById&&typeof rs.player.v34MechanicWinsById==='object');

// Future schema32 is protected from overwrite.
const future=ra.getState();future.saveSchemaVersion=32;future.version='future-v34';const futureRaw=JSON.stringify(future);const fd=makeDom(futureRaw);fd.window.document.getElementById('continueBtn').click();assert.equal(fd.window.localStorage.getItem(SAVE_KEY),futureRaw,'future schema was overwritten');assert.equal(fd.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded');
console.log('V34_REGRESSION_PASS',JSON.stringify({version:'3.4.0',schema:31,enemies:48,newEnemies:19,mechanicEnemies:cat.mechanicEnemies,mechanics:cat.mechanics,builds:8,twoBuildsPerPath:true,autoBuildRecognition:true,buildBonuses:true,armor:true,reflection:true,controlResistance:true,qiDrain:true,dot:true,regeneration:true,cooldownTax:true,v33Preserved:true,v32Preserved:true,v31Preserved:true,futureSaveProtected:true}));
