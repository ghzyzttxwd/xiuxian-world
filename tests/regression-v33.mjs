import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const INDEX_PATH=process.env.INDEX_PATH||'index.html';
const GAME_PATH=process.env.GAME_PATH||'src/game-v33.js';
const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8');
const source=fs.readFileSync(GAME_PATH,'utf8');
const SAVE_KEY='xiuxian_world_v02';
assert(source.includes("const VERSION='3.3.0'"),'V3.3 version missing');
assert(source.includes('const SAVE_SCHEMA_VERSION=30'),'schema30 missing');
for(const marker of ['V33_MATERIAL_CATALOG','V33_RECIPE_CATALOG','materialInventoryById','pillInventoryById','knownRecipeIds','pillToxicity','pillToleranceById','alchemyBestQualityByRecipe','gatherV33Material','brewV33Alchemy','useV33Pill'])assert(source.includes(marker),`missing V3.3 marker ${marker}`);
function cleanHtml(html){return html.replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'')}
function makeDom(seed=null){const dom=new JSDOM(cleanHtml(htmlRaw),{url:'http://example.test/',runScripts:'outside-only',pretendToBeVisual:true});dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});dom.window.scrollTo=()=>{};dom.window.console=console;if(seed!==null)dom.window.localStorage.setItem(SAVE_KEY,seed);dom.window.eval(source);return dom}
function loadState(obj){const d=makeDom(JSON.stringify(obj));d.window.document.getElementById('continueBtn').click();return d}
function fresh(){const d=makeDom(),api=d.window.__TAIXUAN_TEST__;api.newGame('V33回归');return {d,api}}
function stripV33(p){for(const k of ['materialInventoryById','pillInventoryById','knownRecipeIds','pillToxicity','pillToleranceById','alchemyBuffs','alchemyBestQualityByRecipe','alchemySuccesses','alchemyFailures','pillsConsumed','lifeExtensionPillsUsed'])delete p[k]}
const {api}=fresh();assert(api,'test API missing');
for(const fn of ['v33CatalogSnapshot','v33MaterialCount','v33AddMaterial','gatherV33Material','learnV33Recipe','brewV33Alchemy','useV33Pill','v33BuffValue','v33BuffMultiplier','v33DecayAlchemy','v33AlchemyChance','v33MaterialDropEntries','ensureV33AlchemyShape','syncV33AlchemyState','contentRegistrySnapshot','maxHp','breakthroughChance','v32CatalogSnapshot'])assert.equal(typeof api[fn],'function',`test API missing ${fn}`);
let s=api.getState();assert.equal(s.version,'3.3.0');assert.equal(s.saveSchemaVersion,30);assert.equal(s.player.contentStateVersion,4);assert.equal(s.player.knownRecipeIds.length,4);assert.equal(s.player.pillToxicity,0);
const cat=api.v33CatalogSnapshot();assert.equal(cat.materials,48);assert.equal(cat.namedMaterials,40);assert.equal(cat.recipes,24);assert.equal(cat.defaultRecipes,4);assert.deepEqual(cat.grades,['common','fine','superior','perfect']);assert.equal(cat.sources.length,12);
const reg=api.contentRegistrySnapshot();assert.equal(reg.registryVersion,4);assert.equal(reg.counts.materials,48);assert.equal(reg.counts.recipes,24);assert.equal(reg.counts.manuals,28);assert.equal(reg.counts.spells,60);assert.equal(Object.keys(reg.artifacts).length,24);assert.equal(Object.values(reg.items).filter(x=>x.type==='consumable').length,24);

