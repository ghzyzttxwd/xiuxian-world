const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const ENGINEERING_RELEASE = '1.4.1';
const BUILD = '1402';
const SAVE_SCHEMA_VERSION = 13;
const PATCHES = [
  ['v03-patch.js', '__TAIXUAN_PATCH_V03__', '0.3.0', '0301'],
  ['v04-patch.js', '__TAIXUAN_PATCH_V04__', '0.4.0', '0401'],
  ['v05-patch.js', '__TAIXUAN_PATCH_V05__', '0.5.0', '0501'],
  ['v06-patch.js', '__TAIXUAN_PATCH_V06__', '0.6.0', '0601'],
  ['v07-patch.js', '__TAIXUAN_PATCH_V07__', '0.7.0', '0701'],
  ['v08-patch.js', '__TAIXUAN_PATCH_V08__', '0.8.0', '0801'],
  ['v09-patch.js', '__TAIXUAN_PATCH_V09__', '0.9.0', '0901'],
  ['v10-patch.js', '__TAIXUAN_PATCH_V10__', '1.0.0', '1001'],
  ['v11-patch.js', '__TAIXUAN_PATCH_V11__', '1.1.0', '1104'],
  ['v12-patch.js', '__TAIXUAN_PATCH_V12__', '1.2.0', '1201'],
  ['v13-patch.js', '__TAIXUAN_PATCH_V13__', '1.3.0', '1301'],
];

function fail(message) {
  throw new Error(`[V1.4 source build] ${message}`);
}

function mustReplace(source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) fail(`engineering transform did not match: ${label}`);
  return next;
}

const chunks = [];
for (let i = 1; i <= 24; i++) {
  const file = path.join('bundle2', `c${String(i).padStart(2, '0')}.b64`);
  if (!fs.existsSync(file)) fail(`missing base chunk ${file}`);
  chunks.push(fs.readFileSync(file, 'utf8').trim());
}

let src = Buffer.from(chunks.join(''), 'base64').toString('utf8');
if (!src.includes("const VERSION='0.2.0'")) fail('decoded base is not V0.2');
if (!src.includes("const SAVE_KEY='xiuxian_world_v02'")) fail('legacy save key changed unexpectedly');

global.window = globalThis;
for (const [file, globalName, expectedVersion, build] of PATCHES) {
  if (!fs.existsSync(file)) fail(`missing patch ${file}`);
  vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
  const patch = globalThis[globalName];
  if (typeof patch !== 'function') fail(`${globalName} was not registered by ${file}`);
  src = patch(src);
  if (!src.includes(`const VERSION='${expectedVersion}'`)) fail(`${file} did not produce V${expectedVersion}`);
  delete globalThis[globalName];
  process.stdout.write(`applied ${file} (${build}) -> V${expectedVersion}\n`);
}

// V1.4 engineering transform: historical field backfills are converted into an
// explicit ordered save-schema pipeline. Gameplay VERSION intentionally remains 1.3.0.
src = mustReplace(
  src,
  "const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='1.3.0';",
  "const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='1.3.0'; const SAVE_SCHEMA_VERSION=13;",
  'save schema constant',
);
src = mustReplace(
  src,
  'state={version:VERSION,rng:seed,time:',
  'state={version:VERSION,saveSchemaVersion:SAVE_SCHEMA_VERSION,rng:seed,time:',
  'new save schema marker',
);

