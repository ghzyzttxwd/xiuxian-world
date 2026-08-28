import fs from 'fs';
import {spawnSync} from 'child_process';

const v44Path=new URL('./fullrun-v310-no-recharge-v44.mjs',import.meta.url);
const v44StagePath=new URL('./.generated-fullrun-v310-no-recharge-v45-v44stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v45 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v45 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v45 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v45 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v45 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V44 validated the secret-realm rotation guard and the corrected higher-realm route/pill mapping.
// Its sword/flame/spirit artifacts then isolated the remaining escape-policy defect: the runner still
// spends a whole combat round on a movement-only preparation before fleeing a major-realm overmatch.
// Failed/ordinary movement prep permits the enemy's normal counterattack; the space-shift/evade benefit
// helps only probabilistically, while existing shield/guard/domain/control effects mitigate that same
// preparation-round counterattack immediately. V45 therefore changes autonomous combat choice only:
// lethal overmatches rank immediate same-round mitigation first and exclude pure movement prep; optional
// same/lower-realm stalemate exits may still use movement after mitigation because the enemy is not under
// major-realm suppression. Flee chance, enemy damage, skill effects/costs/cooldowns, pills, RNG and death
// rules are unchanged.
let v44=fs.readFileSync(v44Path,'utf8');
v44=replaceOnce(
 v44,
 "await import(finalRunnerPath.href+'?v44final='+Date.now());",
 "// v45 executes the final runner after effect-aware escape preparation ranking.",
 'suppress v44 final gameplay auto-import'
);
fs.writeFileSync(v44StagePath,v44);
const staged=spawnSync(process.execPath,['--check',v44StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v45 staged V44 syntax check failed: '+(staged.stderr||staged.stdout||'unknown syntax error'));
await import(v44StagePath.href+'?v45stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v45 did not obtain V44 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const effectAwareEscapePriority=`function escapeSkillPriority(){
 const p=state().player,c=combat(),active=new Set((p.activeSkillIds||[]).filter(Boolean));
 const enemyRealm=Math.max(0,Number(c?.enemy?.realm)||0),hpRatio=c?c.playerHp/Math.max(1,invoke('maxHp')):1;
 const lethal=(runnerMajorStage(enemyRealm)>runnerMajorStage(p.realmIndex))||(enemyRealm-p.realmIndex>=2);
 const ranked=[];
 for(const id of active){
  const r=registry.spells?.[id]||{},e=r.effect||{};
  let score=0,kind=null;
  // These effects are applied by useV31CombatSkill before the enemy counterattack of the same round.
  if(Number(e.healPct)>0){score+=1200+Number(e.healPct)*500;kind='heal'}
  if(Number(e.shieldPct)>0){score+=1100+Number(e.shieldPct)*500;kind=kind||'shield'}
  if(Number(e.voidPhase)>0){score+=1000+Number(e.voidPhase)*80;kind=kind||'void-phase'}
  if(Number(e.guard)>0){score+=850+Number(e.guard)*60;kind=kind||'guard'}
  if(Number(e.bodyGuard)>0){score+=820+Number(e.bodyGuard)*60;kind=kind||'body-guard'}
  if(Number(e.control)>0){score+=780+Number(e.control)*60;kind=kind||'control'}
  if(Number(e.domain)>0){score+=740+Number(e.domain)*50;kind=kind||'domain'}
  if(Number(e.soulSeal)>0){score+=700+Number(e.soulSeal)*45;kind=kind||'soul-seal'}
  if(Number(e.weaken)>0){score+=620+Number(e.weaken)*35;kind=kind||'weaken'}
  // Pure movement/evade remains valid only for optional same/lower-realm stalemate exits.
  if(!lethal&&score===0&&(Number(e.evade)>0||Number(e.spaceShift)>0)){score=200+Number(e.evade||0)*10+Number(e.spaceShift||0)*10;kind='movement'}
  if(score>0)ranked.push({id,score,kind});
 }
 ranked.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 console.log('V310_FULLRUN_V45_ESCAPE_OPTIONS',JSON.stringify({enemy:c?.enemy?.name||null,enemyRealm,playerRealm:p.realmIndex,hpRatio:Number(hpRatio.toFixed(3)),lethal,ranked:ranked.slice(0,6),actions}));
 return ranked.map(x=>x.id);
}`;
runner=replaceFunction(runner,'function escapeSkillPriority(',effectAwareEscapePriority,'effect-aware immediate mitigation escape priority');

// Preserve V44's critical-HP direct-flee threshold. With the new priority, a healthy lethal-overmatch
// prep can only be an immediately mitigating skill; if none is enabled the existing guard-artifact
// fallback is tried, otherwise the runner proceeds straight to the unchanged normal flee action.

if(!runner.includes('V310_FULLRUN_V45_ESCAPE_OPTIONS'))throw new Error('V3.10 v45 escape-option evidence missing');
if(!runner.includes("if(!lethal&&score===0&&(Number(e.evade)>0||Number(e.spaceShift)>0))"))throw new Error('V3.10 v45 lethal pure-movement exclusion missing');
if(!runner.includes('Number(e.shieldPct)>0')||!runner.includes('Number(e.voidPhase)>0')||!runner.includes('Number(e.guard)>0'))throw new Error('V3.10 v45 immediate mitigation ranking incomplete');
if(!runner.includes("const prepWanted=hpRatio>=.45&&(fleeAttempts===0||fleeAttempts%2===0)&&escapePreparedAt!==fleeAttempts;"))throw new Error('V3.10 v45 lost V44 critical-HP direct flee gate');
if(!runner.includes('V310_FULLRUN_V44_SECRET_ROTATED'))throw new Error('V3.10 v45 lost V44 secret rotation revalidation');
if(!runner.includes('rr.id!==sr.id||rr.location!==state().player.location'))throw new Error('V3.10 v45 lost V44 secret id/location guard');
if(!runner.includes('else if(i===29){ensureLightbodyStock(16);'))throw new Error('V3.10 v45 lost V44 realm29 stock correction');
if(!runner.includes('return {needed:ceil>pr,ceil,pr,risk,majorGap,rawGap};'))throw new Error('V3.10 v45 lost higher-realm-only pill policy');
if(!runner.includes('stalledIncidental=!preferWin&&guard>=60&&enemyRealm<=s.player.realmIndex'))throw new Error('V3.10 v45 lost optional stalemate exit');
if(!runner.includes("if(state().player.progress>=r.need){console.log('V310_FULLRUN_V43_CULTIVATION_CAP'"))throw new Error('V3.10 v45 lost cultivation-cap short-circuit');
if(!runner.includes('V310_FULLRUN_V41_RISK_PROBE'))throw new Error('V3.10 v45 lost corrected registry risk probe');
if(!runner.includes("invoke('useV33Pill','recipe-v33-lightbody','common')"))throw new Error('V3.10 v45 lost normal Lightbody API');
if(!runner.includes('escapePreparedAt=-1'))throw new Error('V3.10 v45 lost one-prep-per-flee accounting');
if(!runner.includes('V310_FULLRUN_V39_FLEE'))throw new Error('V3.10 v45 lost flee diagnostics');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-beast-material'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v45 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v45 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V45_FINAL_RUNNER_PASS '+JSON.stringify({lethalOvermatchImmediateMitigationOnly:true,pureMovementExcludedForLethalOvermatch:true,optionalStalemateMovementFallback:true,shieldHealVoidGuardControlRanked:true,criticalHpDirectFleePreserved:true,secretRotationRevalidationPreserved:true,higherRealmOnlyPillsPreserved:true,realm29Stock:16,totalActionBudgetFromWorkflow:300000,farmDeadlockBudgetUnchanged:true,enemyStatsUnchanged:true,fleeChanceUnchanged:true,skillEffectsCostsCooldownsUnchanged:true,pillEffectsUnchanged:true,marketUnchanged:true,secretRewardsUnchanged:true,progressionCostsUnchanged:true,rngUnchanged:true,deathRiskUnchanged:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v45final='+Date.now());