// schema29 -> 30 preserves all eight legacy material fields and four legacy pill stacks.
const old=api.getState();old.version='3.2.0';old.saveSchemaVersion=29;old.player.contentStateVersion=3;old.player.spiritStones=77;old.player.herbs=12;old.player.beastMaterials=9;old.player.rareMaterials=8;old.player.relicFragments=7;old.player.coreEssence=6;old.player.nascentEssence=5;old.player.deificationEssence=4;old.player.healingPills=3;old.player.qiPills=2;old.player.goldenPills=1;old.player.soulPills=4;stripV33(old.player);
const od=loadState(old),oa=od.window.__TAIXUAN_TEST__,os=oa.getState();assert.equal(os.version,'3.3.0');assert.equal(os.saveSchemaVersion,30);assert.equal(os.player.materialInventoryById['mat-spirit-stone'],77);assert.equal(os.player.materialInventoryById['mat-spirit-herb'],12);assert.equal(os.player.materialInventoryById['mat-beast-material'],9);assert.equal(os.player.materialInventoryById['mat-rare-material'],8);assert.equal(os.player.materialInventoryById['mat-relic-fragment'],7);assert.equal(os.player.materialInventoryById['mat-core-essence'],6);assert.equal(os.player.materialInventoryById['mat-nascent-essence'],5);assert.equal(os.player.materialInventoryById['mat-deification-essence'],4);assert.equal(os.player.pillInventoryById['recipe-healing'].common,3);assert.equal(os.player.pillInventoryById['recipe-qi'].common,2);assert.equal(os.player.pillInventoryById['recipe-golden'].common,1);assert.equal(os.player.pillInventoryById['recipe-soul'].common,4);

// Named materials have explicit map sources and can be gathered into stable inventory.
assert.equal(oa.v33MaterialCount('mat-v33-greenleaf'),0);const g=oa.gatherV33Material('青石村','mat-v33-greenleaf');assert(g&&g.name==='青叶草');assert(oa.v33MaterialCount('mat-v33-greenleaf')>=1);const drops=oa.v33MaterialDropEntries({areas:['黑风岭'],realm:3,kind:'妖兽'});assert(drops.some(x=>x.materialId==='mat-v33-wolf-blood-crystal'),'enemy/material source loop missing');

// Recipe acquisition is location/realm/cost gated rather than globally granted.
let gate=oa.getState();gate.player.realmIndex=6;gate.player.location='青石村';gate.player.spiritStones=999;gate.player.insight=99;let gd=loadState(gate),ga=gd.window.__TAIXUAN_TEST__;assert.equal(ga.learnV33Recipe('recipe-v33-solid-origin',false),'location');gate=ga.getState();gate.player.location='青云山';gd=loadState(gate);ga=gd.window.__TAIXUAN_TEST__;const stoneBefore=ga.getState().player.spiritStones;assert.equal(ga.learnV33Recipe('recipe-v33-solid-origin',false),'learned');assert(ga.getState().player.spiritStones<stoneBefore,'recipe learning cost not consumed');

// Successful brewing consumes named ingredients and can produce deterministic high quality for regression.
ga.v33AddMaterial('mat-v33-qingyun-lingzhi',4);ga.v33AddMaterial('mat-v33-cloudglow-grass',6);const m0=ga.v33MaterialCount('mat-v33-qingyun-lingzhi');assert.equal(ga.brewV33Alchemy('recipe-v33-solid-origin',{forceSuccess:true,grade:'perfect',noTime:true}),'perfect');let st=ga.getState();assert.equal(st.player.pillInventoryById['recipe-v33-solid-origin'].perfect,1);assert(ga.v33MaterialCount('mat-v33-qingyun-lingzhi')<m0);assert.equal(st.player.alchemyBestQualityByRecipe['recipe-v33-solid-origin'],'perfect');

// Failure destroys the batch but still grants failure experience.
ga.v33AddMaterial('mat-v33-qingyun-lingzhi',2);ga.v33AddMaterial('mat-v33-cloudglow-grass',2);const prof0=ga.getState().player.alchemyProf,failMat0=ga.v33MaterialCount('mat-v33-qingyun-lingzhi');assert.equal(ga.brewV33Alchemy('recipe-v33-solid-origin',{forceSuccess:false,noTime:true}),'failed');assert(ga.v33MaterialCount('mat-v33-qingyun-lingzhi')<failMat0);assert(ga.getState().player.alchemyProf>prof0);assert(ga.getState().player.alchemyFailures>=1);

// Pill quality has a real temporary build effect; toxicity and same-pill tolerance accumulate.
assert.equal(ga.brewV33Alchemy('recipe-v33-solid-origin',{forceSuccess:true,grade:'fine',noTime:true}),'fine');const hp0=ga.maxHp();let use=ga.useV33Pill('recipe-v33-solid-origin','perfect');assert.equal(typeof use,'object');assert(ga.v33BuffValue('hp')>0);assert(ga.maxHp()>hp0);const tox1=ga.getState().player.pillToxicity,tol1=ga.getState().player.pillToleranceById['recipe-v33-solid-origin'];use=ga.useV33Pill('recipe-v33-solid-origin','fine');assert.equal(typeof use,'object');assert(ga.getState().player.pillToxicity>tox1);assert(ga.getState().player.pillToleranceById['recipe-v33-solid-origin']>tol1);
const tox2=ga.getState().player.pillToxicity;ga.v33DecayAlchemy(10);assert(ga.getState().player.pillToxicity<tox2,'toxicity did not decay with time');

