import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v32.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';
assert(source.includes("const VERSION='3.2.0'"),'V3.2 version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=29'),'schema29 missing');
for(const marker of ['V32_EQUIPMENT_CATALOG','equipmentInventory','artifactLoadout','forgingProf','refinement','warmth','natalArtifactId','useV32ArtifactActive','renderGear'])assert(source.includes(marker),`missing V3.2 marker ${marker}`);

function cleanHtml(html){return html.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'')}
function makeDom(seed=null){const dom=new JSDOM(cleanHtml(htmlRaw),{url:'http://example.test/',runScripts:'outside-only',pretendToBeVisual:true});dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});dom.window.scrollTo=()=>{};dom.window.console=console;if(seed!==null)dom.window.localStorage.setItem(SAVE_KEY,seed);dom.window.eval(source);return dom}
function loadState(obj){const d=makeDom(JSON.stringify(obj));d.window.document.getElementById('continueBtn').click();return d}
function fresh(){const d=makeDom(),api=d.window.__TAIXUAN_TEST__;api.newGame('V32回归');return {d,api}}
function stripV32(p){for(const k of ['equipmentInventory','artifactLoadout','forgingProf','forgingAttempts','forgingSuccesses','forgingFailures','natalArtifactId','artifactWarmSessions','artifactRepairs'])delete p[k]}

