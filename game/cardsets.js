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
Musket Shot | strike | c | shape=snipe rider=crit
Flintlock Ball | strike | c | shape=twin kw=push cast=charged
Bottle Rocket | strike | c | shape=missiles kw=push cast=quick
Skyrocket | strike | u | shape=missiles kw=stun rider=onkill
Rocket Barrage | strike | r | shape=missiles kw=burn
Dragon's Breath | strike | r | shape=fan kw=burn rider=pierce
Wyvern Spit | strike | u | shape=spear cast=quick
Kitsune Foxfire | strike | u | shape=cluster kw=burn rider=crit cast=charged cluster=ring
Oni Club Swing | strike | u | shape=wedge kw=self rider=crit cast=quick
Minotaur Charge | strike | r | shape=spear kw=push rider=recoil
Bull Rush | strike | c | shape=line kw=push rider=recoil cast=quick
Pickaxe Strike | strike | c | shape=burst kw=stun rider=crit
Miner's Drill | strike | u | shape=mine
Forge Hammer Throw | strike | c | shape=spear kw=stun rider=pierce
Red-Hot Rivet | strike | c | shape=snipe kw=burn rider=recoil
Molten Slag Spray | strike | u | shape=fan kw=slow rider=pierce cast=quick
Lava Jet | strike | c | shape=row kw=slow
Volcanic Vent | strike | r | shape=row kw=burn rider=crit
Cyclone of Cinders | strike | r | shape=all kw=push
Fire Whirl | strike | u | shape=zigzag kw=push rider=pierce
Phoenix Feather | strike | u | shape=snipe kw=mend rider=onkill
Griffin Talon | strike | c | shape=twin rider=onkill
Coyote's Trick Shot | strike | c | shape=line rider=pierce
Goblin Slingshot | strike | c | shape=spear kw=self rider=onkill
Gremlin Sparkler | strike | c | shape=chain kw=confuse cast=quick
Duende's Ember | strike | c | shape=boomerang kw=confuse cast=charged
Shishi Roar | strike | u | shape=shockwave kw=push rider=onkill
Iaido Slash | strike | r | shape=wedge rider=crit cast=charged
Flaming Shuriken | strike | c | shape=cluster kw=burn rider=recoil cast=quick cluster=x
Dragon Fist | strike | u | shape=wedge kw=push rider=crit
Rockslide | strike | u | shape=wave kw=stun
Obsidian Spear | strike | c | shape=spear kw=self rider=pierce cast=quick
Vampire's Kiss | strike | r | shape=line kw=drain
Purifying Flame | strike | l | shape=all kw=burn rider=onkill
Great Dragon's Roar | strike | l | shape=shockwave kw=burn cast=charged
Oni King's Kanabo | strike | l | shape=line kw=self rider=crit

Dynamite Bundle | lob | c | pattern=single fuse=quick after=knock
Black Powder Keg | lob | u | pattern=burst fuse=quick kw=push after=ground
Grenado | lob | c | pattern=single kw=push
Greek Fire Jar | lob | u | pattern=burst fuse=heavy kw=burn after=ground
Volcano Bomb | lob | r | pattern=ring fuse=heavy kw=burn
Lava Glob | lob | c | pattern=single fuse=quick kw=burn after=ground
Magma Geyser | lob | u | pattern=column kw=burn after=knock
Meteor Shard | lob | c | pattern=single fuse=heavy after=ground
Firework Shell | lob | u | pattern=cross kw=confuse after=ground
Paper Lantern Bomb | lob | c | pattern=burst fuse=heavy kw=confuse after=knock
Dragon Egg | lob | r | pattern=burst fuse=quick kw=burn after=knock
Goblin Bomb | lob | c | pattern=single fuse=heavy kw=self
Gremlin Grenade | lob | c | pattern=cross fuse=quick
Mortar Round | lob | c | pattern=column fuse=quick kw=push after=knock
Cannonball | lob | u | pattern=single fuse=heavy kw=push after=knock
Basalt Boulder | lob | c | pattern=single kw=stun after=knock
Rockfall | lob | u | pattern=row fuse=quick kw=stun after=knock
Phoenix Ash Bomb | lob | u | pattern=ring fuse=heavy kw=mend after=knock
Sake Firebomb | lob | c | pattern=burst kw=self after=knock
Thunder-Egg Geode | lob | u | pattern=single fuse=quick kw=stun
Cinder Cone | lob | r | pattern=ring kw=burn after=ground
Pyroclastic Cloud | lob | r | pattern=row fuse=quick kw=burn
Eruption | lob | l | pattern=burst kw=burn

Dwarven Shieldwall | ward | u | form=shield len=short
Forge-Iron Plate | ward | c | form=shield build=heavy wfx=burning len=short
Basalt Wall | ward | c | form=arc len=long
Obsidian Bulwark | ward | u | form=rampart
Wall of Fire | ward | c | build=heavy wfx=thorns len=short form=line
Lava Moat | ward | u | form=corridor build=light wfx=burning
Mountain Pass Gate | ward | r | form=corridor build=heavy len=short
Samurai Armor | ward | u | form=shield build=light len=long
Dragon Scale Shield | ward | r | form=shield build=heavy
Oni Mask | ward | c | wfx=thorns len=long form=line
Brimstone Rampart | ward | c | form=rampart wfx=burning len=short
Anvil Guard | ward | c | form=shield build=light wfx=thorns
Great Wall Bricks | ward | r | form=rampart build=heavy len=long
Molten Shell | ward | l | form=cage build=heavy wfx=thorns len=long

Bonfire | sentry | c | beh=chain tier=sturdy speed=quick kw=burn
Forge Bellows | sentry | c | beh=snipe tier=sturdy speed=steady kw=push trait=explodes
Lava Totem | sentry | c | beh=empower tier=sturdy speed=steady
Shishi Guardian Statue | sentry | u | beh=guards tier=tough speed=slow kw=push trait=explodes
Fox Lantern | sentry | u | beh=mends tier=tough speed=quick trait=bloodlust
Dragon Kiln | sentry | r | beh=cone tier=sturdy speed=steady kw=burn trait=bloodlust
Smoking Chimney | sentry | c | beh=chain tier=sturdy speed=steady kw=push trait=forged
Torch Post | sentry | c | beh=bolt tier=sturdy speed=frantic kw=burn trait=explodes
Fire Lookout Tower | sentry | u | beh=snipe tier=sturdy speed=steady trait=scorched
Goblin Flamethrower Post | sentry | u | beh=lob tier=sturdy speed=slow kw=burn trait=bloodlust
Phoenix Nest | sentry | r | beh=summoner tier=sturdy speed=steady kw=burn trait=scorched

Battle Fury | boon | u | boon=pact len=long side=scorch timing=echo
Blood Oath of the Oni | boon | r | boon=pact len=long side=embers
Berserker's Rage | boon | c | boon=power len=long side=scorch
Forge Heat | boon | c | boon=power len=long timing=echo
Hot Coals Dash | boon | c | boon=haste len=long
Fox's Quickness | boon | c | boon=haste len=short timing=delayed
Dragon Heart | boon | r | boon=power side=embers timing=delayed
Hearty Feast | boon | c | boon=heal side=embers
Mulled Wine | boon | c | boon=regen len=short timing=echo
Smith's Focus | boon | u | boon=gauge timing=echo
Molten Courage | boon | u | boon=courage len=long timing=delayed
Mountain Strength | boon | u | boon=power side=scorch timing=echo
Kitsune Blessing | boon | u | boon=dodge timing=delayed
Phoenix Rebirth | boon | l | boon=intervene
War Drums | boon | c | boon=haste len=short side=embers timing=echo
Bull's Endurance | boon | u | boon=regen len=short side=scorch timing=delayed
Dwarven Ale | boon | c | boon=heal side=scorch timing=delayed

Powder Horn | charge | c | shot=bolt uses=few kw=push
Musket Cartridges | charge | c | shot=bolt uses=many kw=push edge=crit
Rocket Crate | charge | u | shot=lob kw=push edge=crit
Bandolier of Flares | charge | c | shot=bolt uses=many kw=confuse edge=splash
Ore Cart | charge | u | shot=lob uses=few kw=stun
Coal Sack | charge | c | shot=lob uses=few edge=splash
Goblin Junk Sack | charge | c | shot=lob
Rivet Pouch | charge | c | shot=bolt edge=pierce
Dragon Tooth Quiver | charge | r | shot=bolt uses=many
Firecracker String | charge | c | shot=burst kw=push edge=pierce
Lantern Oil Flask | charge | u | shot=bolt kw=burn
Pistol Case | charge | u | shot=bolt kw=push edge=splash
Blasting Caps | charge | u | shot=lob uses=few kw=push edge=pierce
Shishi Pearl | charge | r | shot=bolt uses=few edge=crit
Fox-Fire Jar | charge | u | shot=bolt uses=few kw=burn edge=pierce
Wineskin of Flame | charge | c | shot=burst uses=few edge=pierce
Meteorite Fragments | charge | r | shot=lob kw=stun edge=pierce
Bottomless Powder Keg | charge | l | shot=lob uses=many kw=push

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

Landmine | trap | u | trap=blast len=short size=three
Powder Tripwire | trap | c | trap=blast
Iron Caltrops | trap | c | trap=spike len=long size=three
Magma Pit | trap | u | trap=spike kw=burn size=three
Cave-In | trap | r | trap=blast kw=stun size=three
Goblin Snare | trap | c | trap=snare size=three
Fox Den Snare | trap | c | trap=snare kw=burn len=short
Minotaur's Labyrinth | trap | r | trap=snare len=long
Ember Spike Pit | trap | c | trap=spike kw=push len=short size=three
Firework Mine | trap | u | trap=blast kw=push len=short

Lava Field | environment | c | env=burn pattern=cross len=long
Scorched Earth | environment | c | env=burn pattern=row len=long kw=push
Volcanic Ash Fall | environment | u | env=burn pattern=burst len=long kw=burn
Earthquake | environment | r | env=tremor pattern=burst
Rumbling Mine | environment | c | env=tremor pattern=burst len=long kw=push
Fire Cyclone | environment | u | env=burn pattern=burst kw=push
Ember Rain | environment | c | env=burn pattern=cross kw=burn
Sulfur Springs | environment | u | env=burn pattern=row
Forge Floor | environment | c | env=burn pattern=column len=short kw=burn
Rockslide Valley | environment | u | env=tremor pattern=column len=short
Mountain's Wrath | environment | r | env=tremor pattern=burst len=short kw=burn
Sea of Flames | environment | l | env=burn pattern=burst len=short

Crown of the Volcano King | piece | l | kw=burn
Heart of the Phoenix | piece | l | kw=mend
Eye of the Dragon | piece | l | kw=burn
Anvil of the First Forge | piece | l | kw=stun
Tail of the Nine-Tailed Fox | piece | l | kw=push

Red Dragon Whelp | summon | u | body=Dragon mod=Tiny beh=cone tier=frail speed=quick
Great Red Dragon | summon | l | body=Dragon mod=Dire beh=cone tier=sturdy speed=slow kw=burn trait=fury
Wyvern | summon | r | body=Wyvern beh=beam tier=sturdy speed=slow trait=forged
Fire Drake | summon | u | body=Wyvern beh=beam tier=sturdy speed=quick kw=burn trait=scorched
Griffin | summon | r | body=Griffin mod=Noble beh=guards tier=tough speed=steady trait=explodes
Phoenix | summon | l | body=Phoenix beh=cone tier=sturdy speed=slow trait=scorched
Phoenix Chick | summon | c | body=Phoenix mod=Tiny beh=cone tier=sturdy speed=slow kw=push trait=bloodlust
Kitsune | summon | r | body=Kitsune beh=pierce tier=sturdy speed=steady trait=fury
Nine-Tailed Kitsune | summon | l | body=Kitsune mod=Ancient beh=bolt tier=sturdy speed=steady trait=bloodlust
Fire Fox | summon | c | body=Fox beh=dash tier=tough speed=steady kw=burn trait=bloodlust
Coyote Trickster | summon | u | body=Wolf mod=Sly beh=dash tier=sturdy speed=steady kw=push trait=bloodlust
Ember Coyote | summon | c | body=Wolf beh=pounce tier=sturdy speed=slow kw=burn trait=explodes
Shishi Lion-Dog | summon | u | body=Shishi beh=pounce tier=tough speed=steady kw=push trait=bloodlust
Oni Brute | summon | r | body=Oni beh=pounce tier=tough speed=steady kw=burn trait=scorched
Red Oni | summon | u | body=Oni mod=Grim beh=trample tier=tough speed=slow trait=forged
Oni Warlord | summon | l | body=Oni mod=Dire beh=pounce tier=tough speed=steady trait=forged
Minotaur | summon | r | body=Minotaur beh=trample tier=tough speed=steady trait=bloodlust
Fire Bull | summon | c | body=Bull beh=trample tier=tough speed=steady kw=burn
Goblin Sapper | summon | c | body=Goblin beh=blast tier=sturdy speed=slow trait=bloodlust
Goblin Gunner | summon | c | body=Goblin beh=twin tier=sturdy speed=frantic kw=push
Goblin Chieftain | summon | u | body=Goblin mod=Grim beh=taunt tier=tough speed=steady kw=push trait=forged
Gremlin | summon | c | body=Gremlin beh=zigzag tier=frail speed=quick kw=push
Gremlin Tinkerer | summon | u | body=Gremlin mod=Clever beh=zigzag tier=frail speed=quick kw=burn trait=explodes
Duende | summon | u | body=Duende beh=pierce tier=sturdy speed=quick kw=burn trait=fury
Salamander | summon | c | body=Salamander beh=beam tier=sturdy speed=steady trait=explodes
Lava Golem | summon | r | body=Golem mod=Stone beh=guards tier=tough speed=slow kw=burn trait=scorched
Magma Elemental | summon | u | body=Spirit beh=blast tier=sturdy speed=slow kw=push trait=scorched
Dwarven Smith | summon | u | body=Dwarf beh=shields tier=sturdy speed=slow trait=explodes
Dwarven Miner | summon | c | body=Dwarf beh=burrow tier=tough speed=steady trait=scorched
Dwarven Musketeer | summon | c | body=Dwarf beh=pierce tier=sturdy speed=steady kw=push
Dwarven Rocketeer | summon | u | body=Dwarf beh=cross tier=sturdy speed=slow kw=push trait=fury
Mountain Hermit | summon | c | body=Dwarf mod=Old beh=shields tier=sturdy speed=quick
Samurai | summon | r | body=Knight beh=taunt tier=tough speed=steady trait=fury
Ronin Archer | summon | u | body=Squire mod=Grim beh=snipe tier=tough speed=steady
Mountain Monk | summon | u | body=Squire mod=Gentle beh=mends tier=sturdy speed=slow kw=push trait=forged
Tengu | summon | u | body=Tengu beh=twin tier=sturdy speed=steady kw=push trait=fury
Lantern Ghost | summon | c | body=Spirit mod=Lucky beh=mends tier=sturdy speed=quick kw=push trait=fury
Fire Vampire | summon | r | body=Vampire beh=bolt tier=sturdy speed=steady kw=push trait=scorched
Cinder Bat Swarm | summon | c | body=Bat beh=barrage tier=frail speed=frantic kw=burn trait=scorched
Cinder Hound | summon | c | body=Hound beh=dash tier=sturdy speed=slow kw=burn trait=forged
Mole Miner | summon | c | body=Mole beh=burrow tier=tough speed=steady kw=burn trait=fury
Lava Beetle | summon | c | body=Beetle beh=taunt tier=tough speed=slow kw=burn
Imperial Lung Dragon | summon | l | body=Lung beh=beam tier=frail speed=quick kw=push trait=explodes
Firebird | summon | r | body=Phoenix mod=Noble beh=mends tier=sturdy speed=slow kw=burn trait=scorched
Ember Imp | summon | c | body=Imp beh=zigzag tier=frail speed=slow kw=burn trait=scorched

Hand Cannon | machine | c | mach=Cannon beh=bolt tier=sturdy speed=frantic
Fire Lance Turret | machine | c | mach=Crossbow beh=pierce tier=sturdy speed=frantic kw=burn trait=scorched
Goblin Gatling | machine | u | mach=Gatling beh=pierce tier=sturdy speed=steady kw=burn trait=explodes
Rocket Battery | machine | u | mach=Catapult beh=zigzag tier=frail speed=quick trait=forged
Hwacha Rocket Cart | machine | r | mach=Engine beh=lob tier=sturdy speed=slow trait=fury
Dwarven Siege Cannon | machine | r | mach=Cannon beh=bolt tier=sturdy speed=steady kw=burn trait=forged
Iron Barricade | machine | c | mach=Barricade beh=wardmaker tier=huge speed=slow kw=burn
Mine Cart Barricade | machine | c | mach=Palisade beh=wardmaker tier=huge speed=slow kw=push trait=forged
Gremlin Clockwork Drone | machine | c | mach=Drone beh=guards tier=tough speed=slow
Dragon-Mouth Cannon | machine | u | mach=Cannon beh=twin tier=sturdy speed=steady kw=burn
Volley Gun | machine | u | mach=Repeater beh=bolt tier=sturdy speed=slow kw=push
Ember Trebuchet | machine | u | mach=Trebuchet beh=blast tier=sturdy speed=slow kw=burn
Stone Bastion | machine | u | mach=Bastion beh=wardmaker tier=huge speed=slow trait=bloodlust
Firework Launcher | machine | c | mach=Catapult beh=lob tier=huge speed=slow kw=burn trait=scorched
The Great Bombard | machine | l | mach=Cannon beh=lob tier=sturdy speed=slow kw=push trait=explodes
`,
/* ---------------- Blue · Frost: water, ice and the great unknown ---------------- */
frost:`
Harpoon Throw | strike | c | shape=spear kw=pull rider=pierce
Whaler's Harpoon | strike | u | shape=spear kw=pull cast=quick
Tidal Wave | strike | r | shape=wave kw=push rider=crit
Breaking Surf | strike | c | shape=row kw=push rider=crit cast=quick
Riptide | strike | u | shape=wave kw=pull cast=charged
Undertow | strike | c | shape=snipe kw=pull rider=crit
Maelstrom | strike | l | shape=all kw=pull rider=recoil
Hurricane's Eye | strike | l | shape=snipe kw=push
Typhoon Lash | strike | r | shape=zigzag kw=push rider=crit cast=charged
Narwhal Tusk | strike | c | shape=twin
Shark Bite | strike | c | shape=wedge rider=crit
Frenzy of Sharks | strike | u | shape=missiles kw=valor cast=quick
Cutlass Slash | strike | c | shape=wedge cast=quick
Boarding Axe | strike | c | shape=fan kw=stun rider=pierce
Grapeshot Volley | strike | u | shape=line kw=push cast=quick
Siren's Song | strike | u | shape=missiles kw=confuse rider=crit cast=quick
Lorelei's Lure | strike | r | shape=zigzag kw=pull
Kelpie's Plunge | strike | u | shape=line kw=pull rider=pierce cast=charged
Nixie's Whirlpool | strike | c | shape=zigzag kw=confuse rider=pierce
Frostbite | strike | c | shape=burst kw=freeze rider=crit
Blizzard Gale | strike | u | shape=fan kw=slow rider=crit
Avalanche Rush | strike | r | shape=line kw=stun rider=recoil cast=quick
Hailstone Barrage | strike | u | shape=column kw=stun rider=crit
Sleet Volley | strike | c | shape=gun kw=slow
Winter Wolf Fangs | strike | c | shape=fan kw=slow cast=quick
Yeti's Swipe | strike | c | shape=wedge kw=stun rider=recoil
Icebreaker Ram | strike | u | shape=spear kw=push rider=recoil cast=charged
Kappa's Sumo Shove | strike | c | shape=line kw=push rider=onkill cast=charged
Rusalka's Embrace | strike | r | shape=line kw=drain rider=onkill
Umibozu's Grasp | strike | r | shape=boomerang kw=pull rider=recoil cast=charged
Ningyo Scale Dart | strike | c | shape=snipe kw=mend cast=quick
Ice Skate Slash | strike | c | shape=burst rider=crit cast=charged
Glacier Calving | strike | u | shape=row kw=stun cast=quick
Waterspout | strike | u | shape=chain kw=push rider=recoil
Leviathan's Wake | strike | l | shape=row kw=push cast=charged
World Serpent's Coil | strike | l | shape=wave kw=stun
Bunyip's Bellow | strike | u | shape=wedge kw=confuse cast=charged
Leister Spear | strike | c | shape=spear rider=crit cast=quick

Twelve-Pound Shot | lob | c | pattern=single fuse=heavy kw=push after=knock
Chain Shot | lob | c | pattern=single fuse=heavy kw=slow
Powder Monkey's Keg | lob | u | pattern=burst fuse=heavy kw=push
Depth Charge | lob | u | pattern=burst fuse=heavy kw=stun after=ground
Frozen Comet | lob | r | pattern=burst fuse=heavy kw=freeze after=knock
Ice Floe Drop | lob | c | pattern=single fuse=quick kw=freeze after=ground
Geyser Burst | lob | u | pattern=column fuse=quick kw=push
Rain of Fish | lob | c | pattern=burst after=knock
Coconut Lob | lob | c | pattern=single kw=stun after=knock
Ink Cloud | lob | c | pattern=burst kw=confuse after=ground
Holy Water Flask | lob | u | pattern=burst fuse=quick kw=mend
Spring Water Gourd | lob | c | pattern=single fuse=heavy kw=mend after=ground
Hailstone Cross | lob | u | pattern=cross kw=stun after=ground
Whirlpool Ring | lob | r | pattern=ring fuse=heavy kw=pull after=ground
Falling Iceberg | lob | r | pattern=column fuse=quick kw=stun after=ground
Message in a Bottle | lob | c | pattern=single fuse=quick kw=confuse after=knock
Jellyfish Bloom | lob | u | pattern=burst fuse=quick kw=poison after=knock
Pufferfish Toss | lob | c | pattern=single fuse=quick kw=poison
Monsoon Downpour | lob | r | pattern=row kw=slow after=ground
Rogue Wave | lob | l | pattern=row fuse=quick kw=push after=knock

