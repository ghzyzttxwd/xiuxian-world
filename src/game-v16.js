(() => {
'use strict';
const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='1.6.0'; const SAVE_SCHEMA_VERSION=13;
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
 '青石村':{desc:'偏僻山村，灵气稀薄，但胜在安稳。',links:{'青石镇':1},danger:.16,herb:0,work:[1,2],find:[1,3],faction:'凡俗乡里',specialty:'山野药草',secret:.35,eventRate:.08,eventKind:'herb'},
 '青石镇':{desc:'凡人与低阶散修混居的小镇，是离开乡野后的第一处落脚地。',links:{'青石村':1,'临江城':2,'黑风岭':2},danger:.24,herb:0,work:[1,2],find:[1,4],faction:'散修 / 青云宗影响',specialty:'低阶灵草',secret:.55,eventRate:.09,eventKind:'stones'},
 '临江城':{desc:'临江流域最大的修士聚集地，坊市、商队与各方耳目汇集。',links:{'青石镇':2,'青云山':3,'黑风岭':2,'云梦泽':3,'苍梧郡城':4},danger:.28,herb:0,work:[1,3],find:[1,5],faction:'玄水帮 / 青云宗 / 散修',specialty:'坊市与商路',secret:.75,eventRate:.10,eventKind:'stones'},
 '黑风岭':{desc:'妖兽横行的低阶山岭，灵药与兽材都比外界更多。',links:{'青石镇':2,'临江城':2,'赤霞谷':3},danger:.46,herb:2,work:[0,1],find:[2,6],faction:'血刀门活动 / 妖兽',specialty:'灵草与兽材',secret:1.10,eventRate:.12,eventKind:'materials'},
 '青云山':{desc:'青云宗山门所在，护山阵法笼罩群峰，山外常有修士往来。',links:{'临江城':3,'苍梧郡城':3},danger:.18,herb:1,work:[1,2],find:[1,3],faction:'青云宗',specialty:'灵泉与药圃',secret:.90,eventRate:.08,eventKind:'manual'},
 '云梦泽':{desc:'水网千里的湖泽，灵藕、水草丰盛，也藏着水匪与妖鳄。',links:{'临江城':3,'苍梧郡城':2,'古河遗迹':3},danger:.38,herb:2,work:[1,2],find:[2,6],faction:'玄水帮 / 水泽散修',specialty:'水生灵药',secret:1.25,eventRate:.13,eventKind:'herb'},
 '苍梧郡城':{desc:'统摄临江一带的大郡城，修士商号、客卿与中型势力远胜临江城。',links:{'临江城':4,'青云山':3,'云梦泽':2,'落星矿脉':3},danger:.26,herb:0,work:[2,4],find:[2,6],faction:'郡府 / 商盟 / 多方宗门',specialty:'大商号与高阶委托',secret:.70,eventRate:.11,eventKind:'stones'},
 '赤霞谷':{desc:'地火终年不息的赤色峡谷，火行灵材遍地，也有凶猛火属妖兽。',links:{'黑风岭':3,'落星矿脉':2,'万兽山脉':3},danger:.50,herb:1,work:[1,2],find:[3,7],faction:'血刀门外围 / 炼器散修',specialty:'火行灵材',secret:1.30,eventRate:.13,eventKind:'materials'},
 '落星矿脉':{desc:'古老陨星砸出的矿区，玄铁与灵石伴生，矿道深处常有异物。',links:{'苍梧郡城':3,'赤霞谷':2,'万兽山脉':3,'古河遗迹':4},danger:.43,herb:0,work:[2,4],find:[3,8],faction:'矿盟 / 散修护矿队',specialty:'玄铁与灵石矿',secret:1.45,eventRate:.14,eventKind:'stones'},
 '万兽山脉':{desc:'连绵数千里的妖兽山脉，越往深处越少见人烟，强大妖兽划地而居。',links:{'赤霞谷':3,'落星矿脉':3,'玄阴禁地':5},danger:.60,herb:2,work:[0,1],find:[4,9],faction:'妖兽领地',specialty:'高阶兽材与山珍',secret:1.55,eventRate:.15,eventKind:'materials'},
 '古河遗迹':{desc:'古河改道后露出的断壁残城，地下遗构与残禁制至今无人清理干净。',links:{'云梦泽':3,'落星矿脉':4,'玄阴禁地':4},danger:.54,herb:1,work:[0,1],find:[4,10],faction:'散修探宝队 / 无主',specialty:'古修残物',secret:1.80,eventRate:.16,eventKind:'relic'},
 '玄阴禁地':{desc:'阴煞终年不散的边荒禁地，普通炼气修士深入其中极易有去无回。',links:{'万兽山脉':5,'古河遗迹':4},danger:.70,herb:2,work:[0,1],find:[5,12],faction:'未知鬼修 / 阴物',specialty:'阴属性灵材',secret:2.10,eventRate:.18,eventKind:'insight'}
};
const TRAVEL_ROUTES=[
 {id:'village-road',name:'青石村道',a:'青石村',b:'青石镇',days:1,risk:.04,kind:'village',faction:'neutral',fee:0},
 {id:'riverside-road',name:'临江官道',a:'青石镇',b:'临江城',days:2,risk:.09,kind:'trade',faction:'neutral',fee:0},
 {id:'wolf-trail',name:'黑风山径',a:'青石镇',b:'黑风岭',days:2,risk:.24,kind:'wild',faction:'neutral',fee:0},
 {id:'qingyun-road',name:'青云山道',a:'临江城',b:'青云山',days:3,risk:.08,kind:'sect',faction:'qingyun',fee:0},
 {id:'blackwind-trade',name:'黑风商道',a:'临江城',b:'黑风岭',days:2,risk:.20,kind:'trade',faction:'blood',fee:0},
 {id:'xuanshui-boat',name:'玄水商船',a:'临江城',b:'云梦泽',days:2,risk:.08,kind:'river',faction:'xuanshui',fee:1},
 {id:'marsh-trail',name:'泽边小径',a:'临江城',b:'云梦泽',days:3,risk:.24,kind:'wild',faction:'neutral',fee:0},
 {id:'cangwu-road',name:'苍梧官道',a:'临江城',b:'苍梧郡城',days:4,risk:.10,kind:'trade',faction:'neutral',fee:0},
 {id:'guarded-caravan',name:'护送商队',a:'临江城',b:'苍梧郡城',days:3,risk:.05,kind:'trade',faction:'neutral',fee:1},
 {id:'mountain-post',name:'山门驿路',a:'青云山',b:'苍梧郡城',days:3,risk:.07,kind:'sect',faction:'qingyun',fee:0},
 {id:'waterland-post',name:'水陆驿道',a:'云梦泽',b:'苍梧郡城',days:2,risk:.12,kind:'river',faction:'xuanshui',fee:0},
 {id:'sunken-road',name:'泽中古道',a:'云梦泽',b:'古河遗迹',days:3,risk:.30,kind:'ruin',faction:'neutral',fee:0},
 {id:'red-cliff-path',name:'赤霞山径',a:'黑风岭',b:'赤霞谷',days:3,risk:.31,kind:'wild',faction:'blood',fee:0},
 {id:'mine-road',name:'护矿官道',a:'苍梧郡城',b:'落星矿脉',days:3,risk:.17,kind:'trade',faction:'neutral',fee:0},
 {id:'lava-walk',name:'熔岩栈道',a:'赤霞谷',b:'落星矿脉',days:2,risk:.27,kind:'wild',faction:'neutral',fee:0},
 {id:'hunter-road',name:'猎妖古道',a:'赤霞谷',b:'万兽山脉',days:3,risk:.39,kind:'wild',faction:'neutral',fee:0},
 {id:'ridge-road',name:'矿脊山道',a:'落星矿脉',b:'万兽山脉',days:3,risk:.34,kind:'wild',faction:'neutral',fee:0},
 {id:'abandoned-cart',name:'运矿废道',a:'落星矿脉',b:'古河遗迹',days:4,risk:.29,kind:'ruin',faction:'neutral',fee:0},
 {id:'beast-track',name:'边荒兽径',a:'万兽山脉',b:'玄阴禁地',days:5,risk:.55,kind:'wild',faction:'neutral',fee:0},
 {id:'yin-river',name:'阴河旧道',a:'古河遗迹',b:'玄阴禁地',days:4,risk:.59,kind:'ruin',faction:'neutral',fee:0}
];
function routesFrom(location){return TRAVEL_ROUTES.filter(r=>r.a===location||r.b===location).map(r=>({...r,to:r.a===location?r.b:r.a}))}
function getTravelRoute(from,to,id=null){const rows=routesFrom(from).filter(r=>r.to===to);if(!rows.length)return null;if(id){const exact=rows.find(r=>r.id===id);if(exact)return exact}return [...rows].sort((x,y)=>x.days-y.days||x.risk-y.risk)[0]}
function effectiveRouteRisk(route,player=state.player,world=state.world){
 if(!route)return 0;const a=LOCATIONS[route.a]?.danger||.2,b=LOCATIONS[route.b]?.danger||.2;let risk=route.risk+Math.max(0,((a+b)/2-.25)*.18);
 if((player.injury||0)>=2)risk+=.05;if(route.faction==='qingyun'&&player.sect==='青云宗')risk-=.06;if(route.faction==='blood'&&player.sect==='青云宗')risk+=.08;if((world.factionTension||0)>=70&&(route.faction==='qingyun'||route.faction==='blood'))risk+=.05;if(route.fee>0)risk-=.02;return clamp(risk,.02,.78)
}
function routeRiskLabel(route){const r=effectiveRouteRisk(route);return Math.round(r*100)+'%'}
function routeEnemy(route){const pool=ENEMIES.filter(e=>!e.areas||e.areas.includes(route.a)||e.areas.includes(route.b));const rows=(pool.length?pool:ENEMIES).map(e=>({e,w:e.weight/(1+Math.abs(e.realm-state.player.realmIndex)*.65)}));let n=rand()*rows.reduce((a,x)=>a+x.w,0);for(const x of rows){n-=x.w;if(n<=0)return x.e}return rows[0].e}
function resolveTravelEncounter(route,from,to,risk){
 const x=rand();if(x<risk){const e=routeEnemy(route);addPersonal('【行旅遇险】你走'+route.name+'前往'+to+'时遭遇'+e.name+'。','bad');save();render();startCombat(e);return {combat:true,text:'途中遇敌：'+e.name}}
 if(x<risk+.10){let text='';if(route.kind==='river'){state.player.herbs+=1;text='水路停靠浅滩时，你采到 1 株水生灵草。'}else if(route.kind==='ruin'){state.player.manualProf+=rint(4,9);text='路过残迹时，你从旧石刻中悟到几分行气法门。'}else if(route.kind==='wild'){state.player.beastMaterials+=1;text='荒野途中，你捡到 1 份可用兽材。'}else if(route.kind==='sect'&&state.player.sect==='青云宗'){state.player.reputation+=1;text='同门巡路修士替你指明险处，声望 +1。'}else{state.player.spiritStones+=1;text='途中替商旅搭了把手，得到 1 块灵石酬谢。'}addPersonal('【行旅见闻】'+route.name+'：'+text,'good');return {combat:false,text,type:'good'}}
 if(x<risk+.18){const text='你在'+route.name+'上听到往来修士谈论'+LOCATIONS[to].faction+'近日的动向。';addWorld('【行旅传闻】'+to+'：'+LOCATIONS[to].faction+'的活动引起过路修士议论。');addPersonal(text);return {combat:false,text,type:''}}
 return {combat:false,text:'一路无事，按时抵达。',type:''}
}
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
 {name:'灰背野狼',kind:'野兽',realm:0,hp:46,atk:[5,9],reward:{stones:[0,1],herbs:[0,1],rep:0},weight:34,areas:['青石村','青石镇']},
 {name:'山道劫匪',kind:'凡人',realm:0,hp:58,atk:[6,11],reward:{stones:[1,4],herbs:[0,0],rep:1},weight:30,areas:['青石镇','临江城','苍梧郡城']},
 {name:'水匪斥候',kind:'凡人',realm:1,hp:72,atk:[7,12],reward:{stones:[2,5],herbs:[0,1],rep:1},weight:28,areas:['云梦泽','临江城']},
 {name:'铁背狼妖',kind:'妖兽',realm:1,hp:82,atk:[9,15],reward:{stones:[2,5],herbs:[1,2],rep:2},weight:28,areas:['青石镇','黑风岭']},
 {name:'血刀门探子',kind:'修士',realm:2,hp:104,atk:[11,18],reward:{stones:[3,7],herbs:[0,1],rep:3},weight:18,areas:['临江城','黑风岭','赤霞谷']},
 {name:'云梦鳄妖',kind:'妖兽',realm:2,hp:108,atk:[11,18],reward:{stones:[2,6],herbs:[2,4],rep:3},weight:24,areas:['云梦泽']},
 {name:'黑风岭狼妖',kind:'妖兽',realm:2,hp:112,atk:[12,19],reward:{stones:[3,6],herbs:[1,3],rep:3},weight:25,areas:['黑风岭']},
 {name:'青鳞妖蛇',kind:'妖兽',realm:3,hp:138,atk:[15,23],reward:{stones:[5,9],herbs:[2,4],rep:4},weight:16,areas:['黑风岭','万兽山脉']},
 {name:'赤砂火蜥',kind:'妖兽',realm:3,hp:146,atk:[16,24],reward:{stones:[5,10],herbs:[1,3],rep:4},weight:22,areas:['赤霞谷']},
 {name:'矿洞魈',kind:'妖兽',realm:3,hp:152,atk:[15,25],reward:{stones:[7,12],herbs:[0,1],rep:4},weight:20,areas:['落星矿脉']},
 {name:'黑风岭狼王',kind:'妖兽',realm:4,hp:168,atk:[19,29],reward:{stones:[8,14],herbs:[3,5],rep:7},weight:8,areas:['黑风岭','万兽山脉']},
 {name:'苍梧邪修',kind:'修士',realm:4,hp:176,atk:[20,30],reward:{stones:[9,16],herbs:[1,3],rep:6},weight:14,areas:['苍梧郡城','古河遗迹']},
 {name:'铁羽妖鹰',kind:'妖兽',realm:4,hp:180,atk:[21,31],reward:{stones:[7,14],herbs:[2,4],rep:6},weight:17,areas:['赤霞谷','万兽山脉']},
 {name:'古河尸傀',kind:'阴物',realm:5,hp:208,atk:[23,35],reward:{stones:[10,18],herbs:[1,3],rep:7},weight:18,areas:['古河遗迹']},
 {name:'万兽猿王',kind:'妖兽',realm:5,hp:226,atk:[25,37],reward:{stones:[11,20],herbs:[3,6],rep:8},weight:14,areas:['万兽山脉']},
 {name:'玄阴鬼修',kind:'修士',realm:6,hp:248,atk:[29,42],reward:{stones:[14,24],herbs:[2,5],rep:10},weight:16,areas:['玄阴禁地']}
];
function rand(){state.rng=(Math.imul(state.rng,1664525)+1013904223)>>>0;return state.rng/4294967296}
function rint(a,b){return Math.floor(rand()*(b-a+1))+a} function pick(arr){return arr[Math.floor(rand()*arr.length)]}
function weightedEnemy(){const pool=ENEMIES.filter(e=>!e.areas||e.areas.includes(state.player.location));const rows=pool.map(e=>({e,w:e.weight/(1+Math.abs(e.realm-state.player.realmIndex)*.65)}));let n=rand()*rows.reduce((a,x)=>a+x.w,0);for(const x of rows){n-=x.w;if(n<=0)return x.e}return rows[0]?.e||ENEMIES[0]}
function dangerLabel(e){const d=(e.realm||0)-state.player.realmIndex;return d<=-2?'碾压':d===-1?'优势':d===0?'势均力敌':d===1?'危险':d===2?'极危':'九死一生'}
function injuryLabel(){return ['无伤','轻伤','重伤','濒死'][clamp(state.player.injury||0,0,3)]}
function deathRisk(e){const d=(e.realm||0)-state.player.realmIndex,inj=state.player.injury||0;if(d<2&&inj<3)return 0;return clamp((d>=2?.04+d*.045:0)+inj*.035,0,.32)}
function dayNumber(){return (state.time.year-1)*360+(state.time.month-1)*30+state.time.day}
function dateLabel(){return `第${state.time.year}年 · ${state.time.month}月${state.time.day}日`}
function season(){return ['春','夏','秋','冬'][Math.floor((state.time.month-1)/3)]}
function age(){return state.player.startAge+Math.floor((dayNumber()-(state.player.birthDay||1))/360)}
function realm(){return REALMS[state.player.realmIndex]}
function root(){return ROOTS[state.player.rootIndex]}
function manual(){return MANUALS[state.player.manual]}
function maxHp(){return realm().maxHp+gearHp()} function maxQi(){return realm().maxQi+gearQi()}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function addPersonal(text,type=''){state.personalLog.unshift({day:dayNumber(),date:dateLabel(),text,type});state.personalLog=state.personalLog.slice(0,60)}
function addWorld(text,type=''){state.worldLog.unshift({day:dayNumber(),date:dateLabel(),text,type});state.worldLog=state.worldLog.slice(0,80)}
function addDiligence(n){state.player.diligence+=n;let gained=0;while(state.player.diligence>=20){state.player.diligence-=20;state.player.insight++;gained++}if(gained)addPersonal(`【天道酬勤】勤勉积满，凝聚悟道点 +${gained}。`,'good')}
const NPC_FACTION_HOMES={
 '青云宗':['青云山','临江城','苍梧郡城'],
 '玄水帮':['临江城','云梦泽','苍梧郡城'],
 '血刀门':['黑风岭','赤霞谷','落星矿脉'],
 '散修':['青石镇','临江城','苍梧郡城','云梦泽','落星矿脉','古河遗迹']
};
function npcSpawnLocation(faction){return pick(NPC_FACTION_HOMES[faction]||Object.keys(LOCATIONS))}
function npcMoveTarget(n){const here=LOCATIONS[n.location];if(!here)return npcSpawnLocation(n.faction);const linked=Object.keys(here.links);const preferred=(NPC_FACTION_HOMES[n.faction]||[]).filter(x=>linked.includes(x));if(preferred.length&&rand()<.65)return pick(preferred);return pick([n.location,...linked])}
function createNPCs(){return NPC_NAMES.map((name,i)=>{const faction=pick(FACTIONS);return{id:i+1,name,age:rint(16,55),faction,location:npcSpawnLocation(faction),realmIndex:rint(0,4),progress:rint(0,90),talent:rint(70,130),alive:true,ambition:rint(15,95),courage:rint(20,95),wealth:rint(0,20),relation:0,grudge:0,known:i<6}})}
function chooseRoot(){let x=rand()*100;return x<35?0:x<60?1:x<80?2:x<92?3:x<99?4:5}
function newState(name){
 const seed=((Date.now()^Math.floor(Math.random()*0xffffffff))>>>0)||123456789;
 state={version:VERSION,saveSchemaVersion:SAVE_SCHEMA_VERSION,rng:seed,time:{year:1,month:1,day:1},player:{name:name||'陆尘',startAge:16,birthDay:1,lifespan:82,realmIndex:0,progress:0,spiritStones:3,herbs:1,reputation:0,location:'青石村',rootIndex:0,manual:'基础吐纳诀',manualProf:0,spells:{'基础拳脚':0},diligence:0,insight:0,hp:70,qi:0,injury:0,battleWins:0,battleLosses:0,kills:0,sect:'散修',sectRank:'无',sectContribution:0,sectTasksCompleted:0,sectTask:null,sectLastStipend:0,healingPills:0,tradeVolume:0,alchemyProf:0,qiPills:0,alchemyBatches:0,beastMaterials:0,gearOwned:[],equipped:{weapon:null,armor:null,charm:null},breakthroughPity:0,breakthroughAttempts:0,dwellingTier:0,dwellingLocation:null,herbPlotReady:0,herbPlotSeeded:false,retreatSessions:0,secretRealmClears:0,relicFragments:0},world:{beastPressure:48,qingyunPower:72,bloodBladePower:44,marketIndex:100,casualties:0,secretRealm:null,nextSecretRealmDay:18,secretRealmCount:0,factionTension:24,factionClashes:0,lastFactionDay:0,warWinsQingyun:0,warWinsBlood:0},npcs:[],personalLog:[],worldLog:[],flags:{},legacy:{cycles:0,merit:0,bestRealm:0,totalDeaths:0},major:{},pendingEvent:null};
 state.player.rootIndex=chooseRoot();state.npcs=createNPCs();
 addPersonal(`你从另一个世界醒来，成了青石村里一个十六岁的少年。识海深处同时浮现四个字——【天道酬勤】。`,'major');
 addPersonal(`你检查自身资质：${root().name}。无论资质如何，至少从今天起，每一分努力都不会白费。`,'good');
 addWorld('青云宗传出消息：近期仍会照例巡查附近村镇，挑选有灵根的少年。');save();
}
function ensureLegacyBaseShape(){
 if(!state||typeof state!=='object')throw new Error('存档格式无效');
 if(!state.player||!state.world||!state.time)throw new Error('存档缺少核心结构');
 if(!Array.isArray(state.npcs))state.npcs=[];if(!Array.isArray(state.personalLog))state.personalLog=[];if(!Array.isArray(state.worldLog))state.worldLog=[];if(!state.flags)state.flags={};if(!state.major)state.major={};
 if(!state.player.rootIndex&&state.player.rootIndex!==0)state.player.rootIndex=1;if(!state.player.manual)state.player.manual='基础吐纳诀';if(state.player.manualProf==null)state.player.manualProf=0;if(!state.player.spells)state.player.spells={'基础拳脚':0};if(state.player.diligence==null)state.player.diligence=0;if(state.player.insight==null)state.player.insight=0;if(state.player.hp==null)state.player.hp=maxHp();if(state.player.qi==null)state.player.qi=maxQi()
}
const SAVE_MIGRATIONS={
 3(){const p=state.player;if(p.injury==null)p.injury=0;if(p.battleWins==null)p.battleWins=0;if(p.battleLosses==null)p.battleLosses=0;if(p.kills==null)p.kills=0},
 4(){const p=state.player;if(p.sect==null){const joined=!!(state.major?.recruit?.participated&&((ROOTS[p.rootIndex]?.mult||0)>=1.25||p.realmIndex>=1));p.sect=joined?'青云宗':'散修';p.sectRank=joined?'外门弟子':'无'}if(p.sectRank==null)p.sectRank=p.sect==='青云宗'?'外门弟子':'无';if(p.sectContribution==null)p.sectContribution=0;if(p.sectTasksCompleted==null)p.sectTasksCompleted=0;if(p.sectTask==null)p.sectTask=null;if(p.sectLastStipend==null)p.sectLastStipend=0},
 5(){const p=state.player;if(p.healingPills==null)p.healingPills=0;if(p.tradeVolume==null)p.tradeVolume=0},
 6(){const p=state.player;if(p.alchemyProf==null)p.alchemyProf=0;if(p.qiPills==null)p.qiPills=0;if(p.alchemyBatches==null)p.alchemyBatches=0},
 7(){const p=state.player;if(p.beastMaterials==null)p.beastMaterials=0;if(!Array.isArray(p.gearOwned))p.gearOwned=[];if(!p.equipped)p.equipped={weapon:null,armor:null,charm:null};for(const k of ['weapon','armor','charm'])if(!(k in p.equipped))p.equipped[k]=null},
 8(){for(const n of state.npcs){if(n.relation==null)n.relation=0;if(n.grudge==null)n.grudge=0;if(n.known==null)n.known=false;if(n.lastGiftDay==null)n.lastGiftDay=0;if(n.lastDaoDay==null)n.lastDaoDay=0;if(n.lastSparDay==null)n.lastSparDay=0;if(n.lastHelpMonth==null)n.lastHelpMonth=0;if(n.lastRevengeDay==null)n.lastRevengeDay=0}},
 9(){const p=state.player;if(p.breakthroughPity==null)p.breakthroughPity=0;if(p.breakthroughAttempts==null)p.breakthroughAttempts=0;if(p.progress>realm().need)p.progress=realm().need},
 10(){const p=state.player;if(p.dwellingTier==null)p.dwellingTier=0;if(p.dwellingLocation===undefined)p.dwellingLocation=null;if(p.herbPlotReady==null)p.herbPlotReady=0;if(p.herbPlotSeeded==null)p.herbPlotSeeded=false;if(p.retreatSessions==null)p.retreatSessions=0},
 11(){const p=state.player;if(p.birthDay==null)p.birthDay=1;if(!state.legacy)state.legacy={cycles:0,merit:0,bestRealm:0,totalDeaths:0};if(state.legacy.cycles==null)state.legacy.cycles=0;if(state.legacy.merit==null)state.legacy.merit=0;if(state.legacy.bestRealm==null)state.legacy.bestRealm=0;if(state.legacy.totalDeaths==null)state.legacy.totalDeaths=0},
 12(){const p=state.player,w=state.world;if(p.secretRealmClears==null)p.secretRealmClears=0;if(p.relicFragments==null)p.relicFragments=0;if(w.secretRealm===undefined)w.secretRealm=null;if(w.nextSecretRealmDay==null)w.nextSecretRealmDay=dayNumber()+20;if(w.secretRealmCount==null)w.secretRealmCount=0},
 13(){const w=state.world;if(w.factionTension==null)w.factionTension=24;if(w.factionClashes==null)w.factionClashes=0;if(w.lastFactionDay==null)w.lastFactionDay=0;if(w.warWinsQingyun==null)w.warWinsQingyun=0;if(w.warWinsBlood==null)w.warWinsBlood=0}
};
function validateCurrentSaveSchema(){
 const p=state.player,w=state.world,required=[['player.injury',p.injury],['player.sect',p.sect],['player.alchemyProf',p.alchemyProf],['player.gearOwned',p.gearOwned],['player.breakthroughAttempts',p.breakthroughAttempts],['player.dwellingTier',p.dwellingTier],['player.birthDay',p.birthDay],['player.secretRealmClears',p.secretRealmClears],['world.secretRealmCount',w.secretRealmCount],['world.factionClashes',w.factionClashes],['legacy',state.legacy]];
 const missing=required.filter(([,v])=>v==null).map(([k])=>k);if(missing.length)throw new Error('存档迁移后字段缺失：'+missing.join(', '));if(!Array.isArray(p.gearOwned))throw new Error('存档迁移后 gearOwned 格式无效')
}
function migrateSaveState(){
 let schema=state.saveSchemaVersion;if(schema==null)schema=2;if(!Number.isInteger(schema)||schema<2)throw new Error('存档版本号无效');if(schema>SAVE_SCHEMA_VERSION)throw new Error('此存档来自更高版本，当前客户端不会覆盖它');
 for(let next=schema+1;next<=SAVE_SCHEMA_VERSION;next++){const migrate=SAVE_MIGRATIONS[next];if(typeof migrate!=='function')throw new Error('缺少存档迁移步骤：'+next);migrate();state.saveSchemaVersion=next}
 if(state.saveSchemaVersion==null)state.saveSchemaVersion=SAVE_SCHEMA_VERSION;validateCurrentSaveSchema();state.version=VERSION
}
function normalizeLoaded(){ensureLegacyBaseShape();migrateSaveState()}
function save(){try{if(!state)return false;state.version=VERSION;state.saveSchemaVersion=SAVE_SCHEMA_VERSION;localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true}catch(e){console.error(e);return false}}
function load(){const raw=localStorage.getItem(SAVE_KEY)||localStorage.getItem(OLD_KEY);if(!raw)return false;try{state=JSON.parse(raw);normalizeLoaded();save();return true}catch(e){console.error(e);state=null;return false}}
function tickOneDay(){
 state.time.day++;if(state.time.day>30){state.time.day=1;state.time.month++;if(state.time.month>12){state.time.month=1;state.time.year++}}
 if(dayNumber()%7===0){state.world.marketIndex=clamp(state.world.marketIndex+rint(-4,4),76,135);state.world.beastPressure=clamp(state.world.beastPressure+rint(0,4),0,100)}
 simulateNPCs();updateMajorEvents();processSocialEvents();updateSecretRealm();updateFactionConflict();
 if(age()>=state.player.lifespan&&!state.flags.dead){state.flags.dead=true;addPersonal('寿元耗尽，你这一世走到了尽头。','bad');showResult('寿元耗尽','这一世已经结束，但轮回传承已经开启。前往首页或角色页选择转世。','bad')}
}
function advanceDays(days){for(let i=0;i<days&&!state.flags.dead;i++)tickOneDay();state.player.qi=Math.min(maxQi(),state.player.qi+Math.max(2,Math.floor(maxQi()*.15))*days);save();render()}
function simulateNPCs(){
 for(const n of state.npcs){if(!n.alive)continue;n.progress+=Math.max(1,Math.floor((n.talent/100)*rint(1,4)));if(n.progress>=100&&n.realmIndex<8){n.progress-=100;n.realmIndex++;if(rand()<.12){n.known=true;addWorld(`${n.name}突破至${REALMS[n.realmIndex].name}。`)}}
 if(rand()<.035)n.location=npcMoveTarget(n);if(rand()<.006&&n.realmIndex===0&&n.age>50){n.alive=false;if(n.known)addWorld(`${n.name}寿终，修真路上又少了一位旧人。`)}}
}
function cultivate(){
 const base=rint(6,10),rootM=root().mult,manualM=manual().mult,cheatM=1.5,injuryM=[1,.90,.70,.48][clamp(state.player.injury||0,0,3)],gain=Math.max(1,Math.floor(base*rootM*manualM*cheatM*injuryM*dwellingCultivationMultiplier())),prof=rint(4,7)*2;const before=state.player.progress;state.player.progress=Math.min(realm().need,state.player.progress+gain);state.player.manualProf+=prof;addDiligence(3);advanceDays(1);const actual=state.player.progress-before,full=state.player.progress>=realm().need;addPersonal('你运转《'+state.player.manual+'》吐纳一日，修为 +'+Math.max(0,actual)+'，功法熟练度 +'+prof+'。'+(full?'当前境界已经圆满，可主动尝试破境。':''),full?'major':'good');save();render();showResult('吐纳修炼','修为 +'+Math.max(0,actual)+'\n《'+state.player.manual+'》熟练度 +'+prof+(full?'\n境界圆满：现在可以尝试突破。':''),'good')
}

