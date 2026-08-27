import fs from 'fs';
import {spawnSync} from 'child_process';

const v25Path=new URL('./fullrun-v310-no-recharge-v25.mjs',import.meta.url);
const v25StagePath=new URL('./.generated-fullrun-v310-no-recharge-v26-v25stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v26 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v26 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V25 proved the mandatory realm-29 法则古原 route is survivable with a legal sword build and
// successfully acquired 万象法尘. It then failed v37ChooseLaw with reason=cost because the runner
// prepared its insight reserve BEFORE forging/binding/warming the survival gear and farming the dust.
// Those normal actions consumed part of the reserve; at the actual choose-law call only 6 insight
// remained while the real game cost is 10. This is a runner sequencing bug, not a balance defect.
//
// V26 keeps all game costs and content unchanged. It revalidates the volatile law-choice resources
// immediately before the choice: after gear and named-material preparation, restore insight to the
// actual required 10 through the same normal insight routes, return to a legal law-choice location,
// assert the simultaneous cost surface, then invoke the unchanged v37ChooseLaw API.
let v25=fs.readFileSync(v25Path,'utf8');
v25=replaceOnce(
 v25,
 "await import(finalRunnerPath.href+'?v25final='+Date.now());",
 "// v26 executes the final runner after just-in-time law-choice cost revalidation.",
 'suppress v25 final auto-import'
);
fs.writeFileSync(v25StagePath,v25);
await import(v25StagePath.href+'?v26stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v26 did not obtain v25 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const before="ensureRealm29SwordLawPrep();ensureNamed('mat-v37-rule-dust',1);if(!goAny(['法则古原','万象法坛']))fail('law-choice-location-unreachable',{});const r=spendAction('choose-law',()=>invoke('v37ChooseLaw',lawByPath[DAO_PATH]));";
const after="ensureRealm29SwordLawPrep();ensureNamed('mat-v37-rule-dust',1);ensureInsight(10);if(!goAny(['法则古原','万象法坛']))fail('law-choice-location-unreachable',{});if(state().player.insight<10||materialCount('mat-v37-law-crystal')<2||materialCount('mat-v37-rule-dust')<1)fail('law-choice-cost-desynced',{insight:state().player.insight,lawCrystal:materialCount('mat-v37-law-crystal'),ruleDust:materialCount('mat-v37-rule-dust'),location:state().player.location});console.log('V310_FULLRUN_V26_LAW_COST_READY',JSON.stringify({insight:state().player.insight,lawCrystal:materialCount('mat-v37-law-crystal'),ruleDust:materialCount('mat-v37-rule-dust'),location:state().player.location,actions}));const r=spendAction('choose-law',()=>invoke('v37ChooseLaw',lawByPath[DAO_PATH]));";
runner=replaceOnce(runner,before,after,'revalidate law-choice cost immediately before invoke');

if(!runner.includes("ensureNamed('mat-v37-rule-dust',1);ensureInsight(10);if(!goAny(['法则古原','万象法坛'])"))throw new Error('V3.10 v26 JIT insight revalidation missing');
if(!runner.includes("materialCount('mat-v37-law-crystal')<2"))throw new Error('V3.10 v26 law-crystal simultaneous-cost assertion missing');
if(!runner.includes("materialCount('mat-v37-rule-dust')<1"))throw new Error('V3.10 v26 rule-dust simultaneous-cost assertion missing');
if(!runner.includes('V310_FULLRUN_V26_LAW_COST_READY'))throw new Error('V3.10 v26 law-cost diagnostic missing');
if(!runner.includes("invoke('v37ChooseLaw',lawByPath[DAO_PATH])"))throw new Error('V3.10 v26 normal choose-law API lost');
if(!runner.includes("function ensureRealm29SwordLawPrep()"))throw new Error('V3.10 v26 lost v25 legal law-route survival prep');
if(!runner.includes('V310_FULLRUN_V25_LAW_COMBAT'))throw new Error('V3.10 v26 lost v25 bounded law combat diagnostics');
if(!runner.includes('combat-escape-guard'))throw new Error('V3.10 v26 lost v25 normal guard-before-flee policy');
if(!runner.includes("regionalIncidentalCeiling<=state().player.realmIndex-3"))throw new Error('V3.10 v26 lost v23 secret-realm risk gate');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v37-rule-dust'")||runner.includes("v33AddMaterial('mat-v37-law-crystal'"))throw new Error('forbidden law shortcut leaked into V3.10 v26 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v26 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V26_FINAL_RUNNER_PASS '+JSON.stringify({lawChoiceJustInTimeInsight:true,requiredInsight:10,lawCrystalAssertion:2,ruleDustAssertion:1,normalInsightRoutesOnly:true,normalChooseLawApi:true,v25LawRouteSurvivalPreserved:true,lawCostsUnchanged:true,enemyTablesUnchanged:true,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v26final='+Date.now());
