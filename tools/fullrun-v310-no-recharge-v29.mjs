import fs from 'fs';
import {spawnSync} from 'child_process';

const v28Path=new URL('./fullrun-v310-no-recharge-v28.mjs',import.meta.url);
const v28StagePath=new URL('./.generated-fullrun-v310-no-recharge-v29-v28stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v29 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v29 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V28 is an authoritative fresh-save/no-recharge PASS for sword. The first independent matrix run
// then exposed two non-sword runner defects before any new game-balance conclusion can be drawn:
// 1) choosePath() prepared the Qingyun-specific sword route, but for every other path it only ensured
//    2 insight and immediately called chooseDaoPath from the current location. The real V3.9 path
//    surface requires path-specific location and simultaneous costs:
//      flame  赤霞谷: 35 stones + 3 rare + 2 insight
//      body   万兽山脉: 30 stones + 3 rare + 2 insight + 10 beast materials
//      spirit 古河遗迹/玄阴禁地: 45 stones + 2 rare + 3 insight + 5 relic fragments
// 2) before realm14, improveManual() could treat an optional generic manual upgrade as mandatory and
//    burn the entire insight-source wait loop on a seed with no currently safe secret realm. A normal
//    player can simply keep the existing manual until the realm14 path inheritance becomes available.
//
// V29 changes runner strategy only. It farms the exact formal path costs through existing normal
// helpers, preserves enough relic fragments after normal deciphering for spirit, travels through the
// normal route graph to the actual inheritance location, and asserts the simultaneous cost surface.
// Optional pre-path manual upgrades are skipped only when they require insight the player does not
// currently have. No runtime values, drops, enemies, prices, path costs, RNG, time costs or action cap
// are changed.
let v28=fs.readFileSync(v28Path,'utf8');
v28=replaceOnce(
 v28,
 "await import(finalRunnerPath.href+'?v28final='+Date.now());",
 "// v29 executes the final runner after legal non-sword inheritance preparation.",
 'suppress v28 final auto-import'
);
fs.writeFileSync(v28StagePath,v28);
await import(v28StagePath.href+'?v29stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v29 did not obtain v28 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const chooseBefore="function choosePath(){const p=state().player;if(p.daoPath===DAO_PATH)return;if(p.daoPath!=='none'&&p.daoPath!==DAO_PATH)fail('dao-path-mismatch',{current:p.daoPath,wanted:DAO_PATH});if(p.realmIndex<14)return;if(DAO_PATH==='sword'){ensureSwordDaoResources();if(!goTo('青云山'))fail('sword-dao-location-unreachable',{})}else{ensureInsight(2)}spendAction('choose-dao-path',()=>invoke('chooseDaoPath',DAO_PATH));if(state().player.daoPath!==DAO_PATH)fail('dao-path-choice-blocked',{wanted:DAO_PATH,actual:state().player.daoPath,state:slimState(),career:DAO_PATH==='sword'?invoke('sectCareerInfo'):null})}";
const chooseAfter=`function ensureNonSwordDaoResources(){
 if(DAO_PATH==='sword'||state().player.realmIndex<14)return;
 const plans={
  flame:{locations:['赤霞谷'],stones:35,rare:3,insight:2,materials:0,relic:0},
  body:{locations:['万兽山脉'],stones:30,rare:3,insight:2,materials:10,relic:0},
  spirit:{locations:['古河遗迹','玄阴禁地'],stones:45,rare:2,insight:3,materials:0,relic:5}
 };
 const plan=plans[DAO_PATH];if(!plan)fail('non-sword-dao-plan-missing',{daoPath:DAO_PATH});
 ensureRare(plan.rare);
 if(plan.materials)ensureBeast(plan.materials);
 if(plan.relic){
  const insightDeficit=Math.max(0,plan.insight-(state().player.insight||0));
  ensureRelic(plan.relic+insightDeficit*3);
  ensureInsight(plan.insight);
  ensureRelic(plan.relic);
 }else ensureInsight(plan.insight);
 let dest=null,route=null,guard=0;
 while(!dest){
  if(++guard>6)fail('non-sword-dao-route-loop',{daoPath:DAO_PATH,location:state().player.location,stones:state().player.spiritStones});
  for(const loc of plan.locations){const p=findPath(state().player.location,loc);if(p){dest=loc;route=p;break}}
  if(!dest)fail('non-sword-dao-location-unreachable',{daoPath:DAO_PATH,locations:plan.locations,location:state().player.location});
  const fee=(route||[]).reduce((sum,r)=>sum+Math.max(0,Number(r.fee)||0),0);
  if(state().player.spiritStones<plan.stones+fee){dest=null;route=null;ensureStones(plan.stones+fee);continue}
 }
 if(!goTo(dest))fail('non-sword-dao-location-unreachable',{daoPath:DAO_PATH,dest});
 const p=state().player;
 if(p.spiritStones<plan.stones||(p.rareMaterials||0)<plan.rare||(p.insight||0)<plan.insight||(p.beastMaterials||0)<plan.materials||(p.relicFragments||0)<plan.relic)fail('non-sword-dao-cost-desynced',{daoPath:DAO_PATH,dest,plan,stones:p.spiritStones,rare:p.rareMaterials,insight:p.insight,materials:p.beastMaterials,relic:p.relicFragments});
 console.log('V310_FULLRUN_V29_DAO_READY',JSON.stringify({daoPath:DAO_PATH,dest,stones:p.spiritStones,rare:p.rareMaterials,insight:p.insight,materials:p.beastMaterials,relic:p.relicFragments,actions}));
}
function choosePath(){const p=state().player;if(p.daoPath===DAO_PATH)return;if(p.daoPath!=='none'&&p.daoPath!==DAO_PATH)fail('dao-path-mismatch',{current:p.daoPath,wanted:DAO_PATH});if(p.realmIndex<14)return;if(DAO_PATH==='sword'){ensureSwordDaoResources();if(!goTo('青云山'))fail('sword-dao-location-unreachable',{})}else ensureNonSwordDaoResources();spendAction('choose-dao-path',()=>invoke('chooseDaoPath',DAO_PATH));if(state().player.daoPath!==DAO_PATH)fail('dao-path-choice-blocked',{wanted:DAO_PATH,actual:state().player.daoPath,state:slimState(),career:DAO_PATH==='sword'?invoke('sectCareerInfo'):null})}`;
runner=replaceOnce(runner,chooseBefore,chooseAfter,'prepare exact non-sword path location and costs before choosing dao');

const manualBefore="function improveManual(){choosePath();const row=bestManualCandidate();if(!row)return;const current=registry.manuals[state().player.manualId]||Object.values(registry.manuals).find(x=>x.name===state().player.manual);if(current&&Number(current.mult||1)>=Number(row.mult||1)-.001)return;const meta=registry.manuals[row.id]||row;if(!(meta.sources||[]).some(x=>findPath(state().player.location,x)!==null))return;ensureCost(meta.cost||{});const loc=goAny(meta.sources||[]);if(!loc)return;const res=spendAction(`learn-manual:${row.id}`,()=>invoke('learnV31Manual',row.id));if(!['learned','known'].includes(res))return;spendAction(`switch-manual:${row.id}`,()=>invoke('switchV31Manual',row.id))}";
const manualAfter="function improveManual(){choosePath();const row=bestManualCandidate();if(!row)return;const current=registry.manuals[state().player.manualId]||Object.values(registry.manuals).find(x=>x.name===state().player.manual);if(current&&Number(current.mult||1)>=Number(row.mult||1)-.001)return;const meta=registry.manuals[row.id]||row;if(!(meta.sources||[]).some(x=>findPath(state().player.location,x)!==null))return;if(DAO_PATH!=='sword'&&state().player.daoPath==='none'&&state().player.realmIndex<14&&Number(meta.cost?.insight||0)>(state().player.insight||0)){console.log('V310_FULLRUN_V29_SKIP_OPTIONAL_PREPATH_MANUAL',JSON.stringify({daoPath:DAO_PATH,realm:state().player.realmIndex,manual:row.id,needInsight:Number(meta.cost?.insight||0),insight:state().player.insight,actions}));return}ensureCost(meta.cost||{});const loc=goAny(meta.sources||[]);if(!loc)return;const res=spendAction(`learn-manual:${row.id}`,()=>invoke('learnV31Manual',row.id));if(!['learned','known'].includes(res))return;spendAction(`switch-manual:${row.id}`,()=>invoke('switchV31Manual',row.id))}";
runner=replaceOnce(runner,manualBefore,manualAfter,'skip optional non-sword pre-path manual when insight is currently unavailable');

if(!runner.includes('function ensureNonSwordDaoResources()'))throw new Error('V3.10 v29 non-sword dao preparation helper missing');
if(!runner.includes("flame:{locations:['赤霞谷'],stones:35,rare:3,insight:2"))throw new Error('V3.10 v29 flame formal path surface missing');
if(!runner.includes("body:{locations:['万兽山脉'],stones:30,rare:3,insight:2,materials:10"))throw new Error('V3.10 v29 body formal path surface missing');
if(!runner.includes("spirit:{locations:['古河遗迹','玄阴禁地'],stones:45,rare:2,insight:3,materials:0,relic:5"))throw new Error('V3.10 v29 spirit formal path surface missing');
if(!runner.includes('plan.relic+insightDeficit*3'))throw new Error('V3.10 v29 spirit simultaneous relic/insight preservation missing');
if(!runner.includes('V310_FULLRUN_V29_DAO_READY'))throw new Error('V3.10 v29 path readiness diagnostic missing');
if(!runner.includes('V310_FULLRUN_V29_SKIP_OPTIONAL_PREPATH_MANUAL'))throw new Error('V3.10 v29 optional pre-path manual skip diagnostic missing');
if(!runner.includes("querySelectorAll('[data-combat]')"))throw new Error('V3.10 v29 lost v28 UI-aware combat action selection');
if(!runner.includes('repairTribulationNatal();prepareTribulationV26();'))throw new Error('V3.10 v29 lost v28 proven terminal preparation route');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes('forceNpc')||runner.includes('ActivateBuildForTest'))throw new Error('forbidden shortcut leaked into V3.10 v29 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v29 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V29_FINAL_RUNNER_PASS '+JSON.stringify({exactNonSwordPathCosts:true,normalPathLocations:true,simultaneousSpiritRelicAndInsight:true,optionalPrePathInsightManualMayWait:true,swordV28StrategyPreserved:true,normalHelpersOnly:true,pathCostsUnchanged:true,dropRatesUnchanged:true,enemyTablesUnchanged:true,rngUnchanged:true,timeCostsUnchanged:true,actionCapUnchanged:true,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v29final='+Date.now());