const {api}=fresh();assert(api,'test API missing');
for(const fn of ['v32CatalogSnapshot','forgeV32Item','bindV32Artifact','equipV32Artifact','refineV32Artifact','repairV32Artifact','warmV32Artifact','makeNatalV32Artifact','useV32ArtifactActive','v32ArtifactIncomingMultiplier','v32EquippedDamageMultiplier','ensureV32GearShape','syncV32GearState','startCombat','getCombat','getState','contentRegistrySnapshot'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);
let s=api.getState();assert.equal(s.version,'3.2.0');assert.equal(s.saveSchemaVersion,29);assert.equal(s.player.contentStateVersion,3);assert(s.player.equipmentInventory&&typeof s.player.equipmentInventory==='object');assert.equal(Object.keys(s.player.artifactLoadout).length,4);

const cat=api.v32CatalogSnapshot();assert.equal(cat.equipment,60);assert.equal(cat.artifacts,24);assert(cat.activeArtifacts>=12);assert(cat.buildPassives>=12);assert.deepEqual(cat.slots.base,['weapon','armor','charm']);assert.deepEqual(cat.slots.artifact,['assault','guard','support','natal']);
const reg=api.contentRegistrySnapshot();assert.equal(reg.registryVersion,3);assert.equal(reg.counts.manuals,28);assert.equal(reg.counts.spells,60);assert.equal(Object.values(reg.items).filter(x=>x.type==='equipment'||x.type==='artifact').length,60);assert.equal(Object.keys(reg.artifacts).length,24);

// schema28 -> 29 preserves the seven legacy gear records and old equipped slots.
const old=api.getState();old.version='3.1.0';old.saveSchemaVersion=28;old.player.contentStateVersion=2;old.player.realmIndex=23;old.player.gearOwned=['qinggang','xuantie','juling','danxia','xuangui','yuanshen','taixu'];old.player.gearOwnedIds=['item-gear-qinggang','item-gear-xuantie','item-gear-juling','item-gear-danxia','item-gear-xuangui','item-gear-yuanshen','item-gear-taixu'];old.player.artifactOwnedIds=['artifact-danxia','artifact-xuangui','artifact-yuanshen','artifact-taixu'];old.player.equipped={weapon:'taixu',armor:'xuangui',charm:'yuanshen'};old.player.equippedItemIds={weapon:'item-gear-taixu',armor:'item-gear-xuangui',charm:'item-gear-yuanshen'};stripV32(old.player);
const od=loadState(old),oa=od.window.__TAIXUAN_TEST__,os=oa.getState();assert.equal(os.version,'3.2.0');assert.equal(os.saveSchemaVersion,29);for(const id of old.player.gearOwnedIds)assert(os.player.equipmentInventory[id],`legacy item lost: ${id}`);for(const id of ['item-gear-danxia','item-gear-xuangui','item-gear-yuanshen','item-gear-taixu'])assert.equal(os.player.equipmentInventory[id].bound,true,`legacy artifact not bound: ${id}`);assert.equal(os.player.equippedItemIds.weapon,'item-gear-taixu');assert.equal(os.player.equippedItemIds.armor,'item-gear-xuangui');assert.equal(os.player.equippedItemIds.charm,'item-gear-yuanshen');

// Base equipment forging has quality fluctuation and can be equipped without creating an artifact.
assert.equal(oa.forgeV32Item('item-v32-qingmu-sword',true,'perfect'),'perfect');let st=oa.getState();assert.equal(st.player.equipmentInventory['item-v32-qingmu-sword'].grade,'perfect');assert(!st.player.equipmentInventory['item-v32-qingmu-sword'].bound);assert(oa.equipGear('item-v32-qingmu-sword'));assert.equal(oa.getState().player.equippedItemIds.weapon,'item-v32-qingmu-sword');

// A real artifact must be forged, bound, loaded, refined and warmed before natal conversion.
const aid='item-v32-sevenstar-swordcase';assert.equal(oa.forgeV32Item(aid,true,'superior'),'superior');assert.equal(oa.bindV32Artifact(aid,true),'ok');assert(oa.equipV32Artifact(aid));assert.equal(oa.refineV32Artifact(aid,'success'),'success');assert.equal(oa.refineV32Artifact(aid,'success'),'success');assert.equal(oa.refineV32Artifact(aid,'success'),'success');assert.equal(oa.warmV32Artifact(aid,true),10);assert.equal(oa.warmV32Artifact(aid,true),10);st=oa.getState();assert.equal(st.player.equipmentInventory[aid].refinement,3);assert.equal(st.player.equipmentInventory[aid].warmth,20);assert.equal(oa.makeNatalV32Artifact(aid,true),'ok');st=oa.getState();assert.equal(st.player.natalArtifactId,aid);assert.equal(st.player.artifactLoadout.natal,aid);assert.equal(st.player.equipmentInventory[aid].natal,true);

// Major refinement failure damages the artifact; damaged artifact is unusable until repaired.
assert.equal(oa.refineV32Artifact(aid,'damage'),'damage');assert.equal(oa.getState().player.equipmentInventory[aid].damaged,true);oa.startCombat('玄阴鬼将');let cb=oa.getCombat();assert(cb,'combat missing');assert.equal(oa.useV32ArtifactActive(aid,cb.enemy),false,'damaged artifact should not activate');assert.equal(oa.repairV32Artifact(aid,true),'ok');assert.equal(oa.getState().player.equipmentInventory[aid].damaged,false);

// Artifact active ability is in real combat and owns an independent cooldown.
oa.startCombat('玄阴鬼将');cb=oa.getCombat();const enemyBefore=cb.enemyHp;assert.equal(oa.useV32ArtifactActive(aid,cb.enemy),true);cb=oa.getCombat();assert(cb.enemyHp<enemyBefore,'artifact active did no damage');assert(Object.keys(cb.artifactCooldowns||{}).length>0,'artifact cooldown not set');

// Guard artifacts contribute build-level mitigation, not description-only stats.
const guard='item-v32-watercurtain-umbrella';assert.equal(oa.forgeV32Item(guard,true,'fine'),'fine');assert.equal(oa.bindV32Artifact(guard,true),'ok');assert(oa.equipV32Artifact(guard));assert(oa.v32ArtifactIncomingMultiplier()<1,'guard artifact passive mitigation missing');

// V3.1 systems and old world systems are still present.
for(const fn of ['v31CatalogSnapshot','learnV31Manual','learnV31Spell','pastLifeInfo','npcConsequenceInfo','sectLifeInfo'])assert.equal(typeof oa[fn],'function',`V3.1/V2.9 function lost: ${fn}`);assert.equal(oa.v31CatalogSnapshot().manuals.length,28);assert.equal(oa.v31CatalogSnapshot().spells.length,60);assert.equal(oa.realmBalance().length,26);

// Save/reload keeps refinement, warmth, binding, natal and loadout state.
const saved=oa.getState();const rd=loadState(saved),ra=rd.window.__TAIXUAN_TEST__,rs=ra.getState();assert.equal(rs.player.equipmentInventory[aid].refinement,3);assert.equal(rs.player.equipmentInventory[aid].warmth,20);assert.equal(rs.player.equipmentInventory[aid].bound,true);assert.equal(rs.player.equipmentInventory[aid].natal,true);assert.equal(rs.player.natalArtifactId,aid);assert.equal(rs.player.artifactLoadout.natal,aid);

// Future schema30 is protected from overwrite.
const future=ra.getState();future.saveSchemaVersion=30;future.version='future-v32';const futureRaw=JSON.stringify(future);const fd=makeDom(futureRaw);fd.window.document.getElementById('continueBtn').click();assert.equal(fd.window.localStorage.getItem(SAVE_KEY),futureRaw,'future schema was overwritten');assert.equal(fd.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded');

console.log('V32_REGRESSION_PASS',JSON.stringify({version:'3.2.0',schema:29,equipment:60,trueArtifacts:24,activeArtifacts:cat.activeArtifacts,buildPassives:cat.buildPassives,legacySevenPreserved:true,qualityForging:true,binding:true,refinement:true,damageRepair:true,warmth:true,natal:true,artifactCombat:true,artifactCooldown:true,buildMitigation:true,v31Preserved:true,futureSaveProtected:true}));
