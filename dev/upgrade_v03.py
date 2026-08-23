from pathlib import Path
import re

p=Path('src/game-v02.js')
s=p.read_text(encoding='utf-8')

def sub(pattern,repl,label,flags=re.S):
    global s
    ns,n=re.subn(pattern,repl,s,count=1,flags=flags)
    if n!=1:
        raise SystemExit(f'{label}: expected 1 replacement, got {n}')
    s=ns

sub(r"const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='0\.2\.0';",
    "const SAVE_KEY='xiuxian_world_v03'; const OLD_KEY='xiuxian_world_v02'; const VERSION='0.3.0';",
    'version')

NEW_ENEMIES=r"""const ENEMIES=[
 {name:'灰背野狼',kind:'野兽',realm:0,hp:46,atk:[5,9],reward:{stones:[0,1],herbs:[0,1],rep:0},weight:34,areas:['青石村','青石镇']},
 {name:'山道劫匪',kind:'凡人',realm:0,hp:58,atk:[6,11],reward:{stones:[1,4],herbs:[0,0],rep:1},weight:30,areas:['青石镇','临江城']},
 {name:'铁背狼妖',kind:'妖兽',realm:1,hp:82,atk:[9,15],reward:{stones:[2,5],herbs:[1,2],rep:2},weight:28,areas:['青石镇','黑风岭']},
 {name:'血刀门探子',kind:'修士',realm:2,hp:104,atk:[11,18],reward:{stones:[3,7],herbs:[0,1],rep:3},weight:18,areas:['临江城','黑风岭']},
 {name:'黑风岭狼妖',kind:'妖兽',realm:2,hp:112,atk:[12,19],reward:{stones:[3,6],herbs:[1,3],rep:3},weight:25,areas:['黑风岭']},
 {name:'青鳞妖蛇',kind:'妖兽',realm:3,hp:138,atk:[15,23],reward:{stones:[5,9],herbs:[2,4],rep:4},weight:16,areas:['黑风岭']},
 {name:'黑风岭狼王',kind:'妖兽',realm:4,hp:168,atk:[19,29],reward:{stones:[8,14],herbs:[3,5],rep:7},weight:8,areas:['黑风岭']}
];
"""
sub(r"const ENEMIES=\[.*?\];\nfunction rand",NEW_ENEMIES+"function rand",'enemies')

NEW_WEIGHTED=r"""function weightedEnemy(){
 const pool=ENEMIES.filter(e=>!e.areas||e.areas.includes(state.player.location));
 const rows=pool.map(e=>({e,w:e.weight/(1+Math.abs(e.realm-state.player.realmIndex)*.65)}));
 let n=rand()*rows.reduce((a,x)=>a+x.w,0);
 for(const x of rows){n-=x.w;if(n<=0)return x.e}
 return rows[0]?.e||ENEMIES[0]
}
function dangerLabel(e){const d=(e.realm||0)-state.player.realmIndex;return d<=-2?'碾压':d===-1?'优势':d===0?'势均力敌':d===1?'危险':d===2?'极危':'九死一生'}
function injuryLabel(){return ['无伤','轻伤','重伤','濒死'][clamp(state.player.injury||0,0,3)]}
function deathRisk(e){const d=(e.realm||0)-state.player.realmIndex;const inj=state.player.injury||0;if(d<2&&inj<3)return 0;return clamp((d>=2?.04+d*.045:0)+inj*.035,0,.32)}
"""
sub(r"function weightedEnemy\(\)\{.*?\}\nfunction dayNumber",NEW_WEIGHTED+"function dayNumber",'weighted enemy')

old="diligence:0,insight:0,hp:70,qi:0}"
new="diligence:0,insight:0,hp:70,qi:0,injury:0,battleWins:0,battleLosses:0,kills:0}"
if s.count(old)!=1: raise SystemExit('newState fields mismatch')
s=s.replace(old,new,1)

needle="if(state.player.qi==null)state.player.qi=maxQi();"
insert="if(state.player.qi==null)state.player.qi=maxQi();if(state.player.injury==null)state.player.injury=0;if(state.player.battleWins==null)state.player.battleWins=0;if(state.player.battleLosses==null)state.player.battleLosses=0;if(state.player.kills==null)state.player.kills=0;"
if s.count(needle)!=1: raise SystemExit('normalize fields mismatch')
s=s.replace(needle,insert,1)

