window.__TAIXUAN_PATCH_V08__=function(src){
  const must=(pattern,replacement,label)=>{const next=src.replace(pattern,replacement);if(next===src)throw new Error('V0.8升级失败：'+label+' 未命中');src=next};
  must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='0.7.0';","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='0.8.0';",'版本号');
  must("for(const n of state.npcs||[]){if(n.relation==null)n.relation=0;if(n.grudge==null)n.grudge=0;if(n.known==null)n.known=false}","for(const n of state.npcs||[]){if(n.relation==null)n.relation=0;if(n.grudge==null)n.grudge=0;if(n.known==null)n.known=false;if(n.lastGiftDay==null)n.lastGiftDay=0;if(n.lastDaoDay==null)n.lastDaoDay=0;if(n.lastSparDay==null)n.lastSparDay=0;if(n.lastHelpMonth==null)n.lastHelpMonth=0;if(n.lastRevengeDay==null)n.lastRevengeDay=0}",'旧存档社交迁移');
  must("simulateNPCs();updateMajorEvents();","simulateNPCs();updateMajorEvents();processSocialEvents();",'恩怨事件挂载');

  const socialCode=`
function socialNPC(id){return state.npcs.find(n=>n.id===Number(id))||null}
function socialMonthKey(){return (state.time.year-1)*12+state.time.month}
function relationTier(n){if(n.grudge>=70)return '死仇';if(n.grudge>=40)return '敌视';if(n.relation>=70)return '生死之交';if(n.relation>=40)return '好友';if(n.relation>=15)return '熟人';if(n.relation<=-20)return '厌恶';return '平淡'}
function socialMeetCheck(n){if(!n||!n.alive)return '对方已经不在人世。';if(!n.known)return '你尚未真正认识此人。';if(n.location!==state.player.location)return '对方目前在【'+n.location+'】，你在【'+state.player.location+'】。';return ''}
function giftNPC(id,kind){
 const n=socialNPC(id),err=socialMeetCheck(n);if(err)return showResult('无法赠礼',err,'bad');const today=dayNumber();if(n.lastGiftDay===today)return showResult('今日已赠','同一天反复送礼只会显得刻意。');let gain=0,label='';
 if(kind==='herb'){if(state.player.herbs<1)return showResult('灵草不足','你身上没有可送出的灵草。','bad');state.player.herbs--;gain=rint(8,11);label='一株灵草';n.grudge=Math.max(0,n.grudge-4)}
 else{if(state.player.spiritStones<1)return showResult('灵石不足','你身上没有可送出的灵石。','bad');state.player.spiritStones--;gain=rint(5,7);label='一块灵石';n.grudge=Math.max(0,n.grudge-2)}
 n.relation=clamp(n.relation+gain,-100,100);n.lastGiftDay=today;addPersonal('你赠给'+n.name+label+'，彼此关系有所缓和。','good');save();render();showResult('赠礼','送出'+label+'\\n'+n.name+' 关系 +'+gain+'\\n当前：'+relationTier(n),'good')
}
function discussDaoNPC(id){
 const n=socialNPC(id),err=socialMeetCheck(n);if(err)return showResult('无法论道',err,'bad');const today=dayNumber();if(n.lastDaoDay&&today-n.lastDaoDay<7)return showResult('论道太频繁','距离上次论道还不足七日。');n.lastDaoDay=today;advanceDays(1);if(state.flags.dead)return;
 const relGain=rint(3,6)+(n.realmIndex>=state.player.realmIndex?1:0);n.relation=clamp(n.relation+relGain,-100,100);let benefit='';if(n.realmIndex>=state.player.realmIndex){const gain=rint(8,18)+n.realmIndex*2;state.player.progress+=gain;benefit='修为 +'+gain;if(rand()<.12){state.player.insight++;benefit+='，悟道点 +1'}}else{const gain=rint(4,9);state.player.manualProf+=gain;benefit='功法熟练度 +'+gain}addDiligence(2);addPersonal('你与'+n.name+'坐而论道一日，'+benefit+'。','good');save();render();showResult('论道所得',benefit+'\\n关系 +'+relGain,'good')
}
function sparNPC(id){
 const n=socialNPC(id),err=socialMeetCheck(n);if(err)return showResult('无法切磋',err,'bad');if(n.grudge>=55)return showResult('对方不愿切磋',n.name+'对你敌意太深，这已经不是点到为止的关系。','bad');const today=dayNumber();if(n.lastSparDay&&today-n.lastSparDay<5)return showResult('切磋太频繁','距离上次切磋还不足五日。');if(state.player.hp<Math.ceil(maxHp()*.35))return showResult('状态太差','你气血太低，不适合切磋。','bad');n.lastSparDay=today;advanceDays(1);if(state.flags.dead)return;
 const playerPower=state.player.realmIndex*28+Math.floor(state.player.manualProf/18)+gearAtk()*3+gearDef()*2+rint(5,28);const npcPower=n.realmIndex*28+Math.floor(n.talent/5)+rint(5,28);const win=playerPower>=npcPower;const hpLoss=Math.max(1,Math.ceil(maxHp()*(win?.08:.16)));state.player.hp=Math.max(1,state.player.hp-hpLoss);const relGain=win?3:2;n.relation=clamp(n.relation+relGain,-100,100);state.player.manualProf+=win?5:3;addDiligence(2);addPersonal('你与'+n.name+'切磋一场，'+(win?'略胜一筹':'落在下风')+'。','good');save();render();showResult('同道切磋',(win?'你胜了。':'你败了。')+'\\n气血 -'+hpLoss+'\\n功法熟练度 +'+(win?5:3)+'\\n关系 +'+relGain,win?'good':'')
}
function askNPCForHelp(id){
 const n=socialNPC(id),err=socialMeetCheck(n);if(err)return showResult('无法求助',err,'bad');if(n.relation<20)return showResult('交情不足','至少达到“熟人”关系（20点）后，对方才愿意认真帮你。','bad');const key=socialMonthKey();if(n.lastHelpMonth===key)return showResult('本月已求助','这个月你已经麻烦过'+n.name+'一次。');n.lastHelpMonth=key;let text='';
 if(n.relation>=70){const st=rint(4,7),hb=rint(1,3);state.player.spiritStones+=st;state.player.herbs+=hb;text='灵石 +'+st+'，灵草 +'+hb;if(rand()<.35){state.player.insight++;text+='，悟道点 +1'}}else if(n.relation>=40){const st=rint(2,5);state.player.spiritStones+=st;text='灵石 +'+st;if(rand()<.35){state.player.herbs++;text+='，灵草 +1'}}else{state.player.herbs++;text='灵草 +1'}
 addPersonal(n.name+'念及旧交，出手帮了你一次：'+text+'。','good');save();render();showResult('故人相助',text+'\\n本月不能再次向此人求助。','good')
}
function processSocialEvents(){
 if(!state||state.flags.dead)return;const today=dayNumber();for(const n of state.npcs){if(!n.alive||!n.known||n.location!==state.player.location||n.grudge<45)continue;if(n.lastRevengeDay&&today-n.lastRevengeDay<20)continue;const chance=Math.min(.20,.035+n.grudge/750+Math.max(0,n.realmIndex-state.player.realmIndex)*.018);if(rand()>=chance)continue;n.lastRevengeDay=today;
  if(n.realmIndex>state.player.realmIndex&&rand()<.58){const old=state.player.injury||0;state.player.injury=clamp(old+1,0,3);const loss=Math.max(1,Math.ceil(maxHp()*.18));state.player.hp=Math.max(1,state.player.hp-loss);addPersonal('【恩怨】'+n.name+'趁你不备突然伏击，你受了伤。','bad')}
  else{const lost=Math.min(state.player.spiritStones,rint(1,4));state.player.spiritStones-=lost;addPersonal('【恩怨】'+n.name+'找人堵住你的去路，你被迫丢下 '+lost+' 块灵石脱身。','bad')}
  break
 }
}
`;
  const npcRender="function renderNPCs(){const arr=[...state.npcs].filter(n=>n.known||n.relation!==0||n.grudge!==0).sort((a,b)=>(Math.abs(b.relation)+b.grudge)-(Math.abs(a.relation)+a.grudge));$('npcList').innerHTML=arr.length?arr.map(n=>{const rel=n.relation>0?'关系 +'+n.relation:n.relation<0?'关系 '+n.relation:'关系 0',same=n.alive&&n.location===state.player.location;const actions=n.alive?(same?'<div class=\"event-actions\"><button data-gift-herb=\"'+n.id+'\">赠灵草</button><button data-gift-stone=\"'+n.id+'\">赠灵石</button><button data-dao=\"'+n.id+'\">论道</button><button data-spar=\"'+n.id+'\">切磋</button><button data-help=\"'+n.id+'\">求助</button></div>':'<div class=\"section-tip\">对方在【'+esc(n.location)+'】，需见面后才能互动。</div>'):'';return '<div class=\"npc\"><div class=\"npc-top\"><div><span class=\"npc-name\">'+esc(n.name)+'</span> <small>'+esc(n.faction)+'</small></div><span class=\"rel '+(n.relation>0?'good':n.relation<0||n.grudge>0?'bad':'')+'\">'+rel+(n.grudge?' · 仇恨 '+n.grudge:'')+' · '+relationTier(n)+'</span></div><div class=\"skill-desc\">'+(n.alive?REALMS[n.realmIndex].name+' · '+esc(n.location):'已死亡')+'</div>'+actions+'</div>'}).join(''):'<div class=\"section-tip\">你还没有真正认识谁。</div>';document.querySelectorAll('[data-gift-herb]').forEach(b=>b.onclick=()=>giftNPC(b.dataset.giftHerb,'herb'));document.querySelectorAll('[data-gift-stone]').forEach(b=>b.onclick=()=>giftNPC(b.dataset.giftStone,'stone'));document.querySelectorAll('[data-dao]').forEach(b=>b.onclick=()=>discussDaoNPC(b.dataset.dao));document.querySelectorAll('[data-spar]').forEach(b=>b.onclick=()=>sparNPC(b.dataset.spar));document.querySelectorAll('[data-help]').forEach(b=>b.onclick=()=>askNPCForHelp(b.dataset.help))}";
  must(/function renderNPCs\(\)\{[\s\S]*?\}\nfunction switchPage/,socialCode+'\n'+npcRender+'\nfunction switchPage','关系交互界面');
  if(!src.includes("const VERSION='0.8.0'"))throw new Error('V0.8升级失败：最终版本断言');
  return src;
};
