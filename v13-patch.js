window.__TAIXUAN_PATCH_V13__=function(src){
  const must=(pattern,replacement,label)=>{const next=src.replace(pattern,replacement);if(next===src)throw new Error('V1.3升级失败：'+label+' 未命中');src=next};
  must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='1.2.0';","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='1.3.0';",'版本号');
  must("world:{beastPressure:48,qingyunPower:72,bloodBladePower:44,marketIndex:100,casualties:0,secretRealm:null,nextSecretRealmDay:18,secretRealmCount:0}","world:{beastPressure:48,qingyunPower:72,bloodBladePower:44,marketIndex:100,casualties:0,secretRealm:null,nextSecretRealmDay:18,secretRealmCount:0,factionTension:24,factionClashes:0,lastFactionDay:0,warWinsQingyun:0,warWinsBlood:0}",'新世界势力字段');
  must("if(state.world.secretRealmCount==null)state.world.secretRealmCount=0;","if(state.world.secretRealmCount==null)state.world.secretRealmCount=0;if(state.world.factionTension==null)state.world.factionTension=24;if(state.world.factionClashes==null)state.world.factionClashes=0;if(state.world.lastFactionDay==null)state.world.lastFactionDay=0;if(state.world.warWinsQingyun==null)state.world.warWinsQingyun=0;if(state.world.warWinsBlood==null)state.world.warWinsBlood=0;",'旧存档势力迁移');
  must("simulateNPCs();updateMajorEvents();processSocialEvents();updateSecretRealm();","simulateNPCs();updateMajorEvents();processSocialEvents();updateSecretRealm();updateFactionConflict();",'每日势力演化挂载');
  must("onSectCombatWin(e);onGearCombatWin(e);onSecretRealmCombatWin(e);addDiligence(3);","onSectCombatWin(e);onGearCombatWin(e);onSecretRealmCombatWin(e);onFactionWarCombatWin(e);addDiligence(3);",'战争战斗联动');

  const factionCode=`
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
`;
  must("function render(){",factionCode+"\nfunction render(){",'宗门大战逻辑注入');
  must("renderUrgent();renderBreakthrough();renderLegacy();renderHomeLog();renderCharacter();renderSect();renderDwelling();renderMap();renderSecretRealm();renderMarket();renderAlchemy();renderGear();renderEvents();renderNPCs();","renderUrgent();renderBreakthrough();renderLegacy();renderHomeLog();renderCharacter();renderSect();renderDwelling();renderMap();renderSecretRealm();renderMarket();renderAlchemy();renderGear();renderEvents();renderFactionConflict();renderNPCs();",'宗门局势渲染挂载');
  if(!src.includes("const VERSION='1.3.0'"))throw new Error('V1.3升级失败：最终版本断言');
  return src;
};
