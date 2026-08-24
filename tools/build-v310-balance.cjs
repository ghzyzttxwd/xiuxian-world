const fs=require('fs');
const crypto=require('crypto');
const INPUT='src/game-v39.js',OUTPUT='src/game-v310.js',REPORT='BUILD_V310_BALANCE.json',BUILD='31001';
const v39=require('../content/v39-tribulation-ascension.cjs');
let src=fs.readFileSync(INPUT,'utf8');
function must(a,b,label){const i=src.indexOf(a);if(i<0)throw new Error('V3.10 transform miss: '+label);if(src.indexOf(a,i+1)>=0)throw new Error('V3.10 transform ambiguous: '+label);src=src.slice(0,i)+b+src.slice(i+a.length)}
function appendFrozenObject(name,entries,label){const start='const '+name+'=Object.freeze({',i=src.indexOf(start);if(i<0)throw new Error('V3.10 missing '+label);const end=src.indexOf('});',i+start.length);if(end<0)throw new Error('V3.10 unterminated '+label);const body=src.slice(i+start.length,end);src=src.slice(0,end)+(body.trim()?',':'')+entries+src.slice(end)}

must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='3.9.0'; const SAVE_SCHEMA_VERSION=36;","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='3.10.0'; const SAVE_SCHEMA_VERSION=36;",'version');
const oldGain="function cultivationGainForDays(days=1,retreatBoost=1){const p=state.player,d=Math.max(1,Math.floor(days)),base=rint(6*d,10*d),rootM=root().mult,manualM=manual().mult,injuryM=[1,.90,.70,.48][clamp(p.injury||0,0,3)],gain=Math.floor(base*rootM*manualM*injuryM*dwellingCultivationMultiplier()*Math.max(.1,retreatBoost));return Math.max(1,gain)}";
const newGain="function cultivationGainForDays(days=1,retreatBoost=1){const p=state.player,d=Math.max(1,Math.floor(days)),base=rint(6*d,10*d),rootM=root().mult,manualM=manual().mult,realmM=Math.max(1,Number(realm().rate)||1),injuryM=[1,.90,.70,.48][clamp(p.injury||0,0,3)],gain=Math.floor(base*rootM*manualM*realmM*injuryM*dwellingCultivationMultiplier()*Math.max(.1,retreatBoost));return Math.max(1,gain)}";
must(oldGain,newGain,'realm cultivation rate');

// V3.9 used a generic "append before };" helper against Object.freeze({...}); registries.
// The three terminal region IDs and ten terminal material descriptors therefore landed inside
// the low-tier factionContract object instead of the stable registries. Remove that pollution
// and register the already-existing V3.9 content in the intended canonical maps.
const contractStart="p.factionContract={faction:id,title:d.contract,progress:0,need:d.need,acceptedDay:dayNumber(),";
const ci=src.indexOf(contractStart);if(ci<0)throw new Error('V3.10 missing polluted factionContract');
const ce=src.indexOf("};addPersonal('你接下",ci);if(ce<0)throw new Error('V3.10 cannot bound polluted factionContract');
const polluted=src.slice(ci,ce);
for(const token of [...v39.regions.map(x=>x.name),...v39.materials.map(x=>x.id)])if(!polluted.includes(token))throw new Error('V3.10 expected pollution missing '+token);
src=src.slice(0,ci)+"p.factionContract={faction:id,title:d.contract,progress:0,need:d.need,acceptedDay:dayNumber()}"+src.slice(ce+1);

const regionIdEntries=v39.regions.map(r=>JSON.stringify(r.name)+':'+JSON.stringify(r.id)).join(',');
appendFrozenObject('REGION_ID_BY_NAME',regionIdEntries,'region id registry');
const materialEntries=v39.materials.map(m=>JSON.stringify(m.id)+':'+JSON.stringify({id:m.id,name:m.name,qualityId:m.qualityId,kind:m.kind,field:m.legacyField||null,locations:m.locations,minRealm:m.minRealm,named:true})).join(',');
appendFrozenObject('MATERIAL_REGISTRY',materialEntries,'material registry');

if(!src.includes("const SAVE_KEY='xiuxian_world_v02'"))throw new Error('SAVE_KEY changed');
if(/\beval\s*\(/.test(src))throw new Error('eval forbidden');
if(!src.includes("const VERSION='3.10.0'"))throw new Error('version missing');
if(!src.includes('const SAVE_SCHEMA_VERSION=36'))throw new Error('schema changed unexpectedly');
if(!src.includes('const CONTENT_STATE_VERSION=10'))throw new Error('registry version changed unexpectedly');
if(!src.includes('realmM=Math.max(1,Number(realm().rate)||1)'))throw new Error('realm rate missing');
for(const r of v39.regions)if(!src.includes(JSON.stringify(r.name)+':'+JSON.stringify(r.id)))throw new Error('region id repair missing '+r.name);
for(const m of v39.materials)if(!src.includes(JSON.stringify(m.id)+':'+JSON.stringify({id:m.id,name:m.name,qualityId:m.qualityId,kind:m.kind,field:m.legacyField||null,locations:m.locations,minRealm:m.minRealm,named:true})))throw new Error('material repair missing '+m.id);

fs.writeFileSync(OUTPUT,src);
const sha=crypto.createHash('sha256').update(Buffer.from(src)).digest('hex');
const report={status:'PASS',gameplay_version:'3.10.0',build:BUILD,milestone:'no-recharge-full-run-balance',source:OUTPUT,source_sha256:sha,source_bytes:Buffer.byteLength(src),save_schema_version:36,content_registry_version:10,changes:['realm cultivation rate is now applied to daily cultivation gain','V3.9 terminal region/material stable registries repaired and factionContract pollution removed'],invariants:['direct complete source','SAVE_KEY frozen','schema36 retained because no new state','content registry v10 retained','no eval','no runtime patch chain']};
fs.writeFileSync(REPORT,JSON.stringify(report,null,2)+'\n');
console.log('V310_BUILD_PASS '+JSON.stringify(report));
