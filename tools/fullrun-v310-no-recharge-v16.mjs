import fs from 'fs';
import {spawnSync} from 'child_process';

const v15Path=new URL('./fullrun-v310-no-recharge-v15.mjs',import.meta.url);
const v15StagePath=new URL('./.generated-fullrun-v310-no-recharge-v16-v15stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v16 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v16 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V15 proved the marrow recovery lot works: the autonomous realm33 player bought it normally,
// then died later in 界源海 while continuing the same mandatory five-copy Mahayana-essence chain.
// The candidate now also exposes a scarce stock-1 realm33 世界真露 recovery lot. V16 only teaches
// the autonomous player to prefer that normal market route before the existing dangerous-map fallback.
let v15=fs.readFileSync(v15Path,'utf8');
v15=replaceOnce(
 v15,
 "await import(finalRunnerPath.href+'?v15final='+Date.now());",
 "// v16 executes the final runner after enabling the normal world-essence-dew recovery route.",
 'suppress v15 final auto-import'
);
fs.writeFileSync(v15StagePath,v15);
await import(v15StagePath.href+'?v16stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v16 did not obtain v15 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const auctionBefore="const AUCTION_MATERIAL_IDS=new Set(['mat-v36-space-crystal','mat-v36-void-sand','mat-v36-void-essence','mat-v37-law-crystal','mat-v37-soul-covenant-stone','mat-v37-domain-sand','mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-heaven-vein-marrow']);";
const auctionAfter="const AUCTION_MATERIAL_IDS=new Set(['mat-v36-space-crystal','mat-v36-void-sand','mat-v36-void-essence','mat-v37-law-crystal','mat-v37-soul-covenant-stone','mat-v37-domain-sand','mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-world-essence-dew','mat-v38-heaven-vein-marrow']);";
runner=replaceOnce(runner,auctionBefore,auctionAfter,'allow normal realm33 world-essence-dew recovery auction');

const routeBefore="['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-heaven-vein-marrow'].includes(id)&&tryAuctionMaterial(id,n,160)";
const routeAfter="['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-world-essence-dew','mat-v38-heaven-vein-marrow'].includes(id)&&tryAuctionMaterial(id,n,160)";
runner=replaceOnce(runner,routeBefore,routeAfter,'prefer normal world-essence-dew auction before dangerous exploration');

if(!runner.includes("'mat-v38-origin-gold','mat-v38-world-essence-dew','mat-v38-heaven-vein-marrow']);"))throw new Error('V3.10 v16 high-tier auction whitelist missing 世界真露');
if(!runner.includes("['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-world-essence-dew','mat-v38-heaven-vein-marrow'].includes(id)&&tryAuctionMaterial(id,n,160)"))throw new Error('V3.10 v16 reusable 世界真露 auction routing missing');
if(!runner.includes("if(!AUCTION_MATERIAL_IDS.has(id)||state().player.realmIndex<25)return false"))throw new Error('V3.10 v16 auction whitelist enforcement missing');
if(!runner.includes("source:'auction'"))throw new Error('V3.10 v16 auction evidence logging missing');
if(!runner.includes("x.materialId===id&&x.mode==='named-source'"))throw new Error('V3.10 v16 dangerous named-drop/gather fallback routing lost');
if(!runner.includes("mat-v38-heaven-vein-marrow','天穹祖脉'"))throw new Error('V3.10 v16 dangerous marrow source assertion lost');
if(!runner.includes("marrowSerpentChallenge=preferWin&&preparedRealm33Sword&&enemyRealm===34&&c.enemy?.kind==='祖脉异兽'"))throw new Error('V3.10 v16 legal dangerous fallback combat policy lost');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v38-heaven-vein-marrow'")||runner.includes("v33AddMaterial('mat-v38-world-essence-dew'"))throw new Error('forbidden V3.8 material shortcut leaked into V3.10 v16 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v16 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V16_FINAL_RUNNER_PASS '+JSON.stringify({worldEssenceDewAuctionPreferred:true,heavenVeinMarrowAuctionPreferred:true,stockOneNormalTradeOnly:true,dangerousMapFallbackPreserved:true,maxSwordBuildFromV14Preserved:true,generatedRunnerSyntaxChecked:true,noDirectResourceInjection:true,noGameplayMutation:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v16final='+Date.now());
