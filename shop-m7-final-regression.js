const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=["'][^"']+["'][^>]*><\/script>/g,'');
const GAME='xiuxian_world_v02',WALLET='taixuan-premium-wallet-v1';
const FILES=['src/game-v39.js','ui-shop-v2-power-adapter.js','ui-shop-v2.js','ui-shop-v2-vip8.js','ui-shop-v2-vip12.js','ui-shop-v2-vip15.js','ui-shop-v2-dynamic-power.js','ui-shop-v2-jade-sinks.js'];
function shell(){const d=new JSDOM(html,{url:'https://m7.test/',runScripts:'outside-only',pretendToBeVisual:true});const w=d.window;w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});w.scrollTo=()=>{};w.confirm=()=>true;w.console=console;return w}
function boot(gameSave=null,walletSave=null){const w=shell();if(gameSave)w.localStorage.setItem(GAME,gameSave);if(walletSave)w.localStorage.setItem(WALLET,walletSave);for(const f of FILES)w.eval(fs.readFileSync(f,'utf8'));w.document.dispatchEvent(new w.Event('DOMContentLoaded',{bubbles:true}));return w}
function bootCore(){const w=shell();w.eval(fs.readFileSync('src/game-v39.js','utf8'));w.document.dispatchEvent(new w.Event('DOMContentLoaded',{bubbles:true}));return w}
function wallet(w){return JSON.parse(w.localStorage.getItem(WALLET)||'{}')}
function saveNow(w){w.document.getElementById('saveBtn')?.click();w.document.querySelector('[data-close-modal]')?.click();const x=w.localStorage.getItem(GAME);if(!x)throw Error('game save not created');return x}
function recharge(w,id,n=1){w.__TAIXUAN_SHOP__.open('jade');for(let i=0;i<n;i++){const b=w.document.querySelector(`[data-recharge="${id}"]`);if(!b)throw Error('recharge button missing '+id);b.click()}}
function toVip8(w){recharge(w,'jade-648');recharge(w,'jade-128');recharge(w,'jade-30');if(w.__TAIXUAN_SHOP__.vipLevel()!==8)throw Error('VIP0->8 failed '+w.__TAIXUAN_SHOP__.vipLevel())}
function toVip12(w){recharge(w,'jade-648',2);recharge(w,'jade-128');if(w.__TAIXUAN_SHOP__.vipLevel()!==12)throw Error('VIP8->12 failed '+w.__TAIXUAN_SHOP__.vipLevel())}
function toVip15(w){recharge(w,'jade-648',6);recharge(w,'jade-328');recharge(w,'jade-68');if(w.__TAIXUAN_SHOP__.vipLevel()!==15)throw Error('VIP12->15 failed '+w.__TAIXUAN_SHOP__.vipLevel())}
function finishCombat(w){for(let i=0;i<8&&w.__TAIXUAN_TEST__.getCombat();i++)w.__TAIXUAN_TEST__.combatAction('attack')}
function assertStage(ledger,id,status='claimed'){if(ledger[id]?.status!==status)throw Error(`stage ${id} expected ${status}: `+JSON.stringify(ledger[id]))}

// 1) New save, frozen schema, and actual simulated recharge chain to VIP8.
const w=boot();w.__TAIXUAN_TEST__.newGame('M7主链');
let s=w.__TAIXUAN_TEST__.getState();
if(s.saveSchemaVersion!==36||w.__TAIXUAN_SHOP__.vipLevel()!==0)throw Error('new-save baseline invalid');
if(w.__TAIXUAN_JADE_SINKS__.version!=='m6-2')throw Error('M6 is not m6-2');
toVip8(w);
const v8=w.__TAIXUAN_VIP8__.claimFull();if(!v8.ok)throw Error('VIP8 claim failed '+JSON.stringify(v8));
const a8=v8.artifact,item8=a8.itemId||a8.id;s=w.__TAIXUAN_TEST__.getState();let rec=s.player.equipmentInventory[item8];
if(!rec||rec.grade!=='perfect'||!rec.bound||rec.refinement<3||rec.warmth<30)throw Error('VIP8 artifact invalid '+JSON.stringify(rec));
// Real artifact combat participation.
w.__TAIXUAN_TEST__.v39SetPlayerForTest({realmIndex:10});w.__TAIXUAN_TEST__.startCombat('灰背野狼');const ac0=w.__TAIXUAN_TEST__.getCombat();if(!ac0)throw Error('artifact combat did not start');w.__TAIXUAN_TEST__.combatAction('artifact:'+item8);const ac1=w.__TAIXUAN_TEST__.getCombat();
if(ac1&&ac1.enemyHp>=ac0.enemyHp&&!ac1.artifactCooldowns?.[item8]&&ac1.playerHp===ac0.playerHp&&ac1.playerQi===ac0.playerQi)throw Error('VIP8 artifact did not participate in combat');finishCombat(w);

