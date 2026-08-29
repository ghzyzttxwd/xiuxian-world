import fs from 'fs';
import {spawnSync} from 'child_process';

const v30Path=new URL('./fullrun-v310-no-recharge-v30.mjs',import.meta.url);
const v30StagePath=new URL('./.generated-fullrun-v310-no-recharge-v31-v30stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v31 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v31 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V30 body legally reached realm15 and then exposed a harness scheduling defect: the runner tried to
// forge its chosen natal base immediately at realm15 even though the catalog itself unlocks the body
// artifact (万兽镇岳印) at realm18. Spirit's planned 古河断禁尺 similarly unlocks at realm20.
// A real player can simply continue cultivation until the catalog unlock. V31 therefore defers only
// the runner's optional natal-artifact preparation until the chosen item's existing unlock realm.
// Catalog unlocks, forge costs, breakthrough gates, drops, RNG, time costs and runtime state are unchanged.
let v30=fs.readFileSync(v30Path,'utf8');
v30=replaceOnce(
 v30,
 "await import(finalRunnerPath.href+'?v30final='+Date.now());",
 "// v31 executes the final runner after respecting formal natal-item unlock timing.",
 'suppress v30 final auto-import'
);
fs.writeFileSync(v30StagePath,v30);
await import(v30StagePath.href+'?v31stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v31 did not obtain v30 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const before="if(!item)fail('natal-item-registry-missing',{itemId:plan.itemId});let guard=0;while(!state().player.equipmentInventory?.[plan.itemId]){";
const after="if(!item)fail('natal-item-registry-missing',{itemId:plan.itemId});const unlock=Math.max(0,Number(item.unlock)||0);if(p.realmIndex<unlock){console.log('V310_FULLRUN_V31_DEFER_NATAL',JSON.stringify({daoPath:DAO_PATH,itemId:plan.itemId,realm:p.realmIndex,unlock,actions}));return}let guard=0;while(!state().player.equipmentInventory?.[plan.itemId]){";
runner=replaceOnce(runner,before,after,'defer natal preparation until formal item unlock');

if(!runner.includes('V310_FULLRUN_V31_DEFER_NATAL'))throw new Error('V3.10 v31 natal defer diagnostic missing');
if(!runner.includes("body:{itemId:'item-v32-mountainseal',sources:['万兽山脉']}"))throw new Error('V3.10 v31 body natal plan drifted');
if(!runner.includes("spirit:{itemId:'item-v32-banbreaker-ruler',sources:['古河遗迹']}"))throw new Error('V3.10 v31 spirit natal plan drifted');
if(!runner.includes('function ensureBloodContractRare(n)'))throw new Error('V3.10 v31 lost v30 legal rare route');
if(!runner.includes('V310_FULLRUN_V30_SKIP_OPTIONAL_PREPATH_MANUAL'))throw new Error('V3.10 v31 lost v30 pre-path manual strategy');
if(!runner.includes('function ensureNonSwordDaoResources()'))throw new Error('V3.10 v31 lost v29 exact path preparation');
if(!runner.includes("source:'secret-realm'"))throw new Error('V3.10 v31 lost normal secret-realm insight strategy');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v31 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v31 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V31_FINAL_RUNNER_PASS '+JSON.stringify({formalNatalUnlockRespected:true,natalCatalogUnlocksUnchanged:true,natalForgeCostsUnchanged:true,breakthroughRequirementsUnchanged:true,v30RareStrategyPreserved:true,v30ManualStrategyPreserved:true,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v31final='+Date.now());
