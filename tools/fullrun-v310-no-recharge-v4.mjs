import fs from 'fs';

const v3Path=new URL('./fullrun-v310-no-recharge-v3.mjs',import.meta.url);
const v3StagePath=new URL('./.generated-fullrun-v310-no-recharge-v4-v3stage.mjs',import.meta.url);
const generatedV3Path=new URL('./.generated-fullrun-v310-no-recharge-v3.mjs',import.meta.url);
const transformerStagePath=new URL('./.generated-fullrun-v310-no-recharge-v4-transformer.mjs',import.meta.url);
const finalRunnerPath=new URL('./.generated-fullrun-v310-no-recharge-v2.mjs',import.meta.url);

function replaceOnce(src,before,after,label){
 const first=src.indexOf(before);
 if(first<0)throw new Error('V3.10 v4 final-runner transform miss: '+label);
 if(src.indexOf(before,first+1)>=0)throw new Error('V3.10 v4 final-runner transform ambiguous: '+label);
 return src.slice(0,first)+after+src.slice(first+before.length);
}

// Emit each generated layer without auto-running it, then patch the exact executable runner.
let v3=fs.readFileSync(v3Path,'utf8');
const autoImport="fs.writeFileSync(outPath,src);\nawait import(outPath.href+'?seed='+Date.now());";
v3=replaceOnce(v3,autoImport,"fs.writeFileSync(outPath,src);",'suppress v3 auto-import');
fs.writeFileSync(v3StagePath,v3);
await import(v3StagePath.href+'?stage1='+Date.now());
if(!fs.existsSync(generatedV3Path))throw new Error('V3.10 v4 did not obtain generated v3 transformer');

let transformer=fs.readFileSync(generatedV3Path,'utf8');
transformer=replaceOnce(transformer,autoImport,"fs.writeFileSync(outPath,src);",'suppress generated transformer auto-import');
fs.writeFileSync(transformerStagePath,transformer);
await import(transformerStagePath.href+'?stage2='+Date.now());
if(!fs.existsSync(finalRunnerPath))throw new Error('V3.10 v4 did not obtain final generated v2 runner');

let runner=fs.readFileSync(finalRunnerPath,'utf8');

const ensureNamedBefore="function ensureNamed(id,n){if(materialCount(id)>=n)return;";
const ensureNamedAfter="function ensureNamed(id,n){if(materialCount(id)>=n)return;if(id==='mat-v37-unity-seed'){ensureUnitySeeds(n);return}";
runner=replaceOnce(runner,ensureNamedBefore,ensureNamedAfter,'route all unity-seed requests through integration');

const auctionIdsBefore="const AUCTION_MATERIAL_IDS=new Set(['mat-v36-space-crystal','mat-v36-void-sand','mat-v36-void-essence','mat-v37-law-crystal','mat-v37-domain-sand','mat-v38-origin-crystal','mat-v38-natal-source-crystal']);";
const auctionIdsAfter="const AUCTION_MATERIAL_IDS=new Set(['mat-v36-space-crystal','mat-v36-void-sand','mat-v36-void-essence','mat-v37-law-crystal','mat-v37-soul-covenant-stone','mat-v37-domain-sand','mat-v38-origin-crystal','mat-v38-natal-source-crystal']);";
runner=replaceOnce(runner,auctionIdsBefore,auctionIdsAfter,'allow normal soul-covenant auction strategy');

const unityHelperAnchor="function ensureUnityEssence(n){";
const unityHelper="function ensureSwordEscapeSkill(){if(DAO_PATH!=='sword'||state().player.realmIndex<26)return;const id='spell-v36-sword-space-step',row=registry.spells[id];if(!row)fail('sword-escape-skill-registry-missing',{id});if(!(row.name in state().player.spells)){ensureCost(row.cost||{});if(!goTo('天渊城'))fail('sword-escape-skill-source-unreachable',{id});const r=spendAction('learn-sword-escape-skill',()=>invoke('learnV31Spell',id));if(!['learned','known'].includes(r))fail('sword-escape-skill-learn-blocked',{id,result:r,cost:row.cost||{}})}if((state().player.activeSkillIds||[])[4]!==id){spendAction('equip-sword-escape-skill',()=>invoke('equipV31Skill',4,id));if((state().player.activeSkillIds||[])[4]!==id)fail('sword-escape-skill-equip-blocked',{id,active:state().player.activeSkillIds})}}\nfunction ensureUnitySeeds(n){let guard=0;while(materialCount('mat-v37-unity-seed')<n){if(++guard>24)fail('unity-seed-integration-deadlock',{target:n,current:materialCount('mat-v37-unity-seed'),lawProficiency:state().player.v37LawProficiency,unity:state().player.v37Unity});ensureSwordEscapeSkill();ensureLaw(35);const missing=Math.max(1,n-materialCount('mat-v37-unity-seed')),essenceReserve=Math.max(1,Math.ceil(n/2)),integrationBudget=Math.max(12,Math.ceil(missing/.45)+10),lawTarget=integrationBudget+essenceReserve*2,soulTarget=integrationBudget+essenceReserve;tryAuctionMaterial('mat-v37-law-crystal',lawTarget,120);ensureNamed('mat-v37-law-crystal',lawTarget);tryAuctionMaterial('mat-v37-soul-covenant-stone',soulTarget,240);ensureNamed('mat-v37-soul-covenant-stone',soulTarget);ensureVoidEssence(Math.max(1,essenceReserve));if(!goTo('归一圣墟'))fail('unity-seed-integration-location-unreachable',{target:n});let attempts=0;while(materialCount('mat-v37-unity-seed')<n&&attempts<integrationBudget){attempts++;const before=materialCount('mat-v37-unity-seed');const r=spendAction('integrate-unity-for-seed',()=>invoke('v37IntegrateUnity'));heal();if(!r?.ok)fail('unity-seed-integration-blocked',{target:n,result:r});const after=materialCount('mat-v37-unity-seed');if(after>before)console.log('V310_FULLRUN_MATERIAL',JSON.stringify({source:'unity-integration',id:'mat-v37-unity-seed',name:'合体道胎',count:after,target:n,actions}))}}}\nfunction ensureUnityEssence(n){";
runner=replaceOnce(runner,unityHelperAnchor,unityHelper,'add batched unity-seed integration and sword escape preparation');
runner=replaceOnce(runner,"ensureNamed('mat-v37-unity-seed',2);","ensureUnitySeeds(Math.max(2,(n-materialCount('mat-v37-unity-essence'))*2));",'batch unity seeds for all remaining unity essences');
runner=replaceOnce(runner,"ensureVoidEssence(materialCount('mat-v36-void-essence')+1);","ensureVoidEssence(1);",'consume stocked void essence instead of preserving inventory');
runner=replaceOnce(runner,"ensureUnityEssence(materialCount('mat-v37-unity-essence')+1);","ensureUnityEssence(1);",'consume stocked unity essence in Mahayana crafting');

const lawChoiceBefore="function ensureLawChosen(){if(state().player.v37LawId)return;if(state().player.realmIndex<29)return;ensureInsight(state().player.insight+10);ensureNamed('mat-v37-law-crystal',2);ensureNamed('mat-v37-rule-dust',1);if(!goAny(['法则古原','万象法坛']))fail('law-choice-location-unreachable',{});const r=spendAction('choose-law',()=>invoke('v37ChooseLaw',lawByPath[DAO_PATH]));if(!r?.ok)fail('law-choice-blocked',{result:r})}";
const lawChoiceAfter="function ensureLawChosen(){if(state().player.v37LawId)return;if(state().player.realmIndex<29)return;ensureInsight(state().player.insight+10);ensureSwordEscapeSkill();tryAuctionMaterial('mat-v37-law-crystal',2,24);ensureNamed('mat-v37-law-crystal',2);ensureNamed('mat-v37-rule-dust',1);if(!goAny(['法则古原','万象法坛']))fail('law-choice-location-unreachable',{});const r=spendAction('choose-law',()=>invoke('v37ChooseLaw',lawByPath[DAO_PATH]));if(!r?.ok)fail('law-choice-blocked',{result:r})}";
runner=replaceOnce(runner,lawChoiceBefore,lawChoiceAfter,'prepare normal escape build and auction law crystals before first law choice');

const fleeBefore="if(!preferWin||enemyRealm>s.player.realmIndex||hpRatio<.28){spendAction('combat-flee',()=>invoke('combatAction','flee'));continue}";
const fleeAfter="if(!preferWin||enemyRealm>s.player.realmIndex||hpRatio<.28){if(DAO_PATH==='sword'&&enemyRealm>s.player.realmIndex&&hpRatio>=.4&&(s.player.activeSkillIds||[]).includes('spell-v36-sword-space-step')){const cc=combat(),row=registry.spells['spell-v36-sword-space-step'],cd=Number(cc?.cooldowns?.['spell-v36-sword-space-step']||0);if(cc&&cd<=0&&!(cc.v36SpaceShift>0)&&cc.playerQi>=Number(row?.qi||0)){spendAction('combat-escape-shift',()=>invoke('combatAction','skill:spell-v36-sword-space-step'));continue}}spendAction('combat-flee',()=>invoke('combatAction','flee'));continue}";
runner=replaceOnce(runner,fleeBefore,fleeAfter,'use normal sword space shift before cross-realm escape');

// Realm 37 must cultivate its full 大乘圆满 bar before tribulation readiness can pass.
runner=replaceOnce(runner,"if(state().player.realmIndex===37){finishTribulation();break}","if(state().player.realmIndex===37){cultivateFull();heal();finishTribulation();break}",'cultivate Mahayana perfection before tribulation');

// Hard proof against transformer-layer false positives: inspect the exact executable.
if(!runner.includes("function ensureUnitySeeds(n)"))throw new Error('final runner missing unity-seed integration helper');
if(!runner.includes("if(id==='mat-v37-unity-seed'){ensureUnitySeeds(n);return}"))throw new Error('final runner missing unity-seed global routing guard');
if(runner.includes("ensureNamed('mat-v37-unity-seed',2);"))throw new Error('final runner still contains dangerous unity-seed exploration call');
if(!runner.includes("source:'unity-integration'"))throw new Error('final runner missing unity-integration evidence log');
if(!runner.includes("'mat-v37-law-crystal','mat-v37-soul-covenant-stone','mat-v37-domain-sand'"))throw new Error('final runner does not allow soul-covenant auction acquisition');
if(!runner.includes("tryAuctionMaterial('mat-v37-law-crystal',lawTarget,120)"))throw new Error('final runner missing normal auction preference for bulk law crystals');
if(!runner.includes("tryAuctionMaterial('mat-v37-soul-covenant-stone',soulTarget,240)"))throw new Error('final runner missing normal auction preference for soul-covenant stones');
if(!runner.includes("ensureSwordEscapeSkill();tryAuctionMaterial('mat-v37-law-crystal',2,24)"))throw new Error('final runner does not prepare escape build and normal auction before first law choice');
if(!runner.includes("soulTarget=integrationBudget+essenceReserve"))throw new Error('final runner missing explicit unity material budgeting');
if(!runner.includes("ensureVoidEssence(1);"))throw new Error('final runner still preserves void-essence stock unnecessarily');
if(runner.includes("ensureUnityEssence(materialCount('mat-v37-unity-essence')+1);"))throw new Error('final runner still preserves unity-essence stock unnecessarily in Mahayana crafting');
if(!runner.includes("combat-escape-shift"))throw new Error('final runner missing normal sword escape usage');
if(!runner.includes("cooldowns?.['spell-v36-sword-space-step']"))throw new Error('final runner would retry sword escape while the skill is still cooling down');
if(!runner.includes("if(state().player.realmIndex===37){cultivateFull();heal();finishTribulation();break}"))throw new Error('final runner would start tribulation before full realm37 cultivation');
if(runner.includes('v37SetPlayerForTest')||runner.includes("v33AddMaterial('mat-v37-unity-seed'"))throw new Error('forbidden progression shortcut leaked into final runner');

fs.writeFileSync(finalRunnerPath,runner);
console.log('V310_FULLRUN_V4_FINAL_RUNNER_PASS '+JSON.stringify({unitySeedRouting:true,batchedUnityPreparation:true,lawCrystalAuctionPreferred:true,soulCovenantAuctionPreferred:true,lawChoiceEscapePrepared:true,mahayanaUnityStockConsumed:true,swordSpaceEscape:true,swordEscapeCooldownAware:true,realm37Cultivation:true,finalRunner:finalRunnerPath.pathname}));
await import(finalRunnerPath.href+'?v4final='+Date.now());
