const fs=require('fs');
function must(text,search,replacement,label){if(!text.includes(search))throw new Error('V3.1 release transform did not match: '+label);return text.replace(search,replacement)}

const app=`// 太玄界 V3.1 功法术法大扩容正式加载器 · build 3101
(()=>{
  const fail=(e)=>{console.error(e);document.body.innerHTML='<div style="max-width:680px;margin:40px auto;padding:20px;color:#fff;background:#171a16;border:1px solid #485042;border-radius:14px;font-family:system-ui;line-height:1.7"><h2>太玄界加载失败</h2><div>'+String(e)+'</div><p>请刷新页面；若仍失败，请把这段错误发给我。</p></div>'};
  try{window.__TAIXUAN_BUILD__={engineeringVersion:'3.1.0',gameplayVersion:'3.1.0',build:'3101',milestone:'manual-spell-expansion',source:'src/game-v31.js',legacyPatchChain:false};document.title='太玄界 · 修仙大世界 V3.1';const script=document.createElement('script');script.src='./src/game-v31.js?v=3101';script.async=false;script.onload=()=>{if(!window.__TAIXUAN_TEST__)fail(new Error('V3.1 直接源码运行时未完成初始化'))};script.onerror=()=>fail(new Error('V3.1 游戏核心加载失败：src/game-v31.js'));document.head.appendChild(script)}catch(e){fail(e)}})();
`;
fs.writeFileSync('app.js',app,'utf8');

let index=fs.readFileSync('index.html','utf8');
index=must(index,'<title>太玄界 · 修仙大世界 V3.0</title>','<title>太玄界 · 修仙大世界 V3.1</title>','title');
index=must(index,'修仙大世界 · V3.0</p>','修仙大世界 · V3.1</p>','start version');
index=must(index,'<div id="installStatus" class="install-note"></div><div class="version">V3.0 · 成长数据底座</div>','<div id="installStatus" class="install-note"></div><div class="version">V3.1 · 功法术法大扩容</div>','version badge');
index=must(index,'<p class="section-tip">V3.0 完成玩家成长数据底座：旧玩法与前尘旧缘完整保留，功法、法术、装备、材料、敌人和掉落已建立稳定 ID 与统一注册表，为后续大规模内容扩容、冷却状态与法宝能力系统提供底层结构。</p>','<p class="section-tip">V3.1 把玩家成长纵深真正做起来：功法扩展至 28 本、法术与神通扩展至 60 个；每本功法拥有独立熟练进度与真实偏向，战斗改为六格主动术法栏加一个被动秘术槽，冷却、护盾、控制、恢复、持续伤害、反击与保命等机制正式进入斗法。</p>','home release note');
index=must(index,'<script src="./app.js?v=3001"></script>','<script src="./app.js?v=3101"></script>','app cache bust');
fs.writeFileSync('index.html',index,'utf8');

const sw=`const CACHE='taixuan-v3.1.0-manual-spell-expansion-3101';
const CORE=['./','./index.html?v=3101','./style.css','./app.js?v=3101','./src/game-v31.js?v=3101','./manifest-v6.webmanifest?v=6','./icon-v6-192.png?v=6','./icon-v6-512.png?v=6'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return res}).catch(()=>caches.match('./index.html?v=3101'))));});
`;
fs.writeFileSync('sw.js',sw,'utf8');
console.log('V31_RELEASE_ASSETS_PASS');
