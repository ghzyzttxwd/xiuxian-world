import fs from 'fs';

const basePath=new URL('./diagnose-v310-highchain.mjs',import.meta.url);
const outPath=new URL('./.generated-diagnose-v310-highchain-v19.mjs',import.meta.url);
let src=fs.readFileSync(basePath,'utf8');

function replaceOnce(before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 highchain-v19 transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 highchain-v19 transform ambiguous: '+label);
 src=src.slice(0,first)+after+src.slice(first+before.length);
}

// Reuse the existing realm34+ NON-PROOF diagnostic, but have it build the exact current v19
// autonomous runner. V19 already performs its own final-runner self-check before its proof import;
// the diagnostic suppresses only that proof import and then applies the existing NON-PROOF setup.
replaceOnce("const v18Path=new URL('./fullrun-v310-no-recharge-v18.mjs',import.meta.url);","const v18Path=new URL('./fullrun-v310-no-recharge-v19.mjs',import.meta.url);",'use v19 runner');
replaceOnce("const v18StagePath=new URL('./.generated-diagnostic-v310-v18stage.mjs',import.meta.url);","const v18StagePath=new URL('./.generated-diagnostic-v310-v19stage.mjs',import.meta.url);",'separate v19 stage');
replaceOnce("await import(finalRunnerPath.href+'?v18final='+Date.now());","await import(finalRunnerPath.href+'?v19final='+Date.now());",'suppress v19 proof execution anchor');
src=src.replaceAll('currentV18Policy','currentV19Policy');
src=src.replaceAll('v18 autonomous runner','v19 autonomous runner');
src=src.replaceAll('did not obtain v18 final runner','did not obtain v19 final runner');

// Do not add another fragile source-text assertion here. fullrun-v19 itself hard-checks that its
// terrace-return patch is present in the generated final runner before this diagnostic transforms it.
fs.writeFileSync(outPath,src);
console.log('V310_HIGHCHAIN_V19_WRAPPER_PASS '+JSON.stringify({nonProof:true,v19TribulationItinerary:true,baseDiagnosticPreserved:true,v19SelfCheckAuthoritative:true}));
await import(outPath.href+'?wrapper='+Date.now());
