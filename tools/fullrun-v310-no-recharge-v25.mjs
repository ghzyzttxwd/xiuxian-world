import fs from 'fs';
import {spawnSync} from 'child_process';

const v24Path=new URL('./fullrun-v310-no-recharge-v24.mjs',import.meta.url);
const v24StagePath=new URL('./.generated-fullrun-v310-no-recharge-v25-v24stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v25 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v25 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V24 crossed every previous blocker and reached 炼虚圆满 (realm 29), then died while
// ensureLawChosen was obtaining the mandatory 万象法尘 in 法则古原. This is the first point where
// the distinction between a runner mistake and a real progression-balance defect matters:
// - v37ChooseLaw genuinely requires 10 insight + 2 法纹晶 + 1 万象法尘 at realm 29.
// - 万象法尘 has no ordinary pre-law alternate map route: 万象法坛 itself is behind law-prof routes.
// - 法则古原 is explicitly the first law-establishment region, but its incidental table includes
//   realm 29 / 30 / 32 enemies.
//
// V25 therefore does NOT change game data, enemies, drops, flee chance or law costs. It first gives
// the autonomous sword player a reasonable legal pre-law survival build using only existing forge,
// bind, equip, refine, warm and skill APIs, and adds narrow diagnostics around realm-29 law farming.
// If this still cannot survive the mandatory route, the next change can be justified as a real game
// progression fix rather than a harness convenience.
let v24=fs.readFileSync(v24Path,'utf8');
v24=replaceOnce(
 v24,
 "await import(finalRunnerPath.href+'?v24final='+Date.now());",
 "// v25 executes the final runner after legal realm29 law-route preparation and diagnostics.",
 'suppress v24 final auto-import'
);
fs.writeFileSync(v24StagePath,v24);
await import(v24StagePath.href+'?v25stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v25 did not obtain v24 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const lawAnchor="function ensureLawChosen(){";
const lawPrep=`let realm29LawCombatDiagnostics=0;
function ensureRealm29SwordLawPrep(){
 if(DAO_PATH!=='sword'||state().player.realmIndex!==29||state().player.v37LawId)return;
 ensureSwordEscapeSkill();
 ensureArtifactLoadoutItem('item-v36-void-swordcase','assault',3);
 ensureArtifactLoadoutItem('item-v32-swordguard-wheel','guard',3);
 ensureArtifactLoadoutItem('item-v36-star-shuttle','support',3);
 const natal='item-v32-sevenstar-swordcase';
 if(!state().player.equipmentInventory?.[natal]||state().player.artifactLoadout?.natal!==natal)fail('realm29-law-natal-missing',{natal,loadout:state().player.artifactLoadout});
 ensureArtifactMaxPreparation('item-v36-void-swordcase',3,60);
 ensureArtifactMaxPreparation('item-v32-swordguard-wheel',3,60);
 ensureArtifactMaxPreparation('item-v36-star-shuttle',3,60);
 ensureArtifactMaxPreparation(natal,Math.max(3,state().player.equipmentInventory?.[natal]?.refinement||0),60);
 const ids=['item-v36-void-swordcase','item-v32-swordguard-wheel','item-v36-star-shuttle',natal],inv=state().player.equipmentInventory||{};
 console.log('V310_FULLRUN_V25_REALM29_LAW_PREP',JSON.stringify({realm:state().player.realmIndex,location:state().player.location,activeSkills:state().player.activeSkillIds,loadout:state().player.artifactLoadout,artifacts:Object.fromEntries(ids.map(id=>[id,{refinement:inv[id]?.refinement||0,warmth:inv[id]?.warmth||0,bound:!!inv[id]?.bound,natal:!!inv[id]?.natal,damaged:!!inv[id]?.damaged}])),stones:state().player.spiritStones,insight:state().player.insight,actions}));
}
function ensureLawChosen(){`;
runner=replaceOnce(runner,lawAnchor,lawPrep,'add legal pre-law sword survival preparation');

const lawSequenceBefore="ensureSwordEscapeSkill();tryAuctionMaterial('mat-v37-law-crystal',2,24);ensureNamed('mat-v37-law-crystal',2);ensureNamed('mat-v37-rule-dust',1);";
const lawSequenceAfter="ensureSwordEscapeSkill();tryAuctionMaterial('mat-v37-law-crystal',2,24);ensureNamed('mat-v37-law-crystal',2);ensureRealm29SwordLawPrep();ensureNamed('mat-v37-rule-dust',1);";
runner=replaceOnce(runner,lawSequenceBefore,lawSequenceAfter,'prepare legal realm29 sword build before mandatory rule-dust farming');

const hpLine="const hpRatio=c.playerHp/Math.max(1,invoke('maxHp'));";
const hpDiagnostic="const hpRatio=c.playerHp/Math.max(1,invoke('maxHp'));if(s.player.realmIndex===29&&s.player.location==='法则古原'&&!s.player.v37LawId&&realm29LawCombatDiagnostics<24){realm29LawCombatDiagnostics++;const inv=s.player.equipmentInventory||{};console.log('V310_FULLRUN_V25_LAW_COMBAT',JSON.stringify({count:realm29LawCombatDiagnostics,enemyId:c.enemy?.id,enemy:c.enemy?.name,enemyRealm,playerRealm:s.player.realmIndex,hpRatio:Number(hpRatio.toFixed(3)),playerHp:c.playerHp,maxHp:invoke('maxHp'),playerQi:c.playerQi,loadout:s.player.artifactLoadout,artifacts:Object.fromEntries(Object.values(s.player.artifactLoadout||{}).filter(Boolean).map(id=>[id,{refinement:inv[id]?.refinement||0,warmth:inv[id]?.warmth||0,damaged:!!inv[id]?.damaged}])),activeSkills:s.player.activeSkillIds,round:c.round,actions}))}";
runner=replaceOnce(runner,hpLine,hpDiagnostic,'log bounded realm29 law-route combat diagnostics');

// On the mandatory pre-law route, a normal player who has already used 剑光挪移 should not spam
// naked flee rolls while a bound guard artifact is ready. Use the existing guard artifact once to
// establish its normal shield, then continue the unchanged shift/flee policy. This does not alter the
// game's flee probability or enemy behavior and is restricted to the realm29 pre-law sword case.
const fleeTail="spendAction('combat-flee',()=>invoke('combatAction','flee'));continue}";
const fleeTailAfter="if(DAO_PATH==='sword'&&s.player.realmIndex===29&&s.player.location==='法则古原'&&!s.player.v37LawId&&enemyRealm>s.player.realmIndex){const guardId=s.player.artifactLoadout?.guard,cc=combat(),guardCd=Number(cc?.artifactCooldowns?.[guardId]||0);if(guardId&&cc&&guardCd<=0&&(cc.v31Shield||0)<=0){const beforeRound=cc.round;spendAction('combat-escape-guard',()=>invoke('combatAction','artifact:'+guardId));const afterGuard=combat();if(afterGuard&&afterGuard.round!==beforeRound){console.log('V310_FULLRUN_V25_ESCAPE_GUARD',JSON.stringify({guardId,enemy:c.enemy?.name,enemyRealm,shield:afterGuard.v31Shield||0,hp:afterGuard.playerHp,actions}));continue}}}spendAction('combat-flee',()=>invoke('combatAction','flee'));continue}";
runner=replaceOnce(runner,fleeTail,fleeTailAfter,'use normal guard artifact before repeated pre-law cross-realm flee');

if(!runner.includes("function ensureRealm29SwordLawPrep()"))throw new Error('V3.10 v25 pre-law preparation helper missing');
if(!runner.includes("ensureArtifactLoadoutItem('item-v36-void-swordcase','assault',3)"))throw new Error('V3.10 v25 legal realm29 sword assault missing');
if(!runner.includes("ensureArtifactLoadoutItem('item-v36-star-shuttle','support',3)"))throw new Error('V3.10 v25 legal realm29 sword support missing');
if(!runner.includes("ensureArtifactLoadoutItem('item-v32-swordguard-wheel','guard',3)"))throw new Error('V3.10 v25 legal realm29 sword guard missing');
if(!runner.includes("ensureArtifactMaxPreparation('item-v36-void-swordcase',3,60)"))throw new Error('V3.10 v25 normal refinement/warmth preparation missing');
if(!runner.includes("V310_FULLRUN_V25_LAW_COMBAT"))throw new Error('V3.10 v25 law-route diagnostics missing');
if(!runner.includes("combat-escape-guard"))throw new Error('V3.10 v25 guard-before-flee policy missing');
if(!runner.includes("invoke('combatAction','artifact:'+guardId)"))throw new Error('V3.10 v25 guard policy bypasses normal combat API');
if(!runner.includes("combat-escape-shift"))throw new Error('V3.10 v25 lost normal sword shift-before-flee policy');
if(!runner.includes("regionalIncidentalCeiling<=state().player.realmIndex-3"))throw new Error('V3.10 v25 lost v23 secret-realm risk gate');
if(!runner.includes("speculative" )&&runner.includes("ensureRelic(Math.max(8,state().player.relicFragments))"))throw new Error('V3.10 v25 speculative realm15 relic stockpile returned');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v37-rule-dust'")||runner.includes("v33AddMaterial('mat-v37-law-crystal'"))throw new Error('forbidden law progression/resource shortcut leaked into V3.10 v25 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v25 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V25_FINAL_RUNNER_PASS '+JSON.stringify({realm29LawPrep:true,assault:'item-v36-void-swordcase',guard:'item-v32-swordguard-wheel',support:'item-v36-star-shuttle',targetRefinement:3,targetWarmth:60,normalForgeBindEquipRefineWarmOnly:true,guardBeforeRepeatedCrossRealmFlee:true,boundedLawCombatDiagnostics:true,lawCostsUnchanged:true,enemyTablesUnchanged:true,fleeChanceUnchanged:true,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v25final='+Date.now());
