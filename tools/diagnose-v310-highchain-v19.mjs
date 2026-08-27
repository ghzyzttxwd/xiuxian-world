import fs from 'fs';

const basePath=new URL('./diagnose-v310-highchain.mjs',import.meta.url);
const src=fs.readFileSync(basePath,'utf8');

// The base highchain diagnostic now directly builds fullrun-v19. Keep this wrapper only as the
// workflow-stable entrypoint and fail fast if the base diagnostic ever drifts back to an older runner.
if(!src.includes("const v19Path=new URL('./fullrun-v310-no-recharge-v19.mjs',import.meta.url);"))throw new Error('V3.10 highchain-v19 wrapper: base diagnostic is not using v19');
if(!src.includes("await import(finalRunnerPath.href+'?highchain='+Date.now());"))throw new Error('V3.10 highchain-v19 wrapper: base diagnostic execution anchor missing');
if(!src.includes("fail('tribulation-prep-return-unreachable',{kind:k})"))throw new Error('V3.10 highchain-v19 wrapper: v19 terrace-return assertion missing from base diagnostic');
if(!src.includes("ensureOrigin(300);ensureAuthority(170);ensureNatalMarks(9);"))throw new Error('V3.10 highchain-v19 wrapper: nine-mark readiness assertion missing from base diagnostic');

console.log('V310_HIGHCHAIN_V19_WRAPPER_PASS '+JSON.stringify({nonProof:true,directBaseV19Diagnostic:true,v19TribulationItinerary:true,nineMarkReadiness:true}));
await import(basePath.href+'?wrapper='+Date.now());
