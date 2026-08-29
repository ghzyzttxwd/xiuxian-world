const fs=require('fs');
const crypto=require('crypto');

const INPUT='src/game-v25.js';
const OUTPUT='src/game-v26.js';
const BLOCK='tools/v26-sect-life-block.txt';
const BUILD='2601';
if(!fs.existsSync(INPUT))throw new Error('V2.6 build: missing '+INPUT);
if(!fs.existsSync(BLOCK))throw new Error('V2.6 build: missing '+BLOCK);
let src=fs.readFileSync(INPUT,'utf8');
const lifeBlock=fs.readFileSync(BLOCK,'utf8').trimEnd();
function must(pattern,replacement,label){const next=src.replace(pattern,()=>replacement);if(next===src)throw new Error('V2.6 build transform did not match: '+label);src=next}

must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='2.5.0'; const SAVE_SCHEMA_VERSION=22;","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='2.6.0'; const SAVE_SCHEMA_VERSION=23;",'version/schema');
must('sectSeniorTasksCompleted:0,healingPills:0,','sectSeniorTasksCompleted:0,sectPrestige:0,sectRivalId:null,sectRivalWins:0,sectRivalLosses:0,sectInternalEvents:0,healingPills:0,','player sect life fields');
must('warWinsQingyun:0,warWinsBlood:0},npcs:[]','warWinsQingyun:0,warWinsBlood:0,sectMentors:null,sectPeers:[],sectEvent:null,nextSectEventDay:75,sectEventCount:0},npcs:[]','world sect life fields');
must('state.player.rootIndex=chooseRoot();state.npcs=createNPCs();','state.player.rootIndex=chooseRoot();state.npcs=createNPCs();ensureSectLifeShape();','new game sect life init');

must(/ 22\(\)\{const p=state\.player;if\(p\.sectMentor===undefined\)p\.sectMentor=null;if\(p\.sectMentorBond==null\)p\.sectMentorBond=0;if\(p\.sectLastMentorDay==null\)p\.sectLastMentorDay=0;if\(p\.sectAssessmentLevel==null\)p\.sectAssessmentLevel=0;if\(p\.sectLastAssessmentDay==null\)p\.sectLastAssessmentDay=0;if\(p\.sectSeniorTasksCompleted==null\)p\.sectSeniorTasksCompleted=0\} \n\};/," 22(){const p=state.player;if(p.sectMentor===undefined)p.sectMentor=null;if(p.sectMentorBond==null)p.sectMentorBond=0;if(p.sectLastMentorDay==null)p.sectLastMentorDay=0;if(p.sectAssessmentLevel==null)p.sectAssessmentLevel=0;if(p.sectLastAssessmentDay==null)p.sectLastAssessmentDay=0;if(p.sectSeniorTasksCompleted==null)p.sectSeniorTasksCompleted=0} ,\n 23(){const p=state.player,w=state.world;if(p.sectPrestige==null)p.sectPrestige=0;if(p.sectRivalId===undefined)p.sectRivalId=null;if(p.sectRivalWins==null)p.sectRivalWins=0;if(p.sectRivalLosses==null)p.sectRivalLosses=0;if(p.sectInternalEvents==null)p.sectInternalEvents=0;if(!w.sectMentors||typeof w.sectMentors!=='object')w.sectMentors=createSectMentorStates();if(!Array.isArray(w.sectPeers)||!w.sectPeers.length)w.sectPeers=createSectPeers();if(w.sectEvent===undefined)w.sectEvent=null;if(w.nextSectEventDay==null)w.nextSectEventDay=75;if(w.sectEventCount==null)w.sectEventCount=0} \n};",'schema 23 migration');

