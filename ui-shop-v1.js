/* TAIXUAN_MONETIZATION_UI_V1 */
(()=>{
'use strict';
const KEY='taixuan-premium-wallet-v1';
const VERSION=1;
const RECHARGE=[
 {id:'jade-6',price:6,base:60,bonus:0},
 {id:'jade-30',price:30,base:300,bonus:30},
 {id:'jade-68',price:68,base:680,bonus:80},
 {id:'jade-128',price:128,base:1280,bonus:200},
 {id:'jade-328',price:328,base:3280,bonus:650},
 {id:'jade-648',price:648,base:6480,bonus:1600}
];
const VIP_THRESHOLDS=[0,60,300,680,1280,3280,6480,10000,20000];
const VIP_DAILY=[0,10,20,30,40,60,90,120,180];
const GROWTH=[
 {id:'qi',realm:1,name:'踏入炼气',jade:100},
 {id:'foundation',realm:10,name:'筑基有成',jade:150},
 {id:'golden',realm:15,name:'金丹初成',jade:200},
 {id:'nascent',realm:19,name:'元婴出世',jade:300},
 {id:'spirit',realm:23,name:'化神入世',jade:400},
 {id:'void',realm:26,name:'炼虚破界',jade:500},
 {id:'unity',realm:30,name:'合体归一',jade:650},
 {id:'mahayana',realm:34,name:'大乘问道',jade:800},
 {id:'tribulation',realm:38,name:'渡劫在即',jade:1000},
 {id:'immortal',realm:39,name:'飞升真仙',jade:1500}
];
let activeTab='jade';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function fresh(){return {version:VERSION,jade:0,vipExp:0,totalCny:0,monthlyUntil:0,monthlyClaimDate:'',growthOwned:false,growthClaimed:[],vipClaimDate:'',firstBonusUsed:{},receipts:[]}}
function load(){try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');return {...fresh(),...(raw||{}),firstBonusUsed:{...(raw?.firstBonusUsed||{})},growthClaimed:[...(raw?.growthClaimed||[])],receipts:[...(raw?.receipts||[])]}}catch{return fresh()}}
function save(w){localStorage.setItem(KEY,JSON.stringify(w));updateCurrency(w)}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function gameState(){try{return window.__TAIXUAN_TEST__?.getState?.()||null}catch{return null}}
function realmIndex(){return Number(gameState()?.player?.realmIndex)||0}
function vipLevel(exp){let level=0;for(let i=0;i<VIP_THRESHOLDS.length;i++)if(exp>=VIP_THRESHOLDS[i])level=i;return Math.min(level,VIP_THRESHOLDS.length-1)}
function monthlyDays(w){return Math.max(0,Math.ceil((Number(w.monthlyUntil||0)-Date.now())/86400000))}
function addReceipt(w,type,label,amount=0){w.receipts.unshift({at:Date.now(),type,label,amount});w.receipts=w.receipts.slice(0,12)}
function updateCurrency(w=load()){
 const el=document.querySelector('.ui-currency');if(!el)return;
 el.classList.add('ui-currency-live');el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label','打开仙玉商城');
 el.innerHTML=`<b>仙玉</b><em>${Math.max(0,Math.floor(w.jade||0))}</em><i>＋</i>`;
 if(!el.dataset.shopBound){el.dataset.shopBound='1';el.addEventListener('click',()=>openShop('jade'));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openShop('jade')}})}
}
function ensureOverlay(){
 let overlay=$('uiShopOverlay');if(overlay)return overlay;
 overlay=document.createElement('div');overlay.id='uiShopOverlay';overlay.className='ui-shop-overlay hidden';
 overlay.innerHTML=`<section class="ui-shop-sheet" role="dialog" aria-modal="true" aria-label="太玄界商城"><header class="ui-shop-head"><div><span>仙玉商行</span><h2>商城</h2></div><button type="button" id="uiShopClose" aria-label="关闭商城">×</button></header><div id="uiShopWallet" class="ui-shop-wallet"></div><div class="ui-shop-sandbox">开发测试模式 · 所有“支付”均为本机模拟，不会产生真实扣款。</div><nav id="uiShopTabs" class="ui-shop-tabs"><button data-shop-tab="jade">仙玉</button><button data-shop-tab="monthly">月卡</button><button data-shop-tab="growth">成长</button><button data-shop-tab="vip">VIP</button></nav><div id="uiShopToast" class="ui-shop-toast hidden"></div><div id="uiShopContent" class="ui-shop-content"></div></section>`;
 document.body.appendChild(overlay);
 $('uiShopClose').onclick=closeShop;
 overlay.addEventListener('click',e=>{if(e.target===overlay)closeShop()});
 overlay.querySelectorAll('[data-shop-tab]').forEach(b=>b.onclick=()=>{activeTab=b.dataset.shopTab;renderShop()});
 return overlay
}
function openShop(tab='jade'){activeTab=tab;const overlay=ensureOverlay();overlay.classList.remove('hidden');document.body.classList.add('ui-shop-open');renderShop()}
function closeShop(){const overlay=$('uiShopOverlay');if(overlay)overlay.classList.add('hidden');document.body.classList.remove('ui-shop-open')}
function toast(text){const el=$('uiShopToast');if(!el)return;el.textContent=text;el.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.add('hidden'),2200)}
function walletHeader(w){
 const level=vipLevel(w.vipExp||0),days=monthlyDays(w);
 return `<div><span>仙玉</span><b>${Math.floor(w.jade||0)}</b></div><div><span>VIP</span><b>VIP ${level}</b></div><div><span>月卡</span><b>${days?days+'天':'未开通'}</b></div>`
}
function renderJade(w){
 return `<div class="ui-shop-section-title"><div><span>仙玉充值</span><b>首次购买每档额外赠送基础仙玉</b></div></div><div class="ui-recharge-grid">${RECHARGE.map(x=>{const first=!w.firstBonusUsed[x.id],gain=x.base+x.bonus+(first?x.base:0);return `<button class="ui-recharge-card" data-recharge="${x.id}"><span>${first?'首购双倍':'仙玉'}</span><b>${gain}</b><small>${x.base}${x.bonus?` + 赠${x.bonus}`:''}${first?` + 首购${x.base}`:''}</small><em>模拟支付 ¥${x.price}</em></button>`}).join('')}</div><div class="ui-shop-footnote">仙玉目前只服务于付费系统测试，不改变 V3.9 核心战斗与数值平衡。</div>${receiptHtml(w)}`
}
function renderMonthly(w){
 const days=monthlyDays(w),canClaim=days>0&&w.monthlyClaimDate!==today();
 return `<div class="ui-premium-hero"><span>玄玉月契</span><h3>${days?`剩余 ${days} 天`:'尚未开通'}</h3><p>模拟支付 ¥30：立即获得 300 仙玉，并延长 30 天；有效期内每日可领取 100 仙玉。</p><button class="primary" data-monthly-buy>${days?'续期30天':'模拟开通 ¥30'}</button></div><div class="ui-daily-claim"><div><span>今日月卡仙玉</span><b>${days?'100 仙玉':'需要先开通月卡'}</b></div><button data-monthly-claim ${canClaim?'':'disabled'}>${w.monthlyClaimDate===today()?'今日已领':days?'领取':'未开通'}</button></div><div class="ui-shop-footnote">月卡购买同时累计 300 VIP 经验。重复购买会直接延长有效期。</div>`
}
function renderGrowth(w){
 const ri=realmIndex(),claimed=new Set(w.growthClaimed||[]);
 return `<div class="ui-premium-hero growth"><span>问道成长令</span><h3>${w.growthOwned?'已激活':'一次购买 · 全程成长返还'}</h3><p>模拟支付 ¥68 激活。立即获得 680 仙玉；之后随实际境界推进领取里程碑仙玉。</p>${w.growthOwned?'<button disabled>已拥有</button>':'<button class="primary" data-growth-buy>模拟购买 ¥68</button>'}</div><div class="ui-growth-list">${GROWTH.map(x=>{const unlocked=ri>=x.realm,done=claimed.has(x.id),can=w.growthOwned&&unlocked&&!done;return `<div class="ui-growth-row ${unlocked?'unlocked':''}"><div><span>${esc(x.name)}</span><small>${unlocked?'境界已达成':'尚未达到此境界'}</small></div><b>仙玉 ${x.jade}</b><button data-growth-claim="${x.id}" ${can?'':'disabled'}>${done?'已领取':can?'领取':'未解锁'}</button></div>`}).join('')}</div>`
}
function renderVip(w){
 const level=vipLevel(w.vipExp||0),next=VIP_THRESHOLDS[level+1],gift=VIP_DAILY[level]||0,canGift=level>0&&w.vipClaimDate!==today();
 const progress=next?Math.min(100,(w.vipExp-VIP_THRESHOLDS[level])/(next-VIP_THRESHOLDS[level])*100):100;
 return `<div class="ui-vip-card"><span>当前等级</span><h3>VIP ${level}</h3><p>累计模拟充值 ¥${Number(w.totalCny||0).toFixed(0)} · VIP经验 ${Math.floor(w.vipExp||0)}${next?` / ${next}`:' · 已达当前上限'}</p><div class="ui-vip-progress"><i style="width:${progress}%"></i></div></div><div class="ui-daily-claim"><div><span>VIP每日仙玉礼</span><b>${level?gift+' 仙玉':'VIP1 开始解锁'}</b></div><button data-vip-claim ${canGift?'':'disabled'}>${w.vipClaimDate===today()?'今日已领':level?'领取':'未解锁'}</button></div><div class="ui-vip-levels">${VIP_THRESHOLDS.slice(1).map((t,i)=>`<div class="${level>=i+1?'active':''}"><b>VIP ${i+1}</b><span>${t}经验</span><small>每日仙玉 ${VIP_DAILY[i+1]}</small></div>`).join('')}</div><button class="ui-reset-premium" data-premium-reset>重置本机付费测试数据</button>`
}
function receiptHtml(w){if(!w.receipts?.length)return '';return `<div class="ui-receipts"><h4>最近测试记录</h4>${w.receipts.slice(0,5).map(r=>`<div><span>${esc(r.label)}</span><small>${new Date(r.at).toLocaleString()}</small></div>`).join('')}</div>`}
function renderShop(){
 const overlay=ensureOverlay(),w=load();$('uiShopWallet').innerHTML=walletHeader(w);
 overlay.querySelectorAll('[data-shop-tab]').forEach(b=>b.classList.toggle('active',b.dataset.shopTab===activeTab));
 const content=$('uiShopContent');content.innerHTML=activeTab==='jade'?renderJade(w):activeTab==='monthly'?renderMonthly(w):activeTab==='growth'?renderGrowth(w):renderVip(w);
 bindShopActions(w);updateCurrency(w)
}
function simulateRecharge(id){
 const x=RECHARGE.find(r=>r.id===id);if(!x)return;const w=load(),first=!w.firstBonusUsed[id],gain=x.base+x.bonus+(first?x.base:0);
 w.jade+=gain;w.vipExp+=x.price*10;w.totalCny+=x.price;w.firstBonusUsed[id]=true;addReceipt(w,'recharge',`仙玉充值 ¥${x.price}`,gain);save(w);renderShop();toast(`仙玉 +${gain} · VIP经验 +${x.price*10}`)
}
function buyMonthly(){
 const w=load(),base=Math.max(Date.now(),Number(w.monthlyUntil)||0);w.monthlyUntil=base+30*86400000;w.jade+=300;w.vipExp+=300;w.totalCny+=30;addReceipt(w,'monthly','玄玉月契 ¥30',300);save(w);renderShop();toast('月卡已延长30天 · 仙玉 +300')
}
function claimMonthly(){const w=load();if(monthlyDays(w)<=0||w.monthlyClaimDate===today())return;w.monthlyClaimDate=today();w.jade+=100;addReceipt(w,'claim','月卡每日领取',100);save(w);renderShop();toast('月卡仙玉 +100')}
function buyGrowth(){const w=load();if(w.growthOwned)return;w.growthOwned=true;w.jade+=680;w.vipExp+=680;w.totalCny+=68;addReceipt(w,'growth','问道成长令 ¥68',680);save(w);renderShop();toast('成长令已激活 · 仙玉 +680')}
function claimGrowth(id){const row=GROWTH.find(x=>x.id===id),w=load();if(!row||!w.growthOwned||realmIndex()<row.realm||(w.growthClaimed||[]).includes(id))return;w.growthClaimed.push(id);w.jade+=row.jade;addReceipt(w,'growth-claim',row.name,row.jade);save(w);renderShop();toast(`${row.name} · 仙玉 +${row.jade}`)}
function claimVip(){const w=load(),level=vipLevel(w.vipExp||0),gift=VIP_DAILY[level]||0;if(!gift||w.vipClaimDate===today())return;w.vipClaimDate=today();w.jade+=gift;addReceipt(w,'vip-claim',`VIP${level}每日礼`,gift);save(w);renderShop();toast(`VIP每日仙玉 +${gift}`)}
function resetPremium(){if(!window.confirm('只会清除本机模拟充值、仙玉、VIP、月卡和成长令数据，不会删除游戏存档。确认重置？'))return;localStorage.removeItem(KEY);renderShop();toast('付费测试数据已重置')}
function bindShopActions(){
 document.querySelectorAll('[data-recharge]').forEach(b=>b.onclick=()=>simulateRecharge(b.dataset.recharge));
 document.querySelector('[data-monthly-buy]')?.addEventListener('click',buyMonthly);
 document.querySelector('[data-monthly-claim]')?.addEventListener('click',claimMonthly);
 document.querySelector('[data-growth-buy]')?.addEventListener('click',buyGrowth);
 document.querySelectorAll('[data-growth-claim]').forEach(b=>b.onclick=()=>claimGrowth(b.dataset.growthClaim));
 document.querySelector('[data-vip-claim]')?.addEventListener('click',claimVip);
 document.querySelector('[data-premium-reset]')?.addEventListener('click',resetPremium)
}
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('uiShopOverlay')?.classList.contains('hidden'))closeShop()});
window.addEventListener('DOMContentLoaded',()=>{ensureOverlay();updateCurrency();let n=0;const t=setInterval(()=>{n++;updateCurrency();if(document.querySelector('.ui-currency')||n>60)clearInterval(t)},100)});
window.__TAIXUAN_SHOP__={open:openShop,close:closeShop,getWallet:()=>JSON.parse(JSON.stringify(load())),reset:()=>{localStorage.removeItem(KEY);updateCurrency()}};
})();