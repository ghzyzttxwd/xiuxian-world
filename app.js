(async()=>{
  try{
    const files=Array.from({length:24},(_,i)=>`./bundle2/c${String(i+1).padStart(2,'0')}.b64`);
    let b64='';
    for(const f of files){
      const r=await fetch(f,{cache:'no-cache'});
      if(!r.ok) throw new Error(`游戏核心加载失败：${f} (${r.status})`);
      b64+=(await r.text()).trim();
    }
    const bin=atob(b64);
    const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
    const src=new TextDecoder('utf-8').decode(bytes);
    (0,eval)(src);
  }catch(e){
    console.error(e);
    document.body.innerHTML='<div style="max-width:680px;margin:40px auto;padding:20px;color:#fff;background:#171a16;border:1px solid #485042;border-radius:14px;font-family:system-ui;line-height:1.7"><h2>太玄界加载失败</h2><div>'+String(e)+'</div><p>请刷新页面；若仍失败，请把这段错误发给我。</p></div>';
  }
})();