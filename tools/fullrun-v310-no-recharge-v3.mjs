import fs from 'fs';

const srcPath=new URL('./fullrun-v310-no-recharge-v2.mjs',import.meta.url);
const outPath=new URL('./.generated-fullrun-v310-no-recharge-v3.mjs',import.meta.url);
let src=fs.readFileSync(srcPath,'utf8');

function mustReplace(before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error(`V3.10 full-run v3 transform miss: ${label}`);
 if(src.indexOf(before,first+1)>=0)throw new Error(`V3.10 full-run v3 transform ambiguous: ${label}`);
 src=src.slice(0,first)+after+src.slice(first+before.length);
}

const insightBefore="function ensureInsight(n){if(state().player.insight>=n)return;let guard=0;while(state().player.insight<n){if(++guard>Math.max(40,n*8))fail('insight-farm-deadlock',{target:n});const before=state().player.insight;ensureRelic(state().player.relicFragments+3);spendAction('decipher-relic-ui',()=>{const b=dom.window.document.querySelector('[data-relic]');if(!b)fail('relic-decipher-ui-missing',{target:n,relicFragments:state().player.relicFragments});b.click()});if(state().player.insight<=before)fail('relic-decipher-no-insight',{target:n,before,after:state().player.insight})}}";
const insightAfter="function ensureInsight(n){if(state().player.insight>=n)return;let guard=0;while(state().player.insight<n){if(++guard>MAX_FARM_ACTIONS)fail('insight-farm-deadlock',{target:n,current:state().player.insight,location:state().player.location});if(DAO_PATH==='sword'&&state().player.sect==='青云宗'&&state().player.realmIndex>=3&&(state().player.sectMentorBond||0)<6){const bond=state().player.sectMentorBond||0;ensureSwordMentorBond(bond<3?3:6);if(state().player.insight>=n)continue}const sr=state().world.secretRealm,safe=['青云山','临江城','云梦泽','赤霞谷','落星矿脉','黑风岭'];if(!sr||sr.cleared||!safe.includes(sr.location)){if(DAO_PATH==='sword'&&state().player.sect==='青云宗')sectRoutine(invoke('sectRankIndex')>=1?'escort':'patrol');else act('rest',false);continue}if(!goTo(sr.location)){act('rest',false);continue}const before=state().player.insight;let rr=state().world.secretRealm;if(rr&&rr.stage===0){spendAction('secret-enter',()=>{const b=dom.window.document.querySelector('[data-secret]');if(!b)fail('secret-entry-ui-missing',{realm:rr});b.click()});spendAction('secret-prepare-careful',()=>{const b=dom.window.document.querySelector('[data-choice]');if(!b)fail('secret-prepare-choice-missing',{realm:state().world.secretRealm});b.click()})}rr=state().world.secretRealm;if(rr&&rr.stage===1){spendAction('secret-guardian',()=>{const b=dom.window.document.querySelector('[data-secret]');if(!b)fail('secret-guardian-ui-missing',{realm:rr});b.click()});resolveCombat(true)}rr=state().world.secretRealm;if(rr&&rr.stage===2){spendAction('secret-core-open',()=>{const b=dom.window.document.querySelector('[data-secret]');if(!b)fail('secret-core-ui-missing',{realm:rr});b.click()});spendAction('secret-core-claim',()=>{const b=dom.window.document.querySelector('[data-choice]');if(!b)fail('secret-core-choice-missing',{realm:state().world.secretRealm});b.click()})}if(state().player.insight>before)console.log('V310_FULLRUN_INSIGHT',JSON.stringify({source:'secret-realm',insight:state().player.insight,target:n,location:state().player.location,actions}))}}";
mustReplace(insightBefore,insightAfter,'normal early insight sources');

mustReplace(
 "while((state().player.insight||0)<2)ensureSwordMentorBond((state().player.sectMentorBond||0)+1);",
 "ensureInsight(2);",
 'sword dao insight after mentor milestones'
);

mustReplace(
 `if(!src.includes("spendAction('decipher-relic-ui'"))throw new Error('normal relic decipher strategy missing');`,
 `if(!src.includes("source:'secret-realm'"))throw new Error('normal secret-realm insight strategy missing');`,
 'retire obsolete relic decipher self-check'
);

const before="const rows=cat.filter(r=>(r.unlock||0)<=p.realmIndex&&(!r.path||r.path==='none'||(pathReady&&r.path===DAO_PATH))&&Number(r.mult||0)>0).sort((a,b)=>Number(b.mult||0)-Number(a.mult||0));return rows[0]||null";
const after="const safePreDaoSources=new Set(['青石村','青石镇','临江城','青云山','云梦泽']);const rows=cat.filter(r=>{if((r.unlock||0)>p.realmIndex||Number(r.mult||0)<=0)return false;if(r.path&&r.path!=='none'&&!(pathReady&&r.path===DAO_PATH))return false;if(!pathReady){const meta=registry.manuals[r.id]||r,cost=meta.cost||{};if((cost.insight||0)>0||(cost.relic||0)>0||(cost.rare||0)>0||(cost.materials||0)>0||(cost.core||0)>0||(cost.nascent||0)>0||(cost.deification||0)>0)return false;if(cost.named&&Object.keys(cost.named).length)return false;if(!(meta.sources||r.sources||[]).some(x=>safePreDaoSources.has(x)))return false}return true}).sort((a,b)=>Number(b.mult||0)-Number(a.mult||0));return rows[0]||null";
mustReplace(before,after,'safe pre-dao manual candidates');