// 2) VIP8 -> VIP12, real Build completion and real rewarded skill usage.
w.__TAIXUAN_TEST__.v39SetPlayerForTest({realmIndex:19});w.__TAIXUAN_TEST__.v34ActivateBuildForTest('build-sword-burst');toVip12(w);
const v12=w.__TAIXUAN_VIP12__.claimFull();if(!v12.ok||v12.pending||!v12.build?.id)throw Error('VIP12 claim failed '+JSON.stringify(v12));
const built=w.__TAIXUAN_POWER_SHOP__.inspectBuild(v12.build.id);if(!built.mastered)throw Error('VIP12 Build not mastered '+JSON.stringify(built));
const skillId=v12.build.skills[0],skillRow=w.__TAIXUAN_TEST__.v31CatalogSnapshot().spells.find(x=>x.id===skillId);if(!skillRow)throw Error('rewarded Build skill missing');
const prof0=Number(w.__TAIXUAN_TEST__.getState().player.spells[skillRow.name])||0;w.__TAIXUAN_TEST__.startCombat('灰背野狼');w.__TAIXUAN_TEST__.combatAction('skill:'+skillId);const prof1=Number(w.__TAIXUAN_TEST__.getState().player.spells[skillRow.name])||0;if(prof1<=prof0)throw Error('VIP12 Build skill did not execute');finishCombat(w);

// 3) VIP12 -> VIP15 at terminal realm; all staged rights, readiness, no auto tribulation or ascension.
w.__TAIXUAN_TEST__.v39SetPlayerForTest({realmIndex:37,location:'九霄劫台'});if(!w.__TAIXUAN_TEST__.v37ChooseLaw('law-severing',true).ok)throw Error('law setup failed');
const natal=w.__TAIXUAN_POWER_SHOP__.grantArtifact(item8,{grade:'perfect',refinement:6,warmth:60,bind:true,natal:true});if(!natal.ok)throw Error('natal setup failed '+JSON.stringify(natal));
toVip15(w);const v15=w.__TAIXUAN_VIP15__.claimFull();if(!v15.ok)throw Error('VIP15 claim failed '+JSON.stringify(v15));
const ledger=w.__TAIXUAN_VIP15__.getLedger();for(const id of ['void','unity','mahayana','tribulation'])assertStage(ledger,id);
const readiness=w.__TAIXUAN_TEST__.v39TribulationReadiness(),finale=w.__TAIXUAN_TEST__.v39StateSnapshot();if(!readiness.ready)throw Error('VIP15 readiness false '+JSON.stringify(readiness));if(finale.status!=='idle'||finale.ascensionComplete)throw Error('VIP15 auto-started/ascended '+JSON.stringify(finale));

// 4) M6 terminal jade sink integrated into same VIP15 wallet. Exact terminal goods, jade-only spend, no RMB mutation.
const jo=w.__TAIXUAN_JADE_SINKS__.getOffers().find(x=>x.type==='materials');if(!jo||jo.name!=='渡劫天材匣'||!jo.reward.includes('万劫真髓×5'))throw Error('M6 terminal offer incomplete '+JSON.stringify(jo));
const jw0=wallet(w),trib0=w.__TAIXUAN_TEST__.v33MaterialCount('mat-v39-tribulation-essence'),mah0=w.__TAIXUAN_TEST__.v33MaterialCount('mat-v38-mahayana-essence');const jb=w.__TAIXUAN_JADE_SINKS__.buy(jo.id);if(!jb.ok)throw Error('M6 terminal purchase failed '+JSON.stringify(jb));const jw1=wallet(w);
if(jw1.jade!==jw0.jade-1688||jw1.totalCny!==jw0.totalCny)throw Error('M6 jade/RMB accounting invalid');if(w.__TAIXUAN_TEST__.v33MaterialCount('mat-v39-tribulation-essence')!==trib0+5||w.__TAIXUAN_TEST__.v33MaterialCount('mat-v38-mahayana-essence')!==mah0+2)throw Error('M6 terminal material delta invalid');

