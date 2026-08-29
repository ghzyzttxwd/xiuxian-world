/* TAIXUAN_SHOP_V2_POWER_ADAPTER_M1 */
(()=>{
'use strict';
const VERSION='m1-1';
const GRADES=['normal','fine','superior','perfect'];
const clone=x=>JSON.parse(JSON.stringify(x));
function api(){const a=window.__TAIXUAN_TEST__;if(!a)throw new Error('game_api_not_ready');return a}
function state(){return api().getState()}
function player(){const s=state();if(!s?.player)throw new Error('player_not_ready');return s.player}
function refresh(){document.querySelector('.nav-btn.active')?.click()}
function saveRefresh(){document.getElementById('saveBtn')?.click();setTimeout(()=>document.querySelector('[data-close-modal]')?.click(),0);setTimeout(refresh,30)}
function gearRecord(id){return player().equipmentInventory?.[id]||null}
function knownManual(id){return (player().manualLibraryIds||[]).includes(id)}
function growth(){return api().v31CatalogSnapshot()}
function spellRow(id){return growth().spells.find(x=>x.id===id)||null}
function manualRow(id){return growth().manuals.find(x=>x.id===id)||null}
function spellKnown(id){const r=spellRow(id);return !!(r&&Object.prototype.hasOwnProperty.call(player().spells||{},r.name))}
function result(ok,type,id,extra={}){return {ok,type,id,...extra}}

function grantEquipment(id,{grade='perfect',equip=true}={}){
 if(!GRADES.includes(grade))return result(false,'equipment',id,{reason:'invalid_grade'});
 if(gearRecord(id)){
  if(equip)api().equipGear(id);
  saveRefresh();
  return result(true,'equipment',id,{duplicate:true,equipped:!!equip,record:clone(gearRecord(id))});
 }
 const made=api().forgeV32Item(id,true,grade);
 if(!GRADES.includes(made))return result(false,'equipment',id,{reason:String(made||'forge_failed')});
 if(equip)api().equipGear(id);
 saveRefresh();
 return result(true,'equipment',id,{duplicate:false,equipped:!!equip,record:clone(gearRecord(id))});
}

function grantArtifact(id,{grade='perfect',refinement=0,warmth=0,bind=true,equip=true,natal=false}={}){
 if(!GRADES.includes(grade))return result(false,'artifact',id,{reason:'invalid_grade'});
 refinement=Math.max(0,Math.min(9,Number(refinement)||0));
 warmth=Math.max(0,Math.min(100,Number(warmth)||0));
 let rec=gearRecord(id),duplicate=!!rec;
 if(!rec){
  const made=api().forgeV32Item(id,true,grade);
  if(!GRADES.includes(made))return result(false,'artifact',id,{reason:String(made||'forge_failed')});
  rec=gearRecord(id);
 }
 if(!rec)return result(false,'artifact',id,{reason:'missing_after_forge'});
 if(rec.damaged)api().repairV32Artifact(id,true);
 if(bind&&!gearRecord(id)?.bound)api().bindV32Artifact(id,true);
 let guard=20;
 while((gearRecord(id)?.refinement||0)<refinement&&guard-->0){
  const x=api().refineV32Artifact(id,'success');
  if(x!=='success')return result(false,'artifact',id,{reason:'refine_'+x,duplicate,record:clone(gearRecord(id))});
 }
 guard=20;
 while((gearRecord(id)?.warmth||0)<warmth&&guard-->0){
  const x=api().warmV32Artifact(id,true);
  if(!Number.isFinite(x))return result(false,'artifact',id,{reason:'warm_'+x,duplicate,record:clone(gearRecord(id))});
 }
 if(natal){
  const x=api().makeNatalV32Artifact(id,true);
  if(!['ok','natal'].includes(x))return result(false,'artifact',id,{reason:'natal_'+x,duplicate,record:clone(gearRecord(id))});
 }else if(equip&&gearRecord(id)?.bound){
  api().equipV32Artifact(id);
 }
 saveRefresh();
 return result(true,'artifact',id,{duplicate,record:clone(gearRecord(id)),loadout:clone(player().artifactLoadout||{})});
}

function grantManual(id,{switchTo=false}={}){
 const row=manualRow(id);if(!row)return result(false,'manual',id,{reason:'missing_manual'});
 const duplicate=knownManual(id);
 if(!duplicate){const x=api().learnV31Manual(id,true);if(!['learned','known'].includes(x))return result(false,'manual',id,{reason:String(x)})}
 if(switchTo&&!api().switchV31Manual(id,true))return result(false,'manual',id,{reason:'switch_failed',duplicate});
 saveRefresh();
 return result(true,'manual',id,{duplicate,name:row.name,active:player().manual===row.name});
}

function firstFreeActiveSlot(){const a=player().activeSkillIds||[];const i=a.findIndex(x=>!x);return i>=0?i:0}
function grantSpell(id,{equip=true,slot=null}={}){
 const row=spellRow(id);if(!row)return result(false,'spell',id,{reason:'missing_spell'});
 const duplicate=spellKnown(id);
 if(!duplicate){const x=api().learnV31Spell(id,true);if(!['learned','known'].includes(x))return result(false,'spell',id,{reason:String(x)})}
 let equipped=false;
 if(equip){
  if(row.category==='passive')equipped=!!api().equipV31Passive(id);
  else equipped=!!api().equipV31Skill(slot==null?firstFreeActiveSlot():slot,id);
 }
 saveRefresh();
 return result(true,row.category==='passive'?'passive':'spell',id,{duplicate,name:row.name,equipped});
}

function inspectBuild(id){
 const defs=api().v34BuildRegistry(),b=defs[id];if(!b)return {ok:false,id,reason:'missing_build'};
 const s=api().v34BuildScore(b),p=player(),g=growth();
 const missing={manuals:[],skills:[],passive:null,artifact:!s.parts?.artifact};
 if(!s.parts?.manual)missing.manuals=b.manuals.filter(x=>!(p.manualLibraryIds||[]).includes(x));
 const haveSkills=new Set(s.parts?.skills||[]);missing.skills=b.skills.filter(x=>!haveSkills.has(x));
 if(!s.parts?.passive)missing.passive=b.passive;
 return {ok:true,id,name:b.name,path:b.path,role:b.role,score:s.score||0,active:!!s.active,mastered:!!s.mastered,parts:clone(s.parts||{}),missing,catalog:{manuals:g.manuals.filter(x=>b.manuals.includes(x.id)).map(x=>({id:x.id,name:x.name})),skills:g.spells.filter(x=>b.skills.includes(x.id)||x.id===b.passive).map(x=>({id:x.id,name:x.name,category:x.category}))}};
}
function buildsForPath(path=player().daoPath){return Object.values(api().v34BuildRegistry()).filter(x=>x.path===path).map(x=>inspectBuild(x.id)).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id))}
function bestBuild(path=player().daoPath){return buildsForPath(path)[0]||null}

