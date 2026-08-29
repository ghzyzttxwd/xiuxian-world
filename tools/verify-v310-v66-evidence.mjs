import fs from 'fs';
import path from 'path';
import assert from 'assert';

const root=process.argv[2]||'V310_FULLRUN_EVIDENCE';
const daos=['sword','flame','body','spirit'];
const midGuards={
 sword:'item-v32-swordguard-wheel',
 flame:'item-v32-firecloud-aegis',
 body:'item-v32-goldenbody-drum',
 spirit:'item-v32-nether-armor'
};

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
 const files=walk(path.join(root,dao)).filter(f=>path.basename(f)===name);
 assert.equal(files.length,1,`${dao}: expected exactly one ${name}, found ${files.length}`);
 return files[0];
}

const summary={status:'PASS',gameplay_version:'3.10.0',proofFamily:'V66',paths:{}};
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

 assert(log.includes('V310_FULLRUN_V66_FINAL_RUNNER_PASS'),`${dao}: V66 final runner marker missing`);
 assert(log.includes('V310_FULLRUN_V65_DWELLING'),`${dao}: paid max-dwelling evidence missing`);
 assert(new RegExp(`V310_FULLRUN_V66_MID_GUARD[^\\n]*${midGuards[dao]}`).test(log),`${dao}: correct V66 midgame guard evidence missing`);
 assert(log.includes('V310_FULLRUN_V57_GEAR_CALL'),`${dao}: V57 live path-gear marker missing`);
 assert(log.includes('V310_FULLRUN_V60_TRIBULATION_GEAR'),`${dao}: V60 tribulation gear marker missing`);
 assert(log.includes('V310_FULLRUN_V61_LIVE_TRIBULATION_ENTRY'),`${dao}: V61 live tribulation-entry marker missing`);
 assert(log.includes('item-v39-thunder-umbrella'),`${dao}: dedicated thunder umbrella evidence missing`);
 assert(log.includes('item-v39-tribulation-array-disc'),`${dao}: dedicated tribulation array-disc evidence missing`);

 // V66 intentionally removes V63's automatic post-failure pill chase. build-v6 still fixes the actual
 // gameplay pill schema, but the proof runner must not burn high-tier materials trying to force this route.
 assert(!log.includes('V310_FULLRUN_V63_MAHAYANA_BREW'),`${dao}: removed automatic Mahayana pill-chasing policy executed`);
 assert(!/V310_FULLRUN_V63_MAHAYANA_PILL[^\n]*"stage":"used"/.test(log),`${dao}: removed automatic Mahayana pill use executed`);

 const domainSandRequested=/V310_FULLRUN_V54_NAMED_SOURCE[^\n]*mat-v37-domain-sand/.test(log);
 const domainSandProductive=/V310_FULLRUN_V64_PRODUCTIVE_SOURCE[^\n]*mat-v37-domain-sand/.test(log);
 if(domainSandRequested)assert(domainSandProductive,`${dao}: domain-sand request did not switch to productive source`);

 const riskyFlee=/V310_FULLRUN_V39_FLEE[^\n]*(界心巨灵|法暴灵|四律缝合体|断脉古尊|无名界尊)/.test(log);
 if(riskyFlee)assert(log.includes('V310_FULLRUN_V62_ESCAPE_GUARD'),`${dao}: dangerous flee sequence lacked V62 guard use`);

 summary.paths[dao]={
  seed:r.seed,
  actions:Number(r.actions),
  finalAge:Number(r.final?.age),
  battleWins:Number(r.final?.battleWins||0),
  battleLosses:Number(r.final?.battleLosses||0),
  midGuard:midGuards[dao],
  maxDwellingVerified:true,
  automaticMahayanaPillChasing:false,
  domainSandRequested,
  domainSandProductive,
  riskyFlee,
  terminalGearVerified:true
 };
}

fs.writeFileSync('V310_V66_EVIDENCE_VERIFICATION.json',JSON.stringify(summary,null,2)+'\n');
console.log('V310_V66_EVIDENCE_VERIFIER_PASS '+JSON.stringify(summary));
