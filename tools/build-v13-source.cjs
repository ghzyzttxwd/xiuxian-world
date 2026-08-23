const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

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

const chunks = [];
for (let i = 1; i <= 24; i++) {
  const file = path.join('bundle2', `c${String(i).padStart(2, '0')}.b64`);
  if (!fs.existsSync(file)) fail(`missing base chunk ${file}`);
  chunks.push(fs.readFileSync(file, 'utf8').trim());
}

let src = Buffer.from(chunks.join(''), 'base64').toString('utf8');
if (!src.includes("const VERSION='0.2.0'")) fail('decoded base is not V0.2');
if (!src.includes("const SAVE_KEY='xiuxian_world_v02'")) fail('legacy save key changed unexpectedly');

// Patch files were historically written for the browser and only need a window
// object while their transformation functions are registered. The game itself is
// not executed during this build step.
global.window = globalThis;

for (const [file, globalName, expectedVersion, build] of PATCHES) {
  if (!fs.existsSync(file)) fail(`missing patch ${file}`);
  vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
  const patch = globalThis[globalName];
  if (typeof patch !== 'function') fail(`${globalName} was not registered by ${file}`);
  src = patch(src);
  if (!src.includes(`const VERSION='${expectedVersion}'`)) {
    fail(`${file} did not produce V${expectedVersion}`);
  }
  delete globalThis[globalName];
  process.stdout.write(`applied ${file} (${build}) -> V${expectedVersion}\n`);
}

const required = [
  'battleWins', 'renderSect', 'marketPrices', 'brewAlchemy', 'GEAR_ITEMS',
  'giftNPC', 'attemptBreakthrough', 'renderDwelling', 'reincarnate',
  'updateSecretRealm', 'renderSecretRealm', 'updateFactionConflict',
  'joinFactionWar', 'resolveFactionWar', 'renderFactionConflict',
];
for (const marker of required) {
  if (!src.includes(marker)) fail(`final V1.3 source missing marker: ${marker}`);
}

fs.mkdirSync('src', { recursive: true });
fs.writeFileSync('src/game-v13.js', src, 'utf8');
const sha256 = crypto.createHash('sha256').update(src).digest('hex');
const report = {
  status: 'PASS',
  engineering_release: '1.4.0',
  gameplay_version: '1.3.0',
  build: '1401',
  source: 'src/game-v13.js',
  source_sha256: sha256,
  source_bytes: Buffer.byteLength(src),
  base_chunks: 24,
  applied_patches: PATCHES.map(([file, , version, build]) => ({ file, version, build })),
  legacy_save_key_preserved: 'xiuxian_world_v02',
};
fs.writeFileSync('BUILD_V14_SOURCE.json', JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(`V1.3 consolidated source: ${report.source_bytes} bytes, sha256=${sha256}`);
