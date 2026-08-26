import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';
const INDEX='index.html',GAME='src/game-v310.js',SAVE_KEY='xiuxian_world_v02';
const html=fs.readFileSync(INDEX,'utf8').replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'');
const source=fs.readFileSync(GAME,'utf8');
assert(source.includes("const VERSION='3.10.0'"));assert(source.includes('const SAVE_SCHEMA_VERSION=36'));assert(source.includes('const CONTENT_STATE_VERSION=10'));assert(source.includes('realmM=Math.max(1,Number(realm().rate)||1)'));assert(!/\beval\s*\(/.test(source));
function dom(seed=null){const d=new JSDOM(html,{url:'http://v310.test/',runScripts:'outside-only',pretendToBeVisual:true});d.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});d.window.scrollTo=()=>{};d.window.console=console;if(seed!==null)d.window.localStorage.setItem(SAVE_KEY,seed);d.window.eval(source);return d}
let d=dom(),api=d.window.__TAIXUAN_TEST__;api.newGame('V310回归');let s=api.getState();assert.equal(s.version,'3.10.0');assert.equal(s.saveSchemaVersion,36);assert.equal(s.player.contentStateVersion,10);

// V3.9 terminal content must exist in the canonical stable registries, not in unrelated player state.
const reg=api.contentRegistrySnapshot();assert.equal(reg.counts.materials,94);assert.equal(reg.counts.regions,27);assert(!Object.prototype.hasOwnProperty.call(reg.regions,'null'),'terminal regions collapsed into null registry key');
const expectedRegions={'region-immortal-tribulation-sea':'仙劫雷海','region-immortal-mortal-rift':'仙凡界隙','region-ascension-heaven-gate':'飞升天门'};for(const [id,name] of Object.entries(expectedRegions)){assert.equal(reg.regions[id]?.name,name,id);assert.equal(reg.regions[id]?.id,id)}
const expectedMaterials={
 'mat-v39-thunder-crystal':['九转劫雷晶','九霄劫台'],'mat-v39-soul-amber':['镇魂仙珀','九霄劫台'],'mat-v39-immortal-dust':['仙凡蜕尘','仙凡界隙'],'mat-v39-heaven-gate-rune':['天门道纹','飞升天门'],'mat-v39-heart-mirror':['明心镜核','九霄劫台'],'mat-v39-tribulation-gold':['定劫仙金','九霄劫台'],'mat-v39-nirvana-dew':['涅槃仙露','仙凡界隙'],'mat-v39-ascension-aura':['引仙灵息','仙凡界隙'],'mat-v39-life-thread':['续命仙丝','九霄劫台'],'mat-v39-tribulation-essence':['万劫真髓','九霄劫台']};
for(const [id,[name,location]] of Object.entries(expectedMaterials)){const m=reg.materials[id];assert(m,id);assert.equal(m.id,id);assert.equal(m.name,name);assert(m.locations.includes(location),`${id} source missing ${location}`)}
const contractAnchor="p.factionContract={faction:id,title:d.contract,progress:0,need:d.need,acceptedDay:dayNumber()}",cpos=source.indexOf(contractAnchor);assert(cpos>=0,'clean faction contract missing');const ctail=source.slice(cpos,cpos+contractAnchor.length+40);assert(!ctail.includes('mat-v39-'));assert(!ctail.includes('region-immortal-'));