Sea Wall | ward | c | form=cage
Beaver Dam | ward | c | wfx=freezing form=line
Great Dam | ward | r | form=corridor build=heavy wfx=freezing len=long
Ice Palace Gate | ward | u | form=shield build=light wfx=freezing
Snow Fort | ward | c | len=long form=line
Igloo | ward | c | form=shield len=short
Coral Reef | ward | u | form=rampart build=light wfx=thorns
Sea Urchin Bed | ward | c | form=corridor wfx=thorns len=long
Bubble Shield | ward | c | form=shield wfx=thorns
Mirror of Still Water | ward | u | form=shield build=heavy
Kelp Curtain | ward | c | form=shield build=light len=long
Pack Ice Bulwark | ward | u | form=rampart wfx=freezing len=long
Walls of Ys | ward | l | form=shield build=light wfx=thorns len=short
Dome of Atlantis | ward | r | form=shield build=heavy wfx=freezing len=short

Inuksuk Watcher | sentry | c | beh=snipe tier=sturdy speed=steady kw=freeze trait=submerge
Lighthouse | sentry | u | beh=snipe tier=sturdy speed=steady trait=chilling
Ice Spike Totem | sentry | c | beh=empower tier=sturdy speed=steady kw=freeze trait=chilling
Narwhal Horn Totem | sentry | c | beh=empower tier=sturdy speed=steady kw=pull trait=tidal
Figurehead Sentinel | sentry | u | beh=taunt tier=tough speed=quick trait=shatter
Coral Spire | sentry | c | beh=chain tier=sturdy speed=quick kw=slow
Siren Rock | sentry | r | beh=bolt tier=sturdy speed=steady kw=freeze trait=tidal
Fountain of Youth | sentry | r | beh=snipe tier=sturdy speed=quick trait=shatter
Rime Giant Cairn | sentry | u | beh=lob tier=huge speed=slow kw=slow trait=chilling
Whale Bone Arch | sentry | c | beh=bolt tier=sturdy speed=quick kw=pull trait=tidal
Lantern of the Drowned | sentry | r | beh=mends tier=sturdy speed=steady trait=submerge
Tide Pole | sentry | c | beh=snipe tier=sturdy speed=steady kw=pull

Sea Legs | boon | c | boon=dodge side=chill timing=echo
Fair Winds | boon | c | boon=haste len=short
Grog Ration | boon | c | boon=heal side=rime timing=echo
Hot Spring Soak | boon | c | boon=regen timing=echo
Sauna Steam | boon | c | boon=regen len=long side=rime timing=echo
Cleansing Rain | boon | u | boon=heal side=chill timing=delayed
Polar Bear Plunge | boon | u | boon=power len=short timing=delayed
Mead of the Longhall | boon | u | boon=courage len=long
Selkie Skin | boon | r | boon=phase len=long side=chill
Become the Tide | boon | u | boon=phase len=long timing=delayed
Sorcerer's Trance | boon | u | boon=gauge side=chill
Sea Witch's Bargain | boon | r | boon=pact len=long side=rime
Blood Price of the Deep | boon | r | boon=pact
Northern Lights | boon | r | boon=gauge timing=delayed
Lucky Doubloon | boon | c | boon=dodge side=rime timing=delayed
Gift of the River Mother | boon | l | boon=intervene side=rime

Pirate's Pistol | charge | c | shot=bolt uses=few
Brace of Pistols | charge | u | shot=bolt kw=push edge=pierce
Harpoon Quiver | charge | c | shot=bolt uses=many kw=pull
Icicle Darts | charge | c | shot=bolt uses=few kw=freeze edge=splash
Snowball Stockpile | charge | c | shot=lob kw=slow edge=pierce
Cannon Shot Crate | charge | u | shot=lob uses=many kw=push edge=crit
Grapeshot Bag | charge | c | shot=lob uses=few edge=crit
Blowfish Spines | charge | c | shot=bolt uses=few kw=poison edge=pierce
Sea Urchin Quills | charge | c | shot=bolt uses=many edge=pierce
Conch Shell Blasts | charge | u | shot=bolt kw=confuse
Frozen Arrows | charge | c | shot=bolt uses=many kw=slow edge=splash
Hail Pouch | charge | c | shot=lob uses=few kw=stun
Bottled Waves | charge | u | shot=lob kw=push
Ice Javelins | charge | u | shot=bolt edge=splash
Rusalka's Tears | charge | r | shot=bolt kw=drain edge=crit
Ghost Ship Volley | charge | r | shot=lob uses=many kw=curse
Sorcerer's Orbs | charge | u | shot=bolt uses=few kw=confuse edge=crit
Glass Fishing Floats | charge | c | shot=lob uses=many edge=splash
Holy Spring Droplets | charge | u | shot=bolt uses=many kw=mend edge=crit
Narwhal Ivory Darts | charge | c | shot=burst uses=few edge=splash

Mirror Lake | utility | u | util=copy
Treasure Map | utility | c | util=draw
Spyglass | utility | c | util=draw
Captain's Log | utility | u | util=draw
Ritual Bath | utility | c | util=cleanse
Holy Spring | utility | u | util=cleanse
Ebb Tide | utility | c | util=recall
Return to the Sea | utility | u | util=recall
Water Mirror Twin | utility | r | util=copy
Sorcerer's Grimoire | utility | l | util=draw

Ice Hole | trap | c | trap=snare kw=freeze len=short size=three
Thin Ice | trap | c | trap=snare size=three
Hidden Reef | trap | c | trap=spike len=long
Fishing Net | trap | c | trap=snare kw=slow len=long
Sunken Mine | trap | u | trap=blast kw=push len=long size=three
Sea Mine | trap | u | trap=blast kw=stun len=long
Kelp Tangle | trap | c | trap=snare len=short
Ice Spike Pit | trap | u | trap=spike kw=freeze len=long size=three
Siren's Shoal | trap | r | trap=snare kw=confuse len=long size=three
Davy Jones' Locker | trap | l | trap=blast kw=drain len=short size=three

Frozen Lake | environment | c | env=freeze pattern=burst len=long kw=slow
Permafrost | environment | c | env=freeze pattern=row kw=slow
Black Ice | environment | u | env=freeze pattern=cross len=short
Snowfield | environment | c | env=freeze pattern=burst len=short kw=freeze
Tsunami Surge | environment | r | env=tremor pattern=row len=short
Rolling Breakers | environment | u | env=tremor pattern=row kw=freeze
Flood Plain | environment | u | env=tremor pattern=column len=long
Iceberg Field | environment | u | env=freeze pattern=cross len=long kw=freeze
Polar Night | environment | r | env=freeze pattern=burst
Kelp Forest | environment | c | env=bramble pattern=burst len=short
Mangrove Roots | environment | c | env=bramble pattern=column
Sargasso Sea | environment | u | env=bramble pattern=cross len=long
Fimbulwinter | environment | l | env=freeze pattern=row len=long

Crown of the Sea Dragon King | piece | l | kw=pull
Pearl of the Tide Jewels | piece | l | kw=push
Trident of the Sunken King | piece | l | kw=stun
Heart of the Leviathan | piece | l | kw=valor
Eye of the Frost Giant | piece | l | kw=freeze
Bell of the Sunken City | piece | l | kw=confuse

Merrow | summon | c | body=Merfolk beh=pierce tier=sturdy speed=quick kw=freeze
Mermaid Singer | summon | u | body=Merfolk mod=Gentle beh=mends tier=sturdy speed=slow kw=pull trait=submerge
Merman Spearman | summon | c | body=Merfolk mod=Brave beh=taunt tier=tough speed=steady kw=pull
Merfolk Tidecaller | summon | u | body=Merfolk mod=Clever beh=blast tier=sturdy speed=slow trait=tidal
Ningyo | summon | u | body=Fish mod=Pale beh=shields tier=sturdy speed=slow trait=pack
Siren | summon | r | body=Merfolk mod=Sly beh=pierce tier=sturdy speed=steady trait=tidal
Selkie | summon | u | body=Seal beh=mends tier=sturdy speed=slow kw=freeze trait=tidal
Nixie | summon | c | body=Sprite mod=Pale beh=twin tier=sturdy speed=steady
Rusalka | summon | r | body=Spirit mod=Pale beh=bolt tier=sturdy speed=steady kw=slow
Kappa | summon | c | body=Kappa beh=guards tier=tough speed=steady kw=freeze
Umibozu | summon | r | body=Ogre mod=Ancient beh=taunt tier=tough speed=steady kw=slow trait=pack
Yeti | summon | u | body=Yeti beh=pounce tier=huge speed=slow trait=shatter
Yeti Cub | summon | c | body=Yeti mod=Tiny beh=trample tier=huge speed=quick
Yeti Matriarch | summon | r | body=Yeti mod=Dire beh=lob tier=huge speed=slow trait=tidal
Snowman | summon | c | body=Snowman beh=taunt tier=tough speed=steady kw=freeze trait=shatter
Winter Wolf | summon | c | body=Wolf mod=Pale beh=dash tier=sturdy speed=steady kw=freeze
Frost Wolf Alpha | summon | u | body=Wolf mod=Dire beh=dash tier=tough speed=steady kw=freeze trait=pack
Rockhopper Penguin | summon | c | body=Penguin mod=Scrappy beh=cross tier=sturdy speed=slow trait=shatter
Walrus | summon | u | body=Walrus beh=guards tier=tough speed=steady kw=pull trait=tidal
Narwhal | summon | u | body=Narwhal beh=pierce tier=sturdy speed=steady kw=pull trait=chilling
Orca | summon | r | body=Orca beh=lob tier=sturdy speed=slow kw=pull trait=tidal
Hammerhead Shark | summon | u | body=Shark beh=twin tier=sturdy speed=steady kw=slow trait=tidal
Great White Shark | summon | r | body=Shark mod=Hungry beh=blast tier=sturdy speed=slow kw=pull
Sea Turtle | summon | c | body=Turtle mod=Gentle beh=wardmaker tier=tough speed=slow kw=pull trait=tidal
Zaratan the Island Turtle | summon | l | body=Turtle mod=Ancient beh=guards tier=tough speed=slow kw=freeze trait=pack
King Crab | summon | u | body=Crab mod=Iron beh=taunt tier=tough speed=slow
Giant Squid | summon | r | body=Kraken mod=Wild beh=trample tier=huge speed=slow kw=freeze
The Kraken | summon | l | body=Kraken mod=Dire beh=trample tier=huge speed=slow kw=pull trait=tidal
Kraken Spawn | summon | c | body=Kraken mod=Tiny beh=trample tier=huge speed=slow kw=slow trait=submerge
Leviathan | summon | l | body=Leviathan mod=Ancient beh=trample tier=huge speed=slow trait=chilling
Bunyip of the Billabong | summon | u | body=Seal mod=Feral beh=guards tier=tough speed=steady trait=submerge
Sea Serpent | summon | r | body=Serpent mod=Wild beh=pounce tier=sturdy speed=slow kw=slow trait=tidal
Dragon King of the Deep | summon | l | body=Lung mod=Noble beh=cone tier=sturdy speed=slow kw=freeze trait=submerge
River Lung | summon | u | body=Lung mod=Gentle beh=shields tier=sturdy speed=slow kw=freeze trait=shatter
Frost Giant | summon | r | body=Ogre mod=Pale beh=trample tier=huge speed=steady kw=freeze trait=chilling
Pirate Deckhand | summon | c | body=Squire mod=Scrappy beh=zigzag tier=frail speed=quick kw=slow
Buccaneer Captain | summon | r | body=Knight mod=Sly beh=pierce tier=sturdy speed=steady kw=freeze trait=shatter
Powder Monkey | summon | c | body=Squire mod=Tiny beh=blast tier=sturdy speed=frantic
Flying Dutchman's Captain | summon | l | body=Spirit mod=Grim beh=bolt tier=sturdy speed=steady trait=shatter
Drowned Sailor | summon | c | body=Spirit mod=Pale beh=lob tier=sturdy speed=slow trait=submerge
Snow Maiden | summon | c | body=Sprite mod=Gentle beh=mends tier=sturdy speed=slow trait=chilling
Yuki-onna | summon | r | body=Spirit mod=Pale beh=twin tier=sturdy speed=steady kw=pull trait=submerge
Kayak Hunter | summon | c | body=Squire mod=Brave beh=snipe tier=sturdy speed=frantic trait=pack
Polar Bear | summon | u | body=Bear mod=Pale beh=pounce tier=tough speed=steady
River Mother's Herald | summon | u | body=Merfolk mod=Noble beh=empower tier=frail speed=quick
Vodyanoy | summon | u | body=Toad mod=Old beh=cross tier=sturdy speed=slow kw=freeze trait=pack
Ahuizotl | summon | u | body=Hound mod=Sly beh=bolt tier=sturdy speed=steady kw=pull trait=pack
Taniwha | summon | r | body=Serpent mod=Ancient beh=guards tier=tough speed=steady kw=slow trait=shatter

Ship's Cannon | machine | u | mach=Cannon beh=bolt tier=sturdy speed=slow
Broadside Battery | machine | r | mach=Cannon beh=zigzag tier=frail speed=quick kw=freeze trait=pack
Harpoon Ballista | machine | u | mach=Ballista beh=snipe tier=sturdy speed=steady kw=slow trait=pack
Harpoon Launcher | machine | c | mach=Crossbow beh=beam tier=sturdy speed=steady kw=slow trait=shatter
Ice Catapult | machine | c | mach=Catapult beh=blast tier=sturdy speed=slow kw=freeze trait=chilling
Mortar Ketch | machine | u | mach=Cannon beh=lob tier=sturdy speed=slow kw=slow
Sluice Gate Bulwark | machine | u | mach=Bulwark beh=wardmaker tier=huge speed=slow kw=freeze trait=chilling
Icebreaker Engine | machine | r | mach=Engine beh=wardmaker tier=tough speed=steady kw=freeze trait=chilling
Waterwheel Repeater | machine | c | mach=Repeater beh=barrage tier=frail speed=frantic kw=slow trait=submerge
Diving Bell Automaton | machine | r | mach=Automaton beh=guards tier=tough speed=slow kw=slow trait=submerge
`,

/* ---------------- Yellow · Storm: lightning, sand, invention and greed ---------------- */
storm:`
Lightning Lash | strike | c | shape=zigzag kw=stun rider=crit cast=charged
Forked Bolt | strike | c | shape=snipe kw=stun rider=recoil cast=charged
Thunderclap | strike | u | shape=shockwave kw=push rider=recoil cast=quick
Static Discharge | strike | c | shape=boomerang rider=recoil
Sky-Splitter | strike | r | shape=line kw=stun rider=pierce cast=quick
Leyden Jar Shock | strike | c | shape=shockwave kw=stun cast=quick
Voltaic Arc | strike | u | shape=zigzag kw=stun
Tesla Arc | strike | r | shape=chain kw=stun rider=onkill cast=charged
Scorpion Sting | strike | c | shape=line kw=poison
Manticore Tail Spikes | strike | u | shape=spear kw=poison rider=pierce
Cobra Spit | strike | c | shape=snipe kw=poison rider=crit
Sandblast | strike | c | shape=burst kw=slow cast=quick
Dune Lash | strike | c | shape=zigzag kw=slow rider=pierce cast=quick
Sirocco Gust | strike | u | shape=fan kw=push cast=quick
Haboob Wall | strike | r | shape=all kw=slow cast=charged
Scimitar Sweep | strike | c | shape=fan rider=pierce
Bedouin Lance | strike | c | shape=spear rider=pierce cast=quick
Camel Kick | strike | c | shape=twin kw=push cast=charged
Ifrit's Flame | strike | u | shape=wedge kw=burn cast=charged
Sun Disk Ray | strike | u | shape=row kw=burn
Noon Sun Glare | strike | c | shape=diag kw=burn rider=pierce
Mirage Dagger | strike | u | shape=diag kw=confuse cast=charged
Djinn's Whirlwind | strike | r | shape=all kw=confuse rider=onkill
Coin Toss | strike | c | shape=missiles cast=charged
Golden Touch | strike | r | shape=spear kw=drain
Bronze Fist | strike | c | shape=wedge kw=push rider=crit
Talos's Boulder | strike | r | shape=dig kw=push rider=onkill cast=quick
Serpent Whip | strike | c | shape=boomerang kw=pull cast=quick
Lodestone Pull | strike | u | shape=row kw=pull rider=onkill
Raiju's Pounce | strike | u | shape=dig kw=stun rider=onkill
Plumed Serpent Gale | strike | r | shape=fan kw=push rider=onkill cast=charged
Perun's Oak-Splitter | strike | l | shape=line kw=stun rider=recoil
Midas's Last Embrace | strike | l | shape=line kw=drain rider=onkill cast=quick
Heaven-Rending Bolt | strike | l | shape=spear kw=stun rider=crit

Lightning in a Bottle | lob | u | pattern=burst fuse=quick kw=stun after=knock
Alembic Flask | lob | c | pattern=single fuse=quick kw=poison
Quicklime Pot | lob | c | pattern=burst fuse=quick kw=burn after=ground
Naphtha Jar | lob | c | pattern=single fuse=quick kw=burn after=knock
Sulfur Bomb | lob | u | pattern=burst fuse=heavy kw=poison
Thunder Gourd | lob | c | pattern=single fuse=quick kw=stun after=ground
Sand Urn | lob | c | pattern=burst fuse=quick kw=slow
Sack of Coins | lob | c | pattern=single fuse=heavy kw=push
Golden Hail | lob | u | pattern=row after=ground
Mercury Flask | lob | u | pattern=cross fuse=quick kw=poison after=knock
Scarab Swarm Jar | lob | u | pattern=ring fuse=quick kw=poison after=ground
Roc's Egg | lob | r | pattern=single kw=push after=knock
Saltpeter Charge | lob | c | pattern=column fuse=heavy kw=push after=knock
Storm Cloud Seed | lob | u | pattern=cross kw=stun after=knock
Hail of Dinars | lob | r | pattern=ring kw=drain after=ground
Great Work Detonation | lob | l | pattern=burst fuse=heavy kw=burn after=knock

Copper Lattice | ward | c | form=shield wfx=shocking
Bronze Aegis | ward | u | form=shield build=light len=short
Sandbag Wall | ward | c | form=cage
Mudbrick Wall | ward | c | form=corridor build=light wfx=shocking len=short
Kasbah Gate | ward | r | form=rampart build=light
Cactus Hedge | ward | c | form=cage build=heavy wfx=thorns len=short
Scorpion Pit Ring | ward | u | form=arc build=heavy wfx=thorns
Faraday Cage | ward | u | form=cage build=heavy len=long
Charged Fence | ward | c | form=shield build=light wfx=thorns
Caravan Circle | ward | c | form=arc build=light len=long
Djinn's Veil | ward | u | form=shield build=heavy
Lightning Rod Array | ward | r | form=shield wfx=thorns len=short
Walls of the City of Brass | ward | l | len=short form=line

Lightning Rod | sentry | c | beh=beam tier=sturdy speed=steady kw=confuse trait=overcharge
Tesla Coil | sentry | u | beh=chain tier=sturdy speed=steady kw=stun trait=sandstorm
Sun Obelisk | sentry | c | beh=bolt tier=sturdy speed=steady trait=sandstorm
Scarab Totem | sentry | c | beh=empower tier=sturdy speed=steady kw=push
Brazen Head | sentry | r | beh=snipe tier=sturdy speed=steady kw=confuse trait=greedy
Foo Dog Statue | sentry | u | beh=bolt tier=tough speed=slow kw=push trait=overcharge
Snake Charmer's Basket | sentry | c | beh=zigzag tier=sturdy speed=steady trait=overcharge
Oil Lamp Brazier | sentry | c | beh=snipe tier=sturdy speed=steady kw=push trait=overcharge
Storm Kite | sentry | u | beh=beam tier=sturdy speed=steady kw=stun trait=static
Sandstone Idol | sentry | c | beh=empower tier=sturdy speed=steady trait=greedy
Thunder Drum | sentry | c | beh=chain tier=sturdy speed=steady kw=push trait=greedy
Burning Mirror | sentry | r | beh=bolt tier=sturdy speed=steady kw=confuse trait=static

Overcharge | boon | c | boon=power timing=echo
Galvanic Surge | boon | u | boon=power len=short side=jolt timing=echo
Djinn's Bargain | boon | r | boon=pact len=short side=spark
Wish of the Lamp | boon | l | boon=intervene side=spark timing=echo
Desert Mirage | boon | u | boon=dodge side=spark
Sand Step | boon | c | boon=haste len=long
Camel's Endurance | boon | c | boon=regen
Date Palm Oasis | boon | c | boon=heal side=jolt timing=echo
Mint Tea | boon | c | boon=heal side=spark timing=delayed
Hoard Fever | boon | u | boon=courage len=short
Merchant's Luck | boon | c | boon=gauge timing=delayed
Aurum Potabile | boon | r | boon=regen len=short side=jolt
Lightning Step | boon | u | boon=phase side=jolt
Horus's Watch | boon | r | boon=dodge side=jolt timing=delayed

