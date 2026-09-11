const fs=require('fs');
const path=require('path');

const ROOT=path.resolve(__dirname,'..');
const gamePath=path.join(ROOT,'src/game-v39.js');
const realmPath=path.join(ROOT,'src/data/realms.js');
const appPath=path.join(ROOT,'app.js');
const swPath=path.join(ROOT,'sw.js');
const testPath=path.join(ROOT,'tests/regression-v39.mjs');

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s)};
const once=(source,needle,replacement,label)=>{
  const count=source.split(needle).length-1;
  if(count!==1)throw new Error(`${label}: expected exactly one match, got ${count}`);
  return source.replace(needle,replacement);
};

let game=read(gamePath);
if(game.includes("const REALMS=window.__TAIXUAN_DATA__.REALMS;"))throw new Error('REALMS already extracted');

const markerStart='const REALMS=[';
const markerEnd='];\nconst V23_REALM_NEEDS=';
const start=game.indexOf(markerStart);
const end=game.indexOf(markerEnd,start);
if(start<0||end<0)throw new Error('Could not locate REALMS block');
const arrayLiteral=game.slice(start+'const REALMS='.length,end+2);

// Guard the extracted data before touching the core.
const value=Function(`"use strict";return (${arrayLiteral})`)();
if(!Array.isArray(value)||value.length!==40)throw new Error(`REALMS count mismatch: ${value&&value.length}`);
if(value[0]?.name!=='凡人'||value[value.length-1]?.name!=='真仙')throw new Error('REALMS boundary values mismatch');

const realmFile=`// 太玄界 V4.0 数据模块：境界表\n// 从 V3.9.0 src/game-v39.js 等价迁移；禁止在重构提交中顺手改数值。\n(()=>{\n  'use strict';\n  const root=window.__TAIXUAN_DATA__||(window.__TAIXUAN_DATA__={});\n  root.REALMS=${arrayLiteral};\n})();\n`;
write(realmPath,realmFile);

game=game.slice(0,start)+"const REALMS=window.__TAIXUAN_DATA__.REALMS;\n"+game.slice(end+3);
write(gamePath,game);

let app=read(appPath);
const coreNeedle="const script=document.createElement('script');script.src='./src/game-v39.js?v=3903';";
const preload="const realmDataScript=document.createElement('script');realmDataScript.src='./src/data/realms.js?v=4001';realmDataScript.async=false;document.head.appendChild(realmDataScript);\n    ";
app=once(app,coreNeedle,preload+coreNeedle,'app REALMS preload insertion');
write(appPath,app);

let sw=read(swPath);
sw=once(sw,"'./src/game-v39.js?v=3903'","'./src/data/realms.js?v=4001','./src/game-v39.js?v=3903'",'service worker REALMS cache insertion');
sw=once(sw,"const CACHE='taixuan-v3.9.0-final-ui-shop-v2-m6-2-jade-sinks';","const CACHE='taixuan-v4.0-refactor-r1-realms';",'service worker cache version');
write(swPath,sw);

let test=read(testPath);
test=once(test,
  "const INDEX_PATH=process.env.INDEX_PATH||'index.html',GAME_PATH=process.env.GAME_PATH||'src/game-v39.js',SAVE_KEY='xiuxian_world_v02';",
  "const INDEX_PATH=process.env.INDEX_PATH||'index.html',GAME_PATH=process.env.GAME_PATH||'src/game-v39.js',REALMS_PATH=process.env.REALMS_PATH||'src/data/realms.js',SAVE_KEY='xiuxian_world_v02';",
  'regression REALMS path');
test=once(test,
  "const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8'),source=fs.readFileSync(GAME_PATH,'utf8');",
  "const htmlRaw=fs.readFileSync(INDEX_PATH,'utf8'),realmSource=fs.readFileSync(REALMS_PATH,'utf8'),source=fs.readFileSync(GAME_PATH,'utf8');",
  'regression REALMS source');
test=once(test,
  "d.window.eval(source);return d}",
  "d.window.eval(realmSource);d.window.eval(source);return d}",
  'regression REALMS preload');
write(testPath,test);

console.log(JSON.stringify({ok:true,realmCount:value.length,first:value[0].name,last:value[value.length-1].name,gameBytesBefore:Buffer.byteLength(read(gamePath))+Buffer.byteLength(realmFile),gameBytesAfter:Buffer.byteLength(read(gamePath)),realmFileBytes:Buffer.byteLength(realmFile)},null,2));
