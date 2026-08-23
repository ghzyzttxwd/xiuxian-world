(() => {
'use strict';
const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='0.2.0';
let deferredInstallPrompt=null; let state=null; let combat=null;
const $=id=>document.getElementById(id); const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const REALMS=[
 {name:'凡人',need:100,rate:1,maxHp:70,maxQi:0},
 {name:'炼气一层',need:125,rate:1.05,maxHp:88,maxQi:32},{name:'炼气二层',need:150,rate:1.10,maxHp:96,maxQi:38},
 {name:'炼气三层',need:180,rate:1.16,maxHp:104,maxQi:45},{name:'炼气四层',need:220,rate:1.22,maxHp:114,maxQi:53},
 {name:'炼气五层',need:270,rate:1.30,maxHp:126,maxQi:62},{name:'炼气六层',need:330,rate:1.40,maxHp:140,maxQi:72},
 {name:'炼气七层',need:400,rate:1.52,maxHp:156,maxQi:84},{name:'炼气八层',need:480,rate:1.65,maxHp:174,maxQi:98},
 {name:'炼气九层',need:600,rate:1.80,maxHp:195,maxQi:115},{name:'筑基初期',need:850,rate:2.10,maxHp:230,maxQi:150},
 {name:'筑基中期',need:1100,rate:2.35,maxHp:270,maxQi:185},{name:'筑基后期',need:1500,rate:2.70,maxHp:320,maxQi:225}
];
const ROOTS=[
 {name:'五行杂灵根',mult:.90,desc:'五行俱全却驳杂，寻常修士修炼最慢。可你有天道酬勤，慢只代表需要更多时间。'},
 {name:'四灵根',mult:1.00,desc:'资质普通，是修真界最常见的一类灵根。'},
 {name:'三灵根',mult:1.10,desc:'资质尚可，若有资源与合适功法，筑基并非奢望。'},
 {name:'双灵根',mult:1.25,desc:'资质出众，各宗门都会愿意收入门下。'},
 {name:'单灵根',mult:1.45,desc:'罕见资质，修炼速度远超常人。'},
 {name:'天灵根',mult:1.70,desc:'万中无一。若不夭折，天然就是宗门真传的苗子。'}
];
const LOCATIONS={
 '青石村':{desc:'偏僻山村，灵气稀薄，但胜在安稳。',links:{'青石镇':1}},
 '青石镇':{desc:'凡人与低阶散修混居的小镇。',links:{'青石村':1,'临江城':2,'黑风岭':2}},
 '临江城':{desc:'方圆数百里最大的修士聚集地，坊市与散修云集。',links:{'青石镇':2,'青云山':3,'黑风岭':2}},
 '黑风岭':{desc:'妖兽横行，灵药也比外界更多。',links:{'青石镇':2,'临江城':2}},
 '青云山':{desc:'青云宗山门所在，常年有护山阵法笼罩。',links:{'临江城':3}}
};
const NPC_NAMES=['陈玄','苏青禾','赵长生','韩烈','沈玉书','林晚照','周鹤','顾平川','叶小满','陆昭','魏七','白芷','宁川','谢无咎','唐雨眠','许观山'];
const FACTIONS=['散修','青云宗','玄水帮','血刀门'];
const MANUALS={
 '基础吐纳诀':{quality:'凡阶下品',mult:1.00,desc:'最粗浅的吐纳法门。胜在门槛低，凡人也能照着练。'},
 '青云引气诀':{quality:'凡阶上品',mult:1.22,desc:'青云宗外门功法，行气平稳，适合炼气期长期修习。'},
 '赤炎诀':{quality:'黄阶下品',mult:1.36,desc:'火行功法，修炼迅猛，但行功时更易燥热伤身。'}
};
const SPELLS={
 '基础拳脚':{quality:'凡俗',qi:0,power:8,desc:'没有法术时，拳脚就是最后的依仗。'},
 '火弹术':{quality:'凡阶法术',qi:8,power:21,desc:'凝聚一团火灵力射向敌人，炼气修士最常见的攻伐法术。'},
 '御风步':{quality:'凡阶法术',qi:6,power:0,desc:'轻身提速，战斗中可提高逃跑和闪避机会。'}
};
const ENEMIES=[
 {name:'灰背野狼',realm:0,hp:42,atk:[5,9],reward:{stones:[0,1],rep:0},weight:45},
 {name:'山道劫匪',realm:0,hp:55,atk:[6,11],reward:{stones:[1,3],rep:1},weight:35},
 {name:'铁背狼妖',realm:1,hp:78,atk:[9,15],reward:{stones:[2,5],rep:2},weight:20}
];
function rand(){state.rng=(Math.imul(state.rng,1664525)+1013904223)>>>0;return state.rng/4294967296}
function rint(a,b){return Math.floor(rand()*(b-a+1))+a} function pick(arr){return arr[Math.floor(rand()*arr.length)]}
function weightedEnemy(){let n=rand()*100;for(const e of ENEMIES){n-=e.weight;if(n<=0)return e}return ENEMIES[0]}
function dayNumber(){return (state.time.year-1)*360+(state.time.month-1)*30+state.time.day}
function dateLabel(){return `第${state.time.year}年 · ${state.time.month}月${state.time.day}日`}
function season(){return ['春','夏','秋','冬'][Math.floor((state.time.month-1)/3)]}
function age(){return state.player.startAge+Math.floor((dayNumber()-1)/360)}
function realm(){return REALMS[state.player.realmIndex]}
function root(){return ROOTS[state.player.rootIndex]}
function manual(){return MANUALS[state.player.manual]}
function maxHp(){return realm().maxHp} function maxQi(){return realm().maxQi}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function addPersonal(text,type=''){state.personalLog.unshift({day:dayNumber(),date:dateLabel(),text,type});state.personalLog=state.personalLog.slice(0,60)}
function addWorld(text,type=''){state.worldLog.unshift({day:dayNumber(),date:dateLabel(),text,type});state.worldLog=state.worldLog.slice(0,80)}
function addDiligence(n){state.player.diligence+=n;let gained=0;while(state.player.diligence>=20){state.player.diligence-=20;state.player.insight++;gained++}if(gained)addPersonal(`【天道酬勤】勤勉积满，凝聚悟道点 +${gained}。`,'good')}
function createNPCs(){return NPC_NAMES.map((name,i)=>({id:i+1,name,age:rint(16,55),faction:pick(FACTIONS),location:pick(Object.keys(LOCATIONS)),realmIndex:rint(0,4),progress:rint(0,90),talent:rint(70,130),alive:true,ambition:rint(15,95),courage:rint(20,95),wealth:rint(0,20),relation:0,grudge:0,known:i<6}))}
function chooseRoot(){let x=rand()*100;return x<35?0:x<60?1:x<80?2:x<92?3:x<99?4:5}
function newState(name){
 const seed=((Date.now()^Math.floor(Math.random()*0xffffffff))>>>0)||123456789;
 state={version:VERSION,rng:seed,time:{year:1,month:1,day:1},player:{name:name||'陆尘',startAge:16,lifespan:82,realmIndex:0,progress:0,spiritStones:3,herbs:1,reputation:0,location:'青石村',rootIndex:0,manual:'基础吐纳诀',manualProf:0,spells:{'基础拳脚':0},diligence:0,insight:0,hp:70,qi:0},world:{beastPressure:48,qingyunPower:72,bloodBladePower:44,marketIndex:100,casualties:0},npcs:[],personalLog:[],worldLog:[],flags:{},major:{},pendingEvent:null};
 state.player.rootIndex=chooseRoot();state.npcs=createNPCs();
 addPersonal(`你从另一个世界醒来，成了青石村里一个十六岁的少年。识海深处同时浮现四个字——【天道酬勤】。`,'major');
 addPersonal(`你检查自身资质：${root().name}。无论资质如何，至少从今天起，每一分努力都不会白费。`,'good');
 addWorld('青云宗传出消息：近期仍会照例巡查附近村镇，挑选有灵根的少年。');save();
}
function normalizeLoaded(){
 if(!state.player.rootIndex&&state.player.rootIndex!==0)state.player.rootIndex=1;if(!state.player.manual)state.player.manual='基础吐纳诀';if(state.player.manualProf==null)state.player.manualProf=0;if(!state.player.spells)state.player.spells={'基础拳脚':0};if(state.player.diligence==null)state.player.diligence=0;if(state.player.insight==null)state.player.insight=0;if(state.player.hp==null)state.player.hp=maxHp();if(state.player.qi==null)state.player.qi=maxQi();
 for(const n of state.npcs||[]){if(n.relation==null)n.relation=0;if(n.grudge==null)n.grudge=0;if(n.known==null)n.known=false}
 state.version=VERSION;
}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true}catch(e){console.error(e);return false}}
function load(){try{const raw=localStorage.getItem(SAVE_KEY)||localStorage.getItem(OLD_KEY);if(!raw)return false;state=JSON.parse(raw);normalizeLoaded();save();return true}catch(e){console.error(e);return false}}
function tickOneDay(){
 state.time.day++;if(state.time.day>30){state.time.day=1;state.time.month++;if(state.time.month>12){state.time.month=1;state.time.year++}}
 if(dayNumber()%7===0){state.world.marketIndex=clamp(state.world.marketIndex+rint(-4,4),76,135);state.world.beastPressure=clamp(state.world.beastPressure+rint(0,4),0,100)}
 simulateNPCs();updateMajorEvents();
 if(age()>=state.player.lifespan&&!state.flags.dead){state.flags.dead=true;addPersonal('寿元耗尽，你这一世走到了尽头。','bad');showResult('寿元耗尽','这一世已经结束。后续版本会加入夺舍、转世与传承。','bad')}
}
function advanceDays(days){for(let i=0;i<days&&!state.flags.dead;i++)tickOneDay();state.player.qi=Math.min(maxQi(),state.player.qi+Math.max(2,Math.floor(maxQi()*.15))*days);save();render()}
function simulateNPCs(){
 for(const n of state.npcs){if(!n.alive)continue;n.progress+=Math.max(1,Math.floor((n.talent/100)*rint(1,4)));if(n.progress>=100&&n.realmIndex<8){n.progress-=100;n.realmIndex++;if(rand()<.12){n.known=true;addWorld(`${n.name}突破至${REALMS[n.realmIndex].name}。`)}}
 if(rand()<.025)n.location=pick(Object.keys(LOCATIONS));if(rand()<.006&&n.realmIndex===0&&n.age>50){n.alive=false;if(n.known)addWorld(`${n.name}寿终，修真路上又少了一位旧人。`)}
 if(rand()<.01){const other=pick(state.npcs.filter(x=>x.id!==n.id&&x.alive));if(other){if(rand()<.55){n.relation=clamp(n.relation+1,-100,100);other.relation=clamp(other.relation+1,-100,100)}else{n.grudge=clamp(n.grudge+1,0,100);other.grudge=clamp(other.grudge+1,0,100)}}}}
}
function cultivate(){
 const base=rint(6,10);const rootM=root().mult;const manualM=manual().mult;const cheatM=1.5;const gain=Math.max(1,Math.floor(base*rootM*manualM*cheatM));state.player.progress+=gain;const prof=rint(4,7)*2;state.player.manualProf+=prof;addDiligence(3);let breakthrough=[];
 while(state.player.progress>=realm().need&&state.player.realmIndex<REALMS.length-1){state.player.progress-=realm().need;state.player.realmIndex++;state.player.hp=maxHp();state.player.qi=maxQi();breakthrough.push(REALMS[state.player.realmIndex].name);if(state.player.realmIndex===1&&!('火弹术'in state.player.spells)){state.player.spells['火弹术']=0;state.player.spells['御风步']=0;addPersonal('踏入炼气一层后，你终于能够驱使灵力，摸索出了火弹术与御风步。','major')}}
 advanceDays(1);addPersonal(`你运转《${state.player.manual}》吐纳一日，修为 +${gain}，功法熟练度 +${prof}。${breakthrough.length?` 一举突破至${breakthrough.join('、')}！`:''}`,breakthrough.length?'major':'good');save();render();showResult('吐纳修炼',`修为 +${gain}\n《${state.player.manual}》熟练度 +${prof}${breakthrough.length?`\n突破：${breakthrough.join('、')}`:''}`,'good')
}
function gather(){advanceDays(1);const n=rint(1,3)+(state.player.location==='黑风岭'?1:0);state.player.herbs+=n;addDiligence(2);addPersonal(`你在${state.player.location}附近采到 ${n} 株可用灵草。`,'good');save();render();showResult('采集灵草',`灵草 +${n}${state.player.location==='黑风岭'?'\n黑风岭资源更丰富，但也更危险。':''}`,'good')}
function work(){advanceDays(1);const n=rint(1,2);state.player.spiritStones+=n;addDiligence(1);addPersonal(`你替人做了一天杂活，换得 ${n} 块灵石。`);save();render();showResult('谋生换钱',`灵石 +${n}`,'good')}
function rest(){advanceDays(1);const before=state.player.hp;state.player.hp=Math.min(maxHp(),state.player.hp+Math.ceil(maxHp()*.45));state.player.qi=maxQi();addDiligence(1);addPersonal('你闭门休息了一整日，气血与灵力恢复。');save();render();showResult('闭门休整',`气血 +${state.player.hp-before}\n灵力恢复至满值`,'good')}
function rumor(){advanceDays(1);addDiligence(1);let msg;if(state.major.recruit?.status==='announced')msg='青云宗收徒之日临近，附近不少少年已经启程。';else if(state.world.beastPressure>68)msg='黑风岭里的妖兽越来越躁动，山脚猎户已经不敢深入。';else msg=pick(['临江城坊市最近灵米涨价。','有人说血刀门在暗中招揽散修。','青云山近日有剑光划过云海。','一个散修在黑风岭捡到残破储物袋，一夜暴富。']);addWorld(msg);addPersonal(`你花了一天四处打听：${msg}`);save();render();showResult('打听消息',msg)}
function explore(){
 advanceDays(1);addDiligence(2);const x=rand();if(x<.27){startCombat(weightedEnemy());return}if(x<.57){startMinorEvent();return}if(x<.73){const n=rint(1,4);state.player.spiritStones+=n;addPersonal(`你在一处废弃石缝里发现 ${n} 块灵石。`,'good');save();render();showResult('意外收获',`你找到了一只破布袋。\n灵石 +${n}`,'good');return}addPersonal('你在附近转了一圈，没有碰见特别的事。');save();render();showResult('附近探索','这一日风平浪静。修真界并不是每天都有奇遇。')
}
function startMinorEvent(){
 const type=pick(['wounded','merchant','cave','npc']);
 if(type==='wounded'){
  const npc=pick(state.npcs.filter(n=>n.alive));npc.known=true;showChoice('林间求救',`你发现${npc.name}靠在树下，衣襟染血，远处似乎还有追兵。`,[
   {label:'拿一株灵草救人',disabled:state.player.herbs<1,fn:()=>{state.player.herbs--;npc.relation=clamp(npc.relation+12,-100,100);state.player.reputation+=2;addPersonal(`你救下${npc.name}，这份人情被对方牢牢记住。`,'good');showResult('救人一命',`${npc.name} 对你的关系 +12\n声望 +2`,'good')}},
   {label:'趁火打劫',fn:()=>{const s=rint(2,5);state.player.spiritStones+=s;npc.grudge=clamp(npc.grudge+25,0,100);npc.relation=clamp(npc.relation-20,-100,100);addPersonal(`你从重伤的${npc.name}身上拿走${s}块灵石。对方看你的眼神，你不会忘。`,'bad');showResult('趁火打劫',`灵石 +${s}\n${npc.name} 仇恨 +25`,'bad')}},
   {label:'不惹麻烦',fn:()=>{addPersonal(`你没有卷入${npc.name}的麻烦。`);showResult('转身离开','你保住了自己，也没有得到任何东西。')}}]);
 }else if(type==='merchant')showChoice('落魄散修',`一名散修急着离开此地，愿用 2 块灵石卖你一册《青云引气诀》抄本。`,[
  {label:'买下功法（2灵石）',disabled:state.player.spiritStones<2,fn:()=>{state.player.spiritStones-=2;state.player.manual='青云引气诀';state.player.manualProf=0;addPersonal('你买下《青云引气诀》，立刻换掉了原先粗浅的吐纳法。','major');showResult('更换功法','获得《青云引气诀》\n当前修炼效率提高。','good')}},
  {label:'算了',fn:()=>showResult('没有交易','你没有花这笔灵石。')}]);
 else if(type==='cave')showChoice('岩壁后的洞口',`你发现一处被藤蔓遮住的狭小山洞。里面吹出凉风，也隐约有腥气。`,[
  {label:'进去看看',fn:()=>{if(rand()<.5){const s=rint(3,7);state.player.spiritStones+=s;showResult('废弃洞府',`你找到前人留下的灵石 ${s} 块。`,'good')}else{startCombat({...ENEMIES[2]})}}},
  {label:'谨慎离开',fn:()=>showResult('谨慎离开','未知的洞府也可能是坟墓。你没有冒险。')}]);
 else {const npc=pick(state.npcs.filter(n=>n.alive));npc.known=true;showChoice('偶遇同道',`你在路上遇见${npc.name}（${npc.faction}，${REALMS[npc.realmIndex].name}）。对方也在打量你。`,[
  {label:'上前攀谈',fn:()=>{npc.relation=clamp(npc.relation+rint(4,9),-100,100);showResult('结识同道',`${npc.name} 对你的关系有所提升。`,'good')}},
  {label:'点头而过',fn:()=>showResult('擦肩而过','你们彼此记住了脸，却没有深谈。')}]);}
}
function showChoice(title,text,choices){let html=`<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="modal-actions">`;choices.forEach((c,i)=>{html+=`<button data-choice="${i}" ${c.disabled?'disabled':''}>${esc(c.label)}</button>`});html+='</div>';openModal(html);document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{const c=choices[+b.dataset.choice];if(c.disabled)return;closeModal();c.fn();save();render()})}
function startCombat(enemyTemplate){const e=JSON.parse(JSON.stringify(enemyTemplate));combat={enemy:e,enemyHp:e.hp,playerHp:state.player.hp,playerQi:state.player.qi,defending:false,logs:[`你遭遇了${e.name}。`]};renderCombat()}
function renderCombat(){const e=combat.enemy;const pPct=clamp(combat.playerHp/maxHp()*100,0,100);const ePct=clamp(combat.enemyHp/e.hp*100,0,100);let html=`<h2>遭遇战</h2><div class="combatants"><div class="fighter"><b>${esc(state.player.name)}</b><div class="hp">气血 ${combat.playerHp}/${maxHp()} · 灵力 ${combat.playerQi}/${maxQi()}</div><div class="bar"><i style="width:${pPct}%"></i></div></div><div class="vs">VS</div><div class="fighter"><b>${esc(e.name)}</b><div class="hp">气血 ${combat.enemyHp}/${e.hp}</div><div class="bar"><i style="width:${ePct}%"></i></div></div></div><div class="combat-log">${combat.logs.slice(-8).map(x=>`• ${esc(x)}<br>`).join('')}</div><div class="modal-actions two"><button data-combat="attack">拳脚攻击</button><button data-combat="spell" ${!('火弹术'in state.player.spells)||combat.playerQi<SPELLS['火弹术'].qi?'disabled':''}>火弹术</button><button data-combat="defend">防御</button><button data-combat="flee">逃跑</button></div>`;openModal(html,false);document.querySelectorAll('[data-combat]').forEach(b=>b.onclick=()=>combatAction(b.dataset.combat))}
function combatAction(a){if(!combat)return;combat.defending=false;if(a==='attack'){const prof=state.player.spells['基础拳脚']||0;const dmg=rint(7,12)+state.player.realmIndex*3+Math.floor(prof/40);combat.enemyHp-=dmg;state.player.spells['基础拳脚']=prof+2;combat.logs.push(`你一拳击中${combat.enemy.name}，造成 ${dmg} 点伤害。`)}
 else if(a==='spell'){const sp=SPELLS['火弹术'];combat.playerQi-=sp.qi;const prof=state.player.spells['火弹术']||0;const dmg=sp.power+rint(2,8)+state.player.realmIndex*4+Math.floor(prof/15);combat.enemyHp-=dmg;state.player.spells['火弹术']=prof+4;combat.logs.push(`火弹炸开，造成 ${dmg} 点伤害。`)}
 else if(a==='defend'){combat.defending=true;combat.logs.push('你收敛气息，专心防守。')}
 else if(a==='flee'){const chance=.42+(('御风步'in state.player.spells)?Math.min(.28,(state.player.spells['御风步']||0)/200):0);if(rand()<chance){state.player.hp=Math.max(1,combat.playerHp);state.player.qi=combat.playerQi;addPersonal(`你从${combat.enemy.name}手中脱身。`);combat=null;save();render();closeModal();showResult('成功脱身','你没有继续纠缠。');return}else combat.logs.push('你试图逃跑，但被拦了下来。')}
 if(combat.enemyHp<=0){finishCombat(true);return}
 const edmg=Math.max(1,rint(combat.enemy.atk[0],combat.enemy.atk[1])-(combat.defending?rint(3,7):0)-Math.floor(state.player.realmIndex*.7));combat.playerHp-=edmg;combat.logs.push(`${combat.enemy.name}反击，造成 ${edmg} 点伤害。`);if(combat.playerHp<=0){finishCombat(false);return}renderCombat()}
