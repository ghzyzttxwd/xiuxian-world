import fs from 'fs';

const srcPath=new URL('./fullrun-v310-no-recharge-v2.mjs',import.meta.url);
const outPath=new URL('./.generated-fullrun-v310-no-recharge-v3.mjs',import.meta.url);
let src=fs.readFileSync(srcPath,'utf8');

function mustReplace(before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error(`V3.10 full-run v3 transform miss: ${label}`);
 if(src.indexOf(before,first+1)>=0)throw new Error(`V3.10 full-run v3 transform ambiguous: ${label}`);
 src=src.slice(0,first)+after+src.slice(first+before.length);
}

const before="const rows=cat.filter(r=>(r.unlock||0)<=p.realmIndex&&(!r.path||r.path==='none'||(pathReady&&r.path===DAO_PATH))&&Number(r.mult||0)>0).sort((a,b)=>Number(b.mult||0)-Number(a.mult||0));return rows[0]||null";
const after="const safePreDaoSources=new Set(['青石村','青石镇','临江城','青云山','云梦泽']);const rows=cat.filter(r=>{if((r.unlock||0)>p.realmIndex||Number(r.mult||0)<=0)return false;if(r.path&&r.path!=='none'&&!(pathReady&&r.path===DAO_PATH))return false;if(!pathReady){const meta=registry.manuals[r.id]||r,cost=meta.cost||{};if((cost.insight||0)>0||(cost.relic||0)>0||(cost.rare||0)>0||(cost.materials||0)>0||(cost.core||0)>0||(cost.nascent||0)>0||(cost.deification||0)>0)return false;if(cost.named&&Object.keys(cost.named).length)return false;if(!(meta.sources||r.sources||[]).some(x=>safePreDaoSources.has(x)))return false}return true}).sort((a,b)=>Number(b.mult||0)-Number(a.mult||0));return rows[0]||null";
mustReplace(before,after,'safe pre-dao manual candidates');

if(!src.includes('safePreDaoSources'))throw new Error('safe pre-dao manual filter missing');
fs.writeFileSync(outPath,src);
await import(outPath.href+'?seed='+Date.now());
