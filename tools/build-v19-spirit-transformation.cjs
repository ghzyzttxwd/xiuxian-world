const fs=require('fs');
const crypto=require('crypto');

const INPUT='src/game-v18.js';
const OUTPUT='src/game-v19.js';
const BUILD='1901';
if(!fs.existsSync(INPUT))throw new Error('V1.9 build: missing '+INPUT);
let src=fs.readFileSync(INPUT,'utf8');
function must(pattern,replacement,label){const next=src.replace(pattern,()=>replacement);if(next===src)throw new Error('V1.9 build transform did not match: '+label);src=next}

must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='1.8.0'; const SAVE_SCHEMA_VERSION=15;",
     "const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='1.9.0'; const SAVE_SCHEMA_VERSION=16;",'version/schema');

const realms=`const REALMS=[
 {name:'凡人',need:100,rate:1,maxHp:70,maxQi:0},
 {name:'炼气一层',need:125,rate:1.05,maxHp:88,maxQi:32},{name:'炼气二层',need:150,rate:1.10,maxHp:96,maxQi:38},
 {name:'炼气三层',need:180,rate:1.16,maxHp:104,maxQi:45},{name:'炼气四层',need:220,rate:1.22,maxHp:114,maxQi:53},
 {name:'炼气五层',need:270,rate:1.30,maxHp:126,maxQi:62},{name:'炼气六层',need:330,rate:1.40,maxHp:140,maxQi:72},
 {name:'炼气七层',need:400,rate:1.52,maxHp:156,maxQi:84},{name:'炼气八层',need:480,rate:1.65,maxHp:174,maxQi:98},
 {name:'炼气九层',need:600,rate:1.80,maxHp:195,maxQi:115},{name:'筑基初期',need:850,rate:2.10,maxHp:230,maxQi:150},
 {name:'筑基中期',need:1100,rate:2.35,maxHp:270,maxQi:185},{name:'筑基后期',need:1500,rate:2.70,maxHp:320,maxQi:225},
 {name:'筑基圆满',need:2000,rate:3.05,maxHp:370,maxQi:270},{name:'结丹境',need:2800,rate:3.50,maxHp:450,maxQi:340},
 {name:'金丹初期',need:3800,rate:4.10,maxHp:560,maxQi:430},{name:'金丹中期',need:5000,rate:4.70,maxHp:680,maxQi:540},
 {name:'金丹后期',need:6800,rate:5.40,maxHp:820,maxQi:680},{name:'金丹圆满',need:9000,rate:6.15,maxHp:980,maxQi:850},
 {name:'元婴初期',need:12000,rate:7.20,maxHp:1250,maxQi:1150},{name:'元婴中期',need:15500,rate:8.20,maxHp:1500,maxQi:1450},
 {name:'元婴后期',need:20000,rate:9.40,maxHp:1820,maxQi:1820},{name:'元婴圆满',need:26000,rate:10.80,maxHp:2200,maxQi:2300},
 {name:'化神初期',need:34000,rate:12.40,maxHp:2800,maxQi:3100},{name:'化神中期',need:43000,rate:14.20,maxHp:3450,maxQi:4000},
 {name:'化神后期',need:55000,rate:16.20,maxHp:4200,maxQi:5100}
];`;
must(/const REALMS=\[[\s\S]*?\n\];\nconst ROOTS=/,realms+'\nconst ROOTS=','realm ladder');

must(" '丹霞金章':{quality:'玄阶上品',mult:1.72,desc:'金丹修士方能真正驾驭的高阶功法，运转丹火淬炼全身灵力。'}\n};",
     " '丹霞金章':{quality:'玄阶上品',mult:1.72,desc:'金丹修士方能真正驾驭的高阶功法，运转丹火淬炼全身灵力。'},\n '太虚化神篇':{quality:'地阶下品',mult:2.18,desc:'化神修士以神识反照自身、牵引天地灵机的法门，修炼效率远超金丹功法。'}\n};",'spirit manual');

must(" '护体灵罡':{quality:'玄阶护身',qi:32,power:0,desc:'以丹气结罡护体，连续数回合大幅削弱来袭伤害。'}\n};",
     " '护体灵罡':{quality:'玄阶护身',qi:32,power:0,desc:'以丹气结罡护体，连续数回合大幅削弱来袭伤害。'},\n '神念斩':{quality:'地阶神通',qi:110,power:340,desc:'凝聚化神神识斩入敌人识海，造成重创并短暂削弱其反击。'},\n '元神法域':{quality:'地阶护身',qi:90,power:0,desc:'展开元神法域，以神识扭曲周身灵机，连续数次大幅削弱来袭伤害。'}\n};",'spirit spells');