// 5) Save/reload entire main chain.
const mainSave=saveNow(w),mainWallet=w.localStorage.getItem(WALLET);const wr=boot(mainSave,mainWallet);wr.document.getElementById('continueBtn').click();const rs=wr.__TAIXUAN_TEST__.getState(),rr=wr.__TAIXUAN_TEST__.v39TribulationReadiness();
if(rs.saveSchemaVersion!==36||!rs.player.equipmentInventory[item8]||!rr.ready||!wr.__TAIXUAN_VIP12__.getReward()||!wr.__TAIXUAN_VIP15__.getEntitlement())throw Error('main chain reload regression');if(wr.__TAIXUAN_TEST__.v33MaterialCount('mat-v39-tribulation-essence')<trib0+5)throw Error('M6 terminal material not persistent');

// 6) Early VIP15 must not leak terminal systems; later realm thresholds redeem staged rights only when eligible.
const e=boot();e.__TAIXUAN_TEST__.newGame('早充VIP15');toVip8(e);toVip12(e);toVip15(e);const early=e.__TAIXUAN_VIP15__.claimFull();if(!early.ok)throw Error('early VIP15 base claim failed '+JSON.stringify(early));let ep=e.__TAIXUAN_VIP15__.stagePreview();if(ep.some(x=>x.status==='claimed'||x.eligible))throw Error('early VIP15 leaked staged rewards '+JSON.stringify(ep));if(e.__TAIXUAN_TEST__.getState().player.equipmentInventory['item-v39-thunder-umbrella'])throw Error('early VIP15 leaked terminal artifact');
e.__TAIXUAN_TEST__.v39SetPlayerForTest({realmIndex:26});e.__TAIXUAN_VIP15__.redeemEligibleStages();let el=e.__TAIXUAN_VIP15__.getLedger();assertStage(el,'void');if(el.unity.status==='claimed')throw Error('unity claimed too early');
e.__TAIXUAN_TEST__.v34ActivateBuildForTest('build-body-bastion');e.__TAIXUAN_TEST__.v39SetPlayerForTest({realmIndex:30});e.__TAIXUAN_TEST__.v37ChooseLaw('law-immovable',true);e.__TAIXUAN_VIP15__.redeemEligibleStages();el=e.__TAIXUAN_VIP15__.getLedger();assertStage(el,'unity');
e.__TAIXUAN_TEST__.v39SetPlayerForTest({realmIndex:34});e.__TAIXUAN_VIP15__.redeemEligibleStages();el=e.__TAIXUAN_VIP15__.getLedger();assertStage(el,'mahayana','partial');
const epv=e.__TAIXUAN_POWER_SHOP__.previewVip8Artifact();if(!epv.ok)throw Error('early path artifact preview missing');const ena=e.__TAIXUAN_POWER_SHOP__.grantArtifact(epv.itemId,{grade:'perfect',refinement:5,warmth:60,bind:true,natal:true});if(!ena.ok)throw Error('early path natal setup failed '+JSON.stringify(ena));e.__TAIXUAN_VIP15__.redeemEligibleStages();assertStage(e.__TAIXUAN_VIP15__.getLedger(),'mahayana');
e.__TAIXUAN_TEST__.v39SetPlayerForTest({realmIndex:37,location:'九霄劫台',progressFull:true});e.__TAIXUAN_VIP15__.redeemEligibleStages();assertStage(e.__TAIXUAN_VIP15__.getLedger(),'tribulation');if(!e.__TAIXUAN_TEST__.v39TribulationReadiness().ready||e.__TAIXUAN_TEST__.v39StateSnapshot().status!=='idle')throw Error('late staged tribulation entitlement invalid');

