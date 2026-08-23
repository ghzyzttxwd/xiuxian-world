const fs=require('fs');
function must(text,search,replacement,label){if(!text.includes(search))throw new Error('V3.5 release transform did not match: '+label);return text.replace(search,replacement)}
const app=`// 太玄界 V3.5 正常经济与世界整合正式加载器 · build 3501
(()=>{
  const fail=(e)=>{console.error(e);document.body.innerHTML='<div style="max-width:680px;margin:40px auto;padding:20px;color:#fff;background:#171a16;border:1px solid #485042;border-radius:14px;font-family:system-ui;line-height:1.7"><h2>太玄界加载失败</h2><div>'+String(e)+'</div><p>请刷新页面；若仍失败，请把这段错误发给我。</p></div>'};
  try{window.__TAIXUAN_BUILD__={engineeringVersion:'3.5.0',gameplayVersion:'3.5.0',build:'3501',milestone:'economy-world-integration',source:'src/game-v35.js',legacyPatchChain:false};document.title='太玄界 · 修仙大世界 V3.5';const script=document.createElement('script');script.src='./src/game-v35.js?v=3501';script.async=false;script.onload=()=>{if(!window.__TAIXUAN_TEST__)fail(new Error('V3.5 直接源码运行时未完成初始化'))};script.onerror=()=>fail(new Error('V3.5 游戏核心加载失败：src/game-v35.js'));document.head.appendChild(script)}catch(e){fail(e)}})();
`;
fs.writeFileSync('app.js',app,'utf8');
let index=fs.readFileSync('index.html','utf8');
index=must(index,'<title>太玄界 · 修仙大世界 V3.4</title>','<title>太玄界 · 修仙大世界 V3.5</title>','title');
index=must(index,'修仙大世界 · V3.4</p>','修仙大世界 · V3.5</p>','start version');
index=must(index,'<div id="installStatus" class="install-note"></div><div class="version">V3.4 · 战斗与四大道途 Build</div>','<div id="installStatus" class="install-note"></div><div class="version">V3.5 · 正常经济与世界整合</div>','version badge');
index=must(index,'<p class="section-tip">V3.4 把战斗从“有技能可按”推进到真正构筑：敌人扩展至 48 个，其中 19 个新增敌人均带独立机制；青云剑道、赤霞火道、万兽炼体、太虚神道各形成两套中高阶 Build，由主修功法、六格主动术法、被动秘术与同道法宝共同识别并提供真实战斗加成，同时加入重甲、虚化、反伤、再生、抽灵、持续伤害、冷却压制、控制抗性与斩杀等敌方机制。</p>','<p class="section-tip">V3.5 把原本彼此孤立的资源系统接成无充值经济闭环：临江坊市、青云秘库、黑风暗市与苍梧拍卖场使用稳定 shopId 和独立货源/币种/库存；命名材料与丹药进入真实交易，宗门战争会制造商路短缺或缓和，NPC 会求具体材料，秘境核心会带出区域特产并补全未知丹方，高阶资源保持野外与交易多来源但仍受库存和价格约束。</p>','home release note');
index=must(index,'<script src="./app.js?v=3401"></script>','<script src="./app.js?v=3501"></script>','app cache bust');
fs.writeFileSync('index.html',index,'utf8');
const sw=`const CACHE='taixuan-v3.5.0-economy-world-integration-3501';
const CORE=['./','./index.html?v=3501','./style.css','./app.js?v=3501','./src/game-v35.js?v=3501','./manifest-v6.webmanifest?v=6','./icon-v6-192.png?v=6','./icon-v6-512.png?v=6'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return res}).catch(()=>caches.match('./index.html?v=3501'))));});
`;
fs.writeFileSync('sw.js',sw,'utf8');console.log('V35_RELEASE_ASSETS_PASS');