function finishCombat(win){const e=combat.enemy;if(win){const stones=rint(e.reward.stones[0],e.reward.stones[1]);state.player.spiritStones+=stones;state.player.reputation+=e.reward.rep;state.player.hp=Math.max(1,combat.playerHp);state.player.qi=combat.playerQi;addDiligence(3);addPersonal(`你击败${e.name}。${stones?`获得${stones}块灵石。`:''}`,'good');combat=null;closeModal();save();render();showResult('战斗胜利',`${stones?`灵石 +${stones}\n`:''}${e.reward.rep?`声望 +${e.reward.rep}\n`:''}气血剩余 ${state.player.hp}/${maxHp()}`,'good')}
 else {const lost=Math.min(state.player.spiritStones,rint(0,2));state.player.spiritStones-=lost;state.player.hp=Math.max(1,Math.ceil(maxHp()*.3));state.player.qi=0;addPersonal(`你败在${e.name}手下，拖着伤势逃了回来。`,'bad');combat=null;closeModal();save();render();showResult('战斗失败',`你没有死亡，但受了重伤。${lost?`\n遗失灵石 ${lost}`:''}`,'bad')}}
function majorDef(id,title,location,announce,start,end,text){return{id,title,location,announce,start,end,text}}
const MAJORS=[majorDef('recruit','青云宗开山收徒','青云山',4,8,12,'青云宗将在山门外测验灵根。资质出众者可直接入门，普通人也可能得到杂役弟子的机会。'),majorDef('cave','苍梧古洞现世','黑风岭',25,30,36,'黑风岭深处出现古修洞府霞光，各方散修已经闻风而动。')];
function getMajor(id){return state.major[id]}
function ensureMajor(d,status){if(!state.major[d.id])state.major[d.id]={...d,status,participated:false};return state.major[d.id]}
function updateMajorEvents(){const dn=dayNumber();for(const d of MAJORS){if(dn>=d.announce&&!state.major[d.id]){ensureMajor(d,'announced');addWorld(`【天下大事】${d.title}：${d.text}`,'major')}const m=state.major[d.id];if(!m)continue;if(dn>=d.start&&dn<=d.end&&!m.participated&&m.status!=='ended')m.status='active';if(dn>d.end&&!m.participated&&m.status!=='ended'){m.status='ended';autoResolveMajor(m)}}
 if(state.world.beastPressure>=74&&!state.major.beast){const start=dayNumber()+2;state.major.beast={id:'beast',title:'黑风岭兽潮','location':'黑风岭',announce:dayNumber(),start,end:start+5,text:'黑风岭群兽躁动，青石镇已向附近修士求援。',status:'announced',participated:false};addWorld('【紧急大事】黑风岭兽潮将至！青石镇向四方修士求援。','major')}
 const b=state.major.beast;if(b){if(dayNumber()>=b.start&&dayNumber()<=b.end&&!b.participated&&b.status!=='ended')b.status='active';if(dayNumber()>b.end&&!b.participated&&b.status!=='ended'){b.status='ended';autoResolveMajor(b)}}}
