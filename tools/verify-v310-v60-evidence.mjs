import fs from 'fs';
import path from 'path';
import assert from 'assert';

const root=process.argv[2]||'V310_FULLRUN_EVIDENCE';
const requiredPaths=['sword','flame','body','spirit'];
const guardId='item-v39-thunder-umbrella';
const supportId='item-v39-tribulation-array-disc';

function walk(dir){
 const out=[];
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,ent.name);
  if(ent.isDirectory())out.push(...walk(p));
  else if(ent.isFile())out.push(p);
 }
 return out;
}

assert(fs.existsSync(root),`V60 evidence root missing: ${root}`);
const files=walk(root);
const summary={status:'PASS',paths:{}};
for(const dao of requiredPaths){
 const candidates=files.filter(f=>f.endsWith('V310_FULLRUN_RESULT.json'));
 let resultFile=null,result=null;
 for(const f of candidates){
  let r;try{r=JSON.parse(fs.readFileSync(f,'utf8'))}catch{continue}
  if(r?.daoPath===dao){assert(!resultFile,`duplicate V60 result for ${dao}`);resultFile=f;result=r}
 }
 assert(resultFile,`missing V60 result for ${dao}`);
 const dir=path.dirname(resultFile);
 const logFile=path.join(dir,'V310_FULLRUN_LOG.txt');
 assert(fs.existsSync(logFile),`${dao}: V60 log missing beside result`);
 const log=fs.readFileSync(logFile,'utf8');
 assert.equal(result.status,'PASS',`${dao}: V60 result is not PASS`);
 assert.equal(Number(result.final?.realmIndex),39,`${dao}: final realm is not 真仙`);
 assert(result.final?.ascended===true,`${dao}: ascension flag false`);
 assert(result.proof?.freshSave===true&&result.proof?.noRecharge===true,`${dao}: fresh/no-recharge proof flags missing`);
 assert(result.proof?.noDirectStateMutation===true&&result.proof?.legalGameplayCallsOnly===true,`${dao}: legal-play proof flags missing`);
 assert(Array.isArray(result.forbiddenCalls)&&result.forbiddenCalls.length===0,`${dao}: forbidden calls detected`);
 assert(log.includes('V310_FULLRUN_V60_FINAL_RUNNER_PASS'),`${dao}: V60 final-runner marker missing`);
 assert(log.includes('V310_FULLRUN_V57_GEAR_CALL'),`${dao}: V57 live high-realm gear marker missing`);
 const gearLines=log.split('\n').filter(x=>x.includes('V310_FULLRUN_V60_TRIBULATION_GEAR'));
 assert(gearLines.length>=1,`${dao}: V60 live tribulation gear marker missing`);
 const finalGearLine=gearLines.at(-1);
 assert(finalGearLine.includes(guardId),`${dao}: thunder umbrella absent from V60 marker`);
 assert(finalGearLine.includes(supportId),`${dao}: tribulation array disc absent from V60 marker`);
 assert(Number(result.actions)>0&&Number(result.actions)<=300000,`${dao}: action count outside proof cap`);
 summary.paths[dao]={resultFile,logFile,actions:Number(result.actions),finalAge:Number(result.final?.age),battleWins:Number(result.final?.battleWins||0),battleLosses:Number(result.final?.battleLosses||0),tribulationGearMarkers:gearLines.length,guardId,supportId};
}
fs.writeFileSync('V310_V60_EVIDENCE_SUMMARY.json',JSON.stringify(summary,null,2)+'\n');
console.log('V310_V60_EVIDENCE_VERIFY_PASS '+JSON.stringify(summary));
