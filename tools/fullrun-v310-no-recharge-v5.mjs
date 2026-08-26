import fs from 'fs';

const v4Path=new URL('./fullrun-v310-no-recharge-v4.mjs',import.meta.url);
const v4StagePath=new URL('./.generated-fullrun-v310-no-recharge-v5-v4stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v5 final-runner transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v5 final-runner transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// Let v4 build its exact legal final runner, but suppress v4's final import so this layer can
// repair harness semantics before executing it. The candidate game source is not modified.
let v4=fs.readFileSync(v4Path,'utf8');
v4=replaceOnce(
 v4,
 "await import(finalRunnerPath.href+'?v4final='+Date.now());",
 "// v5 executes the final runner after its harness-only recovery transform.",
 'suppress v4 final auto-import'
);
fs.writeFileSync(v4StagePath,v4);
await import(v4StagePath.href+'?v5stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v5 did not obtain v4 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

// V3.9 deliberately models a nonfatal immortal-tribulation failure as a recoverable setback:
// status becomes "failed", the player returns to 九霄劫台 with severe injury, preparation and
// formation integrity are reduced, lifespan is lost, and later v39BeginTribulation accepts the
// failed state again. The old harness incorrectly treated that normal setback as terminal proof
// failure. Recover exactly as an ordinary player must: cultivate/heal, repair a damaged natal
// artifact with normal stones/materials, rebuild every readiness requirement, pay a new formation,
// and begin a fresh attempt. Fatal death is still caught by spendAction and remains terminal.
runner=replaceOnce(
 runner,
 'function finishTribulation(){prepareTribulation();',
 "function repairTribulationNatal(){const p=state().player,id=p.natalArtifactId,rec=id&&p.equipmentInventory?.[id];if(!rec?.damaged)return;ensureStones(500);ensureRare(20);const r=spendAction('repair-tribulation-natal',()=>invoke('repairV32Artifact',id));if(!['ok','healthy'].includes(r))fail('tribulation-natal-repair-blocked',{result:r,id})}\nfunction finishTribulation(attempt=0){if(attempt>6)fail('tribulation-retry-limit',{attempt,state:invoke('v39StateSnapshot')});cultivateFull();heal();repairTribulationNatal();prepareTribulation();",
 'add ordinary tribulation recovery loop'
);

runner=replaceOnce(
 runner,
 "r=spendAction('resolve-thunder',()=>invoke('v39ResolveThunder'));heal();if(r?.outcome==='failure'||r?.ok===false)fail('thunder-failure',{result:r,state:invoke('v39StateSnapshot')})",
 "const stage=invoke('v39ThunderStage'),strategy=['body','law','artifact'].includes(stage?.focus)?stage.focus:'balanced';r=spendAction('resolve-thunder',()=>invoke('v39ResolveThunder',strategy));heal();if(r?.ok===false)fail('thunder-resolution-blocked',{result:r,state:invoke('v39StateSnapshot')});if(r?.outcome==='failure'){console.log('V310_FULLRUN_TRIBULATION_RETRY',JSON.stringify({phase:'thunder',attempt:attempt+1,stage:r.stage,lifeLoss:r.lifeLoss,actions}));return finishTribulation(attempt+1)}",
 'retry surviving thunder failure with stage-appropriate normal strategy'
);

runner=replaceOnce(
 runner,
 "r=spendAction('resolve-heart-demon',()=>invoke('v39ResolveHeartDemon'));heal();if(r?.outcome==='failure'||r?.ok===false)fail('heart-demon-failure',{result:r,state:invoke('v39StateSnapshot')})",
 "r=spendAction('resolve-heart-demon',()=>invoke('v39ResolveHeartDemon','self'));heal();if(r?.ok===false)fail('heart-demon-resolution-blocked',{result:r,state:invoke('v39StateSnapshot')});if(r?.outcome==='failure'){console.log('V310_FULLRUN_TRIBULATION_RETRY',JSON.stringify({phase:'heart',attempt:attempt+1,lifeLoss:r.lifeLoss,actions}));return finishTribulation(attempt+1)}",
 'retry surviving heart-demon failure'
);

runner=replaceOnce(
 runner,
 "r=spendAction('resolve-transformation',()=>invoke('v39ResolveTransformation'));heal();if(r?.outcome==='failure'||r?.ok===false)fail('transformation-failure',{result:r,state:invoke('v39StateSnapshot')})",
 "r=spendAction('resolve-transformation',()=>invoke('v39ResolveTransformation','balanced'));heal();if(r?.ok===false)fail('transformation-resolution-blocked',{result:r,state:invoke('v39StateSnapshot')});if(r?.outcome==='failure'){console.log('V310_FULLRUN_TRIBULATION_RETRY',JSON.stringify({phase:'transformation',attempt:attempt+1,stage:r.stage,lifeLoss:r.lifeLoss,actions}));return finishTribulation(attempt+1)}",
 'retry surviving immortal-transformation failure'
);

// Exact executable proof: recovery remains legal gameplay and no force argument is introduced.
if(!runner.includes('function finishTribulation(attempt=0)'))throw new Error('final runner missing tribulation retry loop');
if(!runner.includes("repairTribulationNatal();prepareTribulation();"))throw new Error('final runner does not repair normal setback damage before retry');
if(!runner.includes("return finishTribulation(attempt+1)"))throw new Error('final runner does not retry recoverable setbacks');
if(!runner.includes("invoke('v39ResolveThunder',strategy)"))throw new Error('final runner missing normal stage strategy choice');
if(!runner.includes("invoke('v39ResolveHeartDemon','self')"))throw new Error('final runner missing normal heart strategy');
if(!runner.includes("invoke('v39ResolveTransformation','balanced')"))throw new Error('final runner missing normal transformation strategy');
if(runner.includes("v39ResolveThunder','success")||runner.includes("v39ResolveHeartDemon','success")||runner.includes("v39ResolveTransformation','success"))throw new Error('forced tribulation success leaked into final runner');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v37-unity-seed'"))throw new Error('forbidden progression shortcut leaked into final runner');

fs.writeFileSync(finalRunnerPath,runner);
console.log('V310_FULLRUN_V5_FINAL_RUNNER_PASS '+JSON.stringify({recoverableTribulationRetry:true,natalRepair:true,readinessRebuild:true,formationRebuild:true,stageStrategy:true,noForcedSuccess:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v5final='+Date.now());
