/* TAIXUAN_FINAL_PLAYABLE_UI_V1 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function state(){try{return window.__TAIXUAN_TEST__?.getState?.()||null}catch{return null}}
function parseProgress(){const t=$('cultivationText')?.textContent||'';const m=t.match(/([\d.]+)\s*\/\s*([\d.]+)/);return m?{now:Number(m[1])||0,need:Number(m[2])||1}:null}
function openSecondary(name){const existing=document.querySelector(`.ui-home-shortcuts [data-ui-page="${name}"]`)||document.querySelector(`[data-ui-page="${name}"]`);existing?.click()}
function openMain(name){document.querySelector(`.nav-btn[data-page="${name}"]`)?.click()}
function ensureHomeBlocks(){const page=$('page-home'),hero=page?.querySelector('.hero-card');if(!page||!hero)return;
 let goal=$('uiFinalGoal');if(!goal){goal=document.createElement('section');goal.id='uiFinalGoal';goal.className='ui-final-goal';hero.after(goal)}
 const action=page.querySelector('.action-panel');let world=$('uiFinalNearby');if(!world&&action){world=document.createElement('section');world.id='uiFinalNearby';world.className='ui-final-nearby';action.after(world)}
 let rumor=$('uiFinalRumor');if(!rumor&&world){rumor=document.createElement('button');rumor.type='button';rumor.id='uiFinalRumor';rumor.className='ui-final-rumor';rumor.onclick=()=>openSecondary('events');world.after(rumor)}
}
function goalFor(s){const p=s?.player||{},ri=Number(p.realmIndex)||0,pr=parseProgress();let title='活下去，并找到真正的修行之路',detail='先熟悉青石村，积攒最初的灵石与修为。',tag='凡俗起步';
 if(s?.flags?.dead)return {title:'此世已终',detail:'本世已经身死道消。',tag:'轮回'};
 if(pr&&pr.now>=pr.need)return {title:'突破当前境界',detail:'修为已经圆满，准备好后尝试破境。',tag:'破境已就'};
 if(ri===0)return {title:'踏入炼气一层',detail:`还需修为 ${Math.max(0,Math.ceil((pr?.need||120)-(pr?.now||0)))}`,tag:'当前主线'};
 if(ri<4&&p.location==='青石村')return {title:'离开青石村，接触修真圈',detail:'前往青石镇，寻找更好的功法、坊市与修士消息。',tag:'世界展开'};
 if(ri<10)return {title:'修至炼气九层，谋求筑基',detail:`当前 ${$('realmName')?.textContent||'炼气境'} · 主修《${p.manual||'基础吐纳诀'}》`,tag:'炼气主线'};
 if(ri<15)return {title:'筑牢道基，准备结丹',detail:'洞府、丹药、宗门与功法会开始真正拉开差距。',tag:'筑基主线'};
 if(ri<23)return {title:'金丹元婴，跻身一方强者',detail:'继续扩展势力、法宝、丹道与人物因果。',tag:'中期主线'};
 if(ri<34)return {title:'跨越炼虚与合体',detail:'空间、法则与高阶世界逐步成为核心。',tag:'高阶主线'};
 if(ri<38)return {title:'大乘圆满，准备仙劫',detail:'肉身、元神、法则、法宝、阵法五线都要准备。',tag:'飞升前夜'};
 return {title:'渡尽仙劫，飞升真仙',detail:'六重雷劫、心魔与仙凡蜕变已经近在眼前。',tag:'终局'}
}
function renderGoal(){const box=$('uiFinalGoal'),s=state();if(!box||!s?.player)return;const g=goalFor(s);box.innerHTML=`<div class="ui-final-section-kicker">当前目标</div><div class="ui-final-goal-row"><div><span>${esc(g.tag)}</span><b>${esc(g.title)}</b><small>${esc(g.detail)}</small></div><button type="button">详情</button></div>`;box.querySelector('button').onclick=()=>openSecondary('character')}
function arrangeActions(){const panel=$('page-home')?.querySelector('.action-panel');if(!panel)return;panel.classList.add('ui-final-actions');const map={cultivate:['修炼','吐纳积累修为'],explore:['外出','探索、战斗与机缘'],work:['谋生','赚取盘缠与灵石'],rest:['休整','恢复气血与伤势'],gather:['采集','搜集材料'],rumor:['打听','获取消息']};panel.querySelectorAll('[data-action]').forEach(b=>{const k=b.dataset.action,copy=map[k];b.classList.add(`ui-final-action-${k}`);if(copy){const strong=b.querySelector('b'),small=b.querySelector('small');if(strong)strong.textContent=copy[0];if(small)small.textContent=copy[1]}})}
function nearbyRows(){const s=state(),cur=s?.player?.location||'';const node=[...document.querySelectorAll('#mapList .map-node')].find(n=>n.classList.contains('current'));const routes=node?[...node.querySelectorAll('[data-travel]')].slice(0,3):[];const out=[{name:cur,status:'当前所在地',kind:'current'}];for(const b of routes){const txt=b.dataset.travel||b.textContent?.replace(/^前往/,'').split(' · ')[0]||'未知地点';out.push({name:txt,status:'可前往',kind:'route'})}return out.slice(0,3)}
function renderNearby(){const box=$('uiFinalNearby'),s=state();if(!box||!s?.player)return;const rows=nearbyRows();box.innerHTML=`<div class="ui-final-title-row"><div><span>身边的世界</span><b>${esc(s.player.location)}</b></div><button type="button">进入天下</button></div><div class="ui-final-nearby-list">${rows.map((r,i)=>`<button type="button" data-nearby="${i}" class="${r.kind}"><span>${esc(r.name)}</span><small>${esc(r.status)}</small><i>›</i></button>`).join('')}</div>`;box.querySelector('.ui-final-title-row button').onclick=()=>openMain('map');box.querySelectorAll('[data-nearby]').forEach(b=>b.onclick=()=>openMain('map'))}
function renderRumor(){const box=$('uiFinalRumor'),s=state();if(!box||!s)return;const e=(s.worldLog||[])[0]||(s.personalLog||[])[0];const text=e?.text||'附近暂时没有值得注意的新消息。';box.innerHTML=`<span>见闻</span><b>${esc(text)}</b><i>›</i>`}
function trimHome(){const page=$('page-home');if(!page)return;page.querySelector('.log-panel')?.classList.add('ui-final-hidden-log');page.querySelector('.ui-home-shortcuts')?.classList.add('ui-final-hidden-shortcuts')}
function refresh(){ensureHomeBlocks();renderGoal();arrangeActions();renderNearby();renderRumor();trimHome()}
window.addEventListener('DOMContentLoaded',()=>{let n=0;const timer=setInterval(()=>{n++;refresh();if(window.__TAIXUAN_TEST__||n>100)clearInterval(timer)},80);for(const id of ['cultivationText','realmName','mapList','homeLog','spiritStoneQuick']){const el=$(id);if(el)new MutationObserver(()=>requestAnimationFrame(refresh)).observe(el,{childList:true,subtree:true,characterData:true})}const app=$('gameApp');if(app)new MutationObserver(()=>requestAnimationFrame(refresh)).observe(app,{attributes:true,attributeFilter:['class']})});
})();
