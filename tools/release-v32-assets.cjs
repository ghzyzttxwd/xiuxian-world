const fs=require('fs');
function must(text,search,replacement,label){if(!text.includes(search))throw new Error('V3.2 release transform did not match: '+label);return text.replace(search,replacement)}
const app=`// 太玄界 V3.2 法宝炼器体系正式加载器 · build 3201
(()=>{
  const fail=(e)=>{console.error(e);document.body.innerHTML='<div style="max-width:680px;margin:40px auto;padding:20px;color:#fff;background:#171a16;border:1px solid #485042;border-radius:14px;font-family:system-ui;line-height:1.7"><h2>太玄界加载失败</h2><div>'+String(e)+'</div><p>请刷新页面；若仍失败，请把这段错误发给我。</p></div>'};
  try{window.__TAIXUAN_BUILD__={engineeringVersion:'3.2.0',gameplayVersion:'3.2.0',build:'3201',milestone:'artifact-forging-system',source:'src/game-v32.js',legacyPatchChain:false};document.title='太玄界 · 修仙大世界 V3.2';const script=document.createElement('script');script.src='./src/game-v32.js?v=3201';script.async=false;script.onload=()=>{if(!window.__TAIXUAN_TEST__)fail(new Error('V3.2 直接源码运行时未完成初始化'))};script.onerror=()=>fail(new Error('V3.2 游戏核心加载失败：src/game-v32.js'));document.head.appendChild(script)}catch(e){fail(e)}})();
`;
fs.writeFileSync('app.js',app,'utf8');
let index=fs.readFileSync('index.html','utf8');
index=must(index,'<title>太玄界 · 修仙大世界 V3.1</title>','<title>太玄界 · 修仙大世界 V3.2</title>','title');
index=must(index,'修仙大世界 · V3.1</p>','修仙大世界 · V3.2</p>','start version');
index=must(index,'<div id="installStatus" class="install-note"></div><div class="version">V3.1 · 功法术法大扩容</div>','<div id="installStatus" class="install-note"></div><div class="version">V3.2 · 法宝炼器体系</div>','version badge');
index=must(index,'<p class="section-tip">V3.1 把玩家成长纵深真正做起来：功法扩展至 28 本、法术与神通扩展至 60 个；每本功法拥有独立熟练进度与真实偏向，战斗改为六格主动术法栏加一个被动秘术槽，冷却、护盾、控制、恢复、持续伤害、反击与保命等机制正式进入斗法。</p>','<p class="section-tip">V3.2 把装备与法宝做成真正养成体系：可收集器物扩展至 60 件，其中 24 件为真正法宝；基础装备保留武器、护甲、佩饰三槽，法宝新增攻伐、护身、辅助、本命四槽，并加入炼器品质、认主、祭炼、温养、本命化、受损修复、主动法宝能力和构筑级被动。</p>','home release note');
index=must(index,'<script src="./app.js?v=3101"></script>','<script src="./app.js?v=3201"></script>','app cache bust');
fs.writeFileSync('index.html',index,'utf8');
const sw=`const CACHE='taixuan-v3.2.0-artifact-forging-system-3201';
const CORE=['./','./index.html?v=3201','./style.css','./app.js?v=3201','./src/game-v32.js?v=3201','./manifest-v6.webmanifest?v=6','./icon-v6-192.png?v=6','./icon-v6-512.png?v=6'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return res}).catch(()=>caches.match('./index.html?v=3201'))));});
`;
fs.writeFileSync('sw.js',sw,'utf8');console.log('V32_RELEASE_ASSETS_PASS');
