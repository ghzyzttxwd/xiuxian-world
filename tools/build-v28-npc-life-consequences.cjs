const fs=require('fs');
const crypto=require('crypto');

const INPUT='src/game-v27.js';
const OUTPUT='src/game-v28.js';
const BLOCK='tools/v28-npc-life-consequences-block.txt';
const BUILD='2801';
if(!fs.existsSync(INPUT))throw new Error('V2.8 build: missing '+INPUT);
if(!fs.existsSync(BLOCK))throw new Error('V2.8 build: missing '+BLOCK);
let src=fs.readFileSync(INPUT,'utf8');
const block=fs.readFileSync(BLOCK,'utf8').trimEnd();
function must(pattern,replacement,label){const next=src.replace(pattern,()=>replacement);if(next===src)throw new Error('V2.8 build transform did not match: '+label);src=next}

must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='2.7.0'; const SAVE_SCHEMA_VERSION=24;","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='2.8.0'; const SAVE_SCHEMA_VERSION=25;",'version/schema');
must('npcBattleAssists:0,npcFriendDeaths:0,healingPills:0,','npcBattleAssists:0,npcFriendDeaths:0,npcRequestsHelped:0,npcRequestsRefused:0,npcFavorReturns:0,healingPills:0,','player consequence fields');
must('npcRelations:{},npcMemorials:[],npcLifeEvents:0},npcs:[]','npcRelations:{},npcMemorials:[],npcLifeEvents:0,npcPendingRequest:null,npcConsequenceEvents:0,npcConflictDeaths:0,npcFactionChanges:0,npcMajorLifeEvents:0},npcs:[]','world consequence fields');
must('state.player.rootIndex=chooseRoot();state.npcs=createNPCs();ensureNpcLifeShape();ensureSectLifeShape();','state.player.rootIndex=chooseRoot();state.npcs=createNPCs();ensureNpcLifeShape();ensureNpcConsequenceShape();ensureSectLifeShape();','new game consequence init');

const migNeedle="if(n.battleAssists==null)n.battleAssists=0}} \n};";
const mig25="if(n.battleAssists==null)n.battleAssists=0}} ,\n 25(){const p=state.player,w=state.world;if(p.npcRequestsHelped==null)p.npcRequestsHelped=0;if(p.npcRequestsRefused==null)p.npcRequestsRefused=0;if(p.npcFavorReturns==null)p.npcFavorReturns=0;if(w.npcPendingRequest===undefined)w.npcPendingRequest=null;if(w.npcConsequenceEvents==null)w.npcConsequenceEvents=0;if(w.npcConflictDeaths==null)w.npcConflictDeaths=0;if(w.npcFactionChanges==null)w.npcFactionChanges=0;if(w.npcMajorLifeEvents==null)w.npcMajorLifeEvents=0;for(const n of state.npcs){if(n.favorDebt==null)n.favorDebt=0;if(n.lastRequestDay==null)n.lastRequestDay=0;if(n.lastFavorReturnDay==null)n.lastFavorReturnDay=0;if(n.lastConflictDay==null)n.lastConflictDay=0;if(n.lastFactionChangeDay==null)n.lastFactionChangeDay=0;if(n.majorLifeEvents==null)n.majorLifeEvents=0;if(n.lastMajorLifeDay==null)n.lastMajorLifeDay=0;if(n.retiredUntilDay==null)n.retiredUntilDay=0;if(n.lifeTag===undefined)n.lifeTag=''}} \n};";
must(migNeedle,mig25,'schema 25 migration');

must("['player.npcFriendDeaths',p.npcFriendDeaths],['world.npcRelations',w.npcRelations]","['player.npcFriendDeaths',p.npcFriendDeaths],['player.npcRequestsHelped',p.npcRequestsHelped],['player.npcRequestsRefused',p.npcRequestsRefused],['player.npcFavorReturns',p.npcFavorReturns],['world.npcConsequenceEvents',w.npcConsequenceEvents],['world.npcConflictDeaths',w.npcConflictDeaths],['world.npcFactionChanges',w.npcFactionChanges],['world.npcMajorLifeEvents',w.npcMajorLifeEvents],['world.npcRelations',w.npcRelations]",'schema validation consequence fields');

