import fs from 'fs';
import {spawnSync} from 'child_process';

const v38Path=new URL('./fullrun-v310-no-recharge-v38.mjs',import.meta.url);
const v38StagePath=new URL('./.generated-fullrun-v310-no-recharge-v39-v38stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v39 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v39 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v39 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v39 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v39 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V38 kept all formal V3.10 regressions green, but its fresh-save proof exposed two harness-only
// regressions plus one remaining mandatory-zone risk:
// 1) body/flame/spirit all stopped at realm10 because V38 tried to learn Golden Bell immediately.
//    The real V3.1 spell cost for unlock-10 skills includes one insight, while a realm10 fresh save has
//    no stable reason to spend insight on an optional defense before the realm13 breakthrough gate.
// 2) V38's path loadout learned Golden Bell and then overwrote its slot with a movement/path skill, so
//    deterministic escapeSkillPriority could not actually use the shield in later dangerous regions.
// 3) sword reached realm18 and died during a mandatory Ancient River material/refining trip. V39 keeps
//    the game rules untouched, but records every real flee so any repeat can be classified precisely.
//
// V39 therefore learns no paid survival spell at realm10. At the actual realm13 major-gate preparation,
// it first obtains the normal required insight, legally learns/equips Golden Bell, replenishes insight if
// the spell consumed one point, and only then enters the core-refining chain. After dao selection,
// Golden Bell stays fixed in slot4 and the path-specific movement/defense skill uses slot5. Flee chance,
// enemy stats, route risk, spell effects/costs, drops, RNG, death risk and all runtime gameplay remain
// unchanged.
let v38=fs.readFileSync(v38Path,'utf8');
v38=replaceOnce(
 v38,
 "await import(finalRunnerPath.href+'?v38final='+Date.now());",
 "// v39 executes the final runner after delayed legal shield acquisition and stable survival slots.",
 'suppress v38 final auto-import'
);
fs.writeFileSync(v38StagePath,v38);
await import(v38StagePath.href+'?v39stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v39 did not obtain v38 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const survivalLoadout=`function ensureSurvivalLoadout(){
 const p=state().player;if(p.realmIndex<10)return;
 if(p.daoPath!==DAO_PATH){
  console.log('V310_FULLRUN_V39_PREDAO_SURVIVAL_DEFER',JSON.stringify({realm:p.realmIndex,location:p.location,insight:p.insight,slot4:p.activeSkillIds?.[4]||null,slot5:p.activeSkillIds?.[5]||null,actions}));
  return;
 }
 const shieldReady=ensureSurvivalSkill('spell-golden-bell',4);
 const plans={
  sword:['spell-v36-sword-space-step','spell-sword-escape'],
  flame:['spell-v36-flame-voidflash','spell-fire-escape'],
  body:['spell-v36-body-boundary-form','spell-immovable-king','spell-vajra-guard'],
  spirit:['spell-v36-spirit-shift','spell-taixu-godseal-domain','spell-divine-sense-barrier']
 };
 let chosen=null;for(const id of plans[DAO_PATH]||[]){if(ensureSurvivalSkill(id,5)){chosen=id;break}}
 console.log('V310_FULLRUN_V39_SURVIVAL_LOADOUT',JSON.stringify({realm:p.realmIndex,path:DAO_PATH,shieldReady,slot4:state().player.activeSkillIds?.[4]||null,slot5:state().player.activeSkillIds?.[5]||null,pathSurvival:chosen,actions}));
}`;
runner=replaceFunction(runner,'function ensureSurvivalLoadout(',survivalLoadout,'defer paid pre-dao survival and preserve golden bell slot');

runner=replaceOnce(
 runner,
 "if(i===13){ensureInsight(req.insight||0);ensureCore(req.core||0)}else if(i===14){ensureCore(req.core||0);ensureInsight(req.insight||0)}",
 "if(i===13){ensureInsight(req.insight||0);ensureSurvivalSkill('spell-golden-bell',4);ensureInsight(req.insight||0);ensureCore(req.core||0)}else if(i===14){ensureCore(req.core||0);ensureInsight(req.insight||0)}",
 'learn legal shield only at real realm13 major gate'
);

const fleeBefore=`fleeAttempts++;
  spendAction('combat-flee',()=>invoke('combatAction','flee'));`;
const fleeAfter=`console.log('V310_FULLRUN_V39_FLEE',JSON.stringify({enemy:c.enemy?.name||null,enemyRealm,playerRealm:s.player.realmIndex,playerMajor:runnerMajorStage(s.player.realmIndex),enemyMajor:runnerMajorStage(enemyRealm),hp:c.playerHp,maxHp:invoke('maxHp'),hpRatio:Number((c.playerHp/Math.max(1,invoke('maxHp'))).toFixed(3)),enemyHp:c.enemyHp,enemyMaxHp:c.enemy?.hp||null,fleeAttempt:fleeAttempts+1,location:s.player.location,preferWin,activeSkills:s.player.activeSkillIds||[],guardArtifact:s.player.artifactLoadout?.guard||null,actions}));
  fleeAttempts++;
  spendAction('combat-flee',()=>invoke('combatAction','flee'));`;
runner=replaceOnce(runner,fleeBefore,fleeAfter,'log every real flee attempt before normal combat API');

if(!runner.includes('V310_FULLRUN_V39_PREDAO_SURVIVAL_DEFER'))throw new Error('V3.10 v39 pre-dao defer marker missing');
if(!runner.includes("const shieldReady=ensureSurvivalSkill('spell-golden-bell',4);"))throw new Error('V3.10 v39 stable golden bell slot missing');
if(!runner.includes("ensureSurvivalSkill('spell-golden-bell',4);ensureInsight(req.insight||0);ensureCore"))throw new Error('V3.10 v39 realm13 shield timing missing');
if(!runner.includes('V310_FULLRUN_V39_FLEE'))throw new Error('V3.10 v39 flee diagnostic missing');
if(runner.includes("ensureSurvivalSkill('spell-windstep',4);ensureSurvivalSkill('spell-golden-bell',5);"))throw new Error('V3.10 v39 stale realm10 paid survival loadout survived');
if(!runner.includes('function routeEnemyCeilingForRunner(')||!runner.includes('function optionalUpgradeSource('))throw new Error('V3.10 v39 lost V38 risk-aware routing');
if(!runner.includes('escapePreparedAt=-1'))throw new Error('V3.10 v39 lost V38 single-prep escape accounting');
if(!runner.includes('core-batch')||!runner.includes('nascent-batch')||!runner.includes('deification-batch'))throw new Error('V3.10 v39 lost V38 batch refining');
if(!runner.includes("tryRelicAuction(3,24)"))throw new Error('V3.10 v39 lost legal paid relic insight fallback');
if(!runner.includes("if(tryBeastMarket(n,24))return;"))throw new Error('V3.10 v39 lost legal paid beast market');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-beast-material'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v39 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v39 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V39_FINAL_RUNNER_PASS '+JSON.stringify({realm10PaidSurvivalRemoved:true,realm13LegalGoldenBell:true,realm13InsightReplenishedAfterSpellCost:true,goldenBellFixedSlot4:true,pathSurvivalFixedSlot5:true,riskAwareRoutingPreserved:true,onePrepPerFleeAttemptPreserved:true,batchRefiningPreserved:true,realFleeDiagnostics:true,fleeChanceUnchanged:true,enemyStatsUnchanged:true,routeRiskUnchanged:true,spellEffectsAndCostsUnchanged:true,dropRatesUnchanged:true,deathRiskUnchanged:true,rngUnchanged:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v39final='+Date.now());
