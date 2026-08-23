window.__TAIXUAN_PATCH_V07__=function(src){
  const must=(pattern,replacement,label)=>{const next=src.replace(pattern,replacement);if(next===src)throw new Error('V0.7升级失败：'+label+' 未命中');src=next};
  must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='0.6.0';","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='0.7.0';",'版本号');
  must("alchemyProf:0,qiPills:0,alchemyBatches:0}","alchemyProf:0,qiPills:0,alchemyBatches:0,beastMaterials:0,gearOwned:[],equipped:{weapon:null,armor:null,charm:null}}",'新角色装备字段');
  must("if(state.player.alchemyBatches==null)state.player.alchemyBatches=0;","if(state.player.alchemyBatches==null)state.player.alchemyBatches=0;if(state.player.beastMaterials==null)state.player.beastMaterials=0;if(!Array.isArray(state.player.gearOwned))state.player.gearOwned=[];if(!state.player.equipped)state.player.equipped={weapon:null,armor:null,charm:null};for(const k of ['weapon','armor','charm'])if(!(k in state.player.equipped))state.player.equipped[k]=null;",'旧存档装备迁移');
  must("function maxHp(){return realm().maxHp}","function maxHp(){return realm().maxHp+gearHp()}",'法器气血加成');
  must("function maxQi(){return realm().maxQi}","function maxQi(){return realm().maxQi+gearQi()}",'法器灵力加成');
  must("const prof=state.player.spells['基础拳脚']||0,dmg=rint(7,12)+state.player.realmIndex*3+Math.floor(prof/35)+Math.floor(state.player.manualProf/80);","const prof=state.player.spells['基础拳脚']||0,dmg=rint(7,12)+state.player.realmIndex*3+Math.floor(prof/35)+Math.floor(state.player.manualProf/80)+gearAtk();",'武器战斗加成');
  must("edmg=Math.max(1,edmg-Math.floor(state.player.realmIndex*.8));","edmg=Math.max(1,edmg-Math.floor(state.player.realmIndex*.8)-gearDef());",'护甲战斗减伤');
  must("state.player.battleWins++;state.player.kills++;onSectCombatWin(e);addDiligence(3);","state.player.battleWins++;state.player.kills++;onSectCombatWin(e);onGearCombatWin(e);addDiligence(3);",'妖兽掉落联动');

  const gearCode=`
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
 if(state.player.beastMaterials<g.materials||state.player.spiritStones<g.stones)return showResult('材料不足','锻造【'+g.name+'】需要兽材 '+g.materials+'、灵石 '+g.stones+'。\\n当前：兽材 '+state.player.beastMaterials+'、灵石 '+state.player.spiritStones+'。','bad');
 state.player.beastMaterials-=g.materials;state.player.spiritStones-=g.stones;state.player.gearOwned.push(id);state.player.equipped[g.slot]=id;advanceDays(2);addDiligence(3);addPersonal('你耗费两日锻成【'+g.name+'】，并立即装备。','major');save();render();showResult('锻造完成','获得【'+g.name+'】并自动装备。\\n兽材 -'+g.materials+'\\n灵石 -'+g.stones,'good')
}
function equipGear(id){const g=GEAR_ITEMS[id];if(!g||!state.player.gearOwned.includes(id))return;state.player.equipped[g.slot]=id;state.player.hp=Math.min(state.player.hp,maxHp());state.player.qi=Math.min(state.player.qi,maxQi());save();render();showResult('装备法器','已装备【'+g.name+'】。','good')}
function renderGear(){
 const info=$('gearInfo'),actions=$('gearActions');if(!info||!actions)return;const p=state.player,w=equippedGear('weapon'),a=equippedGear('armor'),c=equippedGear('charm');
 info.innerHTML='<div class="kv"><span>兽材</span><b>'+p.beastMaterials+'</b></div><div class="kv"><span>武器</span><b>'+(w?w.name+' · 伤害 +'+w.atk:'无')+'</b></div><div class="kv"><span>护甲</span><b>'+(a?a.name+' · 减伤 +'+a.def:'无')+'</b></div><div class="kv"><span>佩饰</span><b>'+(c?c.name+' · 气血 +'+c.hp+' / 灵力 +'+c.qi:'无')+'</b></div>';
 actions.innerHTML=Object.values(GEAR_ITEMS).map(g=>'<div class="skill-card"><div class="skill-head"><b>【'+g.name+'】</b><span>兽材'+g.materials+' · 灵石'+g.stones+' · 2日</span></div><div class="skill-desc">'+g.desc+'</div></div><div class="event-actions">'+(p.gearOwned.includes(g.id)?'<button data-equip="'+g.id+'">'+(p.equipped[g.slot]===g.id?'已装备':'装备')+'</button>':'<button data-forge="'+g.id+'">锻造</button>')+'</div>').join('');
 actions.querySelectorAll('[data-forge]').forEach(b=>b.onclick=()=>forgeGear(b.dataset.forge));actions.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>equipGear(b.dataset.equip))
}
`;
  must("function render(){",gearCode+"\nfunction render(){",'装备逻辑注入');
  must("renderUrgent();renderHomeLog();renderCharacter();renderSect();renderMap();renderMarket();renderAlchemy();renderEvents();renderNPCs();","renderUrgent();renderHomeLog();renderCharacter();renderSect();renderMap();renderMarket();renderAlchemy();renderGear();renderEvents();renderNPCs();",'装备渲染挂载');
  if(!src.includes("const VERSION='0.7.0'"))throw new Error('V0.7升级失败：最终版本断言');
  return src;
};
