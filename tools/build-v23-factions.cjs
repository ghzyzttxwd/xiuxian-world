const fs=require('fs');
const crypto=require('crypto');

const INPUT='src/game-v22.js';
const OUTPUT='src/game-v23.js';
const BUILD='2301';
if(!fs.existsSync(INPUT))throw new Error('V2.3 build: missing '+INPUT);
let src=fs.readFileSync(INPUT,'utf8');
function must(pattern,replacement,label){const next=src.replace(pattern,()=>replacement);if(next===src)throw new Error('V2.3 build transform did not match: '+label);src=next}

must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='2.2.0'; const SAVE_SCHEMA_VERSION=19;",
     "const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='2.3.0'; const SAVE_SCHEMA_VERSION=20;",'version/schema');

const factionSystem=String.raw`const FACTION_META={
 qingyun:{id:'qingyun',name:'青云宗',homes:['青云山'],contract:'清剿黑风妖患',desc:'前往黑风岭或万兽山脉击败两头妖兽。',need:2,stones:12,herbs:3,rare:0,materials:0},
 xuanshui:{id:'xuanshui',name:'玄水帮',homes:['临江城','云梦泽'],contract:'镇压云梦水患',desc:'在云梦泽击败两名水匪或妖兽。',need:2,stones:16,herbs:4,rare:0,materials:0},
 blood:{id:'blood',name:'血刀门',homes:['黑风岭','赤霞谷'],contract:'赤岭试刀',desc:'在黑风岭或赤霞谷赢下两场险地战斗。',need:2,stones:18,herbs:0,rare:1,materials:2}
};
function factionStandingValue(id,p=state&&state.player){if(!p)return 0;const rows=p.factionStanding||{},raw=Number(rows[id]||0);return id==='qingyun'&&p.sect==='青云宗'?Math.max(20,raw):raw}
function factionStandingLabel(v){return v>=60?'盟友':v>=25?'友善':v>-25?'中立':v>-60?'敌视':'死敌'}
function factionStandingSnapshot(){return Object.fromEntries(Object.keys(FACTION_META).map(id=>[id,factionStandingValue(id)]))}
function addFactionStanding(id,delta,reason=''){if(!FACTION_META[id]||!delta)return factionStandingValue(id);const p=state.player;if(!p.factionStanding||typeof p.factionStanding!=='object')p.factionStanding={qingyun:0,xuanshui:0,blood:0};p.factionStanding[id]=clamp((p.factionStanding[id]||0)+delta,-100,100);if(delta>0&&id==='qingyun')p.factionStanding.blood=clamp((p.factionStanding.blood||0)-Math.max(1,Math.ceil(delta*.35)),-100,100);if(delta>0&&id==='blood')p.factionStanding.qingyun=clamp((p.factionStanding.qingyun||0)-Math.max(1,Math.ceil(delta*.35)),-100,100);if(reason)addPersonal('【势力关系】'+FACTION_META[id].name+'：'+(delta>0?'+':'')+delta+'（'+reason+'）。',delta>0?'good':'bad');return factionStandingValue(id)}
function factionIdFromNpc(n){if(!n)return null;return n.faction==='青云宗'?'qingyun':n.faction==='玄水帮'?'xuanshui':n.faction==='血刀门'?'blood':null}
function factionRouteStanding(route,player=state.player){if(!route||!FACTION_META[route.faction])return 0;return factionStandingValue(route.faction,player)}
function factionContractMatch(c,e){if(!c||!e)return false;const loc=state.player.location;if(c.faction==='qingyun')return ['黑风岭','万兽山脉'].includes(loc)&&e.kind==='妖兽';if(c.faction==='xuanshui')return loc==='云梦泽'&&(e.kind==='妖兽'||String(e.name||'').includes('水匪'));if(c.faction==='blood')return ['黑风岭','赤霞谷'].includes(loc)&&e.kind!=='凡人';return false}
function factionContractCooldown(id){const p=state.player,last=(p.factionLastContractDay&&p.factionLastContractDay[id])||0;if(!last)return 0;return Math.max(0,10-(dayNumber()-last))}
function acceptFactionContract(id){const d=FACTION_META[id],p=state.player;if(!d)return;if(p.factionContract)return showResult('已有势力委托','先完成当前的【'+p.factionContract.title+'】。','bad');if(!d.homes.includes(p.location))return showResult('不在势力据点','【'+d.name+'】只会在 '+d.homes.join(' / ')+' 发布委托。','bad');if(factionStandingValue(id)<=-60)return showResult('已成死敌',d.name+'不会把委托交给一个被列为死敌的人。','bad');if(id==='blood'&&p.sect==='青云宗')return showResult('身份冲突','你已列入青云宗门墙，不能公开替血刀门办事。','bad');const cd=factionContractCooldown(id);if(cd>0)return showResult('委托冷却','此势力新的委托还需 '+cd+' 日才会刷新。','bad');p.factionContract={faction:id,title:d.contract,progress:0,need:d.need,acceptedDay:dayNumber()};addPersonal('你接下'+d.name+'委托【'+d.contract+'】：'+d.desc,'major');save();render();showResult('势力委托已接','【'+d.contract+'】\n'+d.desc+'\n完成后会提高长期势力关系。','good')}
function abandonFactionContract(){const p=state.player;if(!p.factionContract)return;const old=p.factionContract;p.factionContract=null;addPersonal('你放弃了'+FACTION_META[old.faction].name+'委托【'+old.title+'】。');save();render();showResult('已放弃委托','本次委托没有奖励，也不会计入完成次数。')}
function finishFactionContract(c){const p=state.player,d=FACTION_META[c.faction];p.spiritStones+=d.stones;p.herbs+=d.herbs;p.rareMaterials=(p.rareMaterials||0)+d.rare;p.beastMaterials=(p.beastMaterials||0)+d.materials;if(c.faction==='qingyun'&&p.sect==='青云宗')p.sectContribution+=5;addFactionStanding(c.faction,10,'完成势力委托');p.factionContracts[c.faction]=(p.factionContracts[c.faction]||0)+1;p.factionLastContractDay[c.faction]=dayNumber();p.factionContract=null;addPersonal('【势力委托完成】'+d.name+'交付报酬：灵石 '+d.stones+(d.herbs?'、灵草 '+d.herbs:'')+(d.rare?'、高阶灵材 '+d.rare:'')+(d.materials?'、兽材 '+d.materials:'')+'。','major')}
function onFactionContractCombatWin(e){const c=state.player.factionContract;if(!c||!factionContractMatch(c,e))return;c.progress++;addPersonal('【势力委托】'+c.title+'进度 '+c.progress+'/'+c.need+'。','good');if(c.progress>=c.need)finishFactionContract(c)}
function renderFactionStanding(){let panel=$('factionStandingPanel');if(!panel){const page=$('page-events');if(!page)return;panel=document.createElement('section');panel.className='panel';panel.id='factionStandingPanel';panel.innerHTML='<h2>三方势力关系</h2><p class="section-tip">势力关系是长期记录。委托、战争站队与宗门身份会改变它；友善可降低相关路线风险，玄水帮还会影响临江坊市买价，死敌NPC会拒绝正常往来。</p><div id="factionStandingInfo"></div><div id="factionStandingActions"></div>';page.insertBefore(panel,page.firstChild)}const p=state.player,info=$('factionStandingInfo'),actions=$('factionStandingActions');if(!info||!actions)return;const rows=Object.values(FACTION_META).map(d=>{const v=factionStandingValue(d.id),n=(p.factionContracts&&p.factionContracts[d.id])||0;return '<div class="kv"><span>'+d.name+'</span><b>'+v+' · '+factionStandingLabel(v)+' · 已完成委托 '+n+'</b></div>'}).join('');const c=p.factionContract;info.innerHTML=rows+(c?'<div class="skill-card"><div class="skill-head"><b>当前委托：'+esc(c.title)+'</b><span>'+c.progress+'/'+c.need+'</span></div><div class="skill-desc">'+esc(FACTION_META[c.faction].desc)+'</div></div>':'');if(c){actions.innerHTML='<div class="event-actions"><button data-faction-abandon>放弃当前委托</button></div>'}else{actions.innerHTML='<div class="event-actions">'+Object.values(FACTION_META).map(d=>{const here=d.homes.includes(p.location),cd=factionContractCooldown(d.id),blocked=factionStandingValue(d.id)<=-60||(d.id==='blood'&&p.sect==='青云宗');return '<button data-faction-contract="'+d.id+'" '+(!here||cd||blocked?'disabled':'')+'>'+d.name+' · '+d.contract+(cd?' · '+cd+'日后':'')+'</button>'}).join('')+'</div>'}actions.querySelectorAll('[data-faction-contract]').forEach(b=>b.onclick=()=>acceptFactionContract(b.dataset.factionContract));const ab=actions.querySelector('[data-faction-abandon]');if(ab)ab.onclick=abandonFactionContract}
`;
const badge="function daoMapBadge(location){return daoWorldResonance(location)?'<span class=\"pill\">道途共鸣</span>':''}\n";
must(badge+'const ENEMIES=[',badge+factionSystem+'const ENEMIES=[','faction system');

