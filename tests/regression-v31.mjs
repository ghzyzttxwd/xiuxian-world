import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v31.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';

assert(source.includes("const VERSION='3.1.0'"),'V3.1 version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=28'),'schema28 missing');
for(const marker of ['V31_MANUAL_CATALOG','V31_SPELL_CATALOG','manualLibraryIds','manualProficiencyById','activeSkillIds','passiveSkillId','useV31CombatSkill','renderV31GrowthPanel','status-shield','status-bind'])assert(source.includes(marker),`missing V3.1 marker ${marker}`);

function cleanHtml(html){return html.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'')}
function makeDom(seed=null){const dom=new JSDOM(cleanHtml(htmlRaw),{url:'http://example.test/',runScripts:'outside-only',pretendToBeVisual:true});dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});dom.window.scrollTo=()=>{};dom.window.console=console;if(seed!==null)dom.window.localStorage.setItem(SAVE_KEY,seed);dom.window.eval(source);return dom}
function loadState(obj){const d=makeDom(JSON.stringify(obj));d.window.document.getElementById('continueBtn').click();return d}
function fresh(){const d=makeDom(),api=d.window.__TAIXUAN_TEST__;api.newGame('V31回归');return {d,api}}
function stripV31(p){for(const k of ['manualLibraryIds','manualProficiencyById','activeSkillIds','passiveSkillId','skillLoadoutVersion'])delete p[k]}

