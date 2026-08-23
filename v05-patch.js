window.__TAIXUAN_PATCH_V05__=function(src){
  const must=(pattern,replacement,label)=>{const next=src.replace(pattern,replacement);if(next===src)throw new Error('V0.5升级失败：'+label+' 未命中');src=next};
  must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='0.4.0';","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='0.5.0';",'版本号');
  must("sect:'散修',sectRank:'无',sectContribution:0,sectTasksCompleted:0,sectTask:null,sectLastStipend:0}","sect:'散修',sectRank:'无',sectContribution:0,sectTasksCompleted:0,sectTask:null,sectLastStipend:0,healingPills:0,tradeVolume:0}",'新角色坊市字段');
  must("if(state.player.sectLastStipend==null)state.player.sectLastStipend=0;","if(state.player.sectLastStipend==null)state.player.sectLastStipend=0;if(state.player.healingPills==null)state.player.healingPills=0;if(state.player.tradeVolume==null)state.player.tradeVolume=0;",'旧存档坊市迁移');

  const marketCode=`
function marketPrices(){const idx=state.world.marketIndex||100;return {idx,herbBuy:Math.max(3,Math.ceil(4*idx/100)),herbSell:Math.max(1,Math.floor(3*idx/100)),pillBuy:Math.max(6,Math.ceil(8*idx/100))}}
function marketTrend(){const i=state.world.marketIndex||100;return i>=120?'火热':i>=106?'偏贵':i>=94?'平稳':i>=84?'偏低':'低迷'}
function marketTrade(kind,count=1){
 if(state.player.location!=='临江城')return showResult('不在坊市','只有到临江城才能进行坊市交易。','bad');
 count=Math.max(1,Math.floor(count));const p=marketPrices(),pl=state.player;
 if(kind==='buyHerb'){
   const cost=p.herbBuy*count;if(pl.spiritStones<cost)return showResult('灵石不足',\`购买 \${count} 株灵草需要 \${cost} 块灵石。\`,'bad');
   pl.spiritStones-=cost;pl.herbs+=count;pl.tradeVolume+=cost;addPersonal(\`你在临江坊市买下 \${count} 株灵草，花费 \${cost} 块灵石。\`,'good');showResult('买入灵草',\`灵草 +\${count}\\n灵石 -\${cost}\`,'good');
 }else if(kind==='sellHerb'){
   if(pl.herbs<count)return showResult('灵草不足',\`你没有 \${count} 株灵草可卖。\`,'bad');const gain=p.herbSell*count;pl.herbs-=count;pl.spiritStones+=gain;pl.tradeVolume+=gain;addPersonal(\`你在临江坊市卖出 \${count} 株灵草，换得 \${gain} 块灵石。\`,'good');showResult('卖出灵草',\`灵草 -\${count}\\n灵石 +\${gain}\`,'good');
 }else if(kind==='buyPill'){
   const cost=p.pillBuy*count;if(pl.spiritStones<cost)return showResult('灵石不足',\`购买 \${count} 份回春散需要 \${cost} 块灵石。\`,'bad');pl.spiritStones-=cost;pl.healingPills+=count;pl.tradeVolume+=cost;addPersonal(\`你在药铺买下 \${count} 份回春散，花费 \${cost} 块灵石。\`,'good');showResult('购买回春散',\`回春散 +\${count}\\n灵石 -\${cost}\`,'good');
 }else return;
 save();render()
}
function useHealingPill(){
 const pl=state.player;if(pl.healingPills<=0)return showResult('没有药物','你身上没有回春散。','bad');if(pl.hp>=maxHp()&&(pl.injury||0)===0)return showResult('无需用药','你现在气血充盈，也没有伤势。');
 const beforeHp=pl.hp,beforeInjury=pl.injury||0;pl.healingPills--;pl.hp=Math.min(maxHp(),pl.hp+Math.ceil(maxHp()*.42));if(pl.injury>0)pl.injury--;addPersonal(\`你服下一份回春散，气血恢复，伤势由\${['无伤','轻伤','重伤','濒死'][beforeInjury]}缓解为\${injuryLabel()}。\`,'good');save();render();showResult('服用回春散',\`气血 +\${pl.hp-beforeHp}\\n伤势：\${['无伤','轻伤','重伤','濒死'][beforeInjury]} → \${injuryLabel()}\\n剩余回春散 \${pl.healingPills}\`,'good')
}
function renderMarket(){
 const info=$('marketInfo'),actions=$('marketActions');if(!info||!actions)return;const p=marketPrices(),pl=state.player,here=pl.location==='临江城';
 info.innerHTML=\`<div class="kv"><span>临江坊市行情</span><b>\${marketTrend()} · 指数 \${p.idx}</b></div><div class="kv"><span>灵草买入 / 卖出</span><b>\${p.herbBuy} / \${p.herbSell} 灵石</b></div><div class="kv"><span>回春散</span><b>\${p.pillBuy} 灵石 / 份</b></div><div class="kv"><span>随身回春散</span><b>\${pl.healingPills}</b></div><div class="kv"><span>累计交易额</span><b>\${pl.tradeVolume}</b></div>\`;
 actions.innerHTML=here?\`<div class="event-actions"><button data-market="buyHerb">买1株灵草</button><button data-market="buyHerb5">买5株灵草</button><button data-market="sellHerb">卖1株灵草</button><button data-market="sellHerb5">卖5株灵草</button><button data-market="buyPill">买1份回春散</button>\${pl.healingPills>0?'<button data-market="usePill">服用回春散</button>':''}</div>\`:\`<div class="section-tip">交易需要前往【临江城】。\${pl.healingPills>0?'你仍可使用随身携带的回春散。':''}</div>\${pl.healingPills>0?'<div class="event-actions"><button data-market="usePill">服用回春散</button></div>':''}\`;
 actions.querySelectorAll('[data-market]').forEach(b=>b.onclick=()=>{const k=b.dataset.market;if(k==='buyHerb')marketTrade('buyHerb',1);else if(k==='buyHerb5')marketTrade('buyHerb',5);else if(k==='sellHerb')marketTrade('sellHerb',1);else if(k==='sellHerb5')marketTrade('sellHerb',5);else if(k==='buyPill')marketTrade('buyPill',1);else if(k==='usePill')useHealingPill()})
}
`;
  must("function render(){",marketCode+"\nfunction render(){",'坊市逻辑注入');
  must("renderUrgent();renderHomeLog();renderCharacter();renderSect();renderMap();renderEvents();renderNPCs();","renderUrgent();renderHomeLog();renderCharacter();renderSect();renderMap();renderMarket();renderEvents();renderNPCs();",'坊市渲染挂载');
  if(!src.includes("const VERSION='0.5.0'"))throw new Error('V0.5升级失败：最终版本断言');
  return src;
};