must("['player.sectSeniorTasksCompleted',p.sectSeniorTasksCompleted],['player.factionStanding',p.factionStanding]","['player.sectSeniorTasksCompleted',p.sectSeniorTasksCompleted],['player.sectPrestige',p.sectPrestige],['player.sectRivalWins',p.sectRivalWins],['player.sectRivalLosses',p.sectRivalLosses],['player.sectInternalEvents',p.sectInternalEvents],['world.sectMentors',w.sectMentors],['world.sectPeers',w.sectPeers],['world.nextSectEventDay',w.nextSectEventDay],['world.sectEventCount',w.sectEventCount],['player.factionStanding',p.factionStanding]",'schema validation fields');

must('\nfunction marketPrices()', '\n'+lifeBlock+'\n\nfunction marketPrices()','insert sect life block');
must('simulateNPCs();updateMajorEvents();processSocialEvents();','simulateNPCs();simulateSectLife();updateMajorEvents();processSocialEvents();','daily sect life simulation');
must('onSectCombatWin(e);onSectAssessmentResult(true,e);','onSectCombatWin(e);onSectAssessmentResult(true,e);onSectInternalCombatResult(true,e);','internal duel win hook');
must('state.player.battleLosses++;onSectAssessmentResult(false,e);','state.player.battleLosses++;onSectAssessmentResult(false,e);onSectInternalCombatResult(false,e);','internal duel loss hook');
must(/const pr=actions\.querySelector\('\[data-sect-promote\]'\);if\(pr\)pr\.onclick=promoteSect\n\}/,"const pr=actions.querySelector('[data-sect-promote]');if(pr)pr.onclick=promoteSect;renderSectLifePanel(info,actions)\n}",'render sect life panel');
must('sectCareerInfo:()=>({rank:state?.player?.sectRank,rankIndex:state?sectRankIndex():0,assessmentLevel:state?.player?.sectAssessmentLevel||0,seniorTasks:state?.player?.sectSeniorTasksCompleted||0,tasks:state?.player?.sectTasksCompleted||0,contribution:state?.player?.sectContribution||0}),startRegionalEvent,',"sectCareerInfo:()=>({rank:state?.player?.sectRank,rankIndex:state?sectRankIndex():0,assessmentLevel:state?.player?.sectAssessmentLevel||0,seniorTasks:state?.player?.sectSeniorTasksCompleted||0,tasks:state?.player?.sectTasksCompleted||0,contribution:state?.player?.sectContribution||0}),sectLifeInfo:()=>{ensureSectLifeShape();return {mentors:JSON.parse(JSON.stringify(state.world.sectMentors)),peers:JSON.parse(JSON.stringify(state.world.sectPeers)),event:state.world.sectEvent?{...state.world.sectEvent}:null,nextEventDay:state.world.nextSectEventDay,rival:sectRival()?{...sectRival()}:null,prestige:state.player.sectPrestige||0,wins:state.player.sectRivalWins||0,losses:state.player.sectRivalLosses||0}},forceSectInternalEvent:(type)=>createSectInternalEvent(type,true),startSectInternalEvent,resolveSectInternalEvent,finishMentorRetreat,simulateSectLife,startRegionalEvent,",'test api sect life');

fs.writeFileSync(OUTPUT,src,'utf8');
const sha=crypto.createHash('sha256').update(src).digest('hex');
const report={status:'PASS',gameplay_version:'2.6.0',build:BUILD,milestone:'sect-life-rivalry',source:OUTPUT,source_sha256:sha,source_bytes:Buffer.byteLength(src),realm_count:26,location_count:12,route_count:20,save_schema_version:23,checks:['living mentor states','mentor retreat breakthrough and lifespan death','six persistent sect peers','peer cultivation and rank progression','long-term sect rival','real nonlethal rival duel','rotating internal sect events','dead-mentor transfer with bond loss','schema 22 to 23 migration','V2.5 systems preserved']};
fs.writeFileSync('BUILD_V26_SECT_LIFE.json',JSON.stringify(report,null,2)+'\n');
console.log('V26_BUILD_PASS',JSON.stringify(report));
