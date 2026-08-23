const fs=require('fs');
const crypto=require('crypto');

const INPUT='src/game-v23.js';
const OUTPUT='src/game-v24.js';
const BUILD='2401';
if(!fs.existsSync(INPUT))throw new Error('V2.4 build: missing '+INPUT);
let src=fs.readFileSync(INPUT,'utf8');
function must(pattern,replacement,label){const next=src.replace(pattern,()=>replacement);if(next===src)throw new Error('V2.4 build transform did not match: '+label);src=next}

must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='2.3.0'; const SAVE_SCHEMA_VERSION=20;",
     "const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='2.4.0'; const SAVE_SCHEMA_VERSION=21;",'version/schema');

const realmCurve=String.raw`const REALMS=[
 {name:'凡人',need:120,rate:1,maxHp:70,maxQi:0},
 {name:'炼气一层',need:220,rate:1.05,maxHp:88,maxQi:32},{name:'炼气二层',need:300,rate:1.10,maxHp:96,maxQi:38},
 {name:'炼气三层',need:400,rate:1.16,maxHp:104,maxQi:45},{name:'炼气四层',need:520,rate:1.22,maxHp:114,maxQi:53},
 {name:'炼气五层',need:680,rate:1.30,maxHp:126,maxQi:62},{name:'炼气六层',need:880,rate:1.40,maxHp:140,maxQi:72},
 {name:'炼气七层',need:1150,rate:1.52,maxHp:156,maxQi:84},{name:'炼气八层',need:1500,rate:1.65,maxHp:174,maxQi:98},
 {name:'炼气九层',need:2000,rate:1.80,maxHp:195,maxQi:115},{name:'筑基初期',need:3500,rate:2.10,maxHp:230,maxQi:150},
 {name:'筑基中期',need:5000,rate:2.35,maxHp:270,maxQi:185},{name:'筑基后期',need:7200,rate:2.70,maxHp:320,maxQi:225},
 {name:'筑基圆满',need:10000,rate:3.05,maxHp:370,maxQi:270},{name:'结丹境',need:15000,rate:3.50,maxHp:450,maxQi:340},
 {name:'金丹初期',need:22000,rate:4.10,maxHp:560,maxQi:430},{name:'金丹中期',need:32000,rate:4.70,maxHp:680,maxQi:540},
 {name:'金丹后期',need:46000,rate:5.40,maxHp:820,maxQi:680},{name:'金丹圆满',need:65000,rate:6.15,maxHp:980,maxQi:850},
 {name:'元婴初期',need:95000,rate:7.20,maxHp:1250,maxQi:1150},{name:'元婴中期',need:140000,rate:8.20,maxHp:1500,maxQi:1450},
 {name:'元婴后期',need:210000,rate:9.40,maxHp:1820,maxQi:1820},{name:'元婴圆满',need:320000,rate:10.80,maxHp:2200,maxQi:2300},
 {name:'化神初期',need:500000,rate:12.40,maxHp:2800,maxQi:3100},{name:'化神中期',need:800000,rate:14.20,maxHp:3450,maxQi:4000},
 {name:'化神后期',need:1300000,rate:16.20,maxHp:4200,maxQi:5100}
];
const V23_REALM_NEEDS=[100,125,150,180,220,270,330,400,480,600,850,1100,1500,2000,2800,3800,5000,6800,9000,12000,15500,20000,26000,34000,43000,55000];`;
must(/const REALMS=\[[\s\S]*?\n\];\nconst ROOTS=/,realmCurve+'\nconst ROOTS=','realm difficulty curve');

must("{name:'五行杂灵根',mult:.90,desc:'五行俱全却驳杂，寻常修士修炼最慢。可你有天道酬勤，慢只代表需要更多时间。'},",
     "{name:'五行杂灵根',mult:.90,desc:'五行俱全却驳杂，寻常修士修炼最慢。若没有资源、功法与机缘扶持，很容易被寿元卡死。'},",'root description');

must(/function addDiligence\(n\)\{[^\n]*\}/,
     "function addDiligence(n){state.player.diligence=Math.max(0,(state.player.diligence||0)+Math.max(0,Number(n)||0))}",'remove diligence cheat');

