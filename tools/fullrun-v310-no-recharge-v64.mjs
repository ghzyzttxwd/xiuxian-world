import fs from 'fs';
import {spawnSync} from 'child_process';

const v63Path=new URL('./fullrun-v310-no-recharge-v63.mjs',import.meta.url);
const v63StagePath=new URL('./.generated-fullrun-v310-no-recharge-v64-v63stage.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);
const gamePath=new URL('../src/game-v310.js',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v64 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v64 transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}
function functionSpan(src,signature,label){
 const start=src.indexOf(signature);
 if(start<0)throw new Error('V3.10 v64 function miss: '+label);
 const open=src.indexOf('{',start);
 if(open<0)throw new Error('V3.10 v64 function-open miss: '+label);
 let depth=0,end=-1;
 for(let i=open;i<src.length;i++){
  const ch=src[i];
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){end=i;break}
 }
 if(end<0)throw new Error('V3.10 v64 function-close miss: '+label);
 return {start,end};
}
function replaceFunction(src,signature,replacement,label){
 const {start,end}=functionSpan(src,signature,label);
 return src.slice(0,start)+replacement+src.slice(end+1);
}

// V61 sword proved a deterministic runner logistics defect: 领域砂 was farmed in 天衡战城 for
// 1626 combat wins with zero yield. The authored material is combat-constrained to 法则异灵, while
// 天衡战城's actual enemy table is 边荒战敌 and 万象法坛 has actual 法则异灵. V54 scored source
// safety but only switched when another source was >=0.20 safer, so it could knowingly retain a
// zero-yield combat source. V64 changes autonomous source selection only. It preserves all game data,
// drop probabilities, enemy tables, travel risk, action accounting and the 300k validation fuse.
let v63=fs.readFileSync(v63Path,'utf8');
v63=replaceOnce(
 v63,
 "await import(finalRunnerPath.href+'?v63final='+Date.now());",
 "// v64 executes after productive combat-source routing for the proven domain-sand deadlock.",
 'suppress v63 final gameplay auto-import'
);
fs.writeFileSync(v63StagePath,v63);
const staged=spawnSync(process.execPath,['--check',v63StagePath.pathname],{encoding:'utf8'});
if(staged.status!==0)throw new Error('V3.10 v64 staged V63 syntax failure: '+(staged.stderr||staged.stdout||''));
await import(v63StagePath.href+'?v64stage='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v64 did not obtain V63 final runner');

const game=fs.readFileSync(gamePath,'utf8');
const domainMaterial='"id":"mat-v37-domain-sand","name":"领域砂","qualityId":"di","kind":"mineral","locations":["天衡战城","万象法坛"],"minRealm":29,"combatKinds":["法则异灵"]';
if(!game.includes(domainMaterial))throw new Error('V64 domain-sand authored source/combat-kind contract drifted');
if(!game.includes('"id":"enemy-v37-war-commander","name":"裂界战将","kind":"边荒战敌"')||!game.includes('"areas":["天衡战城"]'))throw new Error('V64 Tianheng enemy evidence drifted');
if(!game.includes('"id":"enemy-v37-rule-phantom","name":"万象法影","kind":"法则异灵"')||!game.includes('"areas":["法则古原","万象法坛"]'))throw new Error('V64 Wanxiang productive enemy evidence drifted');
if(!game.includes('"天衡战城":{"desc":"横亘天渊边荒的高阶战城。')||!game.includes('"danger":0.68,"herb":0,"work":[6,12],"find":[10,20]'))throw new Error('V64 Tianheng location balance drifted');
if(!game.includes('"万象法坛":{"desc":"由历代合体修士留下领域烙印的巨型法坛。')||!game.includes('"danger":0.84,"herb":1,"work":[0,1],"find":[13,28]'))throw new Error('V64 Wanxiang location balance drifted');

let runner=fs.readFileSync(finalRunnerPath,'utf8');
const chooseProductive=`function v54ChooseNamedSource(id,sources){
 const origin=state().player.location,candidates=[];
 for(let i=0;i<sources.length;i++){
  const row=v54NamedSourceCandidate(origin,sources[i],i,id);
  if(row)candidates.push(row);
 }
 if(!candidates.length)return null;
 const first=candidates[0];
 const best=[...candidates].sort((a,b)=>a.score-b.score||a.index-b.index)[0];
 let chosen=first,safer=false,productiveRescue=false;
 if(id==='mat-v37-domain-sand'&&first.combatDropRatio<=0){
  const productive=[...candidates].filter(x=>x.combatDropRatio>0).sort((a,b)=>b.combatDropRatio-a.combatDropRatio||a.score-b.score||a.index-b.index)[0];
  if(productive){
   chosen=productive;productiveRescue=productive.location!==first.location;
   if(productiveRescue)console.log('V310_FULLRUN_V64_PRODUCTIVE_SOURCE',JSON.stringify({id,name:'领域砂',origin,first:first.location,chosen:productive.location,firstCombatDropRatio:Number(first.combatDropRatio.toFixed(4)),chosenCombatDropRatio:Number(productive.combatDropRatio.toFixed(4)),firstDanger:Number(first.danger.toFixed(3)),chosenDanger:Number(productive.danger.toFixed(3)),reason:'combat-kind-compatible-source',actions}));
  }
 }
 if(!productiveRescue){
  safer=best.location!==first.location&&best.danger+V54_SAFETY_MARGIN<=first.danger;
  chosen=safer?best:first;
 }
 return {origin,first,best,chosen,safer,productiveRescue,candidates};
}`;
runner=replaceFunction(runner,'function v54ChooseNamedSource(',chooseProductive,'prefer proven productive combat source for combat-constrained domain sand');

if(!runner.includes("id==='mat-v37-domain-sand'&&first.combatDropRatio<=0"))throw new Error('V64 zero-yield domain-sand rescue guard missing');
if(!runner.includes("filter(x=>x.combatDropRatio>0)"))throw new Error('V64 productive combat-source filter missing');
if(!runner.includes('V310_FULLRUN_V64_PRODUCTIVE_SOURCE'))throw new Error('V64 productive-source runtime evidence missing');
if(!runner.includes('best.danger+V54_SAFETY_MARGIN<=first.danger'))throw new Error('V64 lost V54 ordinary safety routing');
for(const marker of ['V310_FULLRUN_V63_MAHAYANA_PILL','V310_FULLRUN_V62_ESCAPE_GUARD','V310_FULLRUN_V61_LIVE_TRIBULATION_ENTRY','V310_FULLRUN_V57_GEAR_CALL'])if(!runner.includes(marker))throw new Error('V64 lost inherited marker '+marker);
if(runner.includes("invoke('v37SetPlayerForTest'")||runner.includes("invoke('v34ActivateBuildForTest'")||runner.includes("v33AddMaterial('mat-v37-domain-sand'"))throw new Error('forbidden domain-sand shortcut leaked into V64 runner');

fs.writeFileSync(finalRunnerPath,runner);
const syntax=spawnSync(process.execPath,['--check',finalRunnerPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V64 final runner syntax failure: '+(syntax.stderr||syntax.stdout||''));
console.log('V310_FULLRUN_V64_FINAL_RUNNER_PASS '+JSON.stringify({domainSandDeadlockEvidenceWins:1626,domainSandCombatKind:'法则异灵',firstSource:'天衡战城',productiveSource:'万象法坛',zeroYieldCombatSourceRejected:true,actualRegistryDropRatioUsed:true,v54SafetyRoutingOtherwisePreserved:true,v63MahayanaStrategyPreserved:true,v62EscapeGuardPreserved:true,v61LiveTribulationGearPreserved:true,enemyStatsUnchanged:true,dropRatesUnchanged:true,materialCatalogUnchanged:true,routeRiskUnchanged:true,seedUnchanged:true,actionCapUnchanged:true,noDirectResourceInjection:true,noDirectStateMutation:true}));
await import(finalRunnerPath.href+'?v64final='+Date.now());
