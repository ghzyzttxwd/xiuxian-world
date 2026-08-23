import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v30.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';

assert(source.includes("const VERSION='3.0.0'"),'V3.0 gameplay version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=27'),'schema 27 missing');
assert(!source.includes('天道酬勤'),'removed cultivation cheat text returned');
for(const marker of ['CONTENT_STATE_VERSION','MANUAL_ID_BY_NAME','SPELL_ID_BY_NAME','MATERIAL_REGISTRY','STATUS_REGISTRY','ENEMY_ID_BY_NAME','dropTableRegistry','syncStableContentState','ensureContentStateShape','skillCooldownRemaining','applyCombatStatus','artifactPassiveEffects','pastLifeBonds','simulateNpcFeud'])assert(source.includes(marker),`V3.0 marker missing: ${marker}`);

function cleanHtml(html){return html.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'')}
function makeDom(seed=null){const dom=new JSDOM(cleanHtml(htmlRaw),{url:'http://example.test/',runScripts:'outside-only',pretendToBeVisual:true});dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});dom.window.scrollTo=()=>{};dom.window.console=console;if(seed!==null)dom.window.localStorage.setItem(SAVE_KEY,seed);dom.window.eval(source);return dom}
function loadState(obj){const d=makeDom(JSON.stringify(obj));d.window.document.getElementById('continueBtn').click();return d}
function baseState(){const d=makeDom();const api=d.window.__TAIXUAN_TEST__;api.newGame('V30回归');return api.getState()}
function deleteStableFields(p){for(const k of ['contentStateVersion','realmId','regionId','manualId','spellProficiencyById','materialCountsById','itemCountsById','gearOwnedIds','equippedItemIds','artifactOwnedIds'])delete p[k]}

