import fs from 'fs';
import {JSDOM} from 'jsdom';
const html=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=["'][^"']*app\.js[^"']*["'][^>]*><\/script>/i,'');
const source=fs.readFileSync('src/game-v39.js','utf8');
if(!source.includes("const VERSION='3.9.0'"))throw new Error('unexpected runtime');
const d=new JSDOM(html,{url:'http://balance.test/',runScripts:'outside-only',pretendToBeVisual:true});
d.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});d.window.scrollTo=()=>{};d.window.console=console;d.window.eval(source);
const api=d.window.__TAIXUAN_TEST__;
if(!api)throw new Error('missing test API');
api.newGame('V310审计');
const keys=Object.keys(api).sort();
const state=api.getState();
const out={
  version:state.version,
  schema:state.saveSchemaVersion,
  apiKeys:keys,
  initial:{realmIndex:state.player.realmIndex,realm:api.realmBalance?.()[0]?.name||'凡人',rootIndex:state.player.rootIndex,lifespan:state.player.lifespan,stones:state.player.spiritStones,herbs:state.player.herbs},
  realmBalance:typeof api.realmBalance==='function'?api.realmBalance():null,
  catalogs:typeof api.v39CatalogSnapshot==='function'?api.v39CatalogSnapshot():null,
  contentCounts:typeof api.contentRegistrySnapshot==='function'?api.contentRegistrySnapshot().counts:null
};
fs.writeFileSync('/tmp/V310_AUDIT.json',JSON.stringify(out,null,2)+'\n');
console.log('V310_AUDIT_PASS '+JSON.stringify({version:out.version,schema:out.schema,apiCount:keys.length,initial:out.initial,catalogs:out.catalogs}));
console.log('V310_API_KEYS '+keys.join(','));
if(out.realmBalance)console.log('V310_REALM_BALANCE '+JSON.stringify(out.realmBalance));
for(const name of ['action','travel','attemptBreakthrough','gatherV33Material','v35Trade','chooseDaoPath','craftCoreEssence','craftNascentEssence','craftDeificationEssence','v36ContemplateSpace','v36CraftVoidEssence','v36AttemptRefiningBreakthrough','v37ChooseLaw','v37ContemplateLaw','v37IntegrateUnity','v37CraftUnityEssence','v37AttemptUnityBreakthrough','v38ContemplateOrigin','v38ExerciseWorldAuthority','v38CraftMahayanaEssence','v38TemperNatalOrigin','v38PrepareTribulation','v38AttemptMahayanaBreakthrough','v39BuildTribulationFormation','v39ArmTribulationPill','v39BeginTribulation','v39ResolveThunder','v39ResolveHeartDemon','v39ResolveTransformation','v39AscendToTrueImmortal']){
  if(typeof api[name]==='function')console.log('V310_FN '+name+' '+String(api[name]).replace(/\s+/g,' '));
}