Leyden Jar Battery | charge | c | shot=bolt uses=few kw=stun edge=splash
Baghdad Battery | charge | u | shot=bolt kw=stun
Copper Coil Spool | charge | c | shot=bolt edge=pierce
Bag of Dirhams | charge | c | shot=lob uses=few kw=push edge=crit
Quiver of Sand Darts | charge | c | shot=bolt uses=many kw=slow
Venom Vials | charge | c | shot=bolt kw=poison edge=crit
Scorpion Jar | charge | u | shot=lob kw=poison edge=pierce
Naphtha Grenades | charge | u | shot=lob uses=few kw=burn
Sling of Thunderstones | charge | c | shot=lob uses=few kw=stun edge=pierce
Alchemist's Bandolier | charge | u | shot=lob uses=many kw=poison edge=crit
Sun-Glass Lenses | charge | c | shot=bolt uses=few kw=burn edge=crit
Magnet Shot | charge | c | shot=bolt uses=few kw=pull
Thunderbolt Sheaf | charge | r | shot=bolt uses=many kw=stun edge=pierce
Golden Arrow Quiver | charge | u | shot=bolt uses=many edge=splash
Bottled Sirocco | charge | u | shot=bolt kw=push edge=splash
Ifrit Embers | charge | r | shot=lob kw=burn edge=splash
Canopic Jars | charge | r | shot=lob kw=curse
Forty Thieves' Hoard | charge | l | shot=lob uses=many kw=drain

Astrolabe | utility | c | util=draw
Bazaar Haggle | utility | c | util=draw
Caravan Map | utility | c | util=draw
Transmutation | utility | u | util=copy
Djinn's Duplicate | utility | r | util=copy
Natron Salts | utility | u | util=cleanse
Open Sesame | utility | r | util=recall
Moneylender's Loan | utility | u | util=recall
Inventor's Codex | utility | r | util=draw

Pit of Gold Coins | trap | u | trap=snare kw=drain len=short
Quicksand | trap | c | trap=snare kw=slow size=three
Tripwire Spark | trap | c | trap=blast kw=stun
Scorpion Nest | trap | c | trap=spike kw=poison size=three
Pressure Plate Darts | trap | c | trap=spike kw=poison len=short
Tomb Boulder | trap | u | trap=blast kw=push size=three
Antlion Pit | trap | u | trap=snare kw=pull len=long size=three
Shocking Floor Tiles | trap | c | trap=spike kw=stun len=short size=three
Djinn Bottle | trap | r | trap=snare kw=confuse len=long
Collapsing Tomb Floor | trap | u | trap=blast kw=slow len=short size=three
Electrified Gold Idol | trap | r | trap=blast kw=stun len=long size=three
Cobra Basket Trap | trap | c | trap=spike kw=confuse
Mirage Oasis | trap | u | trap=snare
Pharaoh's Curse Seal | trap | r | trap=blast kw=curse len=long

Scorching Sun | environment | c | env=burn pattern=row len=short
Salt Flats | environment | c | env=burn pattern=burst len=short kw=confuse
Sahara Noon | environment | u | env=burn pattern=burst len=long
Sandworm Burrows | environment | r | env=tremor pattern=column
Thunder Rumble | environment | c | env=tremor pattern=burst kw=confuse
Dune Shift | environment | c | env=tremor pattern=row kw=push
Lightning Field | environment | u | env=burn pattern=cross
Sun-Baked Wadi | environment | c | env=burn pattern=column kw=confuse
Storm Front | environment | u | env=tremor pattern=row len=long
Great Sand Sea | environment | l | env=tremor pattern=burst len=short

Lamp of the Bound Djinn | piece | l | kw=confuse
Crown of the Brass City | piece | l | kw=drain
Scale of the World Fish | piece | l | kw=push
Tail of the Manticore | piece | l | kw=poison
Heart of the Bronze Giant | piece | l | kw=stun

Thunder Raiju | summon | r | body=Raiju beh=beam tier=sturdy speed=steady trait=swift
Lamp Djinn | summon | r | body=Djinn beh=blast tier=sturdy speed=steady kw=stun trait=overcharge
Ifrit | summon | r | body=Djinn mod=Dire beh=lob tier=sturdy speed=slow kw=stun trait=greedy
Ifrit Sultan | summon | l | body=Djinn mod=Ancient beh=lob tier=sturdy speed=slow trait=static
Si'lat Shapeshifter | summon | u | body=Djinn mod=Sly beh=pounce tier=tough speed=steady kw=stun
Dybbuk | summon | u | body=Spirit mod=Grim beh=cross tier=sturdy speed=slow trait=sandstorm
Sand Scarab | summon | c | body=Scarab beh=taunt tier=tough speed=frantic
Golden Scarab | summon | u | body=Scarab mod=Lucky beh=shields tier=sturdy speed=slow kw=confuse
Khepri's Dawn Beetle | summon | r | body=Scarab mod=Noble beh=taunt tier=tough speed=slow kw=push trait=static
Desert Camel | summon | c | body=Camel beh=guards tier=tough speed=frantic trait=swift
War Camel | summon | u | body=Camel mod=Brave beh=taunt tier=tough speed=steady kw=confuse
Manticore | summon | r | body=Manticore beh=cone tier=sturdy speed=steady kw=confuse trait=sandstorm
Chimera | summon | r | body=Chimera beh=cone tier=sturdy speed=slow trait=overcharge
Emperor Scorpion | summon | u | body=Scorpion beh=zigzag tier=tough speed=steady
Sand Scorpion | summon | c | body=Scorpion beh=pounce tier=sturdy speed=steady kw=push trait=sandstorm
Girtablilu Gatewarden | summon | r | body=Scorpion mod=Noble beh=guards tier=tough speed=slow trait=greedy
Jackal Tomb Guard | summon | u | body=Jackal beh=dash tier=tough speed=steady kw=push trait=swift
Nile Crocodile | summon | c | body=Crocodile beh=taunt tier=tough speed=steady kw=stun trait=static
Great River Crocodile | summon | r | body=Crocodile mod=Dire beh=taunt tier=tough speed=steady trait=swift
Roc | summon | r | body=Roc beh=lob tier=sturdy speed=slow kw=confuse trait=sandstorm
Simurgh | summon | l | body=Simurgh beh=mends tier=sturdy speed=slow kw=confuse trait=overcharge
Great Sphinx | summon | l | body=Sphinx mod=Ancient beh=guards tier=tough speed=steady trait=sandstorm
Riddling Sphinx | summon | r | body=Sphinx mod=Clever beh=mends tier=sturdy speed=slow trait=swift
Bronze Automaton | summon | u | body=Automaton beh=trample tier=tough speed=slow kw=push
Talos the Bronze Giant | summon | l | body=Automaton mod=Dire beh=trample tier=huge speed=slow kw=confuse trait=sandstorm
Clockwork Falcon | summon | u | body=Hawk mod=Iron beh=diag tier=tough speed=slow kw=stun trait=overcharge
Horus the Far-Seeing | summon | l | body=Hawk mod=Noble beh=bolt tier=sturdy speed=steady kw=stun trait=greedy
Ibis Scribe | summon | c | body=Hawk mod=Gentle beh=shields tier=sturdy speed=slow kw=stun trait=swift
Frilled Lizard | summon | c | body=Lizard beh=pierce tier=sturdy speed=quick kw=stun trait=sandstorm
Horned Viper | summon | c | body=Serpent beh=bolt tier=sturdy speed=steady kw=push trait=swift
Uraeus Cobra | summon | u | body=Serpent mod=Noble beh=zigzag tier=sturdy speed=steady kw=stun
Plumed Serpent | summon | r | body=Serpent mod=Wild beh=pounce tier=sturdy speed=slow kw=confuse trait=greedy
Chupacabra | summon | u | body=Chupacabra beh=lob tier=sturdy speed=slow kw=push
Foo Dog Sentinel | summon | u | body=Shishi mod=Loyal beh=dash tier=tough speed=steady trait=static
Brass Foo Pup | summon | c | body=Shishi mod=Tiny beh=trample tier=frail speed=quick trait=static
Bahamut | summon | l | body=Bahamut beh=guards tier=tough speed=steady kw=stun trait=swift
Falak the Abyss Serpent | summon | l | body=Sandworm mod=Ancient beh=bolt tier=sturdy speed=slow kw=stun trait=overcharge
Sandworm | summon | r | body=Sandworm beh=burrow tier=sturdy speed=slow
Linen-Wrapped Sentinel | summon | u | body=Knight mod=Pale beh=guards tier=tough speed=steady kw=confuse trait=greedy
Sand Golem | summon | c | body=Golem beh=trample tier=tough speed=slow trait=overcharge
Wandering Alchemist | summon | u | body=Squire mod=Clever beh=mends tier=sturdy speed=slow kw=stun trait=static
Bedouin Raider | summon | c | body=Squire mod=Swift beh=pierce tier=sturdy speed=slow kw=stun
Parthian Horse Archer | summon | u | body=Squire mod=Brave beh=snipe tier=sturdy speed=steady
Bazaar Pickpocket | summon | c | body=Goblin mod=Sly beh=blast tier=sturdy speed=slow kw=confuse trait=swift
Mamluk Lancer | summon | u | body=Knight beh=wardmaker tier=tough speed=steady kw=confuse trait=swift
Persian Immortal | summon | r | body=Knight mod=Noble beh=guards tier=tough speed=steady kw=push
Storm Imp | summon | c | body=Imp beh=zigzag tier=frail speed=quick kw=confuse trait=sandstorm
Spark Sprite | summon | c | body=Sprite beh=dash tier=frail speed=quick kw=stun trait=static
Thunder Hawk | summon | c | body=Hawk beh=diag tier=sturdy speed=quick trait=greedy
Coin-Hoard Dragon | summon | r | body=Dragon mod=Hungry beh=cone tier=tough speed=steady kw=stun trait=overcharge

Ornithopter | machine | c | mach=Drone beh=twin tier=sturdy speed=quick kw=stun
Spiral Aerial Screw | machine | u | mach=Drone beh=twin tier=sturdy speed=quick trait=sandstorm
Tesla Tower | machine | r | mach=Tower beh=chain tier=sturdy speed=steady trait=static
Voltaic Pile Turret | machine | c | mach=Tower beh=pierce tier=sturdy speed=steady kw=stun trait=swift
Arc Gatling | machine | u | mach=Gatling beh=pierce tier=sturdy speed=steady kw=confuse
Brass Automaton Archer | machine | u | mach=Automaton beh=snipe tier=tough speed=slow kw=confuse
Scorpio Bolt Thrower | machine | c | mach=Ballista beh=blast tier=sturdy speed=slow kw=stun trait=sandstorm
Naphtha Siphon | machine | u | mach=Engine beh=pierce tier=sturdy speed=steady kw=push trait=static
Desert Onager | machine | c | mach=Catapult beh=cross tier=sturdy speed=slow kw=push trait=overcharge
Caravan Mangonel | machine | u | mach=Trebuchet beh=blast tier=sturdy speed=slow trait=greedy
Architronito | machine | r | mach=Cannon beh=pounce tier=tough speed=steady trait=overcharge
Zhuge Repeater | machine | u | mach=Repeater beh=barrage tier=frail speed=frantic kw=push trait=static
Tortoise War Wagon | machine | r | mach=Bulwark beh=taunt tier=tough speed=slow trait=sandstorm
Sandstone Rampart | machine | c | mach=Rampart beh=wardmaker tier=huge speed=slow
Palm-Log Palisade | machine | c | mach=Palisade beh=wardmaker tier=huge speed=slow kw=stun trait=swift
Bronze Barricade | machine | c | mach=Barricade beh=wardmaker tier=huge speed=slow kw=push trait=greedy
Elephant Clock Automaton | machine | r | mach=Automaton beh=trample tier=tough speed=slow kw=confuse trait=static
Coin-Spitting Mortar | machine | c | mach=Cannon beh=lob tier=sturdy speed=quick
Clockwork Flying Carpet | machine | r | mach=Drone beh=guards tier=tough speed=slow kw=push trait=swift
Hang-Glider Scout | machine | c | mach=Drone beh=twin tier=sturdy speed=quick kw=push trait=greedy
The Thunder Engine | machine | l | mach=Engine beh=chain tier=sturdy speed=quick kw=stun trait=swift
The Bronze Colossus | machine | l | mach=Automaton beh=trample tier=huge speed=slow trait=greedy
`,

/* ---------------- Black · Shadow: death, horror and dark magic ---------------- */
shadow:`
Bone Splinter | strike | c | shape=line rider=pierce
Gravedigger's Spade | strike | c | shape=dig cast=quick
Miasma Wave | strike | c | shape=wave kw=poison rider=onkill cast=charged
Mold Spore Volley | strike | c | shape=gun kw=poison rider=onkill
Acid Vial Splash | strike | c | shape=burst kw=poison rider=pierce cast=charged
Evil Eye | strike | c | shape=snipe kw=curse rider=recoil
Hook and Chain | strike | c | shape=chain kw=pull rider=crit cast=charged
Crow Swarm | strike | c | shape=missiles rider=crit cast=quick
Creeping Fog | strike | c | shape=row kw=confuse cast=quick
Spider Silk Shot | strike | c | shape=spear kw=slow rider=crit
Bog Muck Splash | strike | c | shape=burst kw=slow rider=pierce
Yurei's Lament | strike | c | shape=zigzag kw=confuse rider=crit
Banshee Wail | strike | u | shape=fan kw=confuse rider=pierce
Strigoi Bite | strike | u | shape=wedge kw=drain rider=recoil cast=quick
Plague Breath | strike | u | shape=fan kw=poison cast=charged
Hellfire Lash | strike | u | shape=zigzag kw=burn cast=charged
Gallows Rope | strike | u | shape=line kw=pull cast=charged
Raven of Ill Omen | strike | u | shape=mark kw=curse rider=onkill
Moonlit Rake | strike | u | shape=burst kw=valor rider=crit
Bloodletting Blade | strike | u | shape=boomerang kw=self rider=pierce cast=quick
Web Spray | strike | u | shape=fan kw=slow
Jiangshi Hop | strike | u | shape=dig kw=stun rider=crit
Asanbosam Hook | strike | u | shape=zigzag kw=pull rider=pierce cast=charged
Hellhound Howl | strike | u | shape=shockwave kw=push cast=charged
Infernal Brand | strike | r | shape=line kw=self rider=recoil
Reaper's Scythe | strike | r | shape=boomerang rider=onkill
Danse Macabre | strike | r | shape=all kw=confuse rider=crit cast=quick
Onryo's Grudge | strike | r | shape=diag kw=curse rider=crit cast=quick
Manananggal Swoop | strike | r | shape=dig kw=drain rider=onkill
Mara's Ride | strike | r | shape=line kw=confuse
Death Card | strike | r | shape=mark rider=onkill cast=quick
Wild Hunt of the Dead | strike | l | shape=snipe kw=confuse rider=onkill
Gashadokuro's Fist | strike | l | shape=wedge kw=stun rider=crit cast=quick
Maw of the Abyss | strike | l | shape=wedge kw=self cast=quick

Plague Flask | lob | c | pattern=single fuse=quick kw=poison after=knock
Skull Bomb | lob | c | pattern=single fuse=heavy after=knock
Grave Dirt Handful | lob | c | pattern=burst fuse=quick kw=curse after=ground
Hex Bag | lob | c | pattern=single kw=curse
Bat Cloud | lob | c | pattern=burst kw=drain after=ground
Swamp Gas Bubble | lob | c | pattern=burst fuse=heavy kw=burn after=knock
Ossuary Urn | lob | c | pattern=column fuse=heavy after=ground
Cauldron Spill | lob | u | pattern=burst kw=poison
Witch's Brew Toss | lob | u | pattern=cross kw=poison after=knock
Coffin Drop | lob | u | pattern=single kw=stun after=ground
Spider Egg Sac | lob | u | pattern=burst fuse=heavy kw=slow after=ground
Funeral Wreath | lob | u | pattern=ring fuse=heavy kw=curse after=knock
Brimstone Hail | lob | u | pattern=column fuse=quick kw=burn after=ground
The Tower Card | lob | r | pattern=column fuse=heavy kw=stun after=knock
Pox Cloud | lob | r | pattern=ring fuse=heavy kw=poison
Bottled Nightmare | lob | r | pattern=cross fuse=quick kw=confuse after=ground
Black Death | lob | l | pattern=ring fuse=quick kw=poison after=ground

Skull-Topped Fence | ward | c | build=light len=long form=line
Coffin Lid | ward | c | form=cage len=long
Cobweb Veil | ward | c | form=shield wfx=thorns len=long
Hook Fence | ward | c | build=light wfx=thorns len=short form=line
Beetle Carapace | ward | c | form=shield build=light wfx=draining len=short
Lead-Lined Coffin | ward | u | form=cage build=light wfx=draining len=long
Ossuary Wall | ward | u | wfx=draining form=line
Crypt Door | ward | u | form=arc build=light
Demon Hide | ward | u | form=shield build=heavy len=long
Shroud of Fog | ward | u | form=shield len=short
Iron Maiden Shell | ward | r | form=shield build=heavy wfx=thorns
Barrow Mound | ward | r | form=rampart
Hell's Gate | ward | l | form=corridor build=heavy wfx=thorns len=long

Skull Lantern | sentry | c | beh=shields tier=sturdy speed=steady kw=confuse trait=plague
Stingy Jack's Lantern | sentry | c | beh=mends tier=sturdy speed=quick trait=lifesteal
Crow Perch | sentry | c | beh=chain tier=sturdy speed=steady
Will-o'-the-Wisp | sentry | c | beh=barrage tier=frail speed=quick kw=confuse trait=phantom
Rot Censer | sentry | c | beh=beam tier=sturdy speed=steady trait=lifesteal
Bone Totem | sentry | c | beh=empower tier=sturdy speed=steady kw=curse trait=harvest
Pin Doll | sentry | u | beh=snipe tier=sturdy speed=quick kw=curse trait=lifesteal
Gallows Tree | sentry | u | beh=summoner tier=sturdy speed=slow kw=pull
Bubbling Cauldron | sentry | u | beh=snipe tier=sturdy speed=quick trait=dread
Spider Nest | sentry | u | beh=summoner tier=sturdy speed=steady kw=curse trait=lifesteal
Blood Fountain | sentry | r | beh=snipe tier=sturdy speed=steady kw=drain trait=lifesteal
Cursed Mirror | sentry | r | beh=bolt tier=sturdy speed=steady trait=harvest

Shadow Step | boon | c | boon=dodge timing=delayed
Bat Form | boon | c | boon=haste len=long timing=echo
Black Cat's Luck | boon | c | boon=dodge side=blood timing=echo
Sip of Blood | boon | c | boon=heal side=siphon timing=delayed
Embalming Salts | boon | c | boon=regen len=short timing=echo
Ritual Candles | boon | c | boon=gauge timing=echo
Demon's Bargain | boon | u | boon=pact
Witching Hour | boon | u | boon=courage len=long
Mist Form | boon | u | boon=phase len=long side=siphon
Full Moon Frenzy | boon | u | boon=power len=short
Blood Moon | boon | r | boon=power side=siphon
Crossroads Bargain | boon | r | boon=pact len=long side=blood
Undying Will | boon | r | boon=intervene side=blood
Infernal Contract | boon | l | boon=pact len=short timing=delayed

Bag of Teeth | charge | c | shot=bolt uses=few edge=pierce
Coffin Nails | charge | c | shot=bolt uses=few kw=curse
Spider Fangs | charge | c | shot=bolt uses=few kw=poison edge=splash
Bone Darts | charge | c | shot=bolt edge=crit
Belfry Bats | charge | c | shot=bolt uses=few kw=confuse edge=crit
Crow Feathers | charge | c | shot=bolt uses=many edge=splash
Nightshade Berries | charge | c | shot=bolt uses=many kw=poison edge=pierce
Jar of Carrion Beetles | charge | c | shot=lob edge=splash
Plague Vials | charge | u | shot=lob kw=poison edge=pierce
Leech Jar | charge | u | shot=bolt kw=drain
Mold Jars | charge | u | shot=lob uses=few kw=poison
Dungeon Chains | charge | u | shot=bolt kw=pull edge=pierce
Mandrake Roots | charge | u | shot=lob kw=stun
Ferryman's Coins | charge | u | shot=bolt kw=curse edge=splash
Hellfire Embers | charge | r | shot=lob uses=many kw=burn edge=splash
Banshee's Comb | charge | r | shot=bolt uses=many kw=confuse
Vampire Fang Necklace | charge | r | shot=bolt uses=many kw=drain edge=crit
Pandora's Jar | charge | l | shot=lob uses=many kw=curse

Three-Card Reading | utility | c | util=draw
Casting the Bones | utility | c | util=draw
Grave Robbing | utility | c | util=recall
Tarot Spread | utility | u | util=draw
Seance | utility | u | util=recall
Plague Doctor's Tonic | utility | u | util=cleanse
Raise the Dead | utility | r | util=recall
Doppelganger | utility | r | util=copy
Necromancer's Grimoire | utility | l | util=copy

Rusted Mantrap | trap | c | trap=spike len=short size=three
Open Grave | trap | c | trap=snare size=three
Sucking Bog | trap | u | trap=snare kw=slow len=long size=three
Trapdoor Spider Lair | trap | u | trap=snare kw=poison
Plague Mine | trap | u | trap=blast kw=poison len=short size=three
Rigged Coffin | trap | c | trap=blast
Oubliette | trap | r | trap=snare len=short
The Hanged Man | trap | r | trap=snare kw=pull len=long
Cursed Tomb | trap | r | trap=blast kw=curse len=long