// The existing realm-rate table must materially affect cultivation instead of being dead data.
api.v38SetPlayerForTest({realmIndex:0});const low=api.cultivationGainForDays(100);api.v38SetPlayerForTest({realmIndex:34});const high=api.cultivationGainForDays(100);assert(high>low*20,`realm cultivation rate not applied: low=${low} high=${high}`);
// With an ordinary low root (0.9) and the best normally unlocked manual, high-realm cultivation remains slow but lifespan-feasible.
const realms=api.realmBalance(),manuals=api.v31CatalogSnapshot().manuals,rows=[];for(let i=34;i<=37;i++){const r=realms[i],best=manuals.filter(m=>(m.unlock??999)<=i&&Number(m.mult)>0).sort((a,b)=>Number(b.mult)-Number(a.mult))[0];assert(best);const avgDaily=8*.9*best.mult*r.rate,years=r.need/avgDaily/365;rows.push({i,name:r.name,years,best:best.name});assert(years<600,`${r.name} still lifespan-deadlocked: ${years.toFixed(1)} years`)}for(let i=1;i<rows.length;i++)assert(rows[i].years>rows[i-1].years*.95,'high realms should not become dramatically faster');

// V3.8 pre-Mahayana circular gate repair: realm 33 must be able to reach the two
// preparation locations and execute the normal (non-force) authority action.
api.v38SetPlayerForTest({realmIndex:33,location:'界源海',originInsight:30,authority:0,lawProficiency:180,unity:110,insight:100,injury:0});
api.v36SetPlayerForTest({spaceInsight:60});
const fromOrigin=(api.routeInfo('界源海')||[]).find(r=>r.id==='originsea-ancestral');assert(fromOrigin,'originsea-ancestral route missing');assert.equal(fromOrigin.minRealm,33,'ancestral route still locked behind Mahayana');
const fromAncestral=(api.routeInfo('天穹祖脉')||[]).find(r=>r.id==='ancestral-council');assert(fromAncestral,'ancestral-council route missing');assert.equal(fromAncestral.minRealm,33,'council route still locked behind Mahayana');
api.v38SetPlayerForTest({realmIndex:33,location:'人界议庭',originInsight:30,authority:0,lawProficiency:180,unity:110,injury:0});
const authorityBefore=api.getState().player.v38WorldAuthority;const authorityResult=api.v38ExerciseWorldAuthority();assert.equal(authorityResult?.ok,true,'realm 33 normal world-authority action still blocked');assert(api.getState().player.v38WorldAuthority>authorityBefore,'world authority did not increase');
assert(source.includes("if(p.realmIndex<33&&!force)return {ok:false,reason:'realm'};if((inv.originMarks||0)>=9)"),'realm 33 natal-origin production gate repair missing');

// Same-schema V3.9 saves load without losing terminal systems; no fake schema bump for a balance-only release.
// Use a fresh game here so this migration assertion cannot inherit location/realm mutations from the gate test above.
const md=dom(),ma=md.window.__TAIXUAN_TEST__;ma.newGame('V310迁移');let old=ma.getState();old.version='3.9.0';old.player.v38OriginInsight=211;old.player.v38WorldAuthority=123;old.player.v39TribulationAttempt=2;const rd=dom(JSON.stringify(old));rd.window.document.getElementById('continueBtn').click();const ra=rd.window.__TAIXUAN_TEST__,rs=ra.getState();assert.equal(rs.version,'3.10.0');assert.equal(rs.saveSchemaVersion,36);assert.equal(rs.player.v38OriginInsight,211);assert.equal(rs.player.v38WorldAuthority,123);assert.equal(rs.player.v39TribulationAttempt,2);assert.equal(rs.player.regionId,'region-qingshi-village');
const future=ra.getState();future.saveSchemaVersion=37;future.version='future-v310';const raw=JSON.stringify(future),fd=dom(raw);fd.window.document.getElementById('continueBtn').click();assert.equal(fd.window.localStorage.getItem(SAVE_KEY),raw);assert.equal(fd.window.__TAIXUAN_TEST__.getState(),null);
console.log('V310_REGRESSION_PASS '+JSON.stringify({version:'3.10.0',schema:36,registry:10,realmRateApplied:true,highRealmYears:rows.map(x=>Math.round(x.years)),stableMaterials:reg.counts.materials,stableRegions:reg.counts.regions,factionContractPollutionRemoved:true,preMahayanaGateReachable:true,v39SavePreserved:true,futureSaveProtected:true}));
