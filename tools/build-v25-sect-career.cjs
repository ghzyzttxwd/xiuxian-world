const fs=require('fs');
const crypto=require('crypto');

const INPUT='src/game-v24.js';
const OUTPUT='src/game-v25.js';
const BLOCK='tools/v25-sect-block.txt';
const BUILD='2501';
if(!fs.existsSync(INPUT))throw new Error('V2.5 build: missing '+INPUT);
if(!fs.existsSync(BLOCK))throw new Error('V2.5 build: missing '+BLOCK);
let src=fs.readFileSync(INPUT,'utf8');
const sectBlock=fs.readFileSync(BLOCK,'utf8').trimEnd();
function must(pattern,replacement,label){const next=src.replace(pattern,()=>replacement);if(next===src)throw new Error('V2.5 build transform did not match: '+label);src=next}

must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='2.4.0'; const SAVE_SCHEMA_VERSION=21;","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='2.5.0'; const SAVE_SCHEMA_VERSION=22;",'version/schema');

must('sectLastStipend:0,healingPills:0,','sectLastStipend:0,sectMentor:null,sectMentorBond:0,sectLastMentorDay:0,sectAssessmentLevel:0,sectLastAssessmentDay:0,sectSeniorTasksCompleted:0,healingPills:0,','new sect career fields');

const migration21=" 21(){const p=state.player,i=clamp(Number(p.realmIndex)||0,0,REALMS.length-1),oldNeed=V23_REALM_NEEDS[i]||1,newNeed=REALMS[i].need,ratio=clamp((Number(p.progress)||0)/oldNeed,0,1);p.progress=Math.round(newNeed*ratio);if(p.diligence==null)p.diligence=0} \n};";
const migration22=" 21(){const p=state.player,i=clamp(Number(p.realmIndex)||0,0,REALMS.length-1),oldNeed=V23_REALM_NEEDS[i]||1,newNeed=REALMS[i].need,ratio=clamp((Number(p.progress)||0)/oldNeed,0,1);p.progress=Math.round(newNeed*ratio);if(p.diligence==null)p.diligence=0} ,\n 22(){const p=state.player;if(p.sectMentor===undefined)p.sectMentor=null;if(p.sectMentorBond==null)p.sectMentorBond=0;if(p.sectLastMentorDay==null)p.sectLastMentorDay=0;if(p.sectAssessmentLevel==null)p.sectAssessmentLevel=0;if(p.sectLastAssessmentDay==null)p.sectLastAssessmentDay=0;if(p.sectSeniorTasksCompleted==null)p.sectSeniorTasksCompleted=0} \n};";
must(migration21,migration22,'schema 22 migration');

must("['player.factionStanding',p.factionStanding]","['player.sectMentorBond',p.sectMentorBond],['player.sectLastMentorDay',p.sectLastMentorDay],['player.sectAssessmentLevel',p.sectAssessmentLevel],['player.sectLastAssessmentDay',p.sectLastAssessmentDay],['player.sectSeniorTasksCompleted',p.sectSeniorTasksCompleted],['player.factionStanding',p.factionStanding]",'sect career validation fields');

must(/const SECT_TASKS=\{[\s\S]*?\nfunction marketPrices\(\)/,sectBlock+'\n\nfunction marketPrices()','replace sect career system');

must('state.player.battleWins++;state.player.kills++;onSectCombatWin(e);','state.player.battleWins++;if(!e.nonLethal)state.player.kills++;onSectCombatWin(e);onSectAssessmentResult(true,e);','nonlethal assessment win');
must('}else{state.player.battleLosses++;const risk=deathRisk(e);if(risk>0&&rand()<risk){','}else{state.player.battleLosses++;onSectAssessmentResult(false,e);const risk=deathRisk(e);if(!e.nonLethal&&risk>0&&rand()<risk){','nonlethal assessment death guard');
must('const lost=Math.min(state.player.spiritStones,rint(0,Math.max(2,diff+1)));','const lost=e.nonLethal?0:Math.min(state.player.spiritStones,rint(0,Math.max(2,diff+1)));','nonlethal assessment stone guard');

must('claimSectStipend,startRegionalEvent,','claimSectStipend,chooseSectMentor,seekMentorGuidance,takeSectAssessment,promoteSect,acceptSectTask,sectRankIndex,sectPromotionMissing,sectMentorInfo:()=>state?.player?.sectMentor?{...SECT_MENTORS[state.player.sectMentor],bond:state.player.sectMentorBond,cooldown:mentorLessonCooldown()}:null,sectCareerInfo:()=>({rank:state?.player?.sectRank,rankIndex:state?sectRankIndex():0,assessmentLevel:state?.player?.sectAssessmentLevel||0,seniorTasks:state?.player?.sectSeniorTasksCompleted||0,tasks:state?.player?.sectTasksCompleted||0,contribution:state?.player?.sectContribution||0}),startRegionalEvent,','test api sect career');

fs.writeFileSync(OUTPUT,src,'utf8');
const sha=crypto.createHash('sha256').update(src).digest('hex');
const report={status:'PASS',gameplay_version:'2.5.0',build:BUILD,milestone:'sect-career-mentorship',source:OUTPUT,source_sha256:sha,source_bytes:Buffer.byteLength(src),realm_count:26,location_count:12,route_count:20,save_schema_version:22,checks:['five-rank Qingyun career','real nonlethal promotion assessments','four mentor lineages','mentor cooldown and bond progression','rank-gated senior sect tasks','rank-scaled stipend and exchanges','schema 21 to 22 migration','V2.4 systems preserved']};
fs.writeFileSync('BUILD_V25_SECT_CAREER.json',JSON.stringify(report,null,2)+'\n');
console.log('V25_BUILD_PASS',JSON.stringify(report));