function breakthroughChance(){
 if(state.player.realmIndex>=REALMS.length-1)return 0;const next=state.player.realmIndex+1;let base=state.player.realmIndex===0?.78:(next===10?.55:(next>10?.60:.72));const rootBonus=(root().mult-1)*.18,manualBonus=Math.min(.10,(state.player.manualProf||0)/2000),cheatBonus=.08,injuryPenalty=(state.player.injury||0)*.08,pity=(state.player.breakthroughPity||0)/100;return clamp(base+rootBonus+manualBonus+cheatBonus+pity-injuryPenalty,.25,.95)
}
function attemptBreakthrough(){
 if(state&&state.flags&&state.flags.dead)return showResult('此世已终','你已经身死道消。','bad');if(state.player.realmIndex>=REALMS.length-1)return showResult('已至当前极限','当前版本已经没有更高境界。');const need=realm().need;if(state.player.progress<need)return showResult('修为未满','当前修为尚未圆满，不能尝试突破。','bad');
 const oldRealm=realm().name,chance=breakthroughChance();state.player.breakthroughAttempts++;advanceDays(3);if(state.flags.dead)return;
 if(rand()<chance){state.player.progress=0;state.player.realmIndex++;state.player.breakthroughPity=0;state.player.hp=maxHp();state.player.qi=maxQi();const newRealm=realm().name;if(state.player.realmIndex===1&&!('火弹术'in state.player.spells)){state.player.spells['火弹术']=0;state.player.spells['御风步']=0;addPersonal('踏入炼气一层后，你终于能够驱使灵力，摸索出了火弹术与御风步。','major')}if(state.player.realmIndex===10){state.player.reputation+=8;addWorld(state.player.name+'成功筑基，正式跨过修真第一道大关。','major')}addPersonal('你闭关三日冲击瓶颈，终于由'+oldRealm+'突破至'+newRealm+'！','major');save();render();showResult('突破成功',oldRealm+' → '+newRealm+'\n气血、灵力恢复至满值\n破境感悟清零','good')}
 else{const oldProgress=state.player.progress,ratio=rint(78,90)/100;state.player.progress=Math.max(0,Math.floor(need*ratio));state.player.breakthroughPity=Math.min(32,(state.player.breakthroughPity||0)+8);let hurt='';if(rand()<.45){const old=state.player.injury||0;state.player.injury=clamp(old+1,0,3);state.player.hp=Math.max(1,Math.floor(state.player.hp*.72));if(state.player.injury>old)hurt='，伤势加重至'+injuryLabel()}const lost=Math.max(0,oldProgress-state.player.progress);addPersonal('你冲击'+oldRealm+'瓶颈失败，修为跌落 '+lost+'，但对瓶颈多了一层理解。','bad');save();render();showResult('突破失败','修为 -'+lost+'\n破境感悟 +8%（当前 +'+state.player.breakthroughPity+'%）'+hurt+'\n重新修至圆满后可再次尝试。','bad')}
}
function renderBreakthrough(){
 const box=$('breakthroughBox');if(!box)return;if(state.player.realmIndex>=REALMS.length-1){box.innerHTML='';return}if(state.player.progress<realm().need){box.innerHTML='';return}const pct=Math.round(breakthroughChance()*100),next=REALMS[state.player.realmIndex+1].name;box.innerHTML='<div class="urgent"><div class="urgent-title">【境界圆满】可尝试突破至 '+esc(next)+'</div><p>当前成功率 '+pct+'%。灵根、功法熟练度与天道酬勤提高成功率；伤势会降低成功率；失败积累的破境感悟会提高下一次机会。</p><div class="urgent-foot"><span>破境感悟 +'+(state.player.breakthroughPity||0)+'% · 已尝试 '+(state.player.breakthroughAttempts||0)+' 次</span><button class="mini-btn primary" data-breakthrough>尝试突破 · 3日</button></div></div>';const b=document.querySelector('[data-breakthrough]');if(b)b.onclick=attemptBreakthrough
}