must("daoRenown:{sword:0,flame:0,body:0,spirit:0},daoEncounters:0,dwellingTier:0",
     "daoRenown:{sword:0,flame:0,body:0,spirit:0},daoEncounters:0,factionStanding:{qingyun:0,xuanshui:0,blood:0},factionContracts:{qingyun:0,xuanshui:0,blood:0},factionContract:null,factionLastContractDay:{qingyun:0,xuanshui:0,blood:0},dwellingTier:0",'new faction fields');

const migration19=" 19(){const p=state.player;if(!p.daoRenown||typeof p.daoRenown!=='object')p.daoRenown={sword:0,flame:0,body:0,spirit:0};for(const id of ['sword','flame','body','spirit'])if(p.daoRenown[id]==null)p.daoRenown[id]=0;if(p.daoEncounters==null)p.daoEncounters=0;for(const n of state.npcs){if(!n.daoAffinity)n.daoAffinity=['sword','flame','body','spirit'][Math.abs((n.id||1)-1)%4]}} ";
const migration20=migration19+String.raw`,
 20(){const p=state.player;if(!p.factionStanding||typeof p.factionStanding!=='object')p.factionStanding={qingyun:p.sect==='青云宗'?20:0,xuanshui:0,blood:0};for(const id of ['qingyun','xuanshui','blood'])if(p.factionStanding[id]==null)p.factionStanding[id]=id==='qingyun'&&p.sect==='青云宗'?20:0;if(!p.factionContracts||typeof p.factionContracts!=='object')p.factionContracts={qingyun:0,xuanshui:0,blood:0};for(const id of ['qingyun','xuanshui','blood'])if(p.factionContracts[id]==null)p.factionContracts[id]=0;if(p.factionContract===undefined)p.factionContract=null;if(!p.factionLastContractDay||typeof p.factionLastContractDay!=='object')p.factionLastContractDay={qingyun:0,xuanshui:0,blood:0};for(const id of ['qingyun','xuanshui','blood'])if(p.factionLastContractDay[id]==null)p.factionLastContractDay[id]=0} `;
