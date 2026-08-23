// 太玄界 V0.4 正式加载器 · 宗门体系 0401
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

    const files=Array.from({length:24},(_,i)=>`./bundle2/c${String(i+1).padStart(2,'0')}.b64`);
    let b64='';
    for(const f of files){
      const r=await fetch(f,{cache:'no-cache'});
      if(!r.ok) throw new Error(`游戏核心加载失败：${f} (${r.status})`);
      b64+=(await r.text()).trim();
    }
    const bin=atob(b64),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
    let src=new TextDecoder('utf-8').decode(bytes);
    src=window.__TAIXUAN_PATCH_V03__(src);
    src=window.__TAIXUAN_PATCH_V04__(src);
    if(!src.includes("const VERSION='0.4.0'")) throw new Error('V0.4最终源码版本断言失败');
    if(!src.includes('renderSect')||!src.includes('sectContribution')) throw new Error('V0.4宗门模块断言失败');

    document.title='太玄界 · 修仙大世界 V0.4';
    const sub=document.querySelector('.start-box > p');if(sub)sub.textContent='修仙大世界 · V0.4';
    const ver=document.querySelector('.start-box .version');if(ver)ver.textContent='V0.4 · 宗门身份与任务体系';
    window.__TAIXUAN_BUILD__={version:'0.4.0',milestone:'sect-loop',patches:['0301','0401']};
    (0,eval)(src);
  }catch(e){
    console.error(e);
    document.body.innerHTML='<div style="max-width:680px;margin:40px auto;padding:20px;color:#fff;background:#171a16;border:1px solid #485042;border-radius:14px;font-family:system-ui;line-height:1.7"><h2>太玄界加载失败</h2><div>'+String(e)+'</div><p>请刷新页面；若仍失败，请把这段错误发给我。</p></div>';
  }
})();