function locationProfile(){return LOCATIONS[state.player.location]||LOCATIONS['青石村']}
function locationDangerText(l){const d=l?.danger||0;return d>=.65?'禁地':d>=.55?'凶险':d>=.45?'高危':d>=.34?'危险':d>=.24?'谨慎':'安稳'}
function secretActivityText(l){const x=l?.secret||0;return x>=1.8?'极活跃':x>=1.25?'活跃':x>=.75?'较多':'稀少'}
function gather(){advanceDays(1);const l=locationProfile(),n=rint(1,3)+(l.herb||0);state.player.herbs+=n;addDiligence(2);addPersonal(`你在${state.player.location}附近采到 ${n} 株可用灵草。当地特产：${l.specialty}。`,'good');save();render();showResult('采集灵草',`灵草 +${n}\n区域：${state.player.location} · ${locationDangerText(l)}\n特产：${l.specialty}`,'good')}
function work(){advanceDays(1);const l=locationProfile(),range=l.work||[1,2],n=rint(range[0],range[1]);state.player.spiritStones+=n;addDiligence(1);addPersonal(`你在${state.player.location}谋生一日，换得 ${n} 块灵石。`);save();render();showResult('谋生换钱',`灵石 +${n}\n当地主要资源：${l.specialty}`,'good')}
function rest(){advanceDays(1);const before=state.player.hp,old=state.player.injury||0;state.player.hp=Math.min(maxHp(),state.player.hp+Math.ceil(maxHp()*.52));state.player.qi=maxQi();if(state.player.injury>0)state.player.injury--;addDiligence(1);addPersonal('你闭门休息了一整日，气血与灵力恢复。'+(old>state.player.injury?'伤势有所缓解。':''),'good');save();render();showResult('闭门休整',`气血 +${state.player.hp-before}\n灵力恢复至满值${old>state.player.injury?`\n伤势：${['无伤','轻伤','重伤','濒死'][old]} → ${injuryLabel()}`:''}`,'good')}
function rumor(){advanceDays(1);addDiligence(1);let msg;if(state.major.recruit?.status==='announced')msg='青云宗收徒之日临近，附近不少少年已经启程。';else if(state.world.beastPressure>68)msg='黑风岭里的妖兽越来越躁动，山脚猎户已经不敢深入。';else msg=pick(['临江城坊市最近灵米涨价。','有人说血刀门在暗中招揽散修。','青云山近日有剑光划过云海。','一个散修在黑风岭捡到残破储物袋，一夜暴富。']);addWorld(msg);addPersonal(`你花了一天四处打听：${msg}`);save();render();showResult('打听消息',msg)}
function explore(){advanceDays(1);addDiligence(2);const l=locationProfile(),danger=l.danger||.20,x=rand();if(x<danger){startCombat(weightedEnemy());return}if(x<danger+(l.eventRate||.08)){startRegionalEvent();return}if(x<danger+(l.eventRate||.08)+.22){startMinorEvent();return}if(x<danger+(l.eventRate||.08)+.38){const range=l.find||[1,4],n=rint(range[0],range[1]);state.player.spiritStones+=n;addPersonal(`你在${state.player.location}一处隐蔽角落找到 ${n} 块灵石。`,'good');save();render();showResult('意外收获',`灵石 +${n}\n此地探索危险：${locationDangerText(l)}`,'good');return}addPersonal(`你在${state.player.location}转了一日，只记下了附近地形与人流。`);save();render();showResult('区域探索',`这一日没有额外收获。\n${state.player.location}：${l.specialty}`)}
function startRegionalEvent(){
 const l=locationProfile(),kind=l.eventKind||'stones',name=state.player.location;let text='';
 if(kind==='herb'){const n=rint(1,2)+(l.herb||0);state.player.herbs+=n;text='顺着当地修士留下的采集痕迹，你额外找到 '+n+' 株灵草。';showResult('地域机缘',text+'\n灵草 +'+n,'good')}
 else if(kind==='materials'){const n=rint(1,2);state.player.beastMaterials+=n;text='你在险地边缘找到可用于锻造的残骨与灵材，共 '+n+' 份。';showResult('地域机缘',text+'\n兽材 +'+n,'good')}
 else if(kind==='manual'){const n=rint(5,12);state.player.manualProf+=n;text='你旁听同道演法，对自身行功路线多了几分理解。';showResult('山门见闻',text+'\n功法熟练度 +'+n,'good')}
 else if(kind==='relic'){state.player.relicFragments+=1;text='断壁下露出一枚带有古老纹路的残片。';showResult('遗迹残物',text+'\n古修残片 +1','good')}
 else if(kind==='insight'){if(rand()<.35){state.player.insight+=1;text='阴煞与灵机交错的一瞬，你忽然抓住一缕感悟。';showResult('禁地悟道',text+'\n悟道点 +1','good')}else{const n=rint(10,22);state.player.manualProf+=n;text='你从阴煞流向中悟出一些运气法门。';showResult('禁地见闻',text+'\n功法熟练度 +'+n,'good')}}
 else{const range=l.find||[1,4],n=rint(range[0],range[1]);state.player.spiritStones+=n;text='当地商旅与修士流动频繁，你抓住一桩短差赚到 '+n+' 块灵石。';showResult('地域机缘',text+'\n灵石 +'+n,'good')}
 addPersonal('【地域见闻】'+name+'：'+text,'good');save();render()
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
function startCombat(enemyTemplate){const e=JSON.parse(JSON.stringify(enemyTemplate));if(!e.reward)e.reward={stones:[0,0],herbs:[0,0],rep:0};if(!e.reward.herbs)e.reward.herbs=[0,0];combat={enemy:e,enemyHp:e.hp,playerHp:state.player.hp,playerQi:state.player.qi,defending:false,evade:0,round:1,logs:[`你遭遇了${e.name}。危险判断：${dangerLabel(e)}。`]};renderCombat()}
function renderCombat(){const e=combat.enemy,pPct=clamp(combat.playerHp/maxHp()*100,0,100),ePct=clamp(combat.enemyHp/e.hp*100,0,100),wind='御风步'in state.player.spells;let html=`<h2>遭遇战 · 第${combat.round}回合</h2><div class="combatants"><div class="fighter"><b>${esc(state.player.name)}</b><div class="hp">${realm().name} · 气血 ${combat.playerHp}/${maxHp()} · 灵力 ${combat.playerQi}/${maxQi()}</div><div class="bar"><i style="width:${pPct}%"></i></div></div><div class="vs">VS</div><div class="fighter"><b>${esc(e.name)}</b><div class="hp">${esc(e.kind||'敌人')} · ${REALMS[Math.min(e.realm||0,REALMS.length-1)].name} · ${dangerLabel(e)}</div><div class="hp">气血 ${Math.max(0,combat.enemyHp)}/${e.hp}</div><div class="bar"><i style="width:${ePct}%"></i></div></div></div><div class="combat-log">${combat.logs.slice(-9).map(x=>`• ${esc(x)}<br>`).join('')}</div><div class="modal-actions two"><button data-combat="attack">拳脚攻击</button><button data-combat="spell" ${!('火弹术'in state.player.spells)||combat.playerQi<SPELLS['火弹术'].qi?'disabled':''}>火弹术</button><button data-combat="wind" ${!wind||combat.playerQi<SPELLS['御风步'].qi?'disabled':''}>御风步</button><button data-combat="defend">防御</button><button data-combat="flee">逃跑</button></div>`;openModal(html,false);document.querySelectorAll('[data-combat]').forEach(b=>b.onclick=()=>combatAction(b.dataset.combat))}
function combatAction(a){if(!combat||state.flags.dead)return;const e=combat.enemy;combat.defending=false;if(a==='attack'){const prof=state.player.spells['基础拳脚']||0,dmg=rint(7,12)+state.player.realmIndex*3+Math.floor(prof/35)+Math.floor(state.player.manualProf/80)+gearAtk();combat.enemyHp-=dmg;state.player.spells['基础拳脚']=prof+2;combat.logs.push(`你近身攻出一击，造成 ${dmg} 点伤害。`)}else if(a==='spell'){const sp=SPELLS['火弹术'];if(!('火弹术'in state.player.spells)||combat.playerQi<sp.qi)return;combat.playerQi-=sp.qi;const prof=state.player.spells['火弹术']||0,dmg=sp.power+rint(2,8)+state.player.realmIndex*4+Math.floor(prof/14);combat.enemyHp-=dmg;state.player.spells['火弹术']=prof+4;combat.logs.push(`火弹炸开，造成 ${dmg} 点伤害。`)}else if(a==='wind'){const sp=SPELLS['御风步'];if(!('御风步'in state.player.spells)||combat.playerQi<sp.qi)return;combat.playerQi-=sp.qi;const prof=state.player.spells['御风步']||0;state.player.spells['御风步']=prof+3;combat.evade=2;combat.logs.push('你运转御风步，接下来两回合更容易闪开攻击。')}else if(a==='defend'){combat.defending=true;combat.logs.push('你收敛气息，架势转守。')}else if(a==='flee'){const diff=(e.realm||0)-state.player.realmIndex,windBonus=('御风步'in state.player.spells)?Math.min(.30,(state.player.spells['御风步']||0)/180):0,chance=clamp(.40+windBonus-diff*.08,.12,.78);if(rand()<chance){state.player.hp=Math.max(1,combat.playerHp);state.player.qi=combat.playerQi;addPersonal(`你从${e.name}手中脱身。`);combat=null;save();render();closeModal();showResult('成功脱身','你没有继续纠缠。');return}else combat.logs.push('你试图脱身，但被对方逼了回来。')}if(combat.enemyHp<=0){finishCombat(true);return}let dodged=false;if(combat.evade>0){combat.evade--;const prof=state.player.spells['御风步']||0;if(rand()<clamp(.34+prof/500,0,.62)){dodged=true;combat.logs.push(`御风步生效，你避开了${e.name}的反击。`)}}if(!dodged){let edmg=rint(e.atk[0],e.atk[1]);if(combat.enemyHp/e.hp<.32&&rand()<.30){edmg=Math.ceil(edmg*1.35);combat.logs.push(`${e.name}在伤势刺激下突然暴起！`)}if(combat.defending)edmg=Math.ceil(edmg*.52);edmg=Math.max(1,edmg-Math.floor(state.player.realmIndex*.8)-gearDef());combat.playerHp-=edmg;combat.logs.push(`${e.name}反击，造成 ${edmg} 点伤害。`)}if(combat.playerHp<=0){finishCombat(false);return}combat.round++;renderCombat()}
function finishCombat(win){const e=combat.enemy;if(win){const stones=rint(e.reward.stones?.[0]||0,e.reward.stones?.[1]||0),herbs=rint(e.reward.herbs?.[0]||0,e.reward.herbs?.[1]||0);state.player.spiritStones+=stones;state.player.herbs+=herbs;state.player.reputation+=e.reward.rep||0;state.player.hp=Math.max(1,combat.playerHp);state.player.qi=combat.playerQi;state.player.battleWins++;state.player.kills++;onSectCombatWin(e);onGearCombatWin(e);onSecretRealmCombatWin(e);onFactionWarCombatWin(e);addDiligence(3);addPersonal(`你击败${e.name}。${stones?`获得${stones}块灵石。`:''}${herbs?`获得${herbs}株灵草。`:''}`,'good');combat=null;closeModal();save();render();showResult('战斗胜利',`${stones?`灵石 +${stones}\n`:''}${herbs?`灵草 +${herbs}\n`:''}${e.reward.rep?`声望 +${e.reward.rep}\n`:''}战绩 ${state.player.battleWins}胜 ${state.player.battleLosses}败`,'good')}else{state.player.battleLosses++;const risk=deathRisk(e);if(risk>0&&rand()<risk){state.flags.dead=true;state.player.hp=0;state.player.qi=0;addPersonal(`你败在${e.name}手中，伤势过重，身死道消。`,'bad');combat=null;closeModal();save();render();showResult('身死道消',`敌人：${e.name}\n此世已经结束。`,'bad');return}const diff=Math.max(0,(e.realm||0)-state.player.realmIndex),add=diff>=2?2:1;state.player.injury=clamp((state.player.injury||0)+add,0,3);const lost=Math.min(state.player.spiritStones,rint(0,Math.max(2,diff+1)));state.player.spiritStones-=lost;state.player.hp=Math.max(1,Math.ceil(maxHp()*(state.player.injury>=3?.18:.30)));state.player.qi=0;addPersonal(`你败在${e.name}手下，拖着${injuryLabel()}逃了回来。`,'bad');combat=null;closeModal();save();render();showResult('战斗失败',`你侥幸活了下来。\n当前伤势：${injuryLabel()}${lost?`\n遗失灵石 ${lost}`:''}\n建议先闭门休整。`,'bad')}}
function majorDef(id,title,location,announce,start,end,text){return{id,title,location,announce,start,end,text}}
const MAJORS=[majorDef('recruit','青云宗开山收徒','青云山',4,8,12,'青云宗将在山门外测验灵根。资质出众者可直接入门，普通人也可能得到杂役弟子的机会。'),majorDef('cave','苍梧古洞现世','黑风岭',25,30,36,'黑风岭深处出现古修洞府霞光，各方散修已经闻风而动。')];
function getMajor(id){return state.major[id]}
function ensureMajor(d,status){if(!state.major[d.id])state.major[d.id]={...d,status,participated:false};return state.major[d.id]}
function updateMajorEvents(){const dn=dayNumber();for(const d of MAJORS){if(dn>=d.announce&&!state.major[d.id]){ensureMajor(d,'announced');addWorld(`【天下大事】${d.title}：${d.text}`,'major')}const m=state.major[d.id];if(!m)continue;if(dn>=d.start&&dn<=d.end&&!m.participated&&m.status!=='ended')m.status='active';if(dn>d.end&&!m.participated&&m.status!=='ended'){m.status='ended';autoResolveMajor(m)}}
 if(state.world.beastPressure>=74&&!state.major.beast){const start=dayNumber()+2;state.major.beast={id:'beast',title:'黑风岭兽潮','location':'黑风岭',announce:dayNumber(),start,end:start+5,text:'黑风岭群兽躁动，青石镇已向附近修士求援。',status:'announced',participated:false};addWorld('【紧急大事】黑风岭兽潮将至！青石镇向四方修士求援。','major')}
 const b=state.major.beast;if(b){if(dayNumber()>=b.start&&dayNumber()<=b.end&&!b.participated&&b.status!=='ended')b.status='active';if(dayNumber()>b.end&&!b.participated&&b.status!=='ended'){b.status='ended';autoResolveMajor(b)}}}
function autoResolveMajor(m){if(m.id==='recruit'){addWorld('青云宗本次收徒结束。数十名少年入门，各自命运自此分流。','major')}else if(m.id==='beast'){const win=state.world.qingyunPower+rint(-15,15)>state.world.beastPressure;if(win){state.world.beastPressure=38;addWorld('青云宗与附近散修联手压下兽潮，青石镇保住了。','major')}else{state.world.casualties+=rint(80,250);state.world.beastPressure=55;addWorld(`兽潮冲破防线，青石镇死伤惨重。已记录死亡 ${state.world.casualties} 人。`,'bad')}}else if(m.id==='cave'){const npc=pick(state.npcs.filter(n=>n.alive));npc.known=true;npc.realmIndex=Math.min(npc.realmIndex+1,8);addWorld(`${m.title}关闭。传闻${npc.name}在洞府中获得机缘，修为大进。`,'major')}}
function participateMajor(id){const m=state.major[id];if(!m||m.status!=='active')return showResult('无法参与','这个事件现在并不处于可参与阶段。','bad');if(state.player.location!==m.location)return showResult('路途未至',`需要先前往【${m.location}】。事件不会等你。`,'bad');m.participated=true;m.status='ended';if(id==='recruit'){if(root().mult>=1.25||state.player.realmIndex>=1){state.player.manual='青云引气诀';state.player.manualProf=Math.max(10,state.player.manualProf);state.player.reputation+=6;joinQingyunSect();addPersonal('你通过青云宗测验，被收入外门，并得到《青云引气诀》。','major');showResult('青云宗收徒',`你通过测试，成为青云宗外门弟子。\n获得《青云引气诀》\n声望 +6`,'good')}else{state.player.reputation+=2;addPersonal('你的灵根并不出众，但你在试炼中的坚持被执事记住，得到一本《青云引气诀》抄本。','good');state.player.manual='青云引气诀';showResult('青云宗收徒',`没有一步登天，但你拿到了真正的修仙功法。\n获得《青云引气诀》`,'good')}}
 else if(id==='beast'){startCombat({name:'兽潮中的铁背狼妖',realm:1,hp:92,atk:[10,17],reward:{stones:[4,8],rep:6},weight:1});state.world.beastPressure=Math.max(30,state.world.beastPressure-18)}
 else if(id==='cave'){const gain=rint(35,70);state.player.progress=Math.min(realm().need,state.player.progress+gain);state.player.spiritStones+=rint(4,9);state.player.reputation+=3;addPersonal('你闯入苍梧古洞，在残破石室里得到一缕精纯灵气与散落灵石。','major');showResult('古洞机缘',`修为 +${gain}\n灵石有所增加\n声望 +3`,'good')}save();render()}
function travel(to,routeId=null){
 if(state?.flags?.dead)return showResult('此世已终','你已经身死道消。','bad');const from=state.player.location,route=getTravelRoute(from,to,routeId);if(!route)return showResult('道路不通','当前没有从【'+from+'】直达【'+to+'】的路线。','bad');if((route.fee||0)>state.player.spiritStones)return showResult('路费不足','选择【'+route.name+'】需要路费 '+route.fee+' 块灵石。','bad');
 const risk=effectiveRouteRisk(route);if(route.fee)state.player.spiritStones-=route.fee;advanceDays(route.days);if(state.flags.dead)return;state.player.location=to;addDiligence(1);addPersonal('你从'+from+'沿【'+route.name+'】赶路 '+route.days+' 日，抵达'+to+'。');const outcome=resolveTravelEncounter(route,from,to,risk);save();render();if(outcome.combat)return;showResult('行旅抵达',from+' → '+to+'\n路线：'+route.name+'\n耗时 '+route.days+' 日'+(route.fee?'\n路费 -'+route.fee+' 灵石':'')+'\n预计风险 '+Math.round(risk*100)+'%\n'+outcome.text,outcome.type||'')
}
function spendInsight(type){if(state.player.insight<1)return showResult('悟道点不足','每积累 20 点勤勉，可自动凝聚 1 点悟道点。','bad');state.player.insight--;if(type==='cultivate'){const n=55+state.player.realmIndex*8;state.player.progress=Math.min(realm().need,state.player.progress+n);addPersonal(`【天道酬勤】你消耗1点悟道，修为猛涨 ${n}。`,'good');showResult('顿悟修为',`修为 +${n}`,'good')}else if(type==='manual'){state.player.manualProf+=40;addPersonal(`你对《${state.player.manual}》有了新的领悟。`,'good');showResult('顿悟功法',`《${state.player.manual}》熟练度 +40`,'good')}else{const known=Object.keys(state.player.spells).filter(x=>x!=='基础拳脚');if(!known.length){state.player.insight++;return showResult('暂无法术','踏入炼气一层后再来。','bad')}const s=known[0];state.player.spells[s]+=40;addPersonal(`你顿悟了${s}。`,'good');showResult('顿悟法术',`${s} 熟练度 +40`,'good')}save();render()}

const SECT_TASKS={
 chores:{id:'chores',title:'药圃杂役',desc:'替外门药圃整理灵土、搬运药材。安全，但贡献不高。',days:2,contrib:6,stones:1,rep:0},
 patrol:{id:'patrol',title:'巡查山门',desc:'随执事巡查青云山外围，驱赶凡俗盗匪与野兽。',days:2,contrib:8,stones:2,rep:1},
 hunt:{id:'hunt',title:'黑风岭除妖',desc:'前往黑风岭，击杀两头妖兽。风险高，贡献也最多。',need:2,contrib:14,stones:3,rep:2}
};
function isSectMember(){return state.player.sect==='青云宗'}
function joinQingyunSect(){const p=state.player;if(p.sect==='青云宗')return;p.sect='青云宗';p.sectRank='外门弟子';p.sectContribution=Math.max(0,p.sectContribution||0);p.sectTasksCompleted=p.sectTasksCompleted||0;p.sectTask=null;addWorld(`${p.name}通过青云宗收徒试炼，正式列入外门名册。`,'major')}
function sectMonthKey(){return (state.time.year-1)*12+state.time.month}
function acceptSectTask(id){
 if(!isSectMember())return showResult('尚未入宗','你现在还不是青云宗弟子。','bad');
 if(state.player.location!=='青云山')return showResult('不在山门','领取宗门任务需要先回到青云山。','bad');
 if(state.player.sectTask)return showResult('已有任务',`先完成【${state.player.sectTask.title}】。`,'bad');
 const d=SECT_TASKS[id];if(!d)return;
 state.player.sectTask={id:d.id,title:d.title,progress:0,need:d.need||1,acceptedDay:dayNumber()};
 addPersonal(`你在宗务堂领取了【${d.title}】。`,'good');save();render();showResult('领取宗门任务',`【${d.title}】\n${d.desc}`,'good')
}
function completeRoutineSectTask(){
 const t=state.player.sectTask;if(!t||t.id==='hunt')return;
 if(state.player.location!=='青云山')return showResult('需回山门','这项宗门差事要在青云山完成。','bad');
 const d=SECT_TASKS[t.id];advanceDays(d.days);state.player.sectContribution+=d.contrib;state.player.spiritStones+=d.stones;state.player.reputation+=d.rep;state.player.sectTasksCompleted++;state.player.sectTask=null;addDiligence(2);addPersonal(`你完成宗门任务【${d.title}】，宗门贡献 +${d.contrib}。`,'good');save();render();showResult('宗门任务完成',`贡献 +${d.contrib}\n灵石 +${d.stones}${d.rep?`\n声望 +${d.rep}`:''}`,'good')
}
function onSectCombatWin(e){
 const t=state.player.sectTask;if(!t||t.id!=='hunt'||state.player.location!=='黑风岭'||e.kind!=='妖兽')return;
 t.progress++;addPersonal(`【宗门任务】黑风岭除妖进度 ${t.progress}/${t.need}。`,'good');
 if(t.progress>=t.need){const d=SECT_TASKS.hunt;state.player.sectContribution+=d.contrib;state.player.spiritStones+=d.stones;state.player.reputation+=d.rep;state.player.sectTasksCompleted++;state.player.sectTask=null;addWorld(`${state.player.name}完成青云宗黑风岭除妖差事，宗门贡献有所提升。`);addPersonal(`你完成【${d.title}】，贡献 +${d.contrib}，灵石 +${d.stones}。`,'major')}
}
function claimSectStipend(){
 if(!isSectMember())return showResult('尚未入宗','你没有宗门月俸。','bad');
 if(state.player.location!=='青云山')return showResult('不在山门','月俸要到青云山宗务堂领取。','bad');
 const key=sectMonthKey();if(state.player.sectLastStipend===key)return showResult('本月已领','这个月的宗门月俸已经领取。');
 const inner=state.player.sectRank==='内门弟子',stones=inner?6:3,herbs=inner?2:1;state.player.sectLastStipend=key;state.player.spiritStones+=stones;state.player.herbs+=herbs;addPersonal(`你领取${state.player.sectRank}月俸：灵石 ${stones}、灵草 ${herbs}。`,'good');save();render();showResult('领取月俸',`灵石 +${stones}\n灵草 +${herbs}`,'good')
}
function sectExchange(kind){
 if(!isSectMember())return;
 const p=state.player;
 if(kind==='stones'){if(p.sectContribution<10)return showResult('贡献不足','兑换需要 10 点宗门贡献。','bad');p.sectContribution-=10;p.spiritStones+=4;showResult('贡献兑换','宗门贡献 -10\n灵石 +4','good')}
 else if(kind==='herbs'){if(p.sectContribution<8)return showResult('贡献不足','兑换需要 8 点宗门贡献。','bad');p.sectContribution-=8;p.herbs+=3;showResult('贡献兑换','宗门贡献 -8\n灵草 +3','good')}
 else if(kind==='manual'){if(p.manual==='赤炎诀')return showResult('已经掌握','你当前已经在修炼《赤炎诀》。');if(p.sectContribution<30)return showResult('贡献不足','兑换《赤炎诀》需要 30 点宗门贡献。','bad');p.sectContribution-=30;p.manual='赤炎诀';p.manualProf=0;addPersonal('你用宗门贡献换得《赤炎诀》，并改修此功。','major');showResult('兑换功法','获得并改修《赤炎诀》\n宗门贡献 -30','good')}
 save();render()
}
function promoteSect(){
 const p=state.player;if(!isSectMember())return;
 if(p.sectRank==='内门弟子')return showResult('已经晋升','你现在已经是青云宗内门弟子。');
 if(p.realmIndex<3||p.sectContribution<60)return showResult('条件不足',`晋升内门需要：炼气三层、宗门贡献 60。\n当前：${realm().name}、贡献 ${p.sectContribution}。`,'bad');
 p.sectContribution-=40;p.sectRank='内门弟子';p.reputation+=5;addPersonal('你通过青云宗内门考核，正式晋升内门弟子。','major');addWorld(`${p.name}晋升青云宗内门弟子。`,'major');save();render();showResult('晋升内门','身份：内门弟子\n宗门贡献 -40\n声望 +5','good')
}
function renderSect(){
 const info=$('sectInfo'),actions=$('sectActions');if(!info||!actions)return;const p=state.player;
 if(!isSectMember()){info.innerHTML='<div class="section-tip">你目前无门无派。青云宗开山收徒时，通过考核才会获得正式弟子身份。</div>';actions.innerHTML='';return}
 const t=p.sectTask,taskText=t?`<div class="skill-card"><div class="skill-head"><b>当前任务：${esc(t.title)}</b><span>${t.id==='hunt'?`进度 ${t.progress}/${t.need}`:'进行中'}</span></div><div class="skill-desc">${SECT_TASKS[t.id]?.desc||''}</div></div>`:'';
 info.innerHTML=`<div class="kv"><span>宗门</span><b>青云宗</b></div><div class="kv"><span>身份</span><b>${p.sectRank}</b></div><div class="kv"><span>宗门贡献</span><b>${p.sectContribution}</b></div><div class="kv"><span>已完成任务</span><b>${p.sectTasksCompleted}</b></div>${taskText}`;
 if(t){actions.innerHTML=t.id==='hunt'?`<div class="section-tip">前往【黑风岭】击杀妖兽即可自动累计任务进度。</div>`:`<button class="primary" data-sect-complete>执行任务 · ${SECT_TASKS[t.id].days}日</button>`}
 else actions.innerHTML=`<div class="event-actions"><button data-sect-task="chores">药圃杂役 · 贡献6</button><button data-sect-task="patrol">巡查山门 · 贡献8</button><button data-sect-task="hunt">黑风岭除妖 · 贡献14</button></div>`;
 actions.innerHTML+=`<div class="event-actions"><button data-sect-stipend>领取本月月俸</button><button data-sect-exchange="stones">10贡献 → 4灵石</button><button data-sect-exchange="herbs">8贡献 → 3灵草</button><button data-sect-exchange="manual">30贡献 → 《赤炎诀》</button><button data-sect-promote>晋升内门</button></div>`;
 actions.querySelectorAll('[data-sect-task]').forEach(b=>b.onclick=()=>acceptSectTask(b.dataset.sectTask));const c=actions.querySelector('[data-sect-complete]');if(c)c.onclick=completeRoutineSectTask;const st=actions.querySelector('[data-sect-stipend]');if(st)st.onclick=claimSectStipend;actions.querySelectorAll('[data-sect-exchange]').forEach(b=>b.onclick=()=>sectExchange(b.dataset.sectExchange));const pr=actions.querySelector('[data-sect-promote]');if(pr)pr.onclick=promoteSect;
}


function marketPrices(){const idx=state.world.marketIndex||100;return {idx,herbBuy:Math.max(3,Math.ceil(4*idx/100)),herbSell:Math.max(1,Math.floor(3*idx/100)),pillBuy:Math.max(6,Math.ceil(8*idx/100))}}
function marketTrend(){const i=state.world.marketIndex||100;return i>=120?'火热':i>=106?'偏贵':i>=94?'平稳':i>=84?'偏低':'低迷'}
function marketTrade(kind,count=1){
 if(state.player.location!=='临江城')return showResult('不在坊市','只有到临江城才能进行坊市交易。','bad');
 count=Math.max(1,Math.floor(count));const p=marketPrices(),pl=state.player;
 if(kind==='buyHerb'){
   const cost=p.herbBuy*count;if(pl.spiritStones<cost)return showResult('灵石不足',`购买 ${count} 株灵草需要 ${cost} 块灵石。`,'bad');
   pl.spiritStones-=cost;pl.herbs+=count;pl.tradeVolume+=cost;addPersonal(`你在临江坊市买下 ${count} 株灵草，花费 ${cost} 块灵石。`,'good');showResult('买入灵草',`灵草 +${count}\n灵石 -${cost}`,'good');
 }else if(kind==='sellHerb'){
   if(pl.herbs<count)return showResult('灵草不足',`你没有 ${count} 株灵草可卖。`,'bad');const gain=p.herbSell*count;pl.herbs-=count;pl.spiritStones+=gain;pl.tradeVolume+=gain;addPersonal(`你在临江坊市卖出 ${count} 株灵草，换得 ${gain} 块灵石。`,'good');showResult('卖出灵草',`灵草 -${count}\n灵石 +${gain}`,'good');
 }else if(kind==='buyPill'){
   const cost=p.pillBuy*count;if(pl.spiritStones<cost)return showResult('灵石不足',`购买 ${count} 份回春散需要 ${cost} 块灵石。`,'bad');pl.spiritStones-=cost;pl.healingPills+=count;pl.tradeVolume+=cost;addPersonal(`你在药铺买下 ${count} 份回春散，花费 ${cost} 块灵石。`,'good');showResult('购买回春散',`回春散 +${count}\n灵石 -${cost}`,'good');
 }else return;
 save();render()
}
function useHealingPill(){
 const pl=state.player;if(pl.healingPills<=0)return showResult('没有药物','你身上没有回春散。','bad');if(pl.hp>=maxHp()&&(pl.injury||0)===0)return showResult('无需用药','你现在气血充盈，也没有伤势。');
 const beforeHp=pl.hp,beforeInjury=pl.injury||0;pl.healingPills--;pl.hp=Math.min(maxHp(),pl.hp+Math.ceil(maxHp()*.42));if(pl.injury>0)pl.injury--;addPersonal(`你服下一份回春散，气血恢复，伤势由${['无伤','轻伤','重伤','濒死'][beforeInjury]}缓解为${injuryLabel()}。`,'good');save();render();showResult('服用回春散',`气血 +${pl.hp-beforeHp}\n伤势：${['无伤','轻伤','重伤','濒死'][beforeInjury]} → ${injuryLabel()}\n剩余回春散 ${pl.healingPills}`,'good')
}
function renderMarket(){
 const info=$('marketInfo'),actions=$('marketActions');if(!info||!actions)return;const p=marketPrices(),pl=state.player,here=pl.location==='临江城';
 info.innerHTML=`<div class="kv"><span>临江坊市行情</span><b>${marketTrend()} · 指数 ${p.idx}</b></div><div class="kv"><span>灵草买入 / 卖出</span><b>${p.herbBuy} / ${p.herbSell} 灵石</b></div><div class="kv"><span>回春散</span><b>${p.pillBuy} 灵石 / 份</b></div><div class="kv"><span>随身回春散</span><b>${pl.healingPills}</b></div><div class="kv"><span>累计交易额</span><b>${pl.tradeVolume}</b></div>`;
 actions.innerHTML=here?`<div class="event-actions"><button data-market="buyHerb">买1株灵草</button><button data-market="buyHerb5">买5株灵草</button><button data-market="sellHerb">卖1株灵草</button><button data-market="sellHerb5">卖5株灵草</button><button data-market="buyPill">买1份回春散</button>${pl.healingPills>0?'<button data-market="usePill">服用回春散</button>':''}</div>`:`<div class="section-tip">交易需要前往【临江城】。${pl.healingPills>0?'你仍可使用随身携带的回春散。':''}</div>${pl.healingPills>0?'<div class="event-actions"><button data-market="usePill">服用回春散</button></div>':''}`;
 actions.querySelectorAll('[data-market]').forEach(b=>b.onclick=()=>{const k=b.dataset.market;if(k==='buyHerb')marketTrade('buyHerb',1);else if(k==='buyHerb5')marketTrade('buyHerb',5);else if(k==='sellHerb')marketTrade('sellHerb',1);else if(k==='sellHerb5')marketTrade('sellHerb',5);else if(k==='buyPill')marketTrade('buyPill',1);else if(k==='usePill')useHealingPill()})
}


const ALCHEMY_RECIPES={
 healing:{id:'healing',name:'回春散',herbs:2,stones:1,base:.62,unlock:0,desc:'疗伤散剂。服用后恢复气血，并缓解一级伤势。'},
 qi:{id:'qi',name:'聚气丹',herbs:3,stones:2,base:.50,unlock:1,desc:'炼气期丹药。服用后立即恢复大量灵力，省去休整时间。'}
};
function alchemyChance(recipe){const prof=state.player.alchemyProf||0,inner=state.player.sectRank==='内门弟子'?.05:0;return clamp(recipe.base+Math.min(.28,prof/420)+inner,.35,.95)}
function alchemyGradeChance(){return clamp(.04+(state.player.alchemyProf||0)/700,.04,.28)}
function brewAlchemy(id){
 if(state&&state.flags&&state.flags.dead)return showResult('此世已终','你已经身死道消。','bad');const r=ALCHEMY_RECIPES[id];if(!r)return;
 if(state.player.realmIndex<r.unlock)return showResult('丹方未解锁','【'+r.name+'】至少需要达到'+REALMS[r.unlock].name+'才能尝试炼制。','bad');
 if(state.player.herbs<r.herbs||state.player.spiritStones<r.stones)return showResult('材料不足','炼制【'+r.name+'】需要灵草 '+r.herbs+'、灵石 '+r.stones+'。\n当前：灵草 '+state.player.herbs+'、灵石 '+state.player.spiritStones+'。','bad');
 const before=alchemyChance(r);state.player.herbs-=r.herbs;state.player.spiritStones-=r.stones;state.player.alchemyBatches++;advanceDays(1);addDiligence(2);
 const success=rand()<before;
 if(success){const extra=rand()<alchemyGradeChance()?1:0,count=1+extra;if(id==='healing')state.player.healingPills+=count;else state.player.qiPills+=count;state.player.alchemyProf+=7;addPersonal('你守炉一日，成功炼成【'+r.name+'】'+count+'份'+(extra?'，其中一炉药性格外凝练':'')+'。炼丹熟练度 +7。','good');save();render();showResult('炼丹成功','【'+r.name+'】 +'+count+'\n炼丹熟练度 +7\n当前成功率 '+Math.round(alchemyChance(r)*100)+'%','good')}
 else{state.player.alchemyProf+=3;addPersonal('你炼制【'+r.name+'】时火候失衡，药材尽毁，但记住了这次教训。炼丹熟练度 +3。','bad');save();render();showResult('炼丹失败','材料已经消耗。\n炼丹熟练度 +3\n当前成功率 '+Math.round(alchemyChance(r)*100)+'%','bad')}
}
function useQiPill(){
 const p=state.player;if(p.qiPills<=0)return showResult('没有丹药','你身上没有聚气丹。','bad');if(maxQi()<=0)return showResult('尚未炼气','凡人还无法炼化聚气丹中的灵力。','bad');if(p.qi>=maxQi())return showResult('灵力充盈','你现在灵力已满，无需服用聚气丹。');const before=p.qi;p.qiPills--;p.qi=Math.min(maxQi(),p.qi+Math.ceil(maxQi()*.68));addPersonal('你服下一枚聚气丹，灵力迅速恢复 '+(p.qi-before)+' 点。','good');save();render();showResult('服用聚气丹','灵力 +'+(p.qi-before)+'\n剩余聚气丹 '+p.qiPills,'good')
}
function renderAlchemy(){
 const info=$('alchemyInfo'),actions=$('alchemyActions');if(!info||!actions)return;const p=state.player,h=ALCHEMY_RECIPES.healing,q=ALCHEMY_RECIPES.qi;
 info.innerHTML='<div class="kv"><span>炼丹熟练度</span><b>'+p.alchemyProf+'</b></div><div class="kv"><span>已开炉</span><b>'+p.alchemyBatches+' 次</b></div><div class="kv"><span>回春散</span><b>'+p.healingPills+' 份 · 成功率 '+Math.round(alchemyChance(h)*100)+'%</b></div><div class="kv"><span>聚气丹</span><b>'+(p.realmIndex>=1?p.qiPills+' 枚 · 成功率 '+Math.round(alchemyChance(q)*100)+'%':'炼气期解锁')+'</b></div>';
 actions.innerHTML='<div class="skill-card"><div class="skill-head"><b>【回春散】</b><span>灵草2 · 灵石1 · 1日</span></div><div class="skill-desc">'+h.desc+'</div></div><div class="event-actions"><button data-alchemy="healing">开炉炼制回春散</button>'+(p.healingPills>0?'<button data-alchemy="useHeal">服用回春散</button>':'')+'</div><div class="skill-card"><div class="skill-head"><b>【聚气丹】</b><span>'+(p.realmIndex>=1?'灵草3 · 灵石2 · 1日':'炼气期解锁')+'</span></div><div class="skill-desc">'+q.desc+'</div></div><div class="event-actions"><button data-alchemy="qi" '+(p.realmIndex<1?'disabled':'')+'>开炉炼制聚气丹</button>'+(p.qiPills>0?'<button data-alchemy="useQi">服用聚气丹</button>':'')+'</div>';
 actions.querySelectorAll('[data-alchemy]').forEach(b=>b.onclick=()=>{const k=b.dataset.alchemy;if(k==='healing')brewAlchemy('healing');else if(k==='qi')brewAlchemy('qi');else if(k==='useHeal')useHealingPill();else if(k==='useQi')useQiPill()})
}


const GEAR_ITEMS={
 qinggang:{id:'qinggang',name:'青钢剑',slot:'weapon',materials:4,stones:8,atk:5,def:0,hp:0,qi:0,desc:'青钢反复锻打而成，锋锐胜过凡兵。拳脚攻击伤害 +5。'},
 xuantie:{id:'xuantie',name:'玄铁护甲',slot:'armor',materials:6,stones:10,atk:0,def:4,hp:0,qi:0,desc:'以妖兽筋皮衬玄铁片，能削去部分正面伤害。受到攻击时减伤 +4。'},
 juling:{id:'juling',name:'聚灵玉佩',slot:'charm',materials:8,stones:14,atk:0,def:0,hp:16,qi:8,desc:'以兽骨灵髓温养的玉佩。气血上限 +16，灵力上限 +8。'}
};
function equippedGear(slot){const id=state.player.equipped&&state.player.equipped[slot];return id?GEAR_ITEMS[id]||null:null}
function gearAtk(){return equippedGear('weapon')?.atk||0}
function gearDef(){return equippedGear('armor')?.def||0}
function gearHp(){return equippedGear('charm')?.hp||0}
function gearQi(){return equippedGear('charm')?.qi||0}
function onGearCombatWin(e){
 if(!e||e.kind!=='妖兽')return;const chance=clamp(.30+(e.realm||0)*.07,.30,.72);if(rand()>=chance)return;const n=1+(rand()<.18?1:0);state.player.beastMaterials+=n;addPersonal('你从'+e.name+'尸身上剥取到 '+n+' 份可用于锻造的兽材。','good')
}
function forgeGear(id){
 if(state&&state.flags&&state.flags.dead)return showResult('此世已终','你已经身死道消。','bad');const g=GEAR_ITEMS[id];if(!g)return;if(state.player.gearOwned.includes(id))return showResult('已经拥有','你已经锻造过【'+g.name+'】。');
 if(state.player.beastMaterials<g.materials||state.player.spiritStones<g.stones)return showResult('材料不足','锻造【'+g.name+'】需要兽材 '+g.materials+'、灵石 '+g.stones+'。\n当前：兽材 '+state.player.beastMaterials+'、灵石 '+state.player.spiritStones+'。','bad');
 state.player.beastMaterials-=g.materials;state.player.spiritStones-=g.stones;state.player.gearOwned.push(id);state.player.equipped[g.slot]=id;advanceDays(2);addDiligence(3);addPersonal('你耗费两日锻成【'+g.name+'】，并立即装备。','major');save();render();showResult('锻造完成','获得【'+g.name+'】并自动装备。\n兽材 -'+g.materials+'\n灵石 -'+g.stones,'good')
}
function equipGear(id){const g=GEAR_ITEMS[id];if(!g||!state.player.gearOwned.includes(id))return;state.player.equipped[g.slot]=id;state.player.hp=Math.min(state.player.hp,maxHp());state.player.qi=Math.min(state.player.qi,maxQi());save();render();showResult('装备法器','已装备【'+g.name+'】。','good')}
function renderGear(){
 const info=$('gearInfo'),actions=$('gearActions');if(!info||!actions)return;const p=state.player,w=equippedGear('weapon'),a=equippedGear('armor'),c=equippedGear('charm');
 info.innerHTML='<div class="kv"><span>兽材</span><b>'+p.beastMaterials+'</b></div><div class="kv"><span>武器</span><b>'+(w?w.name+' · 伤害 +'+w.atk:'无')+'</b></div><div class="kv"><span>护甲</span><b>'+(a?a.name+' · 减伤 +'+a.def:'无')+'</b></div><div class="kv"><span>佩饰</span><b>'+(c?c.name+' · 气血 +'+c.hp+' / 灵力 +'+c.qi:'无')+'</b></div>';
 actions.innerHTML=Object.values(GEAR_ITEMS).map(g=>'<div class="skill-card"><div class="skill-head"><b>【'+g.name+'】</b><span>兽材'+g.materials+' · 灵石'+g.stones+' · 2日</span></div><div class="skill-desc">'+g.desc+'</div></div><div class="event-actions">'+(p.gearOwned.includes(g.id)?'<button data-equip="'+g.id+'">'+(p.equipped[g.slot]===g.id?'已装备':'装备')+'</button>':'<button data-forge="'+g.id+'">锻造</button>')+'</div>').join('');
 actions.querySelectorAll('[data-forge]').forEach(b=>b.onclick=()=>forgeGear(b.dataset.forge));actions.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>equipGear(b.dataset.equip))
}


