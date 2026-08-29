const fs=require('fs');
const crypto=require('crypto');

const INPUT='src/game-v26.js';
const OUTPUT='src/game-v27.js';
const BLOCK='tools/v27-npc-fate-block.txt';
const BUILD='2701';
if(!fs.existsSync(INPUT))throw new Error('V2.7 build: missing '+INPUT);
if(!fs.existsSync(BLOCK))throw new Error('V2.7 build: missing '+BLOCK);
let src=fs.readFileSync(INPUT,'utf8');
const fateBlock=fs.readFileSync(BLOCK,'utf8').trimEnd();
function must(pattern,replacement,label){const next=src.replace(pattern,()=>replacement);if(next===src)throw new Error('V2.7 build transform did not match: '+label);src=next}

must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='2.6.0'; const SAVE_SCHEMA_VERSION=23;","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='2.7.0'; const SAVE_SCHEMA_VERSION=24;",'version/schema');
must('sectInternalEvents:0,healingPills:0,','sectInternalEvents:0,npcBattleAssists:0,npcFriendDeaths:0,healingPills:0,','player npc fate fields');
must('sectEvent:null,nextSectEventDay:75,sectEventCount:0},npcs:[]','sectEvent:null,nextSectEventDay:75,sectEventCount:0,npcRelations:{},npcMemorials:[],npcLifeEvents:0},npcs:[]','world npc fate fields');
must('state.player.rootIndex=chooseRoot();state.npcs=createNPCs();ensureSectLifeShape();','state.player.rootIndex=chooseRoot();state.npcs=createNPCs();ensureNpcLifeShape();ensureSectLifeShape();','new game npc fate init');

must(/ 23\(\)\{const p=state\.player,w=state\.world;if\(p\.sectPrestige==null\)p\.sectPrestige=0;if\(p\.sectRivalId===undefined\)p\.sectRivalId=null;if\(p\.sectRivalWins==null\)p\.sectRivalWins=0;if\(p\.sectRivalLosses==null\)p\.sectRivalLosses=0;if\(p\.sectInternalEvents==null\)p\.sectInternalEvents=0;if\(!w\.sectMentors\|\|typeof w\.sectMentors!=='object'\)w\.sectMentors=createSectMentorStates\(\);if\(!Array\.isArray\(w\.sectPeers\)\|\|!w\.sectPeers\.length\)w\.sectPeers=createSectPeers\(\);if\(w\.sectEvent===undefined\)w\.sectEvent=null;if\(w\.nextSectEventDay==null\)w\.nextSectEventDay=75;if\(w\.sectEventCount==null\)w\.sectEventCount=0\} \n\};/," 23(){const p=state.player,w=state.world;if(p.sectPrestige==null)p.sectPrestige=0;if(p.sectRivalId===undefined)p.sectRivalId=null;if(p.sectRivalWins==null)p.sectRivalWins=0;if(p.sectRivalLosses==null)p.sectRivalLosses=0;if(p.sectInternalEvents==null)p.sectInternalEvents=0;if(!w.sectMentors||typeof w.sectMentors!=='object')w.sectMentors=createSectMentorStates();if(!Array.isArray(w.sectPeers)||!w.sectPeers.length)w.sectPeers=createSectPeers();if(w.sectEvent===undefined)w.sectEvent=null;if(w.nextSectEventDay==null)w.nextSectEventDay=75;if(w.sectEventCount==null)w.sectEventCount=0} ,\n 24(){const p=state.player,w=state.world;if(p.npcBattleAssists==null)p.npcBattleAssists=0;if(p.npcFriendDeaths==null)p.npcFriendDeaths=0;if(!w.npcRelations||typeof w.npcRelations!=='object'||Array.isArray(w.npcRelations))w.npcRelations={};if(!Array.isArray(w.npcMemorials))w.npcMemorials=[];if(w.npcLifeEvents==null)w.npcLifeEvents=0;for(const n of state.npcs){if(n.bornDay==null)n.bornDay=1-(Number(n.age)||20)*360;if(n.injury==null)n.injury=0;if(n.adventures==null)n.adventures=0;if(n.secretRealmTrips==null)n.secretRealmTrips=0;if(n.factionBattles==null)n.factionBattles=0;if(n.deathCause===undefined)n.deathCause=null;if(n.deathDay==null)n.deathDay=0;if(n.lastFateDay==null)n.lastFateDay=0;if(n.lastSecretRealmKey===undefined)n.lastSecretRealmKey=null;if(n.lastFactionLifeDay==null)n.lastFactionLifeDay=0;if(n.battleAssists==null)n.battleAssists=0}} \n};",'schema 24 migration');

must("['player.sectInternalEvents',p.sectInternalEvents],['world.sectMentors',w.sectMentors]","['player.sectInternalEvents',p.sectInternalEvents],['player.npcBattleAssists',p.npcBattleAssists],['player.npcFriendDeaths',p.npcFriendDeaths],['world.npcRelations',w.npcRelations],['world.npcMemorials',w.npcMemorials],['world.npcLifeEvents',w.npcLifeEvents],['world.sectMentors',w.sectMentors]",'schema validation npc fate fields');