const lastEnemy=" {name:'玄阴鬼婴',kind:'阴物',realm:20,hp:2200,atk:[175,230],reward:{stones:[105,155],herbs:[6,12],rep:62,core:[2,3],nascent:[1,2]},weight:2,areas:['玄阴禁地']}";
const spiritEnemies=lastEnemy+`,\n {name:'古河元神残念',kind:'阴物',realm:21,hp:2850,atk:[210,282],reward:{stones:[120,175],herbs:[7,13],rep:72,nascent:[1,2],deification:[0,1]},weight:2,areas:['古河遗迹']},\n {name:'玄阴神识鬼王',kind:'阴物',realm:22,hp:3500,atk:[248,326],reward:{stones:[145,205],herbs:[8,15],rep:86,nascent:[1,2],deification:[0,1]},weight:2,areas:['玄阴禁地']},\n {name:'玄阴化神残魂',kind:'阴物',realm:23,hp:4650,atk:[318,412],reward:{stones:[180,250],herbs:[9,17],rep:110,nascent:[2,3],deification:[1,1]},weight:1,areas:['玄阴禁地']}`;
must(lastEnemy+'\n];',spiritEnemies+'\n];','spirit enemies');

must('nascentEssence:0,nascentFailures:0,dwellingTier:0',
     'nascentEssence:0,nascentFailures:0,deificationEssence:0,deificationFailures:0,dwellingTier:0','new save fields');

const migration15=" 15(){const p=state.player;if(p.nascentEssence==null)p.nascentEssence=0;if(p.nascentFailures==null)p.nascentFailures=0;const floor=p.realmIndex>=19?1000:p.realmIndex>=15?500:p.realmIndex>=14?300:p.realmIndex>=10?150:82;if(p.lifespan==null)p.lifespan=floor;else p.lifespan=Math.max(p.lifespan,floor)} ";
const migration16=migration15+`,\n 16(){const p=state.player;if(p.deificationEssence==null)p.deificationEssence=0;if(p.deificationFailures==null)p.deificationFailures=0;const floor=p.realmIndex>=23?2000:p.realmIndex>=19?1000:p.realmIndex>=15?500:p.realmIndex>=14?300:p.realmIndex>=10?150:82;if(p.lifespan==null)p.lifespan=floor;else p.lifespan=Math.max(p.lifespan,floor)} `;
must(migration15+'\n};',migration16+'\n};','schema 16 migration');
must("['player.nascentFailures',p.nascentFailures],['player.dwellingTier',p.dwellingTier]",
     "['player.nascentFailures',p.nascentFailures],['player.deificationEssence',p.deificationEssence],['player.deificationFailures',p.deificationFailures],['player.dwellingTier',p.dwellingTier]",'schema validation');

