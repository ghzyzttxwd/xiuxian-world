/* TAIXUAN_SHOP_V2_VIP8_M2 */
(()=>{
'use strict';
const KEY='taixuan-premium-wallet-v1',VERSION='m2-1',VIP8_EXP=8000;
const BASE_REWARD={jade:1888,stones:1888,rare:88,relic:18,heal:true,fullProgress:true,title:'八荒至尊'};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const pathName=p=>({sword:'剑道',flame:'火道',body:'炼体',spirit:'神道',none:'通用'}[p]||'通用');
const slotName=s=>({assault:'攻伐',guard:'护身',support:'辅助',natal:'本命'}[s]||s);
function power(){return window.__TAIXUAN_POWER_SHOP__||null}
function api(){return window.__TAIXUAN_TEST__||null}
function game(){try{return api()?.getState?.()||null}catch{return null}}
function wallet(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}}
function normalizeWallet(w){w.version=2;w.jade=Number(w.jade)||0;w.vipExp=Number(w.vipExp)||0;w.totalCny=Number(w.totalCny)||0;if(!Array.isArray(w.vipMilestoneClaimed))w.vipMilestoneClaimed=[];if(!Array.isArray(w.titles))w.titles=[];if(!Array.isArray(w.receipts))w.receipts=[];return w}
function saveWallet(w){localStorage.setItem(KEY,JSON.stringify(normalizeWallet(w)))}
function vipLevel(w=wallet()){const exp=Number(w.vipExp)||0;const t=[0,60,300,680,1280,2000,3280,5000,8000,10000,12800,16000,22000,30000,45000,65000];let v=0;for(let i=0;i<t.length;i++)if(exp>=t[i])v=i;return Math.min(v,15)}
function addReceipt(w,label){w.receipts.unshift({at:Date.now(),label});w.receipts=w.receipts.slice(0,16)}
function toast(text,bad=false){const e=document.getElementById('uiShopToast');if(!e)return;e.textContent=text;e.classList.remove('hidden');e.classList.toggle('bad',!!bad);clearTimeout(toast.t);toast.t=setTimeout(()=>{e.classList.add('hidden');e.classList.remove('bad')},2800)}
function persistGame(){document.getElementById('saveBtn')?.click();setTimeout(()=>document.querySelector('[data-close-modal]')?.click(),10);setTimeout(()=>document.querySelector('.nav-btn.active')?.click(),40)}
function grantBaseGameRewards(){const a=api(),s=game();if(!a||!s?.player)return false;const p=s.player;try{a.v35SetPlayerForTest?.({stones:(Number(p.spiritStones)||0)+BASE_REWARD.stones});a.v33AddMaterial?.('mat-rare-material',BASE_REWARD.rare);a.v33AddMaterial?.('mat-relic-fragment',BASE_REWARD.relic);if(BASE_REWARD.heal)a.v39SetPlayerForTest?.({injury:0});if(BASE_REWARD.fullProgress)a.v39SetPlayerForTest?.({progressFull:true});persistGame();return true}catch(e){console.error('VIP8 base reward failed',e);return false}}
function preview(itemId=null){try{return power()?.previewVip8Artifact?.(itemId)||{ok:false,reason:'power_adapter_not_ready'}}catch(e){return{ok:false,reason:e.message}}}
function previewText(p=preview()){if(!p?.ok)return '八荒至尊法宝匣 · 当前法宝尚未完成匹配';return `八荒至尊法宝匣 · 极品【${p.name}】 · ${pathName(p.path)}${slotName(p.slot)}法宝 · 自动认主 · 祭炼3层 · 温养30`}
function plannedItem(w){const saved=w.vip8PendingArtifactId;if(saved)return preview(saved);const p=preview();if(p.ok){w.vip8PendingArtifactId=p.itemId;saveWallet(w)}return p}
function rewardRecord(a){return {itemId:a.itemId,artifactId:a.artifactId,name:a.name,path:a.path,slot:a.slot,tier:a.tier,grade:a.record?.grade||'perfect',refinement:a.record?.refinement||0,warmth:a.record?.warmth||0,bound:!!a.record?.bound,claimedAt:Date.now()}}
function refreshVip(){if(window.__TAIXUAN_SHOP__?.open){window.__TAIXUAN_SHOP__.open('vip');setTimeout(decorate,0)}else setTimeout(decorate,0)}
function claimFull(){
 let w=normalizeWallet(wallet());if(vipLevel(w)<8)return {ok:false,reason:'vip_locked'};if(w.vipMilestoneClaimed.includes(8))return w.vip8ArtifactReward?{ok:false,reason:'already_claimed'}:claimArtifactOnly();
 const plan=plannedItem(w);if(!plan.ok){toast('八荒至尊法宝匹配失败，奖励未标记领取',true);return plan}
 const a=power()?.grantVip8Artifact?.(plan.itemId);if(!a?.ok){toast('法宝发放失败，VIP8奖励未标记领取',true);return a||{ok:false,reason:'artifact_grant_failed'}}
 if(!grantBaseGameRewards()){toast('基础奖励写入失败，VIP8尚未标记领取',true);return {ok:false,reason:'base_reward_failed',artifact:a}}
 w=normalizeWallet(wallet());if(!w.vipMilestoneClaimed.includes(8))w.vipMilestoneClaimed.push(8);w.jade+=BASE_REWARD.jade;if(!w.titles.includes(BASE_REWARD.title))w.titles.push(BASE_REWARD.title);w.vip8ArtifactReward=rewardRecord(a);delete w.vip8PendingArtifactId;addReceipt(w,`VIP8 八荒至尊 · ${a.name}`);saveWallet(w);refreshVip();toast(`八荒至尊降临 · 极品【${a.name}】已认主`);return {ok:true,artifact:a,wallet:w}
}
function claimArtifactOnly(){
 let w=normalizeWallet(wallet());if(vipLevel(w)<8||!w.vipMilestoneClaimed.includes(8))return {ok:false,reason:'not_legacy_vip8'};if(w.vip8ArtifactReward)return {ok:false,reason:'already_has_artifact'};
 const plan=plannedItem(w);if(!plan.ok){toast('补领法宝匹配失败',true);return plan}
 const a=power()?.grantVip8Artifact?.(plan.itemId);if(!a?.ok){toast('补领法宝失败',true);return a||{ok:false,reason:'artifact_grant_failed'}}
 w=normalizeWallet(wallet());w.vip8ArtifactReward=rewardRecord(a);delete w.vip8PendingArtifactId;addReceipt(w,`VIP8旧档补领 · ${a.name}`);saveWallet(w);refreshVip();toast(`旧VIP8已补发极品【${a.name}】`);return {ok:true,artifact:a,wallet:w,retroactive:true}
}
function decorate(){
 const host=document.getElementById('uiShopContent'),p=preview(),w=normalizeWallet(wallet()),lv=vipLevel(w);if(!host)return;
 const btn=host.querySelector('[data-vip-milestone="8"]'),row=btn?.closest('.ui-vip-level');
 if(row&&p.ok){const small=row.querySelector('small');if(small&&!small.dataset.vip8Power){const old=small.textContent;small.textContent=`${previewText(p)} · ${old}`;small.dataset.vip8Power='1'}row.classList.add('vip8-power-node')}
 const oldPreview=host.querySelector('#uiVip8ArtifactPreview');if(oldPreview)oldPreview.remove();
 if(lv===7&&p.ok){const card=host.querySelector('.ui-vip-card'),hero=document.createElement('div');hero.id='uiVip8ArtifactPreview';hero.className='ui-premium-hero';hero.innerHTML=`<span>VIP8 · 八荒至尊预览</span><h3>极品【${esc(p.name)}】</h3><p>${esc(pathName(p.path)+slotName(p.slot)+'法宝')} · 自动认主 · 祭炼3层 · 温养30。再往前一步，这件真正进入战斗公式的法宝就是你的。</p>`;card?.insertAdjacentElement('afterend',hero)}
 if(lv>=8&&w.vipMilestoneClaimed.includes(8)&&!w.vip8ArtifactReward&&row&&!row.querySelector('[data-vip8-retro]')){const b=document.createElement('button');b.dataset.vip8Retro='1';b.textContent='补领八荒至尊法宝';b.className='primary';row.appendChild(b)}
 if(w.vip8ArtifactReward&&row){let mark=row.querySelector('.vip8-owned-mark');if(!mark){mark=document.createElement('small');mark.className='vip8-owned-mark';row.appendChild(mark)}mark.textContent=`已获极品【${w.vip8ArtifactReward.name}】 · 祭炼${w.vip8ArtifactReward.refinement} · 温养${w.vip8ArtifactReward.warmth}`}
}
document.addEventListener('click',e=>{const t=e.target instanceof Element?e.target:null;if(!t)return;const normal=t.closest('[data-vip-milestone="8"]');if(normal&&!normal.disabled){e.preventDefault();e.stopImmediatePropagation();claimFull();return}const retro=t.closest('[data-vip8-retro]');if(retro){e.preventDefault();e.stopImmediatePropagation();claimArtifactOnly()}},true);
window.addEventListener('DOMContentLoaded',()=>{const mo=new MutationObserver(()=>decorate());mo.observe(document.body,{childList:true,subtree:true});let n=0,t=setInterval(()=>{n++;decorate();if((power()&&game())||n>100)clearInterval(t)},100)});
window.__TAIXUAN_VIP8__={version:VERSION,preview,previewText,claimFull,claimArtifactOnly,decorate,getReward:()=>normalizeWallet(wallet()).vip8ArtifactReward||null};
})();