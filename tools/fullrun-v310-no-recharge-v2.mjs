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
 " 'v39StateSnapshot','v39TribulationReadiness','v39BuildTribulationFormation','v39BeginTribulation','v39ThunderStage','v39ResolveThunder','v39ResolveHeartDemon','v39ResolveTransformation','v39AscendToTrueImmortal'\n]);",
 " 'v39StateSnapshot','v39TribulationReadiness','v39BuildTribulationFormation','v39BeginTribulation','v39ThunderStage','v39ResolveThunder','v39ResolveHeartDemon','v39ResolveTransformation','v39AscendToTrueImmortal',\n 'participateMajor','claimSectStipend','acceptSectTask','takeSectAssessment','promoteSect','chooseSectMentor','seekMentorGuidance','sectCareerInfo','sectRankIndex','sectMentorInfo','factionStandingSnapshot','acceptFactionContract','factionContractInfo'\n]);",
 'allow normal sect gameplay surface'
);

mustReplace(
 "function ensureInsight(n){if(state().player.insight>=n)return;const loc=goAny(['玄阴禁地','上古断界台','法则古原','古河遗迹']);if(!loc)fail('insight-source-unreachable',{target:n});let guard=0;while(state().player.insight<n){if(++guard>MAX_FARM_ACTIONS)fail('insight-farm-deadlock',{target:n,location:loc});act('explore',true)}}",
 "function ensureInsight(n){if(state().player.insight>=n)return;let guard=0;while(state().player.insight<n){if(++guard>Math.max(40,n*8))fail('insight-farm-deadlock',{target:n});const before=state().player.insight;ensureRelic(state().player.relicFragments+3);spendAction('decipher-relic-ui',()=>{const b=dom.window.document.querySelector('[data-relic]');if(!b)fail('relic-decipher-ui-missing',{target:n,relicFragments:state().player.relicFragments});b.click()});if(state().player.insight<=before)fail('relic-decipher-no-insight',{target:n,before,after:state().player.insight})}}",
 'safe insight strategy'
);

