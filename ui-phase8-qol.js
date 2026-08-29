/* TAIXUAN_PHASE8_QOL_V1 */
(()=>{
'use strict';
const $=s=>document.querySelector(s);
const api=()=>window.__TAIXUAN_TEST__;
function modalOpen(){const w=document.getElementById('modalWrap');return !!w&&!w.classList.contains('hidden')}
function realmNeed(a,s){try{return a.realmBalance?.()[Number(s?.player?.realmIndex)||0]?.need??Infinity}catch{return Infinity}}
function setNote(btn,text){const small=btn?.querySelector('small');if(!small)return;small.textContent=text;clearTimeout(btn.__noteTimer);btn.__noteTimer=setTimeout(()=>small.textContent='最多7日 · 遇到关键情况自动停',2200)}
function batchCultivate(btn){
 const a=api();if(!a?.getState||!a?.action){setNote(btn,'游戏核心尚未就绪');return}
 let done=0,reason='七日闭关完成';btn.disabled=true;
 try{
  for(let i=0;i<7;i++){
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
 }catch(e){console.error(e);reason='闭关被异常打断'}finally{btn.disabled=false}
 setNote(btn,`${done}日 · ${reason}`)
}
function mount(){
 const panel=$('#page-home .action-panel');if(!panel||document.getElementById('phase8BatchCultivate'))return false;
 const title=panel.querySelector('.panel-title-row');if(!title)return false;
 const btn=document.createElement('button');btn.type='button';btn.id='phase8BatchCultivate';btn.className='ui-batch-cultivate';btn.innerHTML='<b>闭关七日</b><small>最多7日 · 遇到关键情况自动停</small>';btn.addEventListener('click',()=>batchCultivate(btn));
 title.appendChild(btn);return true
}
function init(){let tries=0;const t=setInterval(()=>{tries++;if(mount()&&api()){clearInterval(t)}else if(tries>100)clearInterval(t)},100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.__TAIXUAN_PHASE8__={batchCultivate:()=>batchCultivate(document.getElementById('phase8BatchCultivate')),mount};
})();
