// 太玄界 V3.9 渡劫飞升与真仙终局篇正式加载器 · build 3903
(()=>{
  const fail=(e)=>{console.error(e);document.body.innerHTML='<div style="max-width:680px;margin:40px auto;padding:20px;color:#fff;background:#171a16;border:1px solid #485042;border-radius:14px;font-family:system-ui;line-height:1.7"><h2>太玄界加载失败</h2><div>'+String(e)+'</div><p>请刷新页面；若仍失败，请把这段错误发给我。</p></div>'};
  try{
    window.__TAIXUAN_BUILD__={engineeringVersion:'3.9.0',gameplayVersion:'3.9.0',build:'3903',milestone:'tribulation-ascension-true-immortal-finale',source:'src/game-v39.js',legacyPatchChain:false,ui:'final-v1',shop:'v2-heavy-singleplayer',shopPower:'m1',shopVip8:'m2',shopVip12:'m3',shopVip15:'m4',shopDynamicPower:'m5'};
    document.title='太玄界 · 修仙大世界 V3.9';
    const shopStyle=document.createElement('link');shopStyle.rel='stylesheet';shopStyle.href='./ui-shop-v2.css?v=2';document.head.appendChild(shopStyle);
    const finalStyle=document.createElement('link');finalStyle.rel='stylesheet';finalStyle.href='./ui-final-v1.css?v=1';document.head.appendChild(finalStyle);
    const qolStyle=document.createElement('link');qolStyle.rel='stylesheet';qolStyle.href='./ui-phase8-qol.css?v=2';document.head.appendChild(qolStyle);
    const shopScript=document.createElement('script');shopScript.src='./ui-shop-v2.js?v=2';shopScript.async=false;document.head.appendChild(shopScript);
    const shopSync=document.createElement('script');shopSync.src='./ui-shop-v2-sync.js?v=1';shopSync.async=false;document.head.appendChild(shopSync);
    const shopPower=document.createElement('script');shopPower.src='./ui-shop-v2-power-adapter.js?v=m1-3';shopPower.async=false;document.head.appendChild(shopPower);
    const shopVip8=document.createElement('script');shopVip8.src='./ui-shop-v2-vip8.js?v=m2-1';shopVip8.async=false;document.head.appendChild(shopVip8);
    const shopVip12=document.createElement('script');shopVip12.src='./ui-shop-v2-vip12.js?v=m3-1';shopVip12.async=false;document.head.appendChild(shopVip12);
    const shopVip15=document.createElement('script');shopVip15.src='./ui-shop-v2-vip15.js?v=m4-1';shopVip15.async=false;document.head.appendChild(shopVip15);
    const shopDynamic=document.createElement('script');shopDynamic.src='./ui-shop-v2-dynamic-power.js?v=m5-1';shopDynamic.async=false;document.head.appendChild(shopDynamic);
    const finalScript=document.createElement('script');finalScript.src='./ui-final-v1.js?v=1';finalScript.async=false;document.head.appendChild(finalScript);
    const qolScript=document.createElement('script');qolScript.src='./ui-phase8-qol.js?v=4';qolScript.async=false;document.head.appendChild(qolScript);
    const script=document.createElement('script');script.src='./src/game-v39.js?v=3903';script.async=false;script.onload=()=>{if(!window.__TAIXUAN_TEST__)fail(new Error('V3.9 直接源码运行时未完成初始化'));if(!window.__TAIXUAN_POWER_SHOP__)fail(new Error('M1 战力商品发奖适配层未加载'));if(!window.__TAIXUAN_VIP8__)fail(new Error('M2 VIP8战力节点未加载'));if(!window.__TAIXUAN_VIP12__)fail(new Error('M3 VIP12大道传承节点未加载'));if(!window.__TAIXUAN_VIP15__)fail(new Error('M4 VIP15阶段权柄未加载'));if(!window.__TAIXUAN_DYNAMIC_POWER__)fail(new Error('M5动态战力礼包未加载'))};script.onerror=()=>fail(new Error('V3.9 游戏核心加载失败：src/game-v39.js'));document.head.appendChild(script)
  }catch(e){fail(e)}
})();