function autoResolveMajor(m){if(m.id==='recruit'){addWorld('青云宗本次收徒结束。数十名少年入门，各自命运自此分流。','major')}else if(m.id==='beast'){const win=state.world.qingyunPower+rint(-15,15)>state.world.beastPressure;if(win){state.world.beastPressure=38;addWorld('青云宗与附近散修联手压下兽潮，青石镇保住了。','major')}else{state.world.casualties+=rint(80,250);state.world.beastPressure=55;addWorld(`兽潮冲破防线，青石镇死伤惨重。已记录死亡 ${state.world.casualties} 人。`,'bad')}}else if(m.id==='cave'){const npc=pick(state.npcs.filter(n=>n.alive));npc.known=true;npc.realmIndex=Math.min(npc.realmIndex+1,8);addWorld(`${m.title}关闭。传闻${npc.name}在洞府中获得机缘，修为大进。`,'major')}}
function participateMajor(id){const m=state.major[id];if(!m||m.status!=='active')return showResult('无法参与','这个事件现在并不处于可参与阶段。','bad');if(state.player.location!==m.location)return showResult('路途未至',`需要先前往【${m.location}】。事件不会等你。`,'bad');m.participated=true;m.status='ended';if(id==='recruit'){if(root().mult>=1.25||state.player.realmIndex>=1){state.player.manual='青云引气诀';state.player.manualProf=Math.max(10,state.player.manualProf);state.player.reputation+=6;addPersonal('你通过青云宗测验，被收入外门，并得到《青云引气诀》。','major');showResult('青云宗收徒',`你通过测试，成为青云宗外门弟子。\n获得《青云引气诀》\n声望 +6`,'good')}else{state.player.reputation+=2;addPersonal('你的灵根并不出众，但你在试炼中的坚持被执事记住，得到一本《青云引气诀》抄本。','good');state.player.manual='青云引气诀';showResult('青云宗收徒',`没有一步登天，但你拿到了真正的修仙功法。\n获得《青云引气诀》`,'good')}}
 else if(id==='beast'){startCombat({name:'兽潮中的铁背狼妖',realm:1,hp:92,atk:[10,17],reward:{stones:[4,8],rep:6},weight:1});state.world.beastPressure=Math.max(30,state.world.beastPressure-18)}
 else if(id==='cave'){const gain=rint(35,70);state.player.progress+=gain;state.player.spiritStones+=rint(4,9);state.player.reputation+=3;addPersonal('你闯入苍梧古洞，在残破石室里得到一缕精纯灵气与散落灵石。','major');showResult('古洞机缘',`修为 +${gain}\n灵石有所增加\n声望 +3`,'good')}save();render()}