Haunted Bog | environment | c | env=bramble pattern=burst len=short kw=curse
Graveyard Fog | environment | c | env=bramble pattern=row len=long
Webbed Hollow | environment | c | env=bramble pattern=cross
Graveyard Chill | environment | c | env=freeze pattern=row kw=curse
Restless Graves | environment | u | env=tremor pattern=burst
Hellfire Rift | environment | u | env=burn pattern=column len=short
Acid Rain | environment | u | env=burn pattern=row
Draugr's Barrow Frost | environment | u | env=freeze pattern=burst len=short
Witch's Thicket | environment | c | env=bramble pattern=column kw=curse
Catacomb Collapse | environment | r | env=tremor pattern=row len=short
Mouth of Hell | environment | l | env=burn pattern=burst len=long

Crown of the Lich King | piece | l | kw=curse
Fang of the First Vampire | piece | l | kw=drain
Candle of the Hanged Man | piece | l | kw=stun
Cauldron of the Bone Mother | piece | l | kw=poison
Mask of the Plague Doctor | piece | l | kw=mend

Skeleton Warrior | summon | c | body=Skeleton beh=taunt tier=tough speed=steady kw=confuse trait=lifesteal
Skeleton Archer | summon | c | body=Skeleton beh=snipe tier=sturdy speed=frantic trait=rises
Bone Rattler | summon | c | body=Skeleton mod=Scrappy beh=dash tier=frail speed=quick kw=drain trait=rises
Shambling Zombie | summon | c | body=Zombie beh=trample tier=tough speed=steady kw=drain trait=rises
Plague Zombie | summon | c | body=Zombie mod=Hungry beh=lob tier=sturdy speed=quick
Ghoul | summon | c | body=Ghoul beh=blast tier=sturdy speed=slow kw=drain trait=rises
Poltergeist | summon | c | body=Ghost mod=Scrappy beh=zigzag tier=sturdy speed=slow kw=drain trait=dread
Vampire Thrall | summon | c | body=Vampire mod=Scrappy beh=guards tier=tough speed=steady kw=drain
Vampire Bat | summon | c | body=Bat mod=Hungry beh=dash tier=frail speed=quick trait=lifesteal
Tokoloshe | summon | c | body=Imp mod=Sly beh=cross tier=sturdy speed=slow kw=confuse trait=phantom
Adze | summon | c | body=Moth mod=Tiny beh=bolt tier=sturdy speed=quick kw=curse
Night-Pack Wolf | summon | c | body=Wolf mod=Grim beh=pounce tier=sturdy speed=slow kw=drain trait=plague
Cave Spider | summon | c | body=Spider beh=pounce tier=sturdy speed=steady kw=curse trait=phantom
Death's-Head Moth | summon | c | body=Moth beh=zigzag tier=frail speed=quick kw=curse
Carrion Beetle | summon | c | body=Beetle mod=Mossy beh=wardmaker tier=tough speed=slow kw=drain
Cave Centipede | summon | c | body=Centipede beh=pounce tier=sturdy speed=slow kw=curse trait=rises
Plague Rat | summon | c | body=Rat mod=Mossy beh=dash tier=frail speed=quick kw=pull trait=plague
Bog Leech | summon | c | body=Leech beh=bolt tier=sturdy speed=slow kw=drain trait=lifesteal
Gravedigger | summon | c | body=Squire mod=Old beh=burrow tier=tough speed=steady kw=pull
Dungeon Jailer | summon | c | body=Ogre mod=Iron beh=taunt tier=tough speed=frantic kw=pull
Brimstone Imp | summon | c | body=Imp beh=zigzag tier=frail speed=frantic
Murder of Crows | summon | c | body=Crow beh=barrage tier=frail speed=frantic kw=curse trait=dread
Witch's Toad | summon | c | body=Toad mod=Mossy beh=chain tier=sturdy speed=slow kw=drain trait=harvest
Black Cat Familiar | summon | c | body=Cat beh=shields tier=sturdy speed=steady kw=pull trait=phantom
Haugbui | summon | u | body=Skeleton mod=Old beh=trample tier=tough speed=steady trait=phantom
Jiangshi | summon | u | body=Jiangshi beh=guards tier=tough speed=steady kw=curse trait=rises
Nachzehrer | summon | u | body=Ghoul mod=Hungry beh=twin tier=sturdy speed=slow
Yurei | summon | u | body=Ghost mod=Pale beh=zigzag tier=sturdy speed=steady trait=phantom
Vetala | summon | u | body=Ghost mod=Clever beh=bolt tier=sturdy speed=quick trait=plague
Mara | summon | u | body=Ghost mod=Sly beh=pierce tier=sturdy speed=frantic kw=drain
Pontianak | summon | u | body=Banshee mod=Sly beh=blast tier=sturdy speed=slow kw=curse trait=harvest
Bog Revenant | summon | u | body=Zombie mod=Mossy beh=taunt tier=tough speed=steady
Loup-Garou | summon | u | body=Werewolf mod=Wild beh=cross tier=sturdy speed=slow kw=drain
Bayou Rougarou | summon | u | body=Werewolf mod=Mossy beh=trample tier=tough speed=steady kw=curse
Barghest | summon | u | body=Hound mod=Feral beh=guards tier=tough speed=slow kw=pull trait=plague
Black Cadejo | summon | u | body=Hound mod=Grim beh=pounce tier=sturdy speed=slow trait=dread
Night Mare | summon | u | body=Nightmare beh=barrage tier=sturdy speed=slow kw=curse
Black Widow | summon | u | body=Spider mod=Grim beh=lob tier=sturdy speed=slow kw=pull trait=harvest
Bog Witch | summon | u | body=Witch mod=Mossy beh=chain tier=sturdy speed=slow kw=curse trait=lifesteal
Plague Doctor | summon | u | body=Plaguemask beh=mends tier=sturdy speed=slow kw=curse trait=plague
Necromancer | summon | u | body=Witch mod=Clever beh=summoner tier=sturdy speed=steady trait=dread
Horned Night Visitor | summon | u | body=Demon mod=Feral beh=blast tier=sturdy speed=slow kw=confuse
Omen Raven | summon | u | body=Crow mod=Clever beh=twin tier=sturdy speed=steady kw=drain trait=harvest
Draugr | summon | r | body=Zombie mod=Ancient beh=taunt tier=tough speed=steady kw=pull trait=rises
Onryo | summon | r | body=Ghost mod=Grim beh=zigzag tier=sturdy speed=slow kw=curse trait=phantom
Bean Sidhe | summon | r | body=Banshee beh=pierce tier=sturdy speed=steady kw=curse trait=dread
Lich | summon | r | body=Lich beh=twin tier=sturdy speed=steady trait=rises
Ankou | summon | r | body=Reaper mod=Old beh=lob tier=sturdy speed=slow kw=curse trait=dread
Strigoi | summon | r | body=Vampire mod=Pale beh=bolt tier=sturdy speed=steady kw=drain
Aswang | summon | r | body=Werewolf mod=Sly beh=blast tier=sturdy speed=slow trait=plague
Manananggal | summon | r | body=Bat mod=Grim beh=lob tier=sturdy speed=slow kw=drain trait=phantom
Asanbosam | summon | r | body=Vampire mod=Feral beh=guards tier=tough speed=steady kw=confuse trait=harvest
Werewolf | summon | r | body=Werewolf beh=pounce tier=tough speed=steady kw=pull trait=phantom
Black Shuck | summon | r | body=Hound mod=Dire beh=dash tier=sturdy speed=slow trait=lifesteal
Antlered Hunger | summon | r | body=Gaunt mod=Hungry beh=blast tier=sturdy speed=slow kw=pull trait=dread
Jorogumo | summon | r | body=Spider mod=Sly beh=pierce tier=sturdy speed=steady kw=drain trait=phantom
Rat King | summon | r | body=Rat mod=Dire beh=zigzag tier=frail speed=quick trait=plague
Black Annis | summon | r | body=Witch mod=Grim beh=cross tier=sturdy speed=slow trait=harvest
Pit Fiend | summon | r | body=Demon beh=taunt tier=tough speed=steady kw=curse trait=dread
Rakshasa | summon | r | body=Demon mod=Sly beh=twin tier=sturdy speed=steady kw=curse
Morrigan's Raven | summon | r | body=Crow mod=Ancient beh=bolt tier=sturdy speed=steady kw=curse trait=rises
Gashadokuro | summon | l | body=Skeleton mod=Dire beh=guards tier=tough speed=steady kw=pull trait=lifesteal
La Llorona | summon | l | body=Banshee mod=Pale beh=bolt tier=sturdy speed=steady kw=confuse trait=dread
Dullahan | summon | l | body=Knight mod=Grim beh=guards tier=tough speed=steady trait=plague
Grim Reaper | summon | l | body=Reaper mod=Ancient beh=pounce tier=tough speed=steady trait=harvest
Baba Yaga | summon | l | body=Witch mod=Ancient beh=mends tier=sturdy speed=slow trait=phantom
The Erlking | summon | l | body=Spirit mod=Pale beh=bolt tier=sturdy speed=steady kw=pull trait=lifesteal

Bone Ballista | machine | c | mach=Ballista beh=snipe tier=sturdy speed=steady kw=confuse trait=rises
Skull Catapult | machine | c | mach=Catapult beh=cross tier=sturdy speed=frantic
Torture Rack | machine | u | mach=Barricade beh=wardmaker tier=tough speed=steady kw=curse trait=harvest
Coffin Cannon | machine | u | mach=Cannon beh=pierce tier=sturdy speed=steady kw=confuse
Plague Trebuchet | machine | u | mach=Trebuchet beh=lob tier=sturdy speed=slow kw=confuse trait=plague
Iron Maiden | machine | r | mach=Bastion beh=wardmaker tier=tough speed=steady trait=rises
Gibbet Tower | machine | r | mach=Tower beh=pierce tier=sturdy speed=steady trait=plague
Hut on Chicken Legs | machine | l | mach=Automaton beh=lob tier=sturdy speed=slow trait=rises
`,


/* ---------------- White · Light: knowledge, faith, safety and human achievement ---------------- */
light:`
Pilum Volley | strike | c | shape=gun rider=onkill cast=quick
Gladius Thrust | strike | c | shape=spear
Lance Charge | strike | c | shape=spear kw=valor cast=charged
Crusader's Charge | strike | u | shape=spear kw=valor rider=pierce
Longbow Volley | strike | c | shape=snipe rider=crit cast=quick
Agincourt Arrowstorm | strike | r | shape=line cast=quick
West Wind Gust | strike | c | shape=fan rider=recoil
Zephyr's Breath | strike | c | shape=fan kw=push rider=pierce cast=charged
Mistral Gale | strike | u | shape=fan kw=push
Owl's Silent Dive | strike | c | shape=line kw=stun rider=pierce cast=quick
Pegasus Hoofbeat | strike | u | shape=diag kw=push cast=quick
Centaur's Arrow | strike | c | shape=snipe rider=onkill
Unicorn Horn Thrust | strike | u | shape=spear kw=mend rider=crit
Aegis Bash | strike | u | shape=wedge kw=stun cast=quick
Starlight Lance | strike | u | shape=spear kw=burn rider=pierce cast=charged
Astrolabe Sightline | strike | c | shape=diag rider=pierce
Bright Comet | strike | r | shape=column kw=burn rider=crit cast=charged
Gavel of Justice | strike | c | shape=twin kw=stun
Shield Bash | strike | c | shape=line kw=stun cast=charged
Phalanx Advance | strike | u | shape=row kw=push rider=crit
Crane Wing Sweep | strike | c | shape=wedge kw=slow rider=crit cast=charged
Qilin's Flame | strike | r | shape=wedge kw=burn cast=charged
White Stag's Antlers | strike | u | shape=dig kw=push rider=recoil
Simurgh Feather Gust | strike | r | shape=fan kw=push rider=recoil cast=quick
Paladin's Oath Blade | strike | r | shape=boomerang kw=valor rider=pierce cast=charged
Martyr's Last Stand | strike | r | shape=all kw=self rider=onkill
Riddle of the Sphinx | strike | r | shape=missiles kw=confuse
Scholar's Paradox | strike | c | shape=zigzag kw=confuse cast=quick
Marble Shard Spray | strike | c | shape=row kw=slow cast=quick
Valkyrie's Descent | strike | r | shape=diag kw=valor rider=recoil
Durandal's Stroke | strike | l | shape=line kw=valor
Excalibur's Arc | strike | l | shape=chain kw=valor rider=onkill

Mortar of Bricks | lob | c | pattern=single kw=slow after=knock
Font of Blessed Water | lob | c | pattern=burst fuse=heavy kw=mend
Incense Censer | lob | u | pattern=burst fuse=heavy kw=confuse after=knock
Falling Masonry | lob | u | pattern=column kw=stun
Onager Stone | lob | c | pattern=single fuse=heavy kw=stun
Toppled Marble Column | lob | u | pattern=column kw=slow after=ground
Falling Star | lob | c | pattern=single fuse=heavy kw=burn after=knock
Alchemist's Flask | lob | c | pattern=burst fuse=quick
Salve Jar | lob | c | pattern=burst fuse=quick kw=mend after=ground
Quicksilver Retort | lob | u | pattern=burst kw=poison after=knock
Abbey Bell Toll | lob | u | pattern=ring fuse=heavy kw=stun after=knock
Slinger's Hail | lob | c | pattern=row fuse=quick after=ground
Southern Cross Starfall | lob | r | pattern=cross fuse=heavy kw=burn after=ground
Downdraft | lob | u | pattern=column kw=push after=knock
Owl Pellet | lob | c | pattern=single fuse=quick after=knock
Siege Stone of Acre | lob | r | pattern=burst fuse=quick kw=push after=knock

Kite Shield | ward | c | form=shield build=light wfx=steady len=long
Tower Shield | ward | c | form=shield build=heavy wfx=steady len=short
Marble Wall | ward | c | form=rampart wfx=healing len=long
Brick Rampart | ward | c | form=rampart build=heavy len=short
Cloister Arches | ward | c | form=cage build=heavy wfx=healing len=short
Spiked Pavise | ward | c | form=arc build=light wfx=healing
Chevaux-de-Frise | ward | c | wfx=steady len=long form=line
Testudo Formation | ward | u | form=shield wfx=healing
Castle Portcullis | ward | u | form=corridor
Shieldwall of the Fyrd | ward | u | form=shield build=heavy len=long
Sheltering Wings | ward | u | form=arc wfx=steady
Hadrian's Wall | ward | r | form=arc len=long
Sacsayhuaman Stones | ward | r | form=arc build=heavy
Great Zimbabwe Walls | ward | r | form=rampart build=heavy wfx=steady len=long
Ishtar Gate | ward | r | len=short form=line
White Heron Castle | ward | r | form=cage build=heavy wfx=steady
Aegis of Athena | ward | l | form=shield build=light
Theodosian Walls | ward | l | form=corridor build=light len=long

Harbor Lighthouse | sentry | c | beh=chain tier=sturdy speed=steady trait=radiant
Arrow-Slit Tower | sentry | c | beh=chain tier=sturdy speed=steady kw=push
Owl on the Parapet | sentry | c | beh=diag tier=tough speed=steady kw=mend trait=blessed
Windmill of La Mancha | sentry | c | beh=bolt tier=sturdy speed=steady kw=push trait=guardian
Weathervane Cockerel | sentry | c | beh=pierce tier=sturdy speed=steady kw=push trait=rallying
Wayside Shrine | sentry | c | beh=shields tier=sturdy speed=quick kw=mend trait=blessed
Bell Tower | sentry | u | beh=snipe tier=sturdy speed=quick kw=valor trait=radiant
Stone Lions of Delos | sentry | u | beh=bolt tier=sturdy speed=steady kw=valor trait=blessed
Obelisk of the Sun | sentry | u | beh=snipe tier=sturdy speed=steady kw=push trait=radiant
Caracol Observatory | sentry | u | beh=pierce tier=sturdy speed=steady kw=mend trait=martyr
Lamassu Gate Statue | sentry | r | beh=guards tier=tough speed=slow kw=push trait=blessed
Pharos of Alexandria | sentry | l | beh=bolt tier=sturdy speed=quick trait=guardian

Knight's Vigil | boon | c | boon=courage len=short
Oath of Fealty | boon | c | boon=power len=short side=radiance
Westerly Breeze | boon | c | boon=haste len=long
Owl's Foresight | boon | c | boon=dodge side=glow
Physician's Balm | boon | c | boon=heal timing=delayed
Herbal Poultice | boon | c | boon=regen len=long timing=echo
Vigil Candle | boon | c | boon=gauge side=glow
Rally the Legion | boon | u | boon=courage timing=delayed
Pegasus Flight | boon | u | boon=dodge timing=echo
Crusader's Vow | boon | u | boon=pact side=radiance timing=echo
Sushruta's Stitches | boon | u | boon=heal side=radiance
Angelic Veil | boon | r | boon=phase side=glow timing=echo
Valkyrie's Reprieve | boon | r | boon=intervene side=glow timing=delayed

Swan-Feather Quiver | charge | c | shot=bolt uses=many edge=crit
Legionary's Javelins | charge | c | shot=bolt uses=few kw=mend edge=crit
Yew Longbow Quiver | charge | c | shot=bolt uses=many kw=mend edge=splash
Holy Water Vials | charge | c | shot=lob kw=mend edge=splash
Huaraca Stones | charge | c | shot=bolt uses=few kw=stun
Brick Hod | charge | c | shot=lob uses=many kw=slow edge=pierce
Salve Tin | charge | c | shot=lob uses=few kw=mend
Owl-Feather Darts | charge | c | shot=bolt uses=few kw=valor edge=splash
Tesserae Pouch | charge | c | shot=bolt uses=many kw=valor
Genoese Crossbow Bolts | charge | u | shot=bolt uses=few kw=push edge=pierce
Censer Coals | charge | u | shot=lob kw=burn
Sealed Edict Scrolls | charge | u | shot=lob kw=stun edge=crit
Silver Arrows of the Hunt | charge | u | shot=bolt edge=splash
Apothecary's Vials | charge | u | shot=lob edge=pierce
Bag of Winds | charge | r | shot=bolt kw=push
Thousand Paper Cranes | charge | r | shot=bolt kw=slow edge=crit
Burning Lens of Archimedes | charge | r | shot=bolt kw=burn edge=pierce
Arrows of Heracles | charge | l | shot=bolt uses=many kw=poison edge=pierce

Imperial Scribe's Brush | utility | c | util=draw
Cai Lun's Paper | utility | c | util=draw
Quipu Record | utility | c | util=recall
Roman Bathhouse | utility | c | util=cleanse
Illuminated Manuscript | utility | u | util=draw
Alchemist's Still | utility | u | util=copy
Movable Type Press | utility | u | util=copy
Cleric's Absolution | utility | u | util=cleanse
Aryabhata's Tables | utility | u | util=draw
House of Wisdom | utility | r | util=draw
Timbuktu Manuscripts | utility | r | util=draw
Emerald Tablet | utility | r | util=copy
Canon of Medicine | utility | r | util=cleanse
Library of Alexandria | utility | l | util=draw

Roman Caltrops | trap | c | trap=spike kw=slow size=three
Drawbridge Slam | trap | c | trap=blast kw=stun len=long
Gladiator's Net | trap | c | trap=snare kw=slow len=long
Sunfire Glyph | trap | c | trap=blast len=short size=three
Lilia Pits | trap | u | trap=spike len=long size=three
Murder Hole | trap | u | trap=blast kw=burn size=three
Riddle at the Gate | trap | u | trap=snare kw=confuse size=three
Tomb Builder's Pitfall | trap | u | trap=spike kw=mend len=short size=three
Daedalus's Snare | trap | r | trap=snare kw=pull len=long size=three

Noon Sun on Marble | environment | c | env=burn pattern=row
Hedge Maze | environment | c | env=bramble pattern=cross len=short
Monastery Herb Garden | environment | c | env=bramble pattern=burst len=long kw=mend
Marble Quarry | environment | c | env=tremor pattern=column len=long
Pure Snowfield | environment | c | env=freeze pattern=burst len=short
Consecrated Ground | environment | u | env=burn pattern=burst len=long
Rose Garden of Shiraz | environment | u | env=bramble pattern=row len=long
Collapsing Colonnade | environment | r | env=tremor pattern=row len=short
Hanging Gardens of Babylon | environment | l | env=bramble pattern=burst

Crown of the Round Table | piece | l | kw=valor
Grail of the Fisher King | piece | l | kw=mend
Stone of the Philosophers | piece | l | kw=-
Bridle of the Pegasus | piece | l | kw=push
Scales of the Final Judge | piece | l | kw=stun

