import fs from 'fs';
import path from 'path';
import assert from 'assert';
import {spawnSync} from 'child_process';

const root=process.argv[2]||'V310_FULLRUN_EVIDENCE';
const expectedSource=(process.argv[3]||'').trim();
assert(/^[0-9a-f]{64}$/.test(expectedSource),'expected V3.10 source SHA256 argument missing/invalid');
const daos=['sword','flame','body','spirit'];
const seen=new Set();
function walk(dir){
 const out=[];
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,ent.name);
  if(ent.isDirectory())out.push(...walk(p));else if(ent.isFile())out.push(p);
 }
 return out;
}
assert(fs.existsSync(root),`V60 proof evidence root missing: ${root}`);
const files=walk(root);
for(const dao of daos){
 const resultFiles=files.filter(f=>f.endsWith('V310_FULLRUN_RESULT.json')).filter(f=>{
  try{return JSON.parse(fs.readFileSync(f,'utf8'))?.daoPath===dao}catch{return false}
 });
 assert.equal(resultFiles.length,1,`${dao}: expected exactly one V60 result JSON, found ${resultFiles.length}`);
 const resultFile=resultFiles[0],dir=path.dirname(resultFile);
 const r=JSON.parse(fs.readFileSync(resultFile,'utf8'));
 assert.equal(r.status,'PASS',`${dao}: result not PASS`);
 assert.equal(r.daoPath,dao,`${dao}: path mismatch`);
 assert(Number(r.actions)>0&&Number(r.actions)<=300000,`${dao}: illegal action count`);
 assert.equal(Number(r.maxRealm),39,`${dao}: did not reach 真仙`);
 assert(r.proof?.freshSave===true&&r.proof?.noRecharge===true&&r.proof?.noDirectStateMutation===true&&r.proof?.legalGameplayCallsOnly===true&&r.proof?.ascensionComplete===true,`${dao}: proof flags incomplete`);
 assert(Array.isArray(r.forbiddenCalls)&&r.forbiddenCalls.length===0,`${dao}: forbidden calls present`);
 const logFile=path.join(dir,'V310_FULLRUN_LOG.txt');
 const buildFile=path.join(dir,'BUILD_V310_BALANCE.json');
 assert(fs.existsSync(logFile),`${dao}: V60 log missing next to result`);
 assert(fs.existsSync(buildFile),`${dao}: deterministic build report missing next to result`);
 const log=fs.readFileSync(logFile,'utf8');
 assert(log.includes('V310_FULLRUN_V60_FINAL_RUNNER_PASS'),`${dao}: V60 runner marker missing`);
 assert(log.includes('V310_FULLRUN_V60_TRIBULATION_GEAR'),`${dao}: dedicated tribulation gear runtime marker missing`);
 assert(log.includes('V310_FULLRUN_V57_GEAR_CALL'),`${dao}: live high-realm gear runtime marker missing`);
 assert(log.includes('V310_FULLRUN_PASS'),`${dao}: terminal full-run PASS marker missing`);
 const b=JSON.parse(fs.readFileSync(buildFile,'utf8'));
 assert.equal(b.status,'PASS',`${dao}: build report not PASS`);
 assert.equal(b.gameplay_version,'3.10.0',`${dao}: gameplay version mismatch`);
 assert.equal(b.build,'31001',`${dao}: build mismatch`);
 assert.equal(b.source_sha256,expectedSource,`${dao}: source SHA mismatch`);
 assert(b.changes?.some(x=>String(x).includes('natal-artifact combat scaling')),`${dao}: V58 identity fix not recorded`);
 assert(b.changes?.some(x=>String(x).includes('万劫真髓 now has a normal endgame sink')),`${dao}: V59 resource sink fix not recorded`);
 seen.add(dao);
}
assert.equal(seen.size,4,'V60 proof evidence did not cover all four dao paths');
const agg=spawnSync(process.execPath,[path.resolve('tools/aggregate-v310-fullrun-gate.mjs'),root],{encoding:'utf8'});
if(agg.status!==0)throw new Error(`V60 aggregate gate failed:\n${agg.stdout}\n${agg.stderr}`);
assert(fs.existsSync('V310_FINAL_GATE_SUMMARY.json'),'V60 aggregate summary missing');
const summary=JSON.parse(fs.readFileSync('V310_FINAL_GATE_SUMMARY.json','utf8'));
assert.equal(summary.status,'PASS','V60 aggregate summary not PASS');
assert(summary.routeDominance?.noNearTotalRouteDominance===true,'V60 route dominance gate missing/failing');
console.log('V310_V60_PROOF_EVIDENCE_PASS '+JSON.stringify({paths:[...seen],sourceSha256:expectedSource,actionSpreadRatio:summary.actionSpreadRatio,routeDominance:summary.routeDominance,terminalManualVariety:summary.terminalManualVariety}));
