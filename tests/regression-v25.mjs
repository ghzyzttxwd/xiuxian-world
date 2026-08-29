import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v25.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';

assert(source.includes("const VERSION='2.5.0'"),'V2.5 gameplay version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=22'),'schema 22 missing');
assert(!source.includes('天道酬勤'),'removed cultivation cheat text returned');
for(const marker of ['SECT_RANKS','真传弟子','宗门执事','宗门长老','SECT_MENTORS','顾长青','沈赤霞','岳千山','宁玄微','takeSectAssessment','onSectAssessmentResult','古河遗迹镇禁','玄阴禁地巡狩','majorRealmStage','finalizeLifespanDeath','FACTION_META','DAO_WORLD_EVENTS'])assert(source.includes(marker),`V2.5 marker missing: ${marker}`);

function cleanHtml(html){return html.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'')}
function makeDom(seed=null){
 const dom=new JSDOM(cleanHtml(htmlRaw),{url:'http://example.test/',runScripts:'outside-only',pretendToBeVisual:true});
 dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
 dom.window.scrollTo=()=>{};
 dom.window.console=console;
 if(seed!==null)dom.window.localStorage.setItem(SAVE_KEY,seed);
 dom.window.eval(source);
 return dom;
}
function loadState(obj){const d=makeDom(JSON.stringify(obj));d.window.document.getElementById('continueBtn').click();return d}
function baseState(){const d=makeDom();const api=d.window.__TAIXUAN_TEST__;api.newGame('V25回归');return api.getState()}
function sectSeed(rank='外门弟子',realmIndex=23){const s=baseState();Object.assign(s.player,{realmIndex,progress:0,location:'青云山',sect:'青云宗',sectRank:rank,sectContribution:1000,sectTasksCompleted:30,sectSeniorTasksCompleted:10,sectMentor:null,sectMentorBond:0,sectLastMentorDay:0,sectAssessmentLevel:0,sectLastAssessmentDay:0,sectTask:null,sectLastStipend:0,spiritStones:1000,herbs:100,rareMaterials:30,insight:20,hp:4200,qi:5100,injury:0,daoPath:'none',daoMastery:0,factionStanding:{qingyun:100,xuanshui:0,blood:0}});s.flags={};return s}
function winCurrent(api){let guard=0;while(api.getCombat()&&guard++<20)api.combatAction('attack');assert.equal(api.getCombat(),null,'combat did not finish')}
function winFight(api,name){api.startCombat(name);winCurrent(api)}

