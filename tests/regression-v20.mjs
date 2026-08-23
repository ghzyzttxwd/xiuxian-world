import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v20.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';
const REGIONS=['青石村','青石镇','临江城','黑风岭','青云山','云梦泽','苍梧郡城','赤霞谷','落星矿脉','万兽山脉','古河遗迹','玄阴禁地'];

assert(source.includes("const VERSION='2.0.0'"),'V2.0 gameplay version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=17'),'V2.0 schema 17 missing');
for(const marker of ['高阶灵材','金元丹','养魂丹','赤霄丹剑','玄龟灵甲','元神玉佩','太虚神剑','gearSpellMultiplier','highTierMaterialDrop','rareMaterials','goldenPills','soulPills'])assert(source.includes(marker),`V2.0 marker missing: ${marker}`);
for(const system of ['TRAVEL_ROUTES','craftCoreEssence','craftNascentEssence','craftDeificationEssence','claimSpiritTransformationInheritance','renderSect','renderDwelling','renderSecretRealm','updateFactionConflict','神念斩','元神法域'])assert(source.includes(system),`existing system marker lost: ${system}`);
for(const region of REGIONS)assert(source.includes(`'${region}'`),`region lost: ${region}`);

function cleanHtml(html){return html.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'')}
function makeDom(seed=null){
 const dom=new JSDOM(cleanHtml(htmlRaw),{url:'http://example.test/',runScripts:'outside-only',pretendToBeVisual:true});
 dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
 dom.window.console=console;
 if(seed!==null)dom.window.localStorage.setItem(SAVE_KEY,seed);
 dom.window.eval(source);
 return dom;
}
function dayNum(t){return (t.year-1)*360+(t.month-1)*30+t.day}
function clone(x){return JSON.parse(JSON.stringify(x))}

