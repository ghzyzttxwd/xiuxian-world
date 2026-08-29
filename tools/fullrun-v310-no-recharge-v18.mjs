import fs from 'fs';
import {spawnSync} from 'child_process';

const v17Path=new URL('./fullrun-v310-no-recharge-v17.mjs',import.meta.url);
const v17StagePath=new URL('./.generated-fullrun-v310-no-recharge-v18-v17stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v18 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v18 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V14's refinement-9 / warmth-100 four-artifact build was a temporary diagnostic used to prove
// the realm34 祖脉天蛇 route remained untenable even under maximal legal preparation. V15/V16 then
// added scarce normal auction recovery for 天脉髓 / 世界真露, so that extreme preparation is no longer
// part of the balance question. V18 retires only that diagnostic burden: keep a normal same-stage
// sword loadout at refinement 3, keep all normal forging/binding/equip/refinement costs, and preserve
// every v17 economy/material route including the 160-cycle 炼虚真髓 patience fix.
let v17=fs.readFileSync(v17Path,'utf8');
v17=replaceOnce(
 v17,
 "await import(finalRunnerPath.href+'?v17final='+Date.now());",
 "// v18 executes the final runner after retiring the obsolete max-artifact diagnostic burden.",
 'suppress v17 final auto-import'
);
fs.writeFileSync(v17StagePath,v17);
await import(v17StagePath.href+'?v18stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v18 did not obtain v17 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const maxGear=`function ensureRealm33SwordCombatGear(){
 if(DAO_PATH!=='sword'||state().player.realmIndex<33)return;
 ensureArtifactLoadoutItem('item-v37-lawcleaver-sword','assault',9);
 ensureArtifactLoadoutItem('item-v32-swordguard-wheel','guard',9);
 ensureArtifactLoadoutItem('item-v37-sword-domain-banner','support',9);
 ensureArtifactMaxPreparation('item-v37-lawcleaver-sword',9,100);
 ensureArtifactMaxPreparation('item-v32-swordguard-wheel',9,100);
 ensureArtifactMaxPreparation('item-v37-sword-domain-banner',9,100);
 ensureArtifactMaxPreparation('item-v32-sevenstar-swordcase',9,100);
}`;
const normalGear=`function ensureRealm33SwordCombatGear(){
 if(DAO_PATH!=='sword'||state().player.realmIndex<33)return;
 ensureArtifactLoadoutItem('item-v37-lawcleaver-sword','assault',3);
 ensureArtifactLoadoutItem('item-v32-swordguard-wheel','guard',3);
 ensureArtifactLoadoutItem('item-v37-sword-domain-banner','support',3);
 console.log('V310_FULLRUN_REALM33_NORMAL_GEAR',JSON.stringify({assault:'item-v37-lawcleaver-sword',guard:'item-v32-swordguard-wheel',support:'item-v37-sword-domain-banner',targetRefinement:3,natal:state().player.artifactLoadout?.natal,actions}));
}`;
runner=replaceOnce(runner,maxGear,normalGear,'retire max-preparation calls while keeping normal realm33 sword gear');

if(!runner.includes("ensureArtifactLoadoutItem('item-v37-lawcleaver-sword','assault',3)"))throw new Error('V3.10 v18 normal assault gear missing');
if(!runner.includes("ensureArtifactLoadoutItem('item-v32-swordguard-wheel','guard',3)"))throw new Error('V3.10 v18 normal guard gear missing');
if(!runner.includes("ensureArtifactLoadoutItem('item-v37-sword-domain-banner','support',3)"))throw new Error('V3.10 v18 normal support gear missing');
if(runner.includes("ensureArtifactMaxPreparation('item-v37-lawcleaver-sword',9,100);"))throw new Error('V3.10 v18 obsolete max assault preparation survived');
if(runner.includes("ensureArtifactMaxPreparation('item-v32-swordguard-wheel',9,100);"))throw new Error('V3.10 v18 obsolete max guard preparation survived');
if(runner.includes("ensureArtifactMaxPreparation('item-v37-sword-domain-banner',9,100);"))throw new Error('V3.10 v18 obsolete max support preparation survived');
if(runner.includes("ensureArtifactMaxPreparation('item-v32-sevenstar-swordcase',9,100);"))throw new Error('V3.10 v18 obsolete max natal preparation survived');
if(!runner.includes("tryAuctionMaterial('mat-v36-void-essence',n,160)"))throw new Error('V3.10 v18 lost v17 void-essence patience fix');
if(!runner.includes("['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-world-essence-dew','mat-v38-heaven-vein-marrow'].includes(id)&&tryAuctionMaterial(id,n,160)"))throw new Error('V3.10 v18 lost V3.8 normal recovery auction routing');
if(!runner.includes("source:'auction'"))throw new Error('V3.10 v18 auction evidence logging missing');
if(!runner.includes("x.materialId===id&&x.mode==='named-source'"))throw new Error('V3.10 v18 dangerous fallback routing lost');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v36-void-essence'")||runner.includes("v33AddMaterial('mat-v38-world-essence-dew'")||runner.includes("v33AddMaterial('mat-v38-heaven-vein-marrow'"))throw new Error('forbidden progression shortcut leaked into V3.10 v18 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v18 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V18_FINAL_RUNNER_PASS '+JSON.stringify({realm33SwordGearRefinement:3,supportIncluded:true,maxArtifactDiagnosticRetired:true,voidEssenceAuctionMaxCycles:160,worldEssenceDewAuctionPreferred:true,heavenVeinMarrowAuctionPreferred:true,normalGameplayCostsPreserved:true,noDirectResourceInjection:true,noGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v18final='+Date.now());