const migrationPipeline = String.raw`function ensureLegacyBaseShape(){
 if(!state||typeof state!=='object')throw new Error('存档格式无效');
 if(!state.player||!state.world||!state.time)throw new Error('存档缺少核心结构');
 if(!Array.isArray(state.npcs))state.npcs=[];if(!Array.isArray(state.personalLog))state.personalLog=[];if(!Array.isArray(state.worldLog))state.worldLog=[];if(!state.flags)state.flags={};if(!state.major)state.major={};
 if(!state.player.rootIndex&&state.player.rootIndex!==0)state.player.rootIndex=1;if(!state.player.manual)state.player.manual='基础吐纳诀';if(state.player.manualProf==null)state.player.manualProf=0;if(!state.player.spells)state.player.spells={'基础拳脚':0};if(state.player.diligence==null)state.player.diligence=0;if(state.player.insight==null)state.player.insight=0;if(state.player.hp==null)state.player.hp=maxHp();if(state.player.qi==null)state.player.qi=maxQi()
}
const SAVE_MIGRATIONS={
 3(){const p=state.player;if(p.injury==null)p.injury=0;if(p.battleWins==null)p.battleWins=0;if(p.battleLosses==null)p.battleLosses=0;if(p.kills==null)p.kills=0},
 4(){const p=state.player;if(p.sect==null){const joined=!!(state.major?.recruit?.participated&&((ROOTS[p.rootIndex]?.mult||0)>=1.25||p.realmIndex>=1));p.sect=joined?'青云宗':'散修';p.sectRank=joined?'外门弟子':'无'}if(p.sectRank==null)p.sectRank=p.sect==='青云宗'?'外门弟子':'无';if(p.sectContribution==null)p.sectContribution=0;if(p.sectTasksCompleted==null)p.sectTasksCompleted=0;if(p.sectTask==null)p.sectTask=null;if(p.sectLastStipend==null)p.sectLastStipend=0},
 5(){const p=state.player;if(p.healingPills==null)p.healingPills=0;if(p.tradeVolume==null)p.tradeVolume=0},
 6(){const p=state.player;if(p.alchemyProf==null)p.alchemyProf=0;if(p.qiPills==null)p.qiPills=0;if(p.alchemyBatches==null)p.alchemyBatches=0},
 7(){const p=state.player;if(p.beastMaterials==null)p.beastMaterials=0;if(!Array.isArray(p.gearOwned))p.gearOwned=[];if(!p.equipped)p.equipped={weapon:null,armor:null,charm:null};for(const k of ['weapon','armor','charm'])if(!(k in p.equipped))p.equipped[k]=null},
 8(){for(const n of state.npcs){if(n.relation==null)n.relation=0;if(n.grudge==null)n.grudge=0;if(n.known==null)n.known=false;if(n.lastGiftDay==null)n.lastGiftDay=0;if(n.lastDaoDay==null)n.lastDaoDay=0;if(n.lastSparDay==null)n.lastSparDay=0;if(n.lastHelpMonth==null)n.lastHelpMonth=0;if(n.lastRevengeDay==null)n.lastRevengeDay=0}},
 9(){const p=state.player;if(p.breakthroughPity==null)p.breakthroughPity=0;if(p.breakthroughAttempts==null)p.breakthroughAttempts=0;if(p.progress>realm().need)p.progress=realm().need},
 10(){const p=state.player;if(p.dwellingTier==null)p.dwellingTier=0;if(p.dwellingLocation===undefined)p.dwellingLocation=null;if(p.herbPlotReady==null)p.herbPlotReady=0;if(p.herbPlotSeeded==null)p.herbPlotSeeded=false;if(p.retreatSessions==null)p.retreatSessions=0},
 11(){const p=state.player;if(p.birthDay==null)p.birthDay=1;if(!state.legacy)state.legacy={cycles:0,merit:0,bestRealm:0,totalDeaths:0};if(state.legacy.cycles==null)state.legacy.cycles=0;if(state.legacy.merit==null)state.legacy.merit=0;if(state.legacy.bestRealm==null)state.legacy.bestRealm=0;if(state.legacy.totalDeaths==null)state.legacy.totalDeaths=0},
 12(){const p=state.player,w=state.world;if(p.secretRealmClears==null)p.secretRealmClears=0;if(p.relicFragments==null)p.relicFragments=0;if(w.secretRealm===undefined)w.secretRealm=null;if(w.nextSecretRealmDay==null)w.nextSecretRealmDay=dayNumber()+20;if(w.secretRealmCount==null)w.secretRealmCount=0},
 13(){const w=state.world;if(w.factionTension==null)w.factionTension=24;if(w.factionClashes==null)w.factionClashes=0;if(w.lastFactionDay==null)w.lastFactionDay=0;if(w.warWinsQingyun==null)w.warWinsQingyun=0;if(w.warWinsBlood==null)w.warWinsBlood=0}
};
function validateCurrentSaveSchema(){
 const p=state.player,w=state.world,required=[['player.injury',p.injury],['player.sect',p.sect],['player.alchemyProf',p.alchemyProf],['player.gearOwned',p.gearOwned],['player.breakthroughAttempts',p.breakthroughAttempts],['player.dwellingTier',p.dwellingTier],['player.birthDay',p.birthDay],['player.secretRealmClears',p.secretRealmClears],['world.secretRealmCount',w.secretRealmCount],['world.factionClashes',w.factionClashes],['legacy',state.legacy]];
 const missing=required.filter(([,v])=>v==null).map(([k])=>k);if(missing.length)throw new Error('存档迁移后字段缺失：'+missing.join(', '));if(!Array.isArray(p.gearOwned))throw new Error('存档迁移后 gearOwned 格式无效')
}
function migrateSaveState(){
 let schema=state.saveSchemaVersion;if(schema==null)schema=2;if(!Number.isInteger(schema)||schema<2)throw new Error('存档版本号无效');if(schema>SAVE_SCHEMA_VERSION)throw new Error('此存档来自更高版本，当前客户端不会覆盖它');
 for(let next=schema+1;next<=SAVE_SCHEMA_VERSION;next++){const migrate=SAVE_MIGRATIONS[next];if(typeof migrate!=='function')throw new Error('缺少存档迁移步骤：'+next);migrate();state.saveSchemaVersion=next}
 if(state.saveSchemaVersion==null)state.saveSchemaVersion=SAVE_SCHEMA_VERSION;validateCurrentSaveSchema();state.version=VERSION
}
function normalizeLoaded(){ensureLegacyBaseShape();migrateSaveState()}
function save(){`;

