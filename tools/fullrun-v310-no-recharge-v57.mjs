import fs from 'fs';
import {spawnSync} from 'child_process';

const v56Path=new URL('./fullrun-v310-no-recharge-v56.mjs',import.meta.url);
const v56StagePath=new URL('./.generated-fullrun-v310-no-recharge-v57-v56stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v57 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v57 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V56 generalized the old sword-only realm33 artifact function to all four dao paths, but the
// exact-head evidence proved that function was dead code: V52 had previously replaced the whole
// ensureMahayanaEssence() function and thereby deleted V9's original call to
// ensureRealm33SwordCombatGear(). As a result V56 generated correct path-wide preparation logic
// yet never executed it. Flame therefore reproduced the exact same 2212/1319 late-combat profile,
// and sword reached tribulation with materially lower readiness than the successful body/spirit runs.
//
// V57 restores only the lost LIVE CALL at the current V52 Mahayana preparation entrypoint. The
// function name remains legacy for transform stability, but V56's implementation is path-wide.
// Every item is still forged/bound/equipped/refined/repaired/warmed through ordinary gameplay APIs,
// with normal costs, travel, RNG and time. No candidate game data, combat formula, resource grant,
// realm gate, tribulation probability, seed or game-action cap is changed.
let v56=fs.readFileSync(v56Path,'utf8');
v56=replaceOnce(
 v56,
 "await import(finalRunnerPath.href+'?v56final='+Date.now());",
 "// v57 executes after restoring the live realm33 path-gear callpoint.",
 'suppress v56 final gameplay auto-import'
);
fs.writeFileSync(v56StagePath,v56);
const staged=spawnSync(process.execPath,['--check',v56StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v57 staged V56 syntax check failed: '+(staged.stderr||staged.stdout||'unknown syntax error'));
await import(v56StagePath.href+'?v57stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v57 did not obtain V56 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const before=`function ensureMahayanaEssence(n){
 const current=materialCount('mat-v38-mahayana-essence');`;
const after=`function ensureMahayanaEssence(n){
 ensureRealm33SwordCombatGear();
 if(state().player.realmIndex>=33){
  const plan=V56_REALM33_GEAR_PLANS[DAO_PATH],loadout=state().player.artifactLoadout||{},inventory=state().player.equipmentInventory||{},ids=plan?[plan.assault,plan.guard,plan.support,plan.natal]:[];
  if(!plan||loadout.assault!==plan.assault||loadout.guard!==plan.guard||loadout.support!==plan.support||ids.some(id=>(inventory[id]?.refinement||0)<9||(inventory[id]?.warmth||0)<100))fail('v57-live-path-gear-not-ready',{path:DAO_PATH,plan,loadout,preparation:Object.fromEntries(ids.map(id=>[id,{refinement:inventory[id]?.refinement||0,warmth:inventory[id]?.warmth||0}]))});
  console.log('V310_FULLRUN_V57_GEAR_CALL',JSON.stringify({path:DAO_PATH,realm:state().player.realmIndex,loadout:{assault:loadout.assault,guard:loadout.guard,support:loadout.support,natal:loadout.natal},preparation:Object.fromEntries(ids.map(id=>[id,{refinement:inventory[id]?.refinement||0,warmth:inventory[id]?.warmth||0}])),actions}));
 }
 const current=materialCount('mat-v38-mahayana-essence');`;
runner=replaceOnce(runner,before,after,'restore live path-wide realm33 gearing before Mahayana essence preparation');

if(!runner.includes("function ensureMahayanaEssence(n){\n ensureRealm33SwordCombatGear();"))throw new Error('V3.10 v57 live gear call missing from current Mahayana entrypoint');
if(!runner.includes('V310_FULLRUN_V57_GEAR_CALL'))throw new Error('V3.10 v57 runtime gear-call evidence marker missing');
if(!runner.includes("fail('v57-live-path-gear-not-ready'"))throw new Error('V3.10 v57 live gear readiness fail-closed guard missing');
if(!runner.includes('V310_FULLRUN_V56_PATH_GEAR'))throw new Error('V3.10 v57 lost V56 path gear implementation evidence');
if(!runner.includes('const V56_REALM33_GEAR_PLANS=Object.freeze({'))throw new Error('V3.10 v57 lost V56 four-path gear plans');
if(!runner.includes("ensureArtifactLoadoutItem(plan.assault,'assault',9)"))throw new Error('V3.10 v57 lost normal assault gear path');
if(!runner.includes("ensureArtifactLoadoutItem(plan.guard,'guard',9)"))throw new Error('V3.10 v57 lost normal guard gear path');
if(!runner.includes("ensureArtifactLoadoutItem(plan.support,'support',9)"))throw new Error('V3.10 v57 lost normal support gear path');
if(!runner.includes('ensureArtifactMaxPreparation(plan.natal,9,100)'))throw new Error('V3.10 v57 lost normal natal max preparation');
if(!runner.includes("spendAction('forge-realm33-gear:'+itemId,()=>invoke('forgeV32Item',itemId))"))throw new Error('V3.10 v57 lost ordinary forge API');
if(!runner.includes("spendAction('refine-realm33-max:'+itemId,()=>invoke('refineV32Artifact',itemId))"))throw new Error('V3.10 v57 lost ordinary refine API');
if(!runner.includes("spendAction('warm-realm33-max:'+itemId,()=>invoke('warmV32Artifact',itemId))"))throw new Error('V3.10 v57 lost ordinary warm API');
if(!runner.includes("['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-world-essence-dew','mat-v38-heaven-vein-marrow'].includes(id)&&tryAuctionMaterial(id,n,160)"))throw new Error('V3.10 v57 lost V55 scarce V3.8 auction routing');
if(!runner.includes('V310_FULLRUN_V52_MAHAYANA_BATCH'))throw new Error('V3.10 v57 lost V52 exact Mahayana batching');
if(!runner.includes('function finishTribulation(attempt=0)'))throw new Error('V3.10 v57 lost legal recoverable tribulation retry');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-v38-mahayana-essence'")||runner.includes("v33AddMaterial('mat-v38-origin-gold'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v57 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v57 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V57_FINAL_RUNNER_PASS '+JSON.stringify({liveRealm33GearCallRestored:true,allFourPaths:true,refinementTarget:9,warmthTarget:100,runtimeGearEvidenceRequired:true,failClosedIfGearNotReady:true,v56RiskMemoPreserved:true,v55ScarceAuctionRecoveryPreserved:true,v52MahayanaBatchPreserved:true,tribulationRulesUnchanged:true,gameBalanceDataUnchanged:true,actionCapUnchanged:true,maxActions:Number(process.env.V310_FULLRUN_MAX_ACTIONS||180000),noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v57final='+Date.now());
