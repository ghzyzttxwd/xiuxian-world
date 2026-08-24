import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';
const INDEX='index.html',GAME='src/game-v310.js',SAVE_KEY='xiuxian_world_v02';
const html=fs.readFileSync(INDEX,'utf8').replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'');
const source=fs.readFileSync(GAME,'utf8');
assert(source.includes("const VERSION='3.10.0'"));
assert(source.includes('const SAVE_SCHEMA_VERSION=36'));
assert(source.includes('const CONTENT_STATE_VERSION=10'));
assert(source.includes('realmM=Math.max(1,Number(realm().rate)||1)'));
assert(!/\beval\s*\(/.test(source));
function dom(seed=null){const d=new JSDOM(html,{url:'http://v310.test/',runScripts:'outside-only',pretendToBeVisual:true});d.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});d.window.scrollTo=()=>{};d.window.console=console;if(seed!==null)d.window.localStorage.setItem(SAVE_KEY,seed);d.window.eval(source);return d}
let d=dom(),api=d.window.__TAIXUAN_TEST__;api.newGame('V310回归');let s=api.getState();
assert.equal(s.version,'3.10.0');assert.equal(s.saveSchemaVersion,36);assert.equal(s.player.contentStateVersion,10);
// The existing realm-rate table must now materially affect cultivation instead of being dead data.
api.v38SetPlayerForTest({realmIndex:0});const low=api.cultivationGainForDays(100);
api.v38SetPlayerForTest({realmIndex:34});const high=api.cultivationGainForDays(100);
assert(high>low*20,`realm cultivation rate not applied: low=${low} high=${high}`);
// With an ordinary low root (0.9) and the best normally unlocked manual, high-realm cultivation remains slow but lifespan-feasible.
const realms=api.realmBalance(), manuals=api.v31CatalogSnapshot().manuals;
const rows=[];for(let i=34;i<=37;i++){const r=realms[i],best=manuals.filter(m=>(m.unlock??999)<=i&&Number(m.mult)>0).sort((a,b)=>Number(b.mult)-Number(a.mult))[0];assert(best);const avgDaily=8*.9*best.mult*r.rate;const years=r.need/avgDaily/365;rows.push({i,name:r.name,years,best:best.name});assert(years<600,`${r.name} still lifespan-deadlocked: ${years.toFixed(1)} years`)}
for(let i=1;i<rows.length;i++)assert(rows[i].years>rows[i-1].years*.95,'high realms should not become dramatically faster');
// Same-schema V3.9 saves must load without losing terminal systems; no fake schema bump was introduced for a pure balance release.
let old=api.getState();old.version='3.9.0';old.player.v38OriginInsight=211;old.player.v38WorldAuthority=123;old.player.v39TribulationAttempt=2;const rd=dom(JSON.stringify(old));rd.window.document.getElementById('continueBtn').click();const ra=rd.window.__TAIXUAN_TEST__,rs=ra.getState();assert.equal(rs.version,'3.10.0');assert.equal(rs.saveSchemaVersion,36);assert.equal(rs.player.v38OriginInsight,211);assert.equal(rs.player.v38WorldAuthority,123);assert.equal(rs.player.v39TribulationAttempt,2);
const future=ra.getState();future.saveSchemaVersion=37;future.version='future-v310';const raw=JSON.stringify(future),fd=dom(raw);fd.window.document.getElementById('continueBtn').click();assert.equal(fd.window.localStorage.getItem(SAVE_KEY),raw);assert.equal(fd.window.__TAIXUAN_TEST__.getState(),null);
console.log('V310_REGRESSION_PASS '+JSON.stringify({version:'3.10.0',schema:36,registry:10,realmRateApplied:true,highRealmYears:rows.map(x=>Math.round(x.years)),v39SavePreserved:true,futureSaveProtected:true}));