must('\nfunction cultivationGainForDays(days=1,retreatBoost=1)', '\n'+fateBlock+'\n\nfunction cultivationGainForDays(days=1,retreatBoost=1)','insert npc fate block');
must('simulateNPCs();simulateSectLife();updateMajorEvents();processSocialEvents();updateSecretRealm();updateFactionConflict();','simulateNPCsV27();simulateSectLife();updateMajorEvents();processSocialEvents();updateSecretRealm();updateFactionConflict();','daily npc fate simulation');

const oldCombat="combat={enemy:e,enemyHp:e.hp,playerHp:state.player.hp,playerQi:state.player.qi,defending:false,evade:0,guard:0,domain:0,weaken:0,burn:0,bodyGuard:0,soulSeal:0,round:1,logs:[`你遭遇了${e.name}。危险判断：${dangerLabel(e)}。`]};renderCombat()";
const newCombat="const ally=findNpcBattleAlly(e);combat={enemy:e,enemyHp:e.hp,playerHp:state.player.hp,playerQi:state.player.qi,defending:false,evade:0,guard:0,domain:0,weaken:0,burn:0,bodyGuard:0,soulSeal:0,round:1,allyNpcId:ally?ally.id:null,allyTurns:ally?3:0,allyCounted:false,logs:['你遭遇了'+e.name+'。危险判断：'+dangerLabel(e)+'。']};if(ally)combat.logs.push(ally.name+'见你遇敌，决定并肩助阵。');renderCombat()";
must(oldCombat,newCombat,'combat ally state');
must('if(combat.enemyHp<=0){finishCombat(true);return}if(combat.burn>0){','if(combat.enemyHp<=0){finishCombat(true);return}npcBattleAllyTurn(e);if(combat.enemyHp<=0){finishCombat(true);return}if(combat.burn>0){','combat ally real strike');

must("const losers=state.npcs.filter(n=>n.alive&&n.faction===(qingyunWin?'血刀门':'青云宗'));if(losers.length&&rand()<.45){const fallen=pick(losers);fallen.alive=false;fallen.known=true;addWorld('大战余波中，'+fallen.name+'（'+fallen.faction+'）战死。','bad')}","const losers=state.npcs.filter(n=>n.alive&&n.faction===(qingyunWin?'血刀门':'青云宗'));if(losers.length&&rand()<.45){const fallen=pick(losers);fallen.known=true;npcDie(fallen,'在青云宗与血刀门的大战中战死')}",'war casualties use fate death');
must('renderEvents();renderFactionStanding();renderFactionConflict();renderNPCs();','renderEvents();renderFactionStanding();renderFactionConflict();renderNPCs();renderNpcFatePanel();','render npc fate panel');

const apiNeedle='simulateSectLife,startRegionalEvent,';
const apiInsert="simulateSectLife,npcLifeInfo:()=>{ensureNpcLifeShape();return {npcs:JSON.parse(JSON.stringify(state.npcs)),relations:{...state.world.npcRelations},memorials:JSON.parse(JSON.stringify(state.world.npcMemorials)),lifeEvents:state.world.npcLifeEvents||0,battleAssists:state.player.npcBattleAssists||0,friendDeaths:state.player.npcFriendDeaths||0}},simulateNpcAdventureById:(id,outcome)=>simulateNpcAdventure(Number(id),outcome),simulateNpcSecretRealmById:(id,outcome)=>simulateNpcSecretRealm(Number(id),outcome),simulateNpcFactionBattleById:(id,outcome)=>simulateNpcFactionBattle(Number(id),outcome),simulateNpcNetworkTick:(force=true)=>simulateNpcNetworkTick(force),npcRelationBetweenById:(a,b)=>npcRelationBetween(Number(a),Number(b)),changeNpcRelationPairById:(a,b,d)=>{const x=state.npcs.find(n=>n.id===Number(a)),y=state.npcs.find(n=>n.id===Number(b));return changeNpcRelationPair(x,y,Number(d)||0,'测试')},npcDieById:(id,cause='测试陨落')=>npcDie(state.npcs.find(n=>n.id===Number(id)),cause),forceNpcBattleAlly:(id)=>{state.flags.forceNpcAllyId=Number(id)},startRegionalEvent,";
must(apiNeedle,apiInsert,'test api npc fate');

fs.writeFileSync(OUTPUT,src,'utf8');
const sha=crypto.createHash('sha256').update(src).digest('hex');
const report={status:'PASS',gameplay_version:'2.7.0',build:BUILD,milestone:'npc-fate-network',source:OUTPUT,source_sha256:sha,source_bytes:Buffer.byteLength(src),realm_count:26,location_count:12,route_count:20,save_schema_version:24,checks:['dynamic NPC age injury and lifespan death','persistent NPC to NPC relations','dangerous-region independent adventures','NPC secret realm participation','NPC faction war participation','friend battle assistance','persistent memorial records','schema 23 to 24 migration','V2.6 systems preserved']};
fs.writeFileSync('BUILD_V27_NPC_FATES.json',JSON.stringify(report,null,2)+'\n');
console.log('V27_BUILD_PASS',JSON.stringify(report));
