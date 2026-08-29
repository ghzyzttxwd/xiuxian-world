import fs from 'fs';
import {spawnSync} from 'child_process';

const v29Path=new URL('./fullrun-v310-no-recharge-v29.mjs',import.meta.url);
const v29StagePath=new URL('./.generated-fullrun-v310-no-recharge-v30-v29stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v30 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v30 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// The first V29 four-path run exposed two runner-strategy deadlocks, not a reason to weaken game data:
// 1) flame/body reached realm14 with thousands of legal actions but zero rare material because the
//    inherited generic ensureRare() blindly explored realm14 maps. Generic combat rare drops only begin
//    on realm15+ enemies. The existing Blood Blade faction contract is already a normal realm14 source:
//    it awards one rare material after two matching fights and has a real 10-day cooldown.
// 2) spirit stopped mid-cultivation at realm13 while an optional pre-path manual upgrade tried to spend
//    scarce insight. Before realm14 a non-sword player may simply keep the current manual; the formal
//    major-breakthrough insight cost and the later path-inheritance costs remain mandatory.
// V30 therefore changes autonomous player strategy only. No drop rate, contract reward, breakthrough
// requirement, path cost, enemy table, RNG, time cost, lifespan, price, action cap or runtime state is changed.
let v29=fs.readFileSync(v29Path,'utf8');
v29=replaceOnce(
 v29,
 "await import(finalRunnerPath.href+'?v29final='+Date.now());",
 "// v30 executes the final runner after legal pre-path resource-strategy repairs.",
 'suppress v29 final auto-import'
);
fs.writeFileSync(v29StagePath,v29);
await import(v29StagePath.href+'?v30stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v30 did not obtain v29 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const rareBefore="function ensureRare(n){if(state().player.rareMaterials>=n)return;if(DAO_PATH==='sword'&&state().player.sect==='青云宗'&&invoke('sectRankIndex')>=2){let guard=0;while(state().player.rareMaterials<n){if(++guard>Math.max(40,n*4))fail('sect-rare-exchange-deadlock',{target:n,rare:state().player.rareMaterials,career:invoke('sectCareerInfo')});while((invoke('sectCareerInfo').contribution||0)<36)sectRoutine('escort');if(!goTo('青云山'))fail('sect-rare-exchange-home-unreachable',{target:n});const before=state().player.rareMaterials;spendAction('sect-exchange-rare-ui',()=>{const b=dom.window.document.querySelector('[data-sect-exchange=\"rare\"]');if(!b)fail('sect-rare-exchange-ui-missing',{target:n,career:invoke('sectCareerInfo')});b.click()});if(state().player.rareMaterials<=before)fail('sect-rare-exchange-no-progress',{target:n,before,after:state().player.rareMaterials,career:invoke('sectCareerInfo')})}return}const loc=goAny(['赤霞谷','古河遗迹','万兽山脉','玄阴禁地']);if(!loc)fail('rare-source-unreachable',{target:n});let guard=0;while(state().player.rareMaterials<n){if(++guard>MAX_FARM_ACTIONS)fail('rare-farm-deadlock',{target:n,location:loc});act('explore',true)}}";
const rareAfter=`function ensureBloodContractRare(n){
 if(state().player.rareMaterials>=n)return true;
 if(DAO_PATH==='sword'||state().player.realmIndex>=15||state().player.sect==='青云宗')return false;
 let guard=0;
 while(state().player.rareMaterials<n){
  if(++guard>Math.max(180,n*90))fail('blood-contract-rare-deadlock',{target:n,rare:state().player.rareMaterials,realm:state().player.realmIndex,location:state().player.location,standing:invoke('factionStandingSnapshot').blood,contract:invoke('factionContractInfo')});
  if(!goTo('赤霞谷'))fail('blood-contract-home-unreachable',{target:n,location:state().player.location});
  let c=invoke('factionContractInfo');
  if(!c){
   spendAction('accept-blood-contract',()=>invoke('acceptFactionContract','blood'));
   c=invoke('factionContractInfo');
   if(!c){act('rest',false);continue}
  }
  if(c.faction!=='blood')fail('blood-contract-conflict',{target:n,contract:c});
  let fights=0;
  while(invoke('factionContractInfo')){
   if(++fights>100)fail('blood-contract-combat-loop',{target:n,rare:state().player.rareMaterials,contract:invoke('factionContractInfo'),location:state().player.location});
   if(state().player.location!=='赤霞谷'&&!goTo('赤霞谷'))fail('blood-contract-field-unreachable',{target:n,location:state().player.location});
   act('explore',true);
  }
  console.log('V310_FULLRUN_V30_RARE',JSON.stringify({source:'blood-contract',target:n,rare:state().player.rareMaterials,standing:invoke('factionStandingSnapshot').blood,actions}));
 }
 return true;
}
function ensureRare(n){if(state().player.rareMaterials>=n)return;if(DAO_PATH==='sword'&&state().player.sect==='青云宗'&&invoke('sectRankIndex')>=2){let guard=0;while(state().player.rareMaterials<n){if(++guard>Math.max(40,n*4))fail('sect-rare-exchange-deadlock',{target:n,rare:state().player.rareMaterials,career:invoke('sectCareerInfo')});while((invoke('sectCareerInfo').contribution||0)<36)sectRoutine('escort');if(!goTo('青云山'))fail('sect-rare-exchange-home-unreachable',{target:n});const before=state().player.rareMaterials;spendAction('sect-exchange-rare-ui',()=>{const b=dom.window.document.querySelector('[data-sect-exchange=\"rare\"]');if(!b)fail('sect-rare-exchange-ui-missing',{target:n,career:invoke('sectCareerInfo')});b.click()});if(state().player.rareMaterials<=before)fail('sect-rare-exchange-no-progress',{target:n,before,after:state().player.rareMaterials,career:invoke('sectCareerInfo')})}return}if(ensureBloodContractRare(n))return;const loc=goAny(['赤霞谷','古河遗迹','万兽山脉','玄阴禁地']);if(!loc)fail('rare-source-unreachable',{target:n});let guard=0;while(state().player.rareMaterials<n){if(++guard>MAX_FARM_ACTIONS)fail('rare-farm-deadlock',{target:n,location:loc,realm:state().player.realmIndex});act('explore',true)}}`;
runner=replaceOnce(runner,rareBefore,rareAfter,'use normal blood contracts for pre-realm15 non-sword rare material');

const manualBefore="function improveManual(){choosePath();const row=bestManualCandidate();if(!row)return;const current=registry.manuals[state().player.manualId]||Object.values(registry.manuals).find(x=>x.name===state().player.manual);if(current&&Number(current.mult||1)>=Number(row.mult||1)-.001)return;const meta=registry.manuals[row.id]||row;if(!(meta.sources||[]).some(x=>findPath(state().player.location,x)!==null))return;if(DAO_PATH!=='sword'&&state().player.daoPath==='none'&&state().player.realmIndex<14&&Number(meta.cost?.insight||0)>(state().player.insight||0)){console.log('V310_FULLRUN_V29_SKIP_OPTIONAL_PREPATH_MANUAL',JSON.stringify({daoPath:DAO_PATH,realm:state().player.realmIndex,manual:row.id,needInsight:Number(meta.cost?.insight||0),insight:state().player.insight,actions}));return}ensureCost(meta.cost||{});const loc=goAny(meta.sources||[]);if(!loc)return;const res=spendAction(`learn-manual:${row.id}`,()=>invoke('learnV31Manual',row.id));if(!['learned','known'].includes(res))return;spendAction(`switch-manual:${row.id}`,()=>invoke('switchV31Manual',row.id))}";
const manualAfter="function improveManual(){choosePath();const row=bestManualCandidate();if(!row)return;const current=registry.manuals[state().player.manualId]||Object.values(registry.manuals).find(x=>x.name===state().player.manual);if(current&&Number(current.mult||1)>=Number(row.mult||1)-.001)return;const meta=registry.manuals[row.id]||row;if(!(meta.sources||[]).some(x=>findPath(state().player.location,x)!==null))return;if(DAO_PATH!=='sword'&&state().player.daoPath==='none'&&state().player.realmIndex<14){console.log('V310_FULLRUN_V30_SKIP_OPTIONAL_PREPATH_MANUAL',JSON.stringify({daoPath:DAO_PATH,realm:state().player.realmIndex,manual:row.id,cost:meta.cost||{},insight:state().player.insight,progress:state().player.progress,actions}));return}ensureCost(meta.cost||{});const loc=goAny(meta.sources||[]);if(!loc)return;const res=spendAction(`learn-manual:${row.id}`,()=>invoke('learnV31Manual',row.id));if(!['learned','known'].includes(res))return;spendAction(`switch-manual:${row.id}`,()=>invoke('switchV31Manual',row.id))}";
runner=replaceOnce(runner,manualBefore,manualAfter,'skip all optional non-sword pre-path manual upgrades before realm14 inheritance');

if(!runner.includes('function ensureBloodContractRare(n)'))throw new Error('V3.10 v30 blood-contract rare helper missing');
if(!runner.includes("invoke('acceptFactionContract','blood')"))throw new Error('V3.10 v30 normal blood contract call missing');
if(!runner.includes("source:'blood-contract'"))throw new Error('V3.10 v30 blood-contract evidence missing');
if(!runner.includes('V310_FULLRUN_V30_SKIP_OPTIONAL_PREPATH_MANUAL'))throw new Error('V3.10 v30 unconditional optional pre-path manual skip missing');
if(!runner.includes('function ensureNonSwordDaoResources()'))throw new Error('V3.10 v30 lost v29 exact path preparation');
if(!runner.includes("source:'secret-realm'"))throw new Error('V3.10 v30 lost normal secret-realm insight strategy');
if(!runner.includes("querySelectorAll('[data-combat]')"))throw new Error('V3.10 v30 lost v28 UI-aware combat action selection');
if(!runner.includes('repairTribulationNatal();prepareTribulationV26();'))throw new Error('V3.10 v30 lost v28 proven terminal preparation route');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v30 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v30 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V30_FINAL_RUNNER_PASS '+JSON.stringify({preRealm15NonSwordRareViaNormalBloodContract:true,bloodContractRewardUnchanged:true,bloodContractCooldownUnchanged:true,optionalPrePathManualMayWait:true,formalBreakthroughInsightStillMandatory:true,formalDaoCostsStillMandatory:true,secretRealmInsightPreserved:true,swordV29StrategyPreserved:true,dropRatesUnchanged:true,enemyTablesUnchanged:true,rngUnchanged:true,timeCostsUnchanged:true,actionCapUnchanged:true,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v30final='+Date.now());