const {d,api}=fresh();assert(api,'test API missing');
for(const fn of ['v31CatalogSnapshot','learnV31Manual','switchV31Manual','learnV31Spell','equipV31Skill','equipV31Passive','v31CurrentManualEffects','v31BreakthroughBonus','useV31CombatSkill','startCombat','combatAction','contentRegistrySnapshot','maxHp','maxQi'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);
let s=api.getState();
assert.equal(s.version,'3.1.0');assert.equal(s.saveSchemaVersion,28);assert.equal(s.player.contentStateVersion,2);assert.deepEqual(s.player.manualLibraryIds,['manual-basic-breathing']);assert.equal(s.player.manualProficiencyById['manual-basic-breathing'],0);assert.equal(s.player.activeSkillIds.length,6);assert.equal(s.player.passiveSkillId,null);assert.equal(s.player.skillLoadoutVersion,1);

const reg=api.contentRegistrySnapshot();
assert.equal(reg.registryVersion,2);assert.equal(reg.counts.manuals,28);assert.equal(reg.counts.spells,60);assert.equal(reg.counts.statuses,14);
const cat=api.v31CatalogSnapshot();assert.equal(cat.manuals.length,28);assert.equal(cat.spells.length,60);assert.equal(new Set(cat.manuals.map(x=>x.id)).size,28);assert.equal(new Set(cat.spells.map(x=>x.id)).size,60);assert.equal(cat.spells.filter(x=>x.category==='passive').length,5);
const cats=new Set(cat.spells.map(x=>x.category));for(const c of ['single-target','multi-hit','damage-over-time','shield','movement','escape','control','seal','healing','restore','debuff','soul-attack','counter','laststand','area','execute','drain','passive'])assert(cats.has(c),`category not covered: ${c}`);
for(const path of ['sword','flame','body','spirit'])assert(cat.spells.filter(x=>x.path===path).length>=9,`${path} skill depth insufficient`);
for(const row of cat.manuals){assert(row.id&&row.name&&Array.isArray(row.sources)&&row.sources.length>0);assert(row.effects&&typeof row.effects==='object')}
for(const row of cat.spells){assert(row.id&&row.name&&Array.isArray(row.sources)&&row.sources.length>0);assert(row.effect&&typeof row.effect==='object')}

// schema27 -> 28 preserves current manual/spells while creating V3.1 library/loadout fields.
const old=api.getState();old.version='3.0.0';old.saveSchemaVersion=27;old.player.contentStateVersion=1;old.player.realmIndex=15;old.player.location='青云山';old.player.manual='青云剑典';old.player.manualProf=321;old.player.spells={'基础拳脚':12,'火弹术':44,'御风步':9,'御剑连斩':27};stripV31(old.player);
const od=loadState(old),oa=od.window.__TAIXUAN_TEST__,os=oa.getState();assert.equal(os.version,'3.1.0');assert.equal(os.saveSchemaVersion,28);assert(os.player.manualLibraryIds.includes('manual-qingyun-sword'));assert.equal(os.player.manualProficiencyById['manual-qingyun-sword'],321);assert(os.player.activeSkillIds.includes('spell-firebolt'));assert(os.player.activeSkillIds.includes('spell-windstep'));assert(os.player.activeSkillIds.includes('spell-sword-flurry'));assert.equal(os.player.activeSkillIds.length,6);

// Each manual keeps its own proficiency when switching.
assert.equal(oa.learnV31Manual('manual-five-elements-return',true),'learned');assert(oa.switchV31Manual('manual-five-elements-return',true));oa.action('cultivate');const trained=oa.getState().player.manualProf;assert(trained>0);assert(oa.switchV31Manual('manual-qingyun-sword',true));assert.equal(oa.getState().player.manualProf,321);assert(oa.switchV31Manual('manual-five-elements-return',true));assert.equal(oa.getState().player.manualProf,trained);

// Manual effects are real, not description-only.
assert.equal(oa.learnV31Manual('manual-vajra-body',true),'learned');const hpBefore=oa.maxHp();assert(oa.switchV31Manual('manual-vajra-body',true));const hpAfter=oa.maxHp();assert(hpAfter>hpBefore,'body manual did not increase max HP');assert(oa.v31CurrentManualEffects().incoming<0,'body manual missing damage reduction');
assert.equal(oa.learnV31Manual('manual-myriad-deification',true),'learned');assert(oa.switchV31Manual('manual-myriad-deification',true));assert(oa.v31BreakthroughBonus()>0,'high manual breakthrough bonus not active');

// Six active slots are enforced, and passive is separate.
for(const id of ['spell-spirit-needle','spell-water-arrow','spell-wind-blade','spell-earth-armor','spell-spring-heal','spell-gather-spirit','spell-spirit-binding-rope'])assert(['learned','known'].includes(oa.learnV31Spell(id,true)));
const six=['spell-spirit-needle','spell-water-arrow','spell-wind-blade','spell-earth-armor','spell-spring-heal','spell-gather-spirit'];six.forEach((id,i)=>assert(oa.equipV31Skill(i,id)));assert.equal(oa.getState().player.activeSkillIds.filter(Boolean).length,6);assert(oa.equipV31Skill(5,'spell-spirit-binding-rope'));assert.equal(oa.getState().player.activeSkillIds[5],'spell-spirit-binding-rope');assert(!oa.getState().player.activeSkillIds.includes('spell-gather-spirit'));
assert.equal(oa.learnV31Spell('spell-five-cycle-passive',true),'learned');assert(oa.equipV31Passive('spell-five-cycle-passive'));assert.equal(oa.getState().player.passiveSkillId,'spell-five-cycle-passive');assert.equal(oa.getState().player.activeSkillIds.length,6);

// Generic combat: shield consumes damage and cooldown is real.
assert(oa.equipV31Skill(0,'spell-earth-armor'));oa.startCombat('灰背野狼');let cb=oa.getCombat();const beforeHp=cb.playerHp;oa.combatAction('skill:spell-earth-armor');cb=oa.getCombat();assert(cb,'combat ended unexpectedly');assert(cb.v31Shield>=0);assert(cb.playerHp>=beforeHp-15,'shield did not mitigate low-tier hit');assert(oa.skillCooldownRemaining('spell-earth-armor')>0,'shield cooldown not set');

// Control consumes enemy retaliation for one turn.
assert(oa.equipV31Skill(0,'spell-spirit-binding-rope'));oa.startCombat('灰背野狼');cb=oa.getCombat();const hp0=cb.playerHp;oa.combatAction('skill:spell-spirit-binding-rope');cb=oa.getCombat();assert(cb,'control combat ended unexpectedly');assert.equal(cb.playerHp,hp0,'binding control failed to skip retaliation');assert(oa.skillCooldownRemaining('spell-spirit-binding-rope')>0);

// Real acquisition gate: wrong path blocks a sword skill even at correct place/realm.
const gate=oa.getState();gate.player.realmIndex=15;gate.player.location='青云山';gate.player.daoPath='flame';gate.player.spiritStones=999;gate.player.insight=99;gate.player.relicFragments=99;gate.player.rareMaterials=99;const gd=loadState(gate),ga=gd.window.__TAIXUAN_TEST__;assert.equal(ga.learnV31Spell('spell-sword-qi-slash',false),'path');
const gate2=ga.getState();gate2.player.daoPath='sword';const gd2=loadState(gate2),ga2=gd2.window.__TAIXUAN_TEST__;const stonesBefore=ga2.getState().player.spiritStones;assert.equal(ga2.learnV31Spell('spell-sword-qi-slash',false),'learned');assert(ga2.getState().player.spiritStones<stonesBefore,'learning did not consume resources');

// Future schema29 remains protected from overwrite.
const future=ga2.getState();future.saveSchemaVersion=29;future.version='future-v31';const futureRaw=JSON.stringify(future);const fd=makeDom(futureRaw);fd.window.document.getElementById('continueBtn').click();assert.equal(fd.window.localStorage.getItem(SAVE_KEY),futureRaw,'future schema was overwritten');assert.equal(fd.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded');

// Deep V2.9/V3.0 systems still exist.
for(const fn of ['pastLifeInfo','npcConsequenceInfo','sectLifeInfo','contentRegistrySnapshot'])assert.equal(typeof api[fn],'function');assert.equal(api.realmBalance().length,26);

console.log('V31_REGRESSION_PASS',JSON.stringify({version:'3.1.0',schema:28,manuals:28,spells:60,manualLibrary:true,independentProficiency:true,activeSlots:6,passiveSlot:true,realAcquisition:true,shieldCombat:true,controlCombat:true,paths:true,v30Preserved:true,futureSaveProtected:true}));