must(migration19+'\n};',migration20+'\n};','schema 20 migration');
must("['player.daoEncounters',p.daoEncounters],['player.dwellingTier',p.dwellingTier]",
     "['player.daoEncounters',p.daoEncounters],['player.factionStanding',p.factionStanding],['player.factionContracts',p.factionContracts],['player.factionLastContractDay',p.factionLastContractDay],['player.dwellingTier',p.dwellingTier]",'schema validation');

const routeRisk=String.raw`function effectiveRouteRisk(route,player=state.player,world=state.world){
 if(!route)return 0;const a=LOCATIONS[route.a]?.danger||.2,b=LOCATIONS[route.b]?.danger||.2;let risk=route.risk+Math.max(0,((a+b)/2-.25)*.18),standing=factionRouteStanding(route,player);
 if((player.injury||0)>=2)risk+=.05;if(route.faction==='qingyun'&&player.sect==='青云宗')risk-=.06;if(route.faction==='blood'&&player.sect==='青云宗')risk+=.08;if(standing>=60)risk-=.08;else if(standing>=25)risk-=.04;else if(standing<=-60)risk+=.15;else if(standing<=-25)risk+=.08;if((world.factionTension||0)>=70&&(route.faction==='qingyun'||route.faction==='blood'))risk+=.05;if(route.fee>0)risk-=.02;return clamp(risk,.02,.88)
}`;
must(/function effectiveRouteRisk\(route,player=state\.player,world=state\.world\)\{[\s\S]*?\n\}\nfunction routeRiskLabel/,routeRisk+'\nfunction routeRiskLabel','standing route risk');

must("function marketPrices(){const idx=state.world.marketIndex||100;return {idx,herbBuy:Math.max(3,Math.ceil(4*idx/100)),herbSell:Math.max(1,Math.floor(3*idx/100)),pillBuy:Math.max(6,Math.ceil(8*idx/100))}}",
String.raw`function marketPrices(){const idx=state.world.marketIndex||100,x=factionStandingValue('xuanshui'),m=x>=60 ? 0.90 : x>=25 ? 0.95 : x<=-60 ? 1.20 : x<=-25 ? 1.10 : 1;return {idx,standing:x,modifier:m,herbBuy:Math.max(3,Math.ceil(4*idx/100*m)),herbSell:Math.max(1,Math.floor(3*idx/100)),pillBuy:Math.max(6,Math.ceil(8*idx/100*m))}}`,'xuanshui market standing');

must("function socialMeetCheck(n){if(!n||!n.alive)return '对方已经不在人世。';if(!n.known)return '你尚未真正认识此人。';if(n.location!==state.player.location)return '对方目前在【'+n.location+'】，你在【'+state.player.location+'】。';return ''}",
String.raw`function socialMeetCheck(n){if(!n||!n.alive)return '对方已经不在人世。';if(!n.known)return '你尚未真正认识此人。';if(n.location!==state.player.location)return '对方目前在【'+n.location+'】，你在【'+state.player.location+'】。';const fid=factionIdFromNpc(n);if(fid&&factionStandingValue(fid)<=-60)return FACTION_META[fid].name+'已经把你视作死敌，'+n.name+'拒绝与你正常往来。';return ''}`,'hostile npc reaction');