Pegasus Foal | summon | c | body=Pegasus mod=Tiny beh=summoner tier=sturdy speed=slow trait=martyr
Pegasus | summon | r | body=Pegasus mod=Noble beh=bolt tier=sturdy speed=steady
Centaur Archer | summon | u | body=Centaur beh=snipe tier=tough speed=steady trait=martyr
Chiron, Healer of Heroes | summon | l | body=Centaur mod=Ancient beh=mends tier=sturdy speed=slow trait=blessed
White Unicorn | summon | r | body=Unicorn mod=Pale beh=shields tier=sturdy speed=slow kw=valor trait=blessed
White Stag | summon | u | body=Stag mod=Pale beh=pounce tier=tough speed=steady kw=mend
Snow Crane | summon | c | body=Crane beh=twin tier=sturdy speed=steady kw=valor trait=martyr
Thousand-Year Crane | summon | r | body=Crane mod=Ancient beh=empower tier=sturdy speed=slow kw=mend trait=radiant
Barn Owl | summon | c | body=Owl beh=diag tier=sturdy speed=steady kw=valor trait=guardian
Owl of Athena | summon | u | body=Owl mod=Clever beh=diag tier=sturdy speed=steady trait=blessed
White Wolf | summon | c | body=Wolf mod=Pale beh=pounce tier=tough speed=steady kw=push trait=radiant
White Wolf Matriarch | summon | r | body=Wolf mod=Noble beh=pounce tier=tough speed=steady trait=rallying
Talbot Hound | summon | c | body=Hound mod=Loyal beh=dash tier=sturdy speed=slow trait=guardian
Royal Gyrfalcon | summon | c | body=Hawk mod=Pale beh=diag tier=sturdy speed=quick
Heraldic Griffin | summon | u | body=Griffin mod=Noble beh=empower tier=tough speed=steady kw=mend trait=guardian
Lamassu | summon | r | body=Lamassu beh=taunt tier=tough speed=steady kw=mend trait=martyr
Guardian Sphinx of Giza | summon | u | body=Sphinx mod=Clever beh=guards tier=tough speed=slow trait=rallying
Great Sphinx of Giza | summon | l | body=Sphinx mod=Ancient beh=guards tier=tough speed=steady trait=radiant
White Elephant | summon | r | body=Elephant mod=Pale beh=trample tier=tough speed=slow kw=mend trait=rallying
Hannibal's War Elephant | summon | r | body=Elephant mod=Brave beh=trample tier=tough speed=steady
Qilin | summon | l | body=Qilin beh=mends tier=sturdy speed=slow kw=mend trait=martyr
Valkyrie Herald | summon | u | body=Valkyrie mod=Swift beh=empower tier=sturdy speed=steady trait=rallying
Valkyrie Shieldmaiden | summon | r | body=Valkyrie beh=guards tier=tough speed=steady kw=valor trait=guardian
Cherub | summon | c | body=Angel mod=Tiny beh=mends tier=sturdy speed=slow kw=push trait=radiant
Guardian Angel | summon | u | body=Angel beh=taunt tier=tough speed=slow kw=mend trait=blessed
Forbidden City Lion | summon | u | body=Shishi mod=Stone beh=dash tier=tough speed=steady kw=valor
Rose-Garden Simurgh | summon | l | body=Phoenix mod=Ancient beh=shields tier=sturdy speed=slow trait=radiant
Sylph of the Gale | summon | c | body=Sprite mod=Swift beh=cross tier=sturdy speed=slow kw=push trait=rallying
Roman Legionary | summon | c | body=Knight mod=Iron beh=pounce tier=tough speed=steady kw=valor trait=martyr
Centurion | summon | u | body=Knight mod=Old beh=guards tier=tough speed=quick trait=guardian
Crusader Knight | summon | u | body=Knight mod=Brave beh=taunt tier=tough speed=steady kw=push trait=rallying
Knight of the Round Table | summon | r | body=Knight mod=Noble beh=taunt tier=tough speed=steady kw=valor trait=radiant
Sir Galahad, the Pure | summon | l | body=Knight mod=Pale beh=guards tier=tough speed=steady kw=mend trait=rallying
El Cid Campeador | summon | l | body=Knight mod=Noble beh=taunt tier=tough speed=steady trait=guardian
Longbowman | summon | c | body=Squire mod=Loyal beh=snipe tier=sturdy speed=frantic
Inca Stonemason | summon | c | body=Squire mod=Stone beh=guards tier=tough speed=steady kw=push
Village Physician | summon | c | body=Cleric mod=Gentle beh=shields tier=sturdy speed=slow kw=mend trait=guardian
Battle Cleric | summon | c | body=Cleric mod=Brave beh=zigzag tier=frail speed=quick kw=valor trait=blessed
Vaidya of Taxila | summon | u | body=Cleric mod=Gentle beh=mends tier=sturdy speed=frantic trait=guardian
Hanlin Academy Scribe | summon | c | body=Scholar beh=pierce tier=sturdy speed=quick kw=valor trait=rallying
Persian Astronomer | summon | u | body=Scholar mod=Clever beh=pierce tier=sturdy speed=steady kw=valor
Astronomer of Copan | summon | u | body=Scholar mod=Old beh=bolt tier=sturdy speed=frantic trait=radiant
Imhotep the Builder | summon | l | body=Scholar mod=Ancient beh=mends tier=sturdy speed=slow kw=valor trait=guardian
Terracotta Warrior | summon | u | body=Golem mod=Stone beh=trample tier=tough speed=slow kw=valor trait=blessed
Talos, the Bronze Guard | summon | r | body=Golem mod=Iron beh=guards tier=tough speed=frantic trait=martyr

Roman Ballista | machine | c | mach=Ballista beh=snipe tier=sturdy speed=slow kw=mend
Legion Scorpio Engine | machine | c | mach=Crossbow beh=beam tier=sturdy speed=steady kw=mend
Mangonel | machine | c | mach=Catapult beh=blast tier=sturdy speed=slow kw=push trait=martyr
Battering Ram | machine | c | mach=Engine beh=zigzag tier=tough speed=quick kw=push trait=martyr
Wicker Mantlet | machine | c | mach=Barricade beh=wardmaker tier=tough speed=steady kw=valor trait=rallying
Legion Camp Palisade | machine | c | mach=Palisade beh=wardmaker tier=huge speed=slow kw=mend
Curtain Wall Rampart | machine | c | mach=Rampart beh=wardmaker tier=huge speed=slow kw=push trait=blessed
Norman Keep | machine | c | mach=Bulwark beh=wardmaker tier=huge speed=steady
Onager Catapult | machine | u | mach=Catapult beh=lob tier=sturdy speed=slow kw=push
Counterweight Trebuchet | machine | u | mach=Trebuchet beh=blast tier=sturdy speed=slow
Zhuge Nu Repeater | machine | u | mach=Repeater beh=barrage tier=frail speed=frantic kw=valor
Siege Tower | machine | u | mach=Tower beh=lob tier=tough speed=slow kw=valor trait=guardian
Motte-and-Bailey Palisade | machine | u | mach=Palisade beh=wardmaker tier=huge speed=slow kw=valor trait=rallying
Marble Bastion | machine | u | mach=Bastion beh=wardmaker tier=huge speed=steady kw=valor trait=radiant
Turtle Ship Bulwark | machine | u | mach=Bulwark beh=taunt tier=tough speed=slow
Hero's Automaton | machine | u | mach=Automaton beh=trample tier=tough speed=slow kw=push
Kite of Han Xin | machine | u | mach=Drone beh=twin tier=sturdy speed=quick kw=mend trait=martyr
Polybolos | machine | r | mach=Repeater beh=twin tier=sturdy speed=quick trait=blessed
Helepolis | machine | r | mach=Tower beh=wardmaker tier=tough speed=steady trait=blessed
Star Fort Bastion | machine | r | mach=Bastion beh=wardmaker tier=huge speed=slow trait=radiant
Claw of Archimedes | machine | r | mach=Engine beh=bolt tier=sturdy speed=steady kw=mend trait=rallying
Al-Jazari's Automaton | machine | r | mach=Automaton beh=trample tier=tough speed=slow trait=martyr
Su Song's Clock Tower | machine | r | mach=Tower beh=pierce tier=sturdy speed=steady trait=guardian
Warwolf Trebuchet | machine | l | mach=Trebuchet beh=lob tier=sturdy speed=slow trait=rallying
Krak des Chevaliers | machine | l | mach=Bastion beh=wardmaker tier=tough speed=steady kw=push trait=martyr
`,


/* ---------------- Green · Verdant: nature, the forest and the wild ---------------- */
verdant:`
Hunter's Longbow Shot | strike | c | shape=line rider=pierce cast=charged
Yew Arrow | strike | c | shape=spear cast=charged
Woodsman's Throwing Axe | strike | c | shape=fan rider=onkill cast=charged
Atlatl Dart | strike | c | shape=snipe rider=crit cast=quick
Bear Swipe | strike | c | shape=burst rider=crit
Volley of the Greenwood | strike | u | shape=gun rider=recoil cast=charged
Outlaw's Split Arrow | strike | u | shape=line
Jaguar Pounce | strike | u | shape=diag rider=recoil
Tiger's Rake | strike | r | shape=wedge rider=crit cast=charged
Army Ant March | strike | r | shape=chain cast=quick
Blowgun Dart | strike | c | shape=twin kw=poison rider=crit
Viper Strike | strike | c | shape=line kw=poison rider=recoil cast=charged
Cobra Venom Spray | strike | u | shape=fan kw=poison rider=pierce
Hornet Swarm | strike | u | shape=missiles kw=poison
Komodo Bite | strike | u | shape=wedge kw=drain cast=quick
Curare Needle | strike | u | shape=spear kw=slow cast=quick
Creeping Ivy | strike | c | shape=row kw=slow rider=crit cast=quick
Root Grasp | strike | c | shape=boomerang kw=slow rider=pierce cast=quick
Anaconda Squeeze | strike | r | shape=line kw=slow rider=crit
Liana Whip | strike | c | shape=zigzag kw=pull rider=pierce
Strangler Fig | strike | u | shape=row kw=pull rider=recoil cast=charged
Will-o'-Wisp Lure | strike | u | shape=zigzag kw=pull cast=quick
Stag Leap | strike | c | shape=diag kw=push cast=charged
Grizzly Charge | strike | u | shape=line kw=push rider=recoil
Moose Antler Rush | strike | u | shape=spear kw=push
Highland Caber Toss | strike | r | shape=spear kw=push rider=recoil cast=quick
Tanuki Leaf Trick | strike | c | shape=chain kw=confuse rider=crit cast=quick
Ratatoskr's Insult | strike | c | shape=ricochet kw=confuse cast=charged
Leshy's Wrong Turn | strike | u | shape=zigzag kw=confuse rider=crit cast=charged
Curupira's Backward Trail | strike | r | shape=zigzag kw=confuse
Pan's Panic Pipes | strike | r | shape=all kw=confuse rider=onkill
Monkey Coconut Toss | strike | c | shape=chain kw=stun rider=crit
Elf-Shot | strike | u | shape=snipe kw=stun
Mapinguari Roar | strike | r | shape=shockwave kw=stun cast=quick
Druid's Golden Sickle | strike | c | shape=boomerang kw=mend rider=pierce
Ride of the Wild Hunt | strike | l | shape=snipe kw=drain rider=recoil
Green Knight's Axe | strike | l | shape=wedge kw=valor rider=crit cast=quick
Caledfwlch | strike | l | shape=line kw=valor rider=pierce

Wasp Nest | lob | c | pattern=burst fuse=quick kw=poison after=ground
Squirting Cucumber | lob | c | pattern=cross kw=poison after=ground
Bog Belch | lob | u | pattern=burst kw=poison after=knock
Dart Frog Leap | lob | u | pattern=single fuse=heavy kw=poison
Rafflesia Bloom | lob | r | pattern=ring fuse=heavy kw=poison after=ground
Coconut Drop | lob | c | pattern=single kw=stun after=knock
Falling Deadwood | lob | c | pattern=single fuse=quick kw=stun after=ground
Felled Oak | lob | r | pattern=column fuse=heavy kw=stun after=knock
Pinecone Shower | lob | c | pattern=cross
Acorn Rain | lob | c | pattern=ring fuse=quick after=knock
Seed Pod Barrage | lob | c | pattern=row after=ground
Sticky Sap Glob | lob | c | pattern=burst fuse=quick kw=slow
Wild Honeycomb Hurl | lob | u | pattern=burst kw=slow after=ground
Kapok Fluff Burst | lob | u | pattern=burst fuse=heavy kw=confuse
Toadstool Ring | lob | u | pattern=ring fuse=quick kw=confuse after=ground
Sasquatch Boulder | lob | u | pattern=single fuse=heavy kw=push after=ground
Treefolk Stomp | lob | u | pattern=column fuse=heavy kw=push
Mokele-mbembe's Wake | lob | r | pattern=row fuse=heavy kw=push after=knock
Fall of the Great Ceiba | lob | l | pattern=row fuse=heavy kw=stun after=ground

Hawthorn Hedge | ward | c | form=corridor build=heavy wfx=thorns
Holly Thicket | ward | c | form=corridor wfx=healing
Briar Rose Hedge | ward | u | wfx=thorns form=line
Stacked Log Wall | ward | c | form=rampart len=long
Strangler Fig Roots | ward | u | build=heavy len=long form=line
Living Hedge Maze | ward | r | form=shield build=light
Baobab Bulwark | ward | r | form=rampart build=heavy
Turtle Shell Guard | ward | c | form=cage
Bear Hide Cloak | ward | c | form=arc build=heavy len=short
Moss Mantle | ward | c | form=corridor build=light len=long
Oak Heartwood Shield | ward | u | form=shield wfx=healing len=long
Ghillie Suit | ward | u | form=shield len=short
Pangolin Scales | ward | u | form=shield build=heavy wfx=healing len=short
Green Chapel Gate | ward | l | form=cage build=light len=short

Pitcher Plant | sentry | c | beh=bolt tier=sturdy speed=frantic kw=poison trait=ambush
Sundew Patch | sentry | c | beh=bolt tier=sturdy speed=quick kw=slow
Venus Flytrap | sentry | c | beh=snipe tier=sturdy speed=steady kw=pull
Beltane Maypole | sentry | c | beh=pierce tier=sturdy speed=steady kw=poison trait=thorny
Puffball Sentinel | sentry | c | beh=taunt tier=tough speed=quick trait=camouflage
Carved Stag Post | sentry | c | beh=beam tier=sturdy speed=steady kw=slow trait=regrows
Treehouse Archer Post | sentry | u | beh=snipe tier=sturdy speed=slow trait=thorny
Hornet Hive | sentry | u | beh=barrage tier=frail speed=frantic kw=poison trait=seeds
Whispering Oak | sentry | u | beh=summoner tier=sturdy speed=slow kw=pull trait=regrows
Druid's Standing Stone | sentry | u | beh=chain tier=sturdy speed=steady kw=slow
Weeping Willow | sentry | r | beh=lob tier=sturdy speed=slow kw=slow trait=regrows
Mandrake Patch | sentry | r | beh=cone tier=sturdy speed=steady trait=camouflage

Bear's Might | boon | c | boon=power len=long side=cleanse
Stag's Grace | boon | c | boon=haste len=short
Chameleon Skin | boon | c | boon=dodge side=sprout
Wild Herb Poultice | boon | c | boon=haste side=cleanse
Willow Bark Tea | boon | c | boon=regen len=long timing=delayed
Mistletoe Sprig | boon | c | boon=gauge side=sprout timing=delayed
Shaman's Vision Quest | boon | u | boon=gauge timing=echo
Wolfskin Frenzy | boon | u | boon=pact len=long timing=echo
Fern Seed Vanishing | boon | u | boon=phase len=short timing=delayed
Green Man's Blessing | boon | u | boon=courage len=long side=cleanse timing=delayed
Tapio's Favour | boon | r | boon=power len=short side=cleanse timing=echo
Demeter's Bounty | boon | r | boon=heal side=cleanse timing=delayed
Green Knight's Girdle | boon | l | boon=intervene timing=delayed

Quiver of Yew Arrows | charge | c | shot=bolt uses=many kw=poison edge=pierce
Fletcher's Bundle | charge | c | shot=bolt uses=few edge=splash
Acorn Sack | charge | c | shot=lob edge=crit
Chestnut Basket | charge | c | shot=lob kw=stun edge=pierce
Hunter's Sling Pouch | charge | c | shot=bolt uses=few kw=stun
Poison Dart Pouch | charge | c | shot=bolt uses=few kw=poison edge=crit
Herb Bundle | charge | c | shot=bolt uses=few kw=mend edge=pierce
Monkey's Fruit Stash | charge | c | shot=lob uses=few kw=confuse
Seed Satchel | charge | c | shot=lob uses=many kw=slow edge=crit
Hornet Jar | charge | u | shot=bolt kw=poison
Mushroom Basket | charge | u | shot=lob kw=poison edge=splash
Bola Set | charge | u | shot=bolt kw=slow edge=splash
Gourd of Pine Sap | charge | u | shot=lob kw=slow
Marsh Leech Pouch | charge | u | shot=bolt kw=drain edge=crit
Elven Moonshaft Quiver | charge | r | shot=bolt uses=many
Silver Arrow Prize | charge | r | shot=bolt edge=pierce
Annwn Hunting Quiver | charge | r | shot=bolt uses=many kw=drain edge=splash
Horn of Plenty | charge | l | shot=lob uses=many kw=mend

Tracker's Instinct | utility | c | util=draw
Forest Spring | utility | c | util=cleanse
Squirrel's Cache | utility | c | util=recall
Snakeroot Remedy | utility | u | util=cleanse
Ogham Staves | utility | u | util=draw
Mycelium Network | utility | u | util=copy
Lyrebird Mimicry | utility | r | util=copy
Anansi's Bag of Tales | utility | r | util=draw

Hunter's Net | trap | c | trap=snare len=short size=three
Root Tripwire | trap | c | trap=snare len=long
Bear Pit | trap | c | trap=spike kw=poison len=long size=three
Punji Stakes | trap | c | trap=spike kw=slow len=short size=three
Stinkhorn Patch | trap | c | trap=blast kw=poison
Pitfall of Thorns | trap | u | trap=spike size=three
Deadfall | trap | u | trap=blast kw=stun len=short size=three
Fairy Ring | trap | u | trap=snare kw=confuse
Peat Bog Mire | trap | u | trap=snare kw=slow size=three
Giant Puffball | trap | u | trap=blast kw=confuse size=three
Strangler Vine Snare | trap | r | trap=snare kw=pull len=short
Pixie-Led Path | trap | r | trap=snare kw=confuse len=long size=three

Bramble Thicket | environment | c | env=bramble pattern=burst len=long kw=poison
Tangled Undergrowth | environment | c | env=bramble pattern=row kw=poison
Kudzu Spread | environment | c | env=bramble pattern=cross kw=slow
Heather Moor | environment | c | env=bramble pattern=row len=short kw=slow
Rainforest Canopy | environment | u | env=bramble pattern=cross len=short
Mire of the Fens | environment | u | env=bramble pattern=column len=long
Stampede | environment | u | env=tremor pattern=row
Birnam Wood Marches | environment | r | env=tremor pattern=column len=short
Ent Moot | environment | r | env=tremor pattern=burst len=long
Primeval Wildwood | environment | l | env=bramble pattern=burst

Antlers of the Forest King | piece | l | kw=push
Seed of the World Ash | piece | l | kw=mend
Horn of the Wild Hunt | piece | l | kw=drain
Pipes of the Goat-Footed | piece | l | kw=confuse
Pelt of the Jaguar King | piece | l | kw=-
Mask of the Green Man | piece | l | kw=slow