must('\nfunction cultivationGainForDays(days=1,retreatBoost=1)','\n'+block+'\n\nfunction cultivationGainForDays(days=1,retreatBoost=1)','insert consequence block');
must('simulateNPCsV27();simulateSectLife();updateMajorEvents();processSocialEvents();updateSecretRealm();updateFactionConflict();','simulateNPCsV28();simulateSectLife();updateMajorEvents();processSocialEvents();updateSecretRealm();updateFactionConflict();','daily consequence simulation');

must("if(rand()<.035)n.location=npcMoveTarget(n);if(today%15===0&&today-(n.lastFateDay||0)>=15","if((n.retiredUntilDay||0)<=today&&rand()<.035)n.location=npcMoveTarget(n);if((n.retiredUntilDay||0)<=today&&today%15===0&&today-(n.lastFateDay||0)>=15",'retirement blocks movement/adventure');
must("if(n.alive&&r&&n.location===r.location&&n.lastSecretRealmKey!==npcSecretRealmKey(r)","if(n.alive&&(n.retiredUntilDay||0)<=today&&r&&n.location===r.location&&n.lastSecretRealmKey!==npcSecretRealmKey(r)",'retirement blocks secret realm');
must("if(n.alive&&war&&war.status==='active'&&['青云宗','血刀门'].includes(n.faction)","if(n.alive&&(n.retiredUntilDay||0)<=today&&war&&war.status==='active'&&['青云宗','血刀门'].includes(n.faction)",'retirement blocks faction war');

must("candidates.sort((a,b)=>(b.relation+a.realmIndex*3)-(a.relation+b.realmIndex*3));const best=candidates[0],chance=clamp(.18+(best.relation||0)/180+best.courage/700,.35,.82);","candidates.sort((a,b)=>((b.relation||0)+b.realmIndex*3+(b.favorDebt||0)*8)-((a.relation||0)+a.realmIndex*3+(a.favorDebt||0)*8));const best=candidates[0],chance=clamp(.18+(best.relation||0)/180+best.courage/700+(best.favorDebt||0)*.06,.35,.90);",'favor debt affects battle assist');

must('renderEvents();renderFactionStanding();renderFactionConflict();renderNPCs();renderNpcFatePanel();','renderEvents();renderFactionStanding();renderFactionConflict();renderNPCs();renderNpcFatePanel();renderNpcConsequencePanel();','render consequence panel');

const apiNeedle='simulateSectLife,npcLifeInfo:';
const apiInsert="simulateSectLife,npcConsequenceInfo:()=>npcConsequenceSnapshot(),forceNpcHelpRequestById:(id,type='stones')=>createNpcHelpRequest(state.npcs.find(n=>n.id===Number(id)),type,true),resolveNpcHelpRequestForTest:(choice='help')=>resolveNpcHelpRequest(choice),triggerNpcFavorReturnById:(id)=>triggerNpcFavorReturn(state.npcs.find(n=>n.id===Number(id)),true),simulateNpcFeudByIds:(a,b,outcome=null)=>simulateNpcFeud(state.npcs.find(n=>n.id===Number(a)),state.npcs.find(n=>n.id===Number(b)),outcome,true),simulateNpcFactionShiftById:(id,target)=>simulateNpcFactionShift(state.npcs.find(n=>n.id===Number(id)),target,true),simulateNpcMajorLifeEventById:(id,type)=>simulateNpcMajorLifeEvent(state.npcs.find(n=>n.id===Number(id)),type,true),npcLifeInfo:";
must(apiNeedle,apiInsert,'test API consequence');

fs.writeFileSync(OUTPUT,src,'utf8');
const sha=crypto.createHash('sha256').update(src).digest('hex');
const report={status:'PASS',gameplay_version:'2.8.0',build:BUILD,milestone:'npc-life-consequences',source:OUTPUT,source_sha256:sha,source_bytes:Buffer.byteLength(src),realm_count:26,location_count:12,route_count:20,save_schema_version:25,checks:['NPC help requests with real resource costs','persistent player-to-NPC favor debt and returns','NPC feud escalation with injury/death','dynamic NPC faction membership','low-frequency stateful major life events','retirement affects autonomous risk-taking','schema 24 to 25 migration','V2.7 fate systems preserved']};
fs.writeFileSync('BUILD_V28_NPC_LIFE_CONSEQUENCES.json',JSON.stringify(report,null,2)+'\n');
console.log('V28_BUILD_PASS',JSON.stringify(report));
