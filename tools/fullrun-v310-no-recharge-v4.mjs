import fs from 'fs';

const v3Path=new URL('./fullrun-v310-no-recharge-v3.mjs',import.meta.url);
const v3StagePath=new URL('./.generated-fullrun-v310-no-recharge-v4-v3stage.mjs',import.meta.url);
const generatedV3Path=new URL('./.generated-fullrun-v310-no-recharge-v3.mjs',import.meta.url);
const transformerStagePath=new URL('./.generated-fullrun-v310-no-recharge-v4-transformer.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v4 final-runner transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v4 final-runner transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// Stage 1: execute v3 only far enough to emit its transformed v2 transformer.
// Do not allow v3 to immediately execute that transformer, because v4 must inspect the
// actual generated layers rather than trusting nested template text.
let v3=fs.readFileSync(v3Path,'utf8');
const autoImport="fs.writeFileSync(outPath,src);\nawait import(outPath.href+'?seed='+Date.now());";
v3=replaceOnce(v3,autoImport,"fs.writeFileSync(outPath,src);",'suppress v3 auto-import');
fs.writeFileSync(v3StagePath,v3);
await import(v3StagePath.href+'?stage1='+Date.now());
if(!fs.existsSync(generatedV3Path))throw new Error('V3.10 v4 did not obtain generated v3 transformer');

// Stage 2: execute the generated transformer only far enough to emit the real runner.
let transformer=fs.readFileSync(generatedV3Path,'utf8');
transformer=replaceOnce(transformer,autoImport,"fs.writeFileSync(outPath,src);",'suppress generated transformer auto-import');
fs.writeFileSync(transformerStagePath,transformer);
await import(transformerStagePath.href+'?stage2='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v4 did not obtain final generated v2 runner');

// Stage 3: patch the exact file that will be executed by CI.
let runner=fs.readFileSync(finalRunnerPath,'utf8');

const ensureNamedBefore="function ensureNamed(id,n){if(materialCount(id)>=n)return;";
const ensureNamedAfter="function ensureNamed(id,n){if(materialCount(id)>=n)return;if(id==='mat-v37-unity-seed'){ensureUnitySeeds(n);return}";
runner=replaceOnce(runner,ensureNamedBefore,ensureNamedAfter,'route all unity-seed requests through integration');

const unityHelperAnchor="function ensureUnityEssence(n){";
const unityHelper="function ensureUnitySeeds(n){let guard=0;while(materialCount('mat-v37-unity-seed')<n){if(++guard>MAX_FARM_ACTIONS)fail('unity-seed-integration-deadlock',{target:n,current:materialCount('mat-v37-unity-seed'),lawProficiency:state().player.v37LawProficiency,unity:state().player.v37Unity});ensureLaw(35);ensureNamed('mat-v37-law-crystal',1);ensureNamed('mat-v37-soul-covenant-stone',1);if(!goTo('归一圣墟'))fail('unity-seed-integration-location-unreachable',{target:n});const before=materialCount('mat-v37-unity-seed');const r=spendAction('integrate-unity-for-seed',()=>invoke('v37IntegrateUnity'));heal();if(!r?.ok)fail('unity-seed-integration-blocked',{target:n,result:r});const after=materialCount('mat-v37-unity-seed');if(after>before)console.log('V310_FULLRUN_MATERIAL',JSON.stringify({source:'unity-integration',id:'mat-v37-unity-seed',name:'合体道胎',count:after,target:n,actions}))}}\nfunction ensureUnityEssence(n){";
runner=replaceOnce(runner,unityHelperAnchor,unityHelper,'add normal unity-seed integration strategy');
runner=replaceOnce(runner,"ensureNamed('mat-v37-unity-seed',2);","ensureUnitySeeds(2);",'remove direct unity-seed exploration from unity essence');

// Realm 37 is 大乘圆满, not an already-full tribulation save. Readiness requires its
// cultivation bar to be full, so the legal runner must normally cultivate it before invoking
// any tribulation preparation/resolution API.
runner=replaceOnce(runner,"if(state().player.realmIndex===37){finishTribulation();break}","if(state().player.realmIndex===37){cultivateFull();heal();finishTribulation();break}",'cultivate Mahayana perfection before tribulation');

// Hard proof against another transformer-layer false positive: inspect the exact executable.
if(!runner.includes("function ensureUnitySeeds(n)"))throw new Error('final runner missing unity-seed integration helper');
if(!runner.includes("if(id==='mat-v37-unity-seed'){ensureUnitySeeds(n);return}"))throw new Error('final runner missing unity-seed global routing guard');
if(runner.includes("ensureNamed('mat-v37-unity-seed',2);"))throw new Error('final runner still contains dangerous unity-seed exploration call');
if(!runner.includes("source:'unity-integration'"))throw new Error('final runner missing unity-integration evidence log');
if(!runner.includes("if(state().player.realmIndex===37){cultivateFull();heal();finishTribulation();break}"))throw new Error('final runner would start tribulation before full realm37 cultivation');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v37-unity-seed'"))throw new Error('forbidden progression shortcut leaked into final runner');

fs.writeFileSync(finalRunnerPath,runner);
console.log('V310_FULLRUN_V4_FINAL_RUNNER_PASS '+JSON.stringify({unitySeedRouting:true,unitySeedIntegration:true,realm37Cultivation:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v4final='+Date.now());