const dom=makeDom();
const api=dom.window.__TAIXUAN_TEST__;
assert(api,'test API missing');
for(const fn of ['newGame','getState','brewAlchemy','useGoldenPill','useSoulPill','forgeGear','equipGear','gearSpellMultiplier','claimSecretRealmCore','startCombat','combatAction'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);
api.newGame('V20生态回归');
let state=api.getState();
assert.equal(state.version,'2.0.0');
assert.equal(state.saveSchemaVersion,17);
assert.equal(state.player.rareMaterials,0);
assert.equal(state.player.goldenPills,0);
assert.equal(state.player.soulPills,0);
assert.equal(dom.window.document.querySelectorAll('#mapList .map-node').length,12,'12-region map regressed');
assert.equal(api.routeInfo('临江城','云梦泽').length,2,'alternate travel routes regressed');

// Build a real V1.9 schema-16 save and prove migration to schema 17.
const raw=JSON.parse(dom.window.localStorage.getItem(SAVE_KEY));
const prior=clone(raw);
prior.version='1.9.0';prior.saveSchemaVersion=16;prior.player.realmIndex=23;prior.player.progress=0;prior.player.lifespan=2000;prior.player.hp=2800;prior.player.qi=3100;
delete prior.player.rareMaterials;delete prior.player.goldenPills;delete prior.player.soulPills;
const priorDom=makeDom(JSON.stringify(prior));
priorDom.window.document.getElementById('continueBtn').click();
const priorState=priorDom.window.__TAIXUAN_TEST__.getState();
assert.equal(priorState.version,'2.0.0','V1.9 save did not upgrade to V2.0');
assert.equal(priorState.saveSchemaVersion,17,'V1.9 save did not migrate to schema 17');
assert.equal(priorState.player.rareMaterials,0,'rareMaterials migration missing');
assert.equal(priorState.player.goldenPills,0,'goldenPills migration missing');
assert.equal(priorState.player.soulPills,0,'soulPills migration missing');

// Future schema 18 stays protected and is never overwritten.
const future={...prior,saveSchemaVersion:18,version:'future-test'};
const futureRaw=JSON.stringify(future);
const futureDom=makeDom(futureRaw);
futureDom.window.document.getElementById('continueBtn').click();
assert.equal(futureDom.window.localStorage.getItem(SAVE_KEY),futureRaw,'future save was overwritten by V2.0');
assert.equal(futureDom.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded in V2.0');

function highBase(){
 const s=clone(priorState);const p=s.player;
 s.version='2.0.0';s.saveSchemaVersion=17;s.flags={};p.realmIndex=23;p.progress=1200;p.location='古河遗迹';p.lifespan=2000;p.hp=2800;p.qi=0;p.injury=0;p.insight=5;p.alchemyProf=1200;p.herbs=80;p.spiritStones=500;p.beastMaterials=80;p.coreEssence=8;p.nascentEssence=8;p.deificationEssence=4;p.relicFragments=20;p.rareMaterials=20;p.goldenPills=0;p.soulPills=0;p.gearOwned=[];p.equipped={weapon:null,armor:null,charm:null};p.spells={'基础拳脚':0,'神念斩':0,'元神法域':0};p.manual='太虚化神篇';p.manualProf=200;
 return s;
}

// Search deterministic seeds until a real 金元丹 success is observed. Verify costs/time and actual use effect.
let goldenSuccess=null;
for(let seed=1;seed<=160&&!goldenSuccess;seed++){
 const s=highBase();s.rng=seed;const d=makeDom(JSON.stringify(s));d.window.document.getElementById('continueBtn').click();const a=d.window.__TAIXUAN_TEST__;const before=a.getState();a.brewAlchemy('golden');const after=a.getState();
 assert.equal(dayNum(after.time)-dayNum(before.time),2,'金元丹 brew did not consume 2 days');
 assert.equal(after.player.herbs,before.player.herbs-8,'金元丹 herb cost wrong');
 assert.equal(after.player.spiritStones,before.player.spiritStones-12,'金元丹 stone cost wrong');
 assert.equal(after.player.rareMaterials,before.player.rareMaterials-2,'金元丹 rare-material cost wrong');
 assert.equal(after.player.coreEssence,before.player.coreEssence-1,'金元丹 core cost wrong');
 if(after.player.goldenPills>0)goldenSuccess={d,a,after};
}
assert(goldenSuccess,'deterministic regression never observed 金元丹 success');
{
 const {a}=goldenSuccess;const before=a.getState();a.useGoldenPill();const after=a.getState();
 assert.equal(after.player.goldenPills,before.player.goldenPills-1,'金元丹 was not consumed');
 assert(after.player.progress>before.player.progress,'金元丹 did not increase cultivation');
 assert.equal(after.player.qi,3100,'金元丹 did not restore full qi at 化神初期');
 assert(after.player.manualProf>before.player.manualProf,'金元丹 did not improve manual proficiency');
}

// Search deterministic seeds until a real 养魂丹 success is observed. Verify use heals, restores qi and grants insight.
let soulSuccess=null;
for(let seed=1;seed<=160&&!soulSuccess;seed++){
 const s=highBase();s.rng=seed;s.player.injury=2;s.player.insight=0;const d=makeDom(JSON.stringify(s));d.window.document.getElementById('continueBtn').click();const a=d.window.__TAIXUAN_TEST__;const before=a.getState();a.brewAlchemy('soul');const after=a.getState();
 assert.equal(dayNum(after.time)-dayNum(before.time),3,'养魂丹 brew did not consume 3 days');
 assert.equal(after.player.herbs,before.player.herbs-10,'养魂丹 herb cost wrong');
 assert.equal(after.player.spiritStones,before.player.spiritStones-20,'养魂丹 stone cost wrong');
 assert.equal(after.player.rareMaterials,before.player.rareMaterials-3,'养魂丹 rare-material cost wrong');
 assert.equal(after.player.nascentEssence,before.player.nascentEssence-1,'养魂丹 nascent cost wrong');
 if(after.player.soulPills>0)soulSuccess={d,a,after};
}
assert(soulSuccess,'deterministic regression never observed 养魂丹 success');
{
 const {a}=soulSuccess;let before=a.getState();before.player.injury=2;before.player.qi=0;before.player.insight=0;const reset=makeDom(JSON.stringify(before));reset.window.document.getElementById('continueBtn').click();const ra=reset.window.__TAIXUAN_TEST__;const b=ra.getState();ra.useSoulPill();const after=ra.getState();
 assert.equal(after.player.soulPills,b.player.soulPills-1,'养魂丹 was not consumed');
 assert.equal(after.player.injury,1,'养魂丹 did not reduce injury by one tier');
 assert.equal(after.player.insight,b.player.insight+1,'养魂丹 did not grant insight');
 assert.equal(after.player.qi,3100,'养魂丹 did not restore full qi');
}

// High-tier secret-realm cores must feed the same rare-material loop.
{
 const s=highBase();const today=dayNum(s.time);s.world.secretRealm={id:'v20-secret',name:'回归秘境',location:'古河遗迹',guardian:'守关残魂',desc:'test',openDay:today-1,closeDay:today+20,threat:8,stage:2,foraged:true,cleared:false};s.world.nextSecretRealmDay=today+50;
 const d=makeDom(JSON.stringify(s));d.window.document.getElementById('continueBtn').click();const a=d.window.__TAIXUAN_TEST__;const before=a.getState();a.claimSecretRealmCore();const after=a.getState();
 assert.equal(after.player.rareMaterials,before.player.rareMaterials+2,'化神期 secret core did not grant 2 high-tier materials');
 assert.equal(after.player.secretRealmClears,before.player.secretRealmClears+1,'secret realm clear counter regressed');
 assert(after.world.secretRealm.cleared,'secret realm core did not mark realm cleared');
}

// Forge a real 化神法宝 and verify all high-tier costs and persistent spell amplification.
let forgedState;
{
 const s=highBase();s.player.realmIndex=23;s.player.deificationEssence=3;s.player.rareMaterials=12;s.player.beastMaterials=30;s.player.spiritStones=300;const d=makeDom(JSON.stringify(s));d.window.document.getElementById('continueBtn').click();const a=d.window.__TAIXUAN_TEST__;const before=a.getState();a.forgeGear('taixu');const after=a.getState();
 assert(after.player.gearOwned.includes('taixu'),'太虚神剑 was not forged');
 assert.equal(after.player.equipped.weapon,'taixu','太虚神剑 was not auto-equipped');
 assert.equal(after.player.beastMaterials,before.player.beastMaterials-20,'太虚神剑 beast-material cost wrong');
 assert.equal(after.player.spiritStones,before.player.spiritStones-220,'太虚神剑 stone cost wrong');
 assert.equal(after.player.rareMaterials,before.player.rareMaterials-7,'太虚神剑 rare-material cost wrong');
 assert.equal(after.player.deificationEssence,before.player.deificationEssence-1,'太虚神剑 deification cost wrong');
 assert.equal(dayNum(after.time)-dayNum(before.time),6,'太虚神剑 forge did not consume 6 days');
 assert(Math.abs(a.gearSpellMultiplier()-1.22)<1e-9,'太虚神剑 spell multiplier is not +22%');
 forgedState=after;
}

// Same RNG, same target, same spell: equipped 太虚神剑 must cause strictly more 神念斩 damage.
{
 const base=highBase();base.rng=777;base.player.realmIndex=23;base.player.qi=3100;base.player.spells={'基础拳脚':0,'神念斩':0,'元神法域':0};base.player.gearOwned=[];base.player.equipped={weapon:null,armor:null,charm:null};
 const geared=clone(base);geared.player.gearOwned=['taixu'];geared.player.equipped.weapon='taixu';
 function oneHit(s){const d=makeDom(JSON.stringify(s));d.window.document.getElementById('continueBtn').click();const a=d.window.__TAIXUAN_TEST__;a.startCombat('玄阴化神残魂');const hp=a.getCombat().enemyHp;a.combatAction('divine');const c=a.getCombat();return hp-c.enemyHp}
 const plain=oneHit(base),boosted=oneHit(geared);assert(boosted>plain,`法宝未提高神念斩伤害: plain=${plain}, boosted=${boosted}`);
}

// The top high-realm enemy must feed rare materials through the real combat reward path.
{
 const s=forgedState;s.rng=888;s.player.realmIndex=25;s.player.hp=4200;s.player.qi=5100;s.player.spells={'基础拳脚':0,'神念斩':300,'元神法域':100};s.player.manual='太虚化神篇';const d=makeDom(JSON.stringify(s));d.window.document.getElementById('continueBtn').click();const a=d.window.__TAIXUAN_TEST__;const before=a.getState().player.rareMaterials;a.startCombat('玄阴化神残魂');for(let i=0;i<20&&a.getCombat();i++)a.combatAction('divine');assert.equal(a.getCombat(),null,'top high-realm enemy combat did not finish');const after=a.getState();assert(after.player.battleWins>=1,'top high-realm enemy was not defeated');assert(after.player.rareMaterials>=before+1,'top high-realm enemy did not drop guaranteed high-tier material');
}

console.log('V20_REGRESSION_PASS',JSON.stringify({version:'2.0.0',schema:17,realms:26,regions:12,routes:20,rareMaterialLoop:true,goldenPill:true,soulPill:true,secretRealmRare:true,highGear:true,spellAmplification:true,v19SaveUpgrade:true,futureSaveProtected:true}));
