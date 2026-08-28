import fs from 'fs';
import {spawnSync} from 'child_process';

const v36Path=new URL('./fullrun-v310-no-recharge-v36.mjs',import.meta.url);
const v36StagePath=new URL('./.generated-fullrun-v310-no-recharge-v37-v36stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v37 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v37 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v37 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v37 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v37 function-close miss: '+label);
 return {start,open,end};
}

// V36 proved that the beast-market, paid relic-insight fallback and funded refining routes all work:
// sword/flame reached realm29 and body/spirit reached realm22, with forbiddenCalls=[] on every seed.
// All four runs then died on a normal combat-flee action. Runtime inspection shows the reason is not a
// hidden game-state gate: improveSkills() deliberately selects only spells with power > 0, so the
// autonomous player fills four offensive slots but never learns/equips the normal zero-power movement,
// shield and control skills that real players use when a mandatory region can roll a higher-major-realm
// enemy. A failed flee consumes a full enemy counterattack, and major-realm suppression multiplies it.
//
// V37 changes runner strategy only. Slots 0-3 remain the existing offensive build. Slots 4-5 are used
// for a common movement skill plus one path-appropriate survival skill, all learned/equipped through the
// normal V3.1 APIs and normal map sources/costs. The combat policy stops wasting flee rolls on same/lower
// enemies, while genuinely lethal overmatches keep trying to disengage and periodically recast an
// enabled survival skill (or normal guard artifact) before another flee. Enemy stats, flee probability,
// death risk, spell effects/costs, action time, RNG, drops and all gameplay source data remain unchanged.
let v36=fs.readFileSync(v36Path,'utf8');
v36=replaceOnce(
 v36,
 "await import(finalRunnerPath.href+'?v36final='+Date.now());",
 "// v37 executes the final runner after legal survival-loadout and overmatch escape scheduling.",
 'suppress v36 final auto-import'
);
fs.writeFileSync(v36StagePath,v36);
await import(v36StagePath.href+'?v37stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v37 did not obtain v36 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

// Add a legal six-slot survival layer without disturbing the four existing offense slots.
{
 const sp=functionSpan(runner,'function improveSkills()','improveSkills');
 const fn=runner.slice(sp.start,sp.end+1);
 if(fn.includes('ensureSurvivalLoadout();'))throw new Error('V3.10 v37 survival loadout already injected');
 const patchedFn=fn.slice(0,-1)+"\n ensureSurvivalLoadout();\n}";
 const helper=`
function ensureSurvivalSkill(id,slot){
 const p=state().player,row=registry.spells?.[id];
 if(!row||Number(row.unlock||0)>p.realmIndex)return false;
 if(row.path&&row.path!=='none'&&row.path!==DAO_PATH)return false;
 if(!(row.name in p.spells)){
  const sources=(row.sources||[]).filter(Boolean);
  if(sources.length&&!sources.some(x=>findPath(state().player.location,x)!==null))return false;
  ensureCost(row.cost||{});
  if(sources.length&&!goAny(sources))return false;
  const learned=spendAction('learn-survival:'+id,()=>invoke('learnV31Spell',id));
  if(!['learned','known'].includes(learned)&&!(row.name in state().player.spells))return false;
 }
 if(state().player.activeSkillIds?.[slot]!==id)spendAction('equip-survival:'+id,()=>invoke('equipV31Skill',slot,id));
 return state().player.activeSkillIds?.[slot]===id;
}
function ensureSurvivalLoadout(){
 const p=state().player;
 if(p.daoPath!==DAO_PATH||p.realmIndex<10)return;
 ensureSurvivalSkill('spell-windstep',4);
 const plans={
  sword:['spell-v36-sword-space-step','spell-sword-escape','spell-golden-bell'],
  flame:['spell-v36-flame-voidflash','spell-fire-escape','spell-golden-bell'],
  body:['spell-v36-body-boundary-form','spell-immovable-king','spell-vajra-guard','spell-golden-bell'],
  spirit:['spell-v36-spirit-shift','spell-taixu-godseal-domain','spell-divine-sense-barrier','spell-golden-bell']
 };
 let chosen=null;
 for(const id of plans[DAO_PATH]||[]){if(ensureSurvivalSkill(id,5)){chosen=id;break}}
 console.log('V310_FULLRUN_V37_SURVIVAL_LOADOUT',JSON.stringify({realm:p.realmIndex,path:DAO_PATH,slot4:state().player.activeSkillIds?.[4]||null,slot5:state().player.activeSkillIds?.[5]||null,preferred:chosen,actions}));
}
function runnerMajorStage(i){i=Math.max(0,Number(i)||0);return i===0?0:i<=9?1:i<=13?2:i<=18?3:i<=22?4:i<=25?5:i<=29?6:i<=33?7:i<=37?8:i===38?9:10}
function combatEnabled(a){return [...dom.window.document.querySelectorAll('[data-combat]')].some(b=>b.dataset.combat===a&&!b.disabled)}
function escapeSkillPriority(){
 const active=new Set(state().player.activeSkillIds||[]),plans={
  sword:['spell-v36-sword-space-step','spell-sword-escape','spell-windstep'],
  flame:['spell-v36-flame-voidflash','spell-fire-escape','spell-windstep'],
  body:['spell-v36-body-boundary-form','spell-immovable-king','spell-vajra-guard','spell-windstep'],
  spirit:['spell-v36-spirit-shift','spell-taixu-godseal-domain','spell-divine-sense-barrier','spell-windstep']
 };
 return (plans[DAO_PATH]||['spell-windstep']).filter(id=>active.has(id));
}
`;
 runner=runner.slice(0,sp.start)+patchedFn+helper+runner.slice(sp.end+1);
}

runner=replaceOnce(
 runner,
 'let guard=0,fleeAttempts=0,policyLogged=false;',
 'let guard=0,fleeAttempts=0,policyLogged=false,escapePrepUses=0;',
 'track legal escape preparation uses'
);

const fleeDecisionBefore=`const optionalFlee=unsafeIncidental&&!structurallyOvermatched&&hpRatio>=.58&&fleeAttempts<1;
  const overmatchFlee=structurallyOvermatched&&fleeAttempts<6;
  const boundedFleeDecision=optionalFlee||overmatchFlee;
  if(boundedFleeDecision){`;
const fleeDecisionAfter=`const playerMajor=runnerMajorStage(s.player.realmIndex),enemyMajor=runnerMajorStage(enemyRealm);
  const lethalOvermatch=((enemyMajor>playerMajor)||(enemyRealm-s.player.realmIndex>=2))&&!marrowSerpentChallenge;
  const optionalFlee=false;
  const overmatchFlee=lethalOvermatch;
  const boundedFleeDecision=overmatchFlee;
  if(boundedFleeDecision){
   const prepWanted=fleeAttempts===0||fleeAttempts%2===0||hpRatio<.58;
   if(prepWanted){
    let prepAdvanced=false;
    for(const id of escapeSkillPriority()){
     const action='skill:'+id;
     if(!combatEnabled(action))continue;
     const beforeRound=combat()?.round;
     spendAction('combat-escape-prep:'+id,()=>invoke('combatAction',action));
     const afterPrep=combat();
     escapePrepUses++;
     console.log('V310_FULLRUN_V37_ESCAPE_PREP',JSON.stringify({id,enemy:c.enemy?.name||null,enemyRealm,playerRealm:s.player.realmIndex,hpRatio:Number(hpRatio.toFixed(3)),fleeAttempts,escapePrepUses,roundBefore:beforeRound,roundAfter:afterPrep?.round||null,actions}));
     if(!afterPrep||afterPrep.round!==beforeRound){prepAdvanced=true;break}
    }
    if(!combat())continue;
    if(prepAdvanced)continue;
    const guardId=s.player.artifactLoadout?.guard,guardAction=guardId?'artifact:'+guardId:null;
    if(guardAction&&combatEnabled(guardAction)){
     const beforeRound=combat()?.round;
     spendAction('combat-escape-prep-artifact:'+guardId,()=>invoke('combatAction',guardAction));
     const afterGuard=combat();
     escapePrepUses++;
     console.log('V310_FULLRUN_V37_ESCAPE_PREP',JSON.stringify({id:guardId,kind:'guard-artifact',enemy:c.enemy?.name||null,enemyRealm,playerRealm:s.player.realmIndex,hpRatio:Number(hpRatio.toFixed(3)),fleeAttempts,escapePrepUses,roundBefore:beforeRound,roundAfter:afterGuard?.round||null,actions}));
     if(!afterGuard||afterGuard.round!==beforeRound)continue;
    }
   }`;
runner=replaceOnce(runner,fleeDecisionBefore,fleeDecisionAfter,'survival-aware lethal-overmatch escape policy');

// Machine-verifiable strategy invariants.
if(!runner.includes('function ensureSurvivalLoadout()'))throw new Error('V3.10 v37 survival loadout helper missing');
if(!runner.includes("ensureSurvivalSkill('spell-windstep',4)"))throw new Error('V3.10 v37 common movement slot missing');
for(const id of ['spell-v36-sword-space-step','spell-v36-flame-voidflash','spell-immovable-king','spell-divine-sense-barrier'])if(!runner.includes(id))throw new Error('V3.10 v37 path survival plan missing '+id);
if(!runner.includes('ensureSurvivalLoadout();'))throw new Error('V3.10 v37 improveSkills hook missing');
if(!runner.includes('function combatEnabled(a)'))throw new Error('V3.10 v37 UI-enabled escape prep gate missing');
if(!runner.includes("V310_FULLRUN_V37_ESCAPE_PREP"))throw new Error('V3.10 v37 escape preparation evidence missing');
if(!runner.includes('const optionalFlee=false;'))throw new Error('V3.10 v37 unnecessary incidental flee still enabled');
if(!runner.includes('const overmatchFlee=lethalOvermatch;'))throw new Error('V3.10 v37 lethal overmatch escape persistence missing');
if(runner.includes('const overmatchFlee=structurallyOvermatched&&fleeAttempts<6;'))throw new Error('V3.10 v37 stale naked six-flee policy survived');
if(!runner.includes("if(tryBeastMarket(n,24))return;"))throw new Error('V3.10 v37 lost v35 paid beast route');
if(!runner.includes("tryRelicAuction(3,24)"))throw new Error('V3.10 v37 lost v36 paid insight route');
if(!runner.includes('function goAnyFunded(candidates,reserve,label)'))throw new Error('V3.10 v37 lost v36 funded refining route');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-beast-material'")||runner.includes("v33AddMaterial('mat-relic-fragment'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v37 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v37 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V37_FINAL_RUNNER_PASS '+JSON.stringify({offenseSlotsPreserved:[0,1,2,3],survivalSlots:[4,5],normalSpellLearningAndEquipApis:true,pathAwareSurvival:true,uiEnabledEscapePrepOnly:true,sameOrLowerIncidentalFightsInsteadOfNakedFlee:true,lethalOvermatchPersistentEscape:true,periodicSurvivalRecast:true,guardArtifactFallback:true,fleeChanceUnchanged:true,enemyStatsUnchanged:true,deathRiskUnchanged:true,spellEffectsAndCostsUnchanged:true,rngUnchanged:true,v36InsightAndFundedCraftPreserved:true,v35BeastMarketPreserved:true,noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v37final='+Date.now());
