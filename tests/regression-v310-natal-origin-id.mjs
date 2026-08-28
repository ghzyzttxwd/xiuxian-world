import fs from 'fs';
import assert from 'assert';
import {spawnSync} from 'child_process';

function run(file){
 const r=spawnSync(process.execPath,[file],{encoding:'utf8'});
 if(r.status!==0)throw new Error(`${file} failed\n${r.stdout||''}\n${r.stderr||''}`);
 return r.stdout||'';
}

run('tools/build-v310-balance-v3.cjs');
const baseline=fs.readFileSync('src/game-v310.js','utf8');
const before="function v38ArtifactMultiplier(row){ensureV38MahayanaShape();let m=1;const marks=state.player.v38NatalOriginMarks||0;if(row?.artifactId&&row.artifactId===state.player.natalArtifactId)m+=marks*.035;if(v38WorldEdictActive())m+=.10;if(combat?.v38NatalSuppressed>0&&row?.artifactId===state.player.natalArtifactId)m-=.20;return Math.max(.65,m)}";
const after="function v38ArtifactMultiplier(row){ensureV38MahayanaShape();let m=1;const marks=state.player.v38NatalOriginMarks||0;if(row?.itemId&&row.itemId===state.player.natalArtifactId)m+=marks*.035;if(v38WorldEdictActive())m+=.10;if(combat?.v38NatalSuppressed>0&&row?.itemId===state.player.natalArtifactId)m-=.20;return Math.max(.65,m)}";
assert.equal(baseline.split(before).length-1,1,'baseline must contain exactly one mismatched V38 natal identity comparison');

run('tools/build-v310-balance-v4.cjs');
const fixed=fs.readFileSync('src/game-v310.js','utf8');
assert.equal(fixed.split(after).length-1,1,'fixed source must contain exactly one corrected V38 natal identity comparison');
assert(!fixed.includes(before),'stale artifactId/natalArtifactId comparison survived');
assert.equal(fixed,baseline.replace(before,after),'V4 must change only the intended V38 natal identity expression relative to V3');
const report=JSON.parse(fs.readFileSync('BUILD_V310_BALANCE.json','utf8'));
assert.equal(report.status,'PASS');
assert.equal(report.gameplay_version,'3.10.0');
assert.equal(report.build,31001);
assert.equal(report.save_schema_version,36);
assert.equal(report.content_registry_version,10);
assert(report.changes.some(x=>String(x).includes('natal-artifact combat scaling')),'V4 report must record the identity fix');
console.log('V310_NATAL_ORIGIN_ID_REGRESSION_PASS '+JSON.stringify({singleGameplayDiff:true,identity:'itemId',originMarkCoefficient:0.035,natalSuppressionPenalty:0.20}));