const DWELLINGS=[
 {name:'无洞府',stones:0,materials:0,cultivate:1,plot:0},
 {name:'凡阶静室',stones:15,materials:0,cultivate:1.08,plot:4},
 {name:'聚灵小院',stones:30,materials:4,cultivate:1.18,plot:7},
 {name:'青云洞府',stones:60,materials:10,cultivate:1.32,plot:10}
];
function dwellingCultivationMultiplier(){const p=state.player;if(!p.dwellingTier||p.location!==p.dwellingLocation)return 1;return DWELLINGS[p.dwellingTier].cultivate}
function buildOrUpgradeDwelling(){
 const p=state.player,next=(p.dwellingTier||0)+1;if(next>=DWELLINGS.length)return showResult('洞府已至当前极限','青云洞府已经是当前版本最高等级。');
 if(!p.dwellingTier&&!['青石镇','临江城','青云山'].includes(p.location))return showResult('此地不宜筑府','需要先前往青石镇、临江城或青云山，再择地筑府。','bad');
 if(p.dwellingTier&&p.location!==p.dwellingLocation)return showResult('不在洞府','你的洞府位于【'+p.dwellingLocation+'】，需要先回去才能扩建。','bad');
 const d=DWELLINGS[next];if(p.spiritStones<d.stones||p.beastMaterials<d.materials)return showResult('建材不足','升级至【'+d.name+'】需要灵石 '+d.stones+'、兽材 '+d.materials+'。\n当前：灵石 '+p.spiritStones+'、兽材 '+p.beastMaterials+'。','bad');
 p.spiritStones-=d.stones;p.beastMaterials-=d.materials;if(!p.dwellingTier)p.dwellingLocation=p.location;p.dwellingTier=next;advanceDays(3);addDiligence(2);addPersonal('你耗时三日，将居所营造为【'+d.name+'】。从此在此地修炼可获得聚灵加成。','major');save();render();showResult('洞府营造完成','【'+d.name+'】\n日常修炼倍率 ×'+d.cultivate.toFixed(2)+'\n药圃基础产量 '+d.plot+'\n世界时间已推进 3 日。','good')
}
function retreatSevenDays(){
 const p=state.player;if(!p.dwellingTier)return showResult('尚无洞府','先在合适地点营造自己的洞府。','bad');if(p.location!==p.dwellingLocation)return showResult('不在洞府','你的洞府位于【'+p.dwellingLocation+'】。','bad');if((p.injury||0)>=2)return showResult('伤势过重','重伤状态不宜强行闭关，先疗伤。','bad');if(p.progress>=realm().need)return showResult('境界已经圆满','此时应当尝试破境，而不是继续堆积修为。');
 const tier=p.dwellingTier,d=DWELLINGS[tier],before=p.progress,base=Math.floor(realm().need*(.08+tier*.045)),gain=Math.max(1,Math.floor(base*Math.min(1.35,root().mult)*Math.min(1.25,manual().mult)));p.progress=Math.min(realm().need,p.progress+gain);p.manualProf+=tier*12;p.retreatSessions++;advanceDays(7);addDiligence(10);const actual=p.progress-before;addPersonal('你在【'+d.name+'】闭关七日，修为 +'+actual+'，功法熟练度 +'+(tier*12)+'。期间外界并未停止变化。','major');save();render();showResult('七日闭关结束','修为 +'+actual+'\n功法熟练度 +'+(tier*12)+'\n世界时间推进 7 日'+(p.progress>=realm().need?'\n当前境界已圆满，可以尝试破境。':''),'good')
}
function plantHerbPlot(){
 const p=state.player;if(!p.dwellingTier)return showResult('尚无药圃','营造洞府后才有地方开辟药圃。','bad');if(p.location!==p.dwellingLocation)return showResult('不在洞府','需要回到【'+p.dwellingLocation+'】。','bad');if(p.herbPlotSeeded)return showResult('药圃已有灵草','这批灵草还没有收获。');if(p.herbs<2||p.spiritStones<1)return showResult('种苗不足','播种需要灵草 2、灵石 1。','bad');p.herbs-=2;p.spiritStones-=1;advanceDays(1);p.herbPlotSeeded=true;p.herbPlotReady=dayNumber()+10;addDiligence(1);addPersonal('你在洞府旁开辟药圃，种下两株灵草作为种苗。','good');save();render();showResult('药圃播种','消耗灵草 2、灵石 1。\n预计第 '+p.herbPlotReady+' 日成熟。','good')
}
function harvestHerbPlot(){
 const p=state.player;if(!p.herbPlotSeeded)return showResult('药圃空置','当前没有成熟或生长中的灵草。');if(p.location!==p.dwellingLocation)return showResult('不在洞府','需要回到【'+p.dwellingLocation+'】。','bad');if(dayNumber()<p.herbPlotReady)return showResult('尚未成熟','距离成熟还有 '+(p.herbPlotReady-dayNumber())+' 日。');const tier=p.dwellingTier,yieldN=DWELLINGS[tier].plot+rint(0,tier*2);p.herbs+=yieldN;p.herbPlotSeeded=false;p.herbPlotReady=0;advanceDays(1);addDiligence(1);addPersonal('你收获洞府药圃，得到 '+yieldN+' 株灵草。','good');save();render();showResult('药圃收获','灵草 +'+yieldN+'\n收获耗时 1 日。','good')
}
function renderDwelling(){
 const info=$('dwellingInfo'),actions=$('dwellingActions');if(!info||!actions)return;const p=state.player,tier=p.dwellingTier||0,d=DWELLINGS[tier],atHome=tier&&p.location===p.dwellingLocation,plot=p.herbPlotSeeded?(dayNumber()>=p.herbPlotReady?'已成熟':'生长中 · 还需 '+(p.herbPlotReady-dayNumber())+' 日'):'空置';
 info.innerHTML='<div class="kv"><span>洞府</span><b>'+(tier?esc(d.name):'尚未营造')+'</b></div><div class="kv"><span>所在地</span><b>'+(tier?esc(p.dwellingLocation):'—')+'</b></div><div class="kv"><span>聚灵效果</span><b>'+(tier?'日常修炼 ×'+d.cultivate.toFixed(2):'无')+'</b></div><div class="kv"><span>药圃</span><b>'+plot+'</b></div><div class="kv"><span>闭关次数</span><b>'+p.retreatSessions+'</b></div>';
 let html='';if(tier<DWELLINGS.length-1){const n=DWELLINGS[tier+1];html+='<button data-dwelling="upgrade">'+(tier?'扩建为':'营造')+'【'+n.name+'】 · 灵石'+n.stones+(n.materials?' / 兽材'+n.materials:'')+' · 3日</button>'}if(tier){html+='<button data-dwelling="retreat" '+(!atHome?'disabled':'')+'>闭关七日</button>';if(!p.herbPlotSeeded)html+='<button data-dwelling="plant" '+(!atHome?'disabled':'')+'>播种药圃 · 灵草2 / 灵石1</button>';else html+='<button data-dwelling="harvest" '+(!atHome||dayNumber()<p.herbPlotReady?'disabled':'')+'>收获药圃</button>'}actions.innerHTML='<div class="event-actions">'+html+'</div>';actions.querySelectorAll('[data-dwelling]').forEach(b=>b.onclick=()=>{const k=b.dataset.dwelling;if(k==='upgrade')buildOrUpgradeDwelling();else if(k==='retreat')retreatSevenDays();else if(k==='plant')plantHerbPlot();else if(k==='harvest')harvestHerbPlot()})
}


