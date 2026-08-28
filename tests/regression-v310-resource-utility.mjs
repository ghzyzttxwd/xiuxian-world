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
function scan(value,label,path='root'){
 if(Array.isArray(value)){value.forEach((v,i)=>scan(v,label,`${path}[${i}]`));return}
 if(!value||typeof value!=='object')return;
 for(const [k,v] of Object.entries(value)){
  if(typeof v==='string'&&namedIds.has(v))add(v,`${label}:${path}.${k}`);
  else if(v&&typeof v==='object')scan(v,label,`${path}.${k}`);
 }
}

// Structured gameplay sinks: recipe ingredients, forge/equipment costs, artifact data and formations.
scan(reg.recipes||{},'recipe');
scan(reg.items||{},'item');
scan(reg.artifacts||{},'artifact');
scan(reg.formations||{},'formation');

// A material is economically useful if a normal shop explicitly accepts it for resale.
function scanSellable(value,path='shops'){
 if(Array.isArray(value)){value.forEach((v,i)=>scanSellable(v,`${path}[${i}]`));return}
 if(!value||typeof value!=='object')return;
 if(value.sellable===true&&typeof value.refId==='string')add(value.refId,`sellable:${path}`);
 for(const [k,v] of Object.entries(value))if(v&&typeof v==='object')scanSellable(v,`${path}.${k}`);
}
scanSellable(reg.shops||{});

// Direct progression sinks are implemented as one-line runtime functions that deduct through
// v33AddMaterial(id,-n). Extract material ids only from those deducting function lines, never from
// drop/source functions, so a material having a source cannot fake a utility PASS.
for(const line of source.split('\n')){
 if(!line.includes('function ')||!line.includes('v33AddMaterial')||!/(?:v33AddMaterial\([^)]*,-|v33AddMaterial\([^)]*,-\s*)/.test(line))continue;
 const fn=line.match(/function\s+([A-Za-z0-9_]+)/)?.[1]||'anonymous';
 for(const id of new Set(line.match(/mat-[a-z0-9-]+/gi)||[]))add(id,`direct-consume:${fn}`);
}

const rows=named.map(m=>({id:m.id,name:m.name,minRealm:m.minRealm,kind:m.kind,sinks:[...sinks.get(m.id)].sort()}));
const unused=rows.filter(r=>r.sinks.length===0);
const high=rows.filter(r=>Number(r.minRealm)>=24);
const highUnused=high.filter(r=>r.sinks.length===0);
fs.writeFileSync('V310_RESOURCE_UTILITY_AUDIT.json',JSON.stringify({status:unused.length?'FAIL':'PASS',namedMaterials:rows.length,highTierMaterials:high.length,unused,highUnused,rows},null,2)+'\n');
assert.equal(highUnused.length,0,`V3.10 high-tier named materials without a gameplay/economic sink: ${highUnused.map(x=>`${x.id}(${x.name})`).join(', ')}`);
assert.equal(unused.length,0,`V3.10 named materials without a gameplay/economic sink: ${unused.map(x=>`${x.id}(${x.name})`).join(', ')}`);
console.log('V310_RESOURCE_UTILITY_REGRESSION_PASS '+JSON.stringify({namedMaterials:rows.length,highTierMaterials:high.length,unused:0,highUnused:0}));
