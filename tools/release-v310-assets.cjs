const fs=require('fs');
function must(text,search,replacement,label){if(!text.includes(search))throw new Error('V3.10 release transform did not match: '+label);if(text.indexOf(search)!==text.lastIndexOf(search))throw new Error('V3.10 release transform ambiguous: '+label);return text.replace(search,replacement)}
const app=`// 太玄界 V3.10 无充值全流程总平衡正式加载器 · build 31001
(()=>{
  const fail=(e)=>{console.error(e);document.body.innerHTML='<div style="max-width:680px;margin:40px auto;padding:20px;color:#fff;background:#171a16;border:1px solid #485042;border-radius:14px;font-family:system-ui;line-height:1.7"><h2>太玄界加载失败</h2><div>'+String(e)+'</div><p>请刷新页面；若仍失败，请把这段错误发给我。</p></div>'};
  try{window.__TAIXUAN_BUILD__={engineeringVersion:'3.10.0',gameplayVersion:'3.10.0',build:'31001',milestone:'no-recharge-full-run-balance',source:'src/game-v310.js',legacyPatchChain:false};document.title='太玄界 · 修仙大世界 V3.10';const script=document.createElement('script');script.src='./src/game-v310.js?v=31001';script.async=false;script.onload=()=>{if(!window.__TAIXUAN_TEST__)fail(new Error('V3.10 直接源码运行时未完成初始化'))};script.onerror=()=>fail(new Error('V3.10 游戏核心加载失败：src/game-v310.js'));document.head.appendChild(script)}catch(e){fail(e)}})();
`;
fs.writeFileSync('app.js',app,'utf8');
let index=fs.readFileSync('index.html','utf8');
index=must(index,'<title>太玄界 · 修仙大世界 V3.9</title>','<title>太玄界 · 修仙大世界 V3.10</title>','title');
index=must(index,'修仙大世界 · V3.9</p>','修仙大世界 · V3.10</p>','start version');
index=must(index,'<div id="installStatus" class="install-note"></div><div class="version">V3.9 · 渡劫飞升与真仙终局篇</div>','<div id="installStatus" class="install-note"></div><div class="version">V3.10 · 无充值全流程总平衡篇</div>','version badge');
index=must(index,'<p class="section-tip">V3.9 正式进入人界终局：大乘圆满后不能再靠普通突破直达下一境，必须把 V3.8 的肉身、元神、法则、本命法宝与阵法五维准备真正带入六重雷劫，随后面对心魔劫与三段仙凡蜕变。失败会造成重伤、寿元巨损、本命法宝受损，后段劫难甚至可能直接身死；只有完成全部终局阶段，飞升天门才会开启并生成真仙通关档案。</p>','<p class="section-tip">V3.10 完成人界到真仙的无充值全流程总平衡收口：四大道途都必须依靠正常修炼、战斗、采集、坊市与稀缺拍卖等游戏内来源推进；关键高阶资源保留稀缺性，同时补齐必要的合法恢复来源，修炼耗时随高境界明显增长，寿元、失败与死亡仍然有效。此版本不包含模拟充值、VIP 或付费直达真仙机制。</p>','home release note');
index=must(index,'<script src="./app.js?v=3901"></script>','<script src="./app.js?v=31001"></script>','app cache bust');
fs.writeFileSync('index.html',index,'utf8');
const sw=`const CACHE='taixuan-v3.10.0-no-recharge-full-run-balance-31001';
const CORE=['./','./index.html?v=31001','./style.css','./app.js?v=31001','./src/game-v310.js?v=31001','./manifest-v6.webmanifest?v=6','./icon-v6-192.png?v=6','./icon-v6-512.png?v=6'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return res}).catch(()=>caches.match('./index.html?v=31001'))));});
`;
fs.writeFileSync('sw.js',sw,'utf8');
console.log('V310_RELEASE_ASSETS_PASS');
