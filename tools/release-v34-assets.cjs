const fs=require('fs');
function must(text,search,replacement,label){if(!text.includes(search))throw new Error('V3.4 release transform did not match: '+label);return text.replace(search,replacement)}
const app=`// 太玄界 V3.4 战斗与四大道途 Build 正式加载器 · build 3401
(()=>{
  const fail=(e)=>{console.error(e);document.body.innerHTML='<div style="max-width:680px;margin:40px auto;padding:20px;color:#fff;background:#171a16;border:1px solid #485042;border-radius:14px;font-family:system-ui;line-height:1.7"><h2>太玄界加载失败</h2><div>'+String(e)+'</div><p>请刷新页面；若仍失败，请把这段错误发给我。</p></div>'};
  try{window.__TAIXUAN_BUILD__={engineeringVersion:'3.4.0',gameplayVersion:'3.4.0',build:'3401',milestone:'combat-dao-builds',source:'src/game-v34.js',legacyPatchChain:false};document.title='太玄界 · 修仙大世界 V3.4';const script=document.createElement('script');script.src='./src/game-v34.js?v=3401';script.async=false;script.onload=()=>{if(!window.__TAIXUAN_TEST__)fail(new Error('V3.4 直接源码运行时未完成初始化'))};script.onerror=()=>fail(new Error('V3.4 游戏核心加载失败：src/game-v34.js'));document.head.appendChild(script)}catch(e){fail(e)}})();
`;
fs.writeFileSync('app.js',app,'utf8');
let index=fs.readFileSync('index.html','utf8');
index=must(index,'<title>太玄界 · 修仙大世界 V3.3</title>','<title>太玄界 · 修仙大世界 V3.4</title>','title');
index=must(index,'修仙大世界 · V3.3</p>','修仙大世界 · V3.4</p>','start version');
index=must(index,'<div id="installStatus" class="install-note"></div><div class="version">V3.3 · 炼丹材料资源闭环</div>','<div id="installStatus" class="install-note"></div><div class="version">V3.4 · 战斗与四大道途 Build</div>','version badge');
index=must(index,'<p class="section-tip">V3.3 把炼丹、材料与地图资源真正闭环：新增 40 种命名材料并保留 8 类旧资源兼容，丹方与丹药扩展至 24 种；不同材料明确绑定区域与敌人来源，炼丹加入丹方获取、成功失败、普通/上品/极品/丹纹品质、丹毒与短期耐受，并让恢复、破境、炼体、神魂、爆发和高境界丹药进入真实成长与战斗。</p>','<p class="section-tip">V3.4 把战斗从“有技能可按”推进到真正构筑：敌人扩展至 48 个，其中 19 个新增敌人均带独立机制；青云剑道、赤霞火道、万兽炼体、太虚神道各形成两套中高阶 Build，由主修功法、六格主动术法、被动秘术与同道法宝共同识别并提供真实战斗加成，同时加入重甲、虚化、反伤、再生、抽灵、持续伤害、冷却压制、控制抗性与斩杀等敌方机制。</p>','home release note');
index=must(index,'<script src="./app.js?v=3301"></script>','<script src="./app.js?v=3401"></script>','app cache bust');
fs.writeFileSync('index.html',index,'utf8');
const sw=`const CACHE='taixuan-v3.4.0-combat-dao-builds-3401';
const CORE=['./','./index.html?v=3401','./style.css','./app.js?v=3401','./src/game-v34.js?v=3401','./manifest-v6.webmanifest?v=6','./icon-v6-192.png?v=6','./icon-v6-512.png?v=6'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return res}).catch(()=>caches.match('./index.html?v=3401'))));});
`;
fs.writeFileSync('sw.js',sw,'utf8');console.log('V34_RELEASE_ASSETS_PASS');
