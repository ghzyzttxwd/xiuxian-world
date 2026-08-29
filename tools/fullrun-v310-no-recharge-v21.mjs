import fs from 'fs';
import {spawnSync} from 'child_process';

const v20Path=new URL('./fullrun-v310-no-recharge-v20.mjs',import.meta.url);
const v20StagePath=new URL('./.generated-fullrun-v310-no-recharge-v21-v20stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v21 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v21 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V20 reached 大乘初期 legally with 420 relic fragments still in inventory, then exhausted the
// 180k harness action budget while ensureInsight() kept running Qingyun escort tasks. The game itself
// already exposes the normal "3 relic fragments -> 1 insight" UI at every secret-realm panel, and a
// secret realm is combat-safe whenever its threat is not above the player's realm. The inherited v3
// runner ignored stocked relic fragments and used a hard-coded early-map allowlist, so an active realm
// outside that list could make the autonomous player wait forever. V21 fixes only runner strategy:
// consume already-owned relic fragments first, then judge secret-realm safety by actual threat/realm.
// No game resource yield, cost, enemy, route, breakthrough requirement or runtime state is modified.
let v20=fs.readFileSync(v20Path,'utf8');
v20=replaceOnce(
 v20,
 "await import(finalRunnerPath.href+'?v20final='+Date.now());",
 "// v21 executes the final runner after fixing only autonomous insight-source selection.",
 'suppress v20 final auto-import'
);
fs.writeFileSync(v20StagePath,v20);
await import(v20StagePath.href+'?v21stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v21 did not obtain v20 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const insightBefore="function ensureInsight(n){if(state().player.insight>=n)return;let guard=0;while(state().player.insight<n){if(++guard>MAX_FARM_ACTIONS)fail('insight-farm-deadlock',{target:n,current:state().player.insight,location:state().player.location});if(DAO_PATH==='sword'&&state().player.sect==='青云宗'&&state().player.realmIndex>=3&&(state().player.sectMentorBond||0)<6){const bond=state().player.sectMentorBond||0;ensureSwordMentorBond(bond<3?3:6);if(state().player.insight>=n)continue}const sr=state().world.secretRealm,safe=['青云山','临江城','云梦泽','赤霞谷','落星矿脉','黑风岭'];if(!sr||sr.cleared||!safe.includes(sr.location)){if(DAO_PATH==='sword'&&state().player.sect==='青云宗')sectRoutine(invoke('sectRankIndex')>=1?'escort':'patrol');else act('rest',false);continue}if(!goTo(sr.location)){act('rest',false);continue}const before=state().player.insight;let rr=state().world.secretRealm;if(rr&&rr.stage===0){spendAction('secret-enter',()=>{const b=dom.window.document.querySelector('[data-secret]');if(!b)fail('secret-entry-ui-missing',{realm:rr});b.click()});spendAction('secret-prepare-careful',()=>{const b=dom.window.document.querySelector('[data-choice]');if(!b)fail('secret-prepare-choice-missing',{realm:state().world.secretRealm});b.click()})}rr=state().world.secretRealm;if(rr&&rr.stage===1){spendAction('secret-guardian',()=>{const b=dom.window.document.querySelector('[data-secret]');if(!b)fail('secret-guardian-ui-missing',{realm:rr});b.click()});resolveCombat(true)}rr=state().world.secretRealm;if(rr&&rr.stage===2){spendAction('secret-core-open',()=>{const b=dom.window.document.querySelector('[data-secret]');if(!b)fail('secret-core-ui-missing',{realm:rr});b.click()});spendAction('secret-core-claim',()=>{const b=dom.window.document.querySelector('[data-choice]');if(!b)fail('secret-core-choice-missing',{realm:state().world.secretRealm});b.click()})}if(state().player.insight>before)console.log('V310_FULLRUN_INSIGHT',JSON.stringify({source:'secret-realm',insight:state().player.insight,target:n,location:state().player.location,actions}))}}";
const insightAfter="function ensureInsight(n){if(state().player.insight>=n)return;let guard=0;while(state().player.insight<n){if(++guard>MAX_FARM_ACTIONS)fail('insight-farm-deadlock',{target:n,current:state().player.insight,location:state().player.location,relicFragments:state().player.relicFragments,secretRealm:state().world.secretRealm||null});if((state().player.relicFragments||0)>=3){const before=state().player.insight;spendAction('decipher-stocked-relic-ui',()=>{const b=dom.window.document.querySelector('[data-relic]');if(!b)fail('relic-decipher-ui-missing',{target:n,relicFragments:state().player.relicFragments,secretRealm:state().world.secretRealm||null});b.click()});if(state().player.insight<=before)fail('relic-decipher-no-insight',{target:n,before,after:state().player.insight,relicFragments:state().player.relicFragments});console.log('V310_FULLRUN_INSIGHT',JSON.stringify({source:'stocked-relic',insight:state().player.insight,target:n,relicFragments:state().player.relicFragments,actions}));continue}if(DAO_PATH==='sword'&&state().player.sect==='青云宗'&&state().player.realmIndex>=3&&(state().player.sectMentorBond||0)<6){const bond=state().player.sectMentorBond||0;ensureSwordMentorBond(bond<3?3:6);if(state().player.insight>=n)continue}const sr=state().world.secretRealm,safe=!!sr&&!sr.cleared&&(Number(sr.threat)||0)<=state().player.realmIndex;if(!safe){if(DAO_PATH==='sword'&&state().player.sect==='青云宗')sectRoutine(invoke('sectRankIndex')>=1?'escort':'patrol');else act('rest',false);continue}if(!goTo(sr.location)){act('rest',false);continue}const before=state().player.insight;let rr=state().world.secretRealm;if(rr&&rr.stage===0){spendAction('secret-enter',()=>{const b=dom.window.document.querySelector('[data-secret]');if(!b)fail('secret-entry-ui-missing',{realm:rr});b.click()});spendAction('secret-prepare-careful',()=>{const b=dom.window.document.querySelector('[data-choice]');if(!b)fail('secret-prepare-choice-missing',{realm:state().world.secretRealm});b.click()})}rr=state().world.secretRealm;if(rr&&rr.stage===1){spendAction('secret-guardian',()=>{const b=dom.window.document.querySelector('[data-secret]');if(!b)fail('secret-guardian-ui-missing',{realm:rr});b.click()});resolveCombat(true)}rr=state().world.secretRealm;if(rr&&rr.stage===2){spendAction('secret-core-open',()=>{const b=dom.window.document.querySelector('[data-secret]');if(!b)fail('secret-core-ui-missing',{realm:rr});b.click()});spendAction('secret-core-claim',()=>{const b=dom.window.document.querySelector('[data-choice]');if(!b)fail('secret-core-choice-missing',{realm:state().world.secretRealm});b.click()})}if(state().player.insight>before)console.log('V310_FULLRUN_INSIGHT',JSON.stringify({source:'secret-realm',insight:state().player.insight,target:n,location:state().player.location,threat:sr?.threat||0,actions}))}}";
runner=replaceOnce(runner,insightBefore,insightAfter,'use stocked relics and dynamic secret-realm threat for insight');

if(!runner.includes("source:'stocked-relic'"))throw new Error('V3.10 v21 stocked-relic insight route missing');
if(!runner.includes("safe=!!sr&&!sr.cleared&&(Number(sr.threat)||0)<=state().player.realmIndex"))throw new Error('V3.10 v21 dynamic secret-realm safety check missing');
if(runner.includes("safe=['青云山','临江城','云梦泽','赤霞谷','落星矿脉','黑风岭']"))throw new Error('V3.10 v21 obsolete hard-coded secret-realm allowlist survived');
if(!runner.includes("invoke('bindV32Artifact',itemId)"))throw new Error('V3.10 v21 lost v20 normal artifact binding API');
if(!runner.includes("ensureOrigin(300);ensureAuthority(170);ensureNatalMarks(9);"))throw new Error('V3.10 v21 lost v19 tribulation readiness');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v38-heaven-vein-marrow'")||runner.includes("v33AddMaterial('mat-relic-fragment'"))throw new Error('forbidden progression/resource shortcut leaked into V3.10 v21 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v21 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V21_FINAL_RUNNER_PASS '+JSON.stringify({stockedRelicInsightFirst:true,dynamicSecretRealmThreatSafety:true,normalRelicCost:3,normalInsightGain:1,gameplayMutation:false,directResourceInjection:false,v20ArtifactBindFixPreserved:true,v19TribulationFixesPreserved:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v21final='+Date.now());
