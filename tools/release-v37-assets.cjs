const fs=require('fs');
function must(text,search,replacement,label){if(!text.includes(search))throw new Error('V3.7 release transform did not match: '+label);return text.replace(search,replacement)}
const app=`// 太玄界 V3.7 合体法则与高阶战争篇正式加载器 · build 3701
(()=>{
  const fail=(e)=>{console.error(e);document.body.innerHTML='<div style="max-width:680px;margin:40px auto;padding:20px;color:#fff;background:#171a16;border:1px solid #485042;border-radius:14px;font-family:system-ui;line-height:1.7"><h2>太玄界加载失败</h2><div>'+String(e)+'</div><p>请刷新页面；若仍失败，请把这段错误发给我。</p></div>'};
  try{window.__TAIXUAN_BUILD__={engineeringVersion:'3.7.0',gameplayVersion:'3.7.0',build:'3701',milestone:'unity-law-domain-avatar-war',source:'src/game-v37.js',legacyPatchChain:false};document.title='太玄界 · 修仙大世界 V3.7';const script=document.createElement('script');script.src='./src/game-v37.js?v=3701';script.async=false;script.onload=()=>{if(!window.__TAIXUAN_TEST__)fail(new Error('V3.7 直接源码运行时未完成初始化'))};script.onerror=()=>fail(new Error('V3.7 游戏核心加载失败：src/game-v37.js'));document.head.appendChild(script)}catch(e){fail(e)}})();
`;
fs.writeFileSync('app.js',app,'utf8');
let index=fs.readFileSync('index.html','utf8');
index=must(index,'<title>太玄界 · 修仙大世界 V3.6</title>','<title>太玄界 · 修仙大世界 V3.7</title>','title');
index=must(index,'修仙大世界 · V3.6</p>','修仙大世界 · V3.7</p>','start version');
index=must(index,'<div id="installStatus" class="install-note"></div><div class="version">V3.6 · 炼虚与空间篇</div>','<div id="installStatus" class="install-note"></div><div class="version">V3.7 · 合体法则与高阶战争篇</div>','version badge');
index=must(index,'<p class="section-tip">V3.6 正式打开化神之后的人界高阶篇章：新增炼虚初期、中期、后期与圆满，不再靠单纯堆经验推进；玩家必须进入天渊城、空冥裂谷、虚空裂隙与上古断界台，积累空间感悟并凝炼炼虚真髓。四大道途获得空间挪移、禁锁、虚化与裂界攻伐，炼虚突破失败会遭受更重虚空反噬、寿元损失与根基重创，同时新增炼虚功法、神通、古宝、丹药、空间材料与高阶机制敌人。</p>','<p class="section-tip">V3.7 正式进入合体篇：炼虚圆满之后不能只靠修为数值继续上冲，必须确立斩界、焚灭、镇界或神禁四类法则倾向，分别积累法则熟练与肉身/元神/法则三元归一度，再凝炼合体归一髓。踏入合体后可在真实战斗中展开领域并显化法相，天衡战城还会爆发三条地域级高阶战线；合体失败会造成法则倒退、归一崩解、重伤、寿元损失并可能损伤本命法宝。</p>','home release note');
index=must(index,'<script src="./app.js?v=3601"></script>','<script src="./app.js?v=3701"></script>','app cache bust');
fs.writeFileSync('index.html',index,'utf8');
const sw=`const CACHE='taixuan-v3.7.0-unity-law-domain-avatar-war-3701';
const CORE=['./','./index.html?v=3701','./style.css','./app.js?v=3701','./src/game-v37.js?v=3701','./manifest-v6.webmanifest?v=6','./icon-v6-192.png?v=6','./icon-v6-512.png?v=6'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return res}).catch(()=>caches.match('./index.html?v=3701'))));});
`;
fs.writeFileSync('sw.js',sw,'utf8');console.log('V37_RELEASE_ASSETS_PASS');
