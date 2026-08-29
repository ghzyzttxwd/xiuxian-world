import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const source=fs.readFileSync('src/game-v310.js','utf8');
const contract='"id":"mat-v37-domain-sand","name":"领域砂","qualityId":"di","kind":"mineral","locations":["天衡战城","万象法坛"],"minRealm":29,"combatKinds":["法则异灵"]';
assert(source.includes(contract),'领域砂 authored combat-kind/source contract drifted');
assert(source.includes('"danger":0.68,"herb":0,"work":[6,12],"find":[10,20],"faction":"天渊盟 / 边荒战部","specialty":"战印、领域砂与高阶战功","secret":2.8,"eventRate":0.24,"eventKind":"materials"}'),'天衡战城 danger/event topology drifted');
assert(source.includes('"danger":0.84,"herb":1,"work":[0,1],"find":[13,28],"faction":"古修法坛 / 天渊盟封锁","specialty":"领域砂、法相骨与天则灵液","secret":4,"eventRate":0.24,"eventKind":"insight"}'),'万象法坛 danger/event topology drifted');

const html=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'');
const dom=new JSDOM(html,{url:'http://v310-domain-sand.test/',runScripts:'outside-only',pretendToBeVisual:true});
dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
dom.window.scrollTo=()=>{};
dom.window.console={...console,log(){},info(){},debug(){}};
dom.window.eval(source);
const api=dom.window.__TAIXUAN_TEST__;
assert(api,'domain-sand regression missing test API');
api.newGame('领域砂来源审计');
const reg=api.contentRegistrySnapshot();
const material=reg.materials['mat-v37-domain-sand'];
assert(material,'领域砂 missing from stable material registry');
assert.deepEqual(Array.from(material.locations),['天衡战城','万象法坛']);

const dropsByEnemy=new Map(Object.values(reg.drops).map(d=>[d.enemyId,d]));
function regionEvidence(name){
 const region=Object.values(reg.regions).find(r=>r.name===name);
 assert(region,`missing region ${name}`);
 const enemies=Object.values(reg.enemies).filter(e=>(e.areas||[]).includes(region.id));
 const productive=enemies.filter(e=>(dropsByEnemy.get(e.id)?.entries||[]).some(x=>x.materialId==='mat-v37-domain-sand'));
 return {region:region.id,enemies:enemies.map(e=>({id:e.id,name:e.name,kind:e.kind})),productive:productive.map(e=>({id:e.id,name:e.name,kind:e.kind}))};
}
const tianheng=regionEvidence('天衡战城');
const wanxiang=regionEvidence('万象法坛');
assert.equal(tianheng.productive.length,0,'天衡战城 unexpectedly has a productive 领域砂 combat source; V64 assumption must be retired');
assert(wanxiang.productive.length>0,'万象法坛 no longer has a productive 领域砂 combat source');
assert(wanxiang.productive.every(e=>e.kind==='法则异灵'),'万象法坛 productive 领域砂 enemy kind drifted');

const tianhengDirectGatherWindow=Math.max(0,Math.min(1,.68+.24+.30)-Math.min(1,.68+.24+.22));
const wanxiangDirectGatherWindow=Math.max(0,Math.min(1,.84+.24+.30)-Math.min(1,.84+.24+.22));
assert.equal(tianhengDirectGatherWindow,0);
assert.equal(wanxiangDirectGatherWindow,0);

console.log('V310_DOMAIN_SAND_SOURCE_REGRESSION_PASS '+JSON.stringify({material:'mat-v37-domain-sand',combatKind:'法则异灵',locations:['天衡战城','万象法坛'],tianheng:{directGatherWindow:tianhengDirectGatherWindow,enemyKinds:[...new Set(tianheng.enemies.map(x=>x.kind))],productiveEnemies:tianheng.productive.length},wanxiang:{directGatherWindow:wanxiangDirectGatherWindow,enemyKinds:[...new Set(wanxiang.enemies.map(x=>x.kind))],productiveEnemies:wanxiang.productive.length,productiveNames:wanxiang.productive.map(x=>x.name)},gameplaySourceUnchanged:true}));
