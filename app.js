// 太玄界 V0.9 正式加载器 · 主动破境 0901
(async()=>{
  try{
    const loadPatch=async(path,globalName,label)=>{
      const r=await fetch(path,{cache:'no-cache'});
      if(!r.ok) throw new Error(`${label}加载失败 (${r.status})`);
      (0,eval)(await r.text());
      if(typeof window[globalName]!=='function') throw new Error(`${label}函数不存在`);
    };
    await loadPatch('./v03-patch.js?v=0301','__TAIXUAN_PATCH_V03__','V0.3补丁');
    await loadPatch('./v04-patch.js?v=0401','__TAIXUAN_PATCH_V04__','V0.4补丁');
    await loadPatch('./v05-patch.js?v=0501','__TAIXUAN_PATCH_V05__','V0.5补丁');
    await loadPatch('./v06-patch.js?v=0601','__TAIXUAN_PATCH_V06__','V0.6补丁');
    await loadPatch('./v07-patch.js?v=0701','__TAIXUAN_PATCH_V07__','V0.7补丁');
    await loadPatch('./v08-patch.js?v=0801','__TAIXUAN_PATCH_V08__','V0.8补丁');
    await loadPatch('./v09-patch.js?v=0901','__TAIXUAN_PATCH_V09__','V0.9补丁');
    const files=Array.from({length:24},(_,i)=>`./bundle2/c${String(i+1).padStart(2,'0')}.b64`);
    let b64='';
    for(const f of files){const r=await fetch(f,{cache:'no-cache'});if(!r.ok)throw new Error(`游戏核心加载失败：${f} (${r.status})`);b64+=(await r.text()).trim()}
    const bin=atob(b64),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
    let src=new TextDecoder('utf-8').decode(bytes);
    src=window.__TAIXUAN_PATCH_V03__(src);src=window.__TAIXUAN_PATCH_V04__(src);src=window.__TAIXUAN_PATCH_V05__(src);src=window.__TAIXUAN_PATCH_V06__(src);src=window.__TAIXUAN_PATCH_V07__(src);src=window.__TAIXUAN_PATCH_V08__(src);src=window.__TAIXUAN_PATCH_V09__(src);
    if(!src.includes("const VERSION='0.9.0'"))throw new Error('V0.9最终源码版本断言失败');
    if(!src.includes('attemptBreakthrough')||!src.includes('breakthroughPity')||!src.includes('renderBreakthrough'))throw new Error('V0.9破境模块断言失败');
    document.title='太玄界 · 修仙大世界 V0.9';
    const sub=document.querySelector('.start-box > p');if(sub)sub.textContent='修仙大世界 · V0.9';
    const ver=document.querySelector('.start-box .version');if(ver)ver.textContent='V0.9 · 主动破境闭环';
    window.__TAIXUAN_BUILD__={version:'0.9.0',milestone:'breakthrough-loop',patches:['0301','0401','0501','0601','0701','0801','0901']};
    (0,eval)(src);
  }catch(e){console.error(e);document.body.innerHTML='<div style="max-width:680px;margin:40px auto;padding:20px;color:#fff;background:#171a16;border:1px solid #485042;border-radius:14px;font-family:system-ui;line-height:1.7"><h2>太玄界加载失败</h2><div>'+String(e)+'</div><p>请刷新页面；若仍失败，请把这段错误发给我。</p></div>'}
})();
