const shops=[
 {id:'shop-linjiang-market',name:'临江坊市',kind:'market',locations:['临江城'],currency:'stones',desc:'玄水帮、散修与商号共同维持的公开坊市。低中阶材料流通稳定，价格会受大盘与商路影响。'},
 {id:'shop-qingyun-vault',name:'青云秘库',kind:'sect',locations:['青云山'],currency:'contribution',sect:'青云宗',desc:'以宗门贡献兑换的内部秘库。高阶配额受身份限制，不受普通坊市涨跌直接影响。'},
 {id:'shop-blackwind-blackmarket',name:'黑风暗市',kind:'black',locations:['黑风岭','赤霞谷'],currency:'stones',desc:'血刀门外围与散修掮客维持的灰色市场。货源偏门、价格偏高，但战乱短缺时反而更容易找到稀货。'},
 {id:'shop-cangwu-auction',name:'苍梧拍卖场',kind:'auction',locations:['苍梧郡城'],currency:'stones',desc:'面向筑基以上修士的周期拍卖。每三十日刷新少量高阶材料与丹方，成交即从本轮消失。'}
];
const L=(id,shopId,kind,refId,basePrice,stock,minRealm=0,opts={})=>({id,shopId,kind,refId,basePrice,stock,minRealm,...opts});
const listings=[
 L('listing-market-greenleaf','shop-linjiang-market','material','mat-v33-greenleaf',3,12,0,{sellable:true,sellRate:.58}),
 L('listing-market-ginseng','shop-linjiang-market','material','mat-v33-ginseng-root',4,10,0,{sellable:true,sellRate:.58}),
 L('listing-market-cleardew','shop-linjiang-market','material','mat-v33-cleardew-flower',4,10,0,{sellable:true,sellRate:.58}),
 L('listing-market-riverlotus','shop-linjiang-market','material','mat-v33-river-lotus',5,10,1,{sellable:true,sellRate:.58}),
 L('listing-market-waterroot','shop-linjiang-market','material','mat-v33-water-lotus-root',8,8,3,{sellable:true,sellRate:.56}),
 L('listing-market-purpleflower','shop-linjiang-market','material','mat-v33-purple-sun-flower',10,7,6,{sellable:true,sellRate:.55}),
 L('listing-market-cinnabar','shop-linjiang-market','material','mat-v33-alchemy-cinnabar',11,7,5,{sellable:true,sellRate:.55}),
 L('listing-market-pill-healing','shop-linjiang-market','pill','recipe-healing',9,8,0,{sellable:true,sellRate:.48}),
 L('listing-market-pill-qi','shop-linjiang-market','pill','recipe-qi',13,7,1,{sellable:true,sellRate:.48}),
 L('listing-market-pill-bloodseal','shop-linjiang-market','pill','recipe-v33-bloodseal',12,6,1,{sellable:true,sellRate:.48}),
 L('listing-market-pill-cleartoxin','shop-linjiang-market','pill','recipe-v33-cleartoxin',17,5,3,{sellable:true,sellRate:.47}),
 L('listing-market-pill-lightbody','shop-linjiang-market','pill','recipe-v33-lightbody',23,4,4,{sellable:true,sellRate:.46}),
 L('listing-sect-lingzhi','shop-qingyun-vault','material','mat-v33-qingyun-lingzhi',10,8,4,{minRank:0}),
 L('listing-sect-cloudglow','shop-qingyun-vault','material','mat-v33-cloudglow-grass',12,7,6,{minRank:0}),
 L('listing-sect-sworddew','shop-qingyun-vault','material','mat-v33-sworddew-flower',22,5,10,{minRank:1}),
 L('listing-sect-springmarrow','shop-qingyun-vault','material','mat-v33-spirit-spring-marrow',28,4,10,{minRank:2}),
 L('listing-sect-rare','shop-qingyun-vault','material','mat-rare-material',40,3,12,{minRank:2}),
 L('listing-sect-relic','shop-qingyun-vault','material','mat-relic-fragment',52,2,14,{minRank:3}),
 L('listing-sect-recipe-solid','shop-qingyun-vault','recipe','recipe-v33-solid-origin',28,1,6,{minRank:1}),
 L('listing-sect-recipe-foundation','shop-qingyun-vault','recipe','recipe-v33-foundation-guard',45,1,10,{minRank:1}),
 L('listing-sect-recipe-swordheart','shop-qingyun-vault','recipe','recipe-v33-swordheart',55,1,15,{minRank:2}),
 L('listing-black-vine','shop-blackwind-blackmarket','material','mat-v33-blackwind-vine',11,8,2,{sellable:true,sellRate:.50}),
 L('listing-black-wolfblood','shop-blackwind-blackmarket','material','mat-v33-wolf-blood-crystal',19,6,3,{sellable:true,sellRate:.50}),
 L('listing-black-miasma','shop-blackwind-blackmarket','material','mat-v33-miasma-fruit',34,5,6,{sellable:true,sellRate:.50}),
 L('listing-black-earthfire','shop-blackwind-blackmarket','material','mat-v33-earthfire-lingzhi',43,4,10,{sellable:true,sellRate:.50}),
 L('listing-black-chixia','shop-blackwind-blackmarket','material','mat-v33-chixia-crystal',52,4,12,{sellable:true,sellRate:.50}),
 L('listing-black-souljade','shop-blackwind-blackmarket','material','mat-v33-souljade-shard',92,3,19,{sellable:true,sellRate:.48}),
 L('listing-black-ghostface','shop-blackwind-blackmarket','material','mat-v33-ghostface-lingzhi',112,3,19,{sellable:true,sellRate:.48}),
 L('listing-black-yindew','shop-blackwind-blackmarket','material','mat-v33-yin-soul-dew',138,2,20,{sellable:true,sellRate:.46}),
 L('listing-black-recipe-body','shop-blackwind-blackmarket','recipe','recipe-v33-bodyforge',96,1,14,{}),
 L('listing-black-recipe-fire','shop-blackwind-blackmarket','recipe','recipe-v33-firevein',98,1,15,{}),
 L('listing-black-recipe-soul','shop-blackwind-blackmarket','recipe','recipe-v33-soulcalm',115,1,17,{})
];
const auctionPool=[
 L('auction-dragonfruit','shop-cangwu-auction','material','mat-v33-dragon-saliva-fruit',155,2,19,{}),
 L('auction-earthmilk','shop-cangwu-auction','material','mat-v33-earthvein-milk',168,2,18,{}),
 L('auction-nether-sand','shop-cangwu-auction','material','mat-v33-nether-river-sand',205,2,22,{}),
 L('auction-medicine-dust','shop-cangwu-auction','material','mat-v33-millennial-medicine-dust',188,2,19,{}),
 L('auction-souljade','shop-cangwu-auction','material','mat-v33-souljade-shard',148,2,19,{}),
 L('auction-rare-bundle','shop-cangwu-auction','material','mat-rare-material',95,3,14,{}),
 L('auction-relic-fragment','shop-cangwu-auction','material','mat-relic-fragment',120,2,14,{}),
 L('auction-core-essence','shop-cangwu-auction','material','mat-core-essence',165,1,14,{}),
 L('auction-recipe-nascent','shop-cangwu-auction','recipe','recipe-v33-nascent',260,1,18,{}),
 L('auction-recipe-spiritclarity','shop-cangwu-auction','recipe','recipe-v33-spiritclarity',280,1,19,{}),
 L('auction-recipe-heaveninsight','shop-cangwu-auction','recipe','recipe-v33-heaveninsight',390,1,22,{}),
 L('auction-recipe-lifeextension','shop-cangwu-auction','recipe','recipe-v33-lifeextension',480,1,20,{})
];
if(shops.length!==4)throw new Error('V3.5 shops must be 4');
if(listings.length!==32)throw new Error('V3.5 fixed listings must be 32');
if(auctionPool.length!==12)throw new Error('V3.5 auction pool must be 12');
for(const id of new Set(listings.concat(auctionPool).map(x=>x.id)))if(!id)throw new Error('V3.5 listing id missing');
if(new Set(listings.concat(auctionPool).map(x=>x.id)).size!==44)throw new Error('V3.5 listing ids duplicate');
module.exports={shops,listings,auctionPool};
