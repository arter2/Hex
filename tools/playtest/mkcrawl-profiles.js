// the crawl bots' styles: fighting (FIGHT, bot.js) and the map (MAP, crawl.js). Used by mkcrawl.js and puzzle-lab.js
const H=o=>({stick:true, human:Object.assign({reactMin:.3,tapMin:.25,blindTap:.1,chargeP:.08,release:.35,releaseSd:.1},o)});
const FIGHT={
  average:H({react:.65,reactSd:.15,reactMin:.35,notice:.86,fireRate:1.7,focusPause:.3,evalGap:[.3,.5],misTap:.06,comboSkill:.45,instantP:.6,castDelay:[.4,1.5],gaugeDelay:[.6,2.2],stickNoise:12,releaseSd:.14,flickP:.35}),
  good:H({react:.5,reactSd:.12,notice:.92,fireRate:2.2,focusPause:.2,evalGap:[.2,.4],misTap:.04,comboSkill:.75,instantP:.85,castDelay:[.3,1],gaugeDelay:[.4,1.4],stickNoise:7,flickP:.6}),
  fast:Object.assign(H({react:.5,reactSd:.12,notice:.9,fireRate:2.8,focusPause:.12,evalGap:[.2,.35],misTap:.05,comboSkill:.5,instantP:.7,castDelay:[.15,.5],gaugeDelay:[.2,.8],stickNoise:9,flickP:.75}),{fear:.55}),
  combo:H({react:.55,reactSd:.13,notice:.9,fireRate:2.0,focusPause:.2,evalGap:[.2,.4],misTap:.05,comboSkill:1,instantP:.85,castDelay:[.3,1],gaugeDelay:[.4,1.4],stickNoise:8,flickP:.5})};
FIGHT.shopaholic=FIGHT.good;
// on the map. cover: share of rooms seen before taking the stairs; floorMax: seconds before they head down anyway;
// wheel/memory/logic/care/lore: puzzle skills (chance of the right move); read: reading-speed factor; patience: frustration
// in 10 minutes that would make this player put the game down; hate: kinds of frustration this player feels double
const MAP={
  average:{deckStyle:'average',eye:.35,listen:.6,sellP:.6,rechargeAt:.34,statStyle:'average',cover:.8,floorMax:420,wander:3,searchP:.25,questP:.5,trialP:.6,spendP:.3,puzzleWill:.85,wheel:.6,memory:.8,logic:.6,care:.85,lore:.4,slow:1.4,read:1.2,
    drinkAt:.3,draughts:2,campAt:.4,strikeP:.2,backoff:1,route:{treasure:1,plain:.6,quiet:.8,peril:0},patience:30,campEvery:4,packsPerVisit:2,boosters:true,revealAll:false,learns:true,hate:{}},
  good:{deckStyle:'good',eye:.55,listen:.9,sellP:.9,rechargeAt:.5,statStyle:'good',cover:.95,floorMax:600,wander:1,searchP:.55,questP:.7,trialP:.9,spendP:.4,puzzleWill:1,wheel:.92,memory:.9,logic:.9,care:.95,lore:.7,slow:1,read:.9,
    drinkAt:.35,draughts:3,campAt:.5,strikeP:.6,backoff:0,route:{treasure:1,peril:.9,plain:.4,quiet:.3},patience:45,campEvery:4,packsPerVisit:2,boosters:false,revealAll:false,learns:true,hate:{}},
  fast:{deckStyle:'fast',eye:.25,listen:.4,sellP:.5,rechargeAt:.25,statStyle:'fast',cover:.45,floorMax:200,wander:1,searchP:.08,questP:.15,trialP:.5,spendP:.2,puzzleWill:.45,wheel:.75,memory:.75,logic:.7,care:.8,lore:.3,slow:.7,read:.4,
    drinkAt:.25,draughts:2,campAt:.3,strikeP:.5,backoff:0,route:{quiet:1,plain:.8,peril:.5,treasure:.2},patience:22,campEvery:6,packsPerVisit:2,boosters:false,revealAll:true,learns:false,
    hate:{'dead time':2,popups:2,'puzzle:slow':2,'fight:long':1.5,'floor:long':2,lost:1.5,stuck:1.5}},
  combo:{deckStyle:'combo',eye:.45,listen:.75,sellP:.8,rechargeAt:.5,statStyle:'combo',cover:.85,floorMax:480,wander:2,searchP:.35,questP:.5,trialP:.8,spendP:.35,puzzleWill:.9,wheel:.97,memory:.85,logic:.85,care:.9,lore:.6,slow:1.1,read:1,
    drinkAt:.3,draughts:2,campAt:.45,strikeP:.4,backoff:0,route:{treasure:1,plain:.6,peril:.6,quiet:.4},patience:40,campEvery:4,packsPerVisit:2,boosters:false,revealAll:false,learns:true,hate:{}},
};
MAP.shopaholic=Object.assign({},MAP.good,{shopaholic:true,spendP:.9,questP:.6,route:{treasure:1.5,plain:.5,peril:.5,quiet:.3},revealAll:false,patience:35,campEvery:3});
module.exports={FIGHT,MAP};
