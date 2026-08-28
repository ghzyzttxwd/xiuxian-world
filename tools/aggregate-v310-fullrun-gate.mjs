import fs from 'fs';
import path from 'path';
import assert from 'assert';

const root=process.argv[2]||'V310_FULLRUN_EVIDENCE';
const requiredPaths=['sword','flame','body','spirit'];
function walk(dir){
 const out=[];
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,ent.name);
  if(ent.isDirectory())out.push(...walk(p));
  else if(ent.isFile()&&ent.name.endsWith('.json'))out.push(p);
 }
 return out;
}
assert(fs.existsSync(root),`V3.10 full-run evidence directory missing: ${root}`);
const byPath=new Map();
for(const file of walk(root)){
 let value;
 try{value=JSON.parse(fs.readFileSync(file,'utf8'))}catch{continue}
 if(!requiredPaths.includes(value?.daoPath))continue;
 assert(!byPath.has(value.daoPath),`duplicate V3.10 full-run result for ${value.daoPath}`);
 byPath.set(value.daoPath,{file,value});
}
for(const p of requiredPaths)assert(byPath.has(p),`missing V3.10 full-run result for ${p}`);

function realmAge(r,index){
 const rows=(r.realmLog||[]).filter(x=>Number(x.realmIndex)===index);
 assert(rows.length>0,`${r.daoPath}: realm ${index} missing from realm log`);
 return Number(rows[rows.length-1].age);
}
const paths={};
for(const p of requiredPaths){
 const {file,value:r}=byPath.get(p);
 assert.equal(r.status,'PASS',`${p}: result status not PASS`);
 assert.equal(r.daoPath,p,`${p}: dao path mismatch`);
 assert(Number.isFinite(Number(r.seed)),`${p}: seed missing`);
 assert(Number(r.actions)>0&&Number(r.actions)<=300000,`${p}: action count outside legal proof cap`);
 assert.equal(Number(r.maxRealm),39,`${p}: max realm is not 真仙`);
 assert(Array.isArray(r.forbiddenCalls)&&r.forbiddenCalls.length===0,`${p}: forbidden calls detected`);
 assert(r.proof?.freshSave===true,`${p}: not a fresh-save proof`);
 assert(r.proof?.noRecharge===true,`${p}: recharge contamination detected`);
 assert(r.proof?.noDirectStateMutation===true,`${p}: direct state mutation detected`);
 assert(r.proof?.legalGameplayCallsOnly===true,`${p}: non-legal gameplay call detected`);
 assert(r.proof?.ascensionComplete===true,`${p}: ascension proof incomplete`);
 assert.equal(Number(r.proof?.realmIndex),39,`${p}: proof realm mismatch`);
 const f=r.final||{};
 assert.equal(Number(f.realmIndex),39,`${p}: final realm index mismatch`);
 assert.equal(f.realm,'真仙',`${p}: final realm name mismatch`);
 assert.equal(f.location,'飞升天门',`${p}: final location mismatch`);
 assert.equal(f.daoPath,p,`${p}: final path mismatch`);
 assert(f.ascended===true,`${p}: final ascended flag false`);
 assert.equal(f.tribulationStatus,'complete',`${p}: tribulation incomplete`);
 assert.equal(Number(f.thunderStage),6,`${p}: six-stage thunder tribulation incomplete`);
 assert.equal(Number(f.transformStep),3,`${p}: three-stage immortal transformation incomplete`);
 assert(Number(f.lifespan)>Number(f.age),`${p}: terminal lifespan invalid`);
 assert(Number(f.battleWins)>0,`${p}: no combat wins recorded`);
 const requiredRealms=[0,14,15,19,23,26,30,34,37,38,39];
 for(const idx of requiredRealms)realmAge(r,idx);
 const a19=realmAge(r,19),a23=realmAge(r,23),a30=realmAge(r,30),a34=realmAge(r,34),a37=realmAge(r,37),a39=realmAge(r,39);
 const earlyMajorSpan=a23-a19;
 const lateMajorSpan=a34-a30;
 const mahayanaSpan=a37-a34;
 assert(earlyMajorSpan>0&&lateMajorSpan>0&&mahayanaSpan>0,`${p}: realm age progression is non-positive`);
 assert(lateMajorSpan>earlyMajorSpan,`${p}: 合体→大乘 time did not grow beyond 元婴→化神 span`);
 assert(mahayanaSpan>earlyMajorSpan,`${p}: 大乘 progression time did not grow beyond 元婴→化神 span`);
 assert(a39>a37,`${p}: tribulation/ascension consumed no world time`);
 paths[p]={
  file,
  seed:r.seed,
  actions:Number(r.actions),
  legalCallCount:Number(r.legalCallCount||0),
  finalAge:Number(f.age),
  finalManual:f.manual||null,
  battleWins:Number(f.battleWins||0),
  battleLosses:Number(f.battleLosses||0),
  lifeCycles:Number(r.proof?.lifeCycles||0),
  totalDeaths:Number(r.proof?.totalDeaths||0),
  realmAges:{r14:realmAge(r,14),r19:a19,r23:a23,r30:a30,r34:a34,r37:a37,r39:a39},
  timeSpans:{nascentToDeification:earlyMajorSpan,unityToMahayana:lateMajorSpan,mahayana:mahayanaSpan},
  finalResources:{stones:Number(f.stones||0),rareMaterials:Number(f.rareMaterials||0),originInsight:Number(f.originInsight||0),worldAuthority:Number(f.worldAuthority||0),natalMarks:Number(f.natalMarks||0)}
 };
}

