/* TAIXUAN_PLAYABLE_UI_V3920 */
/* TAIXUAN_PLAYABLE_UI_V3920_PHASE6 */
(()=>{
'use strict';
let npcExpanded=false;
let eventExpanded=false;
let alchemyExpanded=false;
let gearExpanded=false;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function pageButton(name){return document.querySelector(`.nav-btn[data-page="${name}"]`)}
function openPage(name){const b=pageButton(name);if(b){b.click();return}try{window.__TAIXUAN_TEST__?.switchPage(name)}catch(e){console.error(e)}}
function bindUiLinks(){document.querySelectorAll('[data-ui-page]').forEach(b=>{if(b.dataset.uiBound)return;b.dataset.uiBound='1';b.addEventListener('click',()=>openPage(b.dataset.uiPage))})}
function state(){try{return window.__TAIXUAN_TEST__?.getState?.()||null}catch{return null}}
function combatState(){try{return window.__TAIXUAN_TEST__?.getCombat?.()||null}catch{return null}}
function renderInventory(){
 const box=$('inventorySummary'),s=state();if(!box||!s?.player)return;
 const p=s.player;
 const rows=[['石','灵石',p.spiritStones||0],['草','灵草',p.herbs||0],['兽','兽材',p.beastMaterials||0],['灵','高阶灵材',p.rareMaterials||0],['古','古修残片',p.relicFragments||0]];
 box.innerHTML=rows.map(([icon,name,n])=>`<div class="ui-item"><b>${icon}</b><span>${name}</span><small>×${n}</small></div>`).join('')
}
function decorateMap(){
 const box=$('mapList');if(!box)return;
 const nodes=[...box.querySelectorAll('.map-node')];if(!nodes.length)return;
 const current=nodes.find(n=>n.classList.contains('current'));if(!current)return;
 const direct=new Set([...current.querySelectorAll('[data-travel]')].map(b=>b.dataset.travel));
 const currentName=current.querySelector('.map-head b')?.textContent?.trim()||'';
 nodes.forEach(n=>{const name=n.querySelector('.map-head b')?.textContent?.trim()||'';n.classList.toggle('ui-concealed',n!==current&&!direct.has(name))});
 const scope=$('mapScopeText');if(scope)scope.innerHTML=`<b>${esc(currentName)}</b><span>只显示当前位置与 ${direct.size} 个可直达地域</span>`;
 bindUiLinks()
}
function decorateNpcs(){
 const box=$('npcList'),pager=$('npcPager');if(!box||!pager)return;
 const rows=[...box.querySelectorAll(':scope > .npc')];
 rows.forEach((n,i)=>n.classList.toggle('ui-concealed',!npcExpanded&&i>=8));
 if(rows.length<=8){pager.innerHTML='';return}
 const label=npcExpanded?'收起人物':'查看其余 '+(rows.length-8)+' 人';
 if(pager.querySelector('button')?.textContent!==label){
  pager.innerHTML=`<button type="button">${label}</button>`;
  pager.querySelector('button').onclick=()=>{npcExpanded=!npcExpanded;decorateNpcs()}
 }
}
function updateHomeShortcuts(){
 const s=state(),hint=$('uiWorldHint');if(!s?.player||!hint)return;
 const p=s.player,ri=Number(p.realmIndex)||0;
 let text='你现在只需要关心身边的凡俗世界。';
 if(ri>=1)text='你已经踏入修真圈，天下会逐步显露更多坊市、宗门与险地。';
 if(ri>=10)text='筑基之后，视野由一地扩展到郡府与宗门势力。';
 if(ri>=15)text='金丹之后，你开始真正参与一州修真界的大事。';
 if(ri>=23)text='化神之后，高阶边荒与空间区域才会逐步进入视野。';
 if(ri>=34)text='大乘之后，你面对的是整个人界的秩序与危机。';
 hint.textContent=text
}
function decorateBreakthrough(){
 const box=$('breakthroughBox');if(!box)return;
 const cards=[...box.children].filter(x=>x.nodeType===1&&x.id!=='uiBreakthroughHead');
 if(!cards.length){$('uiBreakthroughHead')?.remove();return}
 box.classList.add('ui-breakthrough-zone');
 const s=state(),p=s?.player;
 let head=$('uiBreakthroughHead');
 if(!head){head=document.createElement('div');head.id='uiBreakthroughHead';head.className='ui-breakthrough-head';box.prepend(head)}
 const realm=$('realmName')?.textContent?.trim()||'当前境界';
 const prog=$('cultivationText')?.textContent?.trim()||'';
 const insight=p?.insight??0,injury=Number(p?.injury)||0;
 const injuryText=['无伤','轻伤','重伤','濒死'][Math.max(0,Math.min(3,injury))]||'未知';
 head.innerHTML=`<div><span>破境准备</span><b>${esc(realm)}</b></div><div class="ui-breakthrough-metrics"><em>${esc(prog||'修为积累中')}</em><em>悟道 ${insight}</em><em class="${injury?'bad':'good'}">${injuryText}</em></div>`;
 box.querySelectorAll('[data-breakthrough]').forEach(b=>{b.classList.add('primary','ui-breakthrough-action')});
 [...box.querySelectorAll('.urgent')].forEach(x=>x.classList.add('ui-breakthrough-card'))
}
function combatMaxHp(){try{return Number(window.__TAIXUAN_TEST__?.maxHp?.())||0}catch{return 0}}
function pct(n,d){return d>0?Math.max(0,Math.min(100,(Number(n)||0)/d*100)):0}
function decorateCombatModal(){
 const modal=$('modal');if(!modal)return;
 const combatButtons=[...modal.querySelectorAll('[data-combat]')];
 const c=combatState();
 const isCombat=combatButtons.length>0||!!c;
 modal.classList.toggle('ui-combat-modal',isCombat);
 if(!isCombat){modal.querySelector('#uiCombatHud')?.remove();return}
 const s=state(),p=s?.player||{},e=c?.enemy||{};
 let hud=modal.querySelector('#uiCombatHud');
 if(!hud){hud=document.createElement('div');hud.id='uiCombatHud';hud.className='ui-combat-hud';modal.prepend(hud)}
 const pMax=combatMaxHp()||Math.max(Number(c?.playerHp)||0,Number(p.hp)||1);
 const eMax=Math.max(Number(e.hp)||0,Number(c?.enemyHp)||1);
 const pHp=Number(c?.playerHp??p.hp)||0,eHp=Number(c?.enemyHp??e.hp)||0;
 const pQi=Number(c?.playerQi??p.qi)||0;
 const last=Array.isArray(c?.logs)&&c.logs.length?c.logs[c.logs.length-1]:'交锋已经开始';
 hud.innerHTML=`<div class="ui-combat-title"><span>遭遇战</span><b>${esc(e.name||'未知敌手')}</b></div><div class="ui-combat-vs"><div class="ui-fighter"><div class="ui-fighter-name"><b>${esc(p.name||'你')}</b><span>${esc($('realmName')?.textContent||'')}</span></div><div class="ui-hp"><i style="width:${pct(pHp,pMax)}%"></i></div><small>气血 ${Math.max(0,Math.floor(pHp))} / ${Math.floor(pMax)} · 灵力 ${Math.max(0,Math.floor(pQi))}</small></div><div class="ui-vs-mark">战</div><div class="ui-fighter enemy"><div class="ui-fighter-name"><b>${esc(e.name||'敌手')}</b><span>${esc(e.kind||'')}</span></div><div class="ui-hp"><i style="width:${pct(eHp,eMax)}%"></i></div><small>气血 ${Math.max(0,Math.floor(eHp))} / ${Math.floor(eMax)}</small></div></div><div class="ui-combat-last">${esc(last)}</div>`;
 combatButtons.forEach(b=>{const k=String(b.dataset.combat||'');b.classList.add('ui-combat-action');if(k.startsWith('skill:'))b.classList.add('ui-combat-skill');if(k==='attack'||k==='melee')b.classList.add('primary')})
}
function stageMessage(ri){
 if(ri<1)return '凡俗见闻 · 村镇、猎户、商旅与眼前危机';
 if(ri<10)return '炼气见闻 · 附近坊市、散修和低阶宗门';
 if(ri<15)return '筑基视野 · 郡域、宗门与秘境开始进入主线';
 if(ri<23)return '金丹 / 元婴视野 · 一州势力冲突与重要人物';
 if(ri<34)return '化神至合体视野 · 高阶边荒、战线与法则区域';
 return '大乘视野 · 人界秩序、世界危机与飞升前奏'
}
function decorateEvents(){
 const page=$('page-events'),log=$('worldLog');if(!page||!log)return;
 let scope=$('uiEventScope');
 if(!scope){scope=document.createElement('div');scope.id='uiEventScope';scope.className='ui-event-scope';const first=page.querySelector('.panel');if(first)page.insertBefore(scope,first)}
 const ri=Number(state()?.player?.realmIndex)||0;
 scope.innerHTML=`<span>当前信息层级</span><b>${esc(stageMessage(ri))}</b>`;
 const rows=[...log.querySelectorAll(':scope > .log-item')];
 rows.forEach((r,i)=>r.classList.toggle('ui-concealed',!eventExpanded&&i>=8));
 let pager=$('uiEventPager');
 if(rows.length>8){if(!pager){pager=document.createElement('div');pager.id='uiEventPager';pager.className='ui-list-pager';log.after(pager)}const label=eventExpanded?'收起旧闻':'查看其余 '+(rows.length-8)+' 条';if(pager.querySelector('button')?.textContent!==label){pager.innerHTML=`<button type="button">${label}</button>`;pager.querySelector('button').onclick=()=>{eventExpanded=!eventExpanded;decorateEvents()}}}else pager?.remove();
 const majors=$('majorEvents');if(majors)[...majors.querySelectorAll('.event-card')].forEach(x=>x.classList.add('ui-major-event'))
}
function decorateSect(){
 const info=$('sectInfo'),actions=$('sectActions');if(!info||!actions)return;
 const s=state(),p=s?.player||{};
 let summary=$('uiSectSummary');if(!summary){summary=document.createElement('div');summary.id='uiSectSummary';summary.className='ui-sect-summary';info.before(summary)}
 const sect=p.sect&&p.sect!=='散修'?p.sect:'尚未入宗';const rank=p.sectRank||'—',contribution=Number(p.sectContribution)||0;
 summary.innerHTML=`<div><span>宗门</span><b>${esc(sect)}</b></div><div><span>身份</span><b>${esc(rank)}</b></div><div><span>贡献</span><b>${contribution}</b></div>`;
 actions.querySelectorAll('button').forEach(b=>b.classList.add('ui-sect-action'));info.querySelectorAll('.skill-card').forEach(x=>x.classList.add('ui-sect-card'))
}
function foldCards(containerId,pagerId,limit,expanded,setExpanded,label){
 const box=$(containerId);if(!box)return;
 const cards=[...box.querySelectorAll('.skill-card')];cards.forEach((x,i)=>x.classList.toggle('ui-concealed',!expanded&&i>=limit));
 let pager=$(pagerId);if(cards.length<=limit){pager?.remove();return}
 if(!pager){pager=document.createElement('div');pager.id=pagerId;pager.className='ui-list-pager';box.after(pager)}
 const text=expanded?'收起列表':`查看其余 ${cards.length-limit} ${label}`;
 if(pager.querySelector('button')?.textContent!==text){pager.innerHTML=`<button type="button">${text}</button>`;pager.querySelector('button').onclick=()=>{setExpanded(!expanded)}}
}
function decorateAlchemy(){
 const info=$('alchemyInfo'),actions=$('alchemyActions');if(!info||!actions)return;
 actions.closest('.system-panel')?.classList.add('ui-craft-system');actions.querySelectorAll('.skill-card').forEach(x=>x.classList.add('ui-recipe-card'));actions.querySelectorAll('button').forEach(b=>b.classList.add('ui-craft-action'));
 foldCards('alchemyActions','uiAlchemyPager',6,alchemyExpanded,v=>{alchemyExpanded=v;decorateAlchemy()},'丹方')
}
function decorateGear(){
 const info=$('gearInfo'),actions=$('gearActions');if(!info||!actions)return;
 actions.closest('.system-panel')?.classList.add('ui-craft-system');actions.querySelectorAll('.skill-card').forEach(x=>x.classList.add('ui-forge-card'));actions.querySelectorAll('button').forEach(b=>b.classList.add('ui-craft-action'));
 foldCards('gearActions','uiGearPager',6,gearExpanded,v=>{gearExpanded=v;decorateGear()},'器物')
}
function refresh(){bindUiLinks();renderInventory();decorateMap();decorateNpcs();updateHomeShortcuts();decorateBreakthrough();decorateCombatModal();decorateEvents();decorateSect();decorateAlchemy();decorateGear()}
function observe(id,fn){const el=$(id);if(!el)return;new MutationObserver(()=>requestAnimationFrame(fn)).observe(el,{childList:true,subtree:true,characterData:true})}
window.addEventListener('DOMContentLoaded',()=>{
 bindUiLinks();
 observe('mapList',decorateMap);observe('npcList',decorateNpcs);observe('breakthroughBox',decorateBreakthrough);observe('modal',decorateCombatModal);observe('majorEvents',decorateEvents);observe('worldLog',decorateEvents);observe('sectInfo',decorateSect);observe('sectActions',decorateSect);observe('alchemyInfo',decorateAlchemy);observe('alchemyActions',decorateAlchemy);observe('gearInfo',()=>{renderInventory();decorateGear()});observe('gearActions',decorateGear);observe('spiritStoneQuick',()=>{renderInventory();updateHomeShortcuts();decorateBreakthrough()});
 const app=$('gameApp');if(app)new MutationObserver(()=>setTimeout(refresh,0)).observe(app,{attributes:true,attributeFilter:['class']});
 let tries=0;const timer=setInterval(()=>{tries++;refresh();if(window.__TAIXUAN_TEST__||tries>80)clearInterval(timer)},100);
});
})();
