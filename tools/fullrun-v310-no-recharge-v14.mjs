import fs from 'fs';
import {spawnSync} from 'child_process';

const v13Path=new URL('./fullrun-v310-no-recharge-v13.mjs',import.meta.url);
const v13StagePath=new URL('./.generated-fullrun-v310-no-recharge-v14-v13stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v14 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v14 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V13 proved a legal realm33 sword cultivator can actually engage the mandatory realm34
// 祖脉天蛇, but the first real test used only refinement-3 assault/guard and no support artifact.
// V14 is the final legitimate player-build exclusion before any economy change: forge the same-stage
// 万剑法域幡 support, refine assault/guard/support/natal to the normal cap 9, and warm all four to
// 100 through ordinary APIs/costs/time/failure/repair. Candidate gameplay remains untouched.
let v13=fs.readFileSync(v13Path,'utf8');
v13=replaceOnce(
 v13,
 "await import(finalRunnerPath.href+'?v13final='+Date.now());",
 "// v14 executes the maximally prepared legal realm33 sword runner below.",
 'suppress v13 final auto-import'
);
fs.writeFileSync(v13StagePath,v13);
await import(v13StagePath.href+'?v14stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v14 did not obtain v13 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

runner=replaceOnce(
 runner,
 "if(++guard>24)fail('realm33-gear-refine-loop',{itemId,slot,targetRefine});",
 "if(++guard>96)fail('realm33-gear-refine-loop',{itemId,slot,targetRefine});",
 'allow normal high-refinement variance without forcing success'
);

const oldGear=`function ensureRealm33SwordCombatGear(){
 if(DAO_PATH!=='sword'||state().player.realmIndex<33)return;
 ensureArtifactLoadoutItem('item-v37-lawcleaver-sword','assault',3);
 ensureArtifactLoadoutItem('item-v32-swordguard-wheel','guard',3);
}`;
const newGear=`function ensureArtifactMaxPreparation(itemId,targetRefine=9,targetWarmth=100){
 const rec0=state().player.equipmentInventory?.[itemId];if(!rec0)fail('realm33-maxprep-item-missing',{itemId});
 let guard=0;
 while((state().player.equipmentInventory?.[itemId]?.refinement||0)<targetRefine){
  if(++guard>96)fail('realm33-maxprep-refine-loop',{itemId,targetRefine,current:state().player.equipmentInventory?.[itemId]?.refinement||0});
  ensureStones(1200);ensureRare(40);ensureRelic(20);
  const x=spendAction('refine-realm33-max:'+itemId,()=>invoke('refineV32Artifact',itemId));
  heal();
  if(x==='damage'||x==='damaged'){
   ensureStones(1200);ensureRare(40);
   const rr=spendAction('repair-realm33-max:'+itemId,()=>invoke('repairV32Artifact',itemId));
   if(!['ok','healthy'].includes(rr))fail('realm33-maxprep-repair-blocked',{itemId,result:rr});
   heal();
  }else if(!['success','failed','max'].includes(x))fail('realm33-maxprep-refine-blocked',{itemId,result:x});
 }
 guard=0;
 while((state().player.equipmentInventory?.[itemId]?.warmth||0)<targetWarmth){
  if(++guard>30)fail('realm33-maxprep-warm-loop',{itemId,targetWarmth,current:state().player.equipmentInventory?.[itemId]?.warmth||0});
  ensureStones(1200);
  const x=spendAction('warm-realm33-max:'+itemId,()=>invoke('warmV32Artifact',itemId));
  if(x==='damaged'){
   ensureStones(1200);ensureRare(40);
   const rr=spendAction('repair-realm33-max-warm:'+itemId,()=>invoke('repairV32Artifact',itemId));
   if(!['ok','healthy'].includes(rr))fail('realm33-maxprep-warm-repair-blocked',{itemId,result:rr});
  }else if(x!=='max'&&!Number.isFinite(x))fail('realm33-maxprep-warm-blocked',{itemId,result:x});
  heal();
 }
 const rec=state().player.equipmentInventory?.[itemId];
 console.log('V310_FULLRUN_MAX_ARTIFACT',JSON.stringify({itemId,refinement:rec?.refinement||0,warmth:rec?.warmth||0,bound:!!rec?.bound,natal:!!rec?.natal,actions}));
}
function ensureRealm33SwordCombatGear(){
 if(DAO_PATH!=='sword'||state().player.realmIndex<33)return;
 ensureArtifactLoadoutItem('item-v37-lawcleaver-sword','assault',9);
 ensureArtifactLoadoutItem('item-v32-swordguard-wheel','guard',9);
 ensureArtifactLoadoutItem('item-v37-sword-domain-banner','support',9);
 ensureArtifactMaxPreparation('item-v37-lawcleaver-sword',9,100);
 ensureArtifactMaxPreparation('item-v32-swordguard-wheel',9,100);
 ensureArtifactMaxPreparation('item-v37-sword-domain-banner',9,100);
 ensureArtifactMaxPreparation('item-v32-sevenstar-swordcase',9,100);
}`;
runner=replaceOnce(runner,oldGear,newGear,'build full refinement-9 warmth-100 sword artifact loadout');

const oldPrepared="const marrowLoadout=s.player.artifactLoadout||{},preparedRealm33Sword=s.player.realmIndex===33&&s.player.daoPath==='sword'&&marrowLoadout.assault==='item-v37-lawcleaver-sword'&&marrowLoadout.guard==='item-v32-swordguard-wheel'&&marrowLoadout.natal==='item-v32-sevenstar-swordcase',marrowSerpentChallenge=";
const newPrepared="const marrowLoadout=s.player.artifactLoadout||{},marrowInventory=s.player.equipmentInventory||{},marrowMaxIds=['item-v37-lawcleaver-sword','item-v32-swordguard-wheel','item-v37-sword-domain-banner','item-v32-sevenstar-swordcase'],preparedRealm33Sword=s.player.realmIndex===33&&s.player.daoPath==='sword'&&marrowLoadout.assault==='item-v37-lawcleaver-sword'&&marrowLoadout.guard==='item-v32-swordguard-wheel'&&marrowLoadout.support==='item-v37-sword-domain-banner'&&marrowLoadout.natal==='item-v32-sevenstar-swordcase'&&marrowMaxIds.every(id=>(marrowInventory[id]?.refinement||0)>=9&&(marrowInventory[id]?.warmth||0)>=100),marrowSerpentChallenge=";
runner=replaceOnce(runner,oldPrepared,newPrepared,'require complete max-prepared sword build before marrow challenge');

const oldLog="loadout:{assault:marrowLoadout.assault,guard:marrowLoadout.guard,natal:marrowLoadout.natal},actions";
const newLog="loadout:{assault:marrowLoadout.assault,guard:marrowLoadout.guard,support:marrowLoadout.support,natal:marrowLoadout.natal},preparation:Object.fromEntries(marrowMaxIds.map(id=>[id,{refinement:marrowInventory[id]?.refinement||0,warmth:marrowInventory[id]?.warmth||0}])),actions";
runner=replaceOnce(runner,oldLog,newLog,'log exact v14 max artifact preparation on marrow challenge');

if(!runner.includes("ensureArtifactLoadoutItem('item-v37-lawcleaver-sword','assault',9)"))throw new Error('V3.10 v14 assault not refined to cap');
if(!runner.includes("ensureArtifactLoadoutItem('item-v32-swordguard-wheel','guard',9)"))throw new Error('V3.10 v14 guard not refined to cap');
if(!runner.includes("ensureArtifactLoadoutItem('item-v37-sword-domain-banner','support',9)"))throw new Error('V3.10 v14 sword support artifact missing');
if(!runner.includes("ensureArtifactMaxPreparation('item-v32-sevenstar-swordcase',9,100)"))throw new Error('V3.10 v14 natal artifact not max-prepared');
if(!runner.includes("invoke('warmV32Artifact',itemId)"))throw new Error('V3.10 v14 max warmth bypasses normal API');
if(!runner.includes("marrowLoadout.support==='item-v37-sword-domain-banner'"))throw new Error('V3.10 v14 challenge does not require sword support artifact');
if(!runner.includes("marrowMaxIds.every(id=>(marrowInventory[id]?.refinement||0)>=9&&(marrowInventory[id]?.warmth||0)>=100)"))throw new Error('V3.10 v14 challenge lacks max preparation gate');
if(!runner.includes("enemyRealm>s.player.realmIndex&&!marrowSerpentChallenge"))throw new Error('V3.10 v14 higher-realm flee guard not preserved');
if(!runner.includes("x.materialId===id&&x.mode==='named-source'"))throw new Error('V3.10 v14 lost v12 actual drop-table routing');
if(!runner.includes("mat-v38-heaven-vein-marrow','天穹祖脉'"))throw new Error('V3.10 v14 lost unavoidable marrow source assertion');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v38-heaven-vein-marrow'"))throw new Error('forbidden shortcut leaked into V3.10 v14 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v14 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V14_FINAL_RUNNER_PASS '+JSON.stringify({assaultRefine:9,guardRefine:9,support:'item-v37-sword-domain-banner',supportRefine:9,natalRefine:9,allWarmth:100,normalForgeRefineRepairWarmOnly:true,maxPreparationRequiredForMarrowChallenge:true,generatedRunnerSyntaxChecked:true,noGameplayMutation:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v14final='+Date.now());