const actionValues=requiredPaths.map(p=>paths[p].actions),minActions=Math.min(...actionValues),maxActions=Math.max(...actionValues);
const actionSpreadRatio=maxActions/minActions;
const manuals=new Set(requiredPaths.map(p=>paths[p].finalManual).filter(Boolean));
assert(manuals.size>=3,'V3.10 four-path terminal builds collapsed onto fewer than three distinct manuals');
if(actionSpreadRatio>3)throw new Error(`V3.10 four-path action spread exceeds 3x (${actionSpreadRatio.toFixed(3)}); one route may be materially dominating or lagging`);

const dominanceCheckpoints=[14,19,23,30,34,37,39];
const uniqueFastestByRealm={};
const uniqueFastestCount=Object.fromEntries(requiredPaths.map(p=>[p,0]));
for(const realm of dominanceCheckpoints){
 const ages=requiredPaths.map(p=>({p,age:Number(paths[p].realmAges[`r${realm}`])}));
 const min=Math.min(...ages.map(x=>x.age));
 const leaders=ages.filter(x=>Math.abs(x.age-min)<=1e-9).map(x=>x.p);
 uniqueFastestByRealm[realm]=leaders.length===1?leaders[0]:null;
 if(leaders.length===1)uniqueFastestCount[leaders[0]]++;
}
for(const p of requiredPaths){
 assert(uniqueFastestCount[p]<dominanceCheckpoints.length,`V3.10 route dominance detected: ${p} is uniquely fastest at every major checkpoint (${dominanceCheckpoints.join(',')})`);
}

const summary={
 status:'PASS',
 gameplay_version:'3.10.0',
 build:'31001',
 paths,
 fourPathsComplete:true,
 freshSaveAll:true,
 noRechargeAll:true,
 legalGameplayOnlyAll:true,
 ascensionCompleteAll:true,
 highRealmTimeGrowthAll:true,
 terminalManualVariety:manuals.size,
 actionSpreadRatio:Number(actionSpreadRatio.toFixed(3)),
 actionSpreadAssessment:actionSpreadRatio<=2?'balanced-within-2x':actionSpreadRatio<=3?'review-2x-to-3x':'fail-over-3x',
 routeDominance:{checkpoints:dominanceCheckpoints,uniqueFastestByRealm,uniqueFastestCount,noSingleRouteWinsAll:true},
 notes:[
  'Action spread is reported as a balance-dominance signal; it is not silently relaxed to force PASS.',
  'A single route uniquely fastest at every selected major realm checkpoint is a hard failure.',
  'Static scarce-resource and price/stock/source invariants remain covered by regression-v310-premahayana-auction.mjs and regression-v310-core-market.mjs.',
  'Named-material utility is independently fail-closed by regression-v310-resource-utility.mjs.'
 ]
};
fs.writeFileSync('V310_FINAL_GATE_SUMMARY.json',JSON.stringify(summary,null,2)+'\n');
console.log('V310_FINAL_GATE_AGGREGATE_PASS '+JSON.stringify(summary));
