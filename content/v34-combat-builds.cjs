const E=(id,name,kind,realm,hp,atk,stones,herbs,rep,weight,areas,mechanic)=>({id,name,kind,realm,hp,atk,reward:{stones,herbs,rep},weight,areas,mechanic});
const enemies=[
 E('enemy-v34-rabid-badger','青石狂獾','野兽',1,90,[10,16],[2,5],[0,1],2,16,['青石村','青石镇'],{id:'mechanic-opening-charge',type:'opening-charge',name:'开场冲撞',desc:'首回合反击更凶猛。',openingDamage:1.45}),
 E('enemy-v34-blackwind-spider','黑风毒蛛','妖兽',4,150,[16,25],[4,8],[1,2],4,12,['黑风岭'],{id:'mechanic-venom',type:'venom',name:'蚀脉毒牙',desc:'命中后留下数回合毒伤。',dotPct:.025,dotTurns:3}),
 E('enemy-v34-yunmeng-water-spirit','云梦水灵','精怪',5,185,[18,28],[5,9],[1,3],5,10,['云梦泽'],{id:'mechanic-regeneration',type:'regeneration',name:'水泽再生',desc:'每回合恢复少量气血。',regenPct:.045}),
 E('enemy-v34-cangwu-spellbreaker','苍梧破法客','修士',8,260,[27,40],[9,16],[1,2],8,8,['苍梧郡城','临江城'],{id:'mechanic-qi-burn',type:'qi-burn',name:'破法截灵',desc:'反击时抽离玩家灵力。',qiDrainPct:.08}),
 E('enemy-v34-chixia-flame-scorpion','赤霞焰蝎','妖兽',10,360,[38,55],[13,22],[2,4],11,7,['赤霞谷'],{id:'mechanic-scorching-tail',type:'scorch',name:'灼尾',desc:'命中后留下灼伤。',dotPct:.03,dotTurns:2}),
 E('enemy-v34-fallingstar-stone-puppet','落星石傀','傀儡',11,470,[43,61],[16,27],[0,2],13,7,['落星矿脉'],{id:'mechanic-heavy-armor',type:'armor',name:'星铁重甲',desc:'持续削减玩家造成的直接伤害。',damageReduction:.22}),
 E('enemy-v34-qingyun-sword-puppet','青云试剑傀','傀儡',12,520,[48,68],[18,30],[0,2],14,6,['青云山'],{id:'mechanic-sword-counter',type:'reflect',name:'借力反剑',desc:'受到高伤害后反震部分伤害。',reflectPct:.16}),
 E('enemy-v34-yunmeng-mirage-demon','云梦蜃妖','妖兽',13,610,[55,78],[21,34],[2,4],16,6,['云梦泽'],{id:'mechanic-mirage-phase',type:'phase',name:'蜃影虚化',desc:'每三回合进入虚化，大幅降低一次直接伤害。',every:3,damageReduction:.58}),
 E('enemy-v34-blackwind-bloodfiend','黑风血煞修','修士',14,720,[64,88],[25,40],[1,3],19,5,['黑风岭','赤霞谷'],{id:'mechanic-blood-berserk',type:'berserk',name:'血煞狂化',desc:'低血量时伤害显著提高。',threshold:.5,mult:.52}),
 E('enemy-v34-chixia-molten-spirit','赤霞熔火灵','精怪',15,860,[76,104],[30,46],[3,5],22,5,['赤霞谷'],{id:'mechanic-fire-immunity',type:'burn-immunity',name:'熔火之躯',desc:'免疫灼烧，并削弱火道直伤。',pathResist:'flame',damageReduction:.24}),
 E('enemy-v34-fallingstar-magnetic-beast','落星磁煞兽','妖兽',16,1010,[88,118],[34,52],[2,4],25,4,['落星矿脉'],{id:'mechanic-artifact-suppression',type:'artifact-resist',name:'磁煞扰器',desc:'法宝主动攻击对其效果明显降低。',damageReduction:.38}),
 E('enemy-v34-beast-king-kong-ape','万兽金刚猿','妖兽',17,1220,[102,138],[40,60],[4,7],30,4,['万兽山脉'],{id:'mechanic-multi-strike',type:'multi-strike',name:'金刚连击',desc:'反击会连续爆发，伤害高于同境常规敌人。',mult:.38}),
 E('enemy-v34-ancient-river-seal-spirit','古河禁制灵','禁制灵',18,1460,[118,158],[48,70],[3,6],36,4,['古河遗迹'],{id:'mechanic-cooldown-tax',type:'cooldown-tax',name:'禁制迟滞',desc:'反击会延长玩家术法冷却。',cooldownTax:1}),
 E('enemy-v34-xuanyin-devouring-ghost','玄阴噬灵鬼','阴物',19,1780,[140,184],[58,84],[4,7],44,3,['玄阴禁地'],{id:'mechanic-soul-drain',type:'soul-drain',name:'噬灵',desc:'抽取灵力并以此恢复自身。',qiDrainPct:.10,healPct:.035}),
 E('enemy-v34-beast-undying-lizard','万兽不死蜥王','妖兽',20,2240,[168,218],[70,100],[5,9],55,3,['万兽山脉'],{id:'mechanic-laststand-regen',type:'laststand-regen',name:'断尾再生',desc:'低血量时再生显著加强。',regenPct:.035,threshold:.42,lowRegenPct:.085}),
 E('enemy-v34-ancient-river-mirror-soul','古河镜魂','阴物',21,2720,[198,258],[84,118],[5,9],68,3,['古河遗迹'],{id:'mechanic-mirror-soul',type:'mirror',name:'镜魂反照',desc:'每隔数回合反射一次玩家直伤。',every:3,reflectPct:.24}),
 E('enemy-v34-xuanyin-soul-seizer','玄阴摄魂使','阴物',22,3350,[236,305],[102,142],[6,11],84,2,['玄阴禁地'],{id:'mechanic-control-resist',type:'control-resist',name:'定魂锁识',desc:'对控制、封印和神魂压制有高抗性。',controlReduction:1,soulSealReduction:1}),
 E('enemy-v34-ancient-river-domain-warden','古河法域守灵','禁制灵',23,4280,[292,372],[132,180],[7,13],104,2,['古河遗迹'],{id:'mechanic-domain-pressure',type:'domain-pressure',name:'古禁法域',desc:'周期性压制闪避与护盾，并增加术法冷却。',every:3,cooldownTax:1,shieldCut:.22}),
 E('enemy-v34-xuanyin-deification-yaksha','玄阴化神夜叉','阴物',24,5480,[360,458],[172,232],[8,15],132,1,['玄阴禁地'],{id:'mechanic-execute',type:'execute',name:'斩命夜叉',desc:'玩家低血量时反击伤害大幅提高。',threshold:.36,mult:.65})
];
const B=(id,name,path,role,manuals,skills,passive,bonus,desc)=>({id,name,path,role,manuals,skills,passive,bonus,desc});
const builds=[
 B('build-sword-burst','剑心绝杀流','sword','爆发 / 斩杀',['manual-taibai-sword','manual-qingyun-sword'],['spell-sword-qi-slash','spell-myriad-sword-return','spell-one-sword-mountain'],'spell-clear-sword-heart-passive',{categories:['sword-attack','multi-hit','execute'],damage:.18,artifact:.08},'先以多段剑光削血，再用一剑断岳完成斩杀，重视飞剑与攻伐法宝。'),
 B('build-sword-array','剑阵封锁流','sword','控制 / 反制',['manual-small-circuit-sword','manual-taibai-sword'],['spell-sword-guard','spell-armorbreak-sword-intent','spell-sword-array-lock'],'spell-clear-sword-heart-passive',{categories:['control','debuff','counter'],damage:.11,control:1,incoming:-.05},'以破甲剑意和剑阵制造破绽，靠御剑护身与反制稳定拉长战线。'),
 B('build-flame-dot','真火蚀脉流','flame','持续灼烧',['manual-scarlet-meridian','manual-chixia-heavenfire'],['spell-flame-serpent','spell-fire-wall','spell-karma-soulfire'],'spell-flame-meridian-passive',{categories:['damage-over-time','soul-attack'],damage:.16,burn:1,burnDamage:.28},'依靠持续真火层层侵蚀，适合对付高血量敌人。'),
 B('build-flame-burst','炎阳爆燃流','flame','范围 / 爆发',['manual-ninefold-sun','manual-danxia-golden'],['spell-explosion-ring','spell-inferno-sea','spell-nirvana-ember'],'spell-flame-meridian-passive',{categories:['burst','area','laststand'],damage:.20,incoming:.06},'用高额反噬换爆发，濒危时依靠涅槃余烬续命。'),
 B('build-body-bastion','金刚反震流','body','硬抗 / 反击',['manual-vajra-body','manual-mountain-body'],['spell-vajra-guard','spell-immovable-king','spell-reflection-gang'],'spell-savage-blood-passive',{categories:['shield','counter','body-attack'],damage:.10,incoming:-.12,counter:.10},'堆叠气血与减伤，以护体、反震和正面硬撼消耗敌人。'),
 B('build-body-berserk','蛮血重击流','body','重击 / 狂战',['manual-undying-body','manual-beast-body'],['spell-war-stomp','spell-heavenshake-triple','spell-earthshaking-fist'],'spell-savage-blood-passive',{categories:['buff','multi-hit','body-attack'],damage:.21,melee:.14,incoming:.03,rage:1},'用狂战踏拉高后续重击，低灵力依赖但承伤更激进。'),
 B('build-spirit-seal','太虚封禁流','spirit','控制 / 法域',['manual-nether-soul','manual-darkwater-spirit'],['spell-bewildering-mist','spell-soul-fixing-curse','spell-taixu-godseal-domain'],'spell-one-soul-passive',{categories:['control','seal','domain'],damage:.12,control:1,incoming:-.04},'连续封锁敌人反击并扩大法域优势，适合危险高阶敌人。'),
 B('build-spirit-drain','紫霄夺魂流','spirit','神魂 / 吸取',['manual-purple-thunder-spirit','manual-taixu-spirit'],['spell-soul-shock-needle','spell-thought-seize','spell-primordial-outbody'],'spell-one-soul-passive',{categories:['soul-attack','drain'],damage:.19,drain:.28,qiRestore:.05},'以神魂直伤和摄念夺神维持气血灵力，追求持续压制。')
];
if(enemies.length!==19)throw new Error('V3.4 new enemy count must be 19');
if(new Set(enemies.map(x=>x.id)).size!==19||new Set(enemies.map(x=>x.name)).size!==19)throw new Error('V3.4 enemy ids or names duplicate');
if(new Set(enemies.map(x=>x.mechanic.id)).size<12)throw new Error('V3.4 independent mechanics must be >=12');
if(builds.length!==8)throw new Error('V3.4 build count must be 8');
for(const path of ['sword','flame','body','spirit'])if(builds.filter(x=>x.path===path).length<2)throw new Error('V3.4 each path needs two builds: '+path);
module.exports={enemies,builds};
