import fs from 'fs';
import assert from 'assert';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'');
const source=fs.readFileSync('src/game-v310.js','utf8');
const dom=new JSDOM(html,{url:'http://v310-resource-utility.test/',runScripts:'outside-only',pretendToBeVisual:true});
dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
dom.window.scrollTo=()=>{};
dom.window.console={...console,log(){},info(){},debug(){}};
dom.window.eval(source);
const api=dom.window.__TAIXUAN_TEST__;
assert(api,'V3.10 resource utility audit missing test API');
api.newGame('V310资源用途审计');
const reg=api.contentRegistrySnapshot();
const materials=Object.values(reg.materials||{});
const named=materials.filter(m=>m?.named===true);
const namedIds=new Set(named.map(m=>m.id));

const sinks=new Map(named.map(m=>[m.id,new Set()]));
function add(id,label){if(namedIds.has(id))sinks.get(id).add(label)}

// Registries encode ordinary material consumption as positive numeric values keyed by material id,
// e.g. ingredients:{'mat-v36-space-crystal':1}. Count only those cost-like keys. A source/drop
// reference that merely names a material must not make it look useful.
function scanCostKeys(value,label,path='root'){
 if(Array.isArray(value)){value.forEach((v,i)=>scanCostKeys(v,label,`${path}[${i}]`));return}
 if(!value||typeof value!=='object')return;
 for(const [k,v] of Object.entries(value)){
  if(namedIds.has(k)&&Number.isFinite(Number(v))&&Number(v)>0)add(k,`${label}:${path}.${k}`);
  if(v&&typeof v==='object')scanCostKeys(v,label,`${path}.${k}`);
 }
}
scanCostKeys(reg.recipes||{},'recipe-cost');
scanCostKeys(reg.items||{},'item-cost');
scanCostKeys(reg.artifacts||{},'artifact-cost');
scanCostKeys(reg.formations||{},'formation-cost');

// A material is economically useful if a normal shop explicitly accepts it for resale. The test
// registry exposes shop metadata but not V35_FIXED_LISTINGS, so parse that immutable JSON catalog
// from the same runtime source rather than silently losing valid black-market / market sell sinks.
function scanSellable(value,path='shops'){
 if(Array.isArray(value)){value.forEach((v,i)=>scanSellable(v,`${path}[${i}]`));return}
 if(!value||typeof value!=='object')return;
 if(value.sellable===true&&typeof value.refId==='string')add(value.refId,`sellable:${path}`);
 for(const [k,v] of Object.entries(value))if(v&&typeof v==='object')scanSellable(v,`${path}.${k}`);
}
scanSellable(reg.shops||{});
function frozenJsonCatalog(name,nextName){
 const startToken=`const ${name}=Object.freeze(`,endToken=`);\nconst ${nextName}=`;
 const start=source.indexOf(startToken);
 assert(start>=0,`${name} source catalog missing`);
 const bodyStart=start+startToken.length;
 const end=source.indexOf(endToken,bodyStart);
 assert(end>bodyStart,`${name} source catalog end missing`);
 return JSON.parse(source.slice(bodyStart,end));
}
const fixedListings=frozenJsonCatalog('V35_FIXED_LISTINGS','V35_AUCTION_POOL');
scanSellable(fixedListings,'fixed-listings');

// Direct progression sinks use v33AddMaterial(...,-n). For one-line runtime functions, count
// (a) literal negative calls and (b) material ids used as numeric cost-map keys in a function that
// performs a negative loop deduction. Do not count positive output calls from the same function.
for(const line of source.split('\n')){
 if(!line.includes('function ')||!line.includes('v33AddMaterial'))continue;
 const fn=line.match(/function\s+([A-Za-z0-9_]+)/)?.[1]||'anonymous';
 for(const m of line.matchAll(/v33AddMaterial\(\s*['"](mat-[a-z0-9-]+)['"]\s*,\s*-\s*\d+/gi))add(m[1],`direct-consume:${fn}`);
 if(/v33AddMaterial\([^)]*,\s*-\s*[A-Za-z0-9_]+\s*\)/.test(line)){
  for(const m of line.matchAll(/['"](mat-[a-z0-9-]+)['"]\s*:\s*(\d+(?:\.\d+)?)/gi))if(Number(m[2])>0)add(m[1],`direct-cost-map:${fn}`);
 }
}

const rows=named.map(m=>({id:m.id,name:m.name,minRealm:m.minRealm,kind:m.kind,sinks:[...sinks.get(m.id)].sort()}));
const unused=rows.filter(r=>r.sinks.length===0);
const high=rows.filter(r=>Number(r.minRealm)>=24);
const highUnused=high.filter(r=>r.sinks.length===0);
fs.writeFileSync('V310_RESOURCE_UTILITY_AUDIT.json',JSON.stringify({status:unused.length?'FAIL':'PASS',namedMaterials:rows.length,highTierMaterials:high.length,unused,highUnused,rows},null,2)+'\n');
assert.strictEqual(highUnused.length,0,`V3.10 high-tier named materials without a gameplay/economic sink: ${highUnused.map(x=>`${x.id}(${x.name})`).join(', ')}`);
assert.strictEqual(unused.length,0,`V3.10 named materials without a gameplay/economic sink: ${unused.map(x=>`${x.id}(${x.name})`).join(', ')}`);
console.log('V310_RESOURCE_UTILITY_REGRESSION_PASS '+JSON.stringify({namedMaterials:rows.length,highTierMaterials:high.length,unused:0,highUnused:0,fixedShopSellablesAudited:true}));