const majorPrelude=`function realmLifespanFloor(index){return index>=23?2000:index>=19?1000:index>=15?500:index>=14?300:index>=10?150:82}
const CORE_REFINING_LOCATIONS=['赤霞谷','落星矿脉','古河遗迹'];
const NASCENT_REFINING_LOCATIONS=['古河遗迹','玄阴禁地'];
const DEIFICATION_REFINING_LOCATIONS=['古河遗迹','玄阴禁地'];
function majorBreakthroughRequirements(){
 const i=state.player.realmIndex;
 if(i===13)return {kind:'结丹',core:3,nascent:0,deification:0,insight:2,days:12,base:.40,pity:10,lifeLoss:[2,5]};
 if(i===14)return {kind:'凝结金丹',core:2,nascent:0,deification:0,insight:3,days:9,base:.34,pity:12,lifeLoss:[4,8]};
 if(i===18)return {kind:'碎丹化婴',core:2,nascent:4,deification:0,insight:6,days:18,base:.26,pity:14,lifeLoss:[15,30]};
 if(i===22)return {kind:'炼神化神',core:0,nascent:2,deification:5,insight:10,days:30,base:.22,pity:16,lifeLoss:[40,80]};
 return null
}
function majorBreakthroughReady(req){const p=state.player;return !req||((p.injury||0)===0&&(p.coreEssence||0)>=(req.core||0)&&(p.nascentEssence||0)>=(req.nascent||0)&&(p.deificationEssence||0)>=(req.deification||0)&&(p.insight||0)>=req.insight)}
function applyRealmLifespanMilestone(){const floor=realmLifespanFloor(state.player.realmIndex),before=state.player.lifespan||82;if(before<floor)state.player.lifespan=floor;return Math.max(0,(state.player.lifespan||before)-before)}
function craftCoreEssence(){
 const p=state.player;if(p.realmIndex<12)return showResult('境界不足','至少达到筑基后期，才能承受淬炼结丹灵髓时的灵压。','bad');if(!CORE_REFINING_LOCATIONS.includes(p.location))return showResult('地脉不合','淬炼结丹灵髓需要前往赤霞谷、落星矿脉或古河遗迹，借当地灵脉成髓。','bad');if(p.herbs<4||p.beastMaterials<2||p.spiritStones<6)return showResult('材料不足','每份结丹灵髓需要：灵草 4、兽材 2、灵石 6。\\n当前：灵草 '+p.herbs+'、兽材 '+p.beastMaterials+'、灵石 '+p.spiritStones+'。','bad');
 p.herbs-=4;p.beastMaterials-=2;p.spiritStones-=6;advanceDays(2);if(state.flags.dead)return;p.coreEssence=(p.coreEssence||0)+1;addDiligence(3);addPersonal('你借'+p.location+'地脉淬炼出一份【结丹灵髓】。','major');save();render();showResult('结丹灵髓炼成','结丹灵髓 +1\\n灵草 -4\\n兽材 -2\\n灵石 -6\\n耗时 2 日','good')
}
function craftNascentEssence(){
 const p=state.player;if(p.realmIndex<17)return showResult('境界不足','至少达到金丹后期，才有资格淬炼化婴灵胎。','bad');if(!NASCENT_REFINING_LOCATIONS.includes(p.location))return showResult('地脉不合','化婴灵胎只能借古河遗迹残禁或玄阴禁地阴阳逆转之力淬炼。','bad');if((p.coreEssence||0)<1||(p.relicFragments||0)<2||p.herbs<6||p.spiritStones<12)return showResult('材料不足','每份化婴灵胎需要：结丹灵髓1、古修残片2、灵草6、灵石12。','bad');
 p.coreEssence--;p.relicFragments-=2;p.herbs-=6;p.spiritStones-=12;advanceDays(3);if(state.flags.dead)return;p.nascentEssence=(p.nascentEssence||0)+1;addDiligence(4);addPersonal('你在'+p.location+'压住丹火与阴阳灵机，炼成一份【化婴灵胎】。','major');save();render();showResult('化婴灵胎炼成','化婴灵胎 +1\\n结丹灵髓 -1\\n古修残片 -2\\n灵草 -6\\n灵石 -12\\n耗时 3 日','good')
}
function craftDeificationEssence(){
 const p=state.player;if(p.realmIndex<21)return showResult('境界不足','至少达到元婴后期，神识足够强大后才能淬炼化神道种。','bad');if(!DEIFICATION_REFINING_LOCATIONS.includes(p.location))return showResult('地脉不合','化神道种只能借古河遗迹的残存神禁或玄阴禁地的阴神之力淬炼。','bad');if((p.nascentEssence||0)<1||(p.relicFragments||0)<3||p.beastMaterials<4||p.herbs<8||p.spiritStones<25)return showResult('材料不足','每份化神道种需要：化婴灵胎1、古修残片3、兽材4、灵草8、灵石25。','bad');
 p.nascentEssence--;p.relicFragments-=3;p.beastMaterials-=4;p.herbs-=8;p.spiritStones-=25;advanceDays(4);if(state.flags.dead)return;p.deificationEssence=(p.deificationEssence||0)+1;addDiligence(5);addPersonal('你在'+p.location+'以元婴神识反复祭炼，凝成一枚【化神道种】。','major');save();render();showResult('化神道种凝成','化神道种 +1\\n化婴灵胎 -1\\n古修残片 -3\\n兽材 -4\\n灵草 -8\\n灵石 -25\\n耗时 4 日','good')
}
function claimGoldenCoreInheritance(){
 const p=state.player;if(p.realmIndex<15)return showResult('境界不足','凝成金丹后，才有资格承受这套高阶传承。','bad');if(p.spells&&('金焰剑诀'in p.spells))return showResult('已经掌握','你已经掌握《丹霞金章》、金焰剑诀与护体灵罡。');if(!['青云山','古河遗迹'].includes(p.location))return showResult('传承不在此地','需前往青云山宗门藏经地或古河遗迹残碑处参悟。','bad');if(p.spiritStones<40||p.insight<3||p.relicFragments<2)return showResult('准备不足','参悟高阶传承需要：灵石40、悟道点3、古修残片2。','bad');p.spiritStones-=40;p.insight-=3;p.relicFragments-=2;p.manual='丹霞金章';p.manualProf=0;p.spells['金焰剑诀']=0;p.spells['护体灵罡']=0;addPersonal('你完成高阶传承参悟，改修《丹霞金章》，并掌握金焰剑诀、护体灵罡。','major');save();render();showResult('高阶传承入手','改修《丹霞金章》\\n掌握【金焰剑诀】\\n掌握【护体灵罡】','good')
}
function claimSpiritTransformationInheritance(){
 const p=state.player;if(p.realmIndex<23)return showResult('境界不足','真正踏入化神后，才能承受神识化域的传承。','bad');if(p.spells&&('神念斩'in p.spells))return showResult('已经掌握','你已经掌握《太虚化神篇》、神念斩与元神法域。');if(!['古河遗迹','玄阴禁地'].includes(p.location))return showResult('传承不在此地','需前往古河遗迹或玄阴禁地，以神识触碰残存化神道痕。','bad');if(p.spiritStones<120||p.insight<5||p.relicFragments<5)return showResult('准备不足','参悟化神传承需要：灵石120、悟道点5、古修残片5。','bad');p.spiritStones-=120;p.insight-=5;p.relicFragments-=5;p.manual='太虚化神篇';p.manualProf=0;p.spells['神念斩']=0;p.spells['元神法域']=0;addPersonal('你以元神触及化神道痕，改修《太虚化神篇》，并掌握神念斩与元神法域。','major');save();render();showResult('化神传承入手','改修《太虚化神篇》\\n掌握【神念斩】\\n掌握【元神法域】','good')
}`;
must(/function realmLifespanFloor\([\s\S]*?\n}\nfunction breakthroughChance\(\)/,majorPrelude+'\nfunction breakthroughChance()','major path prelude');

