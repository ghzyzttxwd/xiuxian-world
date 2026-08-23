window.__TAIXUAN_PATCH_V04__=function(src){
  const must=(pattern,replacement,label)=>{const next=src.replace(pattern,replacement);if(next===src)throw new Error('V0.4升级失败：'+label+' 未命中');src=next};

  must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='0.3.0';","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='0.4.0';",'版本号');
  must("diligence:0,insight:0,hp:70,qi:0,injury:0,battleWins:0,battleLosses:0,kills:0}","diligence:0,insight:0,hp:70,qi:0,injury:0,battleWins:0,battleLosses:0,kills:0,sect:'散修',sectRank:'无',sectContribution:0,sectTasksCompleted:0,sectTask:null,sectLastStipend:0}",'新角色宗门字段');
  must("if(state.player.kills==null)state.player.kills=0;","if(state.player.kills==null)state.player.kills=0;if(state.player.sect==null){const joined=!!(state.major?.recruit?.participated&&((ROOTS[state.player.rootIndex]?.mult||0)>=1.25||state.player.realmIndex>=1));state.player.sect=joined?'青云宗':'散修';state.player.sectRank=joined?'外门弟子':'无'}if(state.player.sectRank==null)state.player.sectRank=state.player.sect==='青云宗'?'外门弟子':'无';if(state.player.sectContribution==null)state.player.sectContribution=0;if(state.player.sectTasksCompleted==null)state.player.sectTasksCompleted=0;if(state.player.sectTask==null)state.player.sectTask=null;if(state.player.sectLastStipend==null)state.player.sectLastStipend=0;",'旧存档宗门迁移');
  must("state.player.reputation+=6;addPersonal('你通过青云宗测验，被收入外门，并得到《青云引气诀》。','major');","state.player.reputation+=6;joinQingyunSect();addPersonal('你通过青云宗测验，被收入外门，并得到《青云引气诀》。','major');",'收徒入宗');
  must("state.player.kills++;addDiligence(3);","state.player.kills++;onSectCombatWin(e);addDiligence(3);",'战斗联动');

  const sectCode=`
const SECT_TASKS={
 chores:{id:'chores',title:'药圃杂役',desc:'替外门药圃整理灵土、搬运药材。安全，但贡献不高。',days:2,contrib:6,stones:1,rep:0},
 patrol:{id:'patrol',title:'巡查山门',desc:'随执事巡查青云山外围，驱赶凡俗盗匪与野兽。',days:2,contrib:8,stones:2,rep:1},
 hunt:{id:'hunt',title:'黑风岭除妖',desc:'前往黑风岭，击杀两头妖兽。风险高，贡献也最多。',need:2,contrib:14,stones:3,rep:2}
};
function isSectMember(){return state.player.sect==='青云宗'}
function joinQingyunSect(){const p=state.player;if(p.sect==='青云宗')return;p.sect='青云宗';p.sectRank='外门弟子';p.sectContribution=Math.max(0,p.sectContribution||0);p.sectTasksCompleted=p.sectTasksCompleted||0;p.sectTask=null;addWorld(\`\${p.name}通过青云宗收徒试炼，正式列入外门名册。\`,'major')}
function sectMonthKey(){return (state.time.year-1)*12+state.time.month}
function acceptSectTask(id){
 if(!isSectMember())return showResult('尚未入宗','你现在还不是青云宗弟子。','bad');
 if(state.player.location!=='青云山')return showResult('不在山门','领取宗门任务需要先回到青云山。','bad');
 if(state.player.sectTask)return showResult('已有任务',\`先完成【\${state.player.sectTask.title}】。\`,'bad');
 const d=SECT_TASKS[id];if(!d)return;
 state.player.sectTask={id:d.id,title:d.title,progress:0,need:d.need||1,acceptedDay:dayNumber()};
 addPersonal(\`你在宗务堂领取了【\${d.title}】。\`,'good');save();render();showResult('领取宗门任务',\`【\${d.title}】\\n\${d.desc}\`,'good')
}
function completeRoutineSectTask(){
 const t=state.player.sectTask;if(!t||t.id==='hunt')return;
 if(state.player.location!=='青云山')return showResult('需回山门','这项宗门差事要在青云山完成。','bad');
 const d=SECT_TASKS[t.id];advanceDays(d.days);state.player.sectContribution+=d.contrib;state.player.spiritStones+=d.stones;state.player.reputation+=d.rep;state.player.sectTasksCompleted++;state.player.sectTask=null;addDiligence(2);addPersonal(\`你完成宗门任务【\${d.title}】，宗门贡献 +\${d.contrib}。\`,'good');save();render();showResult('宗门任务完成',\`贡献 +\${d.contrib}\\n灵石 +\${d.stones}\${d.rep?\`\\n声望 +\${d.rep}\`:''}\`,'good')
}
function onSectCombatWin(e){
 const t=state.player.sectTask;if(!t||t.id!=='hunt'||state.player.location!=='黑风岭'||e.kind!=='妖兽')return;
 t.progress++;addPersonal(\`【宗门任务】黑风岭除妖进度 \${t.progress}/\${t.need}。\`,'good');
 if(t.progress>=t.need){const d=SECT_TASKS.hunt;state.player.sectContribution+=d.contrib;state.player.spiritStones+=d.stones;state.player.reputation+=d.rep;state.player.sectTasksCompleted++;state.player.sectTask=null;addWorld(\`\${state.player.name}完成青云宗黑风岭除妖差事，宗门贡献有所提升。\`);addPersonal(\`你完成【\${d.title}】，贡献 +\${d.contrib}，灵石 +\${d.stones}。\`,'major')}
}
function claimSectStipend(){
 if(!isSectMember())return showResult('尚未入宗','你没有宗门月俸。','bad');
 if(state.player.location!=='青云山')return showResult('不在山门','月俸要到青云山宗务堂领取。','bad');
 const key=sectMonthKey();if(state.player.sectLastStipend===key)return showResult('本月已领','这个月的宗门月俸已经领取。');
 const inner=state.player.sectRank==='内门弟子',stones=inner?6:3,herbs=inner?2:1;state.player.sectLastStipend=key;state.player.spiritStones+=stones;state.player.herbs+=herbs;addPersonal(\`你领取\${state.player.sectRank}月俸：灵石 \${stones}、灵草 \${herbs}。\`,'good');save();render();showResult('领取月俸',\`灵石 +\${stones}\\n灵草 +\${herbs}\`,'good')
}
function sectExchange(kind){
 if(!isSectMember())return;
 const p=state.player;
 if(kind==='stones'){if(p.sectContribution<10)return showResult('贡献不足','兑换需要 10 点宗门贡献。','bad');p.sectContribution-=10;p.spiritStones+=4;showResult('贡献兑换','宗门贡献 -10\\n灵石 +4','good')}
 else if(kind==='herbs'){if(p.sectContribution<8)return showResult('贡献不足','兑换需要 8 点宗门贡献。','bad');p.sectContribution-=8;p.herbs+=3;showResult('贡献兑换','宗门贡献 -8\\n灵草 +3','good')}
 else if(kind==='manual'){if(p.manual==='赤炎诀')return showResult('已经掌握','你当前已经在修炼《赤炎诀》。');if(p.sectContribution<30)return showResult('贡献不足','兑换《赤炎诀》需要 30 点宗门贡献。','bad');p.sectContribution-=30;p.manual='赤炎诀';p.manualProf=0;addPersonal('你用宗门贡献换得《赤炎诀》，并改修此功。','major');showResult('兑换功法','获得并改修《赤炎诀》\\n宗门贡献 -30','good')}
 save();render()
}
function promoteSect(){
 const p=state.player;if(!isSectMember())return;
 if(p.sectRank==='内门弟子')return showResult('已经晋升','你现在已经是青云宗内门弟子。');
 if(p.realmIndex<3||p.sectContribution<60)return showResult('条件不足',\`晋升内门需要：炼气三层、宗门贡献 60。\\n当前：\${realm().name}、贡献 \${p.sectContribution}。\`,'bad');
 p.sectContribution-=40;p.sectRank='内门弟子';p.reputation+=5;addPersonal('你通过青云宗内门考核，正式晋升内门弟子。','major');addWorld(\`\${p.name}晋升青云宗内门弟子。\`,'major');save();render();showResult('晋升内门','身份：内门弟子\\n宗门贡献 -40\\n声望 +5','good')
}
function renderSect(){
 const info=$('sectInfo'),actions=$('sectActions');if(!info||!actions)return;const p=state.player;
 if(!isSectMember()){info.innerHTML='<div class="section-tip">你目前无门无派。青云宗开山收徒时，通过考核才会获得正式弟子身份。</div>';actions.innerHTML='';return}
 const t=p.sectTask,taskText=t?\`<div class="skill-card"><div class="skill-head"><b>当前任务：\${esc(t.title)}</b><span>\${t.id==='hunt'?\`进度 \${t.progress}/\${t.need}\`:'进行中'}</span></div><div class="skill-desc">\${SECT_TASKS[t.id]?.desc||''}</div></div>\`:'';
 info.innerHTML=\`<div class="kv"><span>宗门</span><b>青云宗</b></div><div class="kv"><span>身份</span><b>\${p.sectRank}</b></div><div class="kv"><span>宗门贡献</span><b>\${p.sectContribution}</b></div><div class="kv"><span>已完成任务</span><b>\${p.sectTasksCompleted}</b></div>\${taskText}\`;
 if(t){actions.innerHTML=t.id==='hunt'?\`<div class="section-tip">前往【黑风岭】击杀妖兽即可自动累计任务进度。</div>\`:\`<button class="primary" data-sect-complete>执行任务 · \${SECT_TASKS[t.id].days}日</button>\`}
 else actions.innerHTML=\`<div class="event-actions"><button data-sect-task="chores">药圃杂役 · 贡献6</button><button data-sect-task="patrol">巡查山门 · 贡献8</button><button data-sect-task="hunt">黑风岭除妖 · 贡献14</button></div>\`;
 actions.innerHTML+=\`<div class="event-actions"><button data-sect-stipend>领取本月月俸</button><button data-sect-exchange="stones">10贡献 → 4灵石</button><button data-sect-exchange="herbs">8贡献 → 3灵草</button><button data-sect-exchange="manual">30贡献 → 《赤炎诀》</button><button data-sect-promote>晋升内门</button></div>\`;
 actions.querySelectorAll('[data-sect-task]').forEach(b=>b.onclick=()=>acceptSectTask(b.dataset.sectTask));const c=actions.querySelector('[data-sect-complete]');if(c)c.onclick=completeRoutineSectTask;const st=actions.querySelector('[data-sect-stipend]');if(st)st.onclick=claimSectStipend;actions.querySelectorAll('[data-sect-exchange]').forEach(b=>b.onclick=()=>sectExchange(b.dataset.sectExchange));const pr=actions.querySelector('[data-sect-promote]');if(pr)pr.onclick=promoteSect;
}
`;
  must("function render(){",sectCode+"\nfunction render(){",'宗门逻辑注入');
  must("renderUrgent();renderHomeLog();renderCharacter();renderMap();renderEvents();renderNPCs();","renderUrgent();renderHomeLog();renderCharacter();renderSect();renderMap();renderEvents();renderNPCs();",'宗门渲染挂载');
  if(!src.includes("const VERSION='0.4.0'"))throw new Error('V0.4升级失败：最终版本断言');
  return src;
};
