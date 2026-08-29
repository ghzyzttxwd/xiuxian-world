/* TAIXUAN_SHOP_V2_GAME_UI_SYNC */
(()=>{
'use strict';
function refresh(){document.querySelector('.nav-btn.active')?.click()}
document.addEventListener('click',e=>{if(!e.target.closest?.('[data-pack],[data-vip-milestone]'))return;setTimeout(refresh,0);setTimeout(refresh,80);setTimeout(refresh,180)},true);
})();