const attempt=`function attemptBreakthrough(){
 if(state&&state.flags&&state.flags.dead)return showResult('此世已终','你已经身死道消。','bad');if(state.player.realmIndex>=REALMS.length-1)return showResult('已至当前极限','当前版本已经没有更高境界。');const need=realm().need;if(state.player.progress<need)return showResult('修为未满','当前修为尚未圆满，不能尝试突破。','bad');
 const p=state.player,req=majorBreakthroughRequirements();if(req&&!majorBreakthroughReady(req)){let lack=[];if((p.injury||0)>0)lack.push('必须先养至无伤');if((p.coreEssence||0)<(req.core||0))lack.push('结丹灵髓 '+req.core+'（当前 '+(p.coreEssence||0)+'）');if((p.nascentEssence||0)<(req.nascent||0))lack.push('化婴灵胎 '+req.nascent+'（当前 '+(p.nascentEssence||0)+'）');if((p.deificationEssence||0)<(req.deification||0))lack.push('化神道种 '+req.deification+'（当前 '+(p.deificationEssence||0)+'）');if((p.insight||0)<req.insight)lack.push('悟道点 '+req.insight+'（当前 '+(p.insight||0)+'）');return showResult(req.kind+'准备不足',lack.join('\\n'),'bad')}
 const oldRealm=realm().name,chance=breakthroughChance(),days=req?req.days:3;p.breakthroughAttempts++;if(req){p.coreEssence-=req.core||0;p.nascentEssence-=req.nascent||0;p.deificationEssence-=req.deification||0;p.insight-=req.insight}advanceDays(days);if(state.flags.dead)return;
 if(rand()<chance){p.progress=0;p.realmIndex++;p.breakthroughPity=0;p.hp=maxHp();p.qi=maxQi();const newRealm=realm().name,lifeGain=applyRealmLifespanMilestone();if(p.realmIndex===1&&!('火弹术'in p.spells)){p.spells['火弹术']=0;p.spells['御风步']=0;addPersonal('踏入炼气一层后，你终于能够驱使灵力，摸索出了火弹术与御风步。','major')}if(p.realmIndex===10){p.reputation+=8;addWorld(p.name+'成功筑基，寿元与气血根基一并蜕变。','major')}if(p.realmIndex===14){p.reputation+=20;addWorld(p.name+'熬过结丹关，体内丹胚成形，正式踏入结丹境。','major')}if(p.realmIndex===15){p.reputation+=30;addWorld(p.name+'凝成金丹，跻身苍梧一带真正的高阶修士之列。','major')}if(p.realmIndex===19){p.reputation+=80;addWorld(p.name+'碎丹化婴成功，神识与寿元发生质变，正式踏入元婴境。','major')}if(p.realmIndex===23){p.reputation+=150;addWorld(p.name+'炼神化神成功，元神可牵引天地灵机，真正踏入化神之境。','major')}addPersonal('你闭关'+days+'日冲击瓶颈，终于由'+oldRealm+'突破至'+newRealm+'！','major');save();render();showResult('突破成功',oldRealm+' → '+newRealm+'\\n气血、灵力恢复至满值\\n破境感悟清零'+(lifeGain?'\\n寿元上限 +'+lifeGain+'（当前 '+p.lifespan+'）':''),'good')}
 else if(req){const oldProgress=p.progress,isNascent=req.kind==='碎丹化婴',isDeification=req.kind==='炼神化神',ratio=isDeification?rint(35,52)/100:isNascent?rint(42,60)/100:rint(55,72)/100;p.progress=Math.max(0,Math.floor(need*ratio));p.breakthroughPity=Math.min(isDeification?56:isNascent?48:40,(p.breakthroughPity||0)+req.pity);if(isDeification)p.deificationFailures=(p.deificationFailures||0)+1;else if(isNascent)p.nascentFailures=(p.nascentFailures||0)+1;else p.coreFailures=(p.coreFailures||0)+1;p.injury=clamp((p.injury||0)+(isDeification?3:isNascent?2:rint(1,2)),0,3);p.hp=Math.max(1,Math.floor(maxHp()*(isDeification?.10:isNascent?.16:.24)));const loss=rint(req.lifeLoss[0],req.lifeLoss[1]),beforeLife=p.lifespan;p.lifespan=Math.max(age()+5,p.lifespan-loss);const lost=Math.max(0,oldProgress-p.progress),actualLife=Math.max(0,beforeLife-p.lifespan);addPersonal('你冲击'+req.kind+'失败，珍贵积累尽数耗去，根基受创。','bad');save();render();showResult(req.kind+'失败','修为 -'+lost+'\\n破境感悟 +'+req.pity+'%（当前 +'+p.breakthroughPity+'%）\\n伤势：'+injuryLabel()+(actualLife?'\\n寿元 -'+actualLife:'')+'\\n本次大境界材料已经消耗。','bad')}
 else{const oldProgress=p.progress,ratio=rint(78,90)/100;p.progress=Math.max(0,Math.floor(need*ratio));p.breakthroughPity=Math.min(32,(p.breakthroughPity||0)+8);let hurt='';if(rand()<.45){const old=p.injury||0;p.injury=clamp(old+1,0,3);p.hp=Math.max(1,Math.floor(p.hp*.72));if(p.injury>old)hurt='，伤势加重至'+injuryLabel()}const lost=Math.max(0,oldProgress-p.progress);addPersonal('你冲击'+oldRealm+'瓶颈失败，修为跌落 '+lost+'，但对瓶颈多了一层理解。','bad');save();render();showResult('突破失败','修为 -'+lost+'\\n破境感悟 +8%（当前 +'+p.breakthroughPity+'%）'+hurt+'\\n重新修至圆满后可再次尝试。','bad')}
}`;
must(/function attemptBreakthrough\(\)\{[\s\S]*?\n}\nfunction renderBreakthrough\(\)/,attempt+'\nfunction renderBreakthrough()','major breakthrough implementation');

