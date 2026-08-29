/* TAIXUAN_PLAYABLE_UI_V3920 */
(()=>{
'use strict';
let npcExpanded=false;
const $=id=>document.getElementById(id);
function pageButton(name){return document.querySelector(`.nav-btn[data-page="${name}"]`)}
function openPage(name){const b=pageButton(name);if(b){b.click();return}try{window.__TAIXUAN_TEST__?.switchPage(name)}catch(e){console.error(e)}}
function bindUiLinks(){document.querySelectorAll('[data-ui-page]').forEach(b=>{if(b.dataset.uiBound)return;b.dataset.uiBound='1';b.addEventListener('click',()=>openPage(b.dataset.uiPage))})}
function state(){try{return window.__TAIXUAN_TEST__?.getState?.()||null}catch{return null}}
function renderInventory(){const box=$('inventorySummary'),s=state();if(!box||!s?.player)return;const p=s.player;const rows=[['石','灵石',p.spiritStones||0],['草','灵草',p.herbs||0],['兽','兽材',p.beastMaterials||0],['灵','高阶灵材',p.rareMaterials||0],['古','古修残片',p.relicFragments||0]];box.innerHTML=rows.map(([icon,name,n])=>`<div class="ui-item"><b>${icon}</b><span>${name}</span><small>×${n}</small></div>`).join('')}
function decorateMap(){const box=$('mapList');if(!box)return;const nodes=[...box.querySelectorAll('.map-node')];if(!nodes.length)return;const current=nodes.find(n=>n.classList.contains('current'));if(!current)return;const direct=new Set([...current.querySelectorAll('[data-travel]')].map(b=>b.dataset.travel));let currentName=current.querySelector('.map-head b')?.textContent?.trim()||'';nodes.forEach(n=>{const name=n.querySelector('.map-head b')?.textContent?.trim()||'';n.classList.toggle('ui-concealed',n!==current&&!direct.has(name))});const scope=$('mapScopeText');if(scope)scope.innerHTML=`<b>${currentName}</b><span>只显示当前位置与 ${direct.size} 个可直达地域</span>`;bindUiLinks()}
function decorateNpcs(){const box=$('npcList'),pager=$('npcPager');if(!box||!pager)return;const rows=[...box.querySelectorAll(':scope > .npc')];rows.forEach((n,i)=>n.classList.toggle('ui-concealed',!npcExpanded&&i>=8));if(rows.length<=8){pager.innerHTML='';return}pager.innerHTML=`<button type="button">${npcExpanded?'收起人物':'查看其余 '+(rows.length-8)+' 人'}</button>`;pager.querySelector('button').onclick=()=>{npcExpanded=!npcExpanded;decorateNpcs()}}
function updateHomeShortcuts(){const s=state(),hint=$('uiWorldHint');if(!s?.player||!hint)return;const p=s.player,ri=Number(p.realmIndex)||0;let text='你现在只需要关心身边的凡俗世界。';if(ri>=1)text='你已经踏入修真圈，天下会逐步显露更多坊市、宗门与险地。';if(ri>=10)text='筑基之后，视野由一地扩展到郡府与宗门势力。';if(ri>=15)text='金丹之后，你开始真正参与一州修真界的大事。';if(ri>=23)text='化神之后，高阶边荒与空间区域才会逐步进入视野。';if(ri>=34)text='大乘之后，你面对的是整个人界的秩序与危机。';hint.textContent=text}
function refresh(){bindUiLinks();renderInventory();decorateMap();decorateNpcs();updateHomeShortcuts()}
function observe(id,fn){const el=$(id);if(!el)return;new MutationObserver(()=>requestAnimationFrame(fn)).observe(el,{childList:true,subtree:true,characterData:true})}
window.addEventListener('DOMContentLoaded',()=>{
 bindUiLinks();
 observe('mapList',decorateMap);observe('npcList',decorateNpcs);observe('spiritStoneQuick',()=>{renderInventory();updateHomeShortcuts()});observe('gearInfo',renderInventory);
 const app=$('gameApp');if(app)new MutationObserver(()=>setTimeout(refresh,0)).observe(app,{attributes:true,attributeFilter:['class']});
 let tries=0;const timer=setInterval(()=>{tries++;refresh();if(window.__TAIXUAN_TEST__||tries>80)clearInterval(timer)},100);
});
})();