mustReplace(
 "function goAny(candidates){for(const x of candidates){if(goTo(x))return x}return null}",
 `function goAny(candidates){for(const x of candidates){if(goTo(x))return x}return null}
function sectRoutine(id='patrol'){
 if(!goTo('青云山'))fail('sect-home-unreachable',{id});
 const before=invoke('sectCareerInfo');
 spendAction('sect-accept:'+id,()=>invoke('acceptSectTask',id));
 const task=state().player.sectTask;if(!task||task.id!==id)fail('sect-task-accept-blocked',{id,before,after:invoke('sectCareerInfo')});
 spendAction('sect-complete:'+id,()=>{const b=dom.window.document.querySelector('[data-sect-complete]');if(!b)fail('sect-routine-ui-missing',{id,task:state().player.sectTask});b.click()});
 if(state().player.sectTask)fail('sect-routine-no-progress',{id,task:state().player.sectTask});
 return invoke('sectCareerInfo');
}
function waitSectDays(days){let left=Math.max(0,Number(days)||0),guard=0;while(left>0){if(++guard>80)fail('sect-wait-loop',{days,left});const before=ageYears();sectRoutine(invoke('sectRankIndex')>=1?'escort':'patrol');const spent=Math.max(1,Math.round((ageYears()-before)*360));left-=spent}}
function ensureSwordSectEntry(){
 if(DAO_PATH!=='sword')return;
 const p=state().player;if(p.sect==='青云宗')return;
 if(p.realmIndex>0)fail('sword-sect-window-missed',{realmIndex:p.realmIndex,location:p.location,major:state().major?.recruit||null});
 if(!goTo('青云山'))fail('sword-recruit-location-unreachable',{});
 let guard=0;
 while(state().major?.recruit?.status!=='active'){
  const m=state().major?.recruit;
  if(m?.status==='ended'||++guard>8)fail('sword-recruit-window-unreachable',{major:m||null,realmIndex:state().player.realmIndex});
  act('rest',false);
 }
 spendAction('qingyun-recruit',()=>invoke('participateMajor','recruit'));
 if(state().player.sect!=='青云宗')fail('sword-recruit-rejected',{rootIndex:state().player.rootIndex,realmIndex:state().player.realmIndex,major:state().major?.recruit||null});
 console.log('V310_FULLRUN_SECT',JSON.stringify({stage:'joined',sect:state().player.sect,rank:state().player.sectRank,rootIndex:state().player.rootIndex,age:Number(ageYears().toFixed(2))}));
}
function ensureSectAssessment(level){
 let guard=0;while((invoke('sectCareerInfo').assessmentLevel||0)<level){if(++guard>8)fail('sect-assessment-loop',{level,career:invoke('sectCareerInfo')});if(!goTo('青云山'))fail('sect-assessment-home-unreachable',{level});spendAction('sect-assessment:'+level,()=>invoke('takeSectAssessment'));resolveCombat(true);if((invoke('sectCareerInfo').assessmentLevel||0)<level)waitSectDays(31)}
}
function ensureSectRank(target){
 let guard=0;while(invoke('sectRankIndex')<target){if(++guard>4)fail('sect-rank-loop',{target,career:invoke('sectCareerInfo')});const current=invoke('sectRankIndex'),needTasks=current===0?3:8,needContribution=current===0?60:180;while((invoke('sectCareerInfo').tasks||0)<needTasks||(invoke('sectCareerInfo').contribution||0)<needContribution)sectRoutine(current>=1?'escort':'patrol');ensureSectAssessment(current+1);spendAction('sect-promote:'+(current+1),()=>invoke('promoteSect'));if(invoke('sectRankIndex')<=current)fail('sect-promotion-blocked',{target,current,career:invoke('sectCareerInfo')})}
}
function ensureSwordMentorBond(n){
 ensureSectRank(1);if(!state().player.sectMentor){if(!goTo('青云山'))fail('sect-mentor-home-unreachable',{});spendAction('choose-sword-mentor',()=>invoke('chooseSectMentor','sword'));if(!state().player.sectMentor)fail('sect-mentor-choice-blocked',{career:invoke('sectCareerInfo')})}
 let guard=0;while((state().player.sectMentorBond||0)<n){if(++guard>20)fail('sect-mentor-bond-loop',{target:n,bond:state().player.sectMentorBond});const info=invoke('sectMentorInfo');if((info?.cooldown||0)>0)waitSectDays(info.cooldown+1);while((invoke('sectCareerInfo').contribution||0)<8)sectRoutine('escort');if(!goTo('青云山'))fail('sect-mentor-home-unreachable',{});const before=state().player.sectMentorBond||0;spendAction('mentor-guidance',()=>invoke('seekMentorGuidance'));if((state().player.sectMentorBond||0)<=before)fail('sect-mentor-guidance-no-progress',{target:n,before,info:invoke('sectMentorInfo')})}
}
function ensureQingyunStanding(n){
 if(DAO_PATH!=='sword')return;let guard=0;while((invoke('factionStandingSnapshot').qingyun||0)<n){if(++guard>8)fail('qingyun-standing-loop',{target:n,standing:invoke('factionStandingSnapshot')});if(!goTo('青云山'))fail('qingyun-contract-home-unreachable',{});spendAction('accept-qingyun-contract',()=>invoke('acceptFactionContract','qingyun'));if(!invoke('factionContractInfo')){waitSectDays(11);continue}if(!goTo('黑风岭'))fail('qingyun-contract-field-unreachable',{});let fights=0;while(invoke('factionContractInfo')){if(++fights>80)fail('qingyun-contract-combat-loop',{contract:invoke('factionContractInfo'),standing:invoke('factionStandingSnapshot')});act('explore',true)}console.log('V310_FULLRUN_SECT',JSON.stringify({stage:'contract',standing:invoke('factionStandingSnapshot').qingyun,career:invoke('sectCareerInfo')}))}
}
function ensureSwordDaoResources(){
 if(DAO_PATH!=='sword'||state().player.realmIndex<14)return;
 if(state().player.sect!=='青云宗')fail('sword-sect-missing-at-dao',{realmIndex:state().player.realmIndex});
 ensureSwordMentorBond(3);ensureQingyunStanding(25);
 while((invoke('sectCareerInfo').tasks||0)<8||(invoke('sectCareerInfo').contribution||0)<180)sectRoutine('escort');
 ensureSectAssessment(2);if(invoke('sectRankIndex')<2){spendAction('sect-promote:true-disciple',()=>invoke('promoteSect'));if(invoke('sectRankIndex')<2)fail('true-disciple-promotion-blocked',{career:invoke('sectCareerInfo'),standing:invoke('factionStandingSnapshot')})}
 ensureSwordMentorBond(6);
 if(!goTo('青云山'))fail('sword-resource-home-unreachable',{});
 spendAction('claim-true-disciple-stipend',()=>invoke('claimSectStipend'));
 let stipendGuard=0;while((state().player.rareMaterials||0)<2){if(++stipendGuard>4)fail('sword-sect-rare-deadlock',{rare:state().player.rareMaterials,career:invoke('sectCareerInfo')});waitSectDays(31);spendAction('claim-true-disciple-stipend',()=>invoke('claimSectStipend'))}
 while((state().player.insight||0)<2)ensureSwordMentorBond((state().player.sectMentorBond||0)+1);
 while((invoke('sectCareerInfo').contribution||0)<45)sectRoutine('escort');ensureStones(20);
 console.log('V310_FULLRUN_SECT',JSON.stringify({stage:'dao-ready',career:invoke('sectCareerInfo'),standing:invoke('factionStandingSnapshot'),insight:state().player.insight,rare:state().player.rareMaterials,stones:state().player.spiritStones,bond:state().player.sectMentorBond}));
}`,
 'normal sword sect career chain'
);