Elder Ent | summon | r | body=Ent mod=Ancient beh=lob tier=tough speed=slow trait=regrows
Jack-in-the-Green | summon | r | body=Ent mod=Mossy beh=trample tier=tough speed=steady kw=pull
Leshy of the Birchwood | summon | r | body=Leshy beh=guards tier=tough speed=quick trait=seeds
Kodama | summon | c | body=Kodama beh=mends tier=sturdy speed=slow kw=drain
Oak Dryad | summon | u | body=Fairy mod=Gentle beh=lob tier=sturdy speed=quick trait=regrows
Pixie Swarm | summon | c | body=Fairy mod=Tiny beh=twin tier=frail speed=frantic kw=drain
Robin Goodfellow | summon | r | body=Fairy mod=Sly beh=bolt tier=sturdy speed=steady kw=slow trait=ambush
Queen Mab | summon | l | body=Fairy mod=Noble beh=summoner tier=sturdy speed=slow trait=seeds
Will-o'-Wisp | summon | c | body=Spirit mod=Pale beh=zigzag tier=frail speed=quick
Faun Reveler | summon | c | body=Satyr mod=Lucky beh=shields tier=sturdy speed=slow kw=pull
Elven Pathfinder | summon | c | body=Elf beh=twin tier=sturdy speed=steady trait=seeds
Patupaiarehe Mist Folk | summon | u | body=Elf mod=Sly beh=pierce tier=sturdy speed=steady
Curupira | summon | r | body=Elf mod=Wild beh=pierce tier=sturdy speed=steady kw=pull trait=camouflage
Chullachaqui | summon | u | body=Duende mod=Sly beh=blast tier=sturdy speed=slow kw=poison trait=thorny
Alux Field Keeper | summon | c | body=Duende mod=Mossy beh=guards tier=tough speed=frantic kw=poison trait=ambush
Grove Druid | summon | c | body=Druid beh=chain tier=sturdy speed=slow kw=pull trait=thorny
Rainforest Curandero | summon | u | body=Druid mod=Wild beh=mends tier=sturdy speed=slow trait=camouflage
Archdruid of the Oaks | summon | r | body=Druid mod=Ancient beh=chain tier=sturdy speed=slow kw=drain trait=regrows
Greenwood Outlaw | summon | c | body=Squire mod=Sly beh=pierce tier=sturdy speed=frantic kw=poison trait=camouflage
Hooded Outlaw Captain | summon | r | body=Squire mod=Clever beh=bolt tier=sturdy speed=steady kw=poison
Mountain Man Trapper | summon | c | body=Squire mod=Scrappy beh=taunt tier=tough speed=steady kw=slow
Sir Gawain | summon | r | body=Knight mod=Brave beh=taunt tier=tough speed=steady kw=pull trait=seeds
The Green Knight | summon | l | body=Knight mod=Mossy beh=guards tier=tough speed=steady trait=ambush
Arthur, the Once King | summon | l | body=Knight mod=Noble beh=guards tier=tough speed=steady kw=slow trait=camouflage
Gwyn ap Nudd | summon | l | body=Knight mod=Pale beh=bolt tier=sturdy speed=steady trait=thorny
Cwn Annwn Hound | summon | u | body=Hound mod=Pale beh=dash tier=sturdy speed=slow trait=regrows
Herne the Hunter | summon | l | body=Deer mod=Ancient beh=snipe tier=sturdy speed=steady trait=regrows
Tapio, King of the Forest | summon | l | body=Leshy mod=Mossy beh=taunt tier=tough speed=steady kw=drain trait=ambush
Sasquatch | summon | u | body=Sasquatch beh=trample tier=huge speed=slow
Yowie | summon | u | body=Sasquatch mod=Feral beh=cross tier=sturdy speed=slow kw=poison
Basajaun | summon | r | body=Sasquatch mod=Noble beh=trample tier=tough speed=steady trait=camouflage
Kapre Tree Giant | summon | r | body=Sasquatch mod=Old beh=trample tier=huge speed=slow kw=drain trait=regrows
Orang Pendek | summon | c | body=Ape mod=Tiny beh=twin tier=sturdy speed=steady kw=drain trait=ambush
Mapinguari | summon | r | body=Ape mod=Dire beh=pounce tier=tough speed=steady
Old Man of the Forest | summon | u | body=Ape mod=Old beh=mends tier=sturdy speed=slow kw=poison trait=ambush
Capuchin Thief | summon | c | body=Monkey mod=Clever beh=dash tier=sturdy speed=slow kw=slow trait=ambush
Monkey King's Vanguard | summon | u | body=Monkey mod=Brave beh=shields tier=tough speed=steady kw=pull trait=thorny
Tanuki Drummer | summon | c | body=Tanuki mod=Lucky beh=empower tier=sturdy speed=slow kw=drain trait=thorny
Grizzly Matriarch | summon | u | body=Bear mod=Dire beh=summoner tier=tough speed=steady kw=poison trait=thorny
Otso the Honey-Paw | summon | r | body=Bear mod=Ancient beh=guards tier=tough speed=steady kw=drain
Bull Moose | summon | u | body=Moose beh=trample tier=tough speed=steady kw=drain trait=seeds
Dappled Fawn | summon | c | body=Deer mod=Gentle beh=mends tier=sturdy speed=slow kw=pull trait=seeds
Balam Jaguar Knight | summon | r | body=Panther mod=Noble beh=taunt tier=tough speed=steady kw=poison trait=camouflage
Clouded Leopard | summon | c | body=Panther mod=Swift beh=pounce tier=sturdy speed=steady trait=ambush
Sundarbans Tiger | summon | r | body=Tiger mod=Dire beh=pounce tier=tough speed=steady kw=poison trait=ambush
Horangi Mountain Tiger | summon | u | body=Tiger mod=Old beh=dash tier=tough speed=steady kw=drain trait=camouflage
Greenwood Wolf Pack | summon | c | body=Wolf mod=Wild beh=dash tier=sturdy speed=quick trait=ambush
Wild Tusker Boar | summon | c | body=Boar beh=trample tier=tough speed=steady kw=poison trait=regrows
Twrch Trwyth | summon | l | body=Boar mod=Dire beh=guards tier=tough speed=steady kw=poison trait=seeds
Komodo Monitor | summon | r | body=Lizard mod=Dire beh=pounce tier=tough speed=steady kw=drain trait=thorny
Fer-de-Lance | summon | c | body=Serpent mod=Swift beh=bolt tier=sturdy speed=steady kw=drain trait=camouflage
Green Anaconda | summon | r | body=Serpent mod=Dire beh=wardmaker tier=tough speed=steady kw=poison
Poison Dart Frog | summon | c | body=Toad mod=Tiny beh=cross tier=sturdy speed=frantic trait=regrows
Army Ant Soldier | summon | c | body=Ant mod=Hungry beh=guards tier=tough speed=slow
Giant Forest Hornet | summon | c | body=Hornet beh=barrage tier=frail speed=frantic kw=drain trait=camouflage
Sporeling Thallid | summon | c | body=Mushroom beh=blast tier=sturdy speed=quick kw=poison trait=seeds
Thallid Germinator | summon | u | body=Mushroom beh=blast tier=sturdy speed=slow kw=slow trait=seeds
Fungal Thallid Brute | summon | r | body=Mushroom mod=Dire beh=pounce tier=tough speed=steady kw=slow trait=seeds
Moss-Shelled Tortoise | summon | c | body=Tortoise mod=Mossy beh=wardmaker tier=tough speed=slow trait=seeds
Galapagos Giant Tortoise | summon | r | body=Tortoise mod=Ancient beh=trample tier=huge speed=slow kw=pull trait=thorny
Resplendent Quetzal | summon | u | body=Quetzal beh=guards tier=sturdy speed=slow kw=poison trait=regrows
Mokele-mbembe | summon | l | body=Sauropod beh=taunt tier=tough speed=steady trait=thorny

Hunter's Crossbow Rig | machine | c | mach=Crossbow beh=snipe tier=sturdy speed=steady kw=poison trait=ambush
Sharpened Log Palisade | machine | c | mach=Palisade beh=wardmaker tier=huge speed=slow kw=poison trait=camouflage
Sapling Catapult | machine | u | mach=Catapult beh=blast tier=sturdy speed=slow trait=ambush
Treehouse Lookout | machine | u | mach=Tower beh=lob tier=sturdy speed=slow
`,

/* ---------------- Gray · the normal type ----------------
   Creatures that fit any color: suits of armor, golems and guardians, hunters and beasts of
   burden, household spirits and familiars, and the mythical heroes of every culture.
   Gray never has a weakness. Veteran: a Gray creature gets +10% each turn it survives.
   Guardian: Gray guardians step in front of hits aimed at you. Legend: a Gray hero makes your
   other Gray creatures stronger while it stands. */
gray:`
Living Armor | summon | c | body=Armor beh=guards tier=tough speed=quick stance=rear
Empty Helm Sentinel | summon | c | body=Armor beh=taunt tier=tough speed=frantic trait=drilled stance=rear
Haunted Plate | summon | u | body=Armor mod=Grim beh=wardmaker tier=tough speed=steady trait=loyal stance=escort
Rusted Suit of Armor | summon | c | body=Armor mod=Old beh=guards tier=frail speed=steady stance=rear
Gilded Parade Armor | summon | u | body=Armor mod=Noble beh=taunt tier=tough speed=slow stance=front
Black Knight's Armor | summon | r | body=Armor mod=Dire beh=guards tier=tough speed=steady trait=steadfast stance=rear
Tin Soldier | summon | c | body=Squire mod=Tiny beh=taunt tier=huge speed=steady trait=veteran stance=escort
Toy Knight | summon | c | body=Knight mod=Tiny beh=trample tier=tough speed=steady trait=loyal stance=rear
Clay Golem of Prague | summon | r | body=Golem beh=trample tier=tough speed=slow trait=loyal stance=front
Mud Golem | summon | c | body=Golem mod=Mossy beh=bolt tier=tough speed=slow trait=laststand stance=escort
Stone Golem | summon | c | body=Golem mod=Stone beh=bolt tier=tough speed=slow trait=drilled stance=rear
Iron Golem | summon | u | body=Golem mod=Iron beh=guards tier=tough speed=slow stance=escort
Talos, the Bronze Giant | summon | l | body=Golem mod=Iron legend=1 beh=trample tier=huge speed=slow trait=drilled stance=front
Cathedral Gargoyle | summon | c | body=Gargoyle beh=dash tier=tough speed=steady trait=steadfast stance=escort
Grotesque | summon | c | body=Gargoyle mod=Grim beh=wardmaker tier=tough speed=quick trait=veteran stance=front
Waterspout Gargoyle | summon | u | body=Gargoyle mod=Old beh=wardmaker tier=tough speed=steady trait=laststand stance=rear
Shisa | summon | c | body=Shishi beh=wardmaker tier=tough speed=quick stance=escort
Komainu | summon | u | body=Shishi mod=Stone beh=taunt tier=frail speed=steady trait=veteran stance=front
Guardian Lion of the Gate | summon | r | body=Shishi mod=Noble beh=dash tier=tough speed=slow trait=laststand stance=front
Nio Temple Guardian | summon | r | body=Oni mod=Stone beh=taunt tier=huge speed=steady trait=loyal stance=front
Dvarapala | summon | u | body=Hero mod=Stone beh=wardmaker tier=tough speed=frantic trait=loyal stance=front
Moai Watcher | summon | r | body=Golem mod=Ancient beh=trample tier=tough speed=slow trait=steadfast stance=escort
Terracotta Spearman | summon | c | body=Squire mod=Stone beh=bolt tier=tough speed=frantic trait=steadfast stance=front
Terracotta General | summon | r | body=Knight mod=Stone beh=guards tier=tough speed=slow trait=veteran stance=rear
Ushabti Servant | summon | c | body=Squire mod=Tiny beh=guards tier=huge speed=steady stance=escort
Scarecrow Sentinel | summon | c | body=Squire mod=Scrappy beh=taunt tier=tough speed=frantic stance=escort
Shield Maiden | summon | u | body=Heroine beh=taunt tier=tough speed=frantic trait=laststand stance=front
Hoplite | summon | c | body=Knight beh=guards tier=tough speed=frantic trait=laststand stance=rear
Roman Centurion | summon | u | body=Knight mod=Brave beh=guards tier=huge speed=steady trait=veteran stance=front
Gatehouse Sergeant | summon | c | body=Squire beh=wardmaker tier=huge speed=slow trait=steadfast stance=front
Castle Warden | summon | u | body=Knight mod=Old beh=taunt tier=tough speed=quick trait=steadfast stance=escort
Watchtower Guard | summon | c | body=Squire mod=Loyal beh=taunt tier=tough speed=quick trait=laststand stance=rear
Loyal Mastiff | summon | c | body=Hound mod=Loyal beh=pounce tier=frail speed=steady trait=loyal stance=front
Kangal Shepherd Dog | summon | u | body=Hound mod=Brave beh=dash tier=tough speed=steady trait=veteran stance=front
Old Gray Bear | summon | u | body=Bear mod=Old beh=pounce tier=tough speed=steady trait=veteran stance=escort
Cave Bear | summon | c | body=Bear beh=pounce tier=tough speed=quick trait=drilled stance=rear
Wild Boar | summon | c | body=Boar mod=Wild beh=trample tier=huge speed=steady stance=front
Great Tortoise | summon | u | body=Tortoise mod=Ancient beh=wardmaker tier=tough speed=slow trait=drilled stance=front
Snapping Turtle | summon | c | body=Turtle mod=Hungry beh=wardmaker tier=tough speed=frantic trait=drilled stance=escort
Armadillo Knight | summon | u | body=Beetle mod=Brave beh=wardmaker tier=tough speed=slow trait=loyal stance=rear
Ironback Beetle | summon | c | body=Beetle mod=Iron beh=wardmaker tier=huge speed=slow trait=loyal stance=escort
Mimic Chest | summon | u | body=Mimic beh=guards tier=frail speed=steady trait=steadfast stance=front
War Elephant | summon | r | body=Elephant beh=trample tier=tough speed=steady trait=drilled stance=front
Ox of the Plough | summon | c | body=Bull mod=Gentle beh=trample tier=frail speed=steady trait=laststand stance=front
Aurochs | summon | u | body=Bull mod=Ancient beh=trample tier=tough speed=steady stance=escort
Wandering Ronin | summon | u | body=Hero mod=Scrappy beh=pounce tier=tough speed=steady stance=rear
Bridge Troll | summon | u | body=Ogre mod=Mossy beh=pounce tier=tough speed=frantic stance=front
Ettin | summon | r | body=Ogre mod=Dire beh=pounce tier=huge speed=slow trait=laststand stance=front

Longbow Yeoman | summon | c | body=Hero beh=snipe tier=huge speed=steady trait=veteran stance=rear
Village Archer | summon | c | body=Squire beh=snipe tier=frail speed=steady stance=front
Shepherd Slinger | summon | c | body=Squire mod=Swift beh=summoner tier=frail speed=steady trait=loyal stance=rear
Scythian Horse Archer | summon | u | body=Centaur beh=snipe tier=frail speed=steady trait=steadfast stance=rear
Steppe Rider | summon | u | body=Horse mod=Swift beh=bolt tier=huge speed=steady stance=rear
Amazon Archer | summon | u | body=Heroine beh=snipe tier=sturdy speed=frantic trait=laststand stance=rear
Mounted Bowman | summon | c | body=Horse beh=snipe tier=huge speed=steady trait=drilled stance=escort
Javelin Thrower | summon | c | body=Hero mod=Swift beh=lob tier=frail speed=slow trait=loyal stance=rear
Spear Hunter | summon | c | body=Hero mod=Wild beh=pierce tier=huge speed=steady trait=laststand stance=escort
Woodcutter | summon | c | body=Squire mod=Old beh=cone tier=sturdy speed=frantic trait=steadfast stance=front
Bounty Hunter | summon | u | body=Hero mod=Sly beh=snipe tier=tough speed=steady trait=drilled stance=rear
Wandering Ranger | summon | u | body=Heroine mod=Swift beh=snipe tier=sturdy speed=quick stance=front
Tracker | summon | c | body=Hero mod=Clever beh=twin tier=sturdy speed=quick trait=drilled stance=front
Falconer | summon | u | body=Hero mod=Noble beh=diag tier=sturdy speed=steady trait=drilled stance=rear
Hunting Falcon | summon | c | body=Hawk mod=Swift beh=diag tier=sturdy speed=quick trait=loyal stance=escort
Peregrine | summon | c | body=Hawk beh=zigzag tier=frail speed=steady trait=laststand stance=rear
Kestrel | summon | c | body=Hawk mod=Tiny beh=cone tier=frail speed=steady trait=veteran stance=rear
Osprey | summon | c | body=Hawk mod=Hungry beh=twin tier=frail speed=steady trait=drilled stance=rear
Golden Eagle | summon | u | body=Hawk mod=Noble beh=diag tier=sturdy speed=steady trait=loyal stance=front
Messenger Pigeon | summon | c | body=Hawk mod=Gentle beh=chain tier=sturdy speed=frantic trait=veteran stance=escort
Night Owl Scout | summon | c | body=Owl beh=diag tier=sturdy speed=quick trait=laststand stance=front
Horned Owl | summon | u | body=Owl mod=Grim beh=diag tier=sturdy speed=frantic stance=rear
Quill Porcupine | summon | c | body=Boar mod=Scrappy beh=beam tier=huge speed=steady trait=drilled stance=rear
Spiny Hedgehog | summon | c | body=Mole mod=Scrappy beh=zigzag tier=frail speed=steady trait=loyal stance=escort
Spitting Llama | summon | c | body=Camel mod=Sly beh=pierce tier=huge speed=steady trait=steadfast stance=front
Bactrian Camel | summon | u | body=Camel mod=Old beh=cone tier=sturdy speed=steady trait=laststand stance=escort
Gray Fox | summon | c | body=Fox mod=Sly beh=dash tier=tough speed=quick trait=drilled stance=front
Plains Wolf | summon | c | body=Wolf beh=dash tier=frail speed=steady trait=drilled stance=front
Lone Wolf | summon | u | body=Wolf mod=Scrappy beh=dash tier=sturdy speed=frantic trait=veteran stance=front
Alpha Wolf | summon | r | body=Wolf mod=Dire beh=dash tier=sturdy speed=steady stance=front
Hunting Hound | summon | c | body=Hound beh=dash tier=huge speed=steady trait=laststand stance=front
Alley Cat | summon | c | body=Cat mod=Scrappy beh=dash tier=frail speed=steady trait=veteran stance=escort
Lynx | summon | u | body=Cat mod=Wild beh=dash tier=sturdy speed=quick trait=loyal stance=front
Wildcat | summon | c | body=Cat mod=Feral beh=pounce tier=huge speed=steady trait=steadfast stance=rear
Sea Eagle | summon | u | body=Hawk mod=Dire beh=diag tier=frail speed=steady stance=escort
Mountain Goat | summon | c | body=Stag mod=Scrappy beh=cone tier=huge speed=steady trait=loyal stance=rear
Ibex | summon | u | body=Stag mod=Wild beh=pierce tier=sturdy speed=frantic trait=loyal stance=escort
Hippogriff | summon | u | body=Hippogriff beh=twin tier=sturdy speed=frantic trait=steadfast stance=escort
Hippogriff Rider | summon | r | body=Hippogriff mod=Noble beh=twin tier=sturdy speed=quick trait=laststand stance=escort
War Griffin | summon | r | body=Griffin mod=Brave beh=snipe tier=sturdy speed=quick trait=steadfast stance=rear
Royal Griffin | summon | l | body=Griffin mod=Noble beh=pierce tier=sturdy speed=steady trait=steadfast stance=escort
Sleipnir, the Eight-Legged Steed | summon | l | body=Horse mod=Swift beh=twin tier=sturdy speed=steady trait=loyal stance=escort
Arion, the Swift Horse | summon | r | body=Horse mod=Swift beh=zigzag tier=sturdy speed=steady stance=rear
Bayard, the Magic Bay | summon | r | body=Horse mod=Lucky beh=bolt tier=sturdy speed=quick trait=veteran stance=rear
Uchchaihshravas | summon | l | body=Pegasus mod=Noble beh=bolt tier=sturdy speed=frantic trait=drilled stance=rear
Wandering Bard | summon | c | body=Hero mod=Gentle beh=empower tier=frail speed=steady trait=steadfast stance=escort
Crossbow Militia | summon | c | body=Squire mod=Brave beh=snipe tier=huge speed=frantic trait=drilled stance=rear
Pikeman | summon | c | body=Knight beh=twin tier=huge speed=steady trait=laststand stance=rear
Sellsword | summon | u | body=Hero mod=Scrappy beh=zigzag tier=huge speed=steady trait=steadfast stance=escort
Veteran Captain | summon | r | body=Knight mod=Old beh=diag tier=sturdy speed=steady trait=veteran stance=escort
Errant Knight | summon | u | body=Knight mod=Brave beh=taunt tier=tough speed=slow trait=veteran stance=escort
Cossack Rider | summon | u | body=Horse mod=Brave beh=pierce tier=sturdy speed=slow trait=drilled stance=rear
Gaucho with Bolas | summon | u | body=Hero mod=Wild beh=twin tier=frail speed=steady trait=laststand stance=escort
Mongol Outrider | summon | r | body=Horse mod=Dire beh=pierce tier=sturdy speed=steady trait=laststand stance=rear
Maasai Spearman | summon | u | body=Hero mod=Brave beh=guards tier=tough speed=frantic trait=loyal stance=escort
Zulu Impi | summon | u | body=Hero mod=Swift beh=zigzag tier=frail speed=quick trait=steadfast stance=escort
Viking Raider | summon | c | body=Hero mod=Feral beh=pierce tier=frail speed=steady trait=drilled stance=escort

Hill Giant | summon | u | body=Ogre beh=lob tier=huge speed=slow trait=drilled stance=rear
Rock-Throwing Cyclops | summon | r | body=Ogre mod=Dire beh=trample tier=huge speed=slow trait=veteran stance=rear
Stone Troll | summon | u | body=Ogre mod=Stone beh=pounce tier=tough speed=slow trait=veteran stance=front
Ogre Brute | summon | c | body=Ogre beh=lob tier=huge speed=slow trait=steadfast stance=escort
Mountain Gorilla | summon | u | body=Ape beh=pounce tier=tough speed=slow trait=steadfast stance=rear
Sling Monkey | summon | c | body=Monkey mod=Sly beh=mends tier=frail speed=slow trait=laststand stance=escort
Howler Monkey | summon | c | body=Monkey mod=Wild beh=diag tier=huge speed=slow trait=steadfast stance=rear
Coconut Crab | summon | c | body=Crab beh=wardmaker tier=frail speed=slow trait=laststand stance=front
Boulder Golem | summon | u | body=Golem mod=Stone beh=trample tier=tough speed=slow stance=rear
Pebble Golem | summon | c | body=Golem mod=Tiny beh=trample tier=tough speed=quick trait=loyal stance=escort
Rock Elemental | summon | r | body=Golem mod=Ancient beh=lob tier=sturdy speed=slow trait=steadfast stance=front
Siege Ogre | summon | r | body=Ogre mod=Iron beh=blast tier=huge speed=slow trait=loyal stance=rear
Two-Headed Giant | summon | r | body=Ogre mod=Grim beh=trample tier=huge speed=slow trait=laststand stance=escort
Jotun Hurler | summon | r | body=Ogre mod=Ancient beh=cross tier=sturdy speed=slow stance=rear
Fomorian Brute | summon | u | body=Ogre mod=Feral beh=pounce tier=tough speed=slow trait=drilled stance=escort
Oni Pebble-Tosser | summon | c | body=Oni mod=Tiny beh=pounce tier=tough speed=quick trait=steadfast stance=front
Gremlin Pot-Thrower | summon | c | body=Gremlin mod=Scrappy beh=blast tier=frail speed=slow stance=rear
Kobold Sapper | summon | c | body=Goblin mod=Clever beh=barrage tier=sturdy speed=frantic trait=veteran stance=rear
Hobgoblin Grenadier | summon | u | body=Goblin mod=Brave beh=blast tier=sturdy speed=slow stance=front
Barrel-Rolling Dwarf | summon | u | body=Dwarf mod=Lucky beh=cross tier=sturdy speed=slow trait=laststand stance=escort
Village Brawler | summon | c | body=Hero mod=Scrappy beh=cross tier=sturdy speed=quick trait=laststand stance=rear
Tavern Bouncer | summon | c | body=Ogre mod=Gentle beh=barrage tier=sturdy speed=quick stance=rear
Mole Sapper | summon | c | body=Mole mod=Clever beh=burrow tier=huge speed=slow trait=loyal stance=front
Badger | summon | c | body=Mole mod=Feral beh=blast tier=sturdy speed=quick trait=drilled stance=rear
Rampaging Rhino | summon | u | body=Bull mod=Dire beh=trample tier=tough speed=quick stance=front
Charging Bison | summon | c | body=Bull mod=Wild beh=trample tier=frail speed=slow stance=front
Woolly Mammoth | summon | r | body=Elephant mod=Ancient beh=zigzag tier=tough speed=quick trait=veteran stance=rear
Elephant Bird | summon | u | body=Roc mod=Tiny beh=trample tier=tough speed=frantic trait=veteran stance=front
Stone-Dropping Vulture | summon | c | body=Crow mod=Hungry beh=cross tier=sturdy speed=frantic trait=loyal stance=rear
Thunder Ram | summon | u | body=Bull mod=Brave beh=chain tier=tough speed=slow trait=loyal stance=escort