// 7) M5 dynamic package must trigger on an actual incomplete Build and complete it.
const d=boot();d.__TAIXUAN_TEST__.newGame('动态礼包');d.__TAIXUAN_TEST__.v34ActivateBuildForTest('build-flame-dot');const beforeBuild=d.__TAIXUAN_POWER_SHOP__.bestBuild();if(!beforeBuild?.mastered)throw Error('dynamic fixture Build setup failed');d.__TAIXUAN_POWER_SHOP__.grantManual('manual-basic-breathing',{switchTo:true});const incomplete=d.__TAIXUAN_POWER_SHOP__.inspectBuild(beforeBuild.id);if(incomplete.mastered)throw Error('dynamic fixture did not become incomplete');const offer=d.__TAIXUAN_DYNAMIC_POWER__.getOffers({includeBought:false}).find(x=>x.type==='build');if(!offer)throw Error('M5 dynamic Build offer missing');const db=d.__TAIXUAN_DYNAMIC_POWER__.buy(offer.id);if(!db.ok||!d.__TAIXUAN_POWER_SHOP__.inspectBuild(db.granted.id).mastered)throw Error('M5 dynamic Build purchase failed '+JSON.stringify(db));

// 8) Legacy schema36 + old VIP milestones: retrofit new power rights without duplicating old currency.
const oc=bootCore();oc.__TAIXUAN_TEST__.newGame('旧schema36');oc.__TAIXUAN_TEST__.v34ActivateBuildForTest('build-body-bastion');oc.__TAIXUAN_TEST__.v39SetPlayerForTest({realmIndex:37,location:'九霄劫台',progressFull:true});oc.__TAIXUAN_TEST__.v37ChooseLaw('law-immovable',true);const oldSave=saveNow(oc);if(JSON.parse(oldSave).saveSchemaVersion!==36)throw Error('legacy fixture schema not 36');
const oldWallet=JSON.stringify({version:2,jade:777,vipExp:65000,totalCny:6500,monthlyUntil:0,monthlyClaimDate:'',growthOwned:false,growthClaimed:[],vipClaimDate:'',vipMilestoneClaimed:[8,12,15],firstBonusUsed:{},packBuys:{},receipts:[],titles:['八荒至尊','太玄道君','诸天仙尊']});
const o=boot(oldSave,oldWallet);o.document.getElementById('continueBtn').click();const o8=o.__TAIXUAN_VIP8__.claimArtifactOnly();if(!o8.ok||!o8.retroactive)throw Error('legacy VIP8 retrofit failed '+JSON.stringify(o8));const legacyItem=o8.artifact.itemId||o8.artifact.id;const on=o.__TAIXUAN_POWER_SHOP__.grantArtifact(legacyItem,{grade:'perfect',refinement:6,warmth:60,bind:true,natal:true});if(!on.ok)throw Error('legacy natal setup failed');const o12=o.__TAIXUAN_VIP12__.claimBuildOnly();if(!o12.ok||!o12.retroactive)throw Error('legacy VIP12 retrofit failed '+JSON.stringify(o12));const o15=o.__TAIXUAN_VIP15__.retrofit();if(!o15.ok)throw Error('legacy VIP15 retrofit failed '+JSON.stringify(o15));const ow=wallet(o);if(ow.jade!==777||!ow.vip8ArtifactReward||!ow.vip12BuildReward||!ow.vip15Entitlement)throw Error('legacy retrofit wallet/entitlements invalid '+JSON.stringify(ow));if(o.__TAIXUAN_TEST__.getState().saveSchemaVersion!==36||!o.__TAIXUAN_TEST__.v39TribulationReadiness().ready)throw Error('legacy schema/readiness regression');

console.log('SHOP_M7_FINAL_REGRESSION_OK',JSON.stringify({schema:rs.saveSchemaVersion,vip:wr.__TAIXUAN_SHOP__.vipLevel(),vip8:a8.name,vip12:v12.build.name,vip15:Object.fromEntries(Object.entries(ledger).map(([k,v])=>[k,v.status])),readiness:rr.ready,m6:wr.__TAIXUAN_JADE_SINKS__.version,dynamic:offer.name,legacyJade:ow.jade}));