function legacyGainThisLife(){const p=state.player,years=Math.max(0,age()-p.startAge);return Math.max(0,Math.floor(p.realmIndex/2)+Math.floor((p.reputation||0)/20)+Math.floor((p.kills||0)/8)+Math.floor((p.retreatSessions||0)/2)+(years>=5?1:0))}
function ensureLegacyDeathRecorded(){
 if(!state.flags.dead||state.flags.legacyRecorded)return 0;const gain=legacyGainThisLife();state.legacy=state.legacy||{cycles:0,merit:0,bestRealm:0,totalDeaths:0};state.legacy.merit+=gain;state.legacy.bestRealm=Math.max(state.legacy.bestRealm||0,state.player.realmIndex||0);state.legacy.totalDeaths=(state.legacy.totalDeaths||0)+1;state.flags.legacyRecorded=true;state.flags.lastLegacyGain=gain;addPersonal('这一世已经结束。你将本世经历凝成 '+gain+' 点传承。'+(gain===0?'早夭与空手而归不会凭空产生传承点。':''),'major');save();return gain
}
function reincarnate(kind){
 if(!state.flags.dead)return showResult('尚在人世','只有此世结束后才能踏入轮回。');ensureLegacyDeathRecorded();const costs={plain:0,resource:3,insight:3,root:5},cost=costs[kind];if(cost==null)return;if((state.legacy.merit||0)<cost)return showResult('传承点不足','该转世方案需要传承点 '+cost+'，当前只有 '+state.legacy.merit+'。','bad');
 const keep={time:JSON.parse(JSON.stringify(state.time)),world:JSON.parse(JSON.stringify(state.world)),npcs:JSON.parse(JSON.stringify(state.npcs)),worldLog:JSON.parse(JSON.stringify(state.worldLog)),major:JSON.parse(JSON.stringify(state.major)),legacy:JSON.parse(JSON.stringify(state.legacy))},oldName=state.player.name;keep.legacy.merit-=cost;keep.legacy.cycles=(keep.legacy.cycles||0)+1;newState(oldName);state.time=keep.time;state.world=keep.world;state.npcs=keep.npcs;state.worldLog=keep.worldLog;state.major=keep.major;state.legacy=keep.legacy;for(const n of state.npcs){n.relation=0;n.grudge=0;n.lastGiftDay=0;n.lastDaoDay=0;n.lastSparDay=0;n.lastHelpMonth=0;n.lastRevengeDay=0}state.personalLog=[];state.player.birthDay=dayNumber();state.flags={};
 if(kind==='resource'){state.player.spiritStones=12;state.player.herbs=6}else if(kind==='insight'){state.player.insight=2;state.player.manualProf=20}else if(kind==='root'){state.player.rootIndex=Math.max(2,state.player.rootIndex)}
 for(let i=0;i<30;i++)tickOneDay();for(const n of state.npcs){n.relation=0;n.grudge=0;n.lastGiftDay=0;n.lastDaoDay=0;n.lastSparDay=0;n.lastHelpMonth=0;n.lastRevengeDay=0}state.player.birthDay=dayNumber();state.player.hp=maxHp();state.player.qi=maxQi();addPersonal('轮回流转，你以十六岁之身再度醒来。这是你的第 '+(state.legacy.cycles+1)+' 世。上一世的世界仍在继续。','major');if(kind!=='plain')addPersonal('你动用了上一世留下的传承，选择了【'+({resource:'资源传承',insight:'悟道传承',root:'根骨传承'}[kind])+'】。','good');save();render();closeModal();showResult('转世完成','第 '+(state.legacy.cycles+1)+' 世开启\n剩余传承点 '+state.legacy.merit+'\n世界时间继续向前推进了 30 日。','good')
}
function renderLegacy(){
 if(!state)return;if(state.flags.dead)ensureLegacyDeathRecorded();const info=$('legacyInfo'),actions=$('legacyActions'),home=$('legacyBox'),lg=state.legacy||{cycles:0,merit:0,bestRealm:0,totalDeaths:0};const best=REALMS[Math.min(lg.bestRealm||0,REALMS.length-1)].name;if(info)info.innerHTML='<div class="kv"><span>已历轮回</span><b>'+lg.cycles+' 次</b></div><div class="kv"><span>传承点</span><b>'+lg.merit+'</b></div><div class="kv"><span>历世最高境界</span><b>'+best+'</b></div><div class="kv"><span>总死亡次数</span><b>'+lg.totalDeaths+'</b></div>';
 const opts='<button data-reincarnate="plain">平凡转世 · 免费</button><button data-reincarnate="resource" '+(lg.merit<3?'disabled':'')+'>资源传承 · 3点</button><button data-reincarnate="insight" '+(lg.merit<3?'disabled':'')+'>悟道传承 · 3点</button><button data-reincarnate="root" '+(lg.merit<5?'disabled':'')+'>根骨传承 · 5点</button>';if(actions)actions.innerHTML=state.flags.dead?'<div class="event-actions">'+opts+'</div>':'<div class="section-tip">本世尚在继续。死亡后可选择是否动用历世传承。</div>';if(home)home.innerHTML=state.flags.dead?'<div class="urgent"><div class="urgent-title">【此世已终】轮回仍可继续</div><p>本世传承 +'+(state.flags.lastLegacyGain||0)+'。你可以免费转世，也可以消耗传承点选择开局优势。</p><div class="event-actions">'+opts+'</div></div>':'';document.querySelectorAll('[data-reincarnate]').forEach(b=>b.onclick=()=>reincarnate(b.dataset.reincarnate))
}


