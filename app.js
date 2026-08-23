// V0.3 public verification trigger 20260823-1148
(async()=>{
  try{
    const patchRes=await fetch('./v03-patch.js?v=0301',{cache:'no-cache'});
    if(!patchRes.ok) throw new Error(`V0.3补丁加载失败 (${patchRes.status})`);
    (0,eval)(await patchRes.text());
    if(typeof window.__TAIXUAN_PATCH_V03__!=='function') throw new Error('V0.3补丁函数不存在');
    const files=Array.from({length:24},(_,i)=>`./bundle2/c${String(i+1).padStart(2,'0')}.b64`);
    let b64='';
    for(const f of files){const r=await fetch(f,{cache:'no-cache'});if(!r.ok)throw new Error(`游戏核心加载失败：${f} (${r.status})`);b64+=(await r.text()).trim()}
    const bin=atob(b64),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
    let src=new TextDecoder('utf-8').decode(bytes);
    src=window.__TAIXUAN_PATCH_V03__(src);
    if(!src.includes("const VERSION='0.3.0'")) throw new Error('V0.3最终源码版本断言失败');
    document.title='太玄界 · 修仙大世界 V0.3';
    const sub=document.querySelector('.start-box > p');if(sub)sub.textContent='修仙大世界 · V0.3';
    const ver=document.querySelector('.start-box .version');if(ver)ver.textContent='V0.3 · 战斗、伤势与真实风险';
    window.__TAIXUAN_BUILD__={version:'0.3.0',milestone:'combat-loop',patch:'0301'};
    (0,eval)(src);
  }catch(e){
    console.error(e);
    document.body.innerHTML='<div style="max-width:680px;margin:40px auto;padding:20px;color:#fff;background:#171a16;border:1px solid #485042;border-radius:14px;font-family:system-ui;line-height:1.7"><h2>太玄界加载失败</h2><div>'+String(e)+'</div><p>请刷新页面；若仍失败，请把这段错误发给我。</p></div>';
  }
})();