// Breakthrough and high-risk burst pills expose real mechanical modifiers.
let high=ga.getState();high.player.realmIndex=18;high.player.location='赤霞谷';high.player.daoPath='none';high.player.spiritStones=999;high.player.insight=99;high.player.materialInventoryById['mat-v33-redflame-flower']=10;high.player.materialInventoryById['mat-v33-firelizard-gall']=10;high.player.materialInventoryById['mat-v33-wolf-blood-crystal']=10;let hd=loadState(high),ha=hd.window.__TAIXUAN_TEST__;assert.equal(ha.learnV33Recipe('recipe-v33-desperate',true),'learned');assert.equal(ha.brewV33Alchemy('recipe-v33-desperate',{forceSuccess:true,grade:'common',noTime:true}),'common');assert.equal(typeof ha.useV33Pill('recipe-v33-desperate','common'),'object');assert(ha.v33BuffMultiplier('damage')>1);assert(ha.v33BuffMultiplier('incoming')>1,'high-risk burst pill missing downside');
let br=ha.getState();br.player.location='苍梧郡城';br.player.realmIndex=9;br.player.spiritStones=999;br.player.insight=99;br.player.materialInventoryById['mat-v33-purple-sun-flower']=5;br.player.materialInventoryById['mat-v33-alchemy-cinnabar']=5;const bd=loadState(br),ba=bd.window.__TAIXUAN_TEST__;assert.equal(ba.learnV33Recipe('recipe-v33-barrierbreak',true),'learned');assert.equal(ba.brewV33Alchemy('recipe-v33-barrierbreak',{forceSuccess:true,grade:'common',noTime:true}),'common');const chance0=ba.breakthroughChance();assert.equal(typeof ba.useV33Pill('recipe-v33-barrierbreak','common'),'object');assert(ba.breakthroughChance()>chance0,'breakthrough pill has no real effect');

// V3.2 artifact and V3.1 manual/spell systems remain intact.
assert.equal(ba.v32CatalogSnapshot().equipment,60);assert.equal(ba.v32CatalogSnapshot().artifacts,24);assert.equal(ba.v31CatalogSnapshot().manuals.length,28);assert.equal(ba.v31CatalogSnapshot().spells.length,60);assert.equal(ba.realmBalance().length,26);

// Save/reload keeps materials, recipes, grades, toxicity and tolerance.
const saved=ba.getState(),rd=loadState(saved),ra=rd.window.__TAIXUAN_TEST__,rs=ra.getState();assert(rs.player.knownRecipeIds.includes('recipe-v33-barrierbreak'));assert(rs.player.materialInventoryById&&typeof rs.player.materialInventoryById==='object');assert(rs.player.pillInventoryById['recipe-v33-barrierbreak']);assert(rs.player.pillToxicity>=0);assert(rs.player.pillToleranceById['recipe-v33-barrierbreak']>=1);

// Future schema31 is protected from overwrite.
const future=ra.getState();future.saveSchemaVersion=31;future.version='future-v33';const futureRaw=JSON.stringify(future);const fd=makeDom(futureRaw);fd.window.document.getElementById('continueBtn').click();assert.equal(fd.window.localStorage.getItem(SAVE_KEY),futureRaw,'future schema was overwritten');assert.equal(fd.window.__TAIXUAN_TEST__.getState(),null,'future schema unexpectedly loaded');
console.log('V33_REGRESSION_PASS',JSON.stringify({version:'3.3.0',schema:30,materials:48,namedMaterials:40,recipes:24,recipeAcquisition:true,qualityGrades:4,successFailure:true,toxicity:true,tolerance:true,timeDecay:true,mapSources:true,enemyDropSources:true,temporaryBuffs:true,highRiskBurst:true,breakthroughPills:true,legacyMaterialsPreserved:true,legacyPillsPreserved:true,v32Preserved:true,futureSaveProtected:true}));