const SECRET_REALMS=[
 {name:'云隐遗府',location:'青云山',guardian:'青铜傀儡',desc:'云海深处露出一座残破石府，禁制尚未完全消散。',weight:1.0},
 {name:'黑风古窟',location:'黑风岭',guardian:'赤目石猿',desc:'黑风岭地脉震动，一处封闭多年的古窟重新裂开。',weight:1.0},
 {name:'临江水府',location:'临江城',guardian:'玄水妖卫',desc:'临江水脉倒卷，旧日沉没水府短暂浮出水面。',weight:.9},
 {name:'云梦沉宫',location:'云梦泽',guardian:'碧甲水猿',desc:'泽国深处水位暴退，露出一座被水草缠满的古宫。',weight:1.1},
 {name:'赤霞炎窟',location:'赤霞谷',guardian:'火纹石傀',desc:'地火短暂衰退，岩壁后显出一条通往古老火窟的裂隙。',weight:1.0},
 {name:'星陨矿宫',location:'落星矿脉',guardian:'玄铁傀儡',desc:'矿脉深处传出钟鸣，一座埋在陨铁中的旧修洞府显形。',weight:1.15},
 {name:'万兽祖穴',location:'万兽山脉',guardian:'金背妖猿',desc:'群兽躁动退避，山腹中一处古老兽穴露出灵光。',weight:.95},
 {name:'古河沉城',location:'古河遗迹',guardian:'残甲尸将',desc:'旧河床塌陷，地下残城的一角重新暴露在天光下。',weight:1.2},
 {name:'玄阴古冢',location:'玄阴禁地',guardian:'玄阴鬼将',desc:'阴雾裂开一道缝隙，一座无碑古冢短暂与现世重叠。',weight:.8}
];
function weightedSecretRealmTemplate(){const rows=SECRET_REALMS.map(t=>({t,w:(t.weight||1)*(LOCATIONS[t.location]?.secret||1)}));let n=rand()*rows.reduce((a,x)=>a+x.w,0);for(const x of rows){n-=x.w;if(n<=0)return x.t}return rows[0].t}
function currentSecretRealm(){return state.world.secretRealm||null}
function spawnSecretRealm(){
 if(state.world.secretRealm)return state.world.secretRealm;const t=weightedSecretRealmTemplate(),today=dayNumber(),regional=Math.round((LOCATIONS[t.location]?.danger||.25)*8),threat=clamp(Math.max(regional,state.player.realmIndex+rint(-1,2)),0,8);const r={id:'sr-'+today+'-'+rint(100,999),name:t.name,location:t.location,guardian:t.guardian,desc:t.desc,openDay:today,closeDay:today+rint(14,22),threat:threat,stage:0,foraged:false,cleared:false};state.world.secretRealm=r;state.world.secretRealmCount=(state.world.secretRealmCount||0)+1;addWorld('【秘境现世】'+r.name+'在'+r.location+'附近显化，预计只会维持十余日。','major');return r
}
function updateSecretRealm(){
 const w=state.world,today=dayNumber();if(w.secretRealm&&today>w.secretRealm.closeDay){addWorld('【秘境关闭】'+w.secretRealm.name+'重新隐没于天地之间。',w.secretRealm.cleared?'good':'');w.secretRealm=null;w.nextSecretRealmDay=today+rint(24,40)}if(!w.secretRealm&&today>=(w.nextSecretRealmDay||18))spawnSecretRealm()
}
function secretRealmGuardian(r){const n=r.threat||0;return {name:r.guardian,kind:'秘境守卫',realm:n,hp:58+n*24,atk:[5+n*2,9+n*3],reward:{stones:[2+n,5+n*2],herbs:[1,2+Math.floor(n/3)],rep:2+Math.floor(n/2)},weight:1,secretRealmGuardian:true,secretRealmId:r.id}}
function secretRealmPrepare(mode){
 const r=currentSecretRealm();if(!r||r.cleared)return showResult('秘境不可进入','当前没有可探索的秘境。','bad');if(state.player.location!==r.location)return showResult('不在秘境入口','秘境位于【'+r.location+'】。','bad');if(r.stage!==0)return enterSecretRealm();const id=r.id;
 if(mode==='forage'){if(r.foraged)return showResult('外围已搜过','外围能带走的灵草已经被你采尽。');advanceDays(1);const rr=currentSecretRealm();if(!rr||rr.id!==id)return showResult('秘境关闭','秘境在这一日彻底消散。','bad');const herbs=rint(2,5)+Math.floor(rr.threat/3);rr.foraged=true;state.player.herbs+=herbs;addDiligence(2);addPersonal('你没有急着深入，而是在'+rr.name+'外围采得 '+herbs+' 株灵草。','good');save();render();return showResult('外围采药','灵草 +'+herbs+'\n秘境核心仍未探索。','good')}
 advanceDays(1);const rr=currentSecretRealm();if(!rr||rr.id!==id)return showResult('秘境关闭','秘境在这一日彻底消散。','bad');rr.stage=1;addDiligence(2);let text='你花了一日观察禁制，找到了相对稳妥的入路。';if(mode==='force'){const loss=Math.max(1,Math.ceil(maxHp()*.14));state.player.hp=Math.max(1,state.player.hp-loss);if(rand()<.35)state.player.injury=clamp((state.player.injury||0)+1,0,3);text='你强闯残阵，付出一些代价后冲到了守关区域。气血 -'+loss+'。'}addPersonal('【秘境】'+text,mode==='force'?'bad':'good');save();render();showResult('深入秘境',text+'\n下一步：击败守关者。',mode==='force'?'':'good')
}
function enterSecretRealm(){
 if(state.flags.dead)return showResult('此世已终','你已经身死道消。','bad');const r=currentSecretRealm();if(!r)return showResult('暂无秘境','天地间暂时没有显化中的秘境。');if(dayNumber()>r.closeDay){updateSecretRealm();save();render();return showResult('秘境已闭','你来迟了一步。','bad')}if(state.player.location!==r.location)return showResult('不在秘境入口','秘境位于【'+r.location+'】，先从地图赶过去。','bad');if(r.cleared)return showResult('已经探索完毕','这处秘境的核心机缘已经被你取走。');if(r.stage===0)return showChoice('秘境入口 · '+r.name,r.desc,[{label:'观察阵纹 · 1日',fn:()=>secretRealmPrepare('careful')},{label:'强闯残阵 · 1日',fn:()=>secretRealmPrepare('force')},{label:(r.foraged?'外围已采过':'先在外围采药 · 1日'),disabled:r.foraged,fn:()=>secretRealmPrepare('forage')}]);if(r.stage===1){const id=r.id;advanceDays(1);const rr=currentSecretRealm();if(!rr||rr.id!==id)return showResult('秘境关闭','守关之前，秘境已经崩散。','bad');startCombat(secretRealmGuardian(rr));return}if(r.stage===2)return showChoice('秘境核心 · '+r.name,'守关者已经倒下，真正的机缘就在前方。',[{label:'搜寻核心机缘 · 1日',fn:claimSecretRealmCore},{label:'暂且离开',fn:()=>showResult('暂离秘境','只要秘境尚未关闭，你仍可回来。')}])
}
function onSecretRealmCombatWin(e){const r=currentSecretRealm();if(!e||!e.secretRealmGuardian||!r||r.id!==e.secretRealmId||r.cleared)return;r.stage=2;addPersonal('你击败了'+e.name+'，'+r.name+'的核心区域终于向你敞开。','major')}
function claimSecretRealmCore(){
 const r=currentSecretRealm();if(!r||r.cleared||r.stage!==2)return showResult('没有可取的核心机缘','先击败秘境守关者。','bad');const id=r.id;advanceDays(1);const rr=currentSecretRealm();if(!rr||rr.id!==id)return showResult('秘境崩散','你与核心机缘失之交臂。','bad');const frag=1+Math.min(2,Math.floor(rr.threat/3))+ (rand()<.25?1:0),stones=rint(5,12)+rr.threat*2,herbs=rint(2,5)+Math.floor(rr.threat/2);state.player.relicFragments+=frag;state.player.spiritStones+=stones;state.player.herbs+=herbs;state.player.insight+=1;state.player.secretRealmClears++;rr.cleared=true;rr.stage=3;addDiligence(5);addPersonal('【秘境机缘】你搜尽'+rr.name+'核心，得到古修残片 '+frag+'、灵石 '+stones+'、灵草 '+herbs+'，并有所悟。','major');addWorld(state.player.name+'从'+rr.name+'中带出机缘，这处秘境的核心已经被人取走。');save();render();showResult('秘境探索完成','古修残片 +'+frag+'\n灵石 +'+stones+'\n灵草 +'+herbs+'\n悟道点 +1\n累计通关秘境 '+state.player.secretRealmClears,'good')
}
function decipherRelic(){
 if(state.player.relicFragments<3)return showResult('残片不足','参悟一次古修残卷需要 3 枚古修残片。','bad');state.player.relicFragments-=3;advanceDays(1);if(state.flags.dead)return;state.player.insight+=1;state.player.manualProf+=30;addDiligence(3);addPersonal('你将三枚古修残片拼合参悟，悟道点 +1，功法熟练度 +30。','major');save();render();showResult('参悟古修残卷','古修残片 -3\n悟道点 +1\n功法熟练度 +30','good')
}
function secretRealmStageLabel(r){return r.cleared?'核心已取':r.stage===0?'入口未破':r.stage===1?'守关区域':r.stage===2?'核心已开':'未知'}
function renderSecretRealm(){
 let panel=$('secretRealmPanel');if(!panel){const page=$('page-map');if(!page)return;panel=document.createElement('section');panel.className='panel';panel.id='secretRealmPanel';panel.innerHTML='<h2>秘境与机缘</h2><p class="section-tip">秘境只在世界中短暂出现。赶路、破阵、战斗与搜寻都会真实消耗时间。</p><div id="secretRealmInfo"></div><div id="secretRealmActions"></div>';page.appendChild(panel)}const info=$('secretRealmInfo'),actions=$('secretRealmActions'),r=currentSecretRealm(),today=dayNumber();if(!info||!actions)return;
 if(!r){const wait=Math.max(0,(state.world.nextSecretRealmDay||today)-today);info.innerHTML='<div class="kv"><span>当前秘境</span><b>暂无</b></div><div class="kv"><span>下一次天地异动</span><b>约 '+wait+' 日后</b></div><div class="kv"><span>古修残片</span><b>'+state.player.relicFragments+'</b></div><div class="kv"><span>已通关秘境</span><b>'+state.player.secretRealmClears+'</b></div>';actions.innerHTML=state.player.relicFragments>=3?'<div class="event-actions"><button data-relic>参悟古修残卷 · 3残片 / 1日</button></div>':''}
 else{const left=Math.max(0,r.closeDay-today),here=state.player.location===r.location;info.innerHTML='<div class="kv"><span>秘境</span><b>'+esc(r.name)+'</b></div><div class="kv"><span>入口</span><b>'+esc(r.location)+'</b></div><div class="kv"><span>危险</span><b>'+REALMS[Math.min(r.threat,REALMS.length-1)].name+'</b></div><div class="kv"><span>阶段</span><b>'+secretRealmStageLabel(r)+'</b></div><div class="kv"><span>剩余时间</span><b>'+left+' 日</b></div><div class="kv"><span>古修残片</span><b>'+state.player.relicFragments+'</b></div>';let html='';if(!r.cleared)html+='<button data-secret '+(!here?'disabled':'')+'>'+(r.stage===0?'踏入秘境':r.stage===1?'挑战守关者':'搜寻核心')+'</button>';if(!here)html+='<span class="section-tip">先通过天下行旅前往【'+esc(r.location)+'】。</span>';if(state.player.relicFragments>=3)html+='<button data-relic>参悟古修残卷 · 3残片 / 1日</button>';actions.innerHTML='<div class="event-actions">'+html+'</div>'}
 const b=actions.querySelector('[data-secret]');if(b)b.onclick=enterSecretRealm;const d=actions.querySelector('[data-relic]');if(d)d.onclick=decipherRelic
}