function travel(to){const from=state.player.location;const days=LOCATIONS[from]?.links[to];if(!days)return;advanceDays(days);state.player.location=to;addDiligence(1);addPersonal(`你从${from}赶路 ${days} 日，抵达${to}。`);save();render();showResult('赶路',`${from} → ${to}\n耗时 ${days} 日`)}
function spendInsight(type){if(state.player.insight<1)return showResult('悟道点不足','每积累 20 点勤勉，可自动凝聚 1 点悟道点。','bad');state.player.insight--;if(type==='cultivate'){const n=55+state.player.realmIndex*8;state.player.progress+=n;addPersonal(`【天道酬勤】你消耗1点悟道，修为猛涨 ${n}。`,'good');showResult('顿悟修为',`修为 +${n}`,'good')}else if(type==='manual'){state.player.manualProf+=40;addPersonal(`你对《${state.player.manual}》有了新的领悟。`,'good');showResult('顿悟功法',`《${state.player.manual}》熟练度 +40`,'good')}else{const known=Object.keys(state.player.spells).filter(x=>x!=='基础拳脚');if(!known.length){state.player.insight++;return showResult('暂无法术','踏入炼气一层后再来。','bad')}const s=known[0];state.player.spells[s]+=40;addPersonal(`你顿悟了${s}。`,'good');showResult('顿悟法术',`${s} 熟练度 +40`,'good')}save();render()}
function render(){if(!state)return;$('heroName').textContent=state.player.name;$('heroSub').textContent=`${age()}岁 · ${season()} · ${state.player.location} · ${root().name}`;$('realmName').textContent=realm().name;$('cultivationText').textContent=`${Math.floor(state.player.progress)} / ${realm().need}`;$('cultivationBar').style.width=`${clamp(state.player.progress/realm().need*100,0,100)}%`;$('dateTop').textContent=dateLabel();
 $('spiritStoneQuick').textContent=state.player.spiritStones;$('herbQuick').textContent=state.player.herbs;$('hpQuick').textContent=`${state.player.hp}/${maxHp()}`;$('repQuick').textContent=state.player.reputation;$('diligenceQuick').textContent=`${state.player.diligence}/20`;$('insightQuick').textContent=state.player.insight;$('diligencePill').textContent=`勤勉 ${state.player.diligence}/20`;$('insightPill').textContent=`悟道点 ${state.player.insight}`;
 renderUrgent();renderHomeLog();renderCharacter();renderMap();renderEvents();renderNPCs();
}
function renderUrgent(){const active=Object.values(state.major).filter(m=>m.status==='active'||m.status==='announced').sort((a,b)=>a.end-b.end);if(!active.length){$('urgentBox').innerHTML='';return}const m=active[0];const text=m.status==='announced'?`预计第 ${m.start} 日开启`:`剩余 ${Math.max(0,m.end-dayNumber()+1)} 日`;$('urgentBox').innerHTML=`<div class="urgent"><div class="urgent-title">${m.status==='active'?'【限时】':'【预告】'} ${esc(m.title)}</div><p>${esc(m.text)}</p><div class="urgent-foot"><span>地点：${esc(m.location)} · ${text}</span><button class="mini-btn" data-jump-events>查看</button></div></div>`;document.querySelector('[data-jump-events]').onclick=()=>switchPage('events')}
function logHtml(x){return `<div class="log-item ${x.type||''}"><span class="date">${esc(x.date)}</span>${esc(x.text)}</div>`}
function renderHomeLog(){$('homeLog').innerHTML=state.personalLog.slice(0,5).map(logHtml).join('')||'<div class="section-tip">尚无经历。</div>'}
function renderCharacter(){const p=state.player;$('characterStats').innerHTML=`<div class="kv"><span>姓名</span><b>${esc(p.name)}</b></div><div class="kv"><span>年龄 / 寿元</span><b>${age()} / ${p.lifespan}</b></div><div class="kv"><span>境界</span><b>${realm().name}</b></div><div class="kv"><span>气血</span><b>${p.hp} / ${maxHp()}</b></div><div class="kv"><span>灵力</span><b>${p.qi} / ${maxQi()}</b></div><div class="kv"><span>所在地</span><b>${p.location}</b></div><div class="kv"><span>声望</span><b>${p.reputation}</b></div>`;$('rootInfo').innerHTML=`<div class="skill-card"><div class="skill-head"><b>${root().name}</b><span>修炼倍率 ×${root().mult.toFixed(2)}</span></div><div class="skill-desc">${root().desc}</div></div>`;
 $('manualList').innerHTML=`<div class="skill-card"><div class="skill-head"><b>《${esc(p.manual)}》</b><span>${manual().quality}</span></div><div class="skill-desc">熟练度 ${p.manualProf} · 功法倍率 ×${manual().mult.toFixed(2)}<br>${manual().desc}</div></div>`;
 $('spellList').innerHTML=Object.entries(p.spells).map(([name,prof])=>{const s=SPELLS[name]||{quality:'未知',desc:''};return `<div class="skill-card"><div class="skill-head"><b>${esc(name)}</b><span>${s.quality}</span></div><div class="skill-desc">熟练度 ${prof}${s.qi?` · 消耗灵力 ${s.qi}`:''}<br>${s.desc}</div></div>`}).join('')}
