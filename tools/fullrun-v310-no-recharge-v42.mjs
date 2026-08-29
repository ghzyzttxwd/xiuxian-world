import fs from 'fs';
import {spawnSync} from 'child_process';

const v41Path=new URL('./fullrun-v310-no-recharge-v41.mjs',import.meta.url);
const v41FixedPath=new URL('./.generated-fullrun-v310-no-recharge-v42-v41fixed.mjs',import.meta.url);

// V41 corrected the public registry field mapping, but its own runtime-probe injection used an exact
// two-line text anchor after that transformation chain. The generated V40 runner no longer contains
// that exact adjacent text, so V41 stopped before gameplay with a harness transform miss.
//
// V42 changes no gameplay strategy. It repairs only V41's generator injection mechanism: locate the
// unique `const registry=invoke('contentRegistrySnapshot');` declaration and insert the same runtime
// risk probe immediately after it by character position. All V41 enemy realm/region mapping, V40
// Lightbody routing, combat policy, formal costs and forbidden-shortcut checks remain unchanged.
let src=fs.readFileSync(v41Path,'utf8');
const start=src.indexOf("const registryAnchor=");
const endMarker="\n\nif(!runner.includes('function runnerRegionId(name)'))";
const end=src.indexOf(endMarker,start);
if(start<0||end<0)throw new Error('V3.10 v42 could not locate V41 fragile probe injection block');
const replacement=`const registryDecl="const registry=invoke('contentRegistrySnapshot');";
const registryPos=runner.indexOf(registryDecl);
if(registryPos<0)throw new Error('V3.10 v41 registry declaration missing for risk probe');
if(runner.indexOf(registryDecl,registryPos+1)>=0)throw new Error('V3.10 v41 registry declaration ambiguous for risk probe');
const registryInsert=registryPos+registryDecl.length;
const registryProbe=\`
const v41ProbeRoutes=invoke('routeInfo','落星矿脉')||[];
const v41ProbeRoute=v41ProbeRoutes.find(r=>r&&r.to==='古河遗迹')||null;
const v41ProbeCeiling=v41ProbeRoute?routeEnemyCeilingForRunner('落星矿脉',v41ProbeRoute):0;
console.log('V310_FULLRUN_V41_RISK_PROBE',JSON.stringify({from:'落星矿脉',to:'古河遗迹',route:v41ProbeRoute?.id||null,enemyCeiling:v41ProbeCeiling,enemyRealmField:'realmIndex',regionIdMapping:true}));
assert(v41ProbeRoute,'V3.10 v41 risk probe route missing');
assert(v41ProbeCeiling>=21,'V3.10 v41 enemy registry risk mapping failed: Ancient River ceiling '+v41ProbeCeiling);
\`;
runner=runner.slice(0,registryInsert)+registryProbe+runner.slice(registryInsert);`;
src=src.slice(0,start)+replacement+src.slice(end);

// Also make the probe use the actual one-argument routeInfo API surface used everywhere else in the
// runner, selecting the Ancient River edge by destination instead of assuming a two-argument overload.
if(src.includes("invoke('routeInfo','落星矿脉','古河遗迹')"))throw new Error('V3.10 v42 stale two-argument route probe survived');
if(!src.includes("invoke('routeInfo','落星矿脉')"))throw new Error('V3.10 v42 one-argument route probe missing');
if(!src.includes("r.to==='古河遗迹'"))throw new Error('V3.10 v42 Ancient River destination probe missing');

fs.writeFileSync(v41FixedPath,src);
const syntax=spawnSync(process.execPath,['--check',v41FixedPath.pathname],{encoding:'utf8'});
if(syntax.status!==0)throw new Error('V3.10 v42 fixed V41 generator syntax check failed: '+(syntax.stderr||syntax.stdout||'unknown syntax error'));
console.log('V310_FULLRUN_V42_GENERATOR_PASS '+JSON.stringify({v41RiskMappingPreserved:true,probeInjectionByPosition:true,oneArgumentRouteInfoProbe:true,ancientRiverDestinationSelected:true,gameplayStrategyUnchanged:true,generatedGeneratorSyntaxChecked:true,fixedGenerator:v41FixedPath.pathname}));
await import(v41FixedPath.href+'?v42fixed='+Date.now());
