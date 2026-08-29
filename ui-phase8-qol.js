/* TAIXUAN_PHASE8_QOL_V2 */
(()=>{
'use strict';
const $=s=>document.querySelector(s);
const api=()=>window.__TAIXUAN_TEST__;
function modalOpen(){const w=document.getElementById('modalWrap');return !!w&&!w.classList.contains('hidden')}
function realmNeed(a,s){try{return a.realmBalance?.()[Number(s?.player?.realmIndex)||0]?.need??Infinity}catch{return Infinity}}
function batchDaysFor(s){return (Number(s?.player?.realmIndex)||0)>=4?30:7}
function defaultNote(days){return `最多${days}日 · 遇到关键情况自动停`}
function updateButton(btn){if(!btn)return;const a=api();let s=null;try{s=a?.getState?.()}catch{}const days=batchDaysFor(s);btn.dataset.days=String(days);const b=btn.querySelector('b'),small=btn.querySelector('small');if(b)b.textContent=days>=30?'闭关一月':'闭关七日';if(small&&!btn.__noteTimer)small.textContent=defaultNote(days)}
function setNote(btn,text){const small=btn?.querySelector('small');if(!small)return;small.textContent=text;clearTimeout(btn.__noteTimer);btn.__noteTimer=setTimeout(()=>{btn.__noteTimer=null;updateButton(btn)},2600)}
function batchCultivate(btn,forcedDays=null){
 const a=api();if(!a?.getState||!a?.action){setNote(btn,'游戏核心尚未就绪');return}
 let initial=null;try{initial=a.getState()}catch{}
 const maxDays=Math.max(1,Math.floor(forcedDays||Number(btn?.dataset?.days)||batchDaysFor(initial)));
 let done=0,reason=maxDays>=30?'一月闭关完成':'七日闭关完成';if(btn)btn.disabled=true;
 try{
  for(let i=0;i<maxDays;i++){
   let s=a.getState();if(!s){reason='存档未就绪';break}
   if(s.flags?.dead){reason='本世已终';break}
   if(a.getCombat?.()){reason='遭遇战斗，闭关中止';break}
   if(modalOpen()){reason='出现需要处理的事件';break}
   const need=realmNeed(a,s);if(Number(s.player.progress)>=need){reason='修为已满，请先破境';break}
   a.action('cultivate');done++;
   s=a.getState();
   if(s?.flags?.dead){reason='寿元或意外导致本世终结';break}
   if(a.getCombat?.()){reason='修炼途中遭遇战斗';break}
   if(modalOpen()){reason='修炼途中出现事件';break}
   if(Number(s?.player?.progress)>=realmNeed(a,s)){reason='修为已满，可以尝试破境';break}
  }
 }catch(e){console.error(e);reason='闭关被异常打断'}finally{if(btn)btn.disabled=false}
 setNote(btn,`${done}日 · ${reason}`);updateButton(btn)
}
function mount(){
 const panel=$('#page-home .action-panel');if(!panel)return false;let btn=document.getElementById('phase8BatchCultivate');
 if(!btn){const title=panel.querySelector('.panel-title-row');if(!title)return false;btn=document.createElement('button');btn.type='button';btn.id='phase8BatchCultivate';btn.className='ui-batch-cultivate';btn.innerHTML='<b>闭关七日</b><small>最多7日 · 遇到关键情况自动停</small>';btn.addEventListener('click',()=>batchCultivate(btn));title.appendChild(btn)}
 updateButton(btn);return true
}
function init(){let tries=0;const t=setInterval(()=>{tries++;const ok=mount();if(ok&&api()){const btn=document.getElementById('phase8BatchCultivate');updateButton(btn)}if(tries>100)clearInterval(t)},100);setInterval(()=>updateButton(document.getElementById('phase8BatchCultivate')),700)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.__TAIXUAN_PHASE8__={batchCultivate:(days=null)=>batchCultivate(document.getElementById('phase8BatchCultivate'),days),batchDaysFor:()=>{try{return batchDaysFor(api()?.getState?.())}catch{return 7}},mount};
})();
