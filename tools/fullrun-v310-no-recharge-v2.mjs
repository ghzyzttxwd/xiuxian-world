import fs from 'fs';

const srcPath=new URL('./fullrun-v310-no-recharge.mjs',import.meta.url);
const outPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);
let src=fs.readFileSync(srcPath,'utf8');

function mustReplace(before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error(`V3.10 full-run strategy transform miss: ${label}`);
 if(src.indexOf(before,first+1)>=0)throw new Error(`V3.10 full-run strategy transform ambiguous: ${label}`);
 src=src.slice(0,first)+after+src.slice(first+before.length);
}

mustReplace(
 "function ensureInsight(n){if(state().player.insight>=n)return;const loc=goAny(['玄阴禁地','上古断界台','法则古原','古河遗迹']);if(!loc)fail('insight-source-unreachable',{target:n});let guard=0;while(state().player.insight<n){if(++guard>MAX_FARM_ACTIONS)fail('insight-farm-deadlock',{target:n,location:loc});act('explore',true)}}",
 "function ensureInsight(n){if(state().player.insight>=n)return;let guard=0;while(state().player.insight<n){if(++guard>Math.max(40,n*8))fail('insight-farm-deadlock',{target:n});const before=state().player.insight;ensureRelic(state().player.relicFragments+3);spendAction('decipher-relic-ui',()=>{const b=dom.window.document.querySelector('[data-relic]');if(!b)fail('relic-decipher-ui-missing',{target:n,relicFragments:state().player.relicFragments});b.click()});if(state().player.insight<=before)fail('relic-decipher-no-insight',{target:n,before,after:state().player.insight})}}",
 'safe insight strategy'
);

mustReplace(
 "function choosePath(){const p=state().player;if(p.daoPath===DAO_PATH)return;if(p.daoPath!=='none'&&p.daoPath!==DAO_PATH)fail('dao-path-mismatch',{current:p.daoPath,wanted:DAO_PATH});if(p.realmIndex<10)return;ensureInsight(2);spendAction('choose-dao-path',()=>invoke('chooseDaoPath',DAO_PATH));if(state().player.daoPath!=='none'&&state().player.daoPath!==DAO_PATH)fail('dao-path-changed-wrong',{current:state().player.daoPath})}",
 "function choosePath(){const p=state().player;if(p.daoPath===DAO_PATH)return;if(p.daoPath!=='none'&&p.daoPath!==DAO_PATH)fail('dao-path-mismatch',{current:p.daoPath,wanted:DAO_PATH});if(p.realmIndex<13)return;ensureInsight(2);spendAction('choose-dao-path',()=>invoke('chooseDaoPath',DAO_PATH));if(state().player.daoPath!=='none'&&state().player.daoPath!==DAO_PATH)fail('dao-path-changed-wrong',{current:state().player.daoPath})}",
 'delay dao choice until safe relic access'
);

mustReplace(
 "function bestManualCandidate(){const s=state(),p=s.player,cat=invoke('v31CatalogSnapshot').manuals||[];const rows=cat.filter(r=>(r.unlock||0)<=p.realmIndex&&(!r.path||r.path==='none'||r.path===DAO_PATH)&&Number(r.mult||0)>0).sort((a,b)=>Number(b.mult||0)-Number(a.mult||0));return rows[0]||null}",
 "function bestManualCandidate(){const p=state().player,cat=invoke('v31CatalogSnapshot').manuals||[],pathReady=p.daoPath===DAO_PATH;const rows=cat.filter(r=>(r.unlock||0)<=p.realmIndex&&(!r.path||r.path==='none'||(pathReady&&r.path===DAO_PATH))&&Number(r.mult||0)>0).sort((a,b)=>Number(b.mult||0)-Number(a.mult||0));return rows[0]||null}",
 'do not learn path manuals before choosing path'
);