oldload="state=JSON.parse(raw);normalizeLoaded();save();return true"
newload="state=JSON.parse(raw);normalizeLoaded();save();try{localStorage.removeItem(OLD_KEY)}catch(_){}return true"
if s.count(oldload)!=1: raise SystemExit('load migration mismatch')
s=s.replace(oldload,newload,1)

NEW_CULTIVATE=r"""function cultivate(){
 const base=rint(6,10);const rootM=root().mult;const manualM=manual().mult;const cheatM=1.5;const injuryM=[1,.90,.70,.48][clamp(state.player.injury||0,0,3)];const gain=Math.max(1,Math.floor(base*rootM*manualM*cheatM*injuryM));state.player.progress+=gain;const prof=Math.max(1,Math.floor(rint(4,7)*2*injuryM));state.player.manualProf+=prof;addDiligence(3);let breakthrough=[];
 while(state.player.progress>=realm().need&&state.player.realmIndex<REALMS.length-1){state.player.progress-=realm().need;state.player.realmIndex++;state.player.hp=maxHp();state.player.qi=maxQi();breakthrough.push(REALMS[state.player.realmIndex].name);if(state.player.realmIndex===1&&!('火弹术'in state.player.spells)){state.player.spells['火弹术']=0;state.player.spells['御风步']=0;addPersonal('踏入炼气一层后，你终于能够驱使灵力，摸索出了火弹术与御风步。','major')}}
 advanceDays(1);const hurt=state.player.injury?` 伤势拖累了修炼效率（${injuryLabel()}）。`:'';addPersonal(`你运转《${state.player.manual}》吐纳一日，修为 +${gain}，功法熟练度 +${prof}。${breakthrough.length?` 一举突破至${breakthrough.join('、')}！`:''}${hurt}`,breakthrough.length?'major':'good');save();render();showResult('吐纳修炼',`修为 +${gain}\n《${state.player.manual}》熟练度 +${prof}${state.player.injury?`\n当前伤势：${injuryLabel()}，修炼效率下降。`:''}${breakthrough.length?`\n突破：${breakthrough.join('、')}`:''}`,'good')
}
function gather()"""
sub(r"function cultivate\(\)\{.*?\n\}\nfunction gather\(\)",NEW_CULTIVATE,'cultivate')

NEW_REST=r"""function rest(){advanceDays(1);const before=state.player.hp;const oldInjury=state.player.injury||0;state.player.hp=Math.min(maxHp(),state.player.hp+Math.ceil(maxHp()*.52));state.player.qi=maxQi();if(state.player.injury>0)state.player.injury--;addDiligence(1);addPersonal(`你闭门休息了一整日，气血与灵力恢复。${oldInjury>state.player.injury?`伤势由${['无伤','轻伤','重伤','濒死'][oldInjury]}缓解为${injuryLabel()}。`:''}`,'good');save();render();showResult('闭门休整',`气血 +${state.player.hp-before}\n灵力恢复至满值${oldInjury>state.player.injury?`\n伤势：${['无伤','轻伤','重伤','濒死'][oldInjury]} → ${injuryLabel()}`:''}`,'good')}
function rumor()"""
sub(r"function rest\(\)\{.*?\}\nfunction rumor\(\)",NEW_REST,'rest')

NEW_EXPLORE=r"""function explore(){
 advanceDays(1);addDiligence(2);const danger=state.player.location==='黑风岭'?.46:state.player.location==='临江城'||state.player.location==='青石镇'?.30:.20;const x=rand();if(x<danger){startCombat(weightedEnemy());return}if(x<danger+.30){startMinorEvent();return}if(x<danger+.46){const n=rint(1,4);state.player.spiritStones+=n;addPersonal(`你在一处废弃石缝里发现 ${n} 块灵石。`,'good');save();render();showResult('意外收获',`你找到了一只破布袋。\n灵石 +${n}`,'good');return}addPersonal('你在附近转了一圈，没有碰见特别的事。');save();render();showResult('附近探索','这一日风平浪静。修真界并不是每天都有奇遇。')
}
function startMinorEvent()"""
sub(r"function explore\(\)\{.*?\n\}\nfunction startMinorEvent\(\)",NEW_EXPLORE,'explore')