Familiar Cat | summon | c | body=Cat mod=Gentle beh=dash tier=huge speed=slow trait=veteran stance=front
Tabby Familiar | summon | c | body=Cat mod=Lucky beh=shields tier=sturdy speed=quick trait=steadfast stance=escort
Owl Familiar | summon | c | body=Owl mod=Clever beh=snipe tier=tough speed=slow trait=laststand stance=rear
Toad Familiar | summon | c | body=Toad mod=Gentle beh=empower tier=sturdy speed=quick trait=veteran stance=escort
Raven Familiar | summon | u | body=Crow mod=Clever beh=mends tier=sturdy speed=slow trait=loyal stance=rear
Brownie | summon | c | body=Duende mod=Gentle beh=summoner tier=huge speed=slow stance=rear
Domovoi | summon | u | body=Duende mod=Old beh=shields tier=sturdy speed=slow trait=loyal stance=front
Tomte | summon | c | body=Duende mod=Ancient beh=summoner tier=frail speed=slow trait=drilled stance=rear
Hob of the Hearth | summon | c | body=Duende mod=Mossy beh=mends tier=sturdy speed=quick trait=veteran stance=front
Zashiki-warashi | summon | u | body=Kodama mod=Lucky beh=empower tier=sturdy speed=slow trait=steadfast stance=escort
Lares of the Home | summon | u | body=Spirit mod=Gentle beh=mends tier=sturdy speed=quick stance=escort
Household Kobold | summon | c | body=Goblin mod=Gentle beh=shields tier=huge speed=slow trait=veteran stance=escort
Village Healer | summon | c | body=Heroine mod=Gentle beh=empower tier=huge speed=slow stance=escort
Wise Woman | summon | u | body=Heroine mod=Old beh=shields tier=sturdy speed=slow trait=steadfast stance=rear
Field Surgeon | summon | u | body=Hero mod=Clever beh=empower tier=sturdy speed=slow trait=laststand stance=front
Herbwife | summon | c | body=Heroine mod=Mossy beh=summoner tier=sturdy speed=quick trait=loyal stance=rear
Midwife | summon | c | body=Heroine mod=Gentle beh=mends tier=sturdy speed=frantic stance=front
Saint Bernard | summon | u | body=Hound mod=Gentle beh=mends tier=sturdy speed=frantic trait=laststand stance=escort
Therapy Pony | summon | c | body=Horse mod=Tiny beh=shields tier=sturdy speed=frantic trait=laststand stance=front
Faithful Donkey | summon | c | body=Horse mod=Loyal beh=empower tier=frail speed=slow trait=loyal stance=escort
Milk Cow | summon | c | body=Bull mod=Gentle beh=summoner tier=frail speed=slow stance=escort
Mother Hen | summon | c | body=Crane mod=Tiny beh=summoner tier=frail speed=quick stance=rear
Honeybadger | summon | u | body=Mole mod=Brave beh=summoner tier=sturdy speed=slow trait=drilled stance=escort
Sacred Ibis | summon | u | body=Crane mod=Noble beh=shields tier=sturdy speed=frantic trait=drilled stance=escort
Beaver Builder | summon | c | body=Rat mod=Clever beh=mends tier=huge speed=slow trait=drilled stance=escort
Capybara | summon | c | body=Rat mod=Gentle beh=shields tier=frail speed=slow trait=steadfast stance=escort
Wandering Monk | summon | u | body=Hero mod=Gentle beh=empower tier=sturdy speed=frantic stance=escort
Pilgrim | summon | c | body=Hero mod=Old beh=empower tier=sturdy speed=quick trait=steadfast stance=front
Tea Master | summon | r | body=Hero mod=Clever beh=mends tier=sturdy speed=slow trait=drilled stance=front
Camp Cook | summon | c | body=Ogre mod=Gentle beh=mends tier=huge speed=slow stance=front

Beowulf | summon | l | body=Hero mod=Brave legend=1 beh=guards tier=tough speed=steady trait=loyal stance=front
Gilgamesh | summon | l | body=Hero mod=Noble legend=1 beh=lob tier=sturdy speed=slow trait=veteran stance=rear
Enkidu | summon | r | body=Ape mod=Wild legend=1 beh=taunt tier=tough speed=steady trait=drilled stance=escort
Hua Mulan | summon | l | body=Heroine mod=Brave legend=1 beh=bolt tier=sturdy speed=steady trait=steadfast stance=rear
Cu Chulainn | summon | l | body=Hero mod=Feral legend=1 beh=bolt tier=sturdy speed=steady trait=laststand stance=front
Sundiata Keita | summon | l | body=Hero mod=Noble legend=1 beh=guards tier=tough speed=steady trait=laststand stance=escort
Momotaro | summon | r | body=Hero mod=Lucky legend=1 beh=twin tier=sturdy speed=steady trait=steadfast stance=front
Atalanta | summon | r | body=Heroine mod=Swift legend=1 beh=snipe tier=sturdy speed=steady trait=loyal stance=rear
Heracles | summon | l | body=Hero mod=Brave legend=1 beh=lob tier=sturdy speed=slow trait=loyal stance=escort
Perseus | summon | r | body=Hero mod=Clever legend=1 beh=bolt tier=sturdy speed=slow trait=veteran stance=front
Theseus | summon | r | body=Hero mod=Brave legend=1 beh=guards tier=tough speed=quick trait=laststand stance=front
Achilles | summon | l | body=Hero mod=Swift legend=1 beh=pierce tier=sturdy speed=steady trait=veteran stance=front
Hector of Troy | summon | r | body=Knight mod=Noble legend=1 beh=taunt tier=tough speed=steady trait=veteran stance=rear
Rostam | summon | l | body=Hero mod=Brave legend=1 beh=taunt tier=tough speed=steady trait=steadfast stance=front
Arjuna | summon | l | body=Hero mod=Noble legend=1 beh=bolt tier=sturdy speed=steady trait=drilled stance=escort
Sigurd | summon | r | body=Hero mod=Brave legend=1 beh=pierce tier=sturdy speed=quick trait=drilled stance=escort
Ilya Muromets | summon | r | body=Hero mod=Old legend=1 beh=guards tier=tough speed=slow trait=steadfast stance=front
Lancelot | summon | r | body=Knight mod=Noble legend=1 beh=taunt tier=tough speed=quick trait=loyal stance=front
Gawain | summon | r | body=Knight mod=Brave legend=1 beh=pounce tier=tough speed=steady trait=laststand stance=front
El Cid | summon | r | body=Knight mod=Noble legend=1 beh=twin tier=sturdy speed=steady trait=veteran stance=rear
Roland | summon | r | body=Knight mod=Brave legend=1 beh=wardmaker tier=tough speed=steady stance=front
Robin Hood | summon | r | body=Hero mod=Sly legend=1 beh=snipe tier=sturdy speed=steady stance=escort
Mwindo | summon | r | body=Hero mod=Lucky legend=1 beh=shields tier=sturdy speed=slow stance=escort
Kintaro | summon | r | body=Hero mod=Tiny legend=1 beh=lob tier=sturdy speed=frantic trait=steadfast stance=rear
Fionn mac Cumhaill | summon | r | body=Hero mod=Clever legend=1 beh=bolt tier=sturdy speed=frantic trait=loyal stance=front
Scathach | summon | l | body=Heroine mod=Grim legend=1 beh=pounce tier=sturdy speed=steady trait=drilled stance=front
Tomoe Gozen | summon | r | body=Heroine mod=Brave legend=1 beh=pierce tier=sturdy speed=frantic trait=drilled stance=front
Antarah the Poet-Knight | summon | r | body=Hero mod=Noble legend=1 beh=guards tier=tough speed=frantic trait=drilled stance=front
Hunahpu and Xbalanque | summon | l | body=Hero mod=Lucky legend=1 beh=blast tier=sturdy speed=slow trait=laststand stance=rear
Glooscap | summon | l | body=Hero mod=Ancient legend=1 beh=mends tier=sturdy speed=slow trait=veteran stance=escort

Shield Wall | ward | c | form=shield build=heavy wfx=steady len=short
Phalanx | ward | u | form=rampart build=heavy wfx=thorns
Testudo | ward | u | form=shield build=heavy
Schiltron | ward | r | form=corridor build=heavy wfx=thorns len=short
Hedge of Spears | ward | c | form=rampart build=light wfx=thorns len=short
Wagon Circle | ward | c | form=arc len=short
Shield Brace | ward | c | form=shield build=heavy wfx=thorns len=long
Hold the Gate | ward | u | wfx=steady form=line
Last Stand | ward | r | form=shield wfx=steady len=long
Iron Ring Fort | ward | l | form=arc build=heavy len=long

Battle Cry | boon | c | boon=courage len=long timing=delayed
Rallying Horn | boon | c | boon=courage side=muster timing=delayed
Haka War Dance | boon | u | boon=power timing=echo
Kiai Shout | boon | c | boon=power len=long
Oath of Brotherhood | boon | u | boon=courage len=short timing=echo
Hunter's Focus | boon | c | boon=haste side=rally
Stubborn Will | boon | u | boon=dodge side=muster
Campfire Rest | boon | c | boon=heal timing=delayed
Trusty Steed | boon | u | boon=haste len=short
Song of the Old Heroes | boon | r | boon=courage len=long side=rally timing=echo

Sling Stones | charge | c | shot=burst uses=few edge=crit
Hunter's Quiver | charge | c | shot=twin uses=many edge=pierce
Bag of Rocks | charge | c | shot=lob edge=splash
Throwing Axes | charge | u | shot=bolt
Javelin Bundle | charge | u | shot=bolt uses=few edge=pierce
Caltrop Pouch | charge | c | shot=lob uses=few kw=slow
Boomerang Belt | charge | u | shot=lob uses=many
Bundle of Darts | charge | c | shot=twin uses=few
Hurling Stones | charge | r | shot=lob uses=many kw=push edge=pierce
Legendary Quiver | charge | l | shot=bolt uses=many edge=splash
`,

/* ---------------- Brown · technology ----------------
   The tech of every race: dwarven forges, gnomish clockwork, elven crystal, goblin junk,
   desert alchemy, sea-folk diving gear, sky-folk kites, troll bone-work, djinn brass and human
   craft. Instants (tap to use at once): buff potions, gadgets and the deck tools (search,
   reshuffle, keep and reshuffle, recharge). Equipment for your creatures, Tinker for your cards,
   machines, and Aces with their Enchantments for your Sidearm.
   race=  Race tech: +10% for each other card of that race in your hand.
   unstable=1  Goblin and gremlin tech: 30% stronger, 1 in 5 misfires. */
brown:`
Dwarven Cannon Nest | machine | c | mach=Cannon beh=summoner tier=huge speed=steady trait=racetech race=dwarf
Steam Cannon | machine | u | mach=Cannon race=dwarf beh=twin tier=sturdy speed=steady
Dwarven Runic Battery | machine | l | mach=Tower beh=zigzag tier=frail speed=quick trait=racetech race=dwarf
Gnomish Arc Turret | machine | u | mach=Tower race=gnome beh=bolt tier=sturdy speed=frantic trait=selfrepair
Clockwork Owl | machine | c | mach=Drone race=gnome beh=snipe tier=tough speed=slow
Elven Moonbow Ballista | machine | u | mach=Ballista beh=snipe tier=sturdy speed=frantic trait=racetech race=elf
Elven Starglass Spire | machine | r | mach=Tower race=elf beh=bolt tier=sturdy speed=quick
Goblin Junk Cannon | machine | c | mach=Cannon race=goblin beh=bolt tier=tough speed=steady trait=overclock
Harbor Ballista | machine | c | mach=Ballista race=sea beh=snipe tier=sturdy speed=quick trait=selfrepair
Lighthouse Lens Beam | machine | r | mach=Tower race=sea beh=pierce tier=sturdy speed=steady trait=overclock
Sky-Ship Deck Gun | machine | r | mach=Cannon race=sky beh=bolt tier=sturdy speed=slow trait=overclock
Djinn Brass Idol | machine | r | mach=Tower race=djinn beh=empower tier=sturdy speed=steady trait=selfrepair
Troll Bone Ballista | machine | c | mach=Ballista race=troll beh=snipe tier=tough speed=steady trait=selfrepair
Alchemist's Fire Siphon | machine | u | mach=Cannon beh=pierce tier=frail speed=steady trait=racetech race=alchemy
Brass Crossbow Turret | machine | c | mach=Crossbow race=human beh=snipe tier=huge speed=steady
Antikythera Sentinel | machine | l | mach=Automaton beh=guards tier=tough speed=steady trait=racetech race=human

Gnomish Gatling | machine | c | mach=Gatling race=gnome beh=pierce tier=huge speed=steady trait=selfrepair
Brass Hornet Swarm | machine | r | mach=Drone beh=barrage tier=frail speed=frantic trait=racetech race=gnome
Goblin Rattle-Gun | machine | c | mach=Gatling race=goblin beh=zigzag tier=frail speed=steady
Chu-ko-nu Repeater | machine | u | mach=Repeater race=human beh=barrage tier=frail speed=quick
Elven Spinning Glaive | machine | u | mach=Repeater race=elf beh=twin tier=sturdy speed=quick trait=overclock
Coral Spitter | machine | c | mach=Repeater race=sea beh=twin tier=frail speed=quick trait=selfrepair
Sky-Folk Kite Drone | machine | u | mach=Drone beh=twin tier=huge speed=quick trait=racetech race=sky
Dwarven Rivet Gun | machine | r | mach=Gatling beh=pierce tier=sturdy speed=slow trait=racetech race=dwarf
Troll Pebble Hurler | machine | c | mach=Repeater race=troll beh=blast tier=tough speed=slow trait=overclock
Al-Jazari's Elephant Clock | machine | l | mach=Automaton beh=trample tier=tough speed=quick trait=racetech race=djinn

Siege Mangonel | machine | c | mach=Catapult race=human beh=cross tier=huge speed=slow trait=selfrepair
Castle Trebuchet | machine | u | mach=Trebuchet beh=lob tier=tough speed=slow trait=racetech race=human
Goblin Rocket Rack | machine | c | mach=Engine race=goblin beh=lob tier=frail speed=slow trait=overclock
Gnomish Bomb Lobber | machine | c | mach=Catapult beh=blast tier=tough speed=frantic trait=racetech race=gnome
Alchemist's Acid Mortar | machine | u | mach=Engine beh=blast tier=frail speed=slow trait=racetech race=alchemy
Troll Boulder Sling | machine | c | mach=Catapult race=troll beh=pounce tier=tough speed=quick
Depth Charge Launcher | machine | r | mach=Engine race=sea beh=lob tier=sturdy speed=slow
Sky-Folk Bomb Balloon | machine | u | mach=Drone race=sky beh=cross tier=sturdy speed=frantic
Dwarven Thunder Mortar | machine | r | mach=Engine beh=lob tier=sturdy speed=quick trait=racetech race=dwarf
Byzantine Fire Engine | machine | r | mach=Engine race=alchemy beh=blast tier=sturdy speed=slow trait=selfrepair
Djinn Sand Cannon | machine | l | mach=Engine beh=bolt tier=sturdy speed=steady trait=racetech race=djinn
Elven Seed Catapult | machine | u | mach=Catapult race=elf beh=lob tier=sturdy speed=frantic trait=overclock

Iron Bastion | machine | c | mach=Bastion beh=taunt tier=huge speed=frantic trait=racetech race=dwarf
Dwarven Gate of Iron | machine | r | mach=Bulwark beh=wardmaker tier=huge speed=slow trait=racetech race=dwarf
Gnomish Pop-Up Wall | machine | c | mach=Barricade race=gnome beh=wardmaker tier=huge speed=quick trait=selfrepair
Elven Thornglass Barrier | machine | u | mach=Palisade race=elf beh=wardmaker tier=tough speed=steady
Goblin Scrap Barricade | machine | c | mach=Barricade race=goblin beh=guards tier=huge speed=frantic trait=selfrepair
Coral Rampart | machine | u | mach=Rampart race=sea beh=taunt tier=huge speed=slow
Sky-Folk Wind Sail Wall | machine | u | mach=Palisade race=sky beh=wardmaker tier=huge speed=frantic
Troll Stone Rampart | machine | c | mach=Rampart race=troll beh=pounce tier=tough speed=frantic trait=selfrepair
Pike Palisade | machine | c | mach=Palisade race=human beh=taunt tier=huge speed=quick trait=overclock
Alchemist's Glass Bulwark | machine | u | mach=Bulwark race=alchemy beh=guards tier=huge speed=slow trait=overclock
Djinn Mirage Wall | machine | r | mach=Bastion race=djinn beh=wardmaker tier=huge speed=steady trait=overclock
Brass Tortoise Wall | machine | l | mach=Bulwark race=human beh=guards tier=tough speed=slow trait=selfrepair

Dwarven Stout | instant | c | as=boon boon=heal race=dwarf
Elven Dew | instant | c | as=boon boon=heal race=elf
Troll Blood Tonic | instant | u | as=boon boon=regen race=troll
Panacea | instant | r | as=boon boon=heal race=alchemy
Elixir of Life | instant | l | as=boon boon=heal race=alchemy
Peach of Immortality | instant | l | as=boon boon=regen race=human
Soma Draught | instant | u | as=boon boon=power race=human
Berserker Brew | instant | c | as=boon boon=power race=troll
Giant's Strength Potion | instant | u | as=boon boon=power race=alchemy
Haoma Cup | instant | r | as=boon boon=courage race=djinn
Liquid Courage | instant | c | as=boon boon=courage race=dwarf
Mead of Poetry | instant | u | as=boon boon=gauge race=human
Mana Potion | instant | c | as=boon boon=gauge race=alchemy
Gnomish Coffee | instant | c | as=boon boon=haste race=gnome
Kahve of the Bazaar | instant | u | as=boon boon=haste race=djinn
Sea-Folk Kelp Tea | instant | c | as=boon boon=regen race=sea
Smoke Bomb | instant | c | as=boon boon=dodge race=goblin
Cat's Eye Tonic | instant | u | as=boon boon=dodge race=elf
Invisibility Draught | instant | r | as=boon boon=phase race=alchemy
Bottled Lightning | instant | u | as=boon boon=haste race=sky unstable=1
Guardian Angel Vial | instant | r | as=boon boon=intervene race=human
Goblin Rage Juice | instant | u | as=boon boon=power race=goblin unstable=1

Throwing Knives | instant | c | as=strike shape=missiles race=human kw=-
Goblin Firecracker | instant | c | as=strike shape=missiles race=goblin unstable=1 kw=burn
Flash Bang Powder | instant | u | as=strike shape=all race=gnome kw=stun
Shock Glove | instant | c | as=strike shape=line race=gnome kw=stun
Elven Flechette | instant | c | as=strike shape=line race=elf kw=-
Bolas | instant | c | as=strike shape=line race=human kw=slow
Boomerang | instant | c | as=strike shape=zigzag race=human kw=-
Chakram | instant | u | as=strike shape=diag race=human kw=-
Net Gun | instant | u | as=strike shape=line race=sea kw=stun
Coral Shrapnel | instant | c | as=strike shape=wedge race=sea kw=-
Djinn Smoke Puff | instant | u | as=strike shape=all race=djinn kw=confuse
Dwarven Blasting Charge | instant | u | as=lob pattern=burst race=dwarf kw=push
Gnomish Grenade | instant | c | as=lob pattern=single race=gnome kw=-
Sticky Tar Bomb | instant | c | as=lob pattern=burst race=troll kw=slow
Acid Flask | instant | c | as=lob pattern=single race=alchemy kw=poison
Sky-Folk Lightning Jar | instant | r | as=lob pattern=burst race=sky kw=stun
Troll Snot Bomb | instant | u | as=lob pattern=burst race=troll unstable=1 kw=poison
Dwarven Rune Grenade | instant | r | as=lob pattern=cross race=dwarf kw=-

