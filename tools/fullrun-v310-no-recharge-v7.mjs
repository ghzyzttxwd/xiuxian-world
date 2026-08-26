import fs from 'fs';

const v6Path=new URL('./fullrun-v310-no-recharge-v6.mjs',import.meta.url);
const v6StagePath=new URL('./.generated-fullrun-v310-no-recharge-v7-v6stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v7 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v7 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// Build the exact v6 legal runner without executing it. V7 fixes only a harness assertion:
// learnV31Spell/ensureV31GrowthShape may compact null loadout slots, so a successfully equipped
// escape skill is not guaranteed to remain at physical array index 4. The game's combat rule is
// membership in activeSkillIds, not a fixed index. No gameplay state, prices, drops or gates change.
let v6=fs.readFileSync(v6Path,'utf8');
v6=replaceOnce(
 v6,
 "await import(finalRunnerPath.href+'?v6final='+Date.now());",
 "// v7 executes the final runner after correcting the loadout membership assertion.",
 'suppress v6 final auto-import'
);
fs.writeFileSync(v6StagePath,v6);
await import(v6StagePath.href+'?v7stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v7 did not obtain v6 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const before="if((state().player.activeSkillIds||[])[4]!==id){spendAction('equip-sword-escape-skill',()=>invoke('equipV31Skill',4,id));if((state().player.activeSkillIds||[])[4]!==id)fail('sword-escape-skill-equip-blocked',{id,active:state().player.activeSkillIds})}";
const after="if(!(state().player.activeSkillIds||[]).includes(id)){spendAction('equip-sword-escape-skill',()=>invoke('equipV31Skill',4,id));if(!(state().player.activeSkillIds||[]).includes(id))fail('sword-escape-skill-equip-blocked',{id,active:state().player.activeSkillIds})}";
runner=replaceOnce(runner,before,after,'sword escape active-loadout membership');

if(!runner.includes("if(!(state().player.activeSkillIds||[]).includes(id)){spendAction('equip-sword-escape-skill'"))throw new Error('V3.10 v7 membership assertion missing');
if(runner.includes("(state().player.activeSkillIds||[])[4]!==id"))throw new Error('V3.10 v7 stale fixed-slot assertion survived');
if(!runner.includes("combat-escape-shift"))throw new Error('V3.10 v7 lost legal sword escape usage');
if(!runner.includes("source:'unity-integration-jit'"))throw new Error('V3.10 v7 lost v6 JIT unity policy');
if(!runner.includes('function finishTribulation(attempt=0)'))throw new Error('V3.10 v7 lost recoverable tribulation retry');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v38-origin-gold'"))throw new Error('forbidden progression shortcut leaked into V3.10 v7 runner');

fs.writeFileSync(finalRunnerPath,runner);
console.log('V310_FULLRUN_V7_FINAL_RUNNER_PASS '+JSON.stringify({escapeSkillMembershipAssertion:true,fixedSlotAssumptionRemoved:true,normalEquipApiPreserved:true,jitUnityPreserved:true,tribulationRetryPreserved:true,noGameplayMutation:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v7final='+Date.now());
