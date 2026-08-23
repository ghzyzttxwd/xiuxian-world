const L={village:['青石村','青石镇'],river:['临江城','云梦泽'],black:['黑风岭'],qingyun:['青云山'],cangwu:['苍梧郡城'],chixia:['赤霞谷'],mine:['落星矿脉'],beast:['万兽山脉'],ruin:['古河遗迹'],xuanyin:['玄阴禁地']};
const legacy=[
 {id:'mat-spirit-stone',name:'灵石',qualityId:'fan',kind:'currency',legacyField:'spiritStones',locations:Object.keys(L).flatMap(k=>L[k]),minRealm:0},
 {id:'mat-spirit-herb',name:'灵草',qualityId:'fan',kind:'herb',legacyField:'herbs',locations:['青石村','青石镇','青云山','云梦泽','黑风岭'],minRealm:0},
 {id:'mat-beast-material',name:'兽材',qualityId:'huang',kind:'craft',legacyField:'beastMaterials',locations:['黑风岭','万兽山脉'],minRealm:1},
 {id:'mat-rare-material',name:'高阶灵材',qualityId:'xuan',kind:'craft',legacyField:'rareMaterials',locations:['赤霞谷','落星矿脉','万兽山脉','古河遗迹','玄阴禁地'],minRealm:10},
 {id:'mat-relic-fragment',name:'古修残片',qualityId:'xuan',kind:'relic',legacyField:'relicFragments',locations:['古河遗迹','玄阴禁地'],minRealm:10},
 {id:'mat-core-essence',name:'结丹灵髓',qualityId:'xuan',kind:'breakthrough',legacyField:'coreEssence',locations:['赤霞谷','万兽山脉','古河遗迹'],minRealm:14},
 {id:'mat-nascent-essence',name:'化婴灵胎',qualityId:'di',kind:'breakthrough',legacyField:'nascentEssence',locations:['万兽山脉','古河遗迹','玄阴禁地'],minRealm:18},
 {id:'mat-deification-essence',name:'化神道种',qualityId:'di',kind:'breakthrough',legacyField:'deificationEssence',locations:['古河遗迹','玄阴禁地'],minRealm:22}
];
const named=[
 ['mat-v33-greenleaf','青叶草','fan','herb',L.village,0],['mat-v33-ginseng-root','山参须','fan','herb',L.village,0],['mat-v33-cleardew-flower','清露花','fan','herb',L.village,0],['mat-v33-woodmoss','木灵苔','fan','herb',L.village,1],
 ['mat-v33-river-lotus','江心莲','fan','herb',L.river,1],['mat-v33-water-lotus-root','水灵藕','huang','herb',L.river,3],['mat-v33-croc-gall','青鳞鳄胆','huang','beast',L.river,3,['妖兽']],['mat-v33-moon-ripple-grass','月涟草','huang','herb',L.river,5],
 ['mat-v33-blackwind-vine','黑风藤','huang','herb',L.black,2],['mat-v33-wolf-blood-crystal','狼妖血晶','huang','beast',L.black,3,['妖兽']],['mat-v33-darkbone-grass','玄骨草','huang','herb',L.black,4],['mat-v33-miasma-fruit','瘴心果','xuan','herb',L.black,6],
 ['mat-v33-qingyun-lingzhi','青云灵芝','huang','herb',L.qingyun,4],['mat-v33-sworddew-flower','剑露花','xuan','herb',L.qingyun,10],['mat-v33-cloudglow-grass','云霞草','huang','herb',L.qingyun,6],['mat-v33-spirit-spring-marrow','灵泉髓','xuan','essence',L.qingyun,10],
 ['mat-v33-purple-sun-flower','紫阳花','huang','herb',L.cangwu,6],['mat-v33-jade-marrow-sand','玉髓砂','xuan','mineral',L.cangwu,10],['mat-v33-alchemy-cinnabar','商盟丹砂','huang','mineral',L.cangwu,5],['mat-v33-mindwood-heart','凝神木心','xuan','wood',L.cangwu,12],
 ['mat-v33-redflame-flower','赤炎花','huang','herb',L.chixia,5],['mat-v33-earthfire-lingzhi','地火芝','xuan','herb',L.chixia,10],['mat-v33-firelizard-gall','火蜥胆','xuan','beast',L.chixia,8,['妖兽']],['mat-v33-chixia-crystal','赤霞晶','xuan','mineral',L.chixia,12],
 ['mat-v33-stariron-sand','星铁砂','huang','mineral',L.mine,6],['mat-v33-meteor-powder','陨星粉','xuan','mineral',L.mine,12],['mat-v33-darkiron-marrow','玄铁髓','xuan','mineral',L.mine,10],['mat-v33-earthvein-milk','地脉石乳','di','essence',L.mine,18],
 ['mat-v33-beastking-blood','兽王血','xuan','beast',L.beast,14,['妖兽']],['mat-v33-golden-ginseng','金纹参','xuan','herb',L.beast,12],['mat-v33-dragon-saliva-fruit','龙涎果','di','herb',L.beast,19],['mat-v33-centennial-bone','百年兽骨','xuan','beast',L.beast,14,['妖兽']],
 ['mat-v33-ancient-lamp-moss','古河青灯苔','xuan','herb',L.ruin,12],['mat-v33-array-spirit-powder','残阵灵粉','xuan','relic',L.ruin,14],['mat-v33-souljade-shard','魂玉碎片','di','relic',L.ruin,19],['mat-v33-millennial-medicine-dust','千年药尘','di','herb',L.ruin,19],
 ['mat-v33-xuanyin-flower','玄阴花','xuan','herb',L.xuanyin,15],['mat-v33-ghostface-lingzhi','鬼面芝','di','herb',L.xuanyin,19],['mat-v33-yin-soul-dew','阴魂露','di','essence',L.xuanyin,20,['阴物']],['mat-v33-nether-river-sand','冥河砂','di','mineral',L.xuanyin,22]
].map(([id,name,qualityId,kind,locations,minRealm,combatKinds])=>({id,name,qualityId,kind,locations:[...locations],minRealm,combatKinds:combatKinds||[],named:true}));
const materials=[...legacy,...named];
function R(id,itemId,name,unlock,qualityId,sources,ingredients,effect,toxicity,base=.58,days=1,desc='',knownByDefault=false,learnCost={stones:6,insight:0}){return {id,itemId,name,unlock,qualityId,sources:[...sources],ingredients:{...ingredients},effect:{...effect},toxicity,base,days,desc,knownByDefault,learnCost:{...learnCost}}}
const recipes=[
 R('recipe-healing','item-pill-healing','回春散',0,'fan',L.village,{'mat-spirit-herb':2,'mat-spirit-stone':1},{hp:.42,injury:-1},4,.68,1,'低阶疗伤散剂，恢复气血并缓解一级伤势。',true),
 R('recipe-qi','item-pill-qi','聚气丹',1,'fan',L.village,{'mat-spirit-herb':3,'mat-spirit-stone':2},{qi:.68},5,.62,1,'炼气期常用回灵丹药。',true),
 R('recipe-golden','item-pill-golden','金元丹',15,'xuan',L.chixia,{'mat-spirit-herb':6,'mat-rare-material':2,'mat-core-essence':1},{progress:.045,qi:1,manualProf:18},14,.48,2,'金丹期丹药，推动修为并恢复灵力。',true),
 R('recipe-soul','item-pill-soul','养魂丹',19,'di',L.ruin,{'mat-spirit-herb':8,'mat-rare-material':3,'mat-nascent-essence':1},{qi:1,injury:-1,insight:1,manualProf:24},16,.43,3,'元婴期丹药，滋养元神。',true),
 R('recipe-v33-bloodseal','item-pill-v33-bloodseal','凝血丹',1,'fan',L.village,{'mat-v33-greenleaf':2,'mat-v33-ginseng-root':1},{hp:.28},4,.70,1,'快速止血回气，适合炼气修士。'),
 R('recipe-v33-cleartoxin','item-pill-v33-cleartoxin','清毒丹',3,'fan',L.river,{'mat-v33-cleardew-flower':2,'mat-v33-river-lotus':1},{toxicity:-24},1,.68,1,'清解丹毒与瘴气。'),
 R('recipe-v33-lightbody','item-pill-v33-lightbody','轻身丹',4,'huang',L.river,{'mat-v33-water-lotus-root':1,'mat-v33-moon-ripple-grass':1},{buff:{flee:.16},buffDays:5},6,.62,1,'数日内身法轻灵，逃脱更稳。'),
 R('recipe-v33-solid-origin','item-pill-v33-solid-origin','固元丹',6,'huang',L.qingyun,{'mat-v33-qingyun-lingzhi':1,'mat-v33-cloudglow-grass':2},{buff:{hp:.10,healing:.10},buffDays:7},7,.61,1,'固护根基，短期提升气血与恢复。'),
 R('recipe-v33-returnspirit','item-pill-v33-returnspirit','回灵丹',6,'huang',L.river,{'mat-v33-water-lotus-root':2,'mat-v33-river-lotus':1},{qi:.88},7,.64,1,'比聚气丹更强的战后回灵丹。'),
 R('recipe-v33-barrierbreak','item-pill-v33-barrierbreak','破障丹',9,'huang',L.cangwu,{'mat-v33-purple-sun-flower':2,'mat-v33-alchemy-cinnabar':1},{buff:{breakthrough:.035},buffDays:10},10,.58,2,'短期辅助小境界破关，不保证成功。',{stones:12,insight:1}),
 R('recipe-v33-foundation-guard','item-pill-v33-foundation-guard','筑基护脉丹',10,'huang',L.qingyun,{'mat-v33-qingyun-lingzhi':2,'mat-v33-spirit-spring-marrow':1},{buff:{breakthrough:.045,incoming:-.04},buffDays:12},11,.56,2,'护住经脉后再冲击筑基境界。',false,{stones:18,insight:1}),
 R('recipe-v33-golden-marrow','item-pill-v33-golden-marrow','金髓丹',14,'xuan',L.mine,{'mat-v33-darkiron-marrow':1,'mat-v33-jade-marrow-sand':1,'mat-v33-golden-ginseng':1},{progress:.028,manualProf:14},12,.53,2,'结丹前后稳步推动修为。',false,{stones:24,insight:1}),
 R('recipe-v33-bodyforge','item-pill-v33-bodyforge','锻体丹',14,'xuan',L.beast,{'mat-v33-centennial-bone':1,'mat-v33-beastking-blood':1},{buff:{hp:.15,incoming:-.05},buffDays:8},14,.50,2,'以兽血骨力淬体，短期强化肉身。',false,{stones:26,insight:1}),
 R('recipe-v33-firevein','item-pill-v33-firevein','火脉丹',15,'xuan',L.chixia,{'mat-v33-earthfire-lingzhi':1,'mat-v33-firelizard-gall':1,'mat-v33-chixia-crystal':1},{buff:{damage:.13},buffDays:7,path:'flame'},15,.49,2,'火修爆发丹，短期增幅攻伐但丹毒较重。',false,{stones:30,insight:1}),
 R('recipe-v33-swordheart','item-pill-v33-swordheart','剑心丹',15,'xuan',L.qingyun,{'mat-v33-sworddew-flower':2,'mat-v33-spirit-spring-marrow':1},{buff:{damage:.11,controlResist:.08},buffDays:8,path:'sword'},13,.51,2,'凝神定意，适合剑修短期斗法。',false,{stones:30,insight:1}),
 R('recipe-v33-waterguard','item-pill-v33-waterguard','玄水护元丹',15,'xuan',L.river,{'mat-v33-moon-ripple-grass':2,'mat-v33-croc-gall':1},{buff:{incoming:-.10,healing:.08},buffDays:8},13,.52,2,'水行药力绵长，显著降低短期承伤。',false,{stones:28,insight:1}),
 R('recipe-v33-soulcalm','item-pill-v33-soulcalm','定魂丹',17,'xuan',L.cangwu,{'mat-v33-mindwood-heart':1,'mat-v33-jade-marrow-sand':1},{buff:{controlResist:.20,qi:.08},buffDays:10},12,.52,2,'稳固识海，抵御神魂扰动。',false,{stones:32,insight:1}),
 R('recipe-v33-nascent','item-pill-v33-nascent','化婴丹',18,'xuan',L.beast,{'mat-v33-dragon-saliva-fruit':1,'mat-v33-beastking-blood':1,'mat-nascent-essence':1},{buff:{breakthrough:.055},buffDays:14},18,.42,3,'冲击元婴前的高阶辅助丹，昂贵且丹毒极重。',false,{stones:45,insight:2}),
 R('recipe-v33-spiritclarity','item-pill-v33-spiritclarity','元神清灵丹',19,'di',L.ruin,{'mat-v33-ancient-lamp-moss':1,'mat-v33-souljade-shard':1},{insight:1,buff:{controlResist:.24},buffDays:10},15,.45,3,'温养元神并提高短期神识稳定。',false,{stones:48,insight:2}),
 R('recipe-v33-netherbreaker','item-pill-v33-netherbreaker','破煞丹',19,'di',L.xuanyin,{'mat-v33-xuanyin-flower':1,'mat-v33-ghostface-lingzhi':1},{buff:{incoming:-.08,controlResist:.18},buffDays:12},14,.46,3,'应对玄阴煞气与阴物侵蚀。',false,{stones:50,insight:2}),
 R('recipe-v33-heaveninsight','item-pill-v33-heaveninsight','悟道丹',22,'di',L.ruin,{'mat-v33-millennial-medicine-dust':1,'mat-v33-souljade-shard':1,'mat-v33-earthvein-milk':1},{insight:2,buff:{breakthrough:.045},buffDays:15},19,.39,4,'化神前后参悟所用，不能替代真正的悟道与积累。',false,{stones:70,insight:3}),
 R('recipe-v33-deification','item-pill-v33-deification','化神凝真丹',23,'di',L.xuanyin,{'mat-v33-yin-soul-dew':1,'mat-v33-nether-river-sand':1,'mat-deification-essence':1},{buff:{breakthrough:.06,damage:.06},buffDays:15},22,.36,4,'化神修士使用的高风险凝真丹。',false,{stones:90,insight:3}),
 R('recipe-v33-lifeextension','item-pill-v33-lifeextension','延寿丹',20,'di',L.ruin,{'mat-v33-dragon-saliva-fruit':1,'mat-v33-millennial-medicine-dust':1,'mat-v33-earthvein-milk':1},{lifespan:1,maxUses:3},24,.34,5,'极难炼制的延寿丹；一生至多有效三次，每次仅增寿一年。',false,{stones:100,insight:4}),
 R('recipe-v33-desperate','item-pill-v33-desperate','燃元丹',18,'xuan',L.chixia,{'mat-v33-redflame-flower':2,'mat-v33-firelizard-gall':1,'mat-v33-wolf-blood-crystal':1},{buff:{damage:.24,incoming:.12},buffDays:3},28,.46,2,'高风险爆发丹：短期攻伐暴涨，但同时更易受伤。',false,{stones:40,insight:2})
];
if(named.length!==40)throw new Error('V3.3 named material count must be 40');
if(materials.length!==48)throw new Error('V3.3 total material registry count must be 48');
if(recipes.length!==24)throw new Error('V3.3 recipe count must be 24');
for(const [label,rows] of [['material',materials],['recipe',recipes]]){const ids=rows.map(x=>x.id),names=rows.map(x=>x.name);if(new Set(ids).size!==ids.length)throw new Error('duplicate '+label+' id');if(new Set(names).size!==names.length)throw new Error('duplicate '+label+' name')}
module.exports={materials,recipes,namedMaterials:named};
