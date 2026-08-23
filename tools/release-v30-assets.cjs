const fs=require('fs');
function must(text,search,replacement,label){if(!text.includes(search))throw new Error('V3.0 release transform did not match: '+label);return text.replace(search,replacement)}

const app=`// 太玄界 V3.0 成长数据底座正式加载器 · build 3001
(()=>{
  const fail=(e)=>{console.error(e);document.body.innerHTML='<div style="max-width:680px;margin:40px auto;padding:20px;color:#fff;background:#171a16;border:1px solid #485042;border-radius:14px;font-family:system-ui;line-height:1.7"><h2>太玄界加载失败</h2><div>'+String(e)+'</div><p>请刷新页面；若仍失败，请把这段错误发给我。</p></div>'};
  try{window.__TAIXUAN_BUILD__={engineeringVersion:'3.0.0',gameplayVersion:'3.0.0',build:'3001',milestone:'growth-data-foundation',source:'src/game-v30.js',legacyPatchChain:false};document.title='太玄界 · 修仙大世界 V3.0';const script=document.createElement('script');script.src='./src/game-v30.js?v=3001';script.async=false;script.onload=()=>{if(!window.__TAIXUAN_TEST__)fail(new Error('V3.0 直接源码运行时未完成初始化'))};script.onerror=()=>fail(new Error('V3.0 游戏核心加载失败：src/game-v30.js'));document.head.appendChild(script)}catch(e){fail(e)}})();
`;
fs.writeFileSync('app.js',app,'utf8');

let index=fs.readFileSync('index.html','utf8');
index=must(index,'<title>太玄界 · 修仙大世界 V2.9</title>','<title>太玄界 · 修仙大世界 V3.0</title>','title');
index=must(index,'修仙大世界 · V2.9</p>','修仙大世界 · V3.0</p>','start version');
index=must(index,'<div id="installStatus" class="install-note"></div><div class="version">V2.9 · 前尘旧缘</div>','<div id="installStatus" class="install-note"></div><div class="version">V3.0 · 成长数据底座</div>','version badge');
index=must(index,'<p class="section-tip">V2.8 的 NPC 人生后果继续保留。V2.9 把轮回与故人真正接起来：上一世的深交会留下旧缘记录，但人情债和未完成求援不会错误跨世继承；新一世第一次重逢只会得到小额熟悉感与一次性旧缘机缘。</p>','<p class="section-tip">V3.0 完成玩家成长数据底座：旧玩法与前尘旧缘完整保留，功法、法术、装备、材料、敌人和掉落已建立稳定 ID 与统一注册表，为后续大规模内容扩容、冷却状态与法宝能力系统提供底层结构。</p>','home release note');
index=must(index,'<script src="./app.js?v=2901"></script>','<script src="./app.js?v=3001"></script>','app cache bust');
fs.writeFileSync('index.html',index,'utf8');

const sw=`const CACHE='taixuan-v3.0.0-growth-data-foundation-3001';
const CORE=['./','./index.html?v=3001','./style.css','./app.js?v=3001','./src/game-v30.js?v=3001','./manifest-v6.webmanifest?v=6','./icon-v6-192.png?v=6','./icon-v6-512.png?v=6'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return res}).catch(()=>caches.match('./index.html?v=3001'))));});
`;
fs.writeFileSync('sw.js',sw,'utf8');
console.log('V30_RELEASE_ASSETS_PASS');
