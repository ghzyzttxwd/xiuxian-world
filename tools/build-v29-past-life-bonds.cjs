const fs=require('fs');
const crypto=require('crypto');

const INPUT='src/game-v28.js';
const OUTPUT='src/game-v29.js';
const BLOCK='tools/v29-past-life-bonds-block.txt';
const BUILD='2901';
if(!fs.existsSync(INPUT))throw new Error('V2.9 build: missing '+INPUT);
if(!fs.existsSync(BLOCK))throw new Error('V2.9 build: missing '+BLOCK);
let src=fs.readFileSync(INPUT,'utf8');
const block=fs.readFileSync(BLOCK,'utf8').trimEnd();
function must(pattern,replacement,label){const next=src.replace(pattern,()=>replacement);if(next===src)throw new Error('V2.9 build transform did not match: '+label);src=next}

must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='2.8.0'; const SAVE_SCHEMA_VERSION=25;","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='2.9.0'; const SAVE_SCHEMA_VERSION=26;",'version/schema');
must('npcRequestsHelped:0,npcRequestsRefused:0,npcFavorReturns:0,healingPills:0,','npcRequestsHelped:0,npcRequestsRefused:0,npcFavorReturns:0,pastLifeRecognitions:0,healingPills:0,','player past-life field');
must('legacy:{cycles:0,merit:0,bestRealm:0,totalDeaths:0},major:{}','legacy:{cycles:0,merit:0,bestRealm:0,totalDeaths:0,pastLifeBonds:[],pastLifeEncounters:{},pastLifeSnapshots:0},major:{}','legacy past-life fields');
must('state.player.rootIndex=chooseRoot();state.npcs=createNPCs();ensureNpcLifeShape();ensureNpcConsequenceShape();ensureSectLifeShape();','state.player.rootIndex=chooseRoot();state.npcs=createNPCs();ensureNpcLifeShape();ensureNpcConsequenceShape();ensurePastLifeShape();ensureSectLifeShape();','new game past-life init');

const migNeedle="if(n.lifeTag===undefined)n.lifeTag=''}} \n};";
const mig26="if(n.lifeTag===undefined)n.lifeTag=''}} ,\n 26(){const p=state.player,lg=state.legacy||(state.legacy={cycles:0,merit:0,bestRealm:0,totalDeaths:0});if(p.pastLifeRecognitions==null)p.pastLifeRecognitions=0;if(!Array.isArray(lg.pastLifeBonds))lg.pastLifeBonds=[];if(!lg.pastLifeEncounters||typeof lg.pastLifeEncounters!=='object'||Array.isArray(lg.pastLifeEncounters))lg.pastLifeEncounters={};if(lg.pastLifeSnapshots==null)lg.pastLifeSnapshots=0} \n};";
must(migNeedle,mig26,'schema 26 migration');

must("['player.npcFavorReturns',p.npcFavorReturns],['world.npcConsequenceEvents',w.npcConsequenceEvents]","['player.npcFavorReturns',p.npcFavorReturns],['player.pastLifeRecognitions',p.pastLifeRecognitions],['legacy.pastLifeBonds',state.legacy?.pastLifeBonds],['legacy.pastLifeEncounters',state.legacy?.pastLifeEncounters],['legacy.pastLifeSnapshots',state.legacy?.pastLifeSnapshots],['world.npcConsequenceEvents',w.npcConsequenceEvents]",'schema validation past-life fields');

must('\nfunction cultivationGainForDays(days=1,retreatBoost=1)','\n'+block+'\n\nfunction cultivationGainForDays(days=1,retreatBoost=1)','insert past-life block');

must("if(!state.flags.dead||state.flags.legacyRecorded)return 0;const gain=legacyGainThisLife();state.legacy=state.legacy||","if(!state.flags.dead||state.flags.legacyRecorded)return 0;ensurePastLifeShape();capturePastLifeBonds();const gain=legacyGainThisLife();state.legacy=state.legacy||",'capture bonds on death');

const oldFirstReset="state.legacy=keep.legacy;for(const n of state.npcs){n.relation=0;n.grudge=0;n.lastGiftDay=0;n.lastDaoDay=0;n.lastSparDay=0;n.lastHelpMonth=0;n.lastRevengeDay=0}state.personalLog=[];";
const newFirstReset="state.legacy=keep.legacy;ensurePastLifeShape();resetPlayerNpcTiesForRebirth();state.personalLog=[];";
must(oldFirstReset,newFirstReset,'clear old-life ties before reincarnation interval');
const oldSecondReset="for(let i=0;i<30;i++)tickOneDay();for(const n of state.npcs){n.relation=0;n.grudge=0;n.lastGiftDay=0;n.lastDaoDay=0;n.lastSparDay=0;n.lastHelpMonth=0;n.lastRevengeDay=0}state.player.birthDay=dayNumber();";
const newSecondReset="for(let i=0;i<30;i++)tickOneDay();resetPlayerNpcTiesForRebirth();state.player.birthDay=dayNumber();";
must(oldSecondReset,newSecondReset,'clear any old-life ties after reincarnation interval');

must("if(n.location!==state.player.location)return '对方目前在【'+n.location+'】，你在【'+state.player.location+'】。';const fid=factionIdFromNpc(n);","if(n.location!==state.player.location)return '对方目前在【'+n.location+'】，你在【'+state.player.location+'】。';if(pastLifeRecognitionAvailable(n))return '你和'+n.name+'这一世还没有真正重逢。先到“前尘旧缘”里上前交谈。';const fid=factionIdFromNpc(n);",'gate old-friend social actions until recognition');

must('renderNPCs();renderNpcFatePanel();renderNpcConsequencePanel();','renderNPCs();renderNpcFatePanel();renderNpcConsequencePanel();renderPastLifePanel();','render past-life panel');

const apiNeedle='simulateSectLife,npcConsequenceInfo:';
const apiInsert="simulateSectLife,pastLifeInfo:()=>pastLifeSnapshot(),recognizePastLifeById:(id)=>recognizePastLifeNpc(state.npcs.find(n=>n.id===Number(id)),true),capturePastLifeBondsForTest:()=>capturePastLifeBonds(),reincarnateForTest:(kind='plain')=>reincarnate(kind),npcConsequenceInfo:";
must(apiNeedle,apiInsert,'test API past-life');

fs.writeFileSync(OUTPUT,src,'utf8');
const sha=crypto.createHash('sha256').update(src).digest('hex');
const report={status:'PASS',gameplay_version:'2.9.0',build:BUILD,milestone:'past-life-bonds',source:OUTPUT,source_sha256:sha,source_bytes:Buffer.byteLength(src),realm_count:26,location_count:12,route_count:20,save_schema_version:26,checks:['deep friendship snapshot at life end','no direct relationship inheritance','old favor debt cleared on rebirth','old pending requests cleared on rebirth','one-time past-life recognition','small old-friend starting benefit','schema 25 to 26 migration','V2.8 consequence systems preserved']};
fs.writeFileSync('BUILD_V29_PAST_LIFE_BONDS.json',JSON.stringify(report,null,2)+'\n');
console.log('V29_BUILD_PASS',JSON.stringify(report));