NEW_COMBAT=r"""function startCombat(enemyTemplate){const e=JSON.parse(JSON.stringify(enemyTemplate));if(!e.reward)e.reward={stones:[0,0],herbs:[0,0],rep:0};if(!e.reward.herbs)e.reward.herbs=[0,0];combat={enemy:e,enemyHp:e.hp,playerHp:state.player.hp,playerQi:state.player.qi,defending:false,evade:0,round:1,logs:[`你遭遇了${e.name}。危险判断：${dangerLabel(e)}。`]};renderCombat()}
function renderCombat(){const e=combat.enemy;const pPct=clamp(combat.playerHp/maxHp()*100,0,100);const ePct=clamp(combat.enemyHp/e.hp*100,0,100);const windKnown='御风步'in state.player.spells;let html=`<h2>遭遇战 · 第${combat.round}回合</h2><div class="combatants"><div class="fighter"><b>${esc(state.player.name)}</b><div class="hp">${realm().name} · 气血 ${combat.playerHp}/${maxHp()} · 灵力 ${combat.playerQi}/${maxQi()}</div><div class="bar"><i style="width:${pPct}%"></i></div></div><div class="vs">VS</div><div class="fighter"><b>${esc(e.name)}</b><div class="hp">${esc(e.kind||'敌人')} · ${REALMS[Math.min(e.realm||0,REALMS.length-1)].name} · ${dangerLabel(e)}</div><div class="hp">气血 ${Math.max(0,combat.enemyHp)}/${e.hp}</div><div class="bar"><i style="width:${ePct}%"></i></div></div></div><div class="combat-log">${combat.logs.slice(-9).map(x=>`• ${esc(x)}<br>`).join('')}</div><div class="modal-actions two"><button data-combat="attack">拳脚攻击</button><button data-combat="spell" ${!('火弹术'in state.player.spells)||combat.playerQi<SPELLS['火弹术'].qi?'disabled':''}>火弹术</button><button data-combat="wind" ${!windKnown||combat.playerQi<SPELLS['御风步'].qi?'disabled':''}>御风步</button><button data-combat="defend">防御</button><button data-combat="flee">逃跑</button></div>`;openModal(html,false);document.querySelectorAll('[data-combat]').forEach(b=>b.onclick=()=>combatAction(b.dataset.combat))}
function combatAction(a){if(!combat||state.flags.dead)return;const e=combat.enemy;combat.defending=false;
 if(a==='attack'){const prof=state.player.spells['基础拳脚']||0;const dmg=rint(7,12)+state.player.realmIndex*3+Math.floor(prof/35)+Math.floor(state.player.manualProf/80);combat.enemyHp-=dmg;state.player.spells['基础拳脚']=prof+2;combat.logs.push(`你近身攻出一击，造成 ${dmg} 点伤害。`)}
 else if(a==='spell'){const sp=SPELLS['火弹术'];combat.playerQi-=sp.qi;const prof=state.player.spells['火弹术']||0;const dmg=sp.power+rint(2,8)+state.player.realmIndex*4+Math.floor(prof/14);combat.enemyHp-=dmg;state.player.spells['火弹术']=prof+4;combat.logs.push(`火弹炸开，造成 ${dmg} 点伤害。`)}
 else if(a==='wind'){const sp=SPELLS['御风步'];combat.playerQi-=sp.qi;const prof=state.player.spells['御风步']||0;state.player.spells['御风步']=prof+3;combat.evade=2;combat.logs.push('你运转御风步，接下来两回合更容易闪开攻击。')}
 else if(a==='defend'){combat.defending=true;combat.logs.push('你收敛气息，架势转守，准备硬接这一轮。')}
 else if(a==='flee'){const diff=(e.realm||0)-state.player.realmIndex;const wind=('御风步'in state.player.spells)?Math.min(.30,(state.player.spells['御风步']||0)/180):0;const chance=clamp(.40+wind-diff*.08,.12,.78);if(rand()<chance){state.player.hp=Math.max(1,combat.playerHp);state.player.qi=combat.playerQi;addPersonal(`你从${e.name}手中脱身。`);combat=null;save();render();closeModal();showResult('成功脱身',`你没有继续纠缠。\n当前气血 ${state.player.hp}/${maxHp()}`);return}else combat.logs.push('你试图脱身，但被对方逼了回来。')}
 if(combat.enemyHp<=0){finishCombat(true);return}
 let dodged=false;if(combat.evade>0){combat.evade--;const prof=state.player.spells['御风步']||0;const dodge=clamp(.34+prof/500,0,.62);if(rand()<dodge){dodged=true;combat.logs.push(`御风步生效，你避开了${e.name}的反击。`)}}
 if(!dodged){let edmg=rint(e.atk[0],e.atk[1]);if(combat.enemyHp/e.hp<.32&&rand()<.30){edmg=Math.ceil(edmg*1.35);combat.logs.push(`${e.name}在伤势刺激下突然暴起！`)}if(combat.defending)edmg=Math.ceil(edmg*.52);edmg=Math.max(1,edmg-Math.floor(state.player.realmIndex*.8));combat.playerHp-=edmg;combat.logs.push(`${e.name}反击，造成 ${edmg} 点伤害。`)}
 if(combat.playerHp<=0){finishCombat(false);return}combat.round++;renderCombat()}
function finishCombat(win){const e=combat.enemy;if(win){const stones=rint(e.reward.stones?.[0]||0,e.reward.stones?.[1]||0);const herbs=rint(e.reward.herbs?.[0]||0,e.reward.herbs?.[1]||0);state.player.spiritStones+=stones;state.player.herbs+=herbs;state.player.reputation+=e.reward.rep||0;state.player.hp=Math.max(1,combat.playerHp);state.player.qi=combat.playerQi;state.player.battleWins++;state.player.kills++;addDiligence(3);addPersonal(`你击败${e.name}。${stones?`获得${stones}块灵石。`:''}${herbs?`获得${herbs}株灵草。`:''}`,'good');combat=null;closeModal();save();render();showResult('战斗胜利',`${stones?`灵石 +${stones}\n`:''}${herbs?`灵草 +${herbs}\n`:''}${e.reward.rep?`声望 +${e.reward.rep}\n`:''}气血剩余 ${state.player.hp}/${maxHp()}\n战绩 ${state.player.battleWins}胜 ${state.player.battleLosses}败`,'good')}
 else {state.player.battleLosses++;const risk=deathRisk(e);if(risk>0&&rand()<risk){state.flags.dead=true;state.player.hp=0;state.player.qi=0;addPersonal(`你败在${e.name}手中，伤势过重，身死道消。`,'bad');combat=null;closeModal();try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem(OLD_KEY)}catch(_){}render();showResult('身死道消',`这一次你没能逃出生天。\n敌人：${e.name}\n此世存档已经结束，刷新页面即可重新开局。`,'bad');return}
 const diff=Math.max(0,(e.realm||0)-state.player.realmIndex);const add=diff>=2?2:1;state.player.injury=clamp((state.player.injury||0)+add,0,3);const lost=Math.min(state.player.spiritStones,rint(0,Math.max(2,diff+1)));state.player.spiritStones-=lost;state.player.hp=Math.max(1,Math.ceil(maxHp()*(state.player.injury>=3?.18:.30)));state.player.qi=0;addPersonal(`你败在${e.name}手下，拖着${injuryLabel()}逃了回来。`,'bad');combat=null;closeModal();save();render();showResult('战斗失败',`你侥幸活了下来。\n当前伤势：${injuryLabel()}${lost?`\n遗失灵石 ${lost}`:''}\n建议先【闭门休整】再继续冒险。`,'bad')}}
function majorDef"""
sub(r"function startCombat\(enemyTemplate\).*?\nfunction majorDef",NEW_COMBAT,'combat')

