const SOURCES={
 village:['青石村','青石镇'],town:['青石镇','临江城'],city:['临江城','苍梧郡城'],qingyun:['青云山'],marsh:['云梦泽'],chixia:['赤霞谷'],mine:['落星矿脉'],beast:['万兽山脉'],ruin:['古河遗迹'],xuanyin:['玄阴禁地'],high:['苍梧郡城','古河遗迹']
};
function quality(unlock){return unlock>=21?'di':unlock>=15?'xuan':unlock>=10?'huang':'fan'}
function tier(unlock,artifact=false){if(artifact)return unlock>=21?'gubao':'fabao';return unlock>=15?'lingqi':unlock>=10?'faqi-high':'faqi'}
function forgeCost(unlock,artifact=false,adj={}){const base={stones:Math.max(8,8+unlock*4)+(artifact?30:0),materials:Math.max(4,4+Math.floor(unlock*.7))+(artifact?5:0),rare:unlock>=10?1+Math.floor((unlock-10)/4)+(artifact?2:0):0,relic:artifact&&unlock>=19?1+Math.floor((unlock-19)/2):0,core:artifact&&unlock>=15&&unlock<19?1:0,nascent:artifact&&unlock>=19&&unlock<23?1:0,deification:artifact&&unlock>=23?1:0};for(const [k,v] of Object.entries(adj))base[k]=Math.max(0,(base[k]||0)+v);return base}
function B(itemId,name,slot,unlock,path,sources,stats,passive={},adj={},legacyKey=null){return {itemId,name,kind:'equipment',slot,artifactId:null,artifactSlot:null,trueArtifact:false,tier:tier(unlock,false),qualityId:quality(unlock),unlock,path:path||'none',sources:[...sources],days:Math.max(2,2+Math.floor(unlock/7)),cost:forgeCost(unlock,false,adj),stats:{atk:0,def:0,hp:0,qi:0,spell:0,...stats},passive:{...passive},active:null,buildPassive:false,legacyKey}}
function A(itemId,artifactId,name,artifactSlot,unlock,path,sources,stats,passive,active,adj={},legacyKey=null,legacySlot=null){return {itemId,artifactId,name,kind:'artifact',slot:legacySlot,legacySlot,artifactSlot,trueArtifact:true,tier:tier(unlock,true),qualityId:quality(unlock),unlock,path:path||'none',sources:[...sources],days:Math.max(4,4+Math.floor((unlock-14)/3)),cost:forgeCost(unlock,true,adj),stats:{atk:0,def:0,hp:0,qi:0,spell:0,...stats},passive:{...passive},active:active?{...active}:null,buildPassive:true,legacyKey}}
const rows=[
// 12 weapons
B('item-gear-qinggang','青钢剑','weapon',0,'none',SOURCES.village,{atk:5},{meleePct:.03},{stones:0,materials:0},'qinggang'),
B('item-v32-qingmu-sword','青木灵剑','weapon',1,'none',SOURCES.town,{atk:8,qi:6},{qiPct:.02}),
B('item-v32-redcopper-blade','赤铜火刃','weapon',3,'flame',SOURCES.chixia,{atk:12,spell:.02},{pathDamage:.04}),
B('item-v32-wavecleaver-sword','玄水分波剑','weapon',5,'none',SOURCES.marsh,{atk:16,qi:12},{flee:.04}),
B('item-v32-qingyun-lightblade','青云轻锋','weapon',10,'sword',SOURCES.qingyun,{atk:24,spell:.03},{pathDamage:.06}),
B('item-v32-fallingstar-spear','落星玄铁枪','weapon',12,'body',SOURCES.mine,{atk:29,def:2},{counter:.04}),
B('item-v32-arraybreaker-saber','破阵重刀','weapon',14,'body',SOURCES.high,{atk:34},{execute:.07},{materials:2}),
B('item-v32-danfire-edge','丹火灵刃','weapon',15,'flame',SOURCES.chixia,{atk:39,spell:.05},{burnBoost:.08}),
B('item-v32-windchaser-sword','追风飞剑','weapon',16,'sword',SOURCES.qingyun,{atk:43,qi:30},{cooldownEdge:.05}),
B('item-v32-watermoon-sword','云梦水月剑','weapon',17,'spirit',SOURCES.marsh,{atk:40,spell:.07},{controlBoost:.06}),
B('item-v32-beastbone-hammer','兽骨裂岳锤','weapon',18,'body',SOURCES.beast,{atk:52,hp:60},{meleePct:.08},{materials:3}),
B('item-v32-ancient-inscribed-sword','古河铭纹剑','weapon',20,'spirit',SOURCES.ruin,{atk:55,spell:.09},{artifactPower:.06},{relic:1}),
// 12 armors
B('item-gear-xuantie','玄铁护甲','armor',0,'none',SOURCES.town,{def:4},{incoming:-.02},{stones:0,materials:0},'xuantie'),
B('item-v32-vine-robe','青藤护衣','armor',1,'none',SOURCES.village,{def:5,hp:12},{healPct:.03}),
B('item-v32-cloudrobe','云纹法袍','armor',3,'spirit',SOURCES.city,{def:7,qi:18},{qiPct:.03}),
B('item-v32-redsand-breastplate','赤砂护心甲','armor',5,'flame',SOURCES.chixia,{def:9,hp:24},{burnResist:.06}),
B('item-v32-water-scale-mail','玄水鳞衣','armor',8,'none',SOURCES.marsh,{def:12,hp:32},{incoming:-.03}),
B('item-v32-qingyun-swordrobe','青云剑袍','armor',10,'sword',SOURCES.qingyun,{def:14,qi:30},{pathDamage:.04}),
B('item-v32-stariron-mail','落星玄甲','armor',12,'none',SOURCES.mine,{def:18,hp:55},{incoming:-.04}),
B('item-v32-beasthide-armor','万兽皮铠','armor',14,'body',SOURCES.beast,{def:21,hp:90},{hpPct:.05}),
B('item-v32-danxia-flame-armor','丹霞火纹甲','armor',15,'flame',SOURCES.chixia,{def:22,hp:80,spell:.02},{pathDamage:.05}),
B('item-v32-blacktortoise-inner','玄纹内甲','armor',18,'body',SOURCES.beast,{def:27,hp:130},{counter:.06}),
B('item-v32-ancient-spirit-robe','古河避灵袍','armor',20,'spirit',SOURCES.ruin,{def:25,qi:170},{incoming:-.05,controlResist:.08},{relic:1}),
B('item-v32-xuanyin-soul-armor','玄阴镇魂甲','armor',22,'spirit',SOURCES.xuanyin,{def:32,hp:160,qi:180},{soulResist:.12},{rare:1,relic:1}),
// 12 charms
B('item-gear-juling','聚灵玉佩','charm',0,'none',SOURCES.town,{hp:16,qi:8},{qiPct:.02},{stones:0,materials:0},'juling'),
B('item-v32-clearmind-talisman','清心木符','charm',1,'none',SOURCES.village,{hp:18,qi:14},{healPct:.03}),
B('item-v32-firejade-pendant','火玉坠','charm',3,'flame',SOURCES.chixia,{hp:22,qi:22,spell:.01},{pathDamage:.03}),
B('item-v32-water-spirit-pearl','水灵珠','charm',5,'none',SOURCES.marsh,{hp:28,qi:36},{qiPct:.04}),
B('item-v32-qingyun-sword-knot','青云剑穗','charm',10,'sword',SOURCES.qingyun,{hp:45,qi:55,spell:.02},{pathDamage:.05}),
B('item-v32-star-gathering-ring','落星纳灵环','charm',12,'none',SOURCES.mine,{hp:60,qi:90},{qiPct:.05}),
B('item-v32-beastblood-pendant','万兽血骨佩','charm',14,'body',SOURCES.beast,{hp:120,qi:35},{hpPct:.06}),
B('item-v32-danxia-warmjade','丹霞暖玉','charm',15,'flame',SOURCES.chixia,{hp:85,qi:110,spell:.03},{burnBoost:.06}),
B('item-v32-yunmeng-return-pearl','云梦回灵珠','charm',17,'none',SOURCES.marsh,{hp:95,qi:170},{qiPct:.08}),
B('item-v32-ancient-mind-mirror','古河识海镜','charm',19,'spirit',SOURCES.ruin,{hp:110,qi:260,spell:.04},{controlBoost:.08},{relic:1}),
B('item-v32-xuanyin-soulbell','玄阴定魂铃','charm',21,'spirit',SOURCES.xuanyin,{hp:130,qi:330,spell:.05},{soulResist:.10,controlBoost:.06},{rare:1}),
B('item-v32-heaven-mystery-pendant','化神天机佩','charm',23,'none',SOURCES.ruin,{hp:220,qi:520,spell:.08},{breakthrough:.02,artifactPower:.05},{rare:2,relic:2}),
// 8 assault artifacts
A('item-gear-danxia','artifact-danxia','赤霄丹剑','assault',15,'flame',SOURCES.chixia,{atk:45,spell:.10},{pathDamage:.08,artifactPower:.08},{type:'strike',power:1.55,cooldown:3}, {stones:10},'danxia','weapon'),
A('item-gear-taixu','artifact-taixu','太虚神剑','assault',23,'sword',SOURCES.ruin,{atk:95,spell:.22},{pathDamage:.12,artifactPower:.15},{type:'multi',power:.82,hits:3,cooldown:4},{rare:2,relic:1},'taixu','weapon'),
A('item-v32-sevenstar-swordcase','artifact-v32-sevenstar-swordcase','青云七星剑匣','assault',15,'sword',SOURCES.qingyun,{atk:38,qi:80},{pathDamage:.10,artifactPower:.08},{type:'multi',power:.62,hits:5,cooldown:5}),
A('item-v32-seaburn-pearl','artifact-v32-seaburn-pearl','赤霞焚海珠','assault',15,'flame',SOURCES.chixia,{spell:.13,qi:90},{burnBoost:.15,artifactPower:.09},{type:'burn',power:1.10,burn:4,cooldown:4}),
A('item-v32-armybreaker-shuttle','artifact-v32-armybreaker-shuttle','落星破军梭','assault',17,'none',SOURCES.mine,{atk:52,spell:.05},{execute:.16,artifactPower:.08},{type:'execute',power:1.20,executeBelow:.35,executeMult:1.8,cooldown:5}),
A('item-v32-mountainseal','artifact-v32-mountainseal','万兽镇岳印','assault',18,'body',SOURCES.beast,{atk:58,hp:120},{meleePct:.10,artifactPower:.08},{type:'strike',power:1.85,cooldown:4},{materials:3}),
A('item-v32-banbreaker-ruler','artifact-v32-banbreaker-ruler','古河断禁尺','assault',20,'spirit',SOURCES.ruin,{spell:.11,qi:160},{controlBoost:.10,artifactPower:.10},{type:'control',power:.95,control:1,cooldown:5},{relic:2}),
A('item-v32-souleater-banner','artifact-v32-souleater-banner','玄阴噬魂幡','assault',22,'spirit',SOURCES.xuanyin,{spell:.16,qi:220},{artifactPower:.14,soulDamage:.12},{type:'leech',power:1.25,drain:.28,cooldown:5},{rare:2,relic:2}),
// 8 guard artifacts
A('item-gear-xuangui','artifact-xuangui','玄龟灵甲','guard',19,'body',SOURCES.beast,{def:26,hp:180},{incoming:-.10,hpPct:.06},{type:'shield',shieldPct:.34,cooldown:5},{materials:2},'xuangui','armor'),
A('item-v32-watercurtain-umbrella','artifact-v32-watercurtain-umbrella','玄水天幕伞','guard',15,'none',SOURCES.marsh,{def:18,qi:80},{incoming:-.06},{type:'shield',shieldPct:.30,cooldown:4}),
A('item-v32-swordguard-wheel','artifact-v32-swordguard-wheel','青云护剑轮','guard',16,'sword',SOURCES.qingyun,{def:16,atk:18},{counter:.18,pathDamage:.05},{type:'counter',shieldPct:.18,counter:.45,cooldown:5}),
A('item-v32-firecloud-aegis','artifact-v32-firecloud-aegis','赤霞火云罩','guard',16,'flame',SOURCES.chixia,{def:17,spell:.06},{burnBoost:.08,incoming:-.04},{type:'shield',shieldPct:.24,burn:2,cooldown:4}),
A('item-v32-goldenbody-drum','artifact-v32-goldenbody-drum','万兽金身鼓','guard',18,'body',SOURCES.beast,{def:22,hp:200},{hpPct:.08,incoming:-.06},{type:'counter',shieldPct:.20,counter:.35,cooldown:4},{materials:3}),
A('item-v32-starshield','artifact-v32-starshield','落星星纹盾','guard',18,'none',SOURCES.mine,{def:28,hp:120},{incoming:-.08},{type:'shield',shieldPct:.38,cooldown:6}),
A('item-v32-boundary-stele','artifact-v32-boundary-stele','古河镇界碑','guard',21,'spirit',SOURCES.ruin,{def:30,qi:200},{controlResist:.16,incoming:-.07},{type:'domain',shieldPct:.22,control:1,cooldown:6},{relic:2}),
A('item-v32-nether-armor','artifact-v32-nether-armor','玄阴幽冥甲','guard',23,'spirit',SOURCES.xuanyin,{def:40,hp:300,qi:160},{incoming:-.11,laststand:true},{type:'shield',shieldPct:.48,cooldown:7},{rare:2,relic:2}),
// 8 support artifacts
A('item-gear-yuanshen','artifact-yuanshen','元神玉佩','support',19,'spirit',SOURCES.ruin,{hp:260,qi:420,spell:.06},{qiPct:.10,controlBoost:.08},null,{relic:1},'yuanshen','charm'),
A('item-v32-spiritgather-bottle','artifact-v32-spiritgather-bottle','聚灵宝瓶','support',15,'none',SOURCES.city,{qi:160},{qiPct:.10},{type:'qi',qiPct:.42,cooldown:5}),
A('item-v32-swordheart-mirror','artifact-v32-swordheart-mirror','青云剑心镜','support',15,'sword',SOURCES.qingyun,{atk:16,qi:80},{pathDamage:.09,cooldownEdge:.08},null),
A('item-v32-lifire-lamp','artifact-v32-lifire-lamp','赤霞离火灯','support',16,'flame',SOURCES.chixia,{spell:.08,qi:100},{burnBoost:.12,pathDamage:.06},{type:'burn',power:.72,burn:5,cooldown:5}),
A('item-v32-bloodsoul-cauldron','artifact-v32-bloodsoul-cauldron','万兽血魂鼎','support',18,'body',SOURCES.beast,{hp:220},{healPct:.14,hpPct:.06},{type:'heal',healPct:.34,cooldown:6},{materials:3}),
A('item-v32-canglan-pearl','artifact-v32-canglan-pearl','云梦沧澜珠','support',17,'none',SOURCES.marsh,{hp:120,qi:180},{healPct:.08,qiPct:.06},{type:'restore',healPct:.18,qiPct:.25,cooldown:5}),
A('item-v32-dao-compass','artifact-v32-dao-compass','古河问道盘','support',20,'spirit',SOURCES.ruin,{qi:260,spell:.07},{controlBoost:.10,artifactPower:.08},null,{relic:2}),
A('item-v32-boundary-lamp','artifact-v32-boundary-lamp','玄阴定界灯','support',23,'spirit',SOURCES.xuanyin,{hp:160,qi:380,spell:.08},{controlResist:.18,qiPct:.08},{type:'cleanse',healPct:.12,qiPct:.18,cooldown:6},{rare:2,relic:2})
];
if(rows.length!==60)throw new Error('V3.2 equipment catalog expected 60, got '+rows.length);
const ids=rows.map(x=>x.itemId),artifactIds=rows.filter(x=>x.trueArtifact).map(x=>x.artifactId),names=rows.map(x=>x.name);
if(new Set(ids).size!==ids.length||new Set(names).size!==names.length||new Set(artifactIds).size!==artifactIds.length)throw new Error('V3.2 duplicate ids or names');
if(rows.filter(x=>x.trueArtifact).length!==24)throw new Error('V3.2 true artifacts must equal 24');
if(rows.filter(x=>x.trueArtifact&&x.active).length<12)throw new Error('V3.2 needs at least 12 active artifacts');
if(rows.filter(x=>x.trueArtifact&&x.buildPassive).length<12)throw new Error('V3.2 needs at least 12 build passives');
module.exports=rows;
