import fs from 'fs';
import {JSDOM} from 'jsdom';
const html=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'');
const source=fs.readFileSync('src/game-v39.js','utf8');
if(!source.includes("const VERSION='3.9.0'"))throw new Error('unexpected runtime');
const d=new JSDOM(html,{url:'http://balance.test/',runScripts:'outside-only',pretendToBeVisual:true});
d.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});d.window.scrollTo=()=>{};d.window.console=console;d.window.eval(source);
const api=d.window.__TAIXUAN_TEST__;
if(!api)throw new Error('missing test API');
api.newGame('V310审计');
const keys=Object.keys(api).sort(),state=api.getState();
const snaps={
 v31:api.v31CatalogSnapshot?.(),v32:api.v32CatalogSnapshot?.(),v33:api.v33CatalogSnapshot?.(),v34:api.v34CatalogSnapshot?.(),
 economy:api.v35EconomySnapshot?.(),health:api.v35EconomyHealthSnapshot?.(),shops:api.v35ShopRegistry?.(),listings:api.v35ListingRegistry?.(),
 v36:api.v36CatalogSnapshot?.(),v37:api.v37CatalogSnapshot?.(),v38:api.v38CatalogSnapshot?.(),v39:api.v39CatalogSnapshot?.()
};
const out={version:state.version,schema:state.saveSchemaVersion,apiKeys:keys,initial:{realmIndex:state.player.realmIndex,rootIndex:state.player.rootIndex,lifespan:state.player.lifespan,stones:state.player.spiritStones,herbs:state.player.herbs},realmBalance:api.realmBalance?.(),catalogs:snaps};
fs.writeFileSync('/tmp/V310_AUDIT.json',JSON.stringify(out,null,2)+'\n');
console.log('V310_AUDIT_PASS '+JSON.stringify({version:out.version,schema:out.schema,apiCount:keys.length,initial:out.initial}));
function compact(label,value){console.log(label+' '+JSON.stringify(value));}
const v31=snaps.v31||{};
compact('V310_MANUALS',(v31.manuals||[]).map(x=>({id:x.id,name:x.name,unlock:x.unlock,path:x.path,mult:x.mult,sources:x.sources})));
const v33=snaps.v33||{};
compact('V310_MATERIALS',(v33.materials||[]).map(x=>({id:x.id,name:x.name,qualityId:x.qualityId,locations:x.locations,minRealm:x.minRealm})));
compact('V310_RECIPES',(v33.recipes||[]).map(x=>({id:x.id,name:x.name,unlock:x.unlock,sources:x.sources,ingredients:x.ingredients,effect:x.effect})));
const shops=snaps.shops||{};compact('V310_SHOPS',shops);
const listings=snaps.listings||{};compact('V310_LISTINGS',listings);
compact('V310_V36',snaps.v36);compact('V310_V37',snaps.v37);compact('V310_V38',snaps.v38);
for(const name of ['action','travel','routeInfo','coreRequirements','marketPrices','v33MaterialDropEntries','forgeV32Item','bindV32Artifact','refineV32Artifact','warmV32Artifact','makeNatalV32Artifact','learnV31Manual','learnV31Spell','learnV33Recipe','brewV33Alchemy','v35Quote','v35ShopAccess','v35ListingAccess'])if(typeof api[name]==='function')console.log('V310_FN '+name+' '+String(api[name]).replace(/\s+/g,' '));