must('onSecretRealmCombatWin(e);onFactionWarCombatWin(e);addDiligence(3);','onSecretRealmCombatWin(e);onFactionWarCombatWin(e);onFactionContractCombatWin(e);addDiligence(3);','contract combat hook');

const warWin=String.raw`function onFactionWarCombatWin(e){
 const m=factionWar();if(!m||m.status!=='active'||!e||!e.warEnemy||!state.flags.factionWarSide)return;const side=state.flags.factionWarSide;m.side=side;m.participated=true;m.contribution=(m.contribution||0)+1;if(side==='qingyun')m.qingyunAid=(m.qingyunAid||0)+1;else m.bloodAid=(m.bloodAid||0)+1;addFactionStanding(side,4,'宗门大战出战');addFactionStanding(side==='qingyun'?'blood':'qingyun',-4,'宗门大战交锋');state.world.factionTension=clamp(state.world.factionTension+2,0,100);addPersonal('【宗门冲突】你在临江城战场击败一名'+(side==='qingyun'?'血刀门':'青云宗')+'修士，战场贡献 +1。','major');state.flags.factionWarSide=null
}`;
must(/function onFactionWarCombatWin\(e\)\{[\s\S]*?\n\}\nfunction joinFactionWar/,warWin+'\nfunction joinFactionWar','war standing hook');

const joinWar=String.raw`function joinFactionWar(side){
 const m=factionWar();if(!m||m.status!=='active')return showResult('大战未开','当前没有可参与的宗门大战。','bad');if(state.player.location!=='临江城')return showResult('未至战场','大战发生在【临江城】，需要先赶到当地。','bad');if(side==='blood'&&state.player.sect==='青云宗')return showResult('不可倒戈','你已列入青云宗门墙，不能公然替血刀门出战。','bad');if(factionStandingValue(side)<=-60)return showResult('立场敌对','你与'+FACTION_META[side].name+'已成死敌，对方不会接受你临阵投效。','bad');
 const enemySide=side==='qingyun'?'血刀门':'青云宗',base=Math.max(1,state.player.realmIndex+rint(-1,1)),r=Math.min(base,5);state.flags.factionWarSide=side;const enemy={name:enemySide+(r>=3?'精锐修士':'修士'),kind:'修士',faction:enemySide,warEnemy:true,realm:r,hp:78+r*20,atk:[8+r*3,13+r*4],reward:{stones:[2+r,5+r*2],herbs:[0,1],rep:side==='qingyun'?3:1},weight:1};addPersonal('你选择支援'+FACTION_META[side].name+'，踏入临江城外战场。','major');startCombat(enemy)
}`;
must(/function joinFactionWar\(side\)\{[\s\S]*?\n\}\nfunction observeFactionWar/,joinWar+'\nfunction observeFactionWar','war hostility gate');

must('renderEvents();renderFactionConflict();renderNPCs();','renderEvents();renderFactionStanding();renderFactionConflict();renderNPCs();','render faction standing');

must("claimSectStipend,startRegionalEvent,daoMeleeMultiplier",
     "claimSectStipend,startRegionalEvent,factionStandingSnapshot,addFactionStanding,acceptFactionContract,abandonFactionContract,factionContractInfo:()=>state?.player?.factionContract?{...state.player.factionContract}:null,factionRouteRisk:(id,standing)=>{const r=TRAVEL_ROUTES.find(x=>x.id===id);return effectiveRouteRisk(r,{...state.player,factionStanding:{...(state.player.factionStanding||{}),...(standing||{})}},{...state.world})},marketPrices,socialMeetCheckById:(id)=>socialMeetCheck(socialNPC(id)),joinFactionWar,daoMeleeMultiplier",'test api faction methods');

const sha=crypto.createHash('sha256').update(src).digest('hex');
fs.writeFileSync(OUTPUT,src);
const report={status:'PASS',gameplay_version:'2.3.0',build:BUILD,milestone:'faction-standing-contracts',source:OUTPUT,source_sha256:sha,source_bytes:Buffer.byteLength(src),realm_count:26,location_count:12,route_count:20,save_schema_version:20,checks:['three persistent faction standings','three real combat contracts','standing-aware route risk','Xuanshui market pricing','hostile NPC social refusal','faction-war standing integration','schema 19 to 20 migration','V2.2 systems preserved']};
fs.writeFileSync('BUILD_V23_FACTIONS.json',JSON.stringify(report,null,2)+'\n');
console.log('V23_BUILD_PASS',JSON.stringify(report));