function renderMap(){$('mapList').innerHTML=Object.entries(LOCATIONS).map(([name,l])=>{const cur=name===state.player.location;let routes='';if(cur)routes=`<div class="route-list">${Object.entries(l.links).map(([to,d])=>`<button data-travel="${esc(to)}">前往${esc(to)} · ${d}日</button>`).join('')}</div>`;return `<div class="map-node ${cur?'current':''}"><div class="map-head"><b>${esc(name)}</b><span class="pill">${cur?'当前所在地':'已知地点'}</span></div><p>${esc(l.desc)}</p>${routes}</div>`}).join('');document.querySelectorAll('[data-travel]').forEach(b=>b.onclick=()=>travel(b.dataset.travel))}
function renderEvents(){const all=Object.values(state.major).sort((a,b)=>(a.status==='active'?-10:0)+(a.end||999)-(b.status==='active'?-10:0)-(b.end||999));const open=all.filter(m=>m.status==='active'||m.status==='announced').length;$('eventBadge').textContent=open;$('navBadge').textContent=open;$('navBadge').classList.toggle('hidden',open===0);$('majorEvents').innerHTML=all.length?all.map(m=>{let status=m.status==='announced'?`预告 · 第${m.start}日开启`:m.status==='active'?`进行中 · 剩余${Math.max(0,m.end-dayNumber()+1)}日`:m.participated?'你已参与':'已结束';return `<div class="event-card ${m.status==='ended'?'done':''}"><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p><div class="event-meta"><span class="pill">${esc(status)}</span><span class="pill">地点：${esc(m.location)}</span></div>${m.status==='active'?`<div class="event-actions"><button class="primary" data-major="${m.id}">${state.player.location===m.location?'立即参与':'前往地点后参与'}</button>${state.player.location!==m.location?'<button data-go-map>去地图赶路</button>':''}</div>`:m.status==='announced'?`<div class="event-actions"><button data-go-map>提前赶路</button></div>`:''}</div>`}).join(''):'<div class="section-tip">天下暂时平静。</div>';$('worldLog').innerHTML=state.worldLog.slice(0,30).map(logHtml).join('');document.querySelectorAll('[data-major]').forEach(b=>b.onclick=()=>participateMajor(b.dataset.major));document.querySelectorAll('[data-go-map]').forEach(b=>b.onclick=()=>switchPage('map'))}
function renderNPCs(){const arr=[...state.npcs].filter(n=>n.known||n.relation!==0||n.grudge!==0).sort((a,b)=>(Math.abs(b.relation)+b.grudge)-(Math.abs(a.relation)+a.grudge));$('npcList').innerHTML=arr.length?arr.map(n=>{const rel=n.relation>0?`关系 +${n.relation}`:n.relation<0?`关系 ${n.relation}`:'关系 0';return `<div class="npc"><div class="npc-top"><div><span class="npc-name">${esc(n.name)}</span> <small>${esc(n.faction)}</small></div><span class="rel ${n.relation>0?'good':n.relation<0||n.grudge>0?'bad':''}">${rel}${n.grudge?` · 仇恨 ${n.grudge}`:''}</span></div><div class="skill-desc">${n.alive?`${REALMS[n.realmIndex].name} · ${esc(n.location)}`:'已死亡'}</div></div>`}).join(''):'<div class="section-tip">你还没有真正认识谁。</div>'}
function switchPage(name){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));$(`page-${name}`).classList.add('active');document.querySelector(`.nav-btn[data-page="${name}"]`).classList.add('active');window.scrollTo({top:0,behavior:'instant'});render()}
function openModal(html,closable=true){$('modal').innerHTML=html+(closable?`<div class="close-row"><button data-close-modal>知道了</button></div>`:'');$('modalWrap').classList.remove('hidden');const c=document.querySelector('[data-close-modal]');if(c)c.onclick=closeModal}
function closeModal(){$('modalWrap').classList.add('hidden')}
function showResult(title,text,type=''){openModal(`<h2>${esc(title)}</h2><p>${esc(text)}</p>${type?`<div class="result-gain ${type==='bad'?'result-loss':''}">${type==='bad'?'结果已经发生。':'行动已经结算并自动存档。'}</div>`:''}`)}
function exportSave(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`太玄界-${state.player.name}-${dateLabel().replace(/[ ·]/g,'_')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function installMessage(){if(location.protocol==='file:'||location.protocol==='content:')return '你现在打开的是本地文件，所以浏览器不会出现“安装应用”。需要先把游戏通过 HTTPS 打开（例如 GitHub Pages），PWA 安装功能才会生效。';if(deferredInstallPrompt)return '当前浏览器已经满足安装条件，可以直接点“安装应用”。';if(window.matchMedia('(display-mode: standalone)').matches)return '已经以应用模式运行。';return '如果刚部署或更新，请刷新一次页面；Chrome 满足 PWA 条件后会允许安装。'}
async function triggerInstall(){if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$('installStatus').textContent=installMessage()}else showResult('安装应用',installMessage())}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;$('installStatus').textContent=installMessage()});window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;$('installStatus').textContent='已经安装到手机。'});
if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js').catch(console.error);
function boot(){const has=!!(localStorage.getItem(SAVE_KEY)||localStorage.getItem(OLD_KEY));$('continueBtn').classList.toggle('hidden',!has);$('installStatus').textContent=installMessage();}
$('newGameBtn').onclick=()=>{newState($('nameInput').value.trim()||'陆尘');$('startScreen').classList.add('hidden');$('gameApp').classList.remove('hidden');updateMajorEvents();render();showResult('天道酬勤','你的外挂已经激活。\n凡有所练，必有所得。\n先活下来，再谈长生。','good')};
$('continueBtn').onclick=()=>{if(load()){$('startScreen').classList.add('hidden');$('gameApp').classList.remove('hidden');updateMajorEvents();render()}};
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>({cultivate,gather,work,explore,rumor,rest}[b.dataset.action])());document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>switchPage(b.dataset.page));
$('saveBtn').onclick=()=>{save();showResult('手动存档','当前进度已经写入浏览器本地存档。','good')};$('installBtn').onclick=triggerInstall;$('installStartBtn').onclick=triggerInstall;$('insightCultivate').onclick=()=>spendInsight('cultivate');$('insightManual').onclick=()=>spendInsight('manual');$('insightSpell').onclick=()=>spendInsight('spell');
window.__TAIXUAN_TEST__={newGame:(name='测试者')=>{newState(name);updateMajorEvents();render();return true},getState:()=>JSON.parse(JSON.stringify(state)),getCombat:()=>combat?JSON.parse(JSON.stringify(combat)):null,action:(name)=>({cultivate,gather,work,explore,rumor,rest}[name])(),travel,participateMajor,advanceDays,switchPage,closeModal,spendInsight,startCombat:(name='灰背野狼')=>{const e=ENEMIES.find(x=>x.name===name)||ENEMIES[0];startCombat(e)},combatAction};
boot();
})();