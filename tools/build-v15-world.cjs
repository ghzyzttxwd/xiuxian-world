const fs=require('fs');
const crypto=require('crypto');

const INPUT='src/game-v13.js';
const OUTPUT='src/game-v15.js';
const BUILD='1501';
if(!fs.existsSync(INPUT))throw new Error('V1.5 build: missing '+INPUT);
let src=fs.readFileSync(INPUT,'utf8');

function must(pattern,replacement,label){
  const next=src.replace(pattern,()=>replacement);
  if(next===src)throw new Error('V1.5 build transform did not match: '+label);
  src=next;
}

must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='1.3.0'; const SAVE_SCHEMA_VERSION=13;",
     "const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='1.5.0'; const SAVE_SCHEMA_VERSION=13;",'version');

const locations=`const LOCATIONS={
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
};`;
must(/const LOCATIONS=\{[\s\S]*?\n\};\nconst NPC_NAMES=/,locations+'\nconst NPC_NAMES=','locations');

const enemies=`const ENEMIES=[
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
];`;
must(/const ENEMIES=\[[\s\S]*?\n\];\nfunction rand/,enemies+'\nfunction rand','enemies');

const npcCode=`const NPC_FACTION_HOMES={
 '青云宗':['青云山','临江城','苍梧郡城'],
 '玄水帮':['临江城','云梦泽','苍梧郡城'],
 '血刀门':['黑风岭','赤霞谷','落星矿脉'],
 '散修':['青石镇','临江城','苍梧郡城','云梦泽','落星矿脉','古河遗迹']
};
function npcSpawnLocation(faction){return pick(NPC_FACTION_HOMES[faction]||Object.keys(LOCATIONS))}
function npcMoveTarget(n){const here=LOCATIONS[n.location];if(!here)return npcSpawnLocation(n.faction);const linked=Object.keys(here.links);const preferred=(NPC_FACTION_HOMES[n.faction]||[]).filter(x=>linked.includes(x));if(preferred.length&&rand()<.65)return pick(preferred);return pick([n.location,...linked])}
function createNPCs(){return NPC_NAMES.map((name,i)=>{const faction=pick(FACTIONS);return{id:i+1,name,age:rint(16,55),faction,location:npcSpawnLocation(faction),realmIndex:rint(0,4),progress:rint(0,90),talent:rint(70,130),alive:true,ambition:rint(15,95),courage:rint(20,95),wealth:rint(0,20),relation:0,grudge:0,known:i<6}})}`;
must(/function createNPCs\(\)\{[\s\S]*?\nfunction chooseRoot/,npcCode+'\nfunction chooseRoot','npc ecology');

const sim=`function simulateNPCs(){
 for(const n of state.npcs){if(!n.alive)continue;n.progress+=Math.max(1,Math.floor((n.talent/100)*rint(1,4)));if(n.progress>=100&&n.realmIndex<8){n.progress-=100;n.realmIndex++;if(rand()<.12){n.known=true;addWorld(\`${'${n.name}'}突破至${'${REALMS[n.realmIndex].name}'}。\`)}}
 if(rand()<.035)n.location=npcMoveTarget(n);if(rand()<.006&&n.realmIndex===0&&n.age>50){n.alive=false;if(n.known)addWorld(\`${'${n.name}'}寿终，修真路上又少了一位旧人。\`)}}
}`;
must(/function simulateNPCs\(\)\{[\s\S]*?\n\}\nfunction cultivate/,sim+'\nfunction cultivate','npc movement');

const actions=`function locationProfile(){return LOCATIONS[state.player.location]||LOCATIONS['青石村']}
function locationDangerText(l){const d=l?.danger||0;return d>=.65?'禁地':d>=.55?'凶险':d>=.45?'高危':d>=.34?'危险':d>=.24?'谨慎':'安稳'}
function secretActivityText(l){const x=l?.secret||0;return x>=1.8?'极活跃':x>=1.25?'活跃':x>=.75?'较多':'稀少'}
function gather(){advanceDays(1);const l=locationProfile(),n=rint(1,3)+(l.herb||0);state.player.herbs+=n;addDiligence(2);addPersonal(\`你在${'${state.player.location}'}附近采到 ${'${n}'} 株可用灵草。当地特产：${'${l.specialty}'}。\`,'good');save();render();showResult('采集灵草',\`灵草 +${'${n}'}\\n区域：${'${state.player.location}'} · ${'${locationDangerText(l)}'}\\n特产：${'${l.specialty}'}\`,'good')}
function work(){advanceDays(1);const l=locationProfile(),range=l.work||[1,2],n=rint(range[0],range[1]);state.player.spiritStones+=n;addDiligence(1);addPersonal(\`你在${'${state.player.location}'}谋生一日，换得 ${'${n}'} 块灵石。\`);save();render();showResult('谋生换钱',\`灵石 +${'${n}'}\\n当地主要资源：${'${l.specialty}'}\`,'good')}`;
must(/function gather\(\)\{[\s\S]*?\nfunction work\(\)\{[\s\S]*?\nfunction rest/,actions+'\nfunction rest','regional gather/work');

const explore=`function explore(){advanceDays(1);addDiligence(2);const l=locationProfile(),danger=l.danger||.20,x=rand();if(x<danger){startCombat(weightedEnemy());return}if(x<danger+(l.eventRate||.08)){startRegionalEvent();return}if(x<danger+(l.eventRate||.08)+.22){startMinorEvent();return}if(x<danger+(l.eventRate||.08)+.38){const range=l.find||[1,4],n=rint(range[0],range[1]);state.player.spiritStones+=n;addPersonal(\`你在${'${state.player.location}'}一处隐蔽角落找到 ${'${n}'} 块灵石。\`,'good');save();render();showResult('意外收获',\`灵石 +${'${n}'}\\n此地探索危险：${'${locationDangerText(l)}'}\`,'good');return}addPersonal(\`你在${'${state.player.location}'}转了一日，只记下了附近地形与人流。\`);save();render();showResult('区域探索',\`这一日没有额外收获。\\n${'${state.player.location}'}：${'${l.specialty}'}\`)}
function startRegionalEvent(){
 const l=locationProfile(),kind=l.eventKind||'stones',name=state.player.location;let text='';
 if(kind==='herb'){const n=rint(1,2)+(l.herb||0);state.player.herbs+=n;text='顺着当地修士留下的采集痕迹，你额外找到 '+n+' 株灵草。';showResult('地域机缘',text+'\\n灵草 +'+n,'good')}
 else if(kind==='materials'){const n=rint(1,2);state.player.beastMaterials+=n;text='你在险地边缘找到可用于锻造的残骨与灵材，共 '+n+' 份。';showResult('地域机缘',text+'\\n兽材 +'+n,'good')}
 else if(kind==='manual'){const n=rint(5,12);state.player.manualProf+=n;text='你旁听同道演法，对自身行功路线多了几分理解。';showResult('山门见闻',text+'\\n功法熟练度 +'+n,'good')}
 else if(kind==='relic'){state.player.relicFragments+=1;text='断壁下露出一枚带有古老纹路的残片。';showResult('遗迹残物',text+'\\n古修残片 +1','good')}
 else if(kind==='insight'){if(rand()<.35){state.player.insight+=1;text='阴煞与灵机交错的一瞬，你忽然抓住一缕感悟。';showResult('禁地悟道',text+'\\n悟道点 +1','good')}else{const n=rint(10,22);state.player.manualProf+=n;text='你从阴煞流向中悟出一些运气法门。';showResult('禁地见闻',text+'\\n功法熟练度 +'+n,'good')}}
 else{const range=l.find||[1,4],n=rint(range[0],range[1]);state.player.spiritStones+=n;text='当地商旅与修士流动频繁，你抓住一桩短差赚到 '+n+' 块灵石。';showResult('地域机缘',text+'\\n灵石 +'+n,'good')}
 addPersonal('【地域见闻】'+name+'：'+text,'good');save();render()
}`;
must(/function explore\(\)\{[\s\S]*?\nfunction startMinorEvent/,explore+'\nfunction startMinorEvent','regional exploration');

const secret=`const SECRET_REALMS=[
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
}`;
must(/const SECRET_REALMS=\[[\s\S]*?\nfunction updateSecretRealm/,secret+'\nfunction updateSecretRealm','regional secret realms');

const map=`function renderMap(){$('mapList').innerHTML=Object.entries(LOCATIONS).map(([name,l])=>{const cur=name===state.player.location;let routes='';if(cur)routes=\`<div class="route-list">${'${Object.entries(l.links).map(([to,d])=>`<button data-travel="${esc(to)}">前往${esc(to)} · ${d}日</button>`).join(\'\')}'}</div>\`;return \`<div class="map-node ${'${cur?\'current\':\'\'}'}"><div class="map-head"><b>${'${esc(name)}'}</b><span class="pill">${'${cur?\'当前所在地\':\'已知地域\'}'}</span></div><p>${'${esc(l.desc)}'}</p><div class="event-meta"><span class="pill">危险：${'${locationDangerText(l)}'}</span><span class="pill">势力：${'${esc(l.faction)}'}</span><span class="pill">特产：${'${esc(l.specialty)}'}</span><span class="pill">秘境：${'${secretActivityText(l)}'}</span></div>${'${routes}'}</div>\`}).join('');document.querySelectorAll('[data-travel]').forEach(b=>b.onclick=()=>travel(b.dataset.travel))}`;
must(/function renderMap\(\)\{[\s\S]*?\nfunction renderEvents/,map+'\nfunction renderEvents','regional map rendering');

const required=['苍梧郡城','云梦泽','赤霞谷','落星矿脉','万兽山脉','古河遗迹','玄阴禁地','水匪斥候','云梦鳄妖','赤砂火蜥','矿洞魈','古河尸傀','玄阴鬼修','npcMoveTarget','startRegionalEvent','weightedSecretRealmTemplate'];
for(const marker of required)if(!src.includes(marker))throw new Error('V1.5 final source missing '+marker);
if(!src.includes("const VERSION='1.5.0'"))throw new Error('V1.5 version assertion failed');
if(!src.includes('const SAVE_SCHEMA_VERSION=13'))throw new Error('V1.5 save schema changed unexpectedly');

fs.writeFileSync(OUTPUT,src,'utf8');
const sha256=crypto.createHash('sha256').update(src).digest('hex');
const report={status:'PASS',gameplay_version:'1.5.0',build:BUILD,milestone:'regional-world-expansion',source:OUTPUT,source_sha256:sha256,source_bytes:Buffer.byteLength(src),location_count:12,save_schema_version:13,new_regions:['云梦泽','苍梧郡城','赤霞谷','落星矿脉','万兽山脉','古河遗迹','玄阴禁地'],checks:['12 connected regions','regional danger/resources/work','regional enemies','faction-aware NPC spawn/movement','regional events','weighted regional secret realms']};
fs.writeFileSync('BUILD_V15_WORLD.json',JSON.stringify(report,null,2)+'\n','utf8');
console.log('V1.5 world source:',report.source_bytes,'bytes, sha256='+sha256);
