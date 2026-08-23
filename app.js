// 太玄界 V1.5 世界扩张加载器 · build 1501
(()=>{
  const fail=(e)=>{
    console.error(e);
    document.body.innerHTML='<div style="max-width:680px;margin:40px auto;padding:20px;color:#fff;background:#171a16;border:1px solid #485042;border-radius:14px;font-family:system-ui;line-height:1.7"><h2>太玄界加载失败</h2><div>'+String(e)+'</div><p>请刷新页面；若仍失败，请把这段错误发给我。</p></div>';
  };
  try{
    window.__TAIXUAN_BUILD__={engineeringVersion:'1.5.0',gameplayVersion:'1.5.0',build:'1501',milestone:'regional-world-expansion',source:'src/game-v15.js',legacyPatchChain:false};
    document.title='太玄界 · 修仙大世界 V1.5';
    const script=document.createElement('script');
    script.src='./src/game-v15.js?v=1501';
    script.async=false;
    script.onload=()=>{if(!window.__TAIXUAN_TEST__)fail(new Error('V1.5 直接源码运行时未完成初始化'))};
    script.onerror=()=>fail(new Error('V1.5 游戏核心加载失败：src/game-v15.js'));
    document.head.appendChild(script);
  }catch(e){fail(e)}
})();