const dom=makeDom(),api=dom.window.__TAIXUAN_TEST__;
assert(api,'test API missing');
for(const fn of ['newGame','getState','contentRegistrySnapshot','ensureContentStateShape','syncStableContentState','skillCooldownRemaining','setSkillCooldown','tickSkillCooldowns','applyCombatStatus','combatStatusTurns','tickCombatStatuses','artifactPassiveEffects','artifactActiveAbility','startCombat'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);

api.newGame('成长底座测试');let state=api.getState();
assert.equal(state.version,'3.0.0');assert.equal(state.saveSchemaVersion,27);assert.equal(state.player.contentStateVersion,1);assert.equal(state.player.realmId,'realm-mortal');assert.equal(state.player.regionId,'region-qingshi-village');assert.equal(state.player.manualId,'manual-basic-breathing');assert.equal(state.player.spellProficiencyById['spell-basic-melee'],0);assert.equal(state.player.materialCountsById['mat-spirit-stone'],3);assert.equal(state.player.materialCountsById['mat-spirit-herb'],1);assert(Array.isArray(state.player.gearOwnedIds));assert.equal(typeof state.player.equippedItemIds,'object');assert(Array.isArray(state.player.artifactOwnedIds));

const registry=api.contentRegistrySnapshot();
assert.equal(registry.registryVersion,1);assert.deepEqual(registry.counts,{manuals:9,spells:11,items:11,artifacts:4,materials:8,recipes:4,drops:29,enemies:29,realms:26,regions:12,statuses:7});
assert(registry.manuals['manual-danxia-golden']);assert.equal(registry.manuals['manual-danxia-golden'].name,'丹霞金章');assert.equal(registry.manuals['manual-danxia-golden'].qualityId,'xuan');
assert(registry.spells['spell-windstep']);assert.equal(registry.spells['spell-windstep'].category,'movement');assert.equal(registry.spells['spell-windstep'].cooldown,2);assert.deepEqual(registry.spells['spell-windstep'].statusIds,['status-evade']);
assert(registry.items['item-gear-taixu']);assert.equal(registry.items['item-gear-taixu'].legacyKey,'taixu');assert(registry.items['item-pill-soul']);
assert(registry.artifacts['artifact-taixu']);assert.equal(registry.artifacts['artifact-taixu'].itemId,'item-gear-taixu');assert.equal(registry.artifacts['artifact-taixu'].activeAbility,null);assert.equal(registry.artifacts['artifact-taixu'].passiveEffects.atk,95);assert.equal(registry.artifacts['artifact-taixu'].passiveEffects.spell,.22);
assert(registry.materials['mat-deification-essence']);assert.equal(registry.recipes['recipe-soul'].outputItemId,'item-pill-soul');
assert(registry.enemies['enemy-xuanyin-deification-remnant']);assert.equal(registry.enemies['enemy-xuanyin-deification-remnant'].name,'玄阴化神残魂');
assert(registry.drops['drop-xuanyin-deification-remnant']);assert.equal(registry.drops['drop-xuanyin-deification-remnant'].enemyId,'enemy-xuanyin-deification-remnant');assert(registry.drops['drop-xuanyin-deification-remnant'].entries.some(x=>x.materialId==='mat-deification-essence'));
assert.equal(registry.realms['realm-deification-late'].name,'化神后期');assert.equal(registry.regions['region-xuanyin-forbidden'].name,'玄阴禁地');
for(const group of ['manuals','spells','items','artifacts','materials','recipes','drops','enemies','realms','regions','statuses']){const keys=Object.keys(registry[group]);assert.equal(new Set(keys).size,keys.length,`${group} contains duplicate IDs`)}

// schema26 -> 27: preserve all old display-name fields while creating stable mirrors.
const old=baseState();old.version='2.9.0';old.saveSchemaVersion=26;Object.assign(old.player,{realmIndex:15,location:'古河遗迹',manual:'丹霞金章',manualProf:88,spells:{'基础拳脚':12,'金焰剑诀':33,'护体灵罡':7},spiritStones:77,herbs:9,beastMaterials:5,rareMaterials:3,relicFragments:4,coreEssence:2,nascentEssence:1,deificationEssence:0,healingPills:2,qiPills:3,goldenPills:1,soulPills:0,gearOwned:['danxia','juling'],equipped:{weapon:'danxia',armor:null,charm:'juling'}});deleteStableFields(old.player);
const od=loadState(old),oa=od.window.__TAIXUAN_TEST__,os=oa.getState();assert.equal(os.version,'3.0.0');assert.equal(os.saveSchemaVersion,27);assert.equal(os.player.manual,'丹霞金章');assert.equal(os.player.manualProf,88);assert.equal(os.player.spells['金焰剑诀'],33);assert.deepEqual(os.player.gearOwned,['danxia','juling']);assert.equal(os.player.equipped.weapon,'danxia');assert.equal(os.player.manualId,'manual-danxia-golden');assert.equal(os.player.realmId,'realm-golden-core-early');assert.equal(os.player.regionId,'region-ancient-river-ruins');assert.equal(os.player.spellProficiencyById['spell-golden-flame-sword'],33);assert.equal(os.player.materialCountsById['mat-spirit-stone'],77);assert.equal(os.player.materialCountsById['mat-core-essence'],2);assert.equal(os.player.itemCountsById['item-pill-healing'],2);assert.deepEqual(os.player.gearOwnedIds,['item-gear-danxia','item-gear-juling']);assert.equal(os.player.equippedItemIds.weapon,'item-gear-danxia');assert.equal(os.player.equippedItemIds.charm,'item-gear-juling');assert.deepEqual(os.player.artifactOwnedIds,['artifact-danxia']);

// Stable mirrors stay synchronized when legacy V2.9 gameplay fields change and load/save.
os.player.manual='太虚化神篇';os.player.realmIndex=23;os.player.location='玄阴禁地';os.player.spells['神念斩']=19;const sd=loadState(os),sa=sd.window.__TAIXUAN_TEST__,ss=sa.getState();assert.equal(ss.player.manualId,'manual-taixu-deification');assert.equal(ss.player.realmId,'realm-deification-early');assert.equal(ss.player.regionId,'region-xuanyin-forbidden');assert.equal(ss.player.spellProficiencyById['spell-divine-thought-slash'],19);

// Generic cooldown/status interfaces exist without changing legacy V2.9 combat balance yet.
api.startCombat('灰背野狼');assert.equal(api.skillCooldownRemaining('spell-windstep'),0);assert.equal(api.setSkillCooldown('spell-windstep'),2);assert.equal(api.skillCooldownRemaining('spell-windstep'),2);api.tickSkillCooldowns();assert.equal(api.skillCooldownRemaining('spell-windstep'),1);api.tickSkillCooldowns();assert.equal(api.skillCooldownRemaining('spell-windstep'),0);const st=api.applyCombatStatus('status-burn');assert(st&&st.turns===3);assert.equal(api.combatStatusTurns('status-burn'),3);api.tickCombatStatuses();assert.equal(api.combatStatusTurns('status-burn'),2);
assert.equal(api.artifactActiveAbility('artifact-taixu'),null);const passive=api.artifactPassiveEffects('artifact-taixu');assert.equal(passive.atk,95);assert.equal(passive.spell,.22);

// Future schema28 must not load or overwrite.
const future={...old,saveSchemaVersion:28,version:'future-v30'};const futureRaw=JSON.stringify(future);const fd=makeDom(futureRaw);fd.window.document.getElementById('continueBtn').click();assert.equal(fd.window.localStorage.getItem(SAVE_KEY),futureRaw,'future schema was overwritten');assert.equal(fd.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded');

// V2.9 deep systems are still present.
assert.equal(typeof api.pastLifeInfo,'function');assert.equal(typeof api.npcConsequenceInfo,'function');assert.equal(typeof api.sectLifeInfo,'function');assert.equal(api.realmBalance().length,26);

console.log('V30_REGRESSION_PASS',JSON.stringify({version:'3.0.0',schema:27,stableIds:true,registries:true,legacyMigration:true,legacyContentPreserved:true,cooldowns:true,statuses:true,artifactInterface:true,dropTables:true,v29SystemsPreserved:true,futureSaveProtected:true}));
