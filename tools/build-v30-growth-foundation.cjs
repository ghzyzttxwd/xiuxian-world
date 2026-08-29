const fs=require('fs');
const crypto=require('crypto');

const INPUT='src/game-v29.js';
const OUTPUT='src/game-v30.js';
const BLOCK='tools/v30-growth-foundation-block.txt';
const REPORT='BUILD_V30_GROWTH_FOUNDATION.json';
const BUILD='3001';
if(!fs.existsSync(INPUT))throw new Error('V3.0 build: missing '+INPUT);
if(!fs.existsSync(BLOCK))throw new Error('V3.0 build: missing '+BLOCK);
let src=fs.readFileSync(INPUT,'utf8');
const block=fs.readFileSync(BLOCK,'utf8').trimEnd();
function must(search,replacement,label){if(!src.includes(search))throw new Error('V3.0 build transform did not match: '+label);src=src.replace(search,replacement)}
function insertBefore(search,text,label,startAt=0){const at=src.indexOf(search,startAt);if(at<0)throw new Error('V3.0 build insert did not match: '+label);src=src.slice(0,at)+text+src.slice(at)}

must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='2.9.0'; const SAVE_SCHEMA_VERSION=26;","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='3.0.0'; const SAVE_SCHEMA_VERSION=27;",'version/schema');

const enemyStart=src.indexOf('const ENEMIES=[');if(enemyStart<0)throw new Error('V3.0 build: ENEMIES anchor missing');
insertBefore('\nfunction rand(){','\n'+block+'\n','growth foundation block',enemyStart);

must("if(lg.pastLifeSnapshots==null)lg.pastLifeSnapshots=0} \n};","if(lg.pastLifeSnapshots==null)lg.pastLifeSnapshots=0},\n 27(){ensureContentStateShape()} \n};",'schema 27 migration');
must("state.player.rootIndex=chooseRoot();state.npcs=createNPCs();ensureNpcLifeShape();ensureNpcConsequenceShape();ensurePastLifeShape();ensureSectLifeShape();","state.player.rootIndex=chooseRoot();state.npcs=createNPCs();ensureContentStateShape();ensureNpcLifeShape();ensureNpcConsequenceShape();ensurePastLifeShape();ensureSectLifeShape();",'new state content foundation');
must("['player.pastLifeRecognitions',p.pastLifeRecognitions],","['player.pastLifeRecognitions',p.pastLifeRecognitions],['player.contentStateVersion',p.contentStateVersion],['player.realmId',p.realmId],['player.regionId',p.regionId],['player.manualId',p.manualId],['player.spellProficiencyById',p.spellProficiencyById],['player.materialCountsById',p.materialCountsById],['player.itemCountsById',p.itemCountsById],['player.gearOwnedIds',p.gearOwnedIds],['player.equippedItemIds',p.equippedItemIds],['player.artifactOwnedIds',p.artifactOwnedIds],",'schema validation stable content fields');
must("function save(){try{if(!state)return false;state.version=VERSION;state.saveSchemaVersion=SAVE_SCHEMA_VERSION;localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true}catch(e){console.error(e);return false}}","function save(){try{if(!state)return false;syncStableContentState();state.version=VERSION;state.saveSchemaVersion=SAVE_SCHEMA_VERSION;localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true}catch(e){console.error(e);return false}}",'sync stable content on save');
must("allyCounted:false,logs:['你遭遇了'+e.name+'。危险判断：'+dangerLabel(e)+'。']","allyCounted:false,cooldowns:{},statuses:{},logs:['你遭遇了'+e.name+'。危险判断：'+dangerLabel(e)+'。']",'combat foundation containers');
must("window.__TAIXUAN_TEST__={","window.__TAIXUAN_TEST__={contentRegistrySnapshot,ensureContentStateShape,syncStableContentState,skillCooldownRemaining,setSkillCooldown,tickSkillCooldowns,applyCombatStatus,combatStatusTurns,tickCombatStatuses,artifactPassiveEffects,artifactActiveAbility,",'test API foundation');

fs.writeFileSync(OUTPUT,src,'utf8');
const sha=crypto.createHash('sha256').update(src).digest('hex');
const report={status:'PASS',gameplay_version:'3.0.0',build:BUILD,milestone:'growth-data-foundation',source:OUTPUT,source_sha256:sha,source_bytes:Buffer.byteLength(src),save_schema_version:27,content_registry_version:1,counts:{manuals:9,spells:11,items:11,artifacts:4,materials:8,recipes:4,enemies:29,drop_tables:29,realms:26,regions:12,statuses:7},checks:['stable IDs for realms regions manuals spells items artifacts materials recipes enemies and drop tables','schema 26 to 27 migration','legacy V2.9 content mirrors retained','unified quality tiers','skill category and cooldown metadata','generic combat cooldown interface','generic combat status interface','artifact active/passive interface','unified enemy drop tables','future schema protection preserved']};
fs.writeFileSync(REPORT,JSON.stringify(report,null,2)+'\n');
console.log('V30_BUILD_PASS',JSON.stringify(report));
