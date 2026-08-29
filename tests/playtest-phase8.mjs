import fs from 'fs';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v39.js';
const OUT=process.env.PHASE8_REPORT||'PHASE8_PLAYTEST_REPORT.json';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');

function cleanHtml(h){return h.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'')}
function rng(seed){let x=seed>>>0;return()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296}}
function make(seed){
 const d=new JSDOM(cleanHtml(htmlRaw),{url:'http://phase8.test/',runScripts:'outside-only',pretendToBeVisual:true});
 d.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});d.window.scrollTo=()=>{};d.window.console={log(){},warn(){},error(){}};
 d.window.Math.random=rng(seed);
 d.window.eval(source);
 const api=d.window.__TAIXUAN_TEST__;
 api.newGame('试玩'+seed);
 return {d,api};
}
function dayNo(s){return ((s.time?.year||1)-1)*360+((s.time?.month||1)-1)*30+(s.time?.day||1)}
function hpMax(api,s){try{return Number(api.maxHp?.())||Math.max(1,Number(s.player.hp)||1)}catch{return Math.max(1,Number(s.player.hp)||1)}}
function chooseAction(api,s,step,profile){
 const p=s.player,max=hpMax(api,s),ratio=(Number(p.hp)||0)/Math.max(1,max),inj=Number(p.injury)||0,stones=Number(p.spiritStones)||0;
 if(inj>=2||ratio<.48)return 'rest';
 if(stones<profile.stoneFloor)return 'work';
 if(step%profile.rumorEvery===0)return 'rumor';
 if(step%profile.exploreEvery===0)return 'explore';
 if(step%profile.gatherEvery===0)return 'gather';
 return 'cultivate';
}
function runOne(seed,profile){
 const {api}=make(seed);const curve=api.realmBalance();
 const start=api.getState(),startDay=dayNo(start);let prevRealm=start.player.realmIndex||0;
 const milestones={qi1:null,qi9:null,foundation:null};const actions={},realmDays={},failures=0;
 let breakthroughFailures=0,combatCount=0,combatLosses=0,maxFullStall=0,fullStall=0,minStones=Number(start.player.spiritStones)||0,minHpRatio=1;
 let lastRealmDay=startDay,steps=0,stopped='horizon';
 for(;steps<profile.maxDays;steps++){
   let s=api.getState();if(!s||s.flags?.dead){stopped='dead';break}
   const ri=Number(s.player.realmIndex)||0,need=curve[ri]?.need??Infinity;
   minStones=Math.min(minStones,Number(s.player.spiritStones)||0);minHpRatio=Math.min(minHpRatio,(Number(s.player.hp)||0)/hpMax(api,s));
   if(ri!==prevRealm){realmDays[prevRealm]=(realmDays[prevRealm]||0)+(dayNo(s)-lastRealmDay);lastRealmDay=dayNo(s);prevRealm=ri;fullStall=0}
   const elapsed=dayNo(s)-startDay;
   if(ri>=1&&milestones.qi1===null)milestones.qi1=elapsed;
   if(ri>=9&&milestones.qi9===null)milestones.qi9=elapsed;
   if(ri>=10&&milestones.foundation===null){milestones.foundation=elapsed;stopped='foundation';break}
   const combat=api.getCombat?.();
   if(combat){combatCount++;let guard=0;while(api.getCombat?.()&&guard++<30){const now=api.getState();const ratio=(Number(api.getCombat().playerHp)||0)/Math.max(1,hpMax(api,now));api.combatAction(ratio<.32?'defend':'attack')}if(api.getState()?.flags?.dead){combatLosses++;stopped='dead';break}continue}
   if(Number(s.player.progress)>=need){
     fullStall++;maxFullStall=Math.max(maxFullStall,fullStall);const before=ri;try{api.attemptBreakthrough()}catch{}s=api.getState();if((s.player.realmIndex||0)===before)breakthroughFailures++;else fullStall=0;continue
   }
   fullStall=0;
   const act=chooseAction(api,s,steps+1,profile);actions[act]=(actions[act]||0)+1;
   try{api.action(act)}catch{actions[act+'Error']=(actions[act+'Error']||0)+1}
 }
 const end=api.getState();const elapsed=dayNo(end)-startDay;realmDays[Number(end.player.realmIndex)||0]=(realmDays[Number(end.player.realmIndex)||0]||0)+(dayNo(end)-lastRealmDay);
 return {seed,profile:profile.name,stopped,days:elapsed,steps,finalRealm:Number(end.player.realmIndex)||0,finalProgress:Number(end.player.progress)||0,dead:!!end.flags?.dead,deathCause:end.flags?.deathCause||null,milestones,breakthroughFailures,combatCount,combatLosses,maxFullStall,minStones,minHpRatio:Number(minHpRatio.toFixed(3)),actions,final:{stones:Number(end.player.spiritStones)||0,herbs:Number(end.player.herbs)||0,injury:Number(end.player.injury)||0,manual:end.player.manual||null,location:end.player.location||null,sect:end.player.sect||null}}
}
const profiles=[
 {name:'balanced',maxDays:720,stoneFloor:8,rumorEvery:9,exploreEvery:7,gatherEvery:11},
 {name:'cautious',maxDays:720,stoneFloor:18,rumorEvery:8,exploreEvery:12,gatherEvery:9},
 {name:'cultivation-heavy',maxDays:720,stoneFloor:5,rumorEvery:12,exploreEvery:10,gatherEvery:15}
];
const results=[];let seed=8101;for(const profile of profiles)for(let i=0;i<12;i++)results.push(runOne(seed++,profile));
function vals(path){return results.map(r=>path(r)).filter(v=>Number.isFinite(v)).sort((a,b)=>a-b)}
function avg(a){return a.length?Number((a.reduce((x,y)=>x+y,0)/a.length).toFixed(1)):null}
function median(a){if(!a.length)return null;return a[Math.floor(a.length/2)]}
const q1=vals(r=>r.milestones.qi1),q9=vals(r=>r.milestones.qi9),fd=vals(r=>r.milestones.foundation),stall=vals(r=>r.maxFullStall);
const summary={runs:results.length,foundationReached:results.filter(r=>r.finalRealm>=10).length,dead:results.filter(r=>r.dead).length,qi1Reached:q1.length,qi9Reached:q9.length,medianDays:{qi1:median(q1),qi9:median(q9),foundation:median(fd)},averageDays:{qi1:avg(q1),qi9:avg(q9),foundation:avg(fd)},averageBreakthroughFailures:avg(results.map(r=>r.breakthroughFailures)),maxFullProgressStall:Math.max(...stall,0),minSpiritStones:Math.min(...results.map(r=>r.minStones)),profiles:Object.fromEntries(profiles.map(p=>[p.name,{runs:results.filter(r=>r.profile===p.name).length,foundation:results.filter(r=>r.profile===p.name&&r.finalRealm>=10).length,deaths:results.filter(r=>r.profile===p.name&&r.dead).length,medianFoundation:median(vals(r=>r.profile===p.name&&r.milestones.foundation!==null?r.milestones.foundation:NaN))}]))};
const flags=[];
if(summary.foundationReached<18)flags.push('FOUNDATION_REACH_RATE_LOW');
if((summary.medianDays.foundation??9999)>540)flags.push('FOUNDATION_TOO_SLOW');
if(summary.dead>7)flags.push('EARLY_DEATH_RATE_HIGH');
if(summary.maxFullProgressStall>80)flags.push('BREAKTHROUGH_STALL_HIGH');
if(summary.qi1Reached<30)flags.push('QI_ENTRY_UNRELIABLE');
const report={phase:'8-baseline',gameplay:'3.9.0',schema:36,generatedAt:new Date().toISOString(),policy:'normal-player-no-cheats-no-paid-buffs',summary,flags,results};
fs.writeFileSync(OUT,JSON.stringify(report,null,2)+'\n');
console.log('PHASE8_BASELINE',JSON.stringify({summary,flags}));
