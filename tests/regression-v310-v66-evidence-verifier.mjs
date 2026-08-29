import fs from 'fs';
import os from 'os';
import path from 'path';
import assert from 'assert';
import {spawnSync} from 'child_process';

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'v310-v66-evidence-'));
const daos=['sword','flame','body','spirit'];
const midGuards={sword:'item-v32-swordguard-wheel',flame:'item-v32-firecloud-aegis',body:'item-v32-goldenbody-drum',spirit:'item-v32-nether-armor'};

function result(dao,i){return {
 status:'PASS',daoPath:dao,seed:31006701+i,actions:170000+i*5000,maxRealm:39,forbiddenCalls:[],
 proof:{freshSave:true,noRecharge:true,noDirectStateMutation:true,legalGameplayCallsOnly:true,ascensionComplete:true},
 final:{realmIndex:39,realm:'真仙',location:'飞升天门',ascended:true,tribulationStatus:'complete',thunderStage:6,transformStep:3,age:1400+i,battleWins:1000,battleLosses:5}
}}
function baseLog(dao){return [
 'V310_FULLRUN_V66_FINAL_RUNNER_PASS {}',
 'V310_FULLRUN_V65_DWELLING {"toTier":3,"name":"青云洞府"}',
 `V310_FULLRUN_V66_MID_GUARD {"path":"${dao}","itemId":"${midGuards[dao]}"}`,
 'V310_FULLRUN_V57_GEAR_CALL {}',
 'V310_FULLRUN_V60_TRIBULATION_GEAR {"guard":"item-v39-thunder-umbrella","support":"item-v39-tribulation-array-disc"}',
 'V310_FULLRUN_V61_LIVE_TRIBULATION_ENTRY {}',
 'item-v39-thunder-umbrella',
 'item-v39-tribulation-array-disc'
]}
function writeEvidence(){
 fs.rmSync(tmp,{recursive:true,force:true});fs.mkdirSync(tmp,{recursive:true});
 for(let i=0;i<daos.length;i++){
  const dao=daos[i],dir=path.join(tmp,dao);fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'V310_FULLRUN_RESULT.json'),JSON.stringify(result(dao,i))+'\n');
  const lines=baseLog(dao);
  if(dao==='sword')lines.push('V310_FULLRUN_V54_NAMED_SOURCE {"material":"mat-v37-domain-sand"}','V310_FULLRUN_V64_PRODUCTIVE_SOURCE {"material":"mat-v37-domain-sand","dest":"万象法坛"}');
  if(dao==='flame')lines.push('V310_FULLRUN_V39_FLEE {"enemy":"法暴灵"}','V310_FULLRUN_V62_ESCAPE_GUARD {"shield":24000}');
  fs.writeFileSync(path.join(dir,'V310_FULLRUN_LOG.txt'),lines.join('\n')+'\n');
 }
}
function run(){return spawnSync(process.execPath,['tools/verify-v310-v66-evidence.mjs',tmp],{encoding:'utf8'});}

writeEvidence();
let r=run();
assert.equal(r.status,0,`valid synthetic V66 evidence must PASS\n${r.stdout}\n${r.stderr}`);
assert(r.stdout.includes('V310_V66_EVIDENCE_VERIFIER_PASS'),'V66 PASS marker missing');

let file=path.join(tmp,'flame','V310_FULLRUN_LOG.txt');
let s=fs.readFileSync(file,'utf8').replace(/^V310_FULLRUN_V66_MID_GUARD.*\n/m,'');
fs.writeFileSync(file,s);r=run();
assert.notEqual(r.status,0,'missing V66 midguard evidence must fail closed');
assert((r.stderr+r.stdout).includes('correct V66 midgame guard evidence missing'),'midguard failure reason missing');

writeEvidence();file=path.join(tmp,'body','V310_FULLRUN_LOG.txt');
fs.appendFileSync(file,'V310_FULLRUN_V63_MAHAYANA_BREW {"brewAttempt":1}\n');r=run();
assert.notEqual(r.status,0,'removed V63 automatic brew policy must fail closed if it executes');
assert((r.stderr+r.stdout).includes('removed automatic Mahayana pill-chasing policy executed'),'auto-pill failure reason missing');

writeEvidence();file=path.join(tmp,'spirit','V310_FULLRUN_LOG.txt');
s=fs.readFileSync(file,'utf8').replace(/^V310_FULLRUN_V60_TRIBULATION_GEAR.*\n/m,'');
fs.writeFileSync(file,s);r=run();
assert.notEqual(r.status,0,'missing terminal gear marker must fail closed');
assert((r.stderr+r.stdout).includes('V60 tribulation gear marker missing'),'terminal gear failure reason missing');

writeEvidence();file=path.join(tmp,'sword','V310_FULLRUN_LOG.txt');
s=fs.readFileSync(file,'utf8').replace(/^V310_FULLRUN_V64_PRODUCTIVE_SOURCE.*\n/m,'');
fs.writeFileSync(file,s);r=run();
assert.notEqual(r.status,0,'domain-sand request without productive source must fail closed');
assert((r.stderr+r.stdout).includes('domain-sand request did not switch to productive source'),'domain-sand failure reason missing');

fs.rmSync(tmp,{recursive:true,force:true});
fs.rmSync('V310_V66_EVIDENCE_VERIFICATION.json',{force:true});
console.log('V310_V66_EVIDENCE_VERIFIER_REGRESSION_PASS '+JSON.stringify({validEvidencePasses:true,midguardMissingFails:true,autoPillExecutionFails:true,terminalGearMissingFails:true,domainSandMissingFails:true}));
