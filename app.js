// 太玄界 V3.9 渡劫飞升与真仙终局篇正式加载器 · build 3903
(()=>{
  const fail=(e)=>{console.error(e);document.body.innerHTML='<div style="max-width:680px;margin:40px auto;padding:20px;color:#fff;background:#171a16;border:1px solid #485042;border-radius:14px;font-family:system-ui;line-height:1.7"><h2>太玄界加载失败</h2><div>'+String(e)+'</div><p>请刷新页面；若仍失败，请把这段错误发给我。</p></div>'};
  try{
    window.__TAIXUAN_BUILD__={engineeringVersion:'3.9.0',gameplayVersion:'3.9.0',build:'3903',milestone:'tribulation-ascension-true-immortal-finale',source:'src/game-v39.js',legacyPatchChain:false,ui:'final-v1',shop:'v2-heavy-singleplayer'};
    document.title='太玄界 · 修仙大世界 V3.9';
    const shopStyle=document.createElement('link');shopStyle.rel='stylesheet';shopStyle.href='./ui-shop-v2.css?v=2';document.head.appendChild(shopStyle);
    const finalStyle=document.createElement('link');finalStyle.rel='stylesheet';finalStyle.href='./ui-final-v1.css?v=1';document.head.appendChild(finalStyle);
    const qolStyle=document.createElement('link');qolStyle.rel='stylesheet';qolStyle.href='./ui-phase8-qol.css?v=2';document.head.appendChild(qolStyle);
    const shopScript=document.createElement('script');shopScript.src='./ui-shop-v2.js?v=2';shopScript.async=false;document.head.appendChild(shopScript);
    const finalScript=document.createElement('script');finalScript.src='./ui-final-v1.js?v=1';finalScript.async=false;document.head.appendChild(finalScript);
    const qolScript=document.createElement('script');qolScript.src='./ui-phase8-qol.js?v=4';qolScript.async=false;document.head.appendChild(qolScript);
    const script=document.createElement('script');script.src='./src/game-v39.js?v=3903';script.async=false;script.onload=()=>{if(!window.__TAIXUAN_TEST__)fail(new Error('V3.9 直接源码运行时未完成初始化'))};script.onerror=()=>fail(new Error('V3.9 游戏核心加载失败：src/game-v39.js'));document.head.appendChild(script)
  }catch(e){fail(e)}
})();