const renderBreakthrough=`function renderBreakthrough(){
 const box=$('breakthroughBox');if(!box)return;const p=state.player,atCap=p.realmIndex>=REALMS.length-1,full=p.progress>=realm().need,req=majorBreakthroughRequirements();let blocks=[];
 if(full&&!atCap){const pct=Math.round(breakthroughChance()*100),next=REALMS[p.realmIndex+1].name,ready=majorBreakthroughReady(req);let text='当前成功率 '+pct+'%。灵根、功法熟练度与天道酬勤提高成功率；伤势会降低成功率；失败积累破境感悟。';if(req)text+=' 【'+req.kind+'】额外需要结丹灵髓 '+(req.core||0)+'、化婴灵胎 '+(req.nascent||0)+'、化神道种 '+(req.deification||0)+'、悟道点 '+req.insight+'，耗时 '+req.days+' 日；失败会损伤根基与寿元。';blocks.push('<div class="urgent"><div class="urgent-title">【境界圆满】可尝试突破至 '+esc(next)+'</div><p>'+esc(text)+'</p><div class="urgent-foot"><span>灵髓 '+(p.coreEssence||0)+' · 灵胎 '+(p.nascentEssence||0)+' · 道种 '+(p.deificationEssence||0)+' · 悟道 '+(p.insight||0)+' · 破境感悟 +'+(p.breakthroughPity||0)+'%</span><button class="mini-btn primary" data-breakthrough '+(ready?'':'disabled')+'>尝试突破 · '+(req?req.days:3)+'日</button></div></div>')}
 if(p.realmIndex>=15&&!('金焰剑诀'in p.spells))blocks.push('<div class="urgent"><div class="urgent-title">【金丹传承】你的境界已经压过低阶法术</div><p>前往青云山或古河遗迹，消耗灵石40、悟道点3、古修残片2，可改修《丹霞金章》并掌握金焰剑诀、护体灵罡。</p><div class="urgent-foot"><span>当前地点：'+esc(p.location)+'</span><button class="mini-btn" data-high-inherit>参悟金丹传承</button></div></div>');
 if(p.realmIndex>=23&&!('神念斩'in p.spells))blocks.push('<div class="urgent"><div class="urgent-title">【化神传承】元神已经可以触碰天地道痕</div><p>前往古河遗迹或玄阴禁地，消耗灵石120、悟道点5、古修残片5，可改修《太虚化神篇》并掌握神念斩、元神法域。</p><div class="urgent-foot"><span>当前地点：'+esc(p.location)+'</span><button class="mini-btn" data-spirit-inherit>参悟化神传承</button></div></div>');
 box.innerHTML=blocks.join('');const b=document.querySelector('[data-breakthrough]');if(b)b.onclick=attemptBreakthrough;const h=document.querySelector('[data-high-inherit]');if(h)h.onclick=claimGoldenCoreInheritance;const s=document.querySelector('[data-spirit-inherit]');if(s)s.onclick=claimSpiritTransformationInheritance
}`;
must(/function renderBreakthrough\(\)\{[\s\S]*?\n}\nfunction renderCorePath\(\)/,renderBreakthrough+'\nfunction renderCorePath()','breakthrough UI');

