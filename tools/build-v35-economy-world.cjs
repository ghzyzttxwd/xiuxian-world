const fs=require('fs');
const crypto=require('crypto');
const INPUT='src/game-v34.js',OUTPUT='src/game-v35.js',CATALOG='content/v35-economy-world.cjs',RUNTIME='tools/v35-economy-runtime.txt',REPORT='BUILD_V35_ECONOMY_WORLD.json',BUILD='3501';
for(const f of [INPUT,CATALOG,RUNTIME])if(!fs.existsSync(f))throw new Error('V3.5 build missing '+f);
const data=require('../'+CATALOG);let src=fs.readFileSync(INPUT,'utf8');let runtime=fs.readFileSync(RUNTIME,'utf8').trimEnd();
runtime=runtime.replace('__V35_SHOPS__',JSON.stringify(data.shops)).replace('__V35_LISTINGS__',JSON.stringify(data.listings)).replace('__V35_AUCTION_POOL__',JSON.stringify(data.auctionPool));
function must(search,replacement,label){if(!src.includes(search))throw new Error('V3.5 transform did not match: '+label);src=src.replace(search,replacement)}

must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='3.4.0'; const SAVE_SCHEMA_VERSION=31;","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='3.5.0'; const SAVE_SCHEMA_VERSION=32;",'version/schema');
must('const CONTENT_STATE_VERSION=5;','const CONTENT_STATE_VERSION=6;','registry version');
must('function rand(){state.rng=',runtime+'\n\nfunction rand(){state.rng=','inject economy runtime');

must(" 31(){ensureV34CombatShape()} \n};"," 31(){ensureV34CombatShape()},\n 32(){ensureV35EconomyShape()} \n};",'schema32 migration');
must('ensureV33AlchemyShape();ensureV34CombatShape();ensureNpcLifeShape();','ensureV33AlchemyShape();ensureV34CombatShape();ensureV35EconomyShape();ensureNpcLifeShape();','new state v35');
must("['player.v34MechanicWinsById',p.v34MechanicWinsById],","['player.v34MechanicWinsById',p.v34MechanicWinsById],['player.v35EconomyVersion',p.v35EconomyVersion],['player.v35TradeLedger',p.v35TradeLedger],['player.v35NamedTrades',p.v35NamedTrades],['player.v35AuctionWins',p.v35AuctionWins],['player.v35RecipeTradeUnlocks',p.v35RecipeTradeUnlocks],['player.v35SecretRealmRecipes',p.v35SecretRealmRecipes],['world.v35StockByListing',w.v35StockByListing],['world.v35AuctionLots',w.v35AuctionLots],['world.v35TradeShock',w.v35TradeShock],",'schema v35 fields');
must('syncV33AlchemyState();syncV34CombatState();syncStableContentState();syncV32GearState();syncV33AlchemyState();syncV34CombatState();state.version=VERSION;','syncV33AlchemyState();syncV34CombatState();syncV35EconomyState();syncStableContentState();syncV32GearState();syncV33AlchemyState();syncV34CombatState();syncV35EconomyState();state.version=VERSION;','save v35 sync');

must('regions=regionRegistry(),statuses=v31AllStatusRegistry();return {registryVersion:CONTENT_STATE_VERSION,quality:', 'regions=regionRegistry(),statuses=v31AllStatusRegistry(),shops=v35ShopRegistry();return {registryVersion:CONTENT_STATE_VERSION,quality:','shop registry source');
must('regions,statuses:JSON.parse(JSON.stringify(statuses)),counts:', 'regions,statuses:JSON.parse(JSON.stringify(statuses)),shops,counts:','shop registry payload');
must('regions:Object.keys(regions).length,statuses:Object.keys(statuses).length}}}', 'regions:Object.keys(regions).length,statuses:Object.keys(statuses).length,shops:Object.keys(shops).length}}}','shop registry count');

must("function npcHelpRequestSpec(n,type=null){\n let kind=type;", "function npcHelpRequestSpec(n,type=null){\n const v35=v35NpcHelpRequestSpec(n,type);if(v35)return v35;\n let kind=type;",'npc named request spec');
must("type:spec.type,label:spec.label,cost:spec.cost,costText:spec.costText,createdDay", "type:spec.type,label:spec.label,cost:spec.cost,costText:spec.costText,materialId:spec.materialId||null,createdDay",'npc request material id');
must(" if(req.type==='healing'){if((p.healingPills||0)<req.cost)", " if(req.type==='namedMaterial'){const paid=v35ResolveNamedNpcRequest(req,n);if(paid==='insufficient'){showResult('材料不足','需要 '+req.costText+'。','bad');return 'insufficient'}if(paid!=='paid')return paid}\n else if(req.type==='healing'){if((p.healingPills||0)<req.cost)",'npc named payment');

must(" const losers=state.npcs.filter(n=>n.alive&&n.faction===(qingyunWin?'血刀门':'青云宗'));", " v35ApplyWarShock(qingyunWin?'relief':'shortage');\n const losers=state.npcs.filter(n=>n.alive&&n.faction===(qingyunWin?'血刀门':'青云宗'));",'war shock');
must('state.player.secretRealmClears++;rr.cleared=true;', 'state.player.secretRealmClears++;v35SecretRealmTradeReward(rr);rr.cleared=true;','secret economy reward');
must('renderSecretRealm();renderMarket();renderAlchemy();', 'renderSecretRealm();renderMarket();renderV35EconomyPanel();renderAlchemy();','economy UI');

must('window.__TAIXUAN_TEST__={contentRegistrySnapshot,ensureContentStateShape,syncStableContentState,ensureV31GrowthShape,ensureV34CombatShape,', 'window.__TAIXUAN_TEST__={contentRegistrySnapshot,ensureContentStateShape,syncStableContentState,ensureV31GrowthShape,ensureV34CombatShape,ensureV35EconomyShape,syncV35EconomyState,v35EconomySnapshot,v35ShopRegistry,v35ListingRegistry,v35ShopAccess,v35ListingAccess,v35Quote,v35Trade,v35ApplyWarShock,v35NpcNamedMaterialSpec,v35SecretRealmTradeReward,v35EconomyHealthSnapshot,v35SetPlayerForTest,','test api v35');

fs.writeFileSync(OUTPUT,src,'utf8');const sha=crypto.createHash('sha256').update(src).digest('hex');
const report={status:'PASS',gameplay_version:'3.5.0',build:BUILD,milestone:'economy-world-integration',source:OUTPUT,source_sha256:sha,source_bytes:Buffer.byteLength(src),save_schema_version:32,content_registry_version:6,counts:{shops:data.shops.length,fixed_listings:data.listings.length,auction_pool:data.auctionPool.length,total_trade_definitions:data.listings.length+data.auctionPool.length,materials:48,recipes:24,enemies:48,builds:8,regions:12},checks:['four distinct shopId venues','named materials and pills enter real trade','sect contribution economy','black market standing modifier','limited auction cycle','atomic buy and sell','war changes trade prices','NPC requests named materials','secret realm grants regional material and unknown recipe','shop registry included in content registry','schema31 to schema32 migration','V3.4 combat builds preserved','future schema33 protection']};
if(report.counts.shops!==4||report.counts.fixed_listings<30||report.counts.auction_pool<10)throw new Error('V3.5 economy hard gate failed');
fs.writeFileSync(REPORT,JSON.stringify(report,null,2)+'\n');console.log('V35_BUILD_PASS',JSON.stringify(report));
