window.__TAIXUAN_PATCH_V09__=function(src){
  const must=(pattern,replacement,label)=>{const next=src.replace(pattern,replacement);if(next===src)throw new Error('V0.9升级失败：'+label+' 未命中');src=next};
  must("const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='0.8.0';","const SAVE_KEY='xiuxian_world_v02'; const OLD_KEY='xiuxian_world_v01'; const VERSION='0.9.0';",'版本号');
  must("beastMaterials:0,gearOwned:[],equipped:{weapon:null,armor:null,charm:null}}","beastMaterials:0,gearOwned:[],equipped:{weapon:null,armor:null,charm:null},breakthroughPity:0,breakthroughAttempts:0}",'新角色破境字段');
  must("for(const k of ['weapon','armor','charm'])if(!(k in state.player.equipped))state.player.equipped[k]=null;","for(const k of ['weapon','armor','charm'])if(!(k in state.player.equipped))state.player.equipped[k]=null;if(state.player.breakthroughPity==null)state.player.breakthroughPity=0;if(state.player.breakthroughAttempts==null)state.player.breakthroughAttempts=0;if(state.player.progress>realm().need)state.player.progress=realm().need;",'旧存档破境迁移');
  must("state.player.progress+=n;addPersonal(`【天道酬勤】你消耗1点悟道，修为猛涨 ${n}。`","state.player.progress=Math.min(realm().need,state.player.progress+n);addPersonal(`【天道酬勤】你消耗1点悟道，修为猛涨 ${n}。`",'顿悟修为封顶');
  must("const gain=rint(35,70);state.player.progress+=gain;state.player.spiritStones","const gain=rint(35,70);state.player.progress=Math.min(realm().need,state.player.progress+gain);state.player.spiritStones",'古洞机缘封顶');
  must("state.player.progress+=gain;benefit='修为 +'+gain","state.player.progress=Math.min(realm().need,state.player.progress+gain);benefit='修为 +'+gain",'论道修为封顶');

  const breakthroughCode=`
function breakthroughChance(){
 if(state.player.realmIndex>=REALMS.length-1)return 0;const next=state.player.realmIndex+1;let base=state.player.realmIndex===0?.78:(next===10?.55:(next>10?.60:.72));const rootBonus=(root().mult-1)*.18,manualBonus=Math.min(.10,(state.player.manualProf||0)/2000),cheatBonus=.08,injuryPenalty=(state.player.injury||0)*.08,pity=(state.player.breakthroughPity||0)/100;return clamp(base+rootBonus+manualBonus+cheatBonus+pity-injuryPenalty,.25,.95)
}
function attemptBreakthrough(){
 if(state&&state.flags&&state.flags.dead)return showResult('此世已终','你已经身死道消。','bad');if(state.player.realmIndex>=REALMS.length-1)return showResult('已至当前极限','当前版本已经没有更高境界。');const need=realm().need;if(state.player.progress<need)return showResult('修为未满','当前修为尚未圆满，不能尝试突破。','bad');
 const oldRealm=realm().name,chance=breakthroughChance();state.player.breakthroughAttempts++;advanceDays(3);if(state.flags.dead)return;
 if(rand()<chance){state.player.progress=0;state.player.realmIndex++;state.player.breakthroughPity=0;state.player.hp=maxHp();state.player.qi=maxQi();const newRealm=realm().name;if(state.player.realmIndex===1&&!('火弹术'in state.player.spells)){state.player.spells['火弹术']=0;state.player.spells['御风步']=0;addPersonal('踏入炼气一层后，你终于能够驱使灵力，摸索出了火弹术与御风步。','major')}if(state.player.realmIndex===10){state.player.reputation+=8;addWorld(state.player.name+'成功筑基，正式跨过修真第一道大关。','major')}addPersonal('你闭关三日冲击瓶颈，终于由'+oldRealm+'突破至'+newRealm+'！','major');save();render();showResult('突破成功',oldRealm+' → '+newRealm+'\\n气血、灵力恢复至满值\\n破境感悟清零','good')}
 else{const oldProgress=state.player.progress,ratio=rint(78,90)/100;state.player.progress=Math.max(0,Math.floor(need*ratio));state.player.breakthroughPity=Math.min(32,(state.player.breakthroughPity||0)+8);let hurt='';if(rand()<.45){const old=state.player.injury||0;state.player.injury=clamp(old+1,0,3);state.player.hp=Math.max(1,Math.floor(state.player.hp*.72));if(state.player.injury>old)hurt='，伤势加重至'+injuryLabel()}const lost=Math.max(0,oldProgress-state.player.progress);addPersonal('你冲击'+oldRealm+'瓶颈失败，修为跌落 '+lost+'，但对瓶颈多了一层理解。','bad');save();render();showResult('突破失败','修为 -'+lost+'\\n破境感悟 +8%（当前 +'+state.player.breakthroughPity+'%）'+hurt+'\\n重新修至圆满后可再次尝试。','bad')}
}
function renderBreakthrough(){
 const box=$('breakthroughBox');if(!box)return;if(state.player.realmIndex>=REALMS.length-1){box.innerHTML='';return}if(state.player.progress<realm().need){box.innerHTML='';return}const pct=Math.round(breakthroughChance()*100),next=REALMS[state.player.realmIndex+1].name;box.innerHTML='<div class="urgent"><div class="urgent-title">【境界圆满】可尝试突破至 '+esc(next)+'</div><p>当前成功率 '+pct+'%。灵根、功法熟练度与天道酬勤提高成功率；伤势会降低成功率；失败积累的破境感悟会提高下一次机会。</p><div class="urgent-foot"><span>破境感悟 +'+(state.player.breakthroughPity||0)+'% · 已尝试 '+(state.player.breakthroughAttempts||0)+' 次</span><button class="mini-btn primary" data-breakthrough>尝试突破 · 3日</button></div></div>';const b=document.querySelector('[data-breakthrough]');if(b)b.onclick=attemptBreakthrough
}
`;
  must(/function cultivate\(\)\{[\s\S]*?\n\}\nfunction gather/,`function cultivate(){
 const base=rint(6,10),rootM=root().mult,manualM=manual().mult,cheatM=1.5,injuryM=[1,.90,.70,.48][clamp(state.player.injury||0,0,3)],gain=Math.max(1,Math.floor(base*rootM*manualM*cheatM*injuryM)),prof=rint(4,7)*2;const before=state.player.progress;state.player.progress=Math.min(realm().need,state.player.progress+gain);state.player.manualProf+=prof;addDiligence(3);advanceDays(1);const actual=state.player.progress-before,full=state.player.progress>=realm().need;addPersonal('你运转《'+state.player.manual+'》吐纳一日，修为 +'+Math.max(0,actual)+'，功法熟练度 +'+prof+'。'+(full?'当前境界已经圆满，可主动尝试破境。':''),full?'major':'good');save();render();showResult('吐纳修炼','修为 +'+Math.max(0,actual)+'\\n《'+state.player.manual+'》熟练度 +'+prof+(full?'\\n境界圆满：现在可以尝试突破。':''),'good')
}
${breakthroughCode}
function gather`,'取消自动突破并注入主动破境');
  must("renderUrgent();renderHomeLog();renderCharacter();renderSect();renderMap();renderMarket();renderAlchemy();renderGear();renderEvents();renderNPCs();","renderUrgent();renderBreakthrough();renderHomeLog();renderCharacter();renderSect();renderMap();renderMarket();renderAlchemy();renderGear();renderEvents();renderNPCs();",'破境界面挂载');
  if(!src.includes("const VERSION='0.9.0'"))throw new Error('V0.9升级失败：最终版本断言');
  return src;
};
