import fs from 'fs';
import path from 'path';
import assert from 'assert';

const root=process.argv[2]||'V310_FULLRUN_EVIDENCE';
const daos=['sword','flame','body','spirit'];

function walk(dir){
 const out=[];
 if(!fs.existsSync(dir))return out;
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,ent.name);
  if(ent.isDirectory())out.push(...walk(p));
  else if(ent.isFile())out.push(p);
 }
 return out;
}

function findUnique(dao,name){
 const base=path.join(root,dao);
 const files=walk(base).filter(f=>path.basename(f)===name);
 assert.equal(files.length,1,`${dao}: expected exactly one ${name}, found ${files.length}`);
 return files[0];
}

const summary={status:'PASS',gameplay_version:'3.10.0',proofFamily:'V64',paths:{}};
for(const dao of daos){
 const resultPath=findUnique(dao,'V310_FULLRUN_RESULT.json');
 const logPath=findUnique(dao,'V310_FULLRUN_LOG.txt');
 const r=JSON.parse(fs.readFileSync(resultPath,'utf8'));
 const log=fs.readFileSync(logPath,'utf8');

 assert.equal(r.status,'PASS',`${dao}: result status not PASS`);
 assert.equal(r.daoPath,dao,`${dao}: dao mismatch`);
 assert(Number(r.actions)>0&&Number(r.actions)<=300000,`${dao}: illegal action count ${r.actions}`);
 assert.equal(Number(r.maxRealm),39,`${dao}: did not reach 真仙`);
 assert(Array.isArray(r.forbiddenCalls)&&r.forbiddenCalls.length===0,`${dao}: forbidden calls present`);
 assert(r.proof?.freshSave===true,`${dao}: not fresh save`);
 assert(r.proof?.noRecharge===true,`${dao}: recharge contamination`);
 assert(r.proof?.noDirectStateMutation===true,`${dao}: direct state mutation detected`);
 assert(r.proof?.legalGameplayCallsOnly===true,`${dao}: non-legal gameplay call detected`);
 assert(r.proof?.ascensionComplete===true,`${dao}: ascension incomplete`);
 assert.equal(Number(r.final?.realmIndex),39,`${dao}: final realm mismatch`);
 assert.equal(r.final?.realm,'真仙',`${dao}: final realm name mismatch`);
 assert.equal(r.final?.location,'飞升天门',`${dao}: final location mismatch`);
 assert(r.final?.ascended===true,`${dao}: ascended false`);
 assert.equal(r.final?.tribulationStatus,'complete',`${dao}: tribulation incomplete`);
 assert.equal(Number(r.final?.thunderStage),6,`${dao}: six thunder stages incomplete`);
 assert.equal(Number(r.final?.transformStep),3,`${dao}: immortal transformation incomplete`);

 assert(log.includes('V310_FULLRUN_V64_FINAL_RUNNER_PASS'),`${dao}: V64 final runner marker missing`);
 assert(log.includes('V310_FULLRUN_V57_GEAR_CALL'),`${dao}: V57 live path-gear marker missing`);
 assert(log.includes('V310_FULLRUN_V60_TRIBULATION_GEAR'),`${dao}: V60 tribulation gear marker missing`);
 assert(log.includes('V310_FULLRUN_V61_LIVE_TRIBULATION_ENTRY'),`${dao}: V61 live tribulation-entry marker missing`);
 assert(log.includes('item-v39-thunder-umbrella'),`${dao}: dedicated thunder umbrella evidence missing`);
 assert(log.includes('item-v39-tribulation-array-disc'),`${dao}: dedicated tribulation array-disc evidence missing`);

 const domainSandRequested=/V310_FULLRUN_V54_NAMED_SOURCE[^\n]*mat-v37-domain-sand/.test(log);
 const domainSandProductive=/V310_FULLRUN_V64_PRODUCTIVE_SOURCE[^\n]*mat-v37-domain-sand/.test(log);
 if(domainSandRequested)assert(domainSandProductive,`${dao}: domain-sand request did not switch to a productive source`);

 const fledWorldheart=/V310_FULLRUN_V39_FLEE[^\n]*界心巨灵/.test(log);
 if(fledWorldheart)assert(log.includes('V310_FULLRUN_V62_ESCAPE_GUARD'),`${dao}: worldheart flee lacked V62 escape guard`);

 const mahayanaRetry=/V310_FULLRUN_BREAKTHROUGH_RETRY[^\n]*"realm":"合体圆满"/.test(log);
 let mahayanaOutcome='not-needed';
 if(mahayanaRetry){
  assert(log.includes('V310_FULLRUN_V63_MAHAYANA_RECIPE'),`${dao}: post-failure Mahayana recipe evidence missing`);
  assert(log.includes('V310_FULLRUN_V63_MAHAYANA_BREW'),`${dao}: post-failure Mahayana brew evidence missing`);
  const used=/V310_FULLRUN_V63_MAHAYANA_PILL[^\n]*"stage":"used"/.test(log);
  const allFailed=/V310_FULLRUN_V63_MAHAYANA_PILL[^\n]*"stage":"three-brews-failed"/.test(log);
  assert(used||allFailed,`${dao}: Mahayana stabilizer ended without used or three-brews-failed evidence`);
  mahayanaOutcome=used?'used':'three-brews-failed';
 }

 summary.paths[dao]={
  seed:r.seed,
  actions:Number(r.actions),
  finalAge:Number(r.final?.age),
  battleWins:Number(r.final?.battleWins||0),
  battleLosses:Number(r.final?.battleLosses||0),
  domainSandRequested,
  domainSandProductive,
  fledWorldheart,
  mahayanaRetry,
  mahayanaOutcome,
  terminalGearVerified:true
 };
}

fs.writeFileSync('V310_V64_EVIDENCE_VERIFICATION.json',JSON.stringify(summary,null,2)+'\n');
console.log('V310_V64_EVIDENCE_VERIFIER_PASS '+JSON.stringify(summary));
