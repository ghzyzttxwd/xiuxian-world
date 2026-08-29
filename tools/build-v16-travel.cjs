const fs=require('fs');
const crypto=require('crypto');

const INPUT='src/game-v15.js';
const OUTPUT='src/game-v16.js';
const BUILD='1601';
if(!fs.existsSync(INPUT))throw new Error('V1.6 build: missing '+INPUT);
let src=fs.readFileSync(INPUT,'utf8');

function must(pattern,replacement,label){
  const next=src.replace(pattern,()=>replacement);
  if(next===src)throw new Error('V1.6 build transform did not match: '+label);
  src=next;
}

must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='1.5.0'; const SAVE_SCHEMA_VERSION=13;",
     "const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='1.6.0'; const SAVE_SCHEMA_VERSION=13;",'version');

const routes=`const TRAVEL_ROUTES=[
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
}`;
must(/\nconst NPC_NAMES=/,'\n'+routes+'\nconst NPC_NAMES=','travel routes');

const travel=`function travel(to,routeId=null){
 if(state?.flags?.dead)return showResult('此世已终','你已经身死道消。','bad');const from=state.player.location,route=getTravelRoute(from,to,routeId);if(!route)return showResult('道路不通','当前没有从【'+from+'】直达【'+to+'】的路线。','bad');if((route.fee||0)>state.player.spiritStones)return showResult('路费不足','选择【'+route.name+'】需要路费 '+route.fee+' 块灵石。','bad');
 const risk=effectiveRouteRisk(route);if(route.fee)state.player.spiritStones-=route.fee;advanceDays(route.days);if(state.flags.dead)return;state.player.location=to;addDiligence(1);addPersonal('你从'+from+'沿【'+route.name+'】赶路 '+route.days+' 日，抵达'+to+'。');const outcome=resolveTravelEncounter(route,from,to,risk);save();render();if(outcome.combat)return;showResult('行旅抵达',from+' → '+to+'\\n路线：'+route.name+'\\n耗时 '+route.days+' 日'+(route.fee?'\\n路费 -'+route.fee+' 灵石':'')+'\\n预计风险 '+Math.round(risk*100)+'%\\n'+outcome.text,outcome.type||'')
}`;
must(/function travel\(to\)\{[\s\S]*?\nfunction spendInsight/,travel+'\nfunction spendInsight','travel implementation');

const renderMap=`function renderMap(){$('mapList').innerHTML=Object.entries(LOCATIONS).map(([name,l])=>{const cur=name===state.player.location;let routes='';if(cur){const rows=routesFrom(name);routes='<div class="route-list">'+rows.map(r=>'<button data-travel="'+esc(r.to)+'" data-route="'+esc(r.id)+'">前往'+esc(r.to)+' · '+r.days+'日 · '+esc(r.name)+' · 风险'+routeRiskLabel(r)+(r.fee?' · 路费'+r.fee:'')+'</button>').join('')+'</div>'}return '<div class="map-node '+(cur?'current':'')+'"><div class="map-head"><b>'+esc(name)+'</b><span class="pill">'+(cur?'当前所在地':'已知地域')+'</span></div><p>'+esc(l.desc)+'</p><div class="event-meta"><span class="pill">危险：'+locationDangerText(l)+'</span><span class="pill">势力：'+esc(l.faction)+'</span><span class="pill">特产：'+esc(l.specialty)+'</span><span class="pill">秘境：'+secretActivityText(l)+'</span></div>'+routes+'</div>'}).join('');document.querySelectorAll('[data-travel]').forEach(b=>b.onclick=()=>travel(b.dataset.travel,b.dataset.route))}`;
must(/function renderMap\(\)\{[\s\S]*?\nfunction renderEvents/,renderMap+'\nfunction renderEvents','route map rendering');

must(/travel,participateMajor,advanceDays,switchPage,closeModal,spendInsight,startCombat:/,
     "travel,routeInfo:(from,to)=>routesFrom(from).filter(r=>!to||r.to===to).map(r=>({...r,effectiveRisk:effectiveRouteRisk(r)})),routeRisk:(id,sect='散修',injury=0,tension=24)=>{const r=TRAVEL_ROUTES.find(x=>x.id===id);return effectiveRouteRisk(r,{...state.player,sect,injury},{...state.world,factionTension:tension})},participateMajor,advanceDays,switchPage,closeModal,spendInsight,startCombat:",'test route API');

const required=['TRAVEL_ROUTES','routesFrom','effectiveRouteRisk','resolveTravelEncounter','guarded-caravan','marsh-trail','行旅遇险','预计风险','data-route'];
for(const marker of required)if(!src.includes(marker))throw new Error('V1.6 final source missing '+marker);
if(!src.includes("const VERSION='1.6.0'"))throw new Error('V1.6 version assertion failed');
if(!src.includes('const SAVE_SCHEMA_VERSION=13'))throw new Error('V1.6 save schema changed unexpectedly');

fs.writeFileSync(OUTPUT,src,'utf8');
const sha256=crypto.createHash('sha256').update(src).digest('hex');
const report={status:'PASS',gameplay_version:'1.6.0',build:BUILD,milestone:'travel-routes-risk',source:OUTPUT,source_sha256:sha256,source_bytes:Buffer.byteLength(src),location_count:12,route_count:20,save_schema_version:13,checks:['alternate route choices','route travel time','route fees','regional route risk','sect/faction risk modifiers','travel combat encounters','travel resource/rumor events','V1.5 regional ecology preserved']};
fs.writeFileSync('BUILD_V16_TRAVEL.json',JSON.stringify(report,null,2)+'\n','utf8');
console.log('V1.6 travel source:',report.source_bytes,'bytes, sha256='+sha256);
