window.__TAIXUAN_PATCH_V06__=function(src){
  const must=(pattern,replacement,label)=>{const next=src.replace(pattern,replacement);if(next===src)throw new Error('V0.6升级失败：'+label+' 未命中');src=next};
  must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='0.5.0';","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='0.6.0';",'版本号');
  must("healingPills:0,tradeVolume:0}","healingPills:0,tradeVolume:0,alchemyProf:0,qiPills:0,alchemyBatches:0}",'新角色炼丹字段');
  must("if(state.player.tradeVolume==null)state.player.tradeVolume=0;","if(state.player.tradeVolume==null)state.player.tradeVolume=0;if(state.player.alchemyProf==null)state.player.alchemyProf=0;if(state.player.qiPills==null)state.player.qiPills=0;if(state.player.alchemyBatches==null)state.player.alchemyBatches=0;",'旧存档炼丹迁移');

  const alchemyCode=`
const ALCHEMY_RECIPES={
 healing:{id:'healing',name:'回春散',herbs:2,stones:1,base:.62,unlock:0,desc:'疗伤散剂。服用后恢复气血，并缓解一级伤势。'},
 qi:{id:'qi',name:'聚气丹',herbs:3,stones:2,base:.50,unlock:1,desc:'炼气期丹药。服用后立即恢复大量灵力，省去休整时间。'}
};
function alchemyChance(recipe){const prof=state.player.alchemyProf||0,inner=state.player.sectRank==='内门弟子'?.05:0;return clamp(recipe.base+Math.min(.28,prof/420)+inner,.35,.95)}
function alchemyGradeChance(){return clamp(.04+(state.player.alchemyProf||0)/700,.04,.28)}
function brewAlchemy(id){
 if(!canAct())return;const r=ALCHEMY_RECIPES[id];if(!r)return;
 if(state.player.realmIndex<r.unlock)return showResult('丹方未解锁','【'+r.name+'】至少需要达到'+REALMS[r.unlock].name+'才能尝试炼制。','bad');
 if(state.player.herbs<r.herbs||state.player.spiritStones<r.stones)return showResult('材料不足','炼制【'+r.name+'】需要灵草 '+r.herbs+'、灵石 '+r.stones+'。\\n当前：灵草 '+state.player.herbs+'、灵石 '+state.player.spiritStones+'。','bad');
 const before=alchemyChance(r);state.player.herbs-=r.herbs;state.player.spiritStones-=r.stones;state.player.alchemyBatches++;advanceDays(1);addDiligence(2);
 const success=rand()<before;
 if(success){const extra=rand()<alchemyGradeChance()?1:0,count=1+extra;if(id==='healing')state.player.healingPills+=count;else state.player.qiPills+=count;state.player.alchemyProf+=7;addPersonal('你守炉一日，成功炼成【'+r.name+'】'+count+'份'+(extra?'，其中一炉药性格外凝练':'')+'。炼丹熟练度 +7。','good');save();render();showResult('炼丹成功','【'+r.name+'】 +'+count+'\\n炼丹熟练度 +7\\n当前成功率 '+Math.round(alchemyChance(r)*100)+'%','good')}
 else{state.player.alchemyProf+=3;addPersonal('你炼制【'+r.name+'】时火候失衡，药材尽毁，但记住了这次教训。炼丹熟练度 +3。','bad');save();render();showResult('炼丹失败','材料已经消耗。\\n炼丹熟练度 +3\\n当前成功率 '+Math.round(alchemyChance(r)*100)+'%','bad')}
}
function useQiPill(){
 const p=state.player;if(p.qiPills<=0)return showResult('没有丹药','你身上没有聚气丹。','bad');if(maxQi()<=0)return showResult('尚未炼气','凡人还无法炼化聚气丹中的灵力。','bad');if(p.qi>=maxQi())return showResult('灵力充盈','你现在灵力已满，无需服用聚气丹。');const before=p.qi;p.qiPills--;p.qi=Math.min(maxQi(),p.qi+Math.ceil(maxQi()*.68));addPersonal('你服下一枚聚气丹，灵力迅速恢复 '+(p.qi-before)+' 点。','good');save();render();showResult('服用聚气丹','灵力 +'+(p.qi-before)+'\\n剩余聚气丹 '+p.qiPills,'good')
}
function renderAlchemy(){
 const info=$('alchemyInfo'),actions=$('alchemyActions');if(!info||!actions)return;const p=state.player,h=ALCHEMY_RECIPES.healing,q=ALCHEMY_RECIPES.qi;
 info.innerHTML='<div class="kv"><span>炼丹熟练度</span><b>'+p.alchemyProf+'</b></div><div class="kv"><span>已开炉</span><b>'+p.alchemyBatches+' 次</b></div><div class="kv"><span>回春散</span><b>'+p.healingPills+' 份 · 成功率 '+Math.round(alchemyChance(h)*100)+'%</b></div><div class="kv"><span>聚气丹</span><b>'+(p.realmIndex>=1?p.qiPills+' 枚 · 成功率 '+Math.round(alchemyChance(q)*100)+'%':'炼气期解锁')+'</b></div>';
 actions.innerHTML='<div class="skill-card"><div class="skill-head"><b>【回春散】</b><span>灵草2 · 灵石1 · 1日</span></div><div class="skill-desc">'+h.desc+'</div></div><div class="event-actions"><button data-alchemy="healing">开炉炼制回春散</button>'+(p.healingPills>0?'<button data-alchemy="useHeal">服用回春散</button>':'')+'</div><div class="skill-card"><div class="skill-head"><b>【聚气丹】</b><span>'+(p.realmIndex>=1?'灵草3 · 灵石2 · 1日':'炼气期解锁')+'</span></div><div class="skill-desc">'+q.desc+'</div></div><div class="event-actions"><button data-alchemy="qi" '+(p.realmIndex<1?'disabled':'')+'>开炉炼制聚气丹</button>'+(p.qiPills>0?'<button data-alchemy="useQi">服用聚气丹</button>':'')+'</div>';
 actions.querySelectorAll('[data-alchemy]').forEach(b=>b.onclick=()=>{const k=b.dataset.alchemy;if(k==='healing')brewAlchemy('healing');else if(k==='qi')brewAlchemy('qi');else if(k==='useHeal')useHealingPill();else if(k==='useQi')useQiPill()})
}
`;
  must("function render(){",alchemyCode+"\nfunction render(){",'炼丹逻辑注入');
  must("renderUrgent();renderHomeLog();renderCharacter();renderSect();renderMap();renderMarket();renderEvents();renderNPCs();","renderUrgent();renderHomeLog();renderCharacter();renderSect();renderMap();renderMarket();renderAlchemy();renderEvents();renderNPCs();",'炼丹渲染挂载');
  if(!src.includes("const VERSION='0.6.0'"))throw new Error('V0.6升级失败：最终版本断言');
  return src;
};
