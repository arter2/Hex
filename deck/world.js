/* Hexmancers — the world. One table says what every area is: its name, its color, the boss that
   rules its last floor, and how it looks everywhere it is drawn (the cave around the battle board,
   the battle floor, the dungeon's stone and the camp scene). Everything else asks areaOf(depth),
   so the camp, the dungeon, the battle and the menus always agree on where you are.
   Each area is 4 floors deep and its 4th floor belongs to its boss: beat it and the stairs open
   into the next area. Half the enemies of an area share its color; the boss fits the place (a
   crystal golem in the glowing hollows, a treant splitting the gilded ruins, the Hollow King at
   the bottom of the Abyss). Areas run from gentlest to hardest boss; after the last one the
   cycle starts again, with tougher enemies. */

const DEPTHS_PER_AREA=4;
const AREAS=[
  {id:'hollows', name:'Glowworm Hollows', color:'verdant', boss:'golem',
   rock:'#151c22', wall:'#1d262f', lit:'#3a4c5a', glow:'#39ff8a', fog:'#0d3a2a', veins:'crystal',
   floor:{accent:'#39ff8a', moss:'#4f8a3a', detail:'moss'},
   stone:{rock:['#1c2328','#2c3740','#3e4c56','#56666f'], moss:'#3f7a3a', spark:'#39ff8a', detail:'moss'},
   camp:{tint:'#1d262f', dots:['#39ff8a','#8fe4ff'], feature:'crystal'}},
  {id:'deeps', name:'Frozen Deeps', color:'frost', boss:'glacier',
   rock:'#122131', wall:'#182c42', lit:'#3a6488', glow:'#7fd4ff', fog:'#0e2f4f', veins:'ice',
   floor:{accent:'#e6f6ff', moss:'#bfeaff', detail:'frost'},
   stone:{rock:['#1a2836','#2a4054','#40607c','#7ea6c4'], moss:'#cfeeff', spark:'#e6f6ff', detail:'frost'},
   camp:{tint:'#1b3048', dots:['#8fe4ff','#eef3f6'], feature:'ice'}},
  {id:'vault', name:'Storm Vault', color:'storm', boss:'roc',
   rock:'#14131e', wall:'#1c1a2c', lit:'#3e3a60', glow:'#fff39a', fog:'#1e1a3a', veins:'storm',
   floor:{accent:'#fff39a', moss:'#5a52a0', detail:'sparks'},
   stone:{rock:['#16151f','#25233a','#383552','#524e72'], moss:'#5a52a0', spark:'#fff39a', detail:'sparks'},
   camp:{tint:'#1c1a2c', dots:['#fff39a','#8f86ff'], feature:'storm'}},
  {id:'rifts', name:'Ember Rifts', color:'fire', boss:'wyrm',
   rock:'#1c1210', wall:'#2a1814', lit:'#5a3024', glow:'#ff7a2a', fog:'#3a1408', veins:'lava',
   floor:{accent:'#ff9a3a', moss:'#7a2a12', detail:'embers'},
   stone:{rock:['#1e1412','#30201a','#463026','#5e4436'], moss:'#7a2a12', spark:'#ff8a3a', detail:'embers'},
   camp:{tint:'#2a1814', dots:['#ff7a2a','#ffd36a'], feature:'lava'}},
  {id:'ruins', name:'Gilded Ruins', color:'light', boss:'treant',
   rock:'#17191c', wall:'#22252a', lit:'#4a4f57', glow:'#f2c94c', fog:'#2a2410', veins:'gold',
   floor:{accent:'#f2c94c', moss:'#8a6a2a', detail:'inlay'},
   stone:{rock:['#1f1d1a','#33302b','#4a463e','#6a6458'], moss:'#8a6a2a', spark:'#f2c94c', detail:'gold'},
   camp:{tint:'#25272b', dots:['#f2c94c','#fff3b0'], feature:'gold'}},
  {id:'abyss', name:'The Abyss', color:'shadow', boss:'hollow',
   rock:'#07090b', wall:'#0d1115', lit:'#26303a', glow:'#e9fbff', fog:'#0a1a24', veins:'stars',
   floor:{accent:'#e9fbff', moss:'#3a2a56', detail:'stars'},
   stone:{rock:['#0b0d12','#161a22','#232a36','#38404e'], moss:'#3a2a56', spark:'#e9fbff', detail:'stars'},
   camp:{tint:'#0d1115', dots:['#eef3f6','#8fe4ff'], feature:'stars'}},
];
AREAS.forEach((a,i)=>a.index=i);
const areaIndex=d=>Math.floor((Math.max(1,d|0)-1)/DEPTHS_PER_AREA)%AREAS.length;
const areaOf=d=>AREAS[areaIndex(d)];
const isBossDepth=d=>(d|0)>0&&(d|0)%DEPTHS_PER_AREA===0;
// which floor of its area a depth is (1 to 4), and the boss depth that closes it
const areaFloor=d=>(Math.max(1,d|0)-1)%DEPTHS_PER_AREA+1;
const areaBossDepth=d=>Math.ceil(Math.max(1,d|0)/DEPTHS_PER_AREA)*DEPTHS_PER_AREA;
// "Frozen Deeps · floor 2 of 4", or "· boss floor" on the 4th
const areaLabel=d=>areaOf(d).name+' · '+(isBossDepth(d)?'boss floor':'floor '+areaFloor(d)+' of '+DEPTHS_PER_AREA);

if(typeof module!=='undefined') module.exports={DEPTHS_PER_AREA,AREAS,areaIndex,areaOf,isBossDepth,areaFloor,areaBossDepth,areaLabel};