// v3 reads the v2 transformer, not the generated runner. Inject runner-level changes
// into v2 immediately before it writes its generated output.
const rareBefore="function ensureRare(n){if(state().player.rareMaterials>=n)return;const loc=goAny(['古河遗迹','玄阴禁地','万兽山脉','赤霞谷']);if(!loc)fail('rare-source-unreachable',{target:n});let guard=0;while(state().player.rareMaterials<n){if(++guard>MAX_FARM_ACTIONS)fail('rare-farm-deadlock',{target:n,location:loc});act('explore',true)}}";
const rareAfter="function ensureRare(n){if(state().player.rareMaterials>=n)return;if(DAO_PATH==='sword'&&state().player.sect==='青云宗'&&invoke('sectRankIndex')>=2){let guard=0;while(state().player.rareMaterials<n){if(++guard>Math.max(40,n*4))fail('sect-rare-exchange-deadlock',{target:n,rare:state().player.rareMaterials,career:invoke('sectCareerInfo')});while((invoke('sectCareerInfo').contribution||0)<36)sectRoutine('escort');if(!goTo('青云山'))fail('sect-rare-exchange-home-unreachable',{target:n});const before=state().player.rareMaterials;spendAction('sect-exchange-rare-ui',()=>{const b=dom.window.document.querySelector('[data-sect-exchange=\"rare\"]');if(!b)fail('sect-rare-exchange-ui-missing',{target:n,career:invoke('sectCareerInfo')});b.click()});if(state().player.rareMaterials<=before)fail('sect-rare-exchange-no-progress',{target:n,before,after:state().player.rareMaterials,career:invoke('sectCareerInfo')})}return}const loc=goAny(['赤霞谷','古河遗迹','万兽山脉','玄阴禁地']);if(!loc)fail('rare-source-unreachable',{target:n});let guard=0;while(state().player.rareMaterials<n){if(++guard>MAX_FARM_ACTIONS)fail('rare-farm-deadlock',{target:n,location:loc});act('explore',true)}}";
const coreStockBefore="ensureHerbs(state().player.herbs+4);ensureBeast(state().player.beastMaterials+2);ensureStones(state().player.spiritStones+6);";
const coreStockAfter="ensureHerbs(4);ensureBeast(2);ensureStones(6);";
const nascentStockBefore="ensureCore(state().player.coreEssence+1);ensureRelic(state().player.relicFragments+2);ensureHerbs(state().player.herbs+6);ensureStones(state().player.spiritStones+12);";
const nascentStockAfter="ensureCore(1);ensureRelic(2);ensureHerbs(6);ensureStones(12);";
const deificationStockBefore="ensureNascent(state().player.nascentEssence+1);ensureRelic(state().player.relicFragments+3);ensureBeast(state().player.beastMaterials+4);ensureHerbs(state().player.herbs+8);ensureStones(state().player.spiritStones+25);";
const deificationStockAfter="ensureNascent(1);ensureRelic(3);ensureBeast(4);ensureHerbs(8);ensureStones(25);";
const writeAnchor="fs.writeFileSync(outPath,src);";
const nestedPatch=`mustReplace(\n ${JSON.stringify(rareBefore)},\n ${JSON.stringify(rareAfter)},\n 'prefer Qingyun rare-material exchange for sword path'\n);\nmustReplace(${JSON.stringify(coreStockBefore)},${JSON.stringify(coreStockAfter)},'consume stocked core materials');\nmustReplace(${JSON.stringify(nascentStockBefore)},${JSON.stringify(nascentStockAfter)},'consume stocked nascent materials');\nmustReplace(${JSON.stringify(deificationStockBefore)},${JSON.stringify(deificationStockAfter)},'consume stocked deification materials');\nmustReplace(\n "dom.window.Math.random=seededRandom(SEED);",\n "dom.window.Date.now=()=>SEED;dom.window.Math.random=seededRandom(SEED);",\n 'deterministic fresh-save clock'\n);\nif(!src.includes("spendAction('sect-exchange-rare-ui'"))throw new Error('Qingyun rare-material exchange strategy missing');\nif(src.includes('ensureRelic(state().player.relicFragments+2)'))throw new Error('nascent stock-preservation bug survived');\nfs.writeFileSync(outPath,src);`;
mustReplace(writeAnchor,nestedPatch,'inject runner-level inventory, deterministic clock and Qingyun rare strategy');

if(!src.includes("source:'secret-realm'"))throw new Error('safe secret-realm insight strategy missing');
if(!src.includes("consume stocked nascent materials"))throw new Error('stock-consumption nested transform missing');
if(!src.includes("prefer Qingyun rare-material exchange for sword path"))throw new Error('Qingyun rare-material nested transform missing');
if(!src.includes('safePreDaoSources'))throw new Error('safe pre-dao manual filter missing');
if(!src.includes('deterministic fresh-save clock'))throw new Error('deterministic clock transform missing');
fs.writeFileSync(outPath,src);
await import(outPath.href+'?seed='+Date.now());
