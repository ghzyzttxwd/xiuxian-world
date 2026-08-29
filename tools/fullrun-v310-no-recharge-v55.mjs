import fs from 'fs';
import {spawnSync} from 'child_process';

const v54Path=new URL('./fullrun-v310-no-recharge-v54.mjs',import.meta.url);
const v54StagePath=new URL('./.generated-fullrun-v310-no-recharge-v55-v54stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v55 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v55 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// V54 correctly improved the map-fallback source choice, but it replaced ensureNamed() wholesale.
// That accidentally removed the already-proven V4-V16 pre-Mahayana routing which first tries the
// normal scarce auction lots for realm33 V3.8 materials. The latest four-path evidence therefore
// bought 本命源晶 / 界源晶 through the normal auction, then V54 sent 界源玄金 straight to 界源海
// where a realm33 player cannot obtain the realm34 map drop and eventually deadlocked or died.
//
// V55 restores only the inherited legal acquisition prefix. The candidate game source, auction
// prices/stock/realm gates, map material minRealm, enemy/drop tables, route danger and action caps
// remain unchanged. If an allowed scarce auction lot is unavailable, V54's safer normal-exploration
// fallback still runs exactly as designed.
let v54=fs.readFileSync(v54Path,'utf8');
v54=replaceOnce(
 v54,
 "await import(finalRunnerPath.href+'?v54final='+Date.now());",
 "// v55 executes after restoring inherited scarce-auction routing.",
 'suppress v54 final gameplay auto-import'
);
fs.writeFileSync(v54StagePath,v54);
const staged=spawnSync(process.execPath,['--check',v54StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v55 staged V54 syntax check failed: '+(staged.stderr||staged.stdout||'unknown syntax error'));
await import(v54StagePath.href+'?v55stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v55 did not obtain V54 final runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const before=`function ensureNamed(id,n){
 if(materialCount(id)>=n)return;
 const m=registry.materials[id];`;
const after=`function ensureNamed(id,n){
 if(materialCount(id)>=n)return;
 if(id==='mat-v37-unity-seed'){ensureUnitySeeds(n);return}
 if(state().player.realmIndex>=33&&['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-world-essence-dew','mat-v38-heaven-vein-marrow'].includes(id)&&tryAuctionMaterial(id,n,160))return;
 const m=registry.materials[id];`;
runner=replaceOnce(runner,before,after,'restore inherited unity and scarce V3.8 auction routing before V54 map fallback');

if(!runner.includes("if(id==='mat-v37-unity-seed'){ensureUnitySeeds(n);return}"))throw new Error('V3.10 v55 lost unity-seed special routing');
if(!runner.includes("['mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-world-essence-dew','mat-v38-heaven-vein-marrow'].includes(id)&&tryAuctionMaterial(id,n,160)"))throw new Error('V3.10 v55 scarce V3.8 auction prefix missing');
if(!runner.includes("const AUCTION_MATERIAL_IDS=new Set(['mat-v36-space-crystal','mat-v36-void-sand','mat-v36-void-essence','mat-v37-law-crystal','mat-v37-soul-covenant-stone','mat-v37-domain-sand','mat-v38-origin-crystal','mat-v38-natal-source-crystal','mat-v38-origin-gold','mat-v38-world-essence-dew','mat-v38-heaven-vein-marrow']);"))throw new Error('V3.10 v55 inherited auction whitelist missing');
if(!runner.includes("source:'auction'"))throw new Error('V3.10 v55 inherited auction evidence logging missing');
if(!runner.includes('V310_FULLRUN_V54_NAMED_SOURCE'))throw new Error('V3.10 v55 lost V54 safer map fallback');
if(!runner.includes('best.danger+V54_SAFETY_MARGIN<=first.danger'))throw new Error('V3.10 v55 lost V54 conservative safer-source guard');
if(!runner.includes("act('explore',true);"))throw new Error('V3.10 v55 normal legal exploration fallback missing');
if(!runner.includes('V310_FULLRUN_V53_WORK_RELOCATE'))throw new Error('V3.10 v55 lost V53 work relocation');
if(!runner.includes('V310_FULLRUN_V52_MAHAYANA_BATCH'))throw new Error('V3.10 v55 lost V52 Mahayana batching');
if(!runner.includes('V310_FULLRUN_V51_ORIGIN_SITE'))throw new Error('V3.10 v55 lost V51 origin-site selection');
if(!runner.includes('V310_FULLRUN_V50_ESSENCE_READY'))throw new Error('V3.10 v55 lost V50 unity reserve handling');
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("v33AddMaterial('mat-v38-mahayana-essence'")||runner.includes("v33AddMaterial('mat-v38-origin-gold'")||runner.includes("invoke('v34ActivateBuildForTest'"))throw new Error('forbidden shortcut leaked into V3.10 v55 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v55 generated runner syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V55_FINAL_RUNNER_PASS '+JSON.stringify({scarceV38AuctionRecoveryRestored:true,originGoldAuctionPreferred:true,v54SaferMapFallbackPreserved:true,normalTradeOnly:true,normalExploreFallbackOnly:true,auctionPricesAndStockUnchanged:true,mapDropsAndRealmGatesUnchanged:true,regionDangerUnchanged:true,actionCapUnchanged:true,maxActions:Number(process.env.V310_FULLRUN_MAX_ACTIONS||180000),noDirectResourceInjection:true,noRunnerGameplayMutation:true,generatedRunnerSyntaxChecked:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v55final='+Date.now());
