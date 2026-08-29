import fs from 'fs';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'');
const source=fs.readFileSync('src/game-v39.js','utf8');
const OUT='PHASE8_ROUND2_REPORT.json';
function rng(seed){let x=seed>>>0;return()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296}}
function make(seed){const d=new JSDOM(html,{url:'http://phase8-r2.test/',runScripts:'outside-only',pretendToBeVisual:true});d.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});d.window.scrollTo=()=>{};d.window.console={log(){},warn(){},error(){}};d.window.Math.random=rng(seed);d.window.eval(source);const api=d.window.__TAIXUAN_TEST__;api.newGame('二测'+seed);return {d,api}}
function dayNo(s){return ((s.time?.year||1)-1)*360+((s.time?.month||1)-1)*30+(s.time?.day||1)}
function hpMax(api,s){try{return Number(api.maxHp?.())||Math.max(1,Number(s.player.hp)||1)}catch{return Math.max(1,Number(s.player.hp)||1)}}
function settleCombat(api){let guard=0;while(api.getCombat?.()&&guard++<40){const c=api.getCombat(),s=api.getState();const ratio=(Number(c.playerHp)||0)/Math.max(1,hpMax(api,s));api.combatAction(ratio<.34?'defend':'attack')}return guard}
function travelSafe(api,to){try{const before=api.getState().player.location;api.travel(to);settleCombat(api);return api.getState().player.location!==before}catch{return false}}
function tryLearn(api,id){try{const r=api.learnV31Manual(id,false);if(r==='learned'||r==='known'){api.switchV31Manual(id,false);return true}}catch{}return false}
function routeProgression(api){let s=api.getState(),ri=Number(s.player.realmIndex)||0,loc=s.player.location;
 // 像真人一样：入炼气后离村，炼气中期进入临江，再视功法来源转场。
 if(ri>=1&&loc==='青石村')return travelSafe(api,'青石镇');
 if(ri>=1&&loc==='青石镇'){
   if(!s.player.manualLibraryIds?.includes('manual-five-elements-return')&&s.player.spiritStones>=9)tryLearn(api,'manual-five-elements-return');
   s=api.getState(); if(ri>=3&&s.player.location==='青石镇')return travelSafe(api,'临江城');
 }
 if(ri>=3&&loc==='临江城'){
   if(!s.player.manualLibraryIds?.includes('manual-mystic-water')&&s.player.spiritStones>=15)tryLearn(api,'manual-mystic-water');
   s=api.getState(); if(ri>=4&&s.player.location==='临江城')return travelSafe(api,'青云山');
 }
 if(ri>=4&&loc==='青云山'){
   // 青云引气诀属于旧系统功法，正常玩家可通过事件/商人获得；若已有则切换。
   const libs=s.player.manualLibraryIds||[]; if(libs.includes('manual-qingyun-qi')&&s.player.manual!=='青云引气诀')api.switchV31Manual('manual-qingyun-qi',false);
   if(ri>=6&&s.player.spiritStones<18)return travelSafe(api,'苍梧郡城');
 }
 if(loc==='苍梧郡城'&&s.player.spiritStones>=28)return travelSafe(api,'青云山');
 return false
}
function choose(api,s,step,profile){const p=s.player,ratio=(Number(p.hp)||0)/Math.max(1,hpMax(api,s)),inj=Number(p.injury)||0,stones=Number(p.spiritStones)||0;if(inj>=2||ratio<.5)return 'rest';if(stones<profile.stoneFloor)return 'work';if(step%profile.exploreEvery===0)return 'explore';if(step%profile.gatherEvery===0)return 'gather';if(step%profile.rumorEvery===0)return 'rumor';return 'cultivate'}
function runOne(seed,profile){const {api}=make(seed),curve=api.realmBalance();const start=api.getState(),startDay=dayNo(start);let steps=0,breakthroughFailures=0,travelCount=0,combatCount=0;const milestones={qi1:null,qi4:null,qi7:null,qi9:null,foundation:null};let minStones=Number(start.player.spiritStones)||0,maxFullStall=0,fullStall=0;const manuals=new Set([start.player.manual]),locations=new Set([start.player.location]);
 for(;steps<profile.maxActions;steps++){
  let s=api.getState();if(s.flags?.dead)break;const ri=Number(s.player.realmIndex)||0,elapsed=dayNo(s)-startDay;
  if(ri>=1&&milestones.qi1===null)milestones.qi1=elapsed;if(ri>=4&&milestones.qi4===null)milestones.qi4=elapsed;if(ri>=7&&milestones.qi7===null)milestones.qi7=elapsed;if(ri>=9&&milestones.qi9===null)milestones.qi9=elapsed;if(ri>=10&&milestones.foundation===null){milestones.foundation=elapsed;break}
  minStones=Math.min(minStones,Number(s.player.spiritStones)||0);manuals.add(s.player.manual);locations.add(s.player.location);
  if(api.getCombat?.()){combatCount++;settleCombat(api);continue}
  if(routeProgression(api)){travelCount++;s=api.getState();manuals.add(s.player.manual);locations.add(s.player.location);continue}
  const need=curve[ri]?.need??Infinity;if(Number(s.player.progress)>=need){fullStall++;maxFullStall=Math.max(maxFullStall,fullStall);const before=ri;api.attemptBreakthrough();settleCombat(api);if((api.getState().player.realmIndex||0)===before)breakthroughFailures++;else fullStall=0;continue}fullStall=0;
  const act=choose(api,s,steps+1,profile);api.action(act);settleCombat(api)
 }
 const end=api.getState();return {seed,profile:profile.name,actions:steps,days:dayNo(end)-startDay,finalRealm:Number(end.player.realmIndex)||0,finalProgress:Number(end.player.progress)||0,dead:!!end.flags?.dead,milestones,breakthroughFailures,maxFullStall,minStones,travelCount,manuals:[...manuals],locations:[...locations],final:{manual:end.player.manual,location:end.player.location,stones:Number(end.player.spiritStones)||0,herbs:Number(end.player.herbs)||0,sect:end.player.sect||null}}
}
const profiles=[{name:'balanced',maxActions:560,stoneFloor:10,exploreEvery:8,gatherEvery:12,rumorEvery:10},{name:'cultivation-heavy',maxActions:560,stoneFloor:7,exploreEvery:12,gatherEvery:16,rumorEvery:14},{name:'resource-aware',maxActions:560,stoneFloor:18,exploreEvery:10,gatherEvery:9,rumorEvery:11}];
const results=[];let seed=9201;for(const p of profiles)for(let i=0;i<2;i++)results.push(runOne(seed++,p));
const finite=(key)=>results.map(r=>r.milestones[key]).filter(Number.isFinite).sort((a,b)=>a-b);const med=a=>a.length?a[Math.floor(a.length/2)]:null,avg=a=>a.length?Number((a.reduce((x,y)=>x+y,0)/a.length).toFixed(1)):null;
const summary={runs:results.length,deaths:results.filter(r=>r.dead).length,reached:{qi1:finite('qi1').length,qi4:finite('qi4').length,qi7:finite('qi7').length,qi9:finite('qi9').length,foundation:finite('foundation').length},medianDays:{qi1:med(finite('qi1')),qi4:med(finite('qi4')),qi7:med(finite('qi7')),qi9:med(finite('qi9')),foundation:med(finite('foundation'))},averageDays:{qi1:avg(finite('qi1')),qi4:avg(finite('qi4')),qi7:avg(finite('qi7')),qi9:avg(finite('qi9')),foundation:avg(finite('foundation'))},manualUpgradeRuns:results.filter(r=>r.manuals.some(x=>x!=='基础吐纳诀')).length,travelRuns:results.filter(r=>r.travelCount>0).length,maxFullStall:Math.max(...results.map(r=>r.maxFullStall)),minSpiritStones:Math.min(...results.map(r=>r.minStones))};
const flags=[];if(summary.reached.qi9<4)flags.push('QI9_STILL_TOO_SLOW');if(summary.reached.foundation<3)flags.push('FOUNDATION_STILL_TOO_SLOW');if(summary.manualUpgradeRuns<4)flags.push('MANUAL_UPGRADE_UNRELIABLE');if(summary.deaths>1)flags.push('EARLY_SURVIVAL_TOO_HARSH');
fs.writeFileSync(OUT,JSON.stringify({phase:'8-round2-human-navigation',gameplay:'3.9.0',schema:36,generatedAt:new Date().toISOString(),summary,flags,results},null,2)+'\n');console.log('PHASE8_ROUND2',JSON.stringify({summary,flags}));
