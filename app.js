(async()=>{
  try{
    const files=Array.from({length:24},(_,i)=>`./bundle2/c${String(i+1).padStart(2,'0')}.b64`);
    let b64='';
    for(const f of files){
      b64+=await fetch(f,{cache:'no-cache'}).then(r=>{
        if(!r.ok) throw new Error('加载失败 '+f);
        return r.text();
      });
    }
    const bin=atob(b64);
    const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
    const src=new TextDecoder('utf-8').decode(bytes);
    (0,eval)(src);
  }catch(e){
    console.error(e);
    document.body.innerHTML='<div style="padding:20px;color:#fff;background:#111">游戏核心加载失败：'+String(e)+'</div>';
  }
})();
