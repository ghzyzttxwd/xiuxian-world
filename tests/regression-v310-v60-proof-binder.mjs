import fs from 'fs';
import os from 'os';
import path from 'path';
import assert from 'assert';
import {spawnSync} from 'child_process';

const binder=path.resolve('tools/verify-v310-v60-proof-evidence.mjs');
const expected='a'.repeat(64);
const daos=['sword','flame','body','spirit'];
const manuals={sword:'剑道终篇',flame:'焚世终篇',body:'不灭终篇',spirit:'太虚终篇'};
const checkpoints=[0,14,15,19,23,26,30,34,37,38,39];
const baseAge={0:16,14:30,15:35,19:50,23:75,26:105,30:140,34:210,37:300,38:312,39:325};
function result(dao,offset){
 const realmLog=checkpoints.map(i=>({realmIndex:i,realm:`R${i}`,age:baseAge[i]+offset}));
 return {status:'PASS',seed:31006701+offset,daoPath:dao,actions:180000+offset*5000,maxRealm:39,realmLog,legalCallCount:1000,forbiddenCalls:[],proof:{freshSave:true,noRecharge:true,noDirectStateMutation:true,legalGameplayCallsOnly:true,ascensionComplete:true,realmIndex:39,lifeCycles:0,totalDeaths:0},final:{realmIndex:39,realm:'真仙',location:'飞升天门',daoPath:dao,ascended:true,tribulationStatus:'complete',thunderStage:6,transformStep:3,lifespan:1000000,age:baseAge[39]+offset,manual:manuals[dao],battleWins:100,battleLosses:1,stones:100,rareMaterials:10,originInsight:360,worldAuthority:180,natalMarks:8}};
}
function build(){return {status:'PASS',gameplay_version:'3.10.0',build:'31001',source_sha256:expected,changes:['natal-artifact combat scaling now matches player.natalArtifactId by stable itemId','万劫真髓 now has a normal endgame sink through 九转渡劫丹']}}
function writeEvidence(root){
 daos.forEach((dao,i)=>{const dir=path.join(root,dao);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'V310_FULLRUN_RESULT.json'),JSON.stringify(result(dao,i),null,2));fs.writeFileSync(path.join(dir,'BUILD_V310_BALANCE.json'),JSON.stringify(build(),null,2));fs.writeFileSync(path.join(dir,'V310_FULLRUN_LOG.txt'),['V310_FULLRUN_V57_GEAR_CALL {}','V310_FULLRUN_V60_FINAL_RUNNER_PASS {}','V310_FULLRUN_V60_TRIBULATION_GEAR {}','V310_FULLRUN_PASS {}'].join('\n')+'\n')})
}
function run(root,sha=expected){return spawnSync(process.execPath,[binder,root,sha],{encoding:'utf8'})}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'v310-v60-binder-'));
try{
 const pass=path.join(tmp,'pass');writeEvidence(pass);let p=run(pass);assert.equal(p.status,0,`V60 binder rejected valid synthetic evidence:\n${p.stdout}\n${p.stderr}`);assert((p.stdout+p.stderr).includes('V310_V60_PROOF_EVIDENCE_PASS'),'V60 binder PASS marker missing');
 const missing=path.join(tmp,'missing-marker');writeEvidence(missing);const flameLog=path.join(missing,'flame','V310_FULLRUN_LOG.txt');fs.writeFileSync(flameLog,fs.readFileSync(flameLog,'utf8').replace('V310_FULLRUN_V60_TRIBULATION_GEAR {}\n',''));p=run(missing);assert.notEqual(p.status,0,'V60 binder accepted missing runtime gear marker');assert((p.stdout+p.stderr).includes('dedicated tribulation gear runtime marker missing'),'V60 binder rejected missing marker for wrong reason');
 p=run(pass,'not-a-sha');assert.notEqual(p.status,0,'V60 binder accepted invalid source SHA argument');assert((p.stdout+p.stderr).includes('source SHA256 argument missing/invalid'),'V60 binder invalid-SHA failure reason drifted');
 console.log('V310_V60_PROOF_BINDER_SELFTEST_PASS '+JSON.stringify({validEvidenceAccepted:true,missingGearMarkerRejected:true,invalidShaRejected:true,paths:daos.length}));
}finally{fs.rmSync(tmp,{recursive:true,force:true});try{fs.unlinkSync('V310_FINAL_GATE_SUMMARY.json')}catch{}}
