/* Hexmancers: hand-written card sets, one per color, from the color brief (docs/colors.md).
   A color listed here is built from this list instead of the generated names: each line is
   "Name | type | rarity | options", and the stats still come from cards.js (BUILD), so power
   follows rank and rarity like every other card. Rarity: c common, u uncommon, r rare,
   l legendary. Options (all optional):
     kw=burn      the card's keyword (- for none); without it one is rolled from the color's list
     shape= pattern= ward= boon= util= trap= env= ai= fx=   pick that variant of the type
     body=Dragon mod=Dire   creature art (summons); mach=Cannon   machine art (machines)
   The color's signature (starter) cards stay as they are and are not listed here. */
const CARD_SETS={

/* ---------------- Red · Fire: fire and the mountain ----------------
   Fire, volcanoes and cyclones; the forge, mining, guns and rockets; dragons, kitsune, oni and
   the beasts of the mountain; fury, meat and wine. Dwarf-like, Japanese-, Chinese- and
   Tibetan-like, Native American-like and Spanish (duende) folk. */
fire:`
Musket Shot | strike | c | shape=line kw=-
Flintlock Ball | strike | c | shape=line kw=push
Bottle Rocket | strike | c | shape=zigzag kw=burn
Skyrocket | strike | u | shape=diag kw=burn
Rocket Barrage | strike | r | shape=missiles kw=burn
Dragon's Breath | strike | r | shape=wedge kw=burn
Wyvern Spit | strike | u | shape=line kw=burn
Kitsune Foxfire | strike | u | shape=missiles kw=burn
Oni Club Swing | strike | u | shape=wedge kw=self
Minotaur Charge | strike | r | shape=dig kw=push
Bull Rush | strike | c | shape=dig kw=push
Pickaxe Strike | strike | c | shape=line kw=stun
Miner's Drill | strike | u | shape=dig kw=-
Forge Hammer Throw | strike | c | shape=line kw=stun
Red-Hot Rivet | strike | c | shape=line kw=burn
Molten Slag Spray | strike | u | shape=wedge kw=burn
Lava Jet | strike | c | shape=row kw=burn
Volcanic Vent | strike | r | shape=row kw=burn
Cyclone of Cinders | strike | r | shape=all kw=push
Fire Whirl | strike | u | shape=zigzag kw=push
Phoenix Feather | strike | u | shape=line kw=burn
Griffin Talon | strike | c | shape=line kw=-
Coyote's Trick Shot | strike | c | shape=diag kw=-
Goblin Slingshot | strike | c | shape=line kw=-
Gremlin Sparkler | strike | c | shape=zigzag kw=burn
Duende's Ember | strike | c | shape=line kw=burn
Shishi Roar | strike | u | shape=wedge kw=push
Iaido Slash | strike | r | shape=line kw=-
Flaming Shuriken | strike | c | shape=missiles kw=burn
Dragon Fist | strike | u | shape=line kw=push
Rockslide | strike | u | shape=all kw=stun
Obsidian Spear | strike | c | shape=line kw=-
Vampire's Kiss | strike | r | shape=line kw=drain
Purifying Flame | strike | l | shape=all kw=burn
Great Dragon's Roar | strike | l | shape=wedge kw=burn
Oni King's Kanabo | strike | l | shape=line kw=self

Dynamite Bundle | lob | c | pattern=single kw=push
Black Powder Keg | lob | u | pattern=burst kw=push
Grenado | lob | c | pattern=single kw=burn
Greek Fire Jar | lob | u | pattern=burst kw=burn
Volcano Bomb | lob | r | pattern=ring kw=burn
Lava Glob | lob | c | pattern=single kw=burn
Magma Geyser | lob | u | pattern=column kw=burn
Meteor Shard | lob | c | pattern=single kw=-
Firework Shell | lob | u | pattern=cross kw=burn
Paper Lantern Bomb | lob | c | pattern=burst kw=burn
Dragon Egg | lob | r | pattern=burst kw=burn
Goblin Bomb | lob | c | pattern=single kw=self
Gremlin Grenade | lob | c | pattern=cross kw=-
Mortar Round | lob | c | pattern=column kw=push
Cannonball | lob | u | pattern=single kw=push
Basalt Boulder | lob | c | pattern=single kw=stun
Rockfall | lob | u | pattern=row kw=stun
Phoenix Ash Bomb | lob | u | pattern=ring kw=burn
Sake Firebomb | lob | c | pattern=burst kw=burn
Thunder-Egg Geode | lob | u | pattern=single kw=stun
Cinder Cone | lob | r | pattern=ring kw=burn
Pyroclastic Cloud | lob | r | pattern=row kw=burn
Eruption | lob | l | pattern=burst kw=burn

Dwarven Shieldwall | ward | u | ward=wall
Forge-Iron Plate | ward | c | ward=barrier
Basalt Wall | ward | c | ward=wall
Obsidian Bulwark | ward | u | ward=wall
Wall of Fire | ward | c | ward=thorns
Lava Moat | ward | u | ward=thorns
Mountain Pass Gate | ward | r | ward=wall
Samurai Armor | ward | u | ward=barrier
Dragon Scale Shield | ward | r | ward=barrier
Oni Mask | ward | c | ward=thorns
Brimstone Rampart | ward | c | ward=wall
Anvil Guard | ward | c | ward=barrier
Great Wall Bricks | ward | r | ward=wall
Molten Shell | ward | l | ward=thorns

Bonfire | sentry | c | kw=burn
Forge Bellows | sentry | c | kw=-
Lava Totem | sentry | c | kw=burn
Shishi Guardian Statue | sentry | u | kw=push
Fox Lantern | sentry | u | kw=burn
Dragon Kiln | sentry | r | kw=burn
Smoking Chimney | sentry | c | kw=-
Torch Post | sentry | c | kw=burn
Fire Lookout Tower | sentry | u | kw=-
Goblin Flamethrower Post | sentry | u | kw=burn
Phoenix Nest | sentry | r | kw=burn

Battle Fury | boon | u | boon=pact
Blood Oath of the Oni | boon | r | boon=pact
Berserker's Rage | boon | c | boon=power
Forge Heat | boon | c | boon=power
Hot Coals Dash | boon | c | boon=haste
Fox's Quickness | boon | c | boon=haste
Dragon Heart | boon | r | boon=power
Hearty Feast | boon | c | boon=heal
Mulled Wine | boon | c | boon=regen
Smith's Focus | boon | u | boon=gauge
Molten Courage | boon | u | boon=courage
Mountain Strength | boon | u | boon=power
Kitsune Blessing | boon | u | boon=dodge
Phoenix Rebirth | boon | l | boon=intervene
War Drums | boon | c | boon=haste
Bull's Endurance | boon | u | boon=regen
Dwarven Ale | boon | c | boon=heal

Powder Horn | charge | c | fx=bolt kw=-
Musket Cartridges | charge | c | fx=bolt kw=push
Rocket Crate | charge | u | fx=lob kw=burn
Bandolier of Flares | charge | c | fx=bolt kw=burn
Ore Cart | charge | u | fx=lob kw=stun
Coal Sack | charge | c | fx=lob kw=burn
Goblin Junk Sack | charge | c | fx=lob kw=-
Rivet Pouch | charge | c | fx=bolt kw=-
Dragon Tooth Quiver | charge | r | fx=bolt kw=burn
Firecracker String | charge | c | fx=bolt kw=burn
Lantern Oil Flask | charge | u | fx=bolt kw=burn
Pistol Case | charge | u | fx=bolt kw=push
Blasting Caps | charge | u | fx=lob kw=push
Shishi Pearl | charge | r | fx=bolt kw=-
Fox-Fire Jar | charge | u | fx=bolt kw=burn
Wineskin of Flame | charge | c | fx=bolt kw=burn
Meteorite Fragments | charge | r | fx=lob kw=stun
Bottomless Powder Keg | charge | l | fx=lob kw=push

Prospector's Map | utility | c | util=draw
Miner's Lamp | utility | c | util=draw
Smith's Ledger | utility | u | util=draw
Cleansing Pyre | utility | u | util=cleanse
Smelting Crucible | utility | u | util=copy
Dragon's Riddle | utility | r | util=copy
Coyote's Trickery | utility | u | util=recall
Goblin Scavenge | utility | c | util=recall
Ancestor's Tale | utility | r | util=draw
Red Envelope | utility | c | util=draw

Landmine | trap | u | trap=blast
Powder Tripwire | trap | c | trap=blast
Iron Caltrops | trap | c | trap=spike
Magma Pit | trap | u | trap=spike kw=burn
Cave-In | trap | r | trap=blast kw=stun
Goblin Snare | trap | c | trap=snare
Fox Den Snare | trap | c | trap=snare
Minotaur's Labyrinth | trap | r | trap=snare
Ember Spike Pit | trap | c | trap=spike kw=burn
Firework Mine | trap | u | trap=blast kw=burn

Lava Field | environment | c | env=burn
Scorched Earth | environment | c | env=burn
Volcanic Ash Fall | environment | u | env=burn
Earthquake | environment | r | env=tremor
Rumbling Mine | environment | c | env=tremor
Fire Cyclone | environment | u | env=burn
Ember Rain | environment | c | env=burn
Sulfur Springs | environment | u | env=burn
Forge Floor | environment | c | env=burn
Rockslide Valley | environment | u | env=tremor
Mountain's Wrath | environment | r | env=tremor
Sea of Flames | environment | l | env=burn

Crown of the Volcano King | piece | l | kw=burn
Heart of the Phoenix | piece | l | kw=burn
Eye of the Dragon | piece | l | kw=burn
Anvil of the First Forge | piece | l | kw=stun
Tail of the Nine-Tailed Fox | piece | l | kw=push

Red Dragon Whelp | summon | u | ai=shooter body=Dragon mod=Tiny
Great Red Dragon | summon | l | ai=bomber body=Dragon mod=Dire
Wyvern | summon | r | ai=bomber body=Wyvern
Fire Drake | summon | u | ai=shooter body=Wyvern
Griffin | summon | r | ai=guardian body=Griffin mod=Noble
Phoenix | summon | l | ai=healer body=Phoenix
Phoenix Chick | summon | c | ai=healer body=Phoenix mod=Tiny
Kitsune | summon | r | ai=shooter body=Kitsune
Nine-Tailed Kitsune | summon | l | ai=shooter body=Kitsune mod=Ancient
Fire Fox | summon | c | ai=shooter body=Fox
Coyote Trickster | summon | u | ai=shooter body=Wolf mod=Sly
Ember Coyote | summon | c | ai=bomber body=Wolf
Shishi Lion-Dog | summon | u | ai=guardian body=Shishi
Oni Brute | summon | r | ai=guardian body=Oni
Red Oni | summon | u | ai=bomber body=Oni mod=Grim
Oni Warlord | summon | l | ai=guardian body=Oni mod=Dire
Minotaur | summon | r | ai=guardian body=Minotaur
Fire Bull | summon | c | ai=guardian body=Bull
Goblin Sapper | summon | c | ai=bomber body=Goblin
Goblin Gunner | summon | c | ai=shooter body=Goblin
Goblin Chieftain | summon | u | ai=guardian body=Goblin mod=Grim
Gremlin | summon | c | ai=bomber body=Gremlin
Gremlin Tinkerer | summon | u | ai=healer body=Gremlin mod=Clever
Duende | summon | u | ai=shooter body=Duende
Salamander | summon | c | ai=shooter body=Salamander
Lava Golem | summon | r | ai=guardian body=Golem mod=Stone
Magma Elemental | summon | u | ai=bomber body=Spirit
Dwarven Smith | summon | u | ai=healer body=Dwarf
Dwarven Miner | summon | c | ai=guardian body=Dwarf
Dwarven Musketeer | summon | c | ai=shooter body=Dwarf
Dwarven Rocketeer | summon | u | ai=bomber body=Dwarf
Mountain Hermit | summon | c | ai=healer body=Dwarf mod=Old
Samurai | summon | r | ai=guardian body=Knight
Ronin Archer | summon | u | ai=shooter body=Squire mod=Grim
Mountain Monk | summon | u | ai=healer body=Squire mod=Gentle
Tengu | summon | u | ai=shooter body=Tengu
Lantern Ghost | summon | c | ai=bomber body=Spirit mod=Lucky
Fire Vampire | summon | r | ai=shooter body=Vampire
Cinder Bat Swarm | summon | c | ai=shooter body=Bat
Cinder Hound | summon | c | ai=bomber body=Hound
Mole Miner | summon | c | ai=guardian body=Mole
Lava Beetle | summon | c | ai=guardian body=Beetle
Imperial Lung Dragon | summon | l | ai=shooter body=Lung
Firebird | summon | r | ai=healer body=Phoenix mod=Noble
Ember Imp | summon | c | ai=bomber body=Imp

Hand Cannon | machine | c | ai=turret mach=Cannon
Fire Lance Turret | machine | c | ai=turret mach=Crossbow
Goblin Gatling | machine | u | ai=repeater mach=Gatling
Rocket Battery | machine | u | ai=mortar mach=Catapult
Hwacha Rocket Cart | machine | r | ai=mortar mach=Engine
Dwarven Siege Cannon | machine | r | ai=turret mach=Cannon
Iron Barricade | machine | c | ai=bulwark mach=Barricade
Mine Cart Barricade | machine | c | ai=bulwark mach=Palisade
Gremlin Clockwork Drone | machine | c | ai=repeater mach=Drone
Dragon-Mouth Cannon | machine | u | ai=turret mach=Cannon
Volley Gun | machine | u | ai=repeater mach=Repeater
Ember Trebuchet | machine | u | ai=mortar mach=Trebuchet
Stone Bastion | machine | u | ai=bulwark mach=Bastion
Firework Launcher | machine | c | ai=mortar mach=Catapult
The Great Bombard | machine | l | ai=mortar mach=Cannon
`,
};
// "Name | type | rarity | k=v k=v" lines -> entries
function parseCardSet(text){ return text.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')).map(l=>{
  const [name,type,r,opts]=l.split('|').map(s=>s.trim()), e={name, type, rarity:{c:'common',u:'uncommon',r:'rare',l:'legendary'}[r], o:{}};
  for(const kv of (opts||'').split(/\s+/).filter(Boolean)){ const i=kv.indexOf('='); e.o[kv.slice(0,i)]=kv.slice(i+1); }
  return e; }); }