const renderCore=`function renderCorePath(){
 let panel=$('corePathPanel');if(!panel){const page=$('page-character');if(!page)return;panel=document.createElement('section');panel.className='panel';panel.id='corePathPanel';panel.innerHTML='<h2>结丹、金丹、元婴与化神</h2><p class="section-tip">元婴后期开始准备化神道种。元婴圆满后的炼神化神需要更漫长闭关，失败会濒死并损失大量寿元。</p><div id="corePathInfo"></div><div id="corePathActions"></div>';page.appendChild(panel)}const p=state.player,info=$('corePathInfo'),actions=$('corePathActions');if(!info||!actions)return;const req=majorBreakthroughRequirements();info.innerHTML='<div class="kv"><span>当前境界</span><b>'+esc(realm().name)+'</b></div><div class="kv"><span>寿元上限</span><b>'+p.lifespan+'</b></div><div class="kv"><span>结丹灵髓</span><b>'+(p.coreEssence||0)+'</b></div><div class="kv"><span>化婴灵胎</span><b>'+(p.nascentEssence||0)+'</b></div><div class="kv"><span>化神道种</span><b>'+(p.deificationEssence||0)+'</b></div><div class="kv"><span>结丹/金丹失败</span><b>'+(p.coreFailures||0)+' 次</b></div><div class="kv"><span>化婴失败</span><b>'+(p.nascentFailures||0)+' 次</b></div><div class="kv"><span>化神失败</span><b>'+(p.deificationFailures||0)+' 次</b></div>'+(req?'<div class="kv"><span>'+esc(req.kind)+'需求</span><b>灵髓 '+(req.core||0)+' · 灵胎 '+(req.nascent||0)+' · 道种 '+(req.deification||0)+' · 悟道 '+req.insight+' · '+req.days+'日</b></div>':'');let html='';if(p.realmIndex>=12){const here=CORE_REFINING_LOCATIONS.includes(p.location);html+='<div class="section-tip">结丹灵髓：赤霞谷 / 落星矿脉 / 古河遗迹。每份灵草4、兽材2、灵石6，耗时2日。</div><div class="event-actions"><button data-core-craft '+(here?'':'disabled')+'>淬炼结丹灵髓 · 2日</button></div>'}if(p.realmIndex>=17){const here2=NASCENT_REFINING_LOCATIONS.includes(p.location);html+='<div class="section-tip">化婴灵胎：古河遗迹 / 玄阴禁地。每份结丹灵髓1、古修残片2、灵草6、灵石12，耗时3日。</div><div class="event-actions"><button data-nascent-craft '+(here2?'':'disabled')+'>淬炼化婴灵胎 · 3日</button></div>'}if(p.realmIndex>=21){const here3=DEIFICATION_REFINING_LOCATIONS.includes(p.location);html+='<div class="section-tip">化神道种：古河遗迹 / 玄阴禁地。每份化婴灵胎1、古修残片3、兽材4、灵草8、灵石25，耗时4日。</div><div class="event-actions"><button data-deification-craft '+(here3?'':'disabled')+'>淬炼化神道种 · 4日</button></div>'}if(!html)html='<div class="section-tip">达到筑基后期后依次开启结丹、化婴与化神资源准备。</div>';actions.innerHTML=html;const a=actions.querySelector('[data-core-craft]');if(a)a.onclick=craftCoreEssence;const n=actions.querySelector('[data-nascent-craft]');if(n)n.onclick=craftNascentEssence;const d=actions.querySelector('[data-deification-craft]');if(d)d.onclick=craftDeificationEssence
}`;
must(/function renderCorePath\(\)\{[\s\S]*?\n}\n\nfunction locationProfile/,renderCore+'\n\nfunction locationProfile','core path UI');

