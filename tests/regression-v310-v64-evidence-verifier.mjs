import fs from 'fs';
import os from 'os';
import path from 'path';
import assert from 'assert';
import {spawnSync} from 'child_process';

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'v310-v64-evidence-'));
const daos=['sword','flame','body','spirit'];

function result(dao,i){return {
 status:'PASS',daoPath:dao,seed:31006701+i,actions:180000+i*1000,maxRealm:39,forbiddenCalls:[],
 proof:{freshSave:true,noRecharge:true,noDirectStateMutation:true,legalGameplayCallsOnly:true,ascensionComplete:true},
 final:{realmIndex:39,realm:'真仙',location:'飞升天门',ascended:true,tribulationStatus:'complete',thunderStage:6,transformStep:3,age:1500+i,battleWins:1000,battleLosses:5}
}}
function baseLog(){return [
 'V310_FULLRUN_V64_FINAL_RUNNER_PASS {}',
 'V310_FULLRUN_V57_GEAR_CALL {}',
 'V310_FULLRUN_V60_TRIBULATION_GEAR {"guard":"item-v39-thunder-umbrella","support":"item-v39-tribulation-array-disc"}',
 'V310_FULLRUN_V61_LIVE_TRIBULATION_ENTRY {}',
 'item-v39-thunder-umbrella',
 'item-v39-tribulation-array-disc'
]}
function writeEvidence(){
 for(let i=0;i<daos.length;i++){
  const dao=daos[i],dir=path.join(tmp,dao);fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'V310_FULLRUN_RESULT.json'),JSON.stringify(result(dao,i))+'\n');
  const lines=baseLog();
  if(dao==='sword')lines.push('V310_FULLRUN_V54_NAMED_SOURCE {"material":"mat-v37-domain-sand"}','V310_FULLRUN_V64_PRODUCTIVE_SOURCE {"material":"mat-v37-domain-sand","dest":"万象法坛"}');
  if(dao==='flame')lines.push('V310_FULLRUN_V39_FLEE {"enemy":"界心巨灵"}','V310_FULLRUN_V62_ESCAPE_GUARD {"shield":32000}','V310_FULLRUN_BREAKTHROUGH_RETRY {"realm":"合体圆满","attempt":1}','V310_FULLRUN_V63_MAHAYANA_RECIPE {"known":true}','V310_FULLRUN_V63_MAHAYANA_BREW {"brewAttempt":1}','V310_FULLRUN_V63_MAHAYANA_PILL {"stage":"used"}');
  if(dao==='body')lines.push('V310_FULLRUN_BREAKTHROUGH_RETRY {"realm":"合体圆满","attempt":1}','V310_FULLRUN_V63_MAHAYANA_RECIPE {"known":true}','V310_FULLRUN_V63_MAHAYANA_BREW {"brewAttempt":3}','V310_FULLRUN_V63_MAHAYANA_PILL {"stage":"three-brews-failed"}');
  fs.writeFileSync(path.join(dir,'V310_FULLRUN_LOG.txt'),lines.join('\n')+'\n');
 }
}
function run(){return spawnSync(process.execPath,['tools/verify-v310-v64-evidence.mjs',tmp],{encoding:'utf8'});}

writeEvidence();
let r=run();
assert.equal(r.status,0,`valid synthetic V64 evidence must PASS\n${r.stdout}\n${r.stderr}`);
assert(r.stdout.includes('V310_V64_EVIDENCE_VERIFIER_PASS'),'PASS marker missing');

const swordLog=path.join(tmp,'sword','V310_FULLRUN_LOG.txt');
let s=fs.readFileSync(swordLog,'utf8');
s=s.replace(/^V310_FULLRUN_V64_PRODUCTIVE_SOURCE.*\n/m,'');
fs.writeFileSync(swordLog,s);
r=run();
assert.notEqual(r.status,0,'domain-sand request without productive-source marker must fail closed');
assert((r.stderr+r.stdout).includes('domain-sand request did not switch to a productive source'),'domain-sand failure reason missing');

writeEvidence();
const flameLog=path.join(tmp,'flame','V310_FULLRUN_LOG.txt');
s=fs.readFileSync(flameLog,'utf8').replace(/^V310_FULLRUN_V63_MAHAYANA_PILL.*\n/m,'');
fs.writeFileSync(flameLog,s);
r=run();
assert.notEqual(r.status,0,'Mahayana retry without used/three-brews-failed outcome must fail closed');
assert((r.stderr+r.stdout).includes('Mahayana stabilizer ended without used or three-brews-failed evidence'),'Mahayana failure reason missing');

fs.rmSync(tmp,{recursive:true,force:true});
fs.rmSync('V310_V64_EVIDENCE_VERIFICATION.json',{force:true});
console.log('V310_V64_EVIDENCE_VERIFIER_REGRESSION_PASS '+JSON.stringify({validEvidencePasses:true,domainSandMissingFails:true,mahayanaOutcomeMissingFails:true}));