function factionWar(){return state.major&&state.major.factionWar||null}
function factionWarStatusText(m){if(!m)return '暂无大战';if(m.status==='announced')return '战云将起 · 第 '+m.start+' 日开战';if(m.status==='active')return '交战中 · 至第 '+m.end+' 日';return '本轮战事已结束'}
function updateFactionConflict(){
 if(!state||state.flags.dead)return;const w=state.world,dn=dayNumber();
 if(dn%7===0&&w.lastFactionDay!==dn){w.lastFactionDay=dn;w.qingyunPower=clamp(w.qingyunPower+rint(-2,3),15,120);w.bloodBladePower=clamp(w.bloodBladePower+rint(-2,3),12,120);const pressure=Math.floor((w.bloodBladePower+w.beastPressure*.25-w.qingyunPower*.35)/18);w.factionTension=clamp(w.factionTension+rint(2,6)+Math.max(0,pressure),0,100)}
 let m=factionWar();if(m&&m.status==='announced'&&dn>=m.start)m.status='active';if(m&&m.status==='active'&&dn>m.end)resolveFactionWar();m=factionWar();const cooled=!m||m.status==='ended'&&(dn-(m.resolvedDay||0)>=25);
 if(w.factionTension>=70&&cooled){const start=dn+2;state.major.factionWar={id:'factionWar',title:'青云宗与血刀门交锋',location:'临江城',announce:dn,start:start,end:start+5,status:'announced',participated:false,side:null,contribution:0,qingyunAid:0,bloodAid:0,resolvedDay:0};addWorld('【天下大事】青云宗与血刀门矛盾激化，双方修士正在临江城外集结。两日后恐有大战。','major')}
}
function onFactionWarCombatWin(e){
 const m=factionWar();if(!m||m.status!=='active'||!e||!e.warEnemy||!state.flags.factionWarSide)return;const side=state.flags.factionWarSide;m.side=side;m.participated=true;m.contribution=(m.contribution||0)+1;if(side==='qingyun')m.qingyunAid=(m.qingyunAid||0)+1;else m.bloodAid=(m.bloodAid||0)+1;state.world.factionTension=clamp(state.world.factionTension+2,0,100);addPersonal('【宗门冲突】你在临江城战场击败一名'+(side==='qingyun'?'血刀门':'青云宗')+'修士，战场贡献 +1。','major');state.flags.factionWarSide=null
}
function joinFactionWar(side){
 const m=factionWar();if(!m||m.status!=='active')return showResult('大战未开','当前没有可参与的宗门大战。','bad');if(state.player.location!=='临江城')return showResult('未至战场','大战发生在【临江城】，需要先赶到当地。','bad');if(side==='blood'&&state.player.sect==='青云宗')return showResult('不可倒戈','你已列入青云宗门墙，不能公然替血刀门出战。','bad');
 const enemySide=side==='qingyun'?'血刀门':'青云宗',base=Math.max(1,state.player.realmIndex+rint(-1,1)),r=Math.min(base,5);state.flags.factionWarSide=side;const enemy={name:enemySide+(r>=3?'精锐修士':'修士'),kind:'修士',faction:enemySide,warEnemy:true,realm:r,hp:78+r*20,atk:[8+r*3,13+r*4],reward:{stones:[2+r,5+r*2],herbs:[0,1],rep:side==='qingyun'?3:1},weight:1};addPersonal('你选择支援'+(side==='qingyun'?'青云宗':'血刀门')+'，踏入临江城外战场。','major');startCombat(enemy)
}
function observeFactionWar(){const m=factionWar();if(!m||m.status!=='active')return showResult('无战可观','当前没有进行中的宗门大战。');advanceDays(1);if(state.flags.dead)return;addPersonal('你没有贸然站队，只在临江城观察双方攻守与修士调动。');showResult('旁观战局','世界时间推进 1 日。双方大战仍在继续。')}
function resolveFactionWar(){
 const m=factionWar();if(!m||m.status==='ended')return;const w=state.world,q=w.qingyunPower+(m.qingyunAid||0)*5+rint(-10,10),b=w.bloodBladePower+(m.bloodAid||0)*5+rint(-10,10),qingyunWin=q>=b;w.factionClashes++;w.casualties+=rint(18,65);w.factionTension=rint(20,34);m.status='ended';m.resolvedDay=dayNumber();m.winner=qingyunWin?'青云宗':'血刀门';
 if(qingyunWin){w.warWinsQingyun++;w.qingyunPower=clamp(w.qingyunPower+5,15,120);w.bloodBladePower=clamp(w.bloodBladePower-7,12,120);w.marketIndex=clamp(w.marketIndex-3,76,135)}else{w.warWinsBlood++;w.bloodBladePower=clamp(w.bloodBladePower+5,12,120);w.qingyunPower=clamp(w.qingyunPower-7,15,120);w.marketIndex=clamp(w.marketIndex+7,76,135)}
 const losers=state.npcs.filter(n=>n.alive&&n.faction===(qingyunWin?'血刀门':'青云宗'));if(losers.length&&rand()<.45){const fallen=pick(losers);fallen.alive=false;fallen.known=true;addWorld('大战余波中，'+fallen.name+'（'+fallen.faction+'）战死。','bad')}
 if(m.participated&&m.side){const playerWon=(m.side==='qingyun')===qingyunWin;if(playerWon){const stones=4+(m.contribution||0)*2;state.player.spiritStones+=stones;state.player.reputation+=3;if(m.side==='qingyun'&&state.player.sect==='青云宗')state.player.sectContribution+=(m.contribution||0)*5+5;addPersonal('你所支持的一方赢下此战。战后论功，你得到灵石 '+stones+'，声望 +3。','major')}else addPersonal('你所支持的一方战败。你趁乱脱离战场，没有得到战后奖赏。','bad')}
 addWorld('【宗门大战】'+m.winner+'在临江城外占据上风。此战已记录死伤，坊市与附近势力格局随之改变。','major');save();render()
}
function renderFactionConflict(){
 let panel=$('factionWarPanel');if(!panel){const page=$('page-events');if(!page)return;panel=document.createElement('section');panel.className='panel';panel.id='factionWarPanel';panel.innerHTML='<h2>宗门局势</h2><p class="section-tip">青云宗与血刀门的势力会随时间涨落。紧张度过高时，冲突会真实爆发。</p><div id="factionInfo"></div><div id="factionActions"></div>';page.insertBefore(panel,page.firstChild)}const info=$('factionInfo'),actions=$('factionActions'),w=state.world,m=factionWar();if(!info||!actions)return;
 info.innerHTML='<div class="kv"><span>青云宗势力</span><b>'+w.qingyunPower+'</b></div><div class="kv"><span>血刀门势力</span><b>'+w.bloodBladePower+'</b></div><div class="kv"><span>两派紧张度</span><b>'+w.factionTension+'/100</b></div><div class="kv"><span>已爆发冲突</span><b>'+w.factionClashes+' 场</b></div><div class="kv"><span>当前局势</span><b>'+factionWarStatusText(m)+'</b></div>';
 if(!m||m.status==='ended'){actions.innerHTML='<div class="section-tip">双方暂未全面开战。势力消长会继续累积下一轮冲突。</div>';return}if(m.status==='announced'){actions.innerHTML='<div class="section-tip">双方正在集结。大战将在第 '+m.start+' 日于临江城爆发，可以提前赶路。</div>';return}let html='';if(state.player.location==='临江城'){html+='<button data-war="qingyun">支援青云宗</button><button data-war="blood" '+(state.player.sect==='青云宗'?'disabled':'')+'>支援血刀门</button><button data-war="observe">旁观战局 · 1日</button>'}else html='<div class="section-tip">战场在【临江城】。赶到当地后才能参战。</div>';if(m.contribution)html+='<div class="section-tip">本轮战场贡献：'+m.contribution+'</div>';actions.innerHTML='<div class="event-actions">'+html+'</div>';actions.querySelectorAll('[data-war]').forEach(b=>b.onclick=()=>{const k=b.dataset.war;if(k==='observe')observeFactionWar();else joinFactionWar(k)})
}