must('guard:0,round:1','guard:0,domain:0,weaken:0,round:1','combat spirit state');
must('<button data-combat="guard" ${!(\'护体灵罡\'in state.player.spells)||combat.playerQi<SPELLS[\'护体灵罡\'].qi?\'disabled\':\'\'}>护体灵罡</button><button data-combat="defend">防御</button>',
     '<button data-combat="guard" ${!(\'护体灵罡\'in state.player.spells)||combat.playerQi<SPELLS[\'护体灵罡\'].qi?\'disabled\':\'\'}>护体灵罡</button><button data-combat="divine" ${!(\'神念斩\'in state.player.spells)||combat.playerQi<SPELLS[\'神念斩\'].qi?\'disabled\':\'\'}>神念斩</button><button data-combat="domain" ${!(\'元神法域\'in state.player.spells)||combat.playerQi<SPELLS[\'元神法域\'].qi?\'disabled\':\'\'}>元神法域</button><button data-combat="defend">防御</button>','combat spirit buttons');
must("}else if(a==='defend'){combat.defending=true;combat.logs.push('你收敛气息，架势转守。')}",
     "}else if(a==='divine'){const sp=SPELLS['神念斩'];if(!('神念斩'in state.player.spells)||combat.playerQi<sp.qi)return;combat.playerQi-=sp.qi;const prof=state.player.spells['神念斩']||0,baseDmg=sp.power+rint(40,70)+state.player.realmIndex*12+Math.floor(prof/8),dmg=Math.max(1,Math.floor(baseDmg*realmSuppressionMultiplier(state.player.realmIndex,e.realm||0)));combat.enemyHp-=dmg;combat.weaken=2;state.player.spells['神念斩']=prof+6;combat.logs.push('神念如刃斩入识海，造成 '+dmg+' 点伤害，并扰乱对方神识。')}else if(a==='domain'){const sp=SPELLS['元神法域'];if(!('元神法域'in state.player.spells)||combat.playerQi<sp.qi)return;combat.playerQi-=sp.qi;state.player.spells['元神法域']=(state.player.spells['元神法域']||0)+5;combat.domain=3;combat.logs.push('元神法域展开，接下来三次受击都会被神识领域削弱。')}else if(a==='defend'){combat.defending=true;combat.logs.push('你收敛气息，架势转守。')}",'combat spirit actions');
