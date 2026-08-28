import fs from 'fs';

const source=fs.readFileSync('src/game-v310.js','utf8');
const stale="if(row?.artifactId&&row.artifactId===state.player.natalArtifactId)m+=marks*.035";
const fixed="if(row?.itemId&&row.itemId===state.player.natalArtifactId)m+=marks*.035";
const staleSuppression="combat?.v38NatalSuppressed>0&&row?.artifactId===state.player.natalArtifactId";
const fixedSuppression="combat?.v38NatalSuppressed>0&&row?.itemId===state.player.natalArtifactId";
if(source.includes(stale)||source.includes(staleSuppression))throw new Error('V3.10 V58 stale natal artifact identity comparison present');
if(!source.includes(fixed)||!source.includes(fixedSuppression))throw new Error('V3.10 V58 corrected natal artifact identity comparison missing');
const report=JSON.parse(fs.readFileSync('BUILD_V310_BALANCE.json','utf8'));
if(report.status!=='PASS'||report.gameplay_version!=='3.10.0'||report.build!==31001||!report.changes?.some(x=>String(x).includes('natal-artifact combat scaling')))throw new Error('V3.10 V58 build report is not bound to natal identity fix');
console.log('V310_FULLRUN_V58_NATAL_ID_FIX_PRESENT '+JSON.stringify({identity:'itemId',originMarkCoefficient:0.035,natalSuppressionPenalty:0.20,gameplayVersion:report.gameplay_version,build:report.build}));
await import(new URL('./fullrun-v310-no-recharge-v57.mjs',import.meta.url).href+'?v58='+Date.now());