mustReplace(
 "function improveSkills(){choosePath();if(state().player.realmIndex<10)return;const spells=Object.values(registry.spells).filter(r=>r.unlock<=state().player.realmIndex&&r.category!=='passive'&&(!r.path||r.path==='none'||r.path===DAO_PATH)&&Number(r.power||0)>0).sort((a,b)=>Number(b.power||0)-Number(a.power||0)).slice(0,4);let slot=0;for(const row of spells){if(row.name in state().player.spells){spendAction(`equip-skill:${row.id}`,()=>invoke('equipV31Skill',slot++,row.id));continue}if(!(row.sources||[]).some(x=>findPath(state().player.location,x)!==null))continue;ensureCost(row.cost||{});if(!goAny(row.sources||[]))continue;const res=spendAction(`learn-skill:${row.id}`,()=>invoke('learnV31Spell',row.id));if(['learned','known'].includes(res))spendAction(`equip-skill:${row.id}`,()=>invoke('equipV31Skill',slot++,row.id));if(slot>=4)break}}",
 "function improveSkills(){choosePath();if(state().player.daoPath!==DAO_PATH)return;if(state().player.realmIndex<10)return;const spells=Object.values(registry.spells).filter(r=>r.unlock<=state().player.realmIndex&&r.category!=='passive'&&(!r.path||r.path==='none'||r.path===DAO_PATH)&&Number(r.power||0)>0).sort((a,b)=>Number(b.power||0)-Number(a.power||0)).slice(0,4);let slot=0;for(const row of spells){if(row.name in state().player.spells){spendAction(`equip-skill:${row.id}`,()=>invoke('equipV31Skill',slot++,row.id));continue}if(!(row.sources||[]).some(x=>findPath(state().player.location,x)!==null))continue;ensureCost(row.cost||{});if(!goAny(row.sources||[]))continue;const res=spendAction(`learn-skill:${row.id}`,()=>invoke('learnV31Spell',row.id));if(['learned','known'].includes(res))spendAction(`equip-skill:${row.id}`,()=>invoke('equipV31Skill',slot++,row.id));if(slot>=4)break}}",
 'do not learn path skills before choosing path'
);

mustReplace(
 "function cultivateFull(){improveManual();const r=realmRow(),p=state().player;if(p.progress>=r.need)return;let guard=0;while(state().player.progress<realmRow().need){if(++guard>MAX_ACTIONS)fail('cultivation-loop',{realm:realmRow().name});heal();spendAction('cultivate',()=>invoke('action','cultivate'));if(guard%180===0){improveManual();checkpoint('cultivation')}}}",
 "function ensureDwelling(){const p=state().player;if((p.dwellingTier||0)>=1)return true;if(!goTo('青石镇'))fail('dwelling-location-unreachable',{});ensureStones(15);spendAction('build-dwelling-ui',()=>{const b=dom.window.document.querySelector('[data-dwelling=\"upgrade\"]');if(!b)fail('dwelling-ui-missing',{});b.click()});if((state().player.dwellingTier||0)<1)fail('dwelling-build-no-progress',{});return true}\nfunction cultivateFull(){improveManual();const r=realmRow();if(state().player.progress>=r.need)return;ensureDwelling();if(!goTo(state().player.dwellingLocation||'青石镇'))fail('cultivation-home-unreachable',{});let guard=0;while(state().player.progress<realmRow().need){if(++guard>Math.ceil(MAX_ACTIONS/4))fail('cultivation-loop',{realm:realmRow().name});heal();spendAction('retreat-seven-days',()=>invoke('retreatSevenDays'));if(guard%40===0){improveManual();if(state().player.location!==state().player.dwellingLocation)goTo(state().player.dwellingLocation);checkpoint('cultivation')}}}",
 'normal dwelling retreat strategy'
);

if(src.includes("goAny(['玄阴禁地','上古断界台','法则古原','古河遗迹'])"))throw new Error('unsafe early insight strategy survived');
if(!src.includes("pathReady=p.daoPath===DAO_PATH"))throw new Error('pre-path manual guard missing');
if(!src.includes("if(state().player.daoPath!==DAO_PATH)return"))throw new Error('pre-path skill guard missing');
if(!src.includes("spendAction('decipher-relic-ui'"))throw new Error('normal relic decipher strategy missing');
if(!src.includes("spendAction('retreat-seven-days'"))throw new Error('normal seven-day retreat strategy missing');
fs.writeFileSync(outPath,src);
await import(outPath.href+'?seed='+Date.now());
