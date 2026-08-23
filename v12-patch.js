window.__TAIXUAN_PATCH_V12__=function(src){
  const must=(pattern,replacement,label)=>{const next=src.replace(pattern,replacement);if(next===src)throw new Error('V1.2升级失败：'+label+' 未命中');src=next};
  must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='1.1.0';","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='1.2.0';",'版本号');
  must("retreatSessions:0}","retreatSessions:0,secretRealmClears:0,relicFragments:0}",'新角色秘境字段');
  must("world:{beastPressure:48,qingyunPower:72,bloodBladePower:44,marketIndex:100,casualties:0}","world:{beastPressure:48,qingyunPower:72,bloodBladePower:44,marketIndex:100,casualties:0,secretRealm:null,nextSecretRealmDay:18,secretRealmCount:0}",'新世界秘境字段');
  must("if(state.player.retreatSessions==null)state.player.retreatSessions=0;","if(state.player.retreatSessions==null)state.player.retreatSessions=0;if(state.player.secretRealmClears==null)state.player.secretRealmClears=0;if(state.player.relicFragments==null)state.player.relicFragments=0;if(state.world.secretRealm===undefined)state.world.secretRealm=null;if(state.world.nextSecretRealmDay==null)state.world.nextSecretRealmDay=dayNumber()+20;if(state.world.secretRealmCount==null)state.world.secretRealmCount=0;",'旧存档秘境迁移');
  must("simulateNPCs();updateMajorEvents();processSocialEvents();","simulateNPCs();updateMajorEvents();processSocialEvents();updateSecretRealm();",'秘境世界时钟');
  must("onSectCombatWin(e);onGearCombatWin(e);addDiligence(3);","onSectCombatWin(e);onGearCombatWin(e);onSecretRealmCombatWin(e);addDiligence(3);",'秘境守关战斗联动');

  const secretCode=`
const SECRET_REALMS=[
 {name:'云隐遗府',location:'青云山',guardian:'青铜傀儡',desc:'云海深处露出一座残破石府，禁制尚未完全消散。'},
 {name:'黑风古窟',location:'黑风岭',guardian:'赤目石猿',desc:'黑风岭地脉震动，一处封闭多年的古窟重新裂开。'},
 {name:'临江水府',location:'临江城',guardian:'玄水妖卫',desc:'临江水脉倒卷，旧日沉没水府短暂浮出水面。'}
];
function currentSecretRealm(){return state.world.secretRealm||null}
function spawnSecretRealm(){
 if(state.world.secretRealm)return state.world.secretRealm;const t=pick(SECRET_REALMS),today=dayNumber(),threat=clamp(state.player.realmIndex+rint(-1,2),0,8);const r={id:'sr-'+today+'-'+rint(100,999),name:t.name,location:t.location,guardian:t.guardian,desc:t.desc,openDay:today,closeDay:today+rint(14,22),threat:threat,stage:0,foraged:false,cleared:false};state.world.secretRealm=r;state.world.secretRealmCount=(state.world.secretRealmCount||0)+1;addWorld('【秘境现世】'+r.name+'在'+r.location+'附近显化，预计只会维持十余日。','major');return r
}
function updateSecretRealm(){
 const w=state.world,today=dayNumber();if(w.secretRealm&&today>w.secretRealm.closeDay){addWorld('【秘境关闭】'+w.secretRealm.name+'重新隐没于天地之间。',w.secretRealm.cleared?'good':'');w.secretRealm=null;w.nextSecretRealmDay=today+rint(24,40)}if(!w.secretRealm&&today>=(w.nextSecretRealmDay||18))spawnSecretRealm()
}
function secretRealmGuardian(r){const n=r.threat||0;return {name:r.guardian,kind:'秘境守卫',realm:n,hp:58+n*24,atk:[5+n*2,9+n*3],reward:{stones:[2+n,5+n*2],herbs:[1,2+Math.floor(n/3)],rep:2+Math.floor(n/2)},weight:1,secretRealmGuardian:true,secretRealmId:r.id}}
function secretRealmPrepare(mode){
 const r=currentSecretRealm();if(!r||r.cleared)return showResult('秘境不可进入','当前没有可探索的秘境。','bad');if(state.player.location!==r.location)return showResult('不在秘境入口','秘境位于【'+r.location+'】。','bad');if(r.stage!==0)return enterSecretRealm();const id=r.id;
 if(mode==='forage'){if(r.foraged)return showResult('外围已搜过','外围能带走的灵草已经被你采尽。');advanceDays(1);const rr=currentSecretRealm();if(!rr||rr.id!==id)return showResult('秘境关闭','秘境在这一日彻底消散。','bad');const herbs=rint(2,5)+Math.floor(rr.threat/3);rr.foraged=true;state.player.herbs+=herbs;addDiligence(2);addPersonal('你没有急着深入，而是在'+rr.name+'外围采得 '+herbs+' 株灵草。','good');save();render();return showResult('外围采药','灵草 +'+herbs+'\\n秘境核心仍未探索。','good')}
 advanceDays(1);const rr=currentSecretRealm();if(!rr||rr.id!==id)return showResult('秘境关闭','秘境在这一日彻底消散。','bad');rr.stage=1;addDiligence(2);let text='你花了一日观察禁制，找到了相对稳妥的入路。';if(mode==='force'){const loss=Math.max(1,Math.ceil(maxHp()*.14));state.player.hp=Math.max(1,state.player.hp-loss);if(rand()<.35)state.player.injury=clamp((state.player.injury||0)+1,0,3);text='你强闯残阵，付出一些代价后冲到了守关区域。气血 -'+loss+'。'}addPersonal('【秘境】'+text,mode==='force'?'bad':'good');save();render();showResult('深入秘境',text+'\\n下一步：击败守关者。',mode==='force'?'':'good')
}
function enterSecretRealm(){
 if(state.flags.dead)return showResult('此世已终','你已经身死道消。','bad');const r=currentSecretRealm();if(!r)return showResult('暂无秘境','天地间暂时没有显化中的秘境。');if(dayNumber()>r.closeDay){updateSecretRealm();save();render();return showResult('秘境已闭','你来迟了一步。','bad')}if(state.player.location!==r.location)return showResult('不在秘境入口','秘境位于【'+r.location+'】，先从地图赶过去。','bad');if(r.cleared)return showResult('已经探索完毕','这处秘境的核心机缘已经被你取走。');if(r.stage===0)return showChoice('秘境入口 · '+r.name,r.desc,[{label:'观察阵纹 · 1日',fn:()=>secretRealmPrepare('careful')},{label:'强闯残阵 · 1日',fn:()=>secretRealmPrepare('force')},{label:(r.foraged?'外围已采过':'先在外围采药 · 1日'),disabled:r.foraged,fn:()=>secretRealmPrepare('forage')}]);if(r.stage===1){const id=r.id;advanceDays(1);const rr=currentSecretRealm();if(!rr||rr.id!==id)return showResult('秘境关闭','守关之前，秘境已经崩散。','bad');startCombat(secretRealmGuardian(rr));return}if(r.stage===2)return showChoice('秘境核心 · '+r.name,'守关者已经倒下，真正的机缘就在前方。',[{label:'搜寻核心机缘 · 1日',fn:claimSecretRealmCore},{label:'暂且离开',fn:()=>showResult('暂离秘境','只要秘境尚未关闭，你仍可回来。')}])
}
function onSecretRealmCombatWin(e){const r=currentSecretRealm();if(!e||!e.secretRealmGuardian||!r||r.id!==e.secretRealmId||r.cleared)return;r.stage=2;addPersonal('你击败了'+e.name+'，'+r.name+'的核心区域终于向你敞开。','major')}
function claimSecretRealmCore(){
 const r=currentSecretRealm();if(!r||r.cleared||r.stage!==2)return showResult('没有可取的核心机缘','先击败秘境守关者。','bad');const id=r.id;advanceDays(1);const rr=currentSecretRealm();if(!rr||rr.id!==id)return showResult('秘境崩散','你与核心机缘失之交臂。','bad');const frag=1+Math.min(2,Math.floor(rr.threat/3))+ (rand()<.25?1:0),stones=rint(5,12)+rr.threat*2,herbs=rint(2,5)+Math.floor(rr.threat/2);state.player.relicFragments+=frag;state.player.spiritStones+=stones;state.player.herbs+=herbs;state.player.insight+=1;state.player.secretRealmClears++;rr.cleared=true;rr.stage=3;addDiligence(5);addPersonal('【秘境机缘】你搜尽'+rr.name+'核心，得到古修残片 '+frag+'、灵石 '+stones+'、灵草 '+herbs+'，并有所悟。','major');addWorld(state.player.name+'从'+rr.name+'中带出机缘，这处秘境的核心已经被人取走。');save();render();showResult('秘境探索完成','古修残片 +'+frag+'\\n灵石 +'+stones+'\\n灵草 +'+herbs+'\\n悟道点 +1\\n累计通关秘境 '+state.player.secretRealmClears,'good')
}
function decipherRelic(){
 if(state.player.relicFragments<3)return showResult('残片不足','参悟一次古修残卷需要 3 枚古修残片。','bad');state.player.relicFragments-=3;advanceDays(1);if(state.flags.dead)return;state.player.insight+=1;state.player.manualProf+=30;addDiligence(3);addPersonal('你将三枚古修残片拼合参悟，悟道点 +1，功法熟练度 +30。','major');save();render();showResult('参悟古修残卷','古修残片 -3\\n悟道点 +1\\n功法熟练度 +30','good')
}
function secretRealmStageLabel(r){return r.cleared?'核心已取':r.stage===0?'入口未破':r.stage===1?'守关区域':r.stage===2?'核心已开':'未知'}
function renderSecretRealm(){
 let panel=$('secretRealmPanel');if(!panel){const page=$('page-map');if(!page)return;panel=document.createElement('section');panel.className='panel';panel.id='secretRealmPanel';panel.innerHTML='<h2>秘境与机缘</h2><p class="section-tip">秘境只在世界中短暂出现。赶路、破阵、战斗与搜寻都会真实消耗时间。</p><div id="secretRealmInfo"></div><div id="secretRealmActions"></div>';page.appendChild(panel)}const info=$('secretRealmInfo'),actions=$('secretRealmActions'),r=currentSecretRealm(),today=dayNumber();if(!info||!actions)return;
 if(!r){const wait=Math.max(0,(state.world.nextSecretRealmDay||today)-today);info.innerHTML='<div class="kv"><span>当前秘境</span><b>暂无</b></div><div class="kv"><span>下一次天地异动</span><b>约 '+wait+' 日后</b></div><div class="kv"><span>古修残片</span><b>'+state.player.relicFragments+'</b></div><div class="kv"><span>已通关秘境</span><b>'+state.player.secretRealmClears+'</b></div>';actions.innerHTML=state.player.relicFragments>=3?'<div class="event-actions"><button data-relic>参悟古修残卷 · 3残片 / 1日</button></div>':''}
 else{const left=Math.max(0,r.closeDay-today),here=state.player.location===r.location;info.innerHTML='<div class="kv"><span>秘境</span><b>'+esc(r.name)+'</b></div><div class="kv"><span>入口</span><b>'+esc(r.location)+'</b></div><div class="kv"><span>危险</span><b>'+REALMS[Math.min(r.threat,REALMS.length-1)].name+'</b></div><div class="kv"><span>阶段</span><b>'+secretRealmStageLabel(r)+'</b></div><div class="kv"><span>剩余时间</span><b>'+left+' 日</b></div><div class="kv"><span>古修残片</span><b>'+state.player.relicFragments+'</b></div>';let html='';if(!r.cleared)html+='<button data-secret '+(!here?'disabled':'')+'>'+(r.stage===0?'踏入秘境':r.stage===1?'挑战守关者':'搜寻核心')+'</button>';if(!here)html+='<span class="section-tip">先通过天下行旅前往【'+esc(r.location)+'】。</span>';if(state.player.relicFragments>=3)html+='<button data-relic>参悟古修残卷 · 3残片 / 1日</button>';actions.innerHTML='<div class="event-actions">'+html+'</div>'}
 const b=actions.querySelector('[data-secret]');if(b)b.onclick=enterSecretRealm;const d=actions.querySelector('[data-relic]');if(d)d.onclick=decipherRelic
}
`;
  must("function render(){",secretCode+"\nfunction render(){",'秘境逻辑注入');
  must("renderUrgent();renderBreakthrough();renderLegacy();renderHomeLog();renderCharacter();renderSect();renderDwelling();renderMap();renderMarket();renderAlchemy();renderGear();renderEvents();renderNPCs();","renderUrgent();renderBreakthrough();renderLegacy();renderHomeLog();renderCharacter();renderSect();renderDwelling();renderMap();renderSecretRealm();renderMarket();renderAlchemy();renderGear();renderEvents();renderNPCs();",'秘境界面挂载');
  if(!src.includes("const VERSION='1.2.0'"))throw new Error('V1.2升级失败：最终版本断言');
  return src;
};
