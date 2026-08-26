import fs from 'fs';

const v3Path=new URL('./fullrun-v310-no-recharge-v3.mjs',import.meta.url);
const stagePath=new URL('./.generated-fullrun-v310-no-recharge-v4-stage.mjs',import.meta.url);
let stage=fs.readFileSync(v3Path,'utf8');

const nestedStart=stage.indexOf("const nestedPatch=`");
if(nestedStart<0)throw new Error('V3.10 full-run v4 could not find v3 nestedPatch');
const nestedEnd=stage.indexOf("`;\nmustReplace(writeAnchor",nestedStart);
if(nestedEnd<0)throw new Error('V3.10 full-run v4 could not find v3 nestedPatch end');
if(stage.indexOf("`;\nmustReplace(writeAnchor",nestedEnd+1)>=0)throw new Error('V3.10 full-run v4 nestedPatch end ambiguous');

const unitySeedAnchor="function ensureNamed(id,n){if(materialCount(id)>=n)return;const m=registry.materials[id];";
const unitySeedEscape="function ensureSwordEscapeSkill(){if(DAO_PATH!=='sword'||state().player.realmIndex<26)return;const id='spell-v36-sword-space-step',row=registry.spells[id];if(!row)fail('sword-escape-skill-registry-missing',{id});if(!(row.name in state().player.spells)){ensureCost(row.cost||{});if(!goTo('天渊城'))fail('sword-escape-skill-source-unreachable',{id,sources:row.sources||[]});const r=spendAction('learn-sword-escape-skill',()=>invoke('learnV31Spell',id));if(!['learned','known'].includes(r))fail('sword-escape-skill-learn-blocked',{id,result:r,cost:row.cost||{},location:state().player.location})}if((state().player.activeSkillIds||[])[4]!==id){spendAction('equip-sword-escape-skill',()=>invoke('equipV31Skill',4,id));if((state().player.activeSkillIds||[])[4]!==id)fail('sword-escape-skill-equip-blocked',{id,active:state().player.activeSkillIds})}}function ensureNamed(id,n){if(materialCount(id)>=n)return;if(id==='mat-v37-unity-seed')ensureSwordEscapeSkill();const m=registry.materials[id];";
const fleeBefore="if(!preferWin||enemyRealm>s.player.realmIndex||hpRatio<.28){spendAction('combat-flee',()=>invoke('combatAction','flee'));continue}";
const fleeAfter="if(!preferWin||enemyRealm>s.player.realmIndex||hpRatio<.28){if(preferWin&&DAO_PATH==='sword'&&enemyRealm>s.player.realmIndex&&hpRatio>=.45&&(s.player.activeSkillIds||[]).includes('spell-v36-sword-space-step')){const cc=combat(),row=registry.spells['spell-v36-sword-space-step'];if(cc&&!(cc.v36SpaceShift>0)&&cc.playerQi>=Number(row?.qi||0)){spendAction('combat-escape-shift',()=>invoke('combatAction','skill:spell-v36-sword-space-step'));continue}}spendAction('combat-flee',()=>invoke('combatAction','flee'));continue}";
const unityEssenceBefore="function ensureUnityEssence(n){let guard=0;while(materialCount('mat-v37-unity-essence')<n){if(++guard>50)fail('unity-essence-loop',{target:n});ensureLaw(35);ensureUnity(30);ensureNamed('mat-v37-unity-seed',2);";
const unityEssenceAfter="function ensureUnitySeeds(n){let guard=0;while(materialCount('mat-v37-unity-seed')<n){if(++guard>MAX_FARM_ACTIONS)fail('unity-seed-integration-deadlock',{target:n,current:materialCount('mat-v37-unity-seed'),lawProficiency:state().player.v37LawProficiency,unity:state().player.v37Unity});ensureLaw(35);ensureNamed('mat-v37-law-crystal',1);ensureNamed('mat-v37-soul-covenant-stone',1);if(!goTo('归一圣墟'))fail('unity-seed-integration-location-unreachable',{target:n});const before=materialCount('mat-v37-unity-seed');const r=spendAction('integrate-unity-for-seed',()=>invoke('v37IntegrateUnity'));heal();if(!r?.ok)fail('unity-seed-integration-blocked',{target:n,result:r});const after=materialCount('mat-v37-unity-seed');if(after>before)console.log('V310_FULLRUN_MATERIAL',JSON.stringify({source:'unity-integration',id:'mat-v37-unity-seed',name:'合体道胎',count:after,target:n,actions}))}}function ensureUnityEssence(n){let guard=0;while(materialCount('mat-v37-unity-essence')<n){if(++guard>50)fail('unity-essence-loop',{target:n});ensureLaw(35);ensureUnity(30);ensureUnitySeeds(2);";

const extra=[
 '\\nconst unitySeedAnchor='+JSON.stringify(unitySeedAnchor)+';',
 '\\nconst unitySeedEscape='+JSON.stringify(unitySeedEscape)+';',
 "\\nmustReplace(unitySeedAnchor,unitySeedEscape,'prepare sword escape skill before unity-seed exploration');",
 '\\nconst fleeBefore='+JSON.stringify(fleeBefore)+';',
 '\\nconst fleeAfter='+JSON.stringify(fleeAfter)+';',
 "\\nmustReplace(fleeBefore,fleeAfter,'use normal space-shift movement before cross-realm escape');",
 '\\nconst unityEssenceBefore='+JSON.stringify(unityEssenceBefore)+';',
 '\\nconst unityEssenceAfter='+JSON.stringify(unityEssenceAfter)+';',
 "\\nmustReplace(unityEssenceBefore,unityEssenceAfter,'use costly normal unity integration for unity seeds');",
 "\\nif(!src.includes(\"function ensureUnitySeeds(n)\"))throw new Error('unity-seed normal integration strategy missing');",
 "\\nif(!src.includes(\"source:'unity-integration'\"))throw new Error('unity-seed integration evidence log missing');",
 "\\nif(src.includes(\"ensureUnity(30);ensureNamed('mat-v37-unity-seed',2);\"))throw new Error('danger-0.97 unity-seed explore strategy survived');",
 "\\nif(!src.includes(\"combat-escape-shift\"))throw new Error('space-shift escape action missing');",
 "\\nif(!src.includes(\"invoke('learnV31Spell',id)\"))throw new Error('normal spell-learning call missing');",
 "\\nif(!src.includes(\"invoke('equipV31Skill',4,id)\"))throw new Error('normal skill-equipping call missing');",
 "\\nif(src.includes(\"v37SetPlayerForTest\")||src.includes(\"v33AddMaterial('mat-v37-unity-seed'\"))throw new Error('forbidden progression shortcut leaked into v4 runner');"
].join('');

stage=stage.slice(0,nestedEnd)+extra+stage.slice(nestedEnd);
if(!stage.includes('use costly normal unity integration for unity seeds'))throw new Error('V3.10 full-run v4 unity integration injection missing');
if(!stage.includes('combat-escape-shift'))throw new Error('V3.10 full-run v4 flee policy missing');
fs.writeFileSync(stagePath,stage);
await import(stagePath.href+'?v4='+Date.now());
