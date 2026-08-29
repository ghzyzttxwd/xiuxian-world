import fs from 'fs';
import os from 'os';
import path from 'path';
import assert from 'assert';
import {spawnSync} from 'child_process';

const aggregator=path.resolve('tools/aggregate-v310-fullrun-gate.mjs');
assert(fs.existsSync(aggregator),'V3.10 aggregate gate missing');
const paths=['sword','flame','body','spirit'];
const realmIndexes=[0,14,15,19,23,26,30,34,37,38,39];
const manuals={sword:'剑道终篇',flame:'焚世终篇',body:'不灭终篇',spirit:'太虚终篇'};

function makeResult(dao,ages){
 const realmLog=realmIndexes.map((realmIndex,i)=>({realmIndex,realm:`R${realmIndex}`,age:ages[realmIndex]??(10+i*10)}));
 return {
  status:'PASS',seed:31006700+paths.indexOf(dao)+1,daoPath:dao,actions:180000+paths.indexOf(dao)*10000,maxRealm:39,
  realmLog,legalCallCount:1,forbiddenCalls:[],
  proof:{freshSave:true,noRecharge:true,noDirectStateMutation:true,legalGameplayCallsOnly:true,ascensionComplete:true,realmIndex:39,lifeCycles:0,totalDeaths:0},
  final:{realmIndex:39,realm:'真仙',location:'飞升天门',daoPath:dao,ascended:true,tribulationStatus:'complete',thunderStage:6,transformStep:3,lifespan:1000000,age:ages[39],manual:manuals[dao],battleWins:100,battleLosses:1,stones:100,rareMaterials:10,originInsight:360,worldAuthority:180,natalMarks:8}
 };
}

function writeCase(root,ageMap){
 fs.mkdirSync(root,{recursive:true});
 for(const dao of paths){
  const dir=path.join(root,dao);fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'V310_FULLRUN_RESULT.json'),JSON.stringify(makeResult(dao,ageMap[dao]),null,2)+'\n');
 }
}
function runCase(root){
 return spawnSync(process.execPath,[aggregator,root],{cwd:process.cwd(),encoding:'utf8'});
}

// Required time-growth shape shared by all synthetic cases:
// 元婴19 -> 化神23 = 20y; 合体30 -> 大乘34 = 60y; 大乘34 -> 圆满37 = 80y.
const base={0:16,14:25,15:28,19:40,23:60,26:90,30:120,34:180,37:260,38:270,39:280};
function shifted(delta=0){return Object.fromEntries(Object.entries(base).map(([k,v])=>[k,v+delta]))}

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'v310-aggregate-gate-'));
try{
 // PASS: sword is uniquely fastest at five checkpoints, flame takes the last two.
 const passAges={sword:shifted(0),flame:shifted(5),body:shifted(10),spirit:shifted(15)};
 for(const r of [37,39]){passAges.flame[r]=base[r]-1;passAges.sword[r]=base[r]}
 const passDir=path.join(tmp,'pass-five-of-seven');writeCase(passDir,passAges);
 let proc=runCase(passDir);
 assert.equal(proc.status,0,`aggregate gate rejected allowed 5/7 case:\n${proc.stdout}\n${proc.stderr}`);
 const passSummary=JSON.parse(fs.readFileSync('V310_FINAL_GATE_SUMMARY.json','utf8'));
 assert.equal(passSummary.routeDominance.uniqueFastestCount.sword,5,'synthetic PASS case did not produce 5/7 sword lead');
 assert.equal(passSummary.routeDominance.hardLimit,6,'dominance hard limit drifted');

 // FAIL: sword is uniquely fastest at six checkpoints; flame wins only 真仙 endpoint.
 const failAges={sword:shifted(0),flame:shifted(5),body:shifted(10),spirit:shifted(15)};
 failAges.flame[39]=base[39]-1;failAges.sword[39]=base[39];
 const failDir=path.join(tmp,'fail-six-of-seven');writeCase(failDir,failAges);
 proc=runCase(failDir);
 assert.notEqual(proc.status,0,'aggregate gate incorrectly allowed 6/7 unique-fastest dominance');
 assert((proc.stderr+proc.stdout).includes('route dominance detected'),'aggregate gate failed for the wrong reason in 6/7 case');
 console.log('V310_AGGREGATE_GATE_SELFTEST_PASS '+JSON.stringify({allowedUniqueFastest:5,rejectedUniqueFastest:6,checkpoints:7,actionSpreadGuard:true,terminalManualVarietyGuard:true}));
}finally{
 fs.rmSync(tmp,{recursive:true,force:true});
 try{fs.unlinkSync('V310_FINAL_GATE_SUMMARY.json')}catch{}
}
