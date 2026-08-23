import fs from 'fs';
import assert from 'assert';
import { JSDOM } from 'jsdom';

const INDEX_PATH = process.env.INDEX_PATH || 'index.html';
const GAME_PATH = process.env.GAME_PATH || 'src/game-v13.js';
const htmlRaw = fs.readFileSync(INDEX_PATH, 'utf8');
const source = fs.readFileSync(GAME_PATH, 'utf8');

const featureMarkers = {
  combat: ['battleWins', 'combatAction'],
  sect: ['sectContribution', 'renderSect'],
  market: ['marketIndex', 'marketPrices'],
  alchemy: ['alchemyProf', 'brewAlchemy'],
  gear: ['beastMaterials', 'GEAR_ITEMS'],
  social: ['giftNPC', 'processSocialEvents'],
  breakthrough: ['attemptBreakthrough', 'breakthroughPity'],
  dwelling: ['renderDwelling', 'retreatSevenDays'],
  reincarnation: ['reincarnate', 'legacyGainThisLife'],
  secretRealm: ['updateSecretRealm', 'renderSecretRealm'],
  factionWar: ['updateFactionConflict', 'joinFactionWar', 'resolveFactionWar'],
};
for (const [system, markers] of Object.entries(featureMarkers)) {
  for (const marker of markers) assert(source.includes(marker), `${system} marker missing: ${marker}`);
}
assert(source.includes("const VERSION='1.3.0'"), 'consolidated gameplay version is not V1.3.0');
assert(source.includes("const SAVE_KEY='xiuxian_world_v02'"), 'legacy save key was changed');

function cleanHtml(html) {
  return html.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i, '');
}

function makeDom(seedSave = null) {
  const dom = new JSDOM(cleanHtml(htmlRaw), {
    url: 'https://example.test/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  dom.window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  Object.defineProperty(dom.window.navigator, 'serviceWorker', { value: undefined, configurable: true });
  dom.window.console = console;
  if (seedSave !== null) dom.window.localStorage.setItem('xiuxian_world_v02', seedSave);
  dom.window.eval(source);
  return dom;
}

const dom = makeDom();
const api = dom.window.__TAIXUAN_TEST__;
assert(api, 'test API missing');
for (const fn of ['newGame', 'getState', 'startCombat', 'getCombat', 'combatAction']) {
  assert.equal(typeof api[fn], 'function', `test API missing function: ${fn}`);
}

api.newGame('V14回归');
let state = api.getState();
assert.equal(state.version, '1.3.0');
assert.equal(state.player.sect, '散修');
assert.equal(state.player.battleWins, 0);
assert.equal(state.player.alchemyProf, 0);
assert.equal(state.player.beastMaterials, 0);
assert.equal(state.player.breakthroughAttempts, 0);
assert.equal(state.player.dwellingTier, 0);
assert.equal(state.player.secretRealmClears, 0);
assert(state.legacy && state.legacy.cycles === 0, 'legacy state missing');
assert(state.world && state.world.secretRealmCount === 0, 'secret realm world state missing');
assert.equal(state.world.factionClashes, 0);

for (const id of ['sectInfo', 'marketInfo', 'alchemyInfo', 'gearInfo', 'dwellingInfo', 'legacyInfo']) {
  assert(dom.window.document.getElementById(id), `UI anchor missing: ${id}`);
}
assert(dom.window.document.getElementById('secretRealmPanel'), 'secret realm panel was not rendered');
assert(dom.window.document.getElementById('factionWarPanel'), 'faction war panel was not rendered');

const timeBefore = JSON.stringify(state.time);
const cultivate = dom.window.document.querySelector('[data-action="cultivate"]');
assert(cultivate, 'cultivate action missing');
cultivate.click();
state = api.getState();
assert.notEqual(JSON.stringify(state.time), timeBefore, 'time did not advance after cultivation');
assert(state.player.manualProf > 0, 'cultivation did not increase manual proficiency');

api.startCombat('灰背野狼');
for (let i = 0; i < 30 && api.getCombat(); i++) api.combatAction('attack');
state = api.getState();
assert(state.player.battleWins >= 1, 'weak combat did not resolve as a win');
assert(state.player.kills >= 1, 'kill stat did not increase');

// The test API intentionally does not auto-save newGame(). Exercise the real
// save button before deriving a legacy-shaped save for migration testing.
const saveBtn = dom.window.document.getElementById('saveBtn');
assert(saveBtn, 'save button missing');
saveBtn.click();
let saved = dom.window.localStorage.getItem('xiuxian_world_v02');
assert(saved, 'manual save did not write xiuxian_world_v02');
const old = JSON.parse(saved);
old.version = '0.2.0';
for (const key of [
  'injury','battleWins','battleLosses','kills','sect','sectRank','sectContribution','sectTasksCompleted','sectTask','sectLastStipend',
  'healingPills','tradeVolume','alchemyProf','qiPills','alchemyBatches','beastMaterials','gearOwned','equipped','breakthroughPity','breakthroughAttempts',
  'dwellingTier','dwellingLocation','herbPlotReady','herbPlotSeeded','retreatSessions','birthDay','secretRealmClears','relicFragments'
]) delete old.player[key];
delete old.legacy;
for (const key of ['secretRealm','nextSecretRealmDay','secretRealmCount','factionTension','factionClashes','lastFactionDay','warWinsQingyun','warWinsBlood']) delete old.world[key];
for (const npc of old.npcs || []) {
  for (const key of ['lastGiftDay','lastDaoDay','lastSparDay','lastHelpMonth','lastRevengeDay']) delete npc[key];
}

const migratedDom = makeDom(JSON.stringify(old));
const continueBtn = migratedDom.window.document.getElementById('continueBtn');
assert(continueBtn, 'continue button missing');
continueBtn.click();
const migratedApi = migratedDom.window.__TAIXUAN_TEST__;
const migrated = migratedApi.getState();
assert.equal(migrated.version, '1.3.0', 'V0.2 save did not migrate to V1.3');
assert.equal(migrated.player.battleWins, 0, 'combat migration failed');
assert.equal(migrated.player.sectContribution, 0, 'sect migration failed');
assert.equal(migrated.player.alchemyProf, 0, 'alchemy migration failed');
assert(Array.isArray(migrated.player.gearOwned), 'gear migration failed');
assert.equal(migrated.player.breakthroughAttempts, 0, 'breakthrough migration failed');
assert.equal(migrated.player.dwellingTier, 0, 'dwelling migration failed');
assert(migrated.legacy && migrated.legacy.cycles === 0, 'legacy migration failed');
assert.equal(migrated.player.secretRealmClears, 0, 'secret realm migration failed');
assert.equal(migrated.world.factionClashes, 0, 'faction war migration failed');
assert((migrated.npcs || []).every(n => n.lastGiftDay != null && n.lastRevengeDay != null), 'NPC social migration failed');

console.log('V14_REGRESSION_PASS', JSON.stringify({
  version: migrated.version,
  systems: Object.keys(featureMarkers),
  oldSaveMigration: true,
  combatWins: state.player.battleWins,
}));