function render(){if(!state)return;$('heroName').textContent=state.player.name;$('heroSub').textContent=`${age()}岁 · ${season()} · ${state.player.location} · ${root().name}${state.player.injury?` · ${injuryLabel()}`:''}`;$('realmName').textContent=realm().name;$('cultivationText').textContent=`${Math.floor(state.player.progress)} / ${realm().need}`;$('cultivationBar').style.width=`${clamp(state.player.progress/realm().need*100,0,100)}%`;$('dateTop').textContent=dateLabel();
 $('spiritStoneQuick').textContent=state.player.spiritStones;$('herbQuick').textContent=state.player.herbs;$('hpQuick').textContent=`${state.player.hp}/${maxHp()}`;$('repQuick').textContent=state.player.reputation;$('diligenceQuick').textContent=`${state.player.diligence}/20`;$('insightQuick').textContent=state.player.insight;$('diligencePill').textContent=`勤勉 ${state.player.diligence}/20`;$('insightPill').textContent=`悟道点 ${state.player.insight}`;
 renderUrgent();renderBreakthrough();renderLegacy();renderHomeLog();renderCharacter();renderSect();renderDwelling();renderMap();renderSecretRealm();renderMarket();renderAlchemy();renderGear();renderEvents();renderFactionConflict();renderNPCs();
}
function renderUrgent(){const active=Object.values(state.major).filter(m=>m.status==='active'||m.status==='announced').sort((a,b)=>a.end-b.end);if(!active.length){$('urgentBox').innerHTML='';return}const m=active[0];const text=m.status==='announced'?`预计第 ${m.start} 日开启`:`剩余 ${Math.max(0,m.end-dayNumber()+1)} 日`;$('urgentBox').innerHTML=`<div class="urgent"><div class="urgent-title">${m.status==='active'?'【限时】':'【预告】'} ${esc(m.title)}</div><p>${esc(m.text)}</p><div class="urgent-foot"><span>地点：${esc(m.location)} · ${text}</span><button class="mini-btn" data-jump-events>查看</button></div></div>`;document.querySelector('[data-jump-events]').onclick=()=>switchPage('events')}
function logHtml(x){return `<div class="log-item ${x.type||''}"><span class="date">${esc(x.date)}</span>${esc(x.text)}</div>`}
function renderHomeLog(){$('homeLog').innerHTML=state.personalLog.slice(0,5).map(logHtml).join('')||'<div class="section-tip">尚无经历。</div>'}
function renderCharacter(){const p=state.player;$('characterStats').innerHTML=`<div class="kv"><span>姓名</span><b>${esc(p.name)}</b></div><div class="kv"><span>年龄 / 寿元</span><b>${age()} / ${p.lifespan}</b></div><div class="kv"><span>境界</span><b>${realm().name}</b></div><div class="kv"><span>气血</span><b>${p.hp} / ${maxHp()}</b></div><div class="kv"><span>灵力</span><b>${p.qi} / ${maxQi()}</b></div><div class="kv"><span>伤势</span><b>${injuryLabel()}</b></div><div class="kv"><span>所在地</span><b>${p.location}</b></div><div class="kv"><span>声望</span><b>${p.reputation}</b></div><div class="kv"><span>战绩</span><b>${p.battleWins}胜 / ${p.battleLosses}败 · 击杀${p.kills}</b></div>`;$('rootInfo').innerHTML=`<div class="skill-card"><div class="skill-head"><b>${root().name}</b><span>修炼倍率 ×${root().mult.toFixed(2)}</span></div><div class="skill-desc">${root().desc}</div></div>`;$('manualList').innerHTML=`<div class="skill-card"><div class="skill-head"><b>《${esc(p.manual)}》</b><span>${manual().quality}</span></div><div class="skill-desc">熟练度 ${p.manualProf} · 功法倍率 ×${manual().mult.toFixed(2)}<br>${manual().desc}</div></div>`;$('spellList').innerHTML=Object.entries(p.spells).map(([name,prof])=>{const s=SPELLS[name]||{quality:'未知',desc:''};return `<div class="skill-card"><div class="skill-head"><b>${esc(name)}</b><span>${s.quality}</span></div><div class="skill-desc">熟练度 ${prof}${s.qi?` · 消耗灵力 ${s.qi}`:''}<br>${s.desc}</div></div>`}).join('')}
function renderMap(){$('mapList').innerHTML=Object.entries(LOCATIONS).map(([name,l])=>{const cur=name===state.player.location;let routes='';if(cur){const rows=routesFrom(name);routes='<div class="route-list">'+rows.map(r=>'<button data-travel="'+esc(r.to)+'" data-route="'+esc(r.id)+'">前往'+esc(r.to)+' · '+r.days+'日 · '+esc(r.name)+' · 风险'+routeRiskLabel(r)+(r.fee?' · 路费'+r.fee:'')+'</button>').join('')+'</div>'}return '<div class="map-node '+(cur?'current':'')+'"><div class="map-head"><b>'+esc(name)+'</b><span class="pill">'+(cur?'当前所在地':'已知地域')+'</span></div><p>'+esc(l.desc)+'</p><div class="event-meta"><span class="pill">危险：'+locationDangerText(l)+'</span><span class="pill">势力：'+esc(l.faction)+'</span><span class="pill">特产：'+esc(l.specialty)+'</span><span class="pill">秘境：'+secretActivityText(l)+'</span></div>'+routes+'</div>'}).join('');document.querySelectorAll('[data-travel]').forEach(b=>b.onclick=()=>travel(b.dataset.travel,b.dataset.route))}
function renderEvents(){const all=Object.values(state.major).sort((a,b)=>(a.status==='active'?-10:0)+(a.end||999)-(b.status==='active'?-10:0)-(b.end||999));const open=all.filter(m=>m.status==='active'||m.status==='announced').length;$('eventBadge').textContent=open;$('navBadge').textContent=open;$('navBadge').classList.toggle('hidden',open===0);$('majorEvents').innerHTML=all.length?all.map(m=>{let status=m.status==='announced'?`预告 · 第${m.start}日开启`:m.status==='active'?`进行中 · 剩余${Math.max(0,m.end-dayNumber()+1)}日`:m.participated?'你已参与':'已结束';return `<div class="event-card ${m.status==='ended'?'done':''}"><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p><div class="event-meta"><span class="pill">${esc(status)}</span><span class="pill">地点：${esc(m.location)}</span></div>${m.status==='active'?`<div class="event-actions"><button class="primary" data-major="${m.id}">${state.player.location===m.location?'立即参与':'前往地点后参与'}</button>${state.player.location!==m.location?'<button data-go-map>去地图赶路</button>':''}</div>`:m.status==='announced'?`<div class="event-actions"><button data-go-map>提前赶路</button></div>`:''}</div>`}).join(''):'<div class="section-tip">天下暂时平静。</div>';$('worldLog').innerHTML=state.worldLog.slice(0,30).map(logHtml).join('');document.querySelectorAll('[data-major]').forEach(b=>b.onclick=()=>participateMajor(b.dataset.major));document.querySelectorAll('[data-go-map]').forEach(b=>b.onclick=()=>switchPage('map'))}

function socialNPC(id){return state.npcs.find(n=>n.id===Number(id))||null}
function socialMonthKey(){return (state.time.year-1)*12+state.time.month}
function relationTier(n){if(n.grudge>=70)return '死仇';if(n.grudge>=40)return '敌视';if(n.relation>=70)return '生死之交';if(n.relation>=40)return '好友';if(n.relation>=15)return '熟人';if(n.relation<=-20)return '厌恶';return '平淡'}
function socialMeetCheck(n){if(!n||!n.alive)return '对方已经不在人世。';if(!n.known)return '你尚未真正认识此人。';if(n.location!==state.player.location)return '对方目前在【'+n.location+'】，你在【'+state.player.location+'】。';return ''}
function giftNPC(id,kind){
 const n=socialNPC(id),err=socialMeetCheck(n);if(err)return showResult('无法赠礼',err,'bad');const today=dayNumber();if(n.lastGiftDay===today)return showResult('今日已赠','同一天反复送礼只会显得刻意。');let gain=0,label='';
 if(kind==='herb'){if(state.player.herbs<1)return showResult('灵草不足','你身上没有可送出的灵草。','bad');state.player.herbs--;gain=rint(8,11);label='一株灵草';n.grudge=Math.max(0,n.grudge-4)}
 else{if(state.player.spiritStones<1)return showResult('灵石不足','你身上没有可送出的灵石。','bad');state.player.spiritStones--;gain=rint(5,7);label='一块灵石';n.grudge=Math.max(0,n.grudge-2)}
 n.relation=clamp(n.relation+gain,-100,100);n.lastGiftDay=today;addPersonal('你赠给'+n.name+label+'，彼此关系有所缓和。','good');save();render();showResult('赠礼','送出'+label+'\n'+n.name+' 关系 +'+gain+'\n当前：'+relationTier(n),'good')
}
function discussDaoNPC(id){
 const n=socialNPC(id),err=socialMeetCheck(n);if(err)return showResult('无法论道',err,'bad');const today=dayNumber();if(n.lastDaoDay&&today-n.lastDaoDay<7)return showResult('论道太频繁','距离上次论道还不足七日。');n.lastDaoDay=today;advanceDays(1);if(state.flags.dead)return;
 const relGain=rint(3,6)+(n.realmIndex>=state.player.realmIndex?1:0);n.relation=clamp(n.relation+relGain,-100,100);let benefit='';if(n.realmIndex>=state.player.realmIndex){const gain=rint(8,18)+n.realmIndex*2;state.player.progress=Math.min(realm().need,state.player.progress+gain);benefit='修为 +'+gain;if(rand()<.12){state.player.insight++;benefit+='，悟道点 +1'}}else{const gain=rint(4,9);state.player.manualProf+=gain;benefit='功法熟练度 +'+gain}addDiligence(2);addPersonal('你与'+n.name+'坐而论道一日，'+benefit+'。','good');save();render();showResult('论道所得',benefit+'\n关系 +'+relGain,'good')
}
function sparNPC(id){
 const n=socialNPC(id),err=socialMeetCheck(n);if(err)return showResult('无法切磋',err,'bad');if(n.grudge>=55)return showResult('对方不愿切磋',n.name+'对你敌意太深，这已经不是点到为止的关系。','bad');const today=dayNumber();if(n.lastSparDay&&today-n.lastSparDay<5)return showResult('切磋太频繁','距离上次切磋还不足五日。');if(state.player.hp<Math.ceil(maxHp()*.35))return showResult('状态太差','你气血太低，不适合切磋。','bad');n.lastSparDay=today;advanceDays(1);if(state.flags.dead)return;
 const playerPower=state.player.realmIndex*28+Math.floor(state.player.manualProf/18)+gearAtk()*3+gearDef()*2+rint(5,28);const npcPower=n.realmIndex*28+Math.floor(n.talent/5)+rint(5,28);const win=playerPower>=npcPower;const hpLoss=Math.max(1,Math.ceil(maxHp()*(win?.08:.16)));state.player.hp=Math.max(1,state.player.hp-hpLoss);const relGain=win?3:2;n.relation=clamp(n.relation+relGain,-100,100);state.player.manualProf+=win?5:3;addDiligence(2);addPersonal('你与'+n.name+'切磋一场，'+(win?'略胜一筹':'落在下风')+'。','good');save();render();showResult('同道切磋',(win?'你胜了。':'你败了。')+'\n气血 -'+hpLoss+'\n功法熟练度 +'+(win?5:3)+'\n关系 +'+relGain,win?'good':'')
}
function askNPCForHelp(id){
 const n=socialNPC(id),err=socialMeetCheck(n);if(err)return showResult('无法求助',err,'bad');if(n.relation<20)return showResult('交情不足','至少达到“熟人”关系（20点）后，对方才愿意认真帮你。','bad');const key=socialMonthKey();if(n.lastHelpMonth===key)return showResult('本月已求助','这个月你已经麻烦过'+n.name+'一次。');n.lastHelpMonth=key;let text='';
 if(n.relation>=70){const st=rint(4,7),hb=rint(1,3);state.player.spiritStones+=st;state.player.herbs+=hb;text='灵石 +'+st+'，灵草 +'+hb;if(rand()<.35){state.player.insight++;text+='，悟道点 +1'}}else if(n.relation>=40){const st=rint(2,5);state.player.spiritStones+=st;text='灵石 +'+st;if(rand()<.35){state.player.herbs++;text+='，灵草 +1'}}else{state.player.herbs++;text='灵草 +1'}
 addPersonal(n.name+'念及旧交，出手帮了你一次：'+text+'。','good');save();render();showResult('故人相助',text+'\n本月不能再次向此人求助。','good')
}
function processSocialEvents(){
 if(!state||state.flags.dead)return;const today=dayNumber();for(const n of state.npcs){if(!n.alive||!n.known||n.location!==state.player.location||n.grudge<45)continue;if(n.lastRevengeDay&&today-n.lastRevengeDay<20)continue;const chance=Math.min(.20,.035+n.grudge/750+Math.max(0,n.realmIndex-state.player.realmIndex)*.018);if(rand()>=chance)continue;n.lastRevengeDay=today;
  if(n.realmIndex>state.player.realmIndex&&rand()<.58){const old=state.player.injury||0;state.player.injury=clamp(old+1,0,3);const loss=Math.max(1,Math.ceil(maxHp()*.18));state.player.hp=Math.max(1,state.player.hp-loss);addPersonal('【恩怨】'+n.name+'趁你不备突然伏击，你受了伤。','bad')}
  else{const lost=Math.min(state.player.spiritStones,rint(1,4));state.player.spiritStones-=lost;addPersonal('【恩怨】'+n.name+'找人堵住你的去路，你被迫丢下 '+lost+' 块灵石脱身。','bad')}
  break
 }
}

function renderNPCs(){const arr=[...state.npcs].filter(n=>n.known||n.relation!==0||n.grudge!==0).sort((a,b)=>(Math.abs(b.relation)+b.grudge)-(Math.abs(a.relation)+a.grudge));$('npcList').innerHTML=arr.length?arr.map(n=>{const rel=n.relation>0?'关系 +'+n.relation:n.relation<0?'关系 '+n.relation:'关系 0',same=n.alive&&n.location===state.player.location;const actions=n.alive?(same?'<div class="event-actions"><button data-gift-herb="'+n.id+'">赠灵草</button><button data-gift-stone="'+n.id+'">赠灵石</button><button data-dao="'+n.id+'">论道</button><button data-spar="'+n.id+'">切磋</button><button data-help="'+n.id+'">求助</button></div>':'<div class="section-tip">对方在【'+esc(n.location)+'】，需见面后才能互动。</div>'):'';return '<div class="npc"><div class="npc-top"><div><span class="npc-name">'+esc(n.name)+'</span> <small>'+esc(n.faction)+'</small></div><span class="rel '+(n.relation>0?'good':n.relation<0||n.grudge>0?'bad':'')+'">'+rel+(n.grudge?' · 仇恨 '+n.grudge:'')+' · '+relationTier(n)+'</span></div><div class="skill-desc">'+(n.alive?REALMS[n.realmIndex].name+' · '+esc(n.location):'已死亡')+'</div>'+actions+'</div>'}).join(''):'<div class="section-tip">你还没有真正认识谁。</div>';document.querySelectorAll('[data-gift-herb]').forEach(b=>b.onclick=()=>giftNPC(b.dataset.giftHerb,'herb'));document.querySelectorAll('[data-gift-stone]').forEach(b=>b.onclick=()=>giftNPC(b.dataset.giftStone,'stone'));document.querySelectorAll('[data-dao]').forEach(b=>b.onclick=()=>discussDaoNPC(b.dataset.dao));document.querySelectorAll('[data-spar]').forEach(b=>b.onclick=()=>sparNPC(b.dataset.spar));document.querySelectorAll('[data-help]').forEach(b=>b.onclick=()=>askNPCForHelp(b.dataset.help))}
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
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{if(state?.flags?.dead)return showResult('此世已终','你已经身死道消，请重新开局。','bad');({cultivate,gather,work,explore,rumor,rest}[b.dataset.action])()});document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>switchPage(b.dataset.page));
$('saveBtn').onclick=()=>{save();showResult('手动存档','当前进度已经写入浏览器本地存档。','good')};$('installBtn').onclick=triggerInstall;$('installStartBtn').onclick=triggerInstall;$('insightCultivate').onclick=()=>spendInsight('cultivate');$('insightManual').onclick=()=>spendInsight('manual');$('insightSpell').onclick=()=>spendInsight('spell');
window.__TAIXUAN_TEST__={newGame:(name='测试者')=>{newState(name);updateMajorEvents();render();return true},getState:()=>JSON.parse(JSON.stringify(state)),getCombat:()=>combat?JSON.parse(JSON.stringify(combat)):null,action:(name)=>({cultivate,gather,work,explore,rumor,rest}[name])(),travel,routeInfo:(from,to)=>routesFrom(from).filter(r=>!to||r.to===to).map(r=>({...r,effectiveRisk:effectiveRouteRisk(r)})),routeRisk:(id,sect='散修',injury=0,tension=24)=>{const r=TRAVEL_ROUTES.find(x=>x.id===id);return effectiveRouteRisk(r,{...state.player,sect,injury},{...state.world,factionTension:tension})},participateMajor,advanceDays,switchPage,closeModal,spendInsight,startCombat:(name='灰背野狼')=>{const e=ENEMIES.find(x=>x.name===name)||ENEMIES[0];startCombat(e)},combatAction};
boot();
})();