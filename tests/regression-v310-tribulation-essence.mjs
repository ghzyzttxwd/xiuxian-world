import fs from 'fs';
import assert from 'assert';
import {spawnSync} from 'child_process';

function run(file){
 const r=spawnSync(process.execPath,[file],{encoding:'utf8'});
 if(r.status!==0)throw new Error(`${file} failed\n${r.stdout||''}\n${r.stderr||''}`);
 return r.stdout||'';
}

run('tools/build-v310-balance-v4.cjs');
const baseline=fs.readFileSync('src/game-v310.js','utf8');
const before='"ingredients":{"mat-v39-thunder-crystal":1,"mat-v39-life-thread":1,"mat-v38-tribulation-stone":1}';
const after='"ingredients":{"mat-v39-thunder-crystal":1,"mat-v39-life-thread":1,"mat-v38-tribulation-stone":1,"mat-v39-tribulation-essence":1}';
assert.strictEqual(baseline.split(before).length-1,1,'baseline must contain exactly one original 九转渡劫丹 ingredient map');
assert(baseline.includes("if(state.player.battleWins%3===0){v33AddMaterial('mat-v39-tribulation-essence',1);gained=1}"),'baseline 万劫真髓 combat source missing');

run('tools/build-v310-balance-v5.cjs');
const fixed=fs.readFileSync('src/game-v310.js','utf8');
assert.strictEqual(fixed.split(after).length-1,1,'fixed source must contain exactly one 万劫真髓 recipe sink');
assert(!fixed.includes(before),'stale 九转渡劫丹 ingredients survived');
assert.strictEqual(fixed,baseline.replace(before,after),'V5 must change only the intended 九转渡劫丹 ingredient map relative to V4');
assert(fixed.includes("if(state.player.battleWins%3===0){v33AddMaterial('mat-v39-tribulation-essence',1);gained=1}"),'万劫真髓 combat source changed');
assert(fixed.includes('"effect":{"v39Guard":"thunder","v39Value":18}'),'九转渡劫丹 guard value changed');
const report=JSON.parse(fs.readFileSync('BUILD_V310_BALANCE.json','utf8'));
assert.strictEqual(report.status,'PASS');
assert.strictEqual(report.gameplay_version,'3.10.0');
assert.strictEqual(report.build,'31001');
assert.strictEqual(report.save_schema_version,36);
assert.strictEqual(report.content_registry_version,10);
assert(report.changes.some(x=>String(x).includes('万劫真髓 now has a normal endgame sink')),'V5 report must record the resource sink');
console.log('V310_TRIBULATION_ESSENCE_REGRESSION_PASS '+JSON.stringify({singleGameplayDiff:true,recipe:'recipe-v39-thunder-ninefold',essenceCost:1,combatSourcePreserved:true,thunderGuardValue:18}));
