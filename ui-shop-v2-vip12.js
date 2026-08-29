/* TAIXUAN_SHOP_V2_VIP12_M3 */
(()=>{
'use strict';
const KEY='taixuan-premium-wallet-v1',VERSION='m3-1';
const BASE_REWARD={jade:1288,stones:1288,rare:48,relic:10,fullProgress:true,title:'太玄道君'};
const VIP_THRESHOLDS=[0,60,300,680,1280,2000,3280,5000,8000,10000,12800,16000,22000,30000,45000,65000];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const pathName=p=>({sword:'剑道',flame:'火道',body:'炼体',spirit:'神道',none:'未定'}[p]||p||'未定');
function power(){return window.__TAIXUAN_POWER_SHOP__||null}
function api(){return window.__TAIXUAN_TEST__||null}
function game(){try{return api()?.getState?.()||null}catch{return null}}
function wallet(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}}
function normalizeWallet(w){w.version=2;w.jade=Number(w.jade)||0;w.vipExp=Number(w.vipExp)||0;w.totalCny=Number(w.totalCny)||0;if(!Array.isArray(w.vipMilestoneClaimed))w.vipMilestoneClaimed=[];if(!Array.isArray(w.titles))w.titles=[];if(!Array.isArray(w.receipts))w.receipts=[];return w}
function saveWallet(w){localStorage.setItem(KEY,JSON.stringify(normalizeWallet(w)))}
function vipLevel(w=wallet()){let v=0,exp=Number(w.vipExp)||0;for(let i=0;i<VIP_THRESHOLDS.length;i++)if(exp>=VIP_THRESHOLDS[i])v=i;return Math.min(v,15)}
function addReceipt(w,label){w.receipts.unshift({at:Date.now(),label});w.receipts=w.receipts.slice(0,16)}
function toast(text,bad=false){const e=document.getElementById('uiShopToast');if(!e)return;e.textContent=text;e.classList.remove('hidden');e.classList.toggle('bad',!!bad);clearTimeout(toast.t);toast.t=setTimeout(()=>{e.classList.add('hidden');e.classList.remove('bad')},3000)}
function persistGame(){document.getElementById('saveBtn')?.click();setTimeout(()=>document.querySelector('[data-close-modal]')?.click(),10);setTimeout(()=>document.querySelector('.nav-btn.active')?.click(),40)}
function grantBaseGameRewards(){const a=api(),s=game();if(!a||!s?.player)return false;const p=s.player;try{a.v35SetPlayerForTest?.({stones:(Number(p.spiritStones)||0)+BASE_REWARD.stones});a.v33AddMaterial?.('mat-rare-material',BASE_REWARD.rare);a.v33AddMaterial?.('mat-relic-fragment',BASE_REWARD.relic);if(BASE_REWARD.fullProgress)a.v39SetPlayerForTest?.({progressFull:true});persistGame();return true}catch(e){console.error('VIP12 base reward failed',e);return false}}
function preview(){try{return power()?.previewVip12Build?.()||{ok:false,reason:'power_adapter_not_ready'}}catch(e){return{ok:false,reason:e.message}}}
function previewText(p=preview()){if(!p?.ok)return '太玄道君·大道传承 · 当前无法识别传承';if(p.pending)return '太玄道君·大道传承 · 道途确定后智能补齐：主修功法 + 三核心神通 + 被动秘术 + 同道极品法宝';return `太玄道君·${p.name} · ${pathName(p.path)} · 功法 + 三核心神通 + 被动秘术 + 同道极品法宝（祭炼5层 · 温养50）`}
function rewardRecord(b){return {id:b.id,name:b.name,path:b.path,role:b.role,score:b.score,mastered:!!b.mastered,manual:b.manual,skills:[...(b.skills||[])],passive:b.passive,artifact:{itemId:b.artifact?.itemId,name:b.artifact?.name,grade:b.artifact?.record?.grade||'perfect',refinement:b.artifact?.record?.refinement||0,warmth:b.artifact?.record?.warmth||0,bound:!!b.artifact?.record?.bound},claimedAt:Date.now()}}
function refreshVip(){if(window.__TAIXUAN_SHOP__?.open){window.__TAIXUAN_SHOP__.open('vip');setTimeout(decorate,0)}else setTimeout(decorate,0)}
function markPending(w){w.vip12BuildEntitlement={status:'pending',reason:'dao_path_not_chosen',claimedAt:Date.now()}}
function finalizeWallet(w,b=null,label='VIP12 太玄道君'){if(!w.vipMilestoneClaimed.includes(12))w.vipMilestoneClaimed.push(12);w.jade+=BASE_REWARD.jade;if(!w.titles.includes(BASE_REWARD.title))w.titles.push(BASE_REWARD.title);if(b){w.vip12BuildReward=rewardRecord(b);w.vip12BuildEntitlement={status:'redeemed',buildId:b.id,redeemedAt:Date.now()}}else markPending(w);addReceipt(w,b?`${label} · ${b.name}`:`${label} · 大道传承待兑现`);saveWallet(w)}
function claimFull(){
 let w=normalizeWallet(wallet());if(vipLevel(w)<12)return {ok:false,reason:'vip_locked'};if(w.vipMilestoneClaimed.includes(12))return w.vip12BuildReward?{ok:false,reason:'already_claimed'}:claimBuildOnly();
 const p=preview();if(!p.ok){toast('太玄道君传承识别失败，奖励未标记领取',true);return p}
 let b=null;if(!p.pending){b=power()?.completeBuild?.(p.id,{artifactRefinement:5,artifactWarmth:50});if(!b?.ok){toast('大道传承发放失败，VIP12奖励未标记领取',true);return b||{ok:false,reason:'build_grant_failed'}}}
 if(!grantBaseGameRewards()){toast('基础奖励写入失败，VIP12尚未标记领取',true);return {ok:false,reason:'base_reward_failed',build:b}}
 w=normalizeWallet(wallet());finalizeWallet(w,b);
 refreshVip();if(b)toast(`太玄道君传承已成 · 【${b.name}】完整运转`);else toast('太玄道君已达成 · 道途确定后可兑现大道传承');
 return {ok:true,pending:!b,build:b,wallet:w}
}
function claimBuildOnly(){
 let w=normalizeWallet(wallet());if(vipLevel(w)<12||!w.vipMilestoneClaimed.includes(12))return {ok:false,reason:'not_legacy_vip12'};if(w.vip12BuildReward)return {ok:false,reason:'already_has_build'};
 const p=preview();if(!p.ok){toast('大道传承识别失败',true);return p}if(p.pending){markPending(w);saveWallet(w);refreshVip();toast('先在游戏中确定主修道途，再回来兑现太玄道君传承');return {ok:false,pending:true,reason:'dao_path_not_chosen',wallet:w}}
 const b=power()?.completeBuild?.(p.id,{artifactRefinement:5,artifactWarmth:50});if(!b?.ok){toast('大道传承兑现失败',true);return b||{ok:false,reason:'build_grant_failed'}}
 w=normalizeWallet(wallet());w.vip12BuildReward=rewardRecord(b);w.vip12BuildEntitlement={status:'redeemed',buildId:b.id,redeemedAt:Date.now()};addReceipt(w,`VIP12大道传承兑现 · ${b.name}`);saveWallet(w);refreshVip();toast(`大道传承兑现 · 【${b.name}】完整成型`);return {ok:true,build:b,wallet:w,retroactive:true}
}
function decorate(){
 const host=document.getElementById('uiShopContent'),p=preview(),w=normalizeWallet(wallet()),lv=vipLevel(w);if(!host)return;
 const btn=host.querySelector('[data-vip-milestone="12"]'),row=btn?.closest('.ui-vip-level');
 if(row&&p.ok){const small=row.querySelector('small');if(small&&!small.dataset.vip12Power){small.textContent=`${previewText(p)} · ${small.textContent}`;small.dataset.vip12Power='1'}row.classList.add('vip12-power-node')}
 host.querySelector('#uiVip12BuildPreview')?.remove();
 if(lv===11&&p.ok){const card=host.querySelector('.ui-vip-card'),hero=document.createElement('div');hero.id='uiVip12BuildPreview';hero.className='ui-premium-hero';hero.innerHTML=p.pending?`<span>VIP12 · 太玄道君预览</span><h3>大道传承不会替你选路</h3><p>达到VIP12后先锁定权益。等你自己确定剑、火、体、神之一，再一次补齐功法、三核心神通、被动秘术和同道极品法宝。</p>`:`<span>VIP12 · 太玄道君预览</span><h3>【${esc(p.name)}】</h3><p>${esc(pathName(p.path))}完整Build：主修功法 + 三核心神通 + 被动秘术 + 极品同道法宝，法宝直接祭炼5层、温养50。</p>`;card?.insertAdjacentElement('afterend',hero)}
 if(lv>=12&&w.vipMilestoneClaimed.includes(12)&&!w.vip12BuildReward&&row&&!row.querySelector('[data-vip12-redeem]')){const b=document.createElement('button');b.dataset.vip12Redeem='1';b.textContent=p.pending?'道途确定后兑现大道传承':'兑现太玄道君大道传承';b.className='primary';row.appendChild(b)}
 if(w.vip12BuildReward&&row){let mark=row.querySelector('.vip12-owned-mark');if(!mark){mark=document.createElement('small');mark.className='vip12-owned-mark';row.appendChild(mark)}const r=w.vip12BuildReward;mark.textContent=`已成型【${r.name}】 · 极品【${r.artifact?.name||'同道法宝'}】 · 祭炼${r.artifact?.refinement||0} · 温养${r.artifact?.warmth||0}`}
}
document.addEventListener('click',e=>{const t=e.target instanceof Element?e.target:null;if(!t)return;const normal=t.closest('[data-vip-milestone="12"]');if(normal&&!normal.disabled){e.preventDefault();e.stopImmediatePropagation();claimFull();return}const redeem=t.closest('[data-vip12-redeem]');if(redeem){e.preventDefault();e.stopImmediatePropagation();claimBuildOnly()}},true);
window.addEventListener('DOMContentLoaded',()=>{const mo=new MutationObserver(()=>decorate());mo.observe(document.body,{childList:true,subtree:true});let n=0,t=setInterval(()=>{n++;decorate();if((power()&&game())||n>100)clearInterval(t)},100)});
window.__TAIXUAN_VIP12__={version:VERSION,preview,previewText,claimFull,claimBuildOnly,decorate,getReward:()=>normalizeWallet(wallet()).vip12BuildReward||null,getEntitlement:()=>normalizeWallet(wallet()).vip12BuildEntitlement||null};
})();