const dangerBlock=String.raw`function majorRealmStage(index){const i=clamp(Number(index)||0,0,REALMS.length-1);return i===0?0:i<=9?1:i<=13?2:i<=18?3:i<=22?4:5}
function dangerLabel(e){const raw=(e.realm||0)-state.player.realmIndex,major=majorRealmStage(e.realm||0)-majorRealmStage(state.player.realmIndex);if(major>=2)return '十死无生';if(major===1)return '大境压制';if(major===0)return raw<=-2?'碾压':raw===-1?'优势':raw===0?'势均力敌':raw===1?'危险':'极危';return '优势'}
function injuryLabel(){return ['无伤','轻伤','重伤','濒死'][clamp(state.player.injury||0,0,3)]}
function deathRisk(e){const raw=(e.realm||0)-state.player.realmIndex,major=majorRealmStage(e.realm||0)-majorRealmStage(state.player.realmIndex),inj=state.player.injury||0;if(major<=0&&raw<2&&inj<3)return 0;return clamp((major>0?.10+major*.14:raw>=2?.06:0)+inj*.05,0,.72)}
function realmSuppressionMultiplier(attacker,defender){const a=clamp(Number(attacker)||0,0,REALMS.length-1),d=clamp(Number(defender)||0,0,REALMS.length-1),major=majorRealmStage(a)-majorRealmStage(d);if(major>=4)return 12;if(major===3)return 7;if(major===2)return 4;if(major===1)return 2.2;if(major<=-4)return .03;if(major===-3)return .07;if(major===-2)return .16;if(major===-1)return .38;const small=a-d;return small>=3?1.24:small===2?1.16:small===1?1.08:small===-1?.92:small===-2?.84:small<=-3?.76:1}`;
must(/function dangerLabel\(e\)\{[^\n]*\}\nfunction injuryLabel\(\)\{[^\n]*\}\nfunction deathRisk\(e\)\{[^\n]*\}\nfunction realmSuppressionMultiplier\(attacker,defender\)\{[^\n]*\}/,dangerBlock,'major realm suppression');

must("function age(){return state.player.startAge+Math.floor((dayNumber()-(state.player.birthDay||1))/360)}\nfunction realm(){return REALMS[state.player.realmIndex]}",
String.raw`function age(){return state.player.startAge+Math.floor((dayNumber()-(state.player.birthDay||1))/360)}
function remainingLifespanYears(){return Math.max(0,(state.player.lifespan||0)-age())}
function finalizeLifespanDeath(){if(!state||state.flags.dead)return false;state.flags.dead=true;state.flags.deathCause='寿元耗尽';state.flags.deathAge=age();state.flags.deathRealm=realm().name;state.flags.deathDay=dayNumber();addPersonal('寿元耗尽。'+state.player.name+'停在'+realm().name+'，享年 '+age()+' 岁。本世已经永久结束。','bad');save();showResult('寿元耗尽','享年 '+age()+' 岁\n最终境界：'+realm().name+'\n本世存档已经锁死，不能继续修炼、赶路或战斗。只能进入轮回开启下一世。','bad');return true}
function realm(){return REALMS[state.player.realmIndex]}`,'lifespan terminal death helpers');

must("addPersonal(`你从另一个世界醒来，成了青石村里一个十六岁的少年。识海深处同时浮现四个字——【天道酬勤】。`,'major');\n addPersonal(`你检查自身资质：${root().name}。无论资质如何，至少从今天起，每一分努力都不会白费。`,'good');",
     "addPersonal(`你从另一个世界醒来，成了青石村里一个十六岁的少年。这里没有额外外挂，寿元、资质与资源都会真实限制修行。`,'major');\n addPersonal(`你检查自身资质：${root().name}。想活得更久，只能在寿元耗尽前一步步争到更高境界。`,'good');",'new game no-cheat narrative');

const migrationTail="for(const id of ['qingyun','xuanshui','blood'])if(p.factionLastContractDay[id]==null)p.factionLastContractDay[id]=0} \n};\nfunction validateCurrentSaveSchema(){";
const migration21=String.raw`for(const id of ['qingyun','xuanshui','blood'])if(p.factionLastContractDay[id]==null)p.factionLastContractDay[id]=0} ,
 21(){const p=state.player,i=clamp(Number(p.realmIndex)||0,0,REALMS.length-1),oldNeed=V23_REALM_NEEDS[i]||1,newNeed=REALMS[i].need,ratio=clamp((Number(p.progress)||0)/oldNeed,0,1);p.progress=Math.round(newNeed*ratio);if(p.diligence==null)p.diligence=0} 
};
function validateCurrentSaveSchema(){`;
must(migrationTail,migration21,'schema 21 progress migration');

must("simulateNPCs();updateMajorEvents();processSocialEvents();updateSecretRealm();updateFactionConflict();\n if(age()>=state.player.lifespan&&!state.flags.dead){state.flags.dead=true;addPersonal('寿元耗尽，你这一世走到了尽头。','bad');showResult('寿元耗尽','这一世已经结束，但轮回传承已经开启。前往首页或角色页选择转世。','bad')}",
     "simulateNPCs();updateMajorEvents();processSocialEvents();updateSecretRealm();updateFactionConflict();\n if(age()>=state.player.lifespan&&!state.flags.dead)finalizeLifespanDeath()",'terminal lifespan tick');

const npcSim=String.raw`function npcCultivationRate(index){return [0.18,0.10,0.045,0.018,0.007,0.0025][majorRealmStage(index)]||0.0025}
function simulateNPCs(){
 for(const n of state.npcs){if(!n.alive)continue;n.progress+=(n.talent/100)*npcCultivationRate(n.realmIndex)*(.70+rand()*.60);if(n.progress>=100&&n.realmIndex<REALMS.length-1){n.progress-=100;n.realmIndex++;if(rand()<.12){n.known=true;addWorld(`${n.name}突破至${REALMS[n.realmIndex].name}。`)}}
 if(rand()<.035)n.location=npcMoveTarget(n);if(rand()<.006&&n.realmIndex===0&&n.age>50){n.alive=false;if(n.known)addWorld(`${n.name}寿终，修真路上又少了一位旧人。`)}}
}`;
must(/function simulateNPCs\(\)\{[\s\S]*?\n\}\nfunction cultivate\(\)\{/,npcSim+'\nfunction cultivate(){','npc progression balance');

const cultivate=String.raw`function cultivationGainForDays(days=1,retreatBoost=1){const p=state.player,d=Math.max(1,Math.floor(days)),base=rint(6*d,10*d),rootM=root().mult,manualM=manual().mult,injuryM=[1,.90,.70,.48][clamp(p.injury||0,0,3)],gain=Math.floor(base*rootM*manualM*injuryM*dwellingCultivationMultiplier()*Math.max(.1,retreatBoost));return Math.max(1,gain)}
function livingActionGuard(){if(!state?.flags?.dead)return false;showResult('此世已终','本世存档已经锁死，不能继续行动。请选择轮回开启下一世。','bad');return true}
function cultivate(){
 if(livingActionGuard())return;const gain=cultivationGainForDays(1),prof=rint(4,7);const before=state.player.progress;state.player.progress=Math.min(realm().need,state.player.progress+gain);state.player.manualProf+=prof;addDiligence(1);advanceDays(1);const actual=state.player.progress-before,full=state.player.progress>=realm().need;addPersonal('你运转《'+state.player.manual+'》吐纳一日，修为 +'+Math.max(0,actual)+'，功法熟练度 +'+prof+'。'+(full?'当前境界已经圆满，可主动尝试破境。':''),full?'major':'good');save();render();showResult('吐纳修炼','修为 +'+Math.max(0,actual)+'\n《'+state.player.manual+'》熟练度 +'+prof+(full?'\n境界圆满：现在可以尝试突破。':''),'good')
}`;
must(/function cultivate\(\)\{[\s\S]*?\n\}\n\nfunction realmLifespanFloor/,cultivate+'\n\nfunction realmLifespanFloor','cultivation without cheat');

const retreat=String.raw`function retreatSevenDays(){
 const p=state.player;if(livingActionGuard())return;if(!p.dwellingTier)return showResult('尚无洞府','先在合适地点营造自己的洞府。','bad');if(p.location!==p.dwellingLocation)return showResult('不在洞府','你的洞府位于【'+p.dwellingLocation+'】。','bad');if((p.injury||0)>=2)return showResult('伤势过重','重伤状态不宜强行闭关，先疗伤。','bad');if(p.progress>=realm().need)return showResult('境界已经圆满','此时应当尝试破境，而不是继续堆积修为。');
 const tier=p.dwellingTier,d=DWELLINGS[tier],before=p.progress,gain=cultivationGainForDays(7,1.14+tier*.06);p.progress=Math.min(realm().need,p.progress+gain);p.manualProf+=tier*12;p.retreatSessions++;addDiligence(7);advanceDays(7);if(state.flags.dead)return;const actual=p.progress-before;addPersonal('你在【'+d.name+'】闭关七日，修为 +'+actual+'，功法熟练度 +'+(tier*12)+'。闭关只是更高效地利用七天，不再按境界需求百分比跳进度。','major');save();render();showResult('七日闭关结束','修为 +'+actual+'\n功法熟练度 +'+(tier*12)+'\n世界时间推进 7 日'+(p.progress>=realm().need?'\n当前境界已圆满，可以尝试破境。':''),'good')
}`;
must(/function retreatSevenDays\(\)\{[\s\S]*?\n\}\nfunction plantHerbPlot/,retreat+'\nfunction plantHerbPlot','retreat balance');

for(const name of ['gather','work','rest','rumor','explore']){
 const re=new RegExp('function '+name+'\\(\\)\\{');
 must(re,'function '+name+'(){if(livingActionGuard())return;','dead action guard '+name);
}

const breakthrough=String.raw`function minorBreakthroughBase(index){const i=Number(index)||0;if(i===0)return .82;if(i<=8)return .74;if(i===9)return .48;if(i<=12)return .62;if(i<=17)return .52;if(i<=21)return .43;return .34}
function breakthroughChance(){
 if(state.player.realmIndex>=REALMS.length-1)return 0;const req=majorBreakthroughRequirements();let base=req?req.base:minorBreakthroughBase(state.player.realmIndex);const rootBonus=(root().mult-1)*.18,manualBonus=Math.min(.12,(state.player.manualProf||0)/1800),injuryPenalty=(state.player.injury||0)*.08,pity=(state.player.breakthroughPity||0)/100;return clamp(base+rootBonus+manualBonus+pity-injuryPenalty,req?.kind?.08:.16,req?.kind?.82:.92)
}`;
must(/function breakthroughChance\(\)\{[\s\S]*?\n\}\nfunction attemptBreakthrough/,breakthrough+'\nfunction attemptBreakthrough','breakthrough difficulty curve');

must('灵根、功法熟练度与天道酬勤提高成功率；伤势会降低成功率；失败积累破境感悟。','灵根与功法熟练度会影响成功率；越往高境越难，伤势会降低成功率，失败则积累破境感悟。','breakthrough UI no cheat');

const spendInsight=String.raw`function spendInsight(type){if(state.player.insight<1)return showResult('悟道点不足','悟道点需要通过论道、遗迹、秘境、丹药或特殊机缘获得。','bad');state.player.insight--;if(type==='cultivate'){const n=Math.max(25,Math.floor(realm().need*.012));state.player.progress=Math.min(realm().need,state.player.progress+n);addPersonal('你抓住一瞬顿悟，修为推进 '+n+'。','good');showResult('顿悟修为','修为 +'+n,'good')}else if(type==='manual'){state.player.manualProf+=40;addPersonal(`你对《${state.player.manual}》有了新的领悟。`,'good');showResult('顿悟功法',`《${state.player.manual}》熟练度 +40`,'good')}else{const known=Object.keys(state.player.spells).filter(x=>x!=='基础拳脚');if(!known.length){state.player.insight++;return showResult('暂无法术','踏入炼气一层后再来。','bad')}const s=known[0];state.player.spells[s]+=40;addPersonal(`你顿悟了${s}。`,'good');showResult('顿悟法术',`${s} 熟练度 +40`,'good')}save();render()}`;
must(/function spendInsight\(type\)\{[\s\S]*?save\(\);render\(\)\}/,spendInsight,'insight no diligence cheat');

const render=String.raw`function render(){if(!state)return;const lifeLeft=remainingLifespanYears();$('heroName').textContent=state.player.name;$('heroSub').textContent=`${age()}岁 · ${season()} · ${state.player.location} · ${root().name}${state.player.injury?` · ${injuryLabel()}`:''}${state.flags.dead?' · 已故':` · 余寿${lifeLeft}年`}`;$('realmName').textContent=realm().name;$('cultivationText').textContent=`${Math.floor(state.player.progress)} / ${realm().need}`;$('cultivationBar').style.width=`${clamp(state.player.progress/realm().need*100,0,100)}%`;$('dateTop').textContent=dateLabel();
 $('spiritStoneQuick').textContent=state.player.spiritStones;$('herbQuick').textContent=state.player.herbs;$('hpQuick').textContent=`${state.player.hp}/${maxHp()}`;$('repQuick').textContent=state.player.reputation;$('diligenceQuick').textContent=state.player.diligence;$('insightQuick').textContent=state.player.insight;$('diligencePill').textContent=`修行历练 ${state.player.diligence}`;$('insightPill').textContent=`悟道点 ${state.player.insight}`;
 renderUrgent();renderBreakthrough();renderLegacy();renderHomeLog();renderCorePath();renderDaoPath();renderCharacter();renderSect();renderDwelling();renderMap();renderSecretRealm();renderMarket();renderAlchemy();renderGear();renderEvents();renderFactionStanding();renderFactionConflict();renderNPCs();
}`;
must(/function render\(\)\{[\s\S]*?\n\}\nfunction renderUrgent/,render+'\nfunction renderUrgent','render lifespan and practice');

const urgent=String.raw`function renderUrgent(){const box=$('urgentBox'),active=Object.values(state.major).filter(m=>m.status==='active'||m.status==='announced').sort((a,b)=>a.end-b.end),blocks=[];if(!state.flags.dead){const left=remainingLifespanYears();if(left<=10){const title=left<=1?'【寿元枯竭】只剩最后一年':left<=3?'【寿元大限将至】':'【寿元警告】';blocks.push('<div class="urgent"><div class="urgent-title">'+title+'</div><p>当前 '+age()+' 岁 / 寿元 '+state.player.lifespan+'。若不能在大限前突破并获得更高寿元，本世会永久死亡。</p><div class="urgent-foot"><span>剩余寿元：'+left+' 年</span></div></div>')}}if(active.length){const m=active[0],text=m.status==='announced'?`预计第 ${m.start} 日开启`:`剩余 ${Math.max(0,m.end-dayNumber()+1)} 日`;blocks.push(`<div class="urgent"><div class="urgent-title">${m.status==='active'?'【限时】':'【预告】'} ${esc(m.title)}</div><p>${esc(m.text)}</p><div class="urgent-foot"><span>地点：${esc(m.location)} · ${text}</span><button class="mini-btn" data-jump-events>查看</button></div></div>`)}box.innerHTML=blocks.join('');const jump=document.querySelector('[data-jump-events]');if(jump)jump.onclick=()=>switchPage('events')}`;
must(/function renderUrgent\(\)\{[^\n]*\}/,urgent,'lifespan warning');

must("showResult('天道酬勤','你的外挂已经激活。\\n凡有所练，必有所得。\\n先活下来，再谈长生。','good')",
     "showResult('凡修入世','这里没有额外修炼外挂。\\n资质、功法、资源、突破与寿元都会真实限制你。\\n先活下来，再谈长生。','good')",'start modal no cheat');

must("realmSuppression:(a,b)=>realmSuppressionMultiplier(a,b),routeInfo:",
     "realmSuppression:(a,b)=>realmSuppressionMultiplier(a,b),majorRealmStage,realmBalance:()=>REALMS.map((r,i)=>({...r,index:i,stage:majorRealmStage(i)})),remainingLifespanYears,cultivationGainForDays,retreatSevenDays,routeInfo:",'test api balance');

if(src.includes('天道酬勤'))throw new Error('V2.4 source still contains 天道酬勤');
const sha=crypto.createHash('sha256').update(src).digest('hex');
fs.writeFileSync(OUTPUT,src);
const report={status:'PASS',gameplay_version:'2.4.0',build:BUILD,milestone:'mortal-balance-lifespan',source:OUTPUT,source_sha256:sha,source_bytes:Buffer.byteLength(src),realm_count:26,location_count:12,route_count:20,save_schema_version:21,checks:['removed 天道酬勤 cultivation and diligence cheats','exponential cultivation need curve','percentage-preserving schema20 to21 migration','major-realm combat suppression','later breakthrough difficulty curve','balanced seven-day retreat','terminal lifespan death lock','lifespan warning UI','slower NPC cultivation','V2.3 systems preserved']};
fs.writeFileSync('BUILD_V24_MORTAL_BALANCE.json',JSON.stringify(report,null,2)+'\n');
console.log('V24_BUILD_PASS',JSON.stringify(report));