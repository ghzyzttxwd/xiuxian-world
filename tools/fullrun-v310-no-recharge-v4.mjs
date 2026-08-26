import fs from 'fs';

const v3Path=new URL('./fullrun-v310-no-recharge-v3.mjs',import.meta.url);
const stagePath=new URL('./.generated-fullrun-v310-no-recharge-v4-stage.mjs',import.meta.url);
const generatedV3Path=new URL('./.generated-fullrun-v310-no-recharge-v3.mjs',import.meta.url);
const outPath=new URL('./.generated-fullrun-v310-no-recharge-v4.mjs',import.meta.url);

function replaceOnce(text,before,after,label){
 const first=text.indexOf(before);
 if(first<0)throw new Error(`V3.10 full-run v4 transform miss: ${label}`);
 if(text.indexOf(before,first+1)>=0)throw new Error(`V3.10 full-run v4 transform ambiguous: ${label}`);
 return text.slice(0,first)+after+text.slice(first+before.length);
}

// Run the already-proven v3 transformation chain, but stop immediately before it executes
// the generated runner. v4 then makes two runner-policy-only changes on that final artifact.
let stage=fs.readFileSync(v3Path,'utf8');
stage=replaceOnce(
 stage,
 "await import(outPath.href+'?seed='+Date.now());",
 "// v4 stage intentionally generates the v3 runner without executing it.",
 'suppress v3 execution during v4 staging'
);
fs.writeFileSync(stagePath,stage);
await import(stagePath.href+'?stage='+Date.now());

let src=fs.readFileSync(generatedV3Path,'utf8');

const namedAnchor="function ensureNamed(id,n){if(materialCount(id)>=n)return;";
const escapeHelper=`function ensureSwordEscapeSkill(){
 if(DAO_PATH!=='sword'||state().player.realmIndex<26)return;
 const id='spell-v36-sword-space-step',row=registry.spells[id];
 if(!row)fail('sword-escape-skill-registry-missing',{id});
 if(!(row.name in state().player.spells)){
  ensureCost(row.cost||{});
  if(!goTo('天渊城'))fail('sword-escape-skill-source-unreachable',{id,sources:row.sources||[]});
  const r=spendAction('learn-sword-escape-skill',()=>invoke('learnV31Spell',id));
  if(!['learned','known'].includes(r))fail('sword-escape-skill-learn-blocked',{id,result:r,cost:row.cost||{},location:state().player.location});
 }
 if((state().player.activeSkillIds||[])[4]!==id){
  spendAction('equip-sword-escape-skill',()=>invoke('equipV31Skill',4,id));
  if((state().player.activeSkillIds||[])[4]!==id)fail('sword-escape-skill-equip-blocked',{id,active:state().player.activeSkillIds});
 }
}
function ensureNamed(id,n){if(materialCount(id)>=n)return;if(id==='mat-v37-unity-seed')ensureSwordEscapeSkill();`;
src=replaceOnce(src,namedAnchor,escapeHelper,'prepare sword escape skill before unity-seed exploration');

const fleeBefore="if(!preferWin||enemyRealm>s.player.realmIndex||hpRatio<.28){spendAction('combat-flee',()=>invoke('combatAction','flee'));continue}";
const fleeAfter=`if(!preferWin||enemyRealm>s.player.realmIndex||hpRatio<.28){
   if(preferWin&&DAO_PATH==='sword'&&enemyRealm>s.player.realmIndex&&hpRatio>=.45&&(s.player.activeSkillIds||[]).includes('spell-v36-sword-space-step')){
    const cc=combat(),row=registry.spells['spell-v36-sword-space-step'];
    if(cc&&!(cc.v36SpaceShift>0)&&cc.playerQi>=Number(row?.qi||0)){
     spendAction('combat-escape-shift',()=>invoke('combatAction','skill:spell-v36-sword-space-step'));
     continue;
    }
   }
   spendAction('combat-flee',()=>invoke('combatAction','flee'));continue
  }`;
src=replaceOnce(src,fleeBefore,fleeAfter,'use normal space-shift movement before cross-realm escape');

if(!src.includes("if(id==='mat-v37-unity-seed')ensureSwordEscapeSkill()"))throw new Error('unity-seed escape preparation missing');
if(!src.includes("combat-escape-shift"))throw new Error('space-shift escape action missing');
if(!src.includes("invoke('learnV31Spell',id)"))throw new Error('normal spell-learning call missing');
if(!src.includes("invoke('equipV31Skill',4,id)"))throw new Error('normal skill-equipping call missing');
if(src.includes("v37SetPlayerForTest")||src.includes("v33AddMaterial('mat-v37-unity-seed'"))throw new Error('forbidden progression shortcut leaked into v4 runner');

fs.writeFileSync(outPath,src);
await import(outPath.href+'?seed='+Date.now());