Spyglass Peek | instant | c | as=utility util=draw race=sea
Pocket Almanac | instant | c | as=utility util=draw race=human
Dwarven Ledger | instant | u | as=utility util=draw race=dwarf
Elven Star Map | instant | r | as=utility util=draw race=elf
Gnomish Punch-Card Reader | instant | u | as=utility util=draw race=gnome
Dowsing Rod | instant | c | as=utility util=search find=any race=dwarf
Gnomish Card-Finder | instant | c | as=utility util=search find=any race=gnome
Smuggler's Map | instant | c | as=utility util=search find=any race=sea
Goblin Rummage Sack | instant | c | as=utility util=search find=any race=goblin
Quartermaster's Ledger | instant | u | as=utility util=search find=attack race=human
Weapon Rack Index | instant | u | as=utility util=search find=attack race=dwarf
Armorer's Catalog | instant | u | as=utility util=search find=defense race=dwarf
Shield Rack Index | instant | u | as=utility util=search find=defense race=human
Beast Whistle | instant | u | as=utility util=search find=creature race=troll
Kite Signal | instant | u | as=utility util=search find=creature race=sky
Rune Compass | instant | r | as=utility util=search find=rune race=dwarf
Lodestone Locator | instant | r | as=utility util=search find=rune race=alchemy
Akashic Lens | instant | l | as=utility util=search find=pick race=elf
Clockwork Shuffler | instant | u | as=utility util=reshuffle race=gnome
Goblin Card Toss | instant | c | as=utility util=reshuffle race=goblin
Djinn's Whirlwind Deal | instant | r | as=utility util=reshuffle race=djinn
Tidecaller's Shuffle | instant | u | as=utility util=reshuffle race=sea
Elven Sorting Lens | instant | r | as=utility util=keep race=elf
Dwarven Sorting Tray | instant | u | as=utility util=keep race=dwarf
Gnomish Sieve | instant | u | as=utility util=keep race=gnome
Merchant's Scale | instant | l | as=utility util=keep race=djinn
Lightning Battery | instant | u | as=utility util=recharge race=sky
Dwarven Forge Bellows | instant | c | as=utility util=recharge race=dwarf
Gnomish Wind-Up Key | instant | c | as=utility util=recharge race=gnome
Alchemist's Reagent Kit | instant | u | as=utility util=recharge race=alchemy
Storm Jar Generator | instant | r | as=utility util=recharge race=sky
Troll Rock Grinder | instant | l | as=utility util=recharge race=troll
Smelling Salts | instant | c | as=utility util=cleanse race=alchemy
Antidote Kit | instant | u | as=utility util=cleanse race=alchemy
Elven Purifying Lamp | instant | r | as=utility util=cleanse race=elf
Copying Press | instant | u | as=utility util=copy race=human
Gnomish Duplicator | instant | r | as=utility util=copy race=gnome
Grappling Hook | instant | c | as=utility util=recall race=sea

Pop-Up Umbrella Shield | instant | c | as=ward ward=barrier race=gnome
Dwarven Shield Charm | instant | c | as=ward ward=barrier race=dwarf
Gnomish Force Bubble | instant | u | as=ward ward=barrier race=gnome
Elven Glass Ward | instant | u | as=ward ward=barrier race=elf
Sea-Folk Shell Guard | instant | c | as=ward ward=barrier race=sea
Djinn Mirage Cloak | instant | r | as=ward ward=barrier race=djinn

Dwarven War Axe | equip | c | eq=blade race=dwarf
Elven Moon Blade | equip | u | eq=blade race=elf
Goblin Spiked Collar | equip | c | eq=blade race=goblin unstable=1
Troll Bone Club | equip | c | eq=blade race=troll
Sea-Folk Trident Head | equip | c | eq=blade race=sea
Sky-Folk Steel Talons | equip | u | eq=blade race=sky
Damascus Edge | equip | r | eq=blade race=djinn
Masamune's Edge | equip | l | eq=blade race=human
Khopesh | equip | u | eq=blade race=alchemy
Dwarven Plate | equip | c | eq=plate race=dwarf
Elven Leaf Mail | equip | c | eq=plate race=elf
Gnomish Gear Armor | equip | u | eq=plate race=gnome
Troll Hide Barding | equip | c | eq=plate race=troll
Sea-Folk Scale Mail | equip | c | eq=plate race=sea
O-yoroi Lacquer Plate | equip | r | eq=plate race=human
Brigandine Coat | equip | u | eq=plate race=human
Clockwork Spurs | equip | c | eq=spring race=gnome
Gnomish Spring Boots | equip | u | eq=spring race=gnome
Goblin Rocket Pack | equip | u | eq=spring race=goblin unstable=1
Sky-Folk Wing Harness | equip | r | eq=spring race=sky
Quicksilver Horseshoes | equip | u | eq=spring race=alchemy
Tower Shield Harness | equip | c | eq=aegis race=human
Dwarven Aegis Plate | equip | r | eq=aegis race=dwarf
Elven Mirror Shield | equip | u | eq=aegis race=elf
Gnomish Deflector Dish | equip | u | eq=aegis race=gnome
War Banner Pole | equip | c | eq=banner race=human
Regimental Drum | equip | u | eq=banner race=human
Dwarven Clan Standard | equip | r | eq=banner race=dwarf
Conch War Horn | equip | u | eq=banner race=sea
Dwarven Fire Rune | equip | u | eq=rune race=dwarf kw=burn
Elven Frost Sigil | equip | u | eq=rune race=elf kw=freeze
Sky-Folk Spark Coil | equip | r | eq=rune race=sky kw=stun

Whetstone | tinker | c | race=human kw=-
Gun Oil | tinker | c | race=human kw=-
Sharpening Wheel | tinker | c | race=dwarf kw=-
Tempering Oil | tinker | c | race=dwarf kw=-
Lens Polish | tinker | c | race=elf kw=-
Gnomish Overclock | tinker | u | race=gnome kw=-
Dwarven Forge Upgrade | tinker | u | race=dwarf kw=-
Elven Enchanter's Kit | tinker | u | race=elf kw=mend
Goblin Duct Tape | tinker | c | race=goblin unstable=1 kw=-
Alchemical Infusion | tinker | u | race=alchemy kw=poison
Fire Rune Etching | tinker | u | race=dwarf kw=burn
Frost Coating | tinker | u | race=sea kw=freeze
Spark Plug | tinker | u | race=gnome kw=stun
Silver Plating | tinker | c | race=human kw=-
Counterweight | tinker | c | race=troll kw=push
Djinn's Polish | tinker | r | race=djinn kw=confuse
Wayland's Bench | tinker | r | race=human kw=-
Goibniu's Hammer | tinker | r | race=human kw=-
Ilmarinen's Forge | tinker | l | race=human kw=-
Hephaestus's Anvil | tinker | l | race=human kw=burn

Goblin Bomb Bag | charge | c | race=goblin shot=lob uses=few kw=push edge=crit
Dwarven Blasting Keg | charge | u | race=dwarf shot=lob kw=push edge=splash
Gnomish Spark Canister | charge | c | race=gnome shot=bolt uses=few kw=stun
Harpoon Rack | charge | c | race=sea shot=bolt kw=pull
Pebble Pouch | charge | c | race=sky shot=twin
Elven Arrow Pouch | charge | u | race=elf shot=bolt uses=few edge=crit
Acid Vial Belt | charge | u | race=alchemy shot=lob uses=many kw=poison edge=pierce
Troll Rock Satchel | charge | c | race=troll shot=lob uses=few
Brass Shot Bundle | charge | c | race=human shot=twin uses=few edge=splash
Djinn Ember Censer | charge | r | race=djinn shot=lob uses=many kw=burn edge=crit
Clockwork Bolt Feeder | charge | r | race=gnome shot=bolt edge=pierce
Bottomless Quiver | charge | l | race=elf shot=bolt uses=many

Flintlock Pistol | ace | c | shape=line race=human kw=-
Dwarven Hand Cannon | ace | u | shape=nova race=dwarf kw=push
Gnomish Ray Pistol | ace | u | shape=row race=gnome kw=-
Goblin Boomstick | ace | c | shape=nova race=goblin unstable=1 kw=-
Elven Crystal Sling | ace | u | shape=line race=elf kw=-
Harpoon Gun | ace | c | shape=line race=sea kw=pull
Double-Barrel Blunderbuss | ace | r | shape=twin race=human kw=-
Djinn Lamp Blast | ace | r | shape=all race=djinn kw=confuse
Thunder Rod | ace | r | shape=row race=sky kw=stun
Philosopher's Bullet | ace | l | shape=line race=alchemy kw=-
Runic Siege Pistol | ace | l | shape=row race=dwarf kw=-
Troll Bone Crossbow | ace | u | shape=line race=troll kw=slow

Silver Bullets | aceup | c | race=human kw=-
Black Powder Charge | aceup | c | race=dwarf kw=push
Gnomish Scope | aceup | u | race=gnome kw=-
Spread Shot Choke | aceup | u | shape=row race=human kw=-
Scattergun Drum | aceup | r | shape=all race=goblin unstable=1 kw=-
Explosive Rounds | aceup | u | shape=nova race=goblin kw=-
Frost Shell | aceup | u | race=sea kw=freeze
Alchemical Tracer | aceup | c | race=alchemy kw=burn
Elven Mirror Barrel | aceup | r | shape=twin race=elf kw=-
Lightning Capacitor | aceup | r | race=sky kw=stun
Venom Cartridge | aceup | c | race=alchemy kw=poison
Rifled Barrel | aceup | u | race=dwarf kw=-
Bottled Djinn Wind | aceup | r | shape=all race=djinn kw=-
Masterwork Trigger | aceup | l | race=gnome kw=-
Troll Hide Grip | aceup | c | race=troll kw=-
`,

};
/* Later additions to the six colors: each gets three Aces (finishers for the Sidearm) and three
   Ace Enchantments that power up or change whatever Ace is loaded. They roll their own ranks,
   so the cards above keep theirs. */
const CARD_EXTRAS={
fire:`
Phoenix Arrow | ace | u | shape=line kw=burn
Sunfall Lance | ace | r | shape=row kw=burn
Heart of the Volcano | ace | l | shape=nova kw=burn
Dragonfire Coating | aceup | c | kw=burn
Blacksmith's Temper | aceup | u | kw=-
Cyclone Wrap | aceup | r | shape=nova kw=push
`,
frost:`
Narwhal Harpoon | ace | u | shape=line kw=freeze
Tidal Ram | ace | r | shape=row kw=push
Heart of Winter | ace | l | shape=all kw=freeze
Rime Edge | aceup | c | kw=freeze
Undertow Charm | aceup | u | kw=pull
Hurricane Eye | aceup | r | shape=row kw=slow
`,
storm:`
Thunderbird Feather | ace | u | shape=line kw=stun
Djinn's Last Wish | ace | r | shape=all kw=confuse
Vajra of Indra | ace | l | shape=row kw=stun
Static Charge | aceup | c | kw=stun
Gilded Shot | aceup | u | kw=-
Sandstorm Scatter | aceup | r | shape=all kw=slow
`,
verdant:`
Thornheart Seed | ace | u | shape=nova kw=poison
Hunter's Last Arrow | ace | r | shape=line kw=slow
Wrath of the Wild | ace | l | shape=all kw=poison
Venom Tip | aceup | c | kw=poison
Sap of Renewal | aceup | u | kw=drain
Root Snare Wrap | aceup | r | shape=row kw=slow
`,
light:`
Sun Spear | ace | u | shape=line kw=valor
Archangel's Verdict | ace | r | shape=all kw=mend
Last Light of Dawn | ace | l | shape=row kw=mend
Blessed Oil | aceup | c | kw=mend
Oath of Valor | aceup | u | kw=valor
Halo of Judgment | aceup | r | shape=nova kw=-
`,
shadow:`
Banshee's Final Wail | ace | u | shape=all kw=confuse
Reaper's Due | ace | r | shape=line kw=drain
Death's Door | ace | l | shape=nova kw=curse
Cursed Bullet | aceup | c | kw=curse
Blood Price | aceup | u | kw=drain
Fog of Dread | aceup | r | shape=all kw=confuse
`,
};
// Claim cards: ground taken from the enemy (reach=front, patch or deep)
const CARD_CLAIMS={
verdant:`
Creeping Overgrowth | claim | u | reach=front
Rootbound Glade | claim | r | reach=patch
Wildwood Reclamation | claim | l | reach=deep
`,
shadow:`
Spreading Mire | claim | u | reach=front
Sunken Bog | claim | r | reach=patch
The Drowned Fen | claim | l | reach=deep
`,
light:`
Marble Causeway | claim | u | reach=front
Colonnade of Dawn | claim | r | reach=patch
Temple Foundation | claim | l | reach=deep
`,
frost:`
Rising Tide | claim | u | reach=front
Flash Flood | claim | r | reach=patch
The Great Deluge | claim | l | reach=deep
`,
};
// creatures the color sets add to the art's list (art.js), built from the same parts
const CARD_SET_CREATURES={"Merfolk":{"head":"round","ears":"point","snout":"grin","body":"wisp","tail":1,"eyes":"big"},"Fish":{"head":"long","ears":"plume","snout":"wide","body":"small","tail":1,"eyes":"top"},"Seal":{"head":"round","ears":"none","snout":"short","body":"round","tail":1,"eyes":"big"},"Kappa":{"head":"round","ears":"none","snout":"beak","body":"shell","claws":1},"Yeti":{"head":"wide","ears":"round","snout":"short","body":"big","claws":1},"Snowman":{"head":"round","ears":"none","snout":"short","body":"round","eyes":"big"},"Penguin":{"head":"round","ears":"none","snout":"beak","body":"squat","wings":1},"Walrus":{"head":"wide","ears":"none","snout":"tusk","body":"big","mod":{"beard":1}},"Narwhal":{"head":"long","ears":"horns","snout":"long","body":"round","tail":1},"Orca":{"head":"long","ears":"plume","snout":"grin","body":"big","tail":1},"Shark":{"head":"long","ears":"plume","snout":"fangs","body":"coil","tail":1},"Turtle":{"head":"square","ears":"none","snout":"beak","body":"shell","mod":{"scale":1.2,"mat":"s"}},"Crab":{"head":"wide","ears":"antenna","snout":"mandible","body":"shell","claws":1},"Kraken":{"head":"round","ears":"none","snout":"beak","body":"coil","tail":2,"eyes":"glow","mod":{"scale":1.3}},"Leviathan":{"head":"long","ears":"horns","snout":"fangs","body":"coil","tail":2,"eyes":"glow","mod":{"scale":1.3,"mat":"g"}},"Djinn":{"head":"long","ears":"point","snout":"grin","body":"wisp","eyes":"glow","mod":{"beard":1}},"Scarab":{"head":"round","ears":"antenna","snout":"mandible","body":"shell","wings":2},"Camel":{"head":"long","ears":"floppy","snout":"long","body":"big","tail":1},"Manticore":{"head":"wide","ears":"tufts","snout":"fangs","body":"big","wings":2,"tail":1,"claws":1},"Chimera":{"head":"wide","ears":"horns","snout":"fangs","body":"big","tail":2,"claws":1},"Scorpion":{"head":"round","ears":"antenna","snout":"mandible","body":"shell","tail":1,"claws":1},"Jackal":{"head":"long","ears":"point","snout":"long","body":"small","tail":1},"Crocodile":{"head":"long","ears":"none","snout":"long","body":"squat","tail":1,"claws":1},"Roc":{"head":"round","ears":"plume","snout":"beak","body":"big","wings":2,"mod":{"scale":1.3}},"Sphinx":{"head":"helm","ears":"floppy","snout":"short","body":"squat","tail":1,"claws":1,"mod":{"mat":"s"}},"Automaton":{"head":"square","ears":"none","snout":"none","body":"block","eyes":"glow","mod":{"mat":"g"}},"Lizard":{"head":"long","ears":"none","snout":"long","body":"small","tail":1,"claws":1},"Raiju":{"head":"round","ears":"point","snout":"fangs","body":"small","tail":2,"eyes":"glow"},"Chupacabra":{"head":"long","ears":"point","snout":"fangs","body":"squat","eyes":"glow","claws":1},"Simurgh":{"head":"round","ears":"plume","snout":"beak","body":"wisp","wings":2,"tail":2},"Bahamut":{"head":"wide","ears":"none","snout":"wide","body":"coil","tail":2,"mod":{"scale":1.3}},"Sandworm":{"head":"round","ears":"none","snout":"mandible","body":"coil","mod":{"scale":1.2}},"Skeleton":{"head":"round","ears":"none","snout":"grin","body":"small","eyes":"glow"},"Zombie":{"head":"square","ears":"floppy","snout":"wide","body":"squat","claws":1},"Ghoul":{"head":"wide","ears":"point","snout":"fangs","body":"squat","eyes":"big","claws":1},"Ghost":{"head":"round","ears":"none","snout":"none","body":"wisp","eyes":"big"},"Banshee":{"head":"long","ears":"none","snout":"wide","body":"wisp","eyes":"glow"},"Lich":{"head":"helm","ears":"horns","snout":"none","body":"wisp","eyes":"glow","mod":{"beard":1}},"Reaper":{"head":"helm","ears":"none","snout":"none","body":"wisp","eyes":"glow","claws":1,"mod":{"scale":1.2}},"Werewolf":{"head":"long","ears":"point","snout":"fangs","body":"big","tail":1,"eyes":"glow","claws":1},"Gaunt":{"head":"long","ears":"horns","snout":"fangs","body":"big","eyes":"glow","claws":1,"mod":{"scale":1.25}},"Nightmare":{"head":"long","ears":"point","snout":"long","body":"big","tail":1,"eyes":"glow"},"Spider":{"head":"round","ears":"none","snout":"mandible","body":"small","eyes":"glow","claws":1},"Moth":{"head":"round","ears":"antenna","snout":"none","body":"small","wings":2,"eyes":"big"},"Centipede":{"head":"long","ears":"antenna","snout":"mandible","body":"coil","claws":1},"Leech":{"head":"round","ears":"none","snout":"mandible","body":"coil","mod":{"scale":0.8}},"Witch":{"head":"long","ears":"point","snout":"long","body":"small","eyes":"top"},"Plaguemask":{"head":"helm","ears":"none","snout":"beak","body":"big","eyes":"glow"},"Demon":{"head":"wide","ears":"horns","snout":"fangs","body":"big","wings":2,"tail":1,"claws":1},"Crow":{"head":"round","ears":"none","snout":"beak","body":"small","wings":2,"tail":1,"eyes":"glow"},"Cat":{"head":"round","ears":"point","snout":"short","body":"small","tail":1,"eyes":"glow"},"Jiangshi":{"head":"square","ears":"none","snout":"short","body":"block","eyes":"top"},"Pegasus":{"head":"long","ears":"point","snout":"long","body":"big","wings":1,"tail":1},"Centaur":{"head":"round","ears":"round","snout":"short","body":"big","tail":1,"mod":{"beard":1}},"Unicorn":{"head":"long","ears":"horns","snout":"long","body":"big","tail":1,"eyes":"big"},"Stag":{"head":"long","ears":"horns","snout":"short","body":"big","tail":1},"Crane":{"head":"round","ears":"plume","snout":"beak","body":"small","wings":1,"tail":1},"Angel":{"head":"round","ears":"none","snout":"none","body":"wisp","wings":2,"eyes":"glow"},"Lamassu":{"head":"helm","ears":"horns","snout":"short","body":"big","wings":2,"tail":1,"mod":{"beard":1,"mat":"s"}},"Elephant":{"head":"wide","ears":"floppy","snout":"tusk","body":"big","tail":1,"mod":{"scale":1.3}},"Qilin":{"head":"long","ears":"horns","snout":"long","body":"armor","tail":2,"eyes":"glow"},"Valkyrie":{"head":"helm","ears":"plume","snout":"none","body":"armor","wings":1},"Cleric":{"head":"round","ears":"none","snout":"short","body":"round"},"Scholar":{"head":"square","ears":"round","snout":"short","body":"small","mod":{"beard":1}},"Ent":{"head":"square","ears":"none","snout":"none","body":"block","eyes":"glow","mod":{"beard":1,"scale":1.25}},"Leshy":{"head":"square","ears":"horns","snout":"grin","body":"big","eyes":"glow","claws":1,"mod":{"beard":1}},"Deer":{"head":"long","ears":"horns","snout":"short","body":"small","tail":1},"Moose":{"head":"long","ears":"horns","snout":"wide","body":"big","tail":1},"Ape":{"head":"round","ears":"round","snout":"wide","body":"big","claws":1},"Monkey":{"head":"round","ears":"round","snout":"short","body":"small","tail":2},"Panther":{"head":"wide","ears":"point","snout":"fangs","body":"small","tail":1,"claws":1,"eyes":"glow"},"Tiger":{"head":"wide","ears":"round","snout":"fangs","body":"big","tail":1,"claws":1},"Elf":{"head":"long","ears":"point","snout":"none","body":"small"},"Druid":{"head":"round","ears":"none","snout":"none","body":"wisp","mod":{"beard":1}},"Fairy":{"head":"round","ears":"point","snout":"none","body":"wisp","wings":2,"mod":{"scale":0.7}},"Mushroom":{"head":"wide","ears":"none","snout":"grin","body":"squat"},"Ant":{"head":"round","ears":"antenna","snout":"mandible","body":"armor"},"Hornet":{"head":"round","ears":"antenna","snout":"mandible","body":"small","wings":2,"tail":1},"Tortoise":{"head":"round","ears":"none","snout":"beak","body":"shell"},"Sasquatch":{"head":"round","ears":"none","snout":"wide","body":"big","claws":1,"mod":{"scale":1.3}},"Tanuki":{"head":"round","ears":"round","snout":"short","body":"round","tail":1},"Satyr":{"head":"long","ears":"horns","snout":"grin","body":"small","tail":1,"mod":{"beard":1}},"Kodama":{"head":"round","ears":"none","snout":"none","body":"small","eyes":"big","mod":{"scale":0.6}},"Quetzal":{"head":"round","ears":"plume","snout":"beak","body":"small","wings":2,"tail":2},"Sauropod":{"head":"round","ears":"none","snout":"short","body":"big","tail":1,"mod":{"scale":1.3}}};
// "Name | type | rarity | k=v k=v" lines -> entries
function parseCardSet(text){ return text.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')).map(l=>{
  const [name,type,r,opts]=l.split('|').map(s=>s.trim()), e={name, type, rarity:{c:'common',u:'uncommon',r:'rare',l:'legendary'}[r], o:{}};
  for(const kv of (opts||'').split(/\s+/).filter(Boolean)){ const i=kv.indexOf('='); e.o[kv.slice(0,i)]=kv.slice(i+1); }
  return e; }); }
