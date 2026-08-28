const fs=require('fs');
const crypto=require('crypto');

// Layer one narrowly scoped gameplay bug fix over the current deterministic V3.10 candidate.
// player.natalArtifactId stores a V32 itemId (for example item-v32-sevenstar-swordcase), while
// v38ArtifactMultiplier compared that value against row.artifactId (artifact-v32-...). The
// comparison therefore never matched, so V38 natal-origin marks could not apply their intended
// combat multiplier or natal-suppression penalty to the actual natal artifact.
require('./build-v310-balance-v3.cjs');

const OUTPUT='src/game-v310.js',REPORT='BUILD_V310_BALANCE.json';
let src=fs.readFileSync(OUTPUT,'utf8');
const before="function v38ArtifactMultiplier(row){ensureV38MahayanaShape();let m=1;const marks=state.player.v38NatalOriginMarks||0;if(row?.artifactId&&row.artifactId===state.player.natalArtifactId)m+=marks*.035;if(v38WorldEdictActive())m+=.10;if(combat?.v38NatalSuppressed>0&&row?.artifactId===state.player.natalArtifactId)m-=.20;return Math.max(.65,m)}";
const after="function v38ArtifactMultiplier(row){ensureV38MahayanaShape();let m=1;const marks=state.player.v38NatalOriginMarks||0;if(row?.itemId&&row.itemId===state.player.natalArtifactId)m+=marks*.035;if(v38WorldEdictActive())m+=.10;if(combat?.v38NatalSuppressed>0&&row?.itemId===state.player.natalArtifactId)m-=.20;return Math.max(.65,m)}";
const first=src.indexOf(before);
if(first<0)throw new Error('V3.10 V38 natal artifact identity anchor missing');
if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 V38 natal artifact identity anchor ambiguous');
src=src.slice(0,first)+after+src.slice(first+before.length);
if(src.includes(before))throw new Error('V3.10 stale artifactId/natalArtifactId comparison survived');
if(!src.includes(after))throw new Error('V3.10 corrected itemId/natalArtifactId comparison missing');

fs.writeFileSync(OUTPUT,src);
const sha=crypto.createHash('sha256').update(Buffer.from(src)).digest('hex');
const report=JSON.parse(fs.readFileSync(REPORT,'utf8'));
report.source_sha256=sha;
report.source_bytes=Buffer.byteLength(src);
report.changes=[...(report.changes||[]),
 'V38 natal-artifact combat scaling now compares the catalog row itemId with player.natalArtifactId, matching the save/runtime identity used by equipmentInventory and makeNatalV32Artifact; origin-mark bonus and natal-suppression penalty can therefore target the actual natal artifact'
];
report.invariants=(report.invariants||[]);
report.invariants.push('No V38 origin-mark values, combat coefficients, enemy stats, realm gates, resource costs, drop rates, tribulation probabilities, RNG seeds or action caps changed; only the mismatched artifact identity key was corrected');
fs.writeFileSync(REPORT,JSON.stringify(report,null,2)+'\n');
console.log('V310_BUILD_V4_PASS '+JSON.stringify({source_sha256:sha,natalArtifactIdentity:'itemId',originMarkCoefficientPreserved:0.035,natalSuppressionPenaltyPreserved:0.20,gameplayCoefficientsUnchanged:true,directSource:true}));