old_hero="$('heroSub').textContent=`${age()}岁 · ${season()} · ${state.player.location} · ${root().name}`;"
new_hero="$('heroSub').textContent=`${age()}岁 · ${season()} · ${state.player.location} · ${root().name}${state.player.injury?` · ${injuryLabel()}`:''}`;"
if s.count(old_hero)!=1: raise SystemExit('hero sub mismatch')
s=s.replace(old_hero,new_hero,1)

NEW_RENDER=r"""function renderCharacter(){const p=state.player;$('characterStats').innerHTML=`<div class="kv"><span>姓名</span><b>${esc(p.name)}</b></div><div class="kv"><span>年龄 / 寿元</span><b>${age()} / ${p.lifespan}</b></div><div class="kv"><span>境界</span><b>${realm().name}</b></div><div class="kv"><span>气血</span><b>${p.hp} / ${maxHp()}</b></div><div class="kv"><span>灵力</span><b>${p.qi} / ${maxQi()}</b></div><div class="kv"><span>伤势</span><b>${injuryLabel()}</b></div><div class="kv"><span>所在地</span><b>${p.location}</b></div><div class="kv"><span>声望</span><b>${p.reputation}</b></div><div class="kv"><span>战绩</span><b>${p.battleWins}胜 / ${p.battleLosses}败 · 击杀${p.kills}</b></div>`;$('rootInfo').innerHTML=`<div class="skill-card"><div class="skill-head"><b>${root().name}</b><span>修炼倍率 ×${root().mult.toFixed(2)}</span></div><div class="skill-desc">${root().desc}</div></div>`;
 $('manualList').innerHTML=`<div class="skill-card"><div class="skill-head"><b>《${esc(p.manual)}》</b><span>${manual().quality}</span></div><div class="skill-desc">熟练度 ${p.manualProf} · 功法倍率 ×${manual().mult.toFixed(2)}<br>${manual().desc}</div></div>`;
 $('spellList').innerHTML=Object.entries(p.spells).map(([name,prof])=>{const sp=SPELLS[name]||{quality:'未知',desc:''};return `<div class="skill-card"><div class="skill-head"><b>${esc(name)}</b><span>${sp.quality}</span></div><div class="skill-desc">熟练度 ${prof}${sp.qi?` · 消耗灵力 ${sp.qi}`:''}<br>${sp.desc}</div></div>`}).join('')}
function renderMap()"""
sub(r"function renderCharacter\(\)\{.*?\nfunction renderMap\(\)",NEW_RENDER,'renderCharacter')