src = mustReplace(src, /function normalizeLoaded\(\)\{[\s\S]*?\n\}\nfunction save\(\)\{/, migrationPipeline, 'explicit migration pipeline');
src = mustReplace(
  src,
  "function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true}catch(e){console.error(e);return false}}",
  "function save(){try{if(!state)return false;state.version=VERSION;state.saveSchemaVersion=SAVE_SCHEMA_VERSION;localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true}catch(e){console.error(e);return false}}",
  'save schema stamp',
);
src = mustReplace(
  src,
  "function load(){try{const raw=localStorage.getItem(SAVE_KEY)||localStorage.getItem(OLD_KEY);if(!raw)return false;state=JSON.parse(raw);normalizeLoaded();save();return true}catch(e){console.error(e);return false}}",
  "function load(){const raw=localStorage.getItem(SAVE_KEY)||localStorage.getItem(OLD_KEY);if(!raw)return false;try{state=JSON.parse(raw);normalizeLoaded();save();return true}catch(e){console.error(e);state=null;return false}}",
  'future schema safe load',
);

const required = [
  'battleWins', 'renderSect', 'marketPrices', 'brewAlchemy', 'GEAR_ITEMS',
  'giftNPC', 'attemptBreakthrough', 'renderDwelling', 'reincarnate',
  'updateSecretRealm', 'renderSecretRealm', 'updateFactionConflict',
  'joinFactionWar', 'resolveFactionWar', 'renderFactionConflict',
  'SAVE_SCHEMA_VERSION=13', 'SAVE_MIGRATIONS', 'migrateSaveState',
];
for (const marker of required) if (!src.includes(marker)) fail(`final source missing marker: ${marker}`);
if (src.includes('function normalizeLoaded(){\n if(!state.player.rootIndex')) fail('legacy monolithic normalization survived engineering transform');

fs.mkdirSync('src', { recursive: true });
fs.writeFileSync('src/game-v13.js', src, 'utf8');
const sha256 = crypto.createHash('sha256').update(src).digest('hex');
const report = {
  status: 'PASS',
  engineering_release: ENGINEERING_RELEASE,
  gameplay_version: '1.3.0',
  build: BUILD,
  milestone: 'save-schema-pipeline',
  source: 'src/game-v13.js',
  source_sha256: sha256,
  source_bytes: Buffer.byteLength(src),
  base_chunks: 24,
  applied_patches: PATCHES.map(([file, , version, build]) => ({ file, version, build })),
  legacy_save_key_preserved: 'xiuxian_world_v02',
  save_schema_version: SAVE_SCHEMA_VERSION,
  migration_steps: Array.from({ length: SAVE_SCHEMA_VERSION - 2 }, (_, i) => i + 3),
};
fs.writeFileSync('BUILD_V14_SOURCE.json', JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(`V1.4 runtime source: ${report.source_bytes} bytes, schema=${SAVE_SCHEMA_VERSION}, sha256=${sha256}`);