mustReplace(
 "function choosePath(){const p=state().player;if(p.daoPath===DAO_PATH)return;if(p.daoPath!=='none'&&p.daoPath!==DAO_PATH)fail('dao-path-mismatch',{current:p.daoPath,wanted:DAO_PATH});if(p.realmIndex<10)return;ensureInsight(2);spendAction('choose-dao-path',()=>invoke('chooseDaoPath',DAO_PATH));if(state().player.daoPath!=='none'&&state().player.daoPath!==DAO_PATH)fail('dao-path-changed-wrong',{current:state().player.daoPath})}",
 "function choosePath(){const p=state().player;if(p.daoPath===DAO_PATH)return;if(p.daoPath!=='none'&&p.daoPath!==DAO_PATH)fail('dao-path-mismatch',{current:p.daoPath,wanted:DAO_PATH});if(p.realmIndex<14)return;if(DAO_PATH==='sword'){ensureSwordDaoResources();if(!goTo('青云山'))fail('sword-dao-location-unreachable',{})}else{ensureInsight(2)}spendAction('choose-dao-path',()=>invoke('chooseDaoPath',DAO_PATH));if(state().player.daoPath!==DAO_PATH)fail('dao-path-choice-blocked',{wanted:DAO_PATH,actual:state().player.daoPath,state:slimState(),career:DAO_PATH==='sword'?invoke('sectCareerInfo'):null})}",
 'choose dao only at real realm requirement'
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

mustReplace(
 " if(++loop>500)fail('realm-loop-limit',{loop});\n choosePath();",
 " if(++loop>500)fail('realm-loop-limit',{loop});\n ensureSwordSectEntry();\n choosePath();",
 'enter qingyun recruitment before cultivation'
);

if(src.includes("goAny(['玄阴禁地','上古断界台','法则古原','古河遗迹'])"))throw new Error('unsafe early insight strategy survived');
if(!src.includes("pathReady=p.daoPath===DAO_PATH"))throw new Error('pre-path manual guard missing');
if(!src.includes("if(state().player.daoPath!==DAO_PATH)return"))throw new Error('pre-path skill guard missing');
if(!src.includes("spendAction('decipher-relic-ui'"))throw new Error('normal relic decipher strategy missing');
if(!src.includes("spendAction('retreat-seven-days'"))throw new Error('normal seven-day retreat strategy missing');
if(!src.includes("spendAction('qingyun-recruit'"))throw new Error('qingyun recruitment strategy missing');
if(!src.includes("ensureSwordMentorBond(6)"))throw new Error('sword sect career strategy missing');
fs.writeFileSync(outPath,src);
await import(outPath.href+'?seed='+Date.now());