const dom=makeDom(),api=dom.window.__TAIXUAN_TEST__;
assert(api,'test API missing');
for(const fn of ['newGame','getState','takeSectAssessment','promoteSect','chooseSectMentor','seekMentorGuidance','sectMentorInfo','sectCareerInfo','acceptSectTask','claimSectStipend','startCombat','combatAction','realmBalance','remainingLifespanYears'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);

api.newGame('宗门生涯测试');let state=api.getState();
assert.equal(state.version,'2.5.0');assert.equal(state.saveSchemaVersion,22);assert.equal(state.player.sectMentor,null);assert.equal(state.player.sectMentorBond,0);assert.equal(state.player.sectAssessmentLevel,0);assert.equal(state.player.sectSeniorTasksCompleted,0);

// V2.4 schema21 -> V2.5 schema22 must preserve the old life and initialize only sect-career fields.
const old=baseState();old.version='2.4.0';old.saveSchemaVersion=21;old.player.sect='青云宗';old.player.sectRank='内门弟子';old.player.sectContribution=88;delete old.player.sectMentor;delete old.player.sectMentorBond;delete old.player.sectLastMentorDay;delete old.player.sectAssessmentLevel;delete old.player.sectLastAssessmentDay;delete old.player.sectSeniorTasksCompleted;
const oldDom=loadState(old),oldState=oldDom.window.__TAIXUAN_TEST__.getState();
assert.equal(oldState.version,'2.5.0');assert.equal(oldState.saveSchemaVersion,22);assert.equal(oldState.player.sectRank,'内门弟子');assert.equal(oldState.player.sectContribution,88);assert.equal(oldState.player.sectMentor,null);assert.equal(oldState.player.sectMentorBond,0);assert.equal(oldState.player.sectAssessmentLevel,0);assert.equal(oldState.player.sectSeniorTasksCompleted,0);

// Future schema23 must not load or overwrite.
const future={...old,saveSchemaVersion:23,version:'future-v25'};const futureRaw=JSON.stringify(future);const futureDom=makeDom(futureRaw);futureDom.window.document.getElementById('continueBtn').click();
assert.equal(futureDom.window.localStorage.getItem(SAVE_KEY),futureRaw,'future schema was overwritten');assert.equal(futureDom.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded');

// Promotion assessment is real combat but nonlethal and cannot be used as loot/kill farming.
const as=sectSeed('外门弟子',23);as.player.sectTasksCompleted=3;as.player.sectContribution=100;as.player.factionStanding.qingyun=20;const ad=loadState(as),aa=ad.window.__TAIXUAN_TEST__;const killsBefore=aa.getState().player.kills,rareBefore=aa.getState().player.rareMaterials;aa.takeSectAssessment();assert(aa.getCombat()?.enemy?.sectAssessment,'assessment did not start real combat');winCurrent(aa);let astate=aa.getState();assert.equal(astate.player.sectAssessmentLevel,1,'assessment victory not recorded');assert.equal(astate.player.kills,killsBefore,'nonlethal assessment counted as a kill');assert.equal(astate.player.rareMaterials,rareBefore,'assessment generated high-tier loot');aa.promoteSect();astate=aa.getState();assert.equal(astate.player.sectRank,'内门弟子','outer disciple did not promote after passing assessment');

// Assessment defeat must not kill the life or take spirit stones.
const ls=sectSeed('外门弟子',3);ls.player.hp=1;ls.player.qi=0;ls.player.sectTasksCompleted=3;ls.player.sectContribution=100;ls.player.spiritStones=77;ls.player.factionStanding.qingyun=20;const ld=loadState(ls),la=ld.window.__TAIXUAN_TEST__;la.takeSectAssessment();la.combatAction('attack');const lostState=la.getState();assert.notEqual(lostState.flags.dead,true,'sect assessment defeat killed the player');assert.equal(lostState.player.spiritStones,77,'sect assessment defeat took spirit stones');assert.equal(lostState.player.sectAssessmentLevel,0,'failed assessment was marked passed');assert(lostState.player.sectLastAssessmentDay>0,'failed assessment did not start cooldown');

// Inner disciples can choose one mentor; matching dao path produces real mastery and cooldown.
const ms=sectSeed('内门弟子',10);Object.assign(ms.player,{sectContribution:200,daoPath:'sword',daoMastery:0,manualProf:0,sectMentor:null,sectMentorBond:0,sectLastMentorDay:0});const md=loadState(ms),ma=md.window.__TAIXUAN_TEST__;ma.chooseSectMentor('sword');assert.equal(ma.sectMentorInfo()?.name,'顾长青');const dayBefore=ma.getState().time.day;ma.seekMentorGuidance();let mstate=ma.getState();assert.equal(mstate.player.sectMentorBond,1);assert.equal(mstate.player.sectContribution,192);assert.equal(mstate.player.manualProf,30);assert.equal(mstate.player.daoMastery,15);assert.equal(mstate.time.day,dayBefore+1);assert(ma.sectMentorInfo().cooldown>0,'mentor guidance cooldown missing');ma.seekMentorGuidance();assert.equal(ma.getState().player.sectMentorBond,1,'mentor cooldown could be bypassed');

// Each later identity has real long-term gates instead of a one-click rank label.
const trueSeed=sectSeed('内门弟子',10);Object.assign(trueSeed.player,{sectContribution:200,sectTasksCompleted:8,sectSeniorTasksCompleted:0,sectMentor:'sword',sectMentorBond:3,sectAssessmentLevel:2});trueSeed.player.factionStanding.qingyun=30;const trueApi=loadState(trueSeed).window.__TAIXUAN_TEST__;assert.equal(trueApi.sectPromotionMissing(2).length,0);trueApi.promoteSect();assert.equal(trueApi.getState().player.sectRank,'真传弟子');
const stewardSeed=sectSeed('真传弟子',14);Object.assign(stewardSeed.player,{sectContribution:400,sectTasksCompleted:14,sectSeniorTasksCompleted:3,sectMentor:'body',sectMentorBond:5,sectAssessmentLevel:3});stewardSeed.player.factionStanding.qingyun=50;const stewardApi=loadState(stewardSeed).window.__TAIXUAN_TEST__;assert.equal(stewardApi.sectPromotionMissing(3).length,0);stewardApi.promoteSect();assert.equal(stewardApi.getState().player.sectRank,'宗门执事');
const elderSeed=sectSeed('宗门执事',19);Object.assign(elderSeed.player,{sectContribution:800,sectTasksCompleted:22,sectSeniorTasksCompleted:8,sectMentor:'spirit',sectMentorBond:8,sectAssessmentLevel:4});elderSeed.player.factionStanding.qingyun=70;const elderApi=loadState(elderSeed).window.__TAIXUAN_TEST__;assert.equal(elderApi.sectPromotionMissing(4).length,0);elderApi.promoteSect();assert.equal(elderApi.getState().player.sectRank,'宗门长老');

// True disciples unlock real high-tier combat work; two Ancient River wins complete the task.
const ts=sectSeed('真传弟子',23);ts.player.sectSeniorTasksCompleted=0;ts.player.sectTasksCompleted=8;const td=loadState(ts),ta=td.window.__TAIXUAN_TEST__;const rare0=ta.getState().player.rareMaterials;ta.acceptSectTask('ruin');let taskState=ta.getState();assert.equal(taskState.player.sectTask?.id,'ruin','true disciple could not accept Ancient River task');taskState.player.location='古河遗迹';const td2=loadState(taskState),ta2=td2.window.__TAIXUAN_TEST__;winFight(ta2,'古河尸傀');assert.equal(ta2.getState().player.sectTask.progress,1);winFight(ta2,'古河尸傀');const tAfter=ta2.getState();assert.equal(tAfter.player.sectTask,null);assert.equal(tAfter.player.sectSeniorTasksCompleted,1);assert.equal(tAfter.player.sectTasksCompleted,9);assert(tAfter.player.rareMaterials>=rare0+1,'senior sect task reward missing');

// Rank-scaled monthly allocation must make elder status materially different.
const es=sectSeed('宗门长老',23);Object.assign(es.player,{spiritStones:100,herbs:10,rareMaterials:2,insight:0,daoPath:'none',sectLastStipend:0});const ed=loadState(es),ea=ed.window.__TAIXUAN_TEST__;ea.claimSectStipend();const eAfter=ea.getState();assert.equal(eAfter.player.spiritStones,135);assert.equal(eAfter.player.herbs,16);assert.equal(eAfter.player.rareMaterials,4);assert.equal(eAfter.player.insight,1);

// V2.4 survival hierarchy remains intact.
const curve=api.realmBalance();assert.equal(curve.length,26);assert.equal(curve[25].need,1300000);assert.equal(api.remainingLifespanYears()>0,true);

console.log('V25_REGRESSION_PASS',JSON.stringify({version:'2.5.0',schema:22,ranks:5,mentors:4,realAssessment:true,nonlethalAssessment:true,mentorProgression:true,seniorTasks:true,elderStipend:true,v24BalancePreserved:true,futureSaveProtected:true}));
