import fs from 'fs';
import {JSDOM} from 'jsdom';
const html=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'');
const source=fs.readFileSync('src/game-v39.js','utf8');
if(!source.includes("const VERSION='3.9.0'"))throw new Error('unexpected runtime');
const d=new JSDOM(html,{url:'http://balance.test/',runScripts:'outside-only',pretendToBeVisual:true});d.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});d.window.scrollTo=()=>{};d.window.console=console;d.window.eval(source);
const api=d.window.__TAIXUAN_TEST__;if(!api)throw new Error('missing test API');api.newGame('V310审计');
const keys=Object.keys(api).sort(),state=api.getState();
const snaps={v31:api.v31CatalogSnapshot?.(),shops:api.v35ShopRegistry?.(),listings:api.v35ListingRegistry?.(),v36:api.v36CatalogSnapshot?.(),v37:api.v37CatalogSnapshot?.(),v38:api.v38CatalogSnapshot?.(),v39:api.v39CatalogSnapshot?.()};
const realms=api.realmBalance?.()||[];
const out={version:state.version,schema:state.saveSchemaVersion,apiKeys:keys,initial:{realmIndex:state.player.realmIndex,rootIndex:state.player.rootIndex,lifespan:state.player.lifespan,stones:state.player.spiritStones,herbs:state.player.herbs},realmBalance:realms,catalogs:snaps};fs.writeFileSync('/tmp/V310_AUDIT.json',JSON.stringify(out,null,2)+'\n');
console.log('V310_AUDIT_PASS '+JSON.stringify({version:out.version,schema:out.schema,apiCount:keys.length,initial:out.initial}));
function rows(v){if(Array.isArray(v))return v;if(v&&typeof v==='object')return Object.values(v);return []}function compact(label,value){console.log(label+' '+JSON.stringify(value));}
const manuals=rows(snaps.v31?.manuals);compact('V310_MANUALS',manuals.map(x=>({id:x.id,name:x.name,unlock:x.unlock,path:x.path,mult:x.mult,sources:x.sources})));
compact('V310_SHOPS',snaps.shops||{});compact('V310_LISTINGS',snaps.listings||{});
const highFeasibility=realms.filter(r=>r.index>=23&&r.index<=37).map(r=>{const available=manuals.filter(m=>(m.unlock??999)<=r.index&&Number(m.mult)>0);const best=available.reduce((a,b)=>(Number(b.mult)||0)>(Number(a?.mult)||0)?b:a,null);const mult=Number(best?.mult)||1;const avgDaily=8*.9*mult;const years=r.need/avgDaily/365;return {index:r.index,name:r.name,need:r.need,bestManual:best?.name||'legacy',manualMult:mult,avgDaily:Number(avgDaily.toFixed(2)),yearsNoDwelling:Math.round(years),realmRate:r.rate};});compact('V310_CULTIVATION_FEASIBILITY',highFeasibility);
for(const name of ['cultivationGainForDays','retreatSevenDays','remainingLifespanYears','action','contentRegistrySnapshot','routeInfo','coreRequirements','v33MaterialDropEntries'])if(typeof api[name]==='function')console.log('V310_FN '+name+' '+String(api[name]).replace(/\s+/g,' '));