Path('src/game-v03.js').write_text(s,encoding='utf-8')

app="""(async()=>{\n  try{\n    const r=await fetch('./src/game-v03.js?v=3',{cache:'no-cache'});\n    if(!r.ok) throw new Error(`游戏核心加载失败：src/game-v03.js (${r.status})`);\n    const src=await r.text();\n    (0,eval)(src);\n  }catch(e){\n    console.error(e);\n    document.body.innerHTML='<div style=\"max-width:680px;margin:40px auto;padding:20px;color:#fff;background:#171a16;border:1px solid #485042;border-radius:14px;font-family:system-ui;line-height:1.7\"><h2>太玄界加载失败</h2><div>'+String(e)+'</div><p>请刷新页面；若仍失败，请把这段错误发给我。</p></div>';\n  }\n})();\n"""
Path('app.js').write_text(app,encoding='utf-8')

idx=Path('index.html').read_text(encoding='utf-8').replace('V0.2','V0.3')
Path('index.html').write_text(idx,encoding='utf-8')

manifest=Path('manifest-v6.webmanifest')
if manifest.exists():
    m=manifest.read_text(encoding='utf-8').replace('index.html?v=6','index.html?v=3')
    manifest.write_text(m,encoding='utf-8')
    Path('manifest.webmanifest').write_text(m,encoding='utf-8')

core=['./','./index.html?v=3','./style.css','./app.js','./src/game-v03.js?v=3','./manifest-v6.webmanifest?v=6','./icon-v6-192.png?v=6','./icon-v6-512.png?v=6']
sw="const CACHE='taixuan-v0.3.0-combat-v03';\nconst CORE="+repr(core).replace("'",'"')+";\n"+"self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});\nself.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});\nself.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return res}).catch(()=>caches.match('./index.html?v=3'))));});\n"
Path('sw.js').write_text(sw,encoding='utf-8')

readme=Path('README.md').read_text(encoding='utf-8')
readme=re.sub(r'## 当前版本：[^\n]+','## 当前版本：V0.3 战斗闭环',readme,count=1)
if '## V0.3 新增' not in readme:
    marker='## 运行\n'
    added='''## V0.3 新增\n\n- 战斗按地区生成敌人，黑风岭显著更危险\n- 拳脚、火弹术、御风步、防御、逃跑形成完整回合选择\n- 敌人境界、危险度、残血爆发与战利品\n- 战败伤势：轻伤 / 重伤 / 濒死，休整可逐级恢复\n- 对高境界敌人挑战失败存在真实死亡风险\n- 记录胜负与击杀战绩\n- 运行时改为直接加载可读源码 `src/game-v03.js`，停止依赖 24 个 Base64 分块\n\n'''
    readme=readme.replace(marker,added+marker,1)
readme=readme.replace('- 功法、灵根、法术与战斗\n','')
Path('README.md').write_text(readme,encoding='utf-8')

print('V0.3 source generated:',len(s),'bytes')