function validateBundle(spec={}){
 const errors=[];
 for(const x of spec.manuals||[])if(!manualRow(typeof x==='string'?x:x.id))errors.push('manual:'+String(typeof x==='string'?x:x.id));
 for(const x of spec.spells||[])if(!spellRow(typeof x==='string'?x:x.id))errors.push('spell:'+String(typeof x==='string'?x:x.id));
 for(const x of spec.passives||[])if(!spellRow(typeof x==='string'?x:x.id))errors.push('passive:'+String(typeof x==='string'?x:x.id));
 return {ok:errors.length===0,errors};
}
function grantBundle(spec={}){
 const check=validateBundle(spec);if(!check.ok)return {ok:false,reason:'invalid_bundle',errors:check.errors,granted:[]};
 const granted=[];
 const push=x=>{granted.push(x);if(!x.ok)throw Object.assign(new Error(x.reason||'grant_failed'),{grant:x})};
 try{
  for(const x of spec.equipment||[])push(grantEquipment(typeof x==='string'?x:x.id,typeof x==='string'?{}:x));
  for(const x of spec.artifacts||[])push(grantArtifact(typeof x==='string'?x:x.id,typeof x==='string'?{}:x));
  for(const x of spec.manuals||[])push(grantManual(typeof x==='string'?x:x.id,typeof x==='string'?{}:x));
  for(const x of spec.spells||[])push(grantSpell(typeof x==='string'?x:x.id,typeof x==='string'?{}:x));
  for(const x of spec.passives||[])push(grantSpell(typeof x==='string'?x:x.id,{...(typeof x==='string'?{}:x),equip:true}));
  saveRefresh();return {ok:true,granted,state:state()};
 }catch(e){return {ok:false,reason:e?.grant?.reason||e.message||'grant_failed',granted,state:state()}}
}
function snapshot(){const p=player();return {version:VERSION,schema:state().saveSchemaVersion,realmIndex:p.realmIndex,daoPath:p.daoPath,equipment:Object.keys(p.equipmentInventory||{}),equipped:clone(p.equippedItemIds||{}),artifacts:clone(p.artifactLoadout||{}),manuals:[...(p.manualLibraryIds||[])],activeSkills:[...(p.activeSkillIds||[])],passive:p.passiveSkillId||null,bestBuild:bestBuild()}}
window.__TAIXUAN_POWER_SHOP__={version:VERSION,grantEquipment,grantArtifact,grantManual,grantSpell,grantBundle,inspectBuild,buildsForPath,bestBuild,hasEquipment:id=>!!gearRecord(id),hasManual:knownManual,hasSpell:spellKnown,snapshot,refresh};
})();