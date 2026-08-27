import fs from 'fs';
import {spawnSync} from 'child_process';

const v14Path=new URL('./fullrun-v310-no-recharge-v14.mjs',import.meta.url);
const v14StagePath=new URL('./.generated-fullrun-v310-no-recharge-v15-v14stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v15 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v15 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V14 closed the combat-strategy question: even a legal max-prepared realm33 sword build could
// not reliably obtain the mandatory marrow from realm34 祖脉天蛇. The candidate now exposes a
// scarce stock-1 realm33 rotating auction recovery lot. V15 changes runner strategy only so the
// autonomous player actually uses that normal market path before retaining the dangerous map fallback.
let v14=fs.readFileSync(v14Path,'utf8');
v14=replaceOnce(
 v14,
 "await import(finalRunnerPath.href+'?v14final='+Date.now());",
 "// v15 executes the final runner after enabling the normal marrow recovery market route.",
 'suppress v14 final auto-import'
);
fs.writeFileSync(v14StagePath,v14);
await import(v14StagePath.href+'?v15stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v15 did not obtain v14 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const auctionBefore="const AUCTION_MATERIAL_IDS=new Set(['mat-v36-space-crystal','mat-v36-void-sand','mat-v36-void-essence','mat-v37-law-crystal','mat-v37-soul-covenant-stone','mat-v37-domain-sand','mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold']);";
const auctionAfter="const AUCTION_MATERIAL_IDS=new Set(['mat-v36-space-crystal','mat-v36-void-sand','mat-v36-void-essence','mat-v37-law-crystal','mat-v37-soul-covenant-stone','mat-v37-domain-sand','mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-heaven-vein-marrow']);";
runner=replaceOnce(runner,auctionBefore,auctionAfter,'allow normal realm33 heaven-vein marrow recovery auction');

const routeBefore="['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold'].includes(id)&&tryAuctionMaterial(id,n,160)";
const routeAfter="['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-heaven-vein-marrow'].includes(id)&&tryAuctionMaterial(id,n,160)";
runner=replaceOnce(runner,routeBefore,routeAfter,'prefer normal marrow auction before dangerous exploration');

if(!runner.includes("'mat-v38-origin-gold','mat-v38-heaven-vein-marrow']);"))throw new Error('V3.10 v15 heaven-vein marrow auction whitelist missing');
if(!runner.includes("['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-heaven-vein-marrow'].includes(id)&&tryAuctionMaterial(id,n,160)"))throw new Error('V3.10 v15 reusable marrow auction routing missing');
if(!runner.includes("if(!AUCTION_MATERIAL_IDS.has(id)||state().player.realmIndex<25)return false"))throw new Error('V3.10 v15 auction whitelist enforcement missing');
if(!runner.includes("source:'auction'"))throw new Error('V3.10 v15 auction evidence logging missing');
if(!runner.includes("x.materialId===id&&x.mode==='named-source'"))throw new Error('V3.10 v15 dangerous named-drop fallback routing lost');
if(!runner.includes("mat-v38-heaven-vein-marrow','天穹祖脉'"))throw new Error('V3.10 v15 dangerous marrow source assertion lost');
if(!runner.includes("marrowSerpentChallenge=preferWin&&preparedRealm33Sword&&enemyRealm===34&&c.enemy?.kind==='祖脉异兽'"))throw new Error('V3.10 v15 legal dangerous fallback combat policy lost');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v38-heaven-vein-marrow'"))throw new Error('forbidden marrow shortcut leaked into V3.10 v15 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v15 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V15_FINAL_RUNNER_PASS '+JSON.stringify({heavenVeinMarrowAuctionPreferred:true,stockOneNormalTradeOnly:true,dangerousMapFallbackPreserved:true,maxSwordBuildFromV14Preserved:true,generatedRunnerSyntaxChecked:true,noDirectResourceInjection:true,noGameplayMutation:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v15final='+Date.now());
