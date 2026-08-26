import fs from 'fs';

const v8Path=new URL('./fullrun-v310-no-recharge-v8.mjs',import.meta.url);
const v8StagePath=new URL('./.generated-fullrun-v310-no-recharge-v9-v8stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v9 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v9 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// Build the exact v8 runner without executing it, then add a normal realm33 sword gearing
// policy. V8 proved origin-gold auction recovery works; the next highchain death occurred
// while an otherwise late-Unity sword cultivator still used only the old natal base artifact.
// V9 changes only autonomous-player preparation: normal forge/bind/equip/refine APIs, normal
// costs, normal source locations and normal failure chances. Candidate gameplay is untouched.
let v8=fs.readFileSync(v8Path,'utf8');
v8=replaceOnce(
 v8,
 "await import(finalRunnerPath.href+'?v8final='+Date.now());",
 "// v9 executes the final runner after adding legal realm33 sword gearing.",
 'suppress v8 final auto-import'
);
fs.writeFileSync(v8StagePath,v8);
await import(v8StagePath.href+'?v9stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v9 did not obtain v8 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const anchor="function ensureMahayanaEssence(n){";
const helper=`function ensureArtifactLoadoutItem(itemId,slot,targetRefine=3){
 const item=registry.items[itemId];if(!item)fail('realm33-gear-registry-missing',{itemId,slot});
 let guard=0;
 while(!state().player.equipmentInventory?.[itemId]){
  if(++guard>18)fail('realm33-gear-forge-loop',{itemId,slot});
  ensureCost(item.cost||{});
  if(!goAny(item.sources||[]))fail('realm33-gear-source-unreachable',{itemId,slot,sources:item.sources||[]});
  const r=spendAction('forge-realm33-gear:'+itemId,()=>invoke('forgeV32Item',itemId));
  heal();
  if(r==='dead')fail('realm33-gear-forge-death',{itemId,slot});
 }
 let r=spendAction('bind-realm33-gear:'+itemId,()=>invoke('bindV32Artifact',itemId));
 if(!['ok','bound'].includes(r))fail('realm33-gear-bind-blocked',{itemId,slot,result:r});
 guard=0;
 while((state().player.equipmentInventory?.[itemId]?.refinement||0)<targetRefine){
  if(++guard>24)fail('realm33-gear-refine-loop',{itemId,slot,targetRefine});
  ensureStones(900);ensureRare(30);ensureRelic(14);
  const x=spendAction('refine-realm33-gear:'+itemId,()=>invoke('refineV32Artifact',itemId));
  heal();
  if(x==='damage'){
   ensureStones(900);ensureRare(30);
   const rr=spendAction('repair-realm33-gear:'+itemId,()=>invoke('repairV32Artifact',itemId));
   if(!['ok','healthy'].includes(rr))fail('realm33-gear-repair-blocked',{itemId,slot,result:rr});
  }
 }
 const ok=spendAction('equip-realm33-gear:'+itemId,()=>invoke('equipV32Artifact',itemId,slot));
 if(!ok||state().player.artifactLoadout?.[slot]!==itemId)fail('realm33-gear-equip-blocked',{itemId,slot,loadout:state().player.artifactLoadout});
 console.log('V310_FULLRUN_GEAR',JSON.stringify({stage:'realm33-sword-loadout',itemId,slot,refinement:state().player.equipmentInventory?.[itemId]?.refinement||0,loadout:state().player.artifactLoadout,actions}));
}
function ensureRealm33SwordCombatGear(){
 if(DAO_PATH!=='sword'||state().player.realmIndex<33)return;
 ensureArtifactLoadoutItem('item-v37-lawcleaver-sword','assault',3);
 ensureArtifactLoadoutItem('item-v32-swordguard-wheel','guard',3);
}
function ensureMahayanaEssence(n){ensureRealm33SwordCombatGear();`;
runner=replaceOnce(runner,anchor,helper,'prepare a legal sword artifact loadout before Mahayana material farming');

if(!runner.includes("ensureArtifactLoadoutItem('item-v37-lawcleaver-sword','assault',3)"))throw new Error('V3.10 v9 missing realm33 sword assault gear');
if(!runner.includes("ensureArtifactLoadoutItem('item-v32-swordguard-wheel','guard',3)"))throw new Error('V3.10 v9 missing normal sword guard artifact');
if(!runner.includes("invoke('forgeV32Item',itemId)"))throw new Error('V3.10 v9 gear bypasses normal forging API');
if(!runner.includes("invoke('bindV32Artifact',itemId)"))throw new Error('V3.10 v9 gear bypasses normal binding API');
if(!runner.includes("invoke('equipV32Artifact',itemId,slot)"))throw new Error('V3.10 v9 gear bypasses normal artifact loadout API');
if(!runner.includes("invoke('refineV32Artifact',itemId)"))throw new Error('V3.10 v9 gear does not use normal refinement');
if(!runner.includes("'mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold']);"))throw new Error('V3.10 v9 lost v8 origin-gold auction whitelist');
if(!runner.includes("if(!(state().player.activeSkillIds||[]).includes(id)){spendAction('equip-sword-escape-skill'"))throw new Error('V3.10 v9 lost v7 escape membership fix');
if(!runner.includes("source:'unity-integration-jit'"))throw new Error('V3.10 v9 lost v6 JIT unity policy');
if(!runner.includes('function finishTribulation(attempt=0)'))throw new Error('V3.10 v9 lost recoverable tribulation retry');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v38-heaven-vein-marrow'"))throw new Error('forbidden progression shortcut leaked into V3.10 v9 runner');

fs.writeFileSync(finalRunnerPath,runner);
console.log('V310_FULLRUN_V9_FINAL_RUNNER_PASS '+JSON.stringify({legalRealm33SwordGear:true,assault:'item-v37-lawcleaver-sword',guard:'item-v32-swordguard-wheel',normalForgeBindEquipRefineOnly:true,originGoldAuctionWhitelistPreserved:true,noGameplayMutation:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v9final='+Date.now());