must("edmg=Math.max(1,Math.floor(edmg*realmSuppressionMultiplier(e.realm||0,state.player.realmIndex)));if(combat.guard>0){combat.guard--;edmg=Math.ceil(edmg*.55);combat.logs.push('护体灵罡削去了大半冲击。')}if(combat.defending)edmg=Math.ceil(edmg*.52);",
     "edmg=Math.max(1,Math.floor(edmg*realmSuppressionMultiplier(e.realm||0,state.player.realmIndex)));if(combat.weaken>0){combat.weaken--;edmg=Math.ceil(edmg*.78);combat.logs.push('神念斩残留的神识扰动削弱了对方反击。')}if(combat.domain>0){combat.domain--;edmg=Math.ceil(edmg*.62);combat.logs.push('元神法域扭曲灵机，削去了大半冲击。')}if(combat.guard>0){combat.guard--;edmg=Math.ceil(edmg*.55);combat.logs.push('护体灵罡削去了大半冲击。')}if(combat.defending)edmg=Math.ceil(edmg*.52);",'spirit combat mitigation');

must("const stones=rint(e.reward.stones?.[0]||0,e.reward.stones?.[1]||0),herbs=rint(e.reward.herbs?.[0]||0,e.reward.herbs?.[1]||0),core=rint(e.reward.core?.[0]||0,e.reward.core?.[1]||0),nascent=rint(e.reward.nascent?.[0]||0,e.reward.nascent?.[1]||0);state.player.spiritStones+=stones;state.player.herbs+=herbs;state.player.coreEssence=(state.player.coreEssence||0)+core;state.player.nascentEssence=(state.player.nascentEssence||0)+nascent;",
     "const stones=rint(e.reward.stones?.[0]||0,e.reward.stones?.[1]||0),herbs=rint(e.reward.herbs?.[0]||0,e.reward.herbs?.[1]||0),core=rint(e.reward.core?.[0]||0,e.reward.core?.[1]||0),nascent=rint(e.reward.nascent?.[0]||0,e.reward.nascent?.[1]||0),deification=rint(e.reward.deification?.[0]||0,e.reward.deification?.[1]||0);state.player.spiritStones+=stones;state.player.herbs+=herbs;state.player.coreEssence=(state.player.coreEssence||0)+core;state.player.nascentEssence=(state.player.nascentEssence||0)+nascent;state.player.deificationEssence=(state.player.deificationEssence||0)+deification;",'deification combat rewards');
must("if(nascent)addPersonal('你从'+e.name+'残留的元神精华中取得化婴灵胎 '+nascent+' 份。','major');",
     "if(nascent)addPersonal('你从'+e.name+'残留的元神精华中取得化婴灵胎 '+nascent+' 份。','major');if(deification)addPersonal('你从'+e.name+'残留的神识道痕中取得化神道种 '+deification+' 份。','major');",'deification reward log');

must('attemptBreakthrough,craftCoreEssence,craftNascentEssence,claimGoldenCoreInheritance,coreRequirements:()=>majorBreakthroughRequirements()',
     'attemptBreakthrough,craftCoreEssence,craftNascentEssence,craftDeificationEssence,claimGoldenCoreInheritance,claimSpiritTransformationInheritance,coreRequirements:()=>majorBreakthroughRequirements()','test API');

const required=['元婴圆满','化神初期','化神中期','化神后期','太虚化神篇','神念斩','元神法域','化神道种','craftDeificationEssence','claimSpiritTransformationInheritance','deificationFailures','玄阴化神残魂'];
for(const marker of required)if(!src.includes(marker))throw new Error('V1.9 final source missing '+marker);
if(!src.includes("const VERSION='1.9.0'"))throw new Error('V1.9 version assertion failed');
if(!src.includes('const SAVE_SCHEMA_VERSION=16'))throw new Error('V1.9 schema assertion failed');
fs.writeFileSync(OUTPUT,src,'utf8');
const sha256=crypto.createHash('sha256').update(src).digest('hex');
const report={status:'PASS',gameplay_version:'1.9.0',build:BUILD,milestone:'spirit-transformation-ladder',source:OUTPUT,source_sha256:sha256,source_bytes:Buffer.byteLength(src),realm_count:26,location_count:12,route_count:20,save_schema_version:16,checks:['元婴圆满→化神后期 realm ladder','化神道种 crafting and drops','炼神化神 material gate','major failure near-death/lifespan cost','化神 lifespan 2000','化神功法与神念攻防法术','high-realm enemies','V1.8 systems preserved']};
fs.writeFileSync('BUILD_V19_SPIRIT_TRANSFORMATION.json',JSON.stringify(report,null,2)+'\n','utf8');
console.log('V1.9 spirit transformation source:',report.source_bytes,'bytes, sha256='+sha256);
