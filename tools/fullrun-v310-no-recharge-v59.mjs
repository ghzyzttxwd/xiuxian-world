import fs from 'fs';

const source=fs.readFileSync('src/game-v310.js','utf8');
const essenceCost='"ingredients":{"mat-v39-thunder-crystal":1,"mat-v39-life-thread":1,"mat-v38-tribulation-stone":1,"mat-v39-tribulation-essence":1}';
if(!source.includes(essenceCost))throw new Error('V3.10 V59 万劫真髓 endgame sink missing');
if(!source.includes("if(state.player.battleWins%3===0){v33AddMaterial('mat-v39-tribulation-essence',1);gained=1}"))throw new Error('V3.10 V59 万劫真髓 normal combat source missing');
const report=JSON.parse(fs.readFileSync('BUILD_V310_BALANCE.json','utf8'));
if(report.status!=='PASS'||report.gameplay_version!=='3.10.0'||report.build!=='31001'||!report.changes?.some(x=>String(x).includes('万劫真髓 now has a normal endgame sink')))throw new Error('V3.10 V59 build report is not bound to tribulation essence sink');
console.log('V310_FULLRUN_V59_RESOURCE_SINK_PRESENT '+JSON.stringify({recipe:'recipe-v39-thunder-ninefold',essenceCost:1,combatSourcePreserved:true,build:report.build}));
await import(new URL('./fullrun-v310-no-recharge-v58.mjs',import.meta.url).href+'?v59='+Date.now());
