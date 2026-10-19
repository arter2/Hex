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
Musket Shot | strike | c | shape=snipe kw=- rune=E
Flintlock Ball | strike | c | shape=ricochet kw=push rider=recoil cast=quick rune=F
Bottle Rocket | strike | c | shape=missiles kw=push rider=onkill cast=charged rune=E
Skyrocket | strike | u | shape=cluster kw=stun rider=crit cast=quick cluster=ring rune=B
Rocket Barrage | strike | r | shape=missiles kw=burn rider=onkill cast=quick rune=C
Dragon's Breath | strike | r | shape=fan kw=burn rider=recoil rune=E
Wyvern Spit | strike | u | shape=ricochet cast=quick kw=- rune=E
Kitsune Foxfire | strike | u | shape=ricochet kw=curse rune=F
Oni Club Swing | strike | u | shape=burst kw=self cast=charged rune=E
Minotaur Charge | strike | r | shape=line kw=push rider=recoil rune=E
Bull Rush | strike | c | shape=line kw=push rider=pierce cast=charged rune=E
Pickaxe Strike | strike | c | shape=wedge kw=stun rider=recoil cast=charged rune=E
Miner's Drill | strike | u | shape=mine rider=recoil cast=charged kw=- rune=B
Forge Hammer Throw | strike | c | shape=row kw=stun rider=crit cast=charged rune=C
Red-Hot Rivet | strike | c | shape=ricochet kw=burn rider=crit cast=quick rune=B
Molten Slag Spray | strike | u | shape=fan kw=slow rider=pierce cast=quick rune=F
Lava Jet | strike | c | shape=row kw=slow cast=quick rune=F
Volcanic Vent | strike | r | shape=row kw=burn rune=A
Cyclone of Cinders | strike | r | shape=burst kw=push rider=pierce rune=F
Fire Whirl | strike | u | shape=ricochet kw=push cast=charged rune=E
Phoenix Feather | strike | u | shape=ricochet kw=mend rider=recoil rune=E
Griffin Talon | strike | c | shape=ricochet rider=onkill cast=charged kw=- rune=F
Coyote's Trick Shot | strike | c | shape=boomerang rider=pierce kw=- rune=A
Goblin Slingshot | strike | c | shape=spear kw=self rider=recoil rune=F
Gremlin Sparkler | strike | c | shape=chain kw=confuse cast=quick rune=A
Duende's Ember | strike | c | shape=boomerang kw=confuse rider=onkill rune=D
Shishi Roar | strike | u | shape=shockwave kw=push rider=onkill rune=E
Iaido Slash | strike | r | shape=wedge rider=crit kw=- rune=F
Flaming Shuriken | strike | c | shape=ricochet kw=burn rider=recoil cast=charged rune=E
Dragon Fist | strike | u | shape=wedge kw=push rider=crit cast=charged rune=F
Rockslide | strike | u | shape=burst kw=stun cast=quick rune=B
Obsidian Spear | strike | c | shape=spear kw=self rider=crit cast=quick rune=E
Vampire's Kiss | strike | r | shape=burst kw=valor rune=E
Purifying Flame | strike | l | shape=ricochet kw=burn rider=onkill rune=E
Great Dragon's Roar | strike | l | shape=shockwave kw=burn cast=charged rune=D
Oni King's Kanabo | strike | l | shape=burst kw=self rider=crit rune=F

Dynamite Bundle | lob | c | pattern=single fuse=quick after=ground kw=- rune=B
Black Powder Keg | lob | u | pattern=burst kw=push after=knock rune=E
Grenado | lob | c | pattern=single fuse=heavy kw=push rune=F
Greek Fire Jar | lob | u | pattern=burst fuse=quick kw=burn rune=E
Volcano Bomb | lob | r | pattern=ring fuse=heavy kw=burn rune=D
Lava Glob | lob | c | pattern=single kw=burn rune=C
Magma Geyser | lob | u | pattern=column fuse=heavy kw=curse after=ground rune=E
Meteor Shard | lob | c | pattern=single fuse=heavy after=knock kw=- rune=E
Firework Shell | lob | u | pattern=cross fuse=heavy kw=confuse after=ground rune=F
Paper Lantern Bomb | lob | c | pattern=burst fuse=heavy kw=confuse rune=F
Dragon Egg | lob | r | pattern=burst kw=burn after=ground rune=F
Goblin Bomb | lob | c | pattern=ring fuse=heavy kw=valor after=ground rune=E
Gremlin Grenade | lob | c | pattern=cross fuse=quick after=knock kw=- rune=C
Mortar Round | lob | c | pattern=column kw=push after=ground rune=E
Cannonball | lob | u | pattern=single fuse=quick kw=push after=knock rune=C
Basalt Boulder | lob | c | pattern=single kw=stun after=knock rune=D
Rockfall | lob | u | pattern=row fuse=heavy kw=stun after=knock rune=E
Phoenix Ash Bomb | lob | u | pattern=ring fuse=heavy kw=mend after=knock rune=F
Sake Firebomb | lob | c | pattern=burst fuse=heavy kw=push after=ground rune=F
Thunder-Egg Geode | lob | u | pattern=single fuse=heavy kw=stun after=ground rune=E
Cinder Cone | lob | r | pattern=ring fuse=quick kw=burn after=ground rune=F
Pyroclastic Cloud | lob | r | pattern=row kw=burn after=knock rune=A
Eruption | lob | l | pattern=burst fuse=heavy kw=burn after=knock rune=F

Dwarven Shieldwall | ward | u | form=shield build=light kw=- rune=F
Forge-Iron Plate | ward | c | form=shield build=heavy wfx=shocking len=long kw=- rune=D
Basalt Wall | ward | c | form=arc build=heavy wfx=burning kw=- rune=E
Obsidian Bulwark | ward | u | form=rampart kw=- rune=D
Wall of Fire | ward | c | form=arc build=heavy wfx=thorns len=long kw=- rune=E
Lava Moat | ward | u | form=corridor build=light wfx=burning len=short kw=- rune=F
Mountain Pass Gate | ward | r | form=corridor build=heavy wfx=burning len=long kw=- rune=F
Samurai Armor | ward | u | form=shield len=long kw=- rune=F
Dragon Scale Shield | ward | r | form=shield build=heavy wfx=burning len=short kw=- rune=A
Oni Mask | ward | c | form=arc build=light wfx=thorns len=short kw=- rune=C
Brimstone Rampart | ward | c | form=rampart build=heavy wfx=shocking len=short kw=- rune=F
Anvil Guard | ward | c | form=shield wfx=burning kw=- rune=A
Great Wall Bricks | ward | r | form=rampart build=heavy len=long kw=- rune=F
Molten Shell | ward | l | form=cage build=heavy wfx=thorns len=short kw=- rune=E

Bonfire | sentry | c | beh=zigzag tier=sturdy speed=steady kw=curse trait=scorched rune=F
Forge Bellows | sentry | c | beh=cross tier=sturdy speed=frantic kw=push rune=C
Lava Totem | sentry | c | beh=empower tier=sturdy speed=slow kw=burn trait=dread rune=B
Shishi Guardian Statue | sentry | u | beh=guards tier=tough speed=slow kw=push trait=static rune=E
Fox Lantern | sentry | u | beh=mends tier=tough speed=steady trait=bloodlust kw=- rune=B
Dragon Kiln | sentry | r | beh=blast tier=sturdy speed=steady kw=burn trait=static rune=E
Smoking Chimney | sentry | c | beh=bolt tier=sturdy speed=steady kw=valor trait=harvest rune=F
Torch Post | sentry | c | beh=lob tier=sturdy speed=quick kw=burn trait=forged rune=E
Fire Lookout Tower | sentry | u | beh=snipe tier=sturdy speed=steady kw=burn trait=scorched rune=D
Goblin Flamethrower Post | sentry | u | beh=lob tier=sturdy speed=slow kw=curse trait=scorched rune=F
Phoenix Nest | sentry | r | beh=summoner tier=sturdy speed=slow kw=burn trait=fury rune=E

Battle Fury | boon | u | boon=pact len=long side=scorch kw=- rune=E
Blood Oath of the Oni | boon | r | boon=pact len=short side=rally kw=- rune=B
Berserker's Rage | boon | c | boon=power len=long side=scorch timing=delayed kw=- rune=C
Forge Heat | boon | c | boon=power len=long side=rally kw=- rune=E
Hot Coals Dash | boon | c | boon=haste len=short side=embers kw=- rune=E
Fox's Quickness | boon | c | boon=haste side=jolt kw=- rune=F
Dragon Heart | boon | r | boon=power side=embers timing=echo kw=- rune=✱
Hearty Feast | boon | c | boon=heal side=jolt timing=echo kw=- rune=E
Mulled Wine | boon | c | boon=regen len=long side=rally timing=echo kw=- rune=E
Smith's Focus | boon | u | boon=gauge side=rally timing=echo kw=- rune=A
Molten Courage | boon | u | boon=courage len=short side=scorch kw=- rune=F
Mountain Strength | boon | u | boon=power side=scorch kw=- rune=E
Kitsune Blessing | boon | u | boon=dodge side=rally timing=delayed kw=- rune=E
Phoenix Rebirth | boon | l | boon=intervene side=rally kw=- rune=E
War Drums | boon | c | boon=haste side=embers timing=delayed kw=- rune=D
Bull's Endurance | boon | u | boon=regen side=scorch timing=delayed kw=- rune=E
Dwarven Ale | boon | c | boon=heal side=muster kw=- rune=E

Powder Horn | charge | c | shot=bolt uses=few kw=push edge=splash rune=C
Musket Cartridges | charge | c | shot=bolt uses=many kw=push rune=F
Rocket Crate | charge | u | shot=lob kw=push edge=pierce rune=✱
Bandolier of Flares | charge | c | shot=bolt uses=many kw=confuse edge=pierce rune=F
Ore Cart | charge | u | shot=lob uses=few kw=stun edge=splash rune=F
Coal Sack | charge | c | shot=lob uses=few edge=pierce kw=- rune=E
Goblin Junk Sack | charge | c | shot=lob uses=many edge=splash kw=- rune=E
Rivet Pouch | charge | c | shot=bolt uses=few kw=curse edge=pierce rune=F
Dragon Tooth Quiver | charge | r | shot=bolt uses=many edge=crit kw=- rune=E
Firecracker String | charge | c | shot=burst uses=few kw=push edge=crit rune=C
Lantern Oil Flask | charge | u | shot=bolt kw=burn edge=splash rune=E
Pistol Case | charge | u | shot=bolt kw=push edge=crit rune=E
Blasting Caps | charge | u | shot=lob uses=few kw=push rune=✱
Shishi Pearl | charge | r | shot=bolt kw=- rune=E
Fox-Fire Jar | charge | u | shot=bolt uses=few kw=burn rune=E
Wineskin of Flame | charge | c | shot=burst uses=few kw=- rune=E
Meteorite Fragments | charge | r | shot=lob uses=many kw=stun rune=F
Bottomless Powder Keg | charge | l | shot=lob uses=many kw=push edge=crit rune=E

Prospector's Map | utility | c | util=draw rune=C
Miner's Lamp | utility | c | util=draw rune=F
Smith's Ledger | utility | u | util=draw rune=✱
Cleansing Pyre | utility | u | util=cleanse rune=D
Smelting Crucible | utility | u | util=copy rune=E
Dragon's Riddle | utility | r | util=copy rune=B
Coyote's Trickery | utility | u | util=recall rune=E
Goblin Scavenge | utility | c | util=recall rune=F
Ancestor's Tale | utility | r | util=draw rune=A
Red Envelope | utility | c | util=draw rune=F

Landmine | trap | u | trap=blast kw=- rune=E
Powder Tripwire | trap | c | trap=blast len=short size=three kw=- rune=E
Iron Caltrops | trap | c | trap=spike size=three kw=- rune=E
Magma Pit | trap | u | trap=spike kw=burn len=short rune=A
Cave-In | trap | r | trap=blast kw=stun len=long rune=F
Goblin Snare | trap | c | trap=snare len=short kw=- rune=C
Fox Den Snare | trap | c | trap=snare kw=burn len=short size=three rune=B
Minotaur's Labyrinth | trap | r | trap=snare len=long size=three kw=- rune=A
Ember Spike Pit | trap | c | trap=spike kw=push len=short size=three rune=F
Firework Mine | trap | u | trap=blast kw=push len=short rune=E

Lava Field | environment | c | env=burn pattern=cross len=short kw=- rune=E
Scorched Earth | environment | c | env=burn pattern=row len=short kw=burn rune=A
Volcanic Ash Fall | environment | u | env=burn pattern=burst kw=burn rune=F
Earthquake | environment | r | env=tremor pattern=burst len=short kw=- rune=E
Rumbling Mine | environment | c | env=tremor pattern=burst len=long kw=burn rune=F
Fire Cyclone | environment | u | env=burn pattern=row kw=- rune=C
Ember Rain | environment | c | env=burn pattern=cross kw=curse rune=B
Sulfur Springs | environment | u | env=burn pattern=row len=long kw=curse rune=F
Forge Floor | environment | c | env=burn pattern=column len=short kw=curse rune=F
Rockslide Valley | environment | u | env=tremor pattern=column len=long kw=- rune=E
Mountain's Wrath | environment | r | env=tremor pattern=burst kw=curse rune=E
Sea of Flames | environment | l | env=burn pattern=burst len=long kw=- rune=E

Crown of the Volcano King | piece | l | pattern=ring fuse=heavy kw=burn after=ground rune=E
Heart of the Phoenix | piece | l | pattern=cross fuse=quick kw=mend after=ground rune=F
Eye of the Dragon | piece | l | pattern=cross kw=burn after=ground rune=E
Anvil of the First Forge | piece | l | pattern=column fuse=heavy kw=stun after=knock rune=F
Tail of the Nine-Tailed Fox | piece | l | pattern=single fuse=quick kw=push after=knock rune=E

Red Dragon Whelp | summon | u | body=Dragon mod=Tiny beh=beam tier=frail speed=quick trait=dread kw=- rune=F
Great Red Dragon | summon | l | body=Dragon mod=Dire beh=cone tier=sturdy speed=slow kw=burn trait=forged rune=E
Wyvern | summon | r | body=Wyvern beh=cone tier=sturdy speed=slow kw=curse trait=rallying rune=F
Fire Drake | summon | u | body=Wyvern beh=blast tier=sturdy speed=quick kw=burn trait=scorched rune=E
Griffin | summon | r | body=Griffin mod=Noble beh=barrage tier=sturdy speed=steady trait=plague kw=- rune=F
Phoenix | summon | l | body=Phoenix beh=cone tier=sturdy speed=slow kw=push trait=shatter rune=F
Phoenix Chick | summon | c | body=Phoenix mod=Tiny beh=cone tier=sturdy speed=slow kw=pull trait=fury rune=F
Kitsune | summon | r | body=Kitsune beh=zigzag tier=sturdy speed=steady trait=chilling kw=- rune=E
Nine-Tailed Kitsune | summon | l | body=Kitsune mod=Ancient beh=blast tier=sturdy speed=steady trait=harvest kw=- rune=E
Fire Fox | summon | c | body=Fox beh=dash tier=tough speed=steady kw=burn trait=dread rune=D
Coyote Trickster | summon | u | body=Wolf mod=Sly beh=dash tier=sturdy speed=steady kw=push trait=bloodlust rune=E
Ember Coyote | summon | c | body=Wolf beh=pounce tier=sturdy speed=slow kw=burn trait=bloodlust rune=E
Shishi Lion-Dog | summon | u | body=Shishi beh=pounce tier=sturdy speed=steady kw=push trait=dread rune=C
Oni Brute | summon | r | body=Oni beh=pounce tier=tough speed=steady kw=burn trait=bloodlust rune=F
Red Oni | summon | u | body=Oni mod=Grim beh=trample tier=tough speed=slow kw=push trait=explodes rune=A
Oni Warlord | summon | l | body=Oni mod=Dire beh=pounce tier=tough speed=steady trait=scorched kw=- rune=D
Minotaur | summon | r | body=Minotaur beh=trample tier=tough speed=steady kw=burn trait=overcharge rune=E
Fire Bull | summon | c | body=Bull beh=trample tier=tough speed=steady kw=curse trait=scorched rune=F
Goblin Sapper | summon | c | body=Goblin beh=zigzag tier=sturdy speed=slow kw=burn trait=static rune=A
Goblin Gunner | summon | c | body=Goblin beh=pierce tier=sturdy speed=steady kw=push trait=explodes rune=C
Goblin Chieftain | summon | u | body=Goblin mod=Grim beh=empower tier=sturdy speed=steady kw=push trait=fury rune=B
Gremlin | summon | c | body=Gremlin beh=zigzag tier=frail speed=quick kw=push trait=chilling rune=E
Gremlin Tinkerer | summon | u | body=Gremlin mod=Clever beh=zigzag tier=frail speed=quick kw=burn trait=harvest rune=F
Duende | summon | u | body=Duende beh=cross tier=sturdy speed=steady kw=curse trait=plague rune=E
Salamander | summon | c | body=Salamander beh=beam tier=sturdy speed=slow kw=- rune=F
Lava Golem | summon | r | body=Golem mod=Stone beh=guards tier=tough speed=slow kw=burn trait=scorched rune=C
Magma Elemental | summon | u | body=Spirit beh=barrage tier=sturdy speed=slow kw=push trait=dread rune=B
Dwarven Smith | summon | u | body=Dwarf beh=diag tier=sturdy speed=slow trait=rallying kw=- rune=A
Dwarven Miner | summon | c | body=Dwarf beh=burrow tier=sturdy speed=steady kw=push trait=rallying rune=F
Dwarven Musketeer | summon | c | body=Dwarf beh=twin tier=sturdy speed=steady kw=push rune=F
Dwarven Rocketeer | summon | u | body=Dwarf beh=lob tier=sturdy speed=slow kw=pull trait=forged rune=C
Mountain Hermit | summon | c | body=Dwarf mod=Old beh=blast tier=sturdy speed=steady kw=stun rune=D
Samurai | summon | r | body=Knight beh=cross tier=sturdy speed=steady kw=burn rune=E
Ronin Archer | summon | u | body=Squire mod=Grim beh=snipe tier=tough speed=steady kw=- rune=E
Mountain Monk | summon | u | body=Squire mod=Gentle beh=empower tier=sturdy speed=slow kw=push trait=overcharge rune=E
Tengu | summon | u | body=Tengu beh=cross tier=sturdy speed=steady kw=push trait=shatter rune=F
Lantern Ghost | summon | c | body=Spirit mod=Lucky beh=mends tier=sturdy speed=steady kw=push trait=overcharge rune=E
Fire Vampire | summon | r | body=Vampire beh=blast tier=sturdy speed=steady kw=push trait=scorched rune=F
Cinder Bat Swarm | summon | c | body=Bat beh=barrage tier=frail speed=frantic kw=burn trait=scorched rune=F
Cinder Hound | summon | c | body=Hound beh=dash tier=sturdy speed=slow kw=burn trait=tidal rune=C
Mole Miner | summon | c | body=Mole beh=burrow tier=sturdy speed=steady kw=burn trait=shatter rune=F
Lava Beetle | summon | c | body=Beetle beh=taunt tier=tough speed=slow kw=burn trait=static rune=E
Imperial Lung Dragon | summon | l | body=Lung beh=beam tier=frail speed=quick kw=push trait=tidal rune=E
Firebird | summon | r | body=Phoenix mod=Noble beh=barrage tier=sturdy speed=slow kw=burn trait=scorched rune=E
Ember Imp | summon | c | body=Imp beh=zigzag tier=frail speed=quick kw=curse trait=scorched rune=D

Hand Cannon | machine | c | mach=Cannon beh=pierce tier=sturdy speed=steady kw=- rune=F
Fire Lance Turret | machine | c | mach=Crossbow beh=twin tier=sturdy speed=steady kw=burn trait=explodes rune=E
Goblin Gatling | machine | u | mach=Gatling beh=bolt tier=sturdy speed=steady kw=curse rune=D
Rocket Battery | machine | u | mach=Catapult beh=zigzag tier=frail speed=quick kw=- rune=E
Hwacha Rocket Cart | machine | r | mach=Engine beh=diag tier=sturdy speed=slow kw=push rune=D
Dwarven Siege Cannon | machine | r | mach=Cannon beh=bolt tier=sturdy speed=steady kw=burn trait=dread rune=C
Iron Barricade | machine | c | mach=Barricade beh=wardmaker tier=huge speed=slow kw=burn rune=E
Mine Cart Barricade | machine | c | mach=Palisade beh=wardmaker tier=huge speed=slow kw=push trait=plague rune=E
Gremlin Clockwork Drone | machine | c | mach=Drone beh=guards tier=tough speed=slow kw=- rune=D
Dragon-Mouth Cannon | machine | u | mach=Cannon beh=pierce tier=sturdy speed=steady kw=burn trait=rallying rune=D
Volley Gun | machine | u | mach=Repeater beh=bolt tier=sturdy speed=steady kw=push trait=tidal rune=E
Ember Trebuchet | machine | u | mach=Trebuchet beh=lob tier=sturdy speed=slow kw=burn trait=rallying rune=F
Stone Bastion | machine | u | mach=Bastion beh=wardmaker tier=huge speed=slow trait=chilling kw=- rune=A
Firework Launcher | machine | c | mach=Catapult beh=cross tier=sturdy speed=slow kw=burn trait=explodes rune=B
The Great Bombard | machine | l | mach=Cannon beh=lob tier=sturdy speed=slow kw=push trait=explodes rune=E
`,
/* ---------------- Blue · Frost: water, ice and the great unknown ---------------- */
frost:`
Harpoon Throw | strike | c | shape=spear kw=pull rider=pierce cast=quick rune=C
Whaler's Harpoon | strike | u | shape=spear kw=pull rider=onkill rune=F
Tidal Wave | strike | r | shape=wave kw=mend rider=onkill rune=A
Breaking Surf | strike | c | shape=row kw=curse cast=charged rune=F
Riptide | strike | u | shape=wave kw=pull rider=crit cast=charged rune=C
Undertow | strike | c | shape=twin kw=pull rider=pierce cast=charged rune=B
Maelstrom | strike | l | shape=shockwave kw=pull rider=recoil rune=C
Hurricane's Eye | strike | l | shape=snipe kw=mend rider=recoil cast=quick rune=F
Typhoon Lash | strike | r | shape=zigzag kw=mend rider=recoil rune=C
Narwhal Tusk | strike | c | shape=twin cast=quick kw=- rune=E
Shark Bite | strike | c | shape=wedge rider=crit cast=charged kw=- rune=C
Frenzy of Sharks | strike | u | shape=missiles kw=mend cast=quick rune=C
Cutlass Slash | strike | c | shape=wedge rider=recoil kw=- rune=C
Boarding Axe | strike | c | shape=fan kw=curse rider=crit rune=C
Grapeshot Volley | strike | u | shape=line kw=mend rider=recoil cast=charged rune=F
Siren's Song | strike | u | shape=missiles kw=mend rider=crit rune=C
Lorelei's Lure | strike | r | shape=boomerang kw=pull cast=charged rune=D
Kelpie's Plunge | strike | u | shape=line kw=pull rider=onkill cast=charged rune=F
Nixie's Whirlpool | strike | c | shape=zigzag kw=curse rune=F
Frostbite | strike | c | shape=wedge kw=freeze rider=onkill cast=charged rune=C
Blizzard Gale | strike | u | shape=fan kw=slow cast=quick rune=C
Avalanche Rush | strike | r | shape=line kw=mend rider=pierce rune=F
Hailstone Barrage | strike | u | shape=column kw=mend rider=onkill cast=charged rune=A
Sleet Volley | strike | c | shape=gun kw=slow rider=pierce cast=quick rune=C
Winter Wolf Fangs | strike | c | shape=fan kw=slow rider=onkill cast=charged rune=E
Yeti's Swipe | strike | c | shape=burst kw=freeze rider=crit rune=C
Icebreaker Ram | strike | u | shape=line kw=curse rider=recoil rune=C
Kappa's Sumo Shove | strike | c | shape=twin kw=mend rider=pierce cast=quick rune=F
Rusalka's Embrace | strike | r | shape=line kw=mend rider=onkill cast=quick rune=F
Umibozu's Grasp | strike | r | shape=zigzag kw=pull cast=quick rune=C
Ningyo Scale Dart | strike | c | shape=line kw=curse cast=quick rune=F
Ice Skate Slash | strike | c | shape=fan rider=pierce cast=quick kw=- rune=E
Glacier Calving | strike | u | shape=row kw=mend rider=crit cast=charged rune=D
Waterspout | strike | u | shape=boomerang kw=curse rider=onkill rune=A
Leviathan's Wake | strike | l | shape=row kw=mend rune=F
World Serpent's Coil | strike | l | shape=zigzag kw=mend cast=charged rune=C
Bunyip's Bellow | strike | u | shape=fan kw=mend rider=crit cast=quick rune=B
Leister Spear | strike | c | shape=spear rider=pierce cast=charged kw=- rune=E

Twelve-Pound Shot | lob | c | pattern=single fuse=heavy kw=mend after=knock rune=F
Chain Shot | lob | c | pattern=single fuse=quick kw=slow rune=E
Powder Monkey's Keg | lob | u | pattern=burst kw=mend rune=D
Depth Charge | lob | u | pattern=burst fuse=quick kw=mend after=knock rune=F
Frozen Comet | lob | r | pattern=burst fuse=heavy kw=freeze after=knock rune=C
Ice Floe Drop | lob | c | pattern=single fuse=quick kw=freeze after=ground rune=C
Geyser Burst | lob | u | pattern=column fuse=heavy kw=curse after=knock rune=F
Rain of Fish | lob | c | pattern=burst fuse=heavy kw=- rune=C
Coconut Lob | lob | c | pattern=single fuse=quick kw=curse after=knock rune=C
Ink Cloud | lob | c | pattern=burst fuse=quick kw=pull after=ground rune=F
Holy Water Flask | lob | u | pattern=burst fuse=quick kw=curse rune=A
Spring Water Gourd | lob | c | pattern=single fuse=heavy kw=curse rune=B
Hailstone Cross | lob | u | pattern=cross kw=mend after=ground rune=C
Whirlpool Ring | lob | r | pattern=ring fuse=heavy kw=pull after=knock rune=✱
Falling Iceberg | lob | r | pattern=column fuse=heavy kw=mend after=ground rune=E
Message in a Bottle | lob | c | pattern=single kw=- rune=F
Jellyfish Bloom | lob | u | pattern=burst kw=curse after=knock rune=F
Pufferfish Toss | lob | c | pattern=single kw=pull after=knock rune=C
Monsoon Downpour | lob | r | pattern=row kw=slow rune=C
Rogue Wave | lob | l | pattern=row kw=mend after=knock rune=E

Sea Wall | ward | c | form=cage build=light wfx=healing kw=- rune=F
Beaver Dam | ward | c | form=corridor build=heavy len=short kw=- rune=F
Great Dam | ward | r | form=corridor build=heavy wfx=healing kw=- rune=C
Ice Palace Gate | ward | u | form=shield build=heavy wfx=freezing len=short kw=- rune=C
Snow Fort | ward | c | form=corridor build=heavy wfx=freezing len=long kw=- rune=C
Igloo | ward | c | form=shield build=heavy wfx=thorns kw=- rune=F
Coral Reef | ward | u | form=rampart build=heavy wfx=thorns len=long kw=- rune=F
Sea Urchin Bed | ward | c | form=corridor build=light wfx=thorns len=short kw=- rune=C
Bubble Shield | ward | c | form=shield build=light kw=- rune=C
Mirror of Still Water | ward | u | form=shield wfx=healing kw=- rune=F
Kelp Curtain | ward | c | form=shield build=light wfx=thorns len=long kw=- rune=F
Pack Ice Bulwark | ward | u | form=rampart build=heavy wfx=freezing kw=- rune=E
Walls of Ys | ward | l | form=shield build=heavy wfx=healing len=long kw=- rune=D
Dome of Atlantis | ward | r | form=shield build=light wfx=healing len=short kw=- rune=E

Inuksuk Watcher | sentry | c | rune=F beh=bolt tier=sturdy speed=slow kw=freeze
Lighthouse | sentry | u | rune=F beh=snipe tier=sturdy speed=slow trait=pack kw=-
Ice Spike Totem | sentry | c | rune=F beh=shields tier=sturdy speed=slow kw=freeze trait=rallying
Narwhal Horn Totem | sentry | c | rune=C beh=empower tier=sturdy speed=slow kw=pull trait=rallying
Figurehead Sentinel | sentry | u | rune=B beh=taunt tier=tough speed=steady trait=submerge kw=-
Coral Spire | sentry | c | rune=C beh=snipe tier=sturdy speed=steady kw=curse trait=shatter
Siren Rock | sentry | r | rune=F beh=bolt tier=sturdy speed=steady kw=freeze trait=submerge
Fountain of Youth | sentry | r | rune=C beh=bolt tier=sturdy speed=steady trait=rallying kw=-
Rime Giant Cairn | sentry | u | rune=B beh=lob tier=huge speed=slow kw=slow trait=rallying
Whale Bone Arch | sentry | c | rune=C beh=pierce tier=sturdy speed=steady kw=pull trait=dread
Lantern of the Drowned | sentry | r | rune=C beh=mends tier=sturdy speed=steady trait=submerge kw=-
Tide Pole | sentry | c | rune=F beh=bolt tier=sturdy speed=steady kw=pull trait=harvest

Sea Legs | boon | c | boon=dodge side=muster timing=echo kw=- rune=C
Fair Winds | boon | c | boon=haste len=short side=glow timing=delayed kw=- rune=D
Grog Ration | boon | c | boon=heal side=sprout timing=echo kw=- rune=F
Hot Spring Soak | boon | c | boon=regen len=long side=muster kw=- rune=C
Sauna Steam | boon | c | boon=regen side=sprout timing=delayed kw=- rune=E
Cleansing Rain | boon | u | boon=heal side=muster kw=- rune=F
Polar Bear Plunge | boon | u | boon=power len=short side=sprout kw=- rune=A
Mead of the Longhall | boon | u | boon=courage len=long side=sprout timing=delayed kw=- rune=F
Selkie Skin | boon | r | boon=phase len=long side=sprout kw=- rune=✱
Become the Tide | boon | u | boon=phase len=long side=muster timing=delayed kw=- rune=C
Sorcerer's Trance | boon | u | boon=gauge side=glow timing=delayed kw=- rune=F
Sea Witch's Bargain | boon | r | boon=pact len=short side=muster timing=delayed kw=- rune=A
Blood Price of the Deep | boon | r | boon=pact len=long side=muster timing=echo kw=- rune=F
Northern Lights | boon | r | boon=gauge side=sprout kw=- rune=F
Lucky Doubloon | boon | c | boon=dodge side=rally kw=- rune=✱
Gift of the River Mother | boon | l | boon=intervene side=glow kw=- rune=C

Pirate's Pistol | charge | c | shot=bolt uses=few kw=- rune=C
Brace of Pistols | charge | u | shot=bolt kw=mend edge=splash rune=F
Harpoon Quiver | charge | c | shot=bolt uses=many kw=pull edge=splash rune=A
Icicle Darts | charge | c | shot=bolt uses=few kw=freeze edge=pierce rune=D
Snowball Stockpile | charge | c | shot=lob uses=few kw=slow rune=E
Cannon Shot Crate | charge | u | shot=lob uses=many kw=mend edge=splash rune=B
Grapeshot Bag | charge | c | shot=lob uses=few edge=pierce kw=- rune=C
Blowfish Spines | charge | c | shot=bolt uses=few kw=curse edge=splash rune=F
Sea Urchin Quills | charge | c | shot=bolt uses=many edge=crit kw=- rune=A
Conch Shell Blasts | charge | u | shot=bolt kw=curse rune=A
Frozen Arrows | charge | c | shot=bolt kw=slow edge=crit rune=F
Hail Pouch | charge | c | shot=lob uses=few kw=curse edge=crit rune=C
Bottled Waves | charge | u | shot=lob kw=mend edge=crit rune=C
Ice Javelins | charge | u | shot=bolt edge=pierce kw=- rune=C
Rusalka's Tears | charge | r | shot=bolt uses=many kw=mend rune=D
Ghost Ship Volley | charge | r | shot=lob uses=many kw=curse rune=A
Sorcerer's Orbs | charge | u | shot=bolt uses=few kw=mend edge=crit rune=F
Glass Fishing Floats | charge | c | shot=lob kw=- rune=C
Holy Spring Droplets | charge | u | shot=bolt uses=many kw=curse edge=pierce rune=F
Narwhal Ivory Darts | charge | c | shot=burst uses=few edge=splash kw=- rune=B

Mirror Lake | utility | u | util=copy rune=C
Treasure Map | utility | c | util=draw rune=F
Spyglass | utility | c | util=draw rune=F
Captain's Log | utility | u | util=draw rune=F
Ritual Bath | utility | c | util=cleanse rune=A
Holy Spring | utility | u | util=cleanse rune=C
Ebb Tide | utility | c | util=recall rune=E
Return to the Sea | utility | u | util=recall rune=F
Water Mirror Twin | utility | r | util=copy rune=A
Sorcerer's Grimoire | utility | l | util=draw rune=C

Ice Hole | trap | c | trap=snare kw=freeze len=short size=three rune=F
Thin Ice | trap | c | trap=snare len=short kw=- rune=C
Hidden Reef | trap | c | trap=spike kw=- rune=B
Fishing Net | trap | c | trap=snare kw=slow rune=C
Sunken Mine | trap | u | trap=blast kw=curse size=three rune=B
Sea Mine | trap | u | trap=blast kw=slow len=short size=three rune=E
Kelp Tangle | trap | c | trap=snare len=long size=three kw=- rune=D
Ice Spike Pit | trap | u | trap=spike kw=freeze size=three rune=C
Siren's Shoal | trap | r | trap=snare kw=mend size=three rune=B
Davy Jones' Locker | trap | l | trap=blast kw=mend len=long size=three rune=F

Frozen Lake | environment | c | env=freeze pattern=burst kw=mend rune=F
Permafrost | environment | c | env=freeze pattern=row len=long kw=curse rune=E
Black Ice | environment | u | env=freeze pattern=cross kw=- rune=D
Snowfield | environment | c | env=freeze pattern=burst len=short kw=curse rune=E
Tsunami Surge | environment | r | env=tremor pattern=row len=long kw=- rune=D
Rolling Breakers | environment | u | env=tremor pattern=row len=short kw=mend rune=C
Flood Plain | environment | u | env=tremor pattern=column kw=- rune=B
Iceberg Field | environment | u | env=freeze pattern=cross len=long kw=mend rune=C
Polar Night | environment | r | env=freeze pattern=burst len=long kw=- rune=B
Kelp Forest | environment | c | env=bramble pattern=burst kw=- rune=F
Mangrove Roots | environment | c | env=bramble pattern=column len=short kw=- rune=A
Sargasso Sea | environment | u | env=bramble pattern=cross len=long kw=- rune=C
Fimbulwinter | environment | l | env=freeze pattern=row len=short kw=- rune=C

Crown of the Sea Dragon King | piece | l | shape=row kw=pull rider=crit rune=C
Pearl of the Tide Jewels | piece | l | shape=wave kw=mend rider=crit rune=F
Trident of the Sunken King | piece | l | shape=line kw=mend rider=recoil cast=quick rune=C
Heart of the Leviathan | piece | l | shape=mine kw=mend cast=quick rune=C
Eye of the Frost Giant | piece | l | shape=snipe kw=freeze rider=onkill cast=charged rune=C
Bell of the Sunken City | piece | l | shape=row kw=mend rune=F

Merrow | summon | c | body=Merfolk rune=D beh=mends tier=sturdy speed=quick kw=curse trait=scorched
Mermaid Singer | summon | u | body=Merfolk mod=Gentle rune=A beh=burrow tier=sturdy speed=slow kw=-
Merman Spearman | summon | c | body=Merfolk mod=Brave rune=F beh=taunt tier=tough speed=steady kw=pull
Merfolk Tidecaller | summon | u | body=Merfolk mod=Clever rune=A beh=mends tier=sturdy speed=slow kw=slow
Ningyo | summon | u | body=Fish mod=Pale rune=F beh=empower tier=sturdy speed=slow kw=slow trait=shatter
Siren | summon | r | body=Merfolk mod=Sly rune=C beh=mends tier=sturdy speed=steady kw=slow trait=rallying
Selkie | summon | u | body=Seal rune=B beh=mends tier=sturdy speed=steady kw=freeze trait=harvest
Nixie | summon | c | body=Sprite mod=Pale rune=F beh=cross tier=sturdy speed=slow trait=submerge kw=-
Rusalka | summon | r | body=Spirit mod=Pale rune=F beh=mends tier=sturdy speed=steady kw=mend trait=tidal
Kappa | summon | c | body=Kappa rune=C beh=cone tier=sturdy speed=slow kw=pull trait=dread
Umibozu | summon | r | body=Ogre mod=Ancient rune=E beh=mends tier=sturdy speed=steady kw=pull trait=chilling
Yeti | summon | u | body=Yeti rune=B beh=trample tier=huge speed=slow kw=mend trait=rallying
Yeti Cub | summon | c | body=Yeti mod=Tiny rune=C beh=trample tier=huge speed=slow kw=slow trait=chilling
Yeti Matriarch | summon | r | body=Yeti mod=Dire rune=B beh=lob tier=huge speed=slow trait=harvest kw=-
Snowman | summon | c | body=Snowman rune=C beh=mends tier=sturdy speed=quick kw=freeze trait=chilling
Winter Wolf | summon | c | body=Wolf mod=Pale rune=F beh=pounce tier=sturdy speed=steady kw=freeze
Frost Wolf Alpha | summon | u | body=Wolf mod=Dire rune=A beh=dash tier=sturdy speed=steady kw=freeze trait=dread
Rockhopper Penguin | summon | c | body=Penguin mod=Scrappy rune=F beh=zigzag tier=sturdy speed=slow trait=rallying kw=-
Walrus | summon | u | body=Walrus rune=✱ beh=chain tier=sturdy speed=steady kw=pull trait=tidal
Narwhal | summon | u | body=Narwhal rune=F beh=mends tier=sturdy speed=quick kw=pull trait=tidal
Orca | summon | r | body=Orca rune=F beh=beam tier=sturdy speed=slow kw=pull trait=tidal
Hammerhead Shark | summon | u | body=Shark rune=C beh=mends tier=sturdy speed=frantic kw=slow trait=tidal
Great White Shark | summon | r | body=Shark mod=Hungry rune=F beh=mends tier=sturdy speed=slow kw=pull trait=harvest
Sea Turtle | summon | c | body=Turtle mod=Gentle rune=E beh=guards tier=tough speed=slow kw=pull trait=tidal
Zaratan the Island Turtle | summon | l | body=Turtle mod=Ancient rune=F beh=guards tier=tough speed=slow kw=freeze trait=scorched
King Crab | summon | u | body=Crab mod=Iron rune=C beh=guards tier=tough speed=slow kw=mend trait=explodes
Giant Squid | summon | r | body=Kraken mod=Wild rune=B beh=trample tier=huge speed=slow kw=freeze trait=dread
The Kraken | summon | l | body=Kraken mod=Dire rune=E beh=trample tier=huge speed=slow kw=pull trait=tidal
Kraken Spawn | summon | c | body=Kraken mod=Tiny rune=F beh=lob tier=huge speed=slow kw=pull trait=dread
Leviathan | summon | l | body=Leviathan mod=Ancient rune=F beh=trample tier=huge speed=slow trait=explodes kw=-
Bunyip of the Billabong | summon | u | body=Seal mod=Feral rune=C beh=mends tier=sturdy speed=steady kw=curse
Sea Serpent | summon | r | body=Serpent mod=Wild rune=B beh=pounce tier=sturdy speed=slow kw=slow trait=tidal
Dragon King of the Deep | summon | l | body=Lung mod=Noble rune=C beh=cone tier=sturdy speed=slow kw=freeze trait=harvest
River Lung | summon | u | body=Lung mod=Gentle rune=D beh=mends tier=sturdy speed=slow kw=mend trait=scorched
Frost Giant | summon | r | body=Ogre mod=Pale rune=E beh=lob tier=huge speed=slow kw=freeze trait=chilling
Pirate Deckhand | summon | c | body=Squire mod=Scrappy rune=F beh=zigzag tier=frail speed=quick kw=slow
Buccaneer Captain | summon | r | body=Knight mod=Sly rune=A beh=pierce tier=sturdy speed=steady kw=freeze trait=pack
Powder Monkey | summon | c | body=Squire mod=Tiny rune=C beh=blast tier=sturdy speed=steady trait=dread kw=-
Flying Dutchman's Captain | summon | l | body=Spirit mod=Grim rune=E beh=mends tier=sturdy speed=slow trait=chilling kw=-
Drowned Sailor | summon | c | body=Spirit mod=Pale rune=C beh=burrow tier=sturdy speed=steady trait=harvest kw=-
Snow Maiden | summon | c | body=Sprite mod=Gentle rune=B beh=blast tier=sturdy speed=quick kw=freeze
Yuki-onna | summon | r | body=Spirit mod=Pale rune=F beh=diag tier=sturdy speed=steady trait=explodes kw=-
Kayak Hunter | summon | c | body=Squire mod=Brave rune=F beh=snipe tier=sturdy speed=steady kw=pull trait=rallying
Polar Bear | summon | u | body=Bear mod=Pale rune=F beh=pounce tier=tough speed=steady kw=slow trait=chilling
River Mother's Herald | summon | u | body=Merfolk mod=Noble rune=F beh=empower tier=frail speed=quick trait=rallying kw=-
Vodyanoy | summon | u | body=Toad mod=Old rune=C beh=dash tier=sturdy speed=slow trait=explodes kw=-
Ahuizotl | summon | u | body=Hound mod=Sly rune=F beh=chain tier=sturdy speed=slow kw=pull
Taniwha | summon | r | body=Serpent mod=Ancient rune=E beh=pounce tier=sturdy speed=steady trait=scorched kw=-

Ship's Cannon | machine | u | mach=Cannon rune=B beh=bolt tier=sturdy speed=steady kw=mend trait=shatter
Broadside Battery | machine | r | mach=Cannon rune=F beh=zigzag tier=frail speed=quick kw=freeze trait=shatter
Harpoon Ballista | machine | u | mach=Ballista rune=F beh=snipe tier=sturdy speed=steady kw=slow
Harpoon Launcher | machine | c | mach=Crossbow rune=F beh=twin tier=sturdy speed=steady kw=slow trait=dread
Ice Catapult | machine | c | mach=Catapult rune=F beh=blast tier=sturdy speed=slow kw=freeze trait=pack
Mortar Ketch | machine | u | mach=Cannon rune=C beh=blast tier=sturdy speed=slow kw=slow trait=dread
Sluice Gate Bulwark | machine | u | mach=Bulwark rune=C beh=wardmaker tier=huge speed=slow kw=freeze trait=harvest
Icebreaker Engine | machine | r | mach=Engine rune=F beh=mends tier=sturdy speed=slow kw=freeze trait=dread
Waterwheel Repeater | machine | c | mach=Repeater rune=F beh=barrage tier=frail speed=frantic kw=slow
Diving Bell Automaton | machine | r | mach=Automaton rune=B beh=guards tier=tough speed=slow kw=slow trait=pack
`,

/* ---------------- Yellow · Storm: lightning, sand, invention and greed ---------------- */
storm:`
Lightning Lash | strike | c | shape=zigzag kw=stun cast=charged rune=D
Forked Bolt | strike | c | shape=line kw=stun rider=onkill cast=charged rune=A
Thunderclap | strike | u | shape=shockwave kw=push rune=F
Static Discharge | strike | c | shape=boomerang rider=pierce cast=charged kw=- rune=C
Sky-Splitter | strike | r | shape=spear kw=stun rider=pierce rune=C
Leyden Jar Shock | strike | c | shape=shockwave kw=stun rider=crit rune=E
Voltaic Arc | strike | u | shape=chain kw=stun cast=quick rune=D
Tesla Arc | strike | r | shape=chain kw=stun rider=recoil rune=A
Scorpion Sting | strike | c | shape=boomerang kw=drain cast=quick rune=F
Manticore Tail Spikes | strike | u | shape=spear kw=drain rider=pierce cast=quick rune=F
Cobra Spit | strike | c | shape=chain kw=drain rider=recoil cast=quick rune=C
Sandblast | strike | c | shape=burst kw=self rune=F
Dune Lash | strike | c | shape=zigzag kw=drain rider=recoil cast=charged rune=C
Sirocco Gust | strike | u | shape=fan kw=push rider=recoil cast=quick rune=B
Haboob Wall | strike | r | shape=chain kw=drain rider=crit rune=C
Scimitar Sweep | strike | c | shape=wedge rider=recoil kw=- rune=F
Bedouin Lance | strike | c | shape=spear rider=onkill kw=- rune=A
Camel Kick | strike | c | shape=chain kw=push rider=recoil cast=charged rune=D
Ifrit's Flame | strike | u | shape=chain kw=self cast=charged rune=E
Sun Disk Ray | strike | u | shape=row kw=self rider=recoil cast=quick rune=C
Noon Sun Glare | strike | c | shape=ricochet kw=drain rider=crit cast=quick rune=C
Mirage Dagger | strike | u | shape=diag kw=confuse cast=quick rune=✱
Djinn's Whirlwind | strike | r | shape=ricochet kw=confuse rider=onkill cast=charged rune=F
Coin Toss | strike | c | shape=cluster cast=charged cluster=x kw=- rune=C
Golden Touch | strike | r | shape=ricochet kw=drain cast=charged rune=D
Bronze Fist | strike | c | shape=wedge kw=push rider=crit cast=charged rune=C
Talos's Boulder | strike | r | shape=chain kw=push rider=onkill rune=B
Serpent Whip | strike | c | shape=boomerang kw=mend rune=F
Lodestone Pull | strike | u | shape=chain kw=self rider=onkill cast=quick rune=D
Raiju's Pounce | strike | u | shape=ricochet kw=stun rider=onkill rune=F
Plumed Serpent Gale | strike | r | shape=fan kw=push rider=pierce rune=A
Perun's Oak-Splitter | strike | l | shape=boomerang kw=stun rider=recoil cast=charged rune=C
Midas's Last Embrace | strike | l | shape=boomerang kw=drain rider=onkill rune=C
Heaven-Rending Bolt | strike | l | shape=line kw=stun rider=recoil cast=quick rune=B

Lightning in a Bottle | lob | u | pattern=burst fuse=quick kw=stun after=ground rune=C
Alembic Flask | lob | c | pattern=single fuse=quick kw=drain after=ground rune=F
Quicklime Pot | lob | c | pattern=burst kw=self rune=E
Naphtha Jar | lob | c | pattern=single fuse=quick kw=self rune=D
Sulfur Bomb | lob | u | pattern=burst fuse=quick kw=drain rune=E
Thunder Gourd | lob | c | pattern=single fuse=quick kw=stun after=knock rune=F
Sand Urn | lob | c | pattern=burst fuse=heavy kw=self after=ground rune=C
Sack of Coins | lob | c | pattern=single fuse=heavy kw=push rune=F
Golden Hail | lob | u | pattern=row after=ground kw=- rune=F
Mercury Flask | lob | u | pattern=cross fuse=quick kw=self after=knock rune=C
Scarab Swarm Jar | lob | u | pattern=ring fuse=quick kw=drain after=knock rune=C
Roc's Egg | lob | r | pattern=single kw=push after=knock rune=A
Saltpeter Charge | lob | c | pattern=column kw=push rune=F
Storm Cloud Seed | lob | u | pattern=cross kw=stun after=knock rune=C
Hail of Dinars | lob | r | pattern=ring fuse=heavy kw=drain after=ground rune=C
Great Work Detonation | lob | l | pattern=burst fuse=heavy kw=drain after=knock rune=C

Copper Lattice | ward | c | form=shield build=light wfx=draining len=short kw=- rune=C
Bronze Aegis | ward | u | form=shield build=light kw=- rune=F
Sandbag Wall | ward | c | form=cage build=heavy kw=- rune=F
Mudbrick Wall | ward | c | form=corridor build=light wfx=draining kw=- rune=C
Kasbah Gate | ward | r | form=rampart wfx=draining len=short kw=- rune=B
Cactus Hedge | ward | c | form=cage build=heavy wfx=thorns len=long kw=- rune=C
Scorpion Pit Ring | boon | u | boon=power side=muster timing=echo kw=- rune=F
Faraday Cage | ward | u | form=cage len=long kw=- rune=C
Charged Fence | ward | c | form=shield wfx=draining kw=- rune=C
Caravan Circle | ward | c | form=arc build=light len=short kw=- rune=D
Djinn's Veil | ward | u | form=shield build=heavy wfx=draining len=long kw=- rune=C
Lightning Rod Array | ward | r | form=shield build=heavy wfx=shocking len=short kw=- rune=B
Walls of the City of Brass | ward | l | form=corridor wfx=draining len=long kw=- rune=C

Lightning Rod | sentry | c | beh=chain tier=sturdy speed=slow kw=drain trait=lifesteal rune=C
Tesla Coil | sentry | u | beh=chain tier=sturdy speed=steady kw=self trait=seeds rune=D
Sun Obelisk | sentry | c | beh=zigzag tier=sturdy speed=quick trait=sandstorm kw=- rune=C
Scarab Totem | sentry | c | beh=empower tier=sturdy speed=slow kw=drain trait=rallying rune=✱
Brazen Head | sentry | r | beh=beam tier=sturdy speed=steady kw=confuse trait=sandstorm rune=F
Foo Dog Statue | sentry | u | beh=guards tier=tough speed=slow kw=self trait=rallying rune=F
Snake Charmer's Basket | sentry | c | beh=bolt tier=sturdy speed=steady kw=drain trait=rallying rune=F
Oil Lamp Brazier | sentry | c | beh=zigzag tier=sturdy speed=frantic kw=push trait=pack rune=D
Storm Kite | sentry | u | beh=chain tier=sturdy speed=slow kw=stun trait=sandstorm rune=C
Sandstone Idol | sentry | c | beh=empower tier=sturdy speed=slow kw=stun trait=greedy rune=C
Thunder Drum | sentry | c | beh=beam tier=sturdy speed=steady kw=push trait=overcharge rune=B
Burning Mirror | sentry | r | beh=zigzag tier=sturdy speed=steady kw=confuse trait=lifesteal rune=✱

Overcharge | boon | c | boon=power len=short side=scorch timing=delayed kw=- rune=C
Galvanic Surge | boon | u | boon=power len=long side=muster kw=- rune=F
Djinn's Bargain | boon | r | boon=pact len=long side=blood kw=- rune=F
Wish of the Lamp | boon | l | boon=intervene side=siphon kw=- rune=A
Desert Mirage | boon | u | boon=dodge side=scorch timing=delayed kw=- rune=F
Sand Step | boon | c | boon=haste len=short side=blood kw=- rune=C
Camel's Endurance | boon | c | boon=regen side=muster kw=- rune=F
Date Palm Oasis | boon | c | boon=heal side=blood kw=- rune=C
Mint Tea | boon | c | boon=heal side=siphon timing=echo kw=- rune=F
Hoard Fever | boon | u | boon=courage len=short side=rally kw=- rune=D
Merchant's Luck | boon | c | boon=gauge side=rally timing=delayed kw=- rune=F
Aurum Potabile | boon | r | boon=regen len=short side=muster timing=delayed kw=- rune=F
Lightning Step | boon | u | boon=phase len=long side=scorch timing=echo kw=- rune=C
Horus's Watch | boon | r | boon=dodge side=rally kw=- rune=B

Leyden Jar Battery | charge | c | shot=bolt uses=few kw=stun rune=F
Baghdad Battery | charge | u | shot=bolt kw=stun edge=splash rune=E
Copper Coil Spool | charge | c | shot=bolt uses=few edge=pierce kw=- rune=D
Bag of Dirhams | charge | c | shot=lob uses=few kw=push edge=pierce rune=E
Quiver of Sand Darts | charge | c | shot=bolt uses=many kw=self edge=crit rune=C
Venom Vials | charge | c | shot=bolt uses=few kw=drain edge=crit rune=C
Scorpion Jar | charge | u | shot=lob kw=drain edge=pierce rune=F
Naphtha Grenades | charge | u | shot=lob uses=few kw=self edge=crit rune=C
Sling of Thunderstones | charge | c | shot=lob uses=few kw=stun edge=splash rune=✱
Alchemist's Bandolier | charge | u | shot=lob uses=many kw=self edge=splash rune=F
Sun-Glass Lenses | charge | c | shot=bolt uses=many kw=drain rune=F
Magnet Shot | charge | c | shot=bolt uses=few kw=self edge=splash rune=C
Thunderbolt Sheaf | charge | r | shot=bolt uses=many kw=stun edge=pierce rune=C
Golden Arrow Quiver | charge | u | shot=bolt uses=many edge=splash kw=- rune=D
Bottled Sirocco | charge | u | shot=bolt kw=push rune=C
Ifrit Embers | charge | r | shot=lob uses=few kw=drain rune=F
Canopic Jars | charge | r | shot=lob uses=many kw=- rune=C
Forty Thieves' Hoard | charge | l | shot=lob uses=many kw=drain edge=crit rune=F

Astrolabe | utility | c | util=draw rune=B
Bazaar Haggle | utility | c | util=draw rune=E
Caravan Map | utility | c | util=draw rune=C
Transmutation | utility | u | util=copy rune=A
Djinn's Duplicate | utility | r | util=copy rune=F
Natron Salts | utility | u | util=cleanse rune=C
Open Sesame | utility | r | util=recall rune=F
Moneylender's Loan | utility | u | util=recall rune=C
Inventor's Codex | utility | r | util=draw rune=D

Pit of Gold Coins | trap | u | trap=snare kw=drain size=three rune=F
Quicksand | trap | c | trap=snare kw=drain len=short rune=F
Tripwire Spark | trap | c | trap=shock size=three spread=single kw=- rune=F
Scorpion Nest | trap | c | trap=spike kw=self size=three rune=F
Pressure Plate Darts | trap | c | trap=spike kw=drain len=short size=three rune=✱
Tomb Boulder | trap | u | trap=blast kw=push size=three rune=B
Antlion Pit | trap | u | trap=snare kw=push len=long size=three rune=C
Shocking Floor Tiles | trap | c | trap=shock len=long size=three spread=plus kw=- rune=F
Djinn Bottle | trap | r | trap=snare kw=confuse len=short size=three rune=C
Collapsing Tomb Floor | trap | u | trap=blast kw=self len=short size=three rune=E
Electrified Gold Idol | trap | r | trap=shock len=short spread=ring kw=- rune=D
Cobra Basket Trap | trap | c | trap=spike kw=confuse len=long size=three rune=C
Mirage Oasis | trap | u | trap=snare len=long kw=- rune=C
Pharaoh's Curse Seal | trap | r | trap=blast kw=drain len=long size=three rune=✱

Scorching Sun | environment | c | env=burn pattern=row len=short kw=- rune=E
Salt Flats | environment | c | env=burn pattern=burst len=long kw=self rune=F
Sahara Noon | environment | u | env=burn pattern=burst kw=- rune=A
Sandworm Burrows | environment | r | env=tremor pattern=column len=long kw=- rune=F
Thunder Rumble | environment | c | env=tremor pattern=burst len=long kw=drain rune=C
Dune Shift | environment | c | env=tremor pattern=row len=long kw=self rune=B
Lightning Field | environment | u | env=burn pattern=cross len=long kw=- rune=C
Sun-Baked Wadi | environment | c | env=burn pattern=column len=long kw=drain rune=B
Storm Front | environment | u | env=tremor pattern=row kw=- rune=C
Great Sand Sea | environment | l | env=tremor pattern=burst len=short kw=- rune=F

Lamp of the Bound Djinn | piece | l | pattern=column fuse=quick kw=confuse after=ground rune=C
Crown of the Brass City | piece | l | pattern=single kw=drain after=knock rune=C
Scale of the World Fish | piece | l | pattern=single kw=push after=ground rune=B
Tail of the Manticore | piece | l | pattern=column fuse=quick kw=self after=knock rune=C
Heart of the Bronze Giant | piece | l | pattern=row fuse=heavy kw=stun after=knock rune=F

Thunder Raiju | summon | r | body=Raiju beh=chain tier=sturdy speed=slow kw=confuse trait=overcharge rune=C
Lamp Djinn | summon | r | body=Djinn beh=chain tier=sturdy speed=steady kw=drain trait=swift rune=F
Ifrit | summon | r | body=Djinn mod=Dire beh=beam tier=sturdy speed=slow kw=stun rune=E
Ifrit Sultan | summon | l | body=Djinn mod=Ancient beh=zigzag tier=sturdy speed=slow trait=swift kw=- rune=D
Si'lat Shapeshifter | summon | u | body=Djinn mod=Sly beh=pounce tier=tough speed=steady kw=self trait=rises rune=E
Dybbuk | summon | u | body=Spirit mod=Grim beh=zigzag tier=sturdy speed=slow kw=drain rune=F
Sand Scarab | summon | c | body=Scarab beh=chain tier=sturdy speed=quick trait=dread kw=- rune=✱
Golden Scarab | summon | u | body=Scarab mod=Lucky beh=diag tier=sturdy speed=slow kw=confuse trait=pack rune=F
Khepri's Dawn Beetle | summon | r | body=Scarab mod=Noble beh=taunt tier=tough speed=slow kw=push trait=rallying rune=F
Desert Camel | summon | c | body=Camel beh=zigzag tier=sturdy speed=quick kw=confuse rune=C
War Camel | summon | u | body=Camel mod=Brave beh=zigzag tier=frail speed=steady kw=confuse trait=drilled rune=B
Manticore | summon | r | body=Manticore beh=cone tier=sturdy speed=steady kw=confuse trait=seeds rune=A
Chimera | summon | r | body=Chimera beh=cone tier=sturdy speed=slow kw=confuse trait=static rune=F
Emperor Scorpion | summon | u | body=Scorpion beh=bolt tier=sturdy speed=steady kw=- rune=C
Sand Scorpion | summon | c | body=Scorpion beh=zigzag tier=sturdy speed=quick kw=push trait=seeds rune=F
Girtablilu Gatewarden | summon | r | body=Scorpion mod=Noble beh=guards tier=tough speed=slow kw=stun rune=C
Jackal Tomb Guard | summon | u | body=Jackal beh=dash tier=tough speed=steady kw=push trait=pack rune=C
Nile Crocodile | summon | c | body=Crocodile beh=zigzag tier=huge speed=steady kw=stun rune=F
Great River Crocodile | summon | r | body=Crocodile mod=Dire beh=zigzag tier=sturdy speed=steady kw=drain trait=greedy rune=F
Roc | summon | r | body=Roc beh=zigzag tier=sturdy speed=slow kw=self trait=rallying rune=F
Simurgh | summon | l | body=Simurgh beh=zigzag tier=sturdy speed=slow kw=confuse trait=drilled rune=C
Great Sphinx | summon | l | body=Sphinx mod=Ancient beh=zigzag tier=sturdy speed=steady kw=push trait=rises rune=F
Riddling Sphinx | summon | r | body=Sphinx mod=Clever beh=zigzag tier=sturdy speed=slow kw=push trait=dread rune=F
Bronze Automaton | summon | u | body=Automaton beh=guards tier=tough speed=slow kw=drain trait=dread rune=D
Talos the Bronze Giant | summon | l | body=Automaton mod=Dire beh=trample tier=huge speed=slow kw=confuse trait=sandstorm rune=E
Clockwork Falcon | summon | u | body=Hawk mod=Iron beh=snipe tier=tough speed=slow kw=stun trait=overcharge rune=B
Horus the Far-Seeing | summon | l | body=Hawk mod=Noble beh=zigzag tier=sturdy speed=steady kw=stun trait=static rune=C
Ibis Scribe | summon | c | body=Hawk mod=Gentle beh=beam tier=sturdy speed=slow kw=drain trait=rises rune=C
Frilled Lizard | summon | c | body=Lizard beh=zigzag tier=tough speed=steady kw=stun trait=lifesteal rune=C
Horned Viper | summon | c | body=Serpent beh=bolt tier=sturdy speed=steady kw=push trait=lifesteal rune=A
Uraeus Cobra | summon | u | body=Serpent mod=Noble beh=zigzag tier=sturdy speed=quick kw=stun trait=greedy rune=F
Plumed Serpent | summon | r | body=Serpent mod=Wild beh=bolt tier=sturdy speed=slow kw=confuse trait=lifesteal rune=C
Chupacabra | summon | u | body=Chupacabra beh=empower tier=sturdy speed=slow kw=push trait=swift rune=B
Foo Dog Sentinel | summon | u | body=Shishi mod=Loyal beh=pounce tier=tough speed=steady trait=lifesteal kw=- rune=F
Brass Foo Pup | summon | c | body=Shishi mod=Tiny beh=diag tier=frail speed=quick trait=swift kw=- rune=D
Bahamut | summon | l | body=Bahamut beh=zigzag tier=sturdy speed=steady kw=self trait=dread rune=A
Falak the Abyss Serpent | summon | l | body=Sandworm mod=Ancient beh=bolt tier=sturdy speed=slow kw=stun trait=seeds rune=F
Sandworm | summon | r | body=Sandworm beh=burrow tier=sturdy speed=slow kw=- rune=A
Linen-Wrapped Sentinel | summon | u | body=Knight mod=Pale beh=taunt tier=tough speed=steady kw=confuse trait=static rune=F
Sand Golem | summon | c | body=Golem beh=trample tier=tough speed=slow kw=- rune=C
Wandering Alchemist | summon | u | body=Squire mod=Clever beh=zigzag tier=sturdy speed=slow kw=stun trait=lifesteal rune=E
Bedouin Raider | summon | c | body=Squire mod=Swift beh=zigzag tier=sturdy speed=slow kw=mend trait=sandstorm rune=F
Parthian Horse Archer | summon | u | body=Squire mod=Brave beh=snipe tier=sturdy speed=steady trait=seeds kw=- rune=F
Bazaar Pickpocket | summon | c | body=Goblin mod=Sly beh=beam tier=sturdy speed=slow trait=drilled kw=- rune=F
Mamluk Lancer | summon | u | body=Knight beh=beam tier=sturdy speed=slow kw=confuse trait=rallying rune=C
Persian Immortal | summon | r | body=Knight mod=Noble beh=zigzag tier=sturdy speed=steady trait=drilled kw=- rune=F
Storm Imp | summon | c | body=Imp beh=dash tier=frail speed=quick kw=confuse rune=F
Spark Sprite | summon | c | body=Sprite beh=dash tier=frail speed=quick kw=stun trait=swift rune=F
Thunder Hawk | summon | c | body=Hawk beh=diag tier=sturdy speed=steady trait=lifesteal kw=- rune=A
Coin-Hoard Dragon | summon | r | body=Dragon mod=Hungry beh=beam tier=sturdy speed=steady kw=stun trait=rallying rune=C

Ornithopter | machine | c | mach=Drone beh=zigzag tier=sturdy speed=frantic kw=stun rune=F
Spiral Aerial Screw | machine | u | mach=Drone beh=zigzag tier=sturdy speed=frantic trait=static kw=- rune=B
Tesla Tower | machine | r | mach=Tower beh=chain tier=sturdy speed=steady kw=push trait=rallying rune=C
Voltaic Pile Turret | machine | c | mach=Tower beh=pierce tier=sturdy speed=steady kw=stun trait=sandstorm rune=F
Arc Gatling | machine | u | mach=Gatling beh=pierce tier=sturdy speed=steady kw=confuse trait=overcharge rune=E
Brass Automaton Archer | machine | u | mach=Automaton beh=snipe tier=tough speed=slow kw=confuse rune=F
Scorpio Bolt Thrower | machine | c | mach=Ballista beh=lob tier=sturdy speed=slow kw=stun trait=rallying rune=F
Naphtha Siphon | machine | u | mach=Engine beh=zigzag tier=sturdy speed=steady kw=mend rune=B
Desert Onager | machine | c | mach=Catapult beh=beam tier=sturdy speed=slow kw=push trait=lifesteal rune=C
Caravan Mangonel | machine | u | mach=Trebuchet beh=beam tier=sturdy speed=slow kw=self trait=greedy rune=C
Architronito | machine | r | mach=Cannon beh=pounce tier=tough speed=steady kw=stun trait=overcharge rune=F
Zhuge Repeater | machine | u | mach=Repeater beh=barrage tier=frail speed=frantic kw=push trait=swift rune=E
Tortoise War Wagon | machine | r | mach=Bulwark beh=guards tier=tough speed=slow trait=lifesteal kw=- rune=D
Sandstone Rampart | machine | c | mach=Rampart beh=wardmaker tier=huge speed=slow trait=drilled kw=- rune=E
Palm-Log Palisade | machine | c | mach=Palisade beh=wardmaker tier=huge speed=slow kw=stun trait=dread rune=F
Bronze Barricade | machine | c | mach=Barricade beh=wardmaker tier=huge speed=slow kw=push trait=greedy rune=C
Elephant Clock Automaton | machine | r | mach=Automaton beh=trample tier=tough speed=slow kw=confuse trait=rises rune=F
Coin-Spitting Mortar | machine | c | mach=Cannon beh=lob tier=sturdy speed=slow kw=push rune=C
Clockwork Flying Carpet | machine | r | mach=Drone beh=guards tier=tough speed=slow kw=push trait=pack rune=C
Hang-Glider Scout | machine | c | mach=Drone beh=diag tier=sturdy speed=steady kw=push trait=static rune=F
The Thunder Engine | machine | l | mach=Engine beh=chain tier=sturdy speed=steady kw=stun trait=pack rune=A
The Bronze Colossus | machine | l | mach=Automaton beh=trample tier=huge speed=slow kw=stun trait=greedy rune=C
`,

/* ---------------- Black · Shadow: death, horror and dark magic ---------------- */
shadow:`
Bone Splinter | strike | c | shape=mine kw=freeze rune=A
Gravedigger's Spade | strike | c | shape=dig rider=recoil kw=- rune=B
Miasma Wave | strike | c | shape=wave kw=poison rune=C
Mold Spore Volley | strike | c | shape=gun kw=poison cast=quick rune=D
Acid Vial Splash | strike | c | shape=burst kw=poison rider=recoil cast=charged rune=E
Evil Eye | strike | c | shape=snipe kw=curse rider=crit cast=quick rune=F
Hook and Chain | strike | c | shape=chain kw=pull rider=onkill cast=charged rune=A
Crow Swarm | strike | c | shape=missiles cast=charged kw=- rune=D
Creeping Fog | strike | c | shape=row kw=confuse cast=quick rune=E
Spider Silk Shot | strike | c | shape=spear kw=slow cast=charged rune=✱
Bog Muck Splash | strike | c | shape=burst kw=slow cast=quick rune=F
Yurei's Lament | strike | c | shape=mine kw=confuse rider=crit cast=charged rune=E
Banshee Wail | strike | u | shape=mine kw=confuse rider=onkill rune=D
Strigoi Bite | strike | u | shape=wedge kw=drain rider=crit cast=charged rune=E
Plague Breath | strike | u | shape=fan kw=poison cast=charged rune=D
Hellfire Lash | strike | u | shape=zigzag kw=curse rune=C
Gallows Rope | strike | u | shape=mine kw=pull cast=charged rune=B
Raven of Ill Omen | strike | u | shape=mark kw=curse rider=onkill rune=E
Moonlit Rake | strike | u | shape=wedge kw=curse rider=recoil cast=charged rune=D
Bloodletting Blade | strike | u | shape=boomerang kw=self rider=crit rune=D
Web Spray | strike | u | shape=fan kw=slow rider=pierce cast=charged rune=E
Jiangshi Hop | strike | u | shape=dig kw=stun rider=crit cast=charged rune=B
Asanbosam Hook | strike | u | shape=zigzag kw=pull rider=crit cast=quick rune=C
Hellhound Howl | strike | u | shape=shockwave kw=curse cast=quick rune=B
Infernal Brand | strike | r | shape=mine kw=self rider=crit cast=quick rune=C
Reaper's Scythe | strike | r | shape=boomerang rider=onkill kw=freeze rune=F
Danse Macabre | strike | r | shape=all kw=confuse rider=crit cast=quick rune=A
Onryo's Grudge | strike | r | shape=ricochet kw=curse rider=recoil rune=F
Manananggal Swoop | strike | r | shape=dig kw=drain rider=onkill cast=quick rune=A
Mara's Ride | strike | r | shape=line kw=confuse rider=recoil rune=E
Death Card | strike | r | shape=mark rider=crit kw=- rune=D
Wild Hunt of the Dead | strike | l | shape=snipe kw=confuse rider=crit rune=A
Gashadokuro's Fist | strike | l | shape=wedge kw=stun rider=crit cast=quick rune=F
Maw of the Abyss | strike | l | shape=mine kw=self rider=recoil rune=✱

Plague Flask | lob | c | pattern=single fuse=quick kw=poison after=knock rune=B
Skull Bomb | lob | c | pattern=single fuse=heavy after=knock kw=freeze rune=A
Grave Dirt Handful | lob | c | pattern=burst fuse=quick kw=curse after=ground rune=F
Hex Bag | lob | c | pattern=single fuse=heavy kw=curse after=ground rune=E
Bat Cloud | lob | c | pattern=burst kw=drain rune=D
Swamp Gas Bubble | lob | c | pattern=burst kw=curse after=knock rune=C
Ossuary Urn | lob | c | pattern=column fuse=heavy after=ground kw=freeze rune=B
Cauldron Spill | lob | u | pattern=burst fuse=quick kw=poison rune=A
Witch's Brew Toss | lob | u | pattern=cross fuse=heavy kw=poison rune=F
Coffin Drop | lob | u | pattern=single kw=stun after=ground rune=B
Spider Egg Sac | lob | u | pattern=burst kw=slow after=ground rune=C
Funeral Wreath | lob | u | pattern=ring fuse=quick kw=curse after=knock rune=D
Brimstone Hail | lob | u | pattern=column kw=curse after=ground rune=E
The Tower Card | lob | r | pattern=column fuse=quick kw=stun after=ground rune=D
Pox Cloud | lob | r | pattern=ring fuse=heavy kw=poison after=knock rune=E
Bottled Nightmare | lob | r | pattern=cross fuse=quick kw=confuse after=knock rune=F
Black Death | lob | l | pattern=ring fuse=quick kw=poison after=ground rune=A

Skull-Topped Fence | ward | c | form=line build=heavy len=long kw=- rune=E
Coffin Lid | ward | c | form=cage wfx=draining len=short kw=- rune=F
Cobweb Veil | ward | c | form=shield len=long kw=- rune=A
Hook Fence | ward | c | form=line build=light wfx=thorns kw=- rune=F
Beetle Carapace | ward | c | form=shield build=heavy wfx=healing len=long kw=- rune=A
Lead-Lined Coffin | ward | u | form=cage build=light len=short kw=- rune=B
Ossuary Wall | ward | u | form=corridor build=light kw=- rune=C
Crypt Door | ward | u | form=arc build=light len=long kw=- rune=F
Demon Hide | ward | u | form=shield build=light wfx=draining len=short kw=- rune=A
Shroud of Fog | ward | u | form=shield build=heavy len=short kw=- rune=E
Iron Maiden Shell | ward | r | form=shield build=heavy wfx=shocking kw=- rune=D
Barrow Mound | ward | r | form=rampart wfx=healing len=long kw=- rune=C
Hell's Gate | ward | l | form=corridor build=light wfx=thorns len=long kw=- rune=B

Skull Lantern | sentry | c | beh=shields tier=sturdy speed=steady kw=confuse trait=seeds rune=D
Stingy Jack's Lantern | sentry | c | beh=shields tier=sturdy speed=steady kw=- trait=shatter rune=A
Crow Perch | sentry | c | beh=pierce tier=sturdy speed=steady trait=dread kw=- rune=F
Will-o'-the-Wisp | sentry | c | beh=zigzag tier=frail speed=quick kw=confuse trait=lifesteal rune=A
Rot Censer | sentry | c | beh=bolt tier=sturdy speed=slow trait=plague kw=- rune=F
Bone Totem | sentry | c | beh=empower tier=sturdy speed=slow kw=curse trait=lifesteal rune=C
Pin Doll | sentry | u | beh=snipe tier=sturdy speed=steady kw=curse trait=lifesteal rune=B
Gallows Tree | sentry | u | beh=guards tier=sturdy speed=slow kw=pull trait=seeds rune=A
Bubbling Cauldron | sentry | u | beh=bolt tier=sturdy speed=steady trait=drilled kw=- rune=F
Spider Nest | sentry | u | beh=summoner tier=sturdy speed=slow kw=stun trait=shatter rune=D
Blood Fountain | sentry | r | beh=bolt tier=sturdy speed=steady kw=drain trait=lifesteal rune=E
Cursed Mirror | sentry | r | beh=snipe tier=sturdy speed=steady trait=static kw=- rune=B

Shadow Step | boon | c | boon=dodge side=chill kw=- rune=E
Bat Form | boon | c | boon=haste len=long side=glow timing=delayed kw=- rune=F
Black Cat's Luck | boon | c | boon=dodge side=jolt timing=delayed kw=- rune=A
Sip of Blood | boon | c | boon=heal side=muster kw=- rune=B
Embalming Salts | boon | c | boon=regen len=short side=muster kw=- rune=C
Ritual Candles | boon | c | boon=gauge side=siphon timing=delayed kw=- rune=D
Demon's Bargain | boon | u | boon=pact len=long side=jolt timing=delayed kw=- rune=E
Witching Hour | boon | u | boon=courage side=siphon kw=- rune=B
Mist Form | boon | u | boon=phase len=short side=muster timing=echo kw=- rune=C
Full Moon Frenzy | boon | u | boon=power len=short side=chill kw=- rune=E
Blood Moon | boon | r | boon=power len=long side=muster kw=- rune=D
Crossroads Bargain | boon | r | boon=pact side=jolt timing=echo kw=- rune=C
Undying Will | boon | r | boon=intervene side=sprout kw=- rune=B
Infernal Contract | boon | l | boon=pact len=long side=siphon kw=- rune=C

Bag of Teeth | charge | c | shot=twin uses=few edge=splash kw=freeze rune=A
Coffin Nails | charge | c | shot=bolt uses=few kw=curse rune=D
Spider Fangs | charge | c | shot=bolt uses=few kw=poison edge=pierce rune=E
Bone Darts | strike | c | shape=line cast=quick kw=freeze rune=D
Belfry Bats | summon | c | beh=dash tier=frail speed=quick kw=confuse trait=harvest rune=E
Crow Feathers | charge | c | shot=bolt kw=freeze rune=B
Nightshade Berries | charge | c | shot=twin kw=poison rune=C
Jar of Carrion Beetles | lob | c | pattern=row fuse=quick kw=- rune=B
Plague Vials | charge | u | shot=lob kw=poison edge=splash rune=C
Leech Jar | charge | u | shot=bolt kw=drain edge=pierce rune=A
Mold Jars | charge | u | shot=lob uses=few kw=poison edge=crit rune=F
Dungeon Chains | charge | u | shot=bolt kw=pull edge=crit rune=C
Mandrake Roots | summon | u | beh=cone tier=sturdy speed=slow trait=seeds kw=- rune=B
Ferryman's Coins | charge | u | shot=bolt kw=curse edge=splash rune=C
Hellfire Embers | charge | r | shot=lob uses=few kw=curse edge=splash rune=B
Banshee's Comb | charge | r | shot=bolt uses=many kw=confuse rune=E
Vampire Fang Necklace | charge | r | shot=bolt uses=many kw=drain edge=crit rune=D
Pandora's Jar | charge | l | shot=lob uses=many kw=curse rune=C

Three-Card Reading | utility | c | util=draw rune=A
Casting the Bones | utility | c | util=draw rune=D
Grave Robbing | utility | c | util=recall rune=E
Tarot Spread | utility | u | util=draw rune=B
Seance | utility | u | util=recall rune=C
Plague Doctor's Tonic | utility | u | util=cleanse rune=F
Raise the Dead | utility | r | util=recall rune=A
Doppelganger | utility | r | util=copy rune=B
Necromancer's Grimoire | utility | l | util=copy rune=C

Rusted Mantrap | trap | c | trap=spike len=long size=three kw=freeze rune=B
Open Grave | trap | c | trap=zombie len=short size=three kw=- rune=E
Sucking Bog | trap | u | trap=snare kw=slow len=long size=three rune=✱
Trapdoor Spider Lair | trap | u | trap=snare kw=poison rune=A
Plague Mine | trap | u | trap=blast kw=poison len=short size=three rune=F
Rigged Coffin | trap | c | trap=zombie kw=drain len=long size=three rune=C
Oubliette | trap | r | trap=snare size=three kw=- rune=B
The Hanged Man | trap | r | trap=snare kw=pull len=short size=three rune=E
Cursed Tomb | trap | r | trap=zombie kw=curse size=three rune=D

Haunted Bog | environment | c | env=bramble pattern=burst kw=curse rune=F
Graveyard Fog | environment | c | env=bramble pattern=row len=short kw=- rune=E
Webbed Hollow | environment | c | env=bramble pattern=cross kw=- rune=D
Graveyard Chill | environment | c | env=freeze pattern=row len=long kw=curse rune=C
Restless Graves | environment | u | env=tremor pattern=burst len=long kw=- rune=B
Hellfire Rift | environment | u | env=burn pattern=column len=short kw=- rune=A
Acid Rain | environment | u | env=burn pattern=row len=long kw=- rune=F
Draugr's Barrow Frost | environment | u | env=freeze pattern=burst len=short kw=- rune=✱
Witch's Thicket | environment | c | env=bramble pattern=column len=long kw=- rune=F
Catacomb Collapse | environment | r | env=tremor pattern=row kw=- rune=F
Mouth of Hell | environment | l | env=burn pattern=burst kw=- rune=A

Crown of the Lich King | piece | l | shape=mine kw=curse rider=recoil rune=C
Fang of the First Vampire | piece | l | shape=fan kw=drain rider=onkill cast=quick rune=D
Candle of the Hanged Man | piece | l | shape=mine kw=stun rider=recoil cast=quick rune=E
Cauldron of the Bone Mother | piece | l | shape=mine kw=poison rider=crit cast=charged rune=D
Mask of the Plague Doctor | piece | l | shape=mine kw=mend rider=onkill rune=E

Skeleton Warrior | summon | c | body=Skeleton beh=cross tier=sturdy speed=steady kw=confuse trait=dread rune=D
Skeleton Archer | summon | c | body=Skeleton beh=snipe tier=sturdy speed=quick kw=curse trait=rises rune=A
Bone Rattler | summon | c | body=Skeleton mod=Scrappy beh=dash tier=frail speed=quick kw=drain trait=rises rune=F
Shambling Zombie | summon | c | body=Zombie beh=blast tier=sturdy speed=steady kw=drain trait=rises rune=C
Plague Zombie | summon | c | body=Zombie mod=Hungry beh=guards tier=sturdy speed=steady trait=rises kw=- rune=B
Ghoul | summon | c | body=Ghoul beh=chain tier=sturdy speed=slow kw=drain trait=rises rune=E
Poltergeist | summon | c | body=Ghost mod=Scrappy beh=zigzag tier=sturdy speed=slow kw=drain trait=dread rune=✱
Vampire Thrall | summon | c | body=Vampire mod=Scrappy beh=shields tier=sturdy speed=steady kw=drain trait=static rune=A
Vampire Bat | summon | c | body=Bat mod=Hungry beh=dash tier=frail speed=quick kw=curse trait=lifesteal rune=F
Tokoloshe | summon | c | body=Imp mod=Sly beh=trample tier=sturdy speed=slow kw=confuse rune=✱
Adze | summon | c | body=Moth mod=Tiny beh=taunt tier=sturdy speed=steady kw=curse trait=drilled rune=E
Night-Pack Wolf | summon | c | body=Wolf mod=Grim beh=pounce tier=sturdy speed=slow kw=drain trait=shatter rune=B
Cave Spider | summon | c | body=Spider beh=bolt tier=sturdy speed=steady kw=curse rune=C
Death's-Head Moth | summon | c | body=Moth beh=zigzag tier=frail speed=quick kw=curse trait=shatter rune=F
Carrion Beetle | summon | c | body=Beetle mod=Mossy beh=guards tier=tough speed=slow kw=drain rune=A
Cave Centipede | summon | c | body=Centipede beh=pounce tier=sturdy speed=slow kw=curse rune=D
Plague Rat | summon | c | body=Rat mod=Mossy beh=dash tier=frail speed=quick kw=pull trait=plague rune=E
Bog Leech | summon | c | body=Leech beh=bolt tier=sturdy speed=slow kw=drain rune=B
Gravedigger | summon | c | body=Squire mod=Old beh=burrow tier=sturdy speed=steady kw=pull rune=C
Dungeon Jailer | summon | c | body=Ogre mod=Iron beh=wardmaker tier=sturdy speed=quick kw=pull rune=E
Brimstone Imp | summon | c | body=Imp beh=barrage tier=frail speed=quick kw=curse trait=harvest rune=D
Murder of Crows | summon | c | body=Crow beh=barrage tier=frail speed=frantic kw=curse trait=phantom rune=C
Witch's Toad | summon | c | body=Toad mod=Mossy beh=chain tier=sturdy speed=slow kw=slow rune=B
Black Cat Familiar | summon | c | body=Cat beh=pounce tier=sturdy speed=steady kw=curse trait=pack rune=C
Haugbui | summon | u | body=Skeleton mod=Old beh=summoner tier=sturdy speed=steady trait=phantom kw=- rune=B
Jiangshi | summon | u | body=Jiangshi beh=mends tier=sturdy speed=slow kw=curse trait=rises rune=A
Nachzehrer | summon | u | body=Ghoul mod=Hungry beh=empower tier=sturdy speed=slow kw=pull trait=dread rune=F
Yurei | summon | u | body=Ghost mod=Pale beh=zigzag tier=sturdy speed=steady kw=pull trait=phantom rune=A
Vetala | summon | u | body=Ghost mod=Clever beh=barrage tier=sturdy speed=steady trait=harvest kw=- rune=F
Mara | summon | u | body=Ghost mod=Sly beh=trample tier=sturdy speed=quick kw=drain rune=F
Pontianak | summon | u | body=Banshee mod=Sly beh=mends tier=sturdy speed=slow kw=slow trait=static rune=A
Bog Revenant | summon | u | body=Zombie mod=Mossy beh=mends tier=sturdy speed=frantic trait=rises kw=- rune=B
Loup-Garou | summon | u | body=Werewolf mod=Wild beh=mends tier=sturdy speed=slow kw=drain trait=drilled rune=A
Bayou Rougarou | summon | u | body=Werewolf mod=Mossy beh=twin tier=sturdy speed=steady kw=curse trait=dread rune=B
Barghest | summon | u | body=Hound mod=Feral beh=mends tier=sturdy speed=slow kw=pull trait=shatter rune=C
Black Cadejo | summon | u | body=Hound mod=Grim beh=pounce tier=sturdy speed=slow trait=static kw=- rune=D
Night Mare | summon | u | body=Nightmare beh=burrow tier=sturdy speed=slow kw=pull trait=lifesteal rune=E
Black Widow | summon | u | body=Spider mod=Grim beh=summoner tier=sturdy speed=slow kw=poison trait=pack rune=F
Bog Witch | summon | u | body=Witch mod=Mossy beh=chain tier=sturdy speed=slow kw=curse trait=shatter rune=A
Plague Doctor | summon | u | body=Plaguemask beh=cross tier=sturdy speed=slow kw=curse trait=plague rune=A
Necromancer | summon | u | body=Witch mod=Clever beh=summoner tier=sturdy speed=slow kw=drain trait=harvest rune=F
Horned Night Visitor | summon | u | body=Demon mod=Feral beh=barrage tier=sturdy speed=slow kw=confuse trait=pack rune=C
Omen Raven | summon | u | body=Crow mod=Clever beh=diag tier=sturdy speed=steady kw=drain trait=plague rune=B
Draugr | summon | r | body=Zombie mod=Ancient beh=summoner tier=sturdy speed=steady kw=curse trait=rises rune=C
Onryo | summon | r | body=Ghost mod=Grim beh=zigzag tier=sturdy speed=slow kw=curse trait=phantom rune=B
Bean Sidhe | summon | r | body=Banshee beh=summoner tier=sturdy speed=steady kw=mend trait=harvest rune=E
Lich | summon | r | body=Lich beh=mends tier=sturdy speed=steady kw=poison trait=rises rune=D
Ankou | summon | r | body=Reaper mod=Old beh=burrow tier=sturdy speed=slow kw=curse trait=drilled rune=C
Strigoi | summon | r | body=Vampire mod=Pale beh=pierce tier=sturdy speed=steady kw=drain trait=drilled rune=B
Aswang | summon | r | body=Werewolf mod=Sly beh=twin tier=sturdy speed=slow kw=- trait=shatter rune=F
Manananggal | summon | r | body=Bat mod=Grim beh=blast tier=sturdy speed=slow kw=drain trait=pack rune=A
Asanbosam | summon | r | body=Vampire mod=Feral beh=lob tier=sturdy speed=steady kw=confuse rune=D
Werewolf | summon | r | body=Werewolf beh=pounce tier=sturdy speed=steady kw=pull trait=harvest rune=E
Black Shuck | summon | r | body=Hound mod=Dire beh=dash tier=sturdy speed=slow trait=pack kw=- rune=D
Antlered Hunger | summon | r | body=Gaunt mod=Hungry beh=summoner tier=sturdy speed=slow kw=curse trait=static rune=E
Jorogumo | summon | r | body=Spider mod=Sly beh=twin tier=sturdy speed=steady kw=drain rune=B
Rat King | summon | r | body=Rat mod=Dire beh=zigzag tier=frail speed=quick trait=plague kw=- rune=C
Black Annis | summon | r | body=Witch mod=Grim beh=summoner tier=sturdy speed=frantic kw=- trait=shatter rune=F
Pit Fiend | summon | r | body=Demon beh=mends tier=sturdy speed=steady kw=curse trait=shatter rune=A
Rakshasa | summon | r | body=Demon mod=Sly beh=mends tier=sturdy speed=steady kw=stun trait=dread rune=C
Morrigan's Raven | summon | r | body=Crow mod=Ancient beh=beam tier=sturdy speed=steady kw=curse trait=seeds rune=B
Gashadokuro | summon | l | body=Skeleton mod=Dire beh=summoner tier=sturdy speed=steady kw=pull trait=seeds rune=✱
La Llorona | summon | l | body=Banshee mod=Pale beh=mends tier=sturdy speed=steady kw=confuse trait=phantom rune=F
Dullahan | summon | l | body=Knight mod=Grim beh=mends tier=sturdy speed=steady trait=lifesteal kw=- rune=A
Grim Reaper | summon | l | body=Reaper mod=Ancient beh=pounce tier=tough speed=steady kw=curse trait=plague rune=F
Baba Yaga | summon | l | body=Witch mod=Ancient beh=mends tier=sturdy speed=slow trait=dread kw=- rune=E
The Erlking | summon | l | body=Spirit mod=Pale beh=mends tier=sturdy speed=steady kw=pull trait=pack rune=D

Bone Ballista | machine | c | mach=Ballista beh=snipe tier=sturdy speed=steady kw=confuse trait=rises rune=F
Skull Catapult | machine | c | mach=Catapult beh=lob tier=sturdy speed=slow kw=pull trait=pack rune=E
Torture Rack | machine | u | mach=Barricade beh=summoner tier=sturdy speed=quick kw=curse rune=D
Coffin Cannon | machine | u | mach=Cannon beh=bolt tier=sturdy speed=steady kw=confuse trait=shatter rune=C
Plague Trebuchet | machine | u | mach=Trebuchet beh=lob tier=sturdy speed=slow kw=confuse trait=plague rune=B
Iron Maiden | summon | r | beh=summoner tier=sturdy speed=slow kw=- rune=C
Gibbet Tower | sentry | r | mach=Tower beh=bolt tier=sturdy speed=steady kw=pull trait=rises rune=B
Hut on Chicken Legs | machine | l | mach=Automaton beh=summoner tier=sturdy speed=slow kw=pull trait=overcharge rune=A
`,


/* ---------------- White · Light: knowledge, faith, safety and human achievement ---------------- */
light:`
Pilum Volley | strike | c | shape=gun kw=- rune=E
Gladius Thrust | strike | c | shape=spear rider=recoil kw=- rune=B
Lance Charge | strike | c | shape=line kw=valor rider=pierce rune=C
Crusader's Charge | strike | u | shape=line kw=valor rider=recoil cast=charged rune=B
Longbow Volley | strike | c | shape=snipe rider=crit kw=- rune=C
Agincourt Arrowstorm | strike | r | shape=line rider=onkill cast=quick kw=- rune=F
West Wind Gust | strike | c | shape=wedge rider=onkill cast=charged kw=- rune=A
Zephyr's Breath | strike | c | shape=fan kw=push rider=crit cast=quick rune=F
Mistral Gale | strike | u | shape=fan kw=push cast=charged rune=C
Owl's Silent Dive | strike | c | shape=snipe kw=stun cast=charged rune=B
Pegasus Hoofbeat | strike | u | shape=snipe kw=push rune=C
Centaur's Arrow | strike | c | shape=line cast=charged kw=- rune=B
Unicorn Horn Thrust | strike | u | shape=spear kw=mend rider=pierce rune=F
Aegis Bash | strike | u | shape=wedge kw=stun cast=quick rune=B
Starlight Lance | strike | u | shape=spear kw=stun rider=pierce cast=quick rune=C
Astrolabe Sightline | strike | c | shape=mine rider=crit cast=charged kw=- rune=C
Bright Comet | lob | r | pattern=cross fuse=heavy kw=stun after=knock rune=B
Gavel of Justice | strike | c | shape=cluster kw=stun rider=onkill cast=charged cluster=ring rune=B
Shield Bash | strike | c | shape=snipe kw=stun rider=recoil cast=quick rune=F
Phalanx Advance | strike | u | shape=row kw=push rider=onkill rune=C
Crane Wing Sweep | strike | c | shape=burst kw=slow cast=charged rune=C
Qilin's Flame | strike | r | shape=wedge kw=confuse rider=onkill rune=B
White Stag's Antlers | strike | u | shape=mine kw=push rider=recoil cast=charged rune=C
Simurgh Feather Gust | strike | r | shape=fan kw=push rider=recoil rune=B
Paladin's Oath Blade | strike | r | shape=boomerang kw=valor rune=E
Martyr's Last Stand | strike | r | shape=wave kw=confuse rider=onkill cast=quick rune=C
Riddle of the Sphinx | strike | r | shape=missiles kw=confuse rune=C
Scholar's Paradox | strike | c | shape=zigzag kw=confuse cast=quick rune=C
Marble Shard Spray | strike | c | shape=row kw=slow rider=onkill cast=charged rune=B
Valkyrie's Descent | strike | r | shape=diag kw=valor rider=recoil rune=C
Durandal's Stroke | strike | l | shape=line kw=valor cast=quick rune=B
Excalibur's Arc | strike | l | shape=chain kw=valor rider=onkill rune=C

Mortar of Bricks | lob | c | pattern=single fuse=heavy kw=slow after=ground rune=B
Font of Blessed Water | lob | c | pattern=burst fuse=heavy kw=mend rune=E
Incense Censer | lob | u | pattern=burst fuse=quick kw=confuse after=ground rune=C
Falling Masonry | lob | u | pattern=column kw=stun after=knock rune=B
Onager Stone | lob | c | pattern=single fuse=quick kw=stun after=ground rune=C
Toppled Marble Column | lob | u | pattern=column fuse=heavy kw=slow after=knock rune=C
Falling Star | lob | c | pattern=single fuse=heavy kw=confuse after=knock rune=B
Alchemist's Flask | lob | c | pattern=burst kw=confuse after=knock rune=B
Salve Jar | lob | c | pattern=burst fuse=heavy kw=pull after=ground rune=C
Quicksilver Retort | lob | u | pattern=burst kw=stun after=ground rune=B
Abbey Bell Toll | lob | u | pattern=ring fuse=quick kw=stun after=knock rune=C
Slinger's Hail | lob | c | pattern=row fuse=quick after=ground kw=- rune=F
Southern Cross Starfall | lob | r | pattern=cross fuse=heavy kw=confuse after=ground rune=B
Downdraft | lob | u | pattern=column fuse=heavy kw=push after=ground rune=D
Owl Pellet | lob | c | pattern=single fuse=quick after=knock kw=- rune=E
Siege Stone of Acre | lob | r | pattern=burst fuse=quick kw=push after=knock rune=B

Kite Shield | ward | c | form=shield build=light len=long kw=- rune=E
Tower Shield | ward | c | form=shield wfx=steady len=short kw=- rune=B
Marble Wall | ward | c | form=rampart len=long kw=- rune=C
Brick Rampart | ward | c | form=rampart build=light kw=- rune=B
Cloister Arches | ward | c | form=cage build=light len=short kw=- rune=C
Spiked Pavise | ward | c | form=arc len=short kw=- rune=F
Chevaux-de-Frise | ward | c | form=line build=heavy len=long kw=- rune=✱
Testudo Formation | ward | u | form=shield build=heavy len=short kw=- rune=B
Castle Portcullis | ward | u | form=corridor build=light wfx=healing kw=- rune=C
Shieldwall of the Fyrd | ward | u | form=shield build=heavy wfx=steady len=long kw=- rune=B
Sheltering Wings | ward | u | form=arc build=heavy wfx=steady len=short kw=- rune=B
Hadrian's Wall | ward | r | form=arc build=heavy wfx=shocking kw=- rune=A
Sacsayhuaman Stones | ward | r | form=arc wfx=shocking len=long kw=- rune=C
Great Zimbabwe Walls | ward | r | form=rampart build=heavy wfx=shocking len=long kw=- rune=C
Ishtar Gate | ward | r | form=cage build=heavy kw=- rune=F
White Heron Castle | ward | r | form=cage build=heavy wfx=shocking len=short kw=- rune=C
Aegis of Athena | ward | l | form=shield wfx=shocking kw=- rune=B
Theodosian Walls | ward | l | form=corridor build=light wfx=shocking len=short kw=- rune=C

Harbor Lighthouse | sentry | c | beh=bolt tier=sturdy speed=quick trait=overcharge kw=- rune=B
Arrow-Slit Tower | sentry | c | beh=cross tier=sturdy speed=steady kw=stun rune=C
Owl on the Parapet | sentry | c | beh=diag tier=tough speed=steady kw=mend trait=static rune=B
Windmill of La Mancha | sentry | c | beh=pierce tier=sturdy speed=steady kw=push trait=overcharge rune=A
Weathervane Cockerel | sentry | c | beh=chain tier=sturdy speed=steady kw=push trait=guardian rune=F
Wayside Shrine | sentry | c | beh=mends tier=sturdy speed=steady kw=mend trait=static rune=E
Bell Tower | sentry | u | beh=snipe tier=sturdy speed=steady kw=valor trait=tidal rune=C
Stone Lions of Delos | sentry | u | beh=bolt tier=sturdy speed=steady kw=valor trait=chilling rune=C
Obelisk of the Sun | sentry | u | beh=snipe tier=sturdy speed=steady kw=push trait=radiant rune=C
Caracol Observatory | sentry | u | beh=pierce tier=sturdy speed=steady kw=mend rune=B
Lamassu Gate Statue | sentry | r | beh=guards tier=tough speed=slow kw=push trait=dread rune=C
Pharos of Alexandria | sentry | l | beh=bolt tier=sturdy speed=steady trait=martyr kw=- rune=C

Knight's Vigil | boon | c | boon=courage side=chill kw=- rune=✱
Oath of Fealty | boon | c | boon=power len=short side=rally kw=- rune=D
Westerly Breeze | boon | c | boon=haste kw=- rune=B
Owl's Foresight | boon | c | boon=dodge side=chill timing=delayed kw=- rune=B
Physician's Balm | boon | c | boon=heal side=chill timing=echo kw=- rune=C
Herbal Poultice | boon | c | boon=regen len=long side=jolt timing=delayed kw=- rune=C
Vigil Candle | boon | c | boon=gauge side=radiance kw=- rune=A
Rally the Legion | boon | u | boon=courage side=jolt timing=echo kw=- rune=C
Pegasus Flight | boon | u | boon=dodge side=rally kw=- rune=E
Crusader's Vow | boon | u | boon=pact len=short side=jolt kw=- rune=B
Sushruta's Stitches | boon | u | boon=heal side=jolt kw=- rune=B
Angelic Veil | boon | r | boon=phase len=short side=jolt timing=delayed kw=- rune=✱
Valkyrie's Reprieve | boon | r | boon=intervene side=muster kw=- rune=F

Swan-Feather Quiver | charge | c | shot=burst uses=many kw=- rune=E
Legionary's Javelins | charge | c | shot=bolt uses=few kw=mend edge=splash rune=B
Yew Longbow Quiver | charge | c | shot=burst uses=many kw=mend edge=crit rune=A
Holy Water Vials | lob | c | pattern=ring fuse=quick kw=mend after=ground rune=F
Huaraca Stones | charge | c | shot=burst uses=few kw=stun edge=pierce rune=A
Brick Hod | charge | c | shot=lob kw=slow edge=pierce rune=B
Salve Tin | charge | c | shot=lob uses=few kw=mend rune=C
Owl-Feather Darts | charge | c | shot=bolt uses=few kw=valor edge=crit rune=F
Tesserae Pouch | charge | c | shot=burst kw=valor edge=splash rune=B
Genoese Crossbow Bolts | charge | u | shot=bolt uses=few kw=push edge=pierce rune=B
Censer Coals | charge | u | shot=lob kw=stun edge=splash rune=C
Sealed Edict Scrolls | charge | u | shot=lob uses=many kw=stun rune=C
Silver Arrows of the Hunt | charge | u | shot=bolt edge=pierce kw=- rune=B
Apothecary's Vials | lob | u | pattern=burst fuse=quick kw=- rune=C
Bag of Winds | charge | r | shot=bolt uses=many kw=push rune=F
Thousand Paper Cranes | charge | r | shot=bolt uses=many kw=slow edge=crit rune=E
Burning Lens of Archimedes | charge | r | shot=bolt uses=few kw=stun rune=D
Arrows of Heracles | charge | l | shot=bolt uses=many kw=stun edge=pierce rune=✱

Imperial Scribe's Brush | utility | c | util=draw rune=E
Cai Lun's Paper | utility | c | util=draw rune=C
Quipu Record | utility | c | util=recall rune=A
Roman Bathhouse | utility | c | util=cleanse rune=B
Illuminated Manuscript | utility | u | util=draw rune=C
Alchemist's Still | utility | u | util=copy rune=D
Movable Type Press | utility | u | util=copy rune=E
Cleric's Absolution | utility | u | util=cleanse rune=C
Aryabhata's Tables | utility | u | util=draw rune=A
House of Wisdom | utility | r | util=draw rune=B
Timbuktu Manuscripts | utility | r | util=draw rune=D
Emerald Tablet | utility | r | util=copy rune=C
Canon of Medicine | utility | r | util=cleanse rune=B
Library of Alexandria | utility | l | util=draw rune=C

Roman Caltrops | trap | c | trap=spike kw=slow len=short size=three rune=✱
Drawbridge Slam | trap | c | trap=blast kw=stun len=long rune=C
Gladiator's Net | trap | c | trap=snare kw=slow size=three rune=B
Sunfire Glyph | trap | c | trap=blast len=long size=three kw=- rune=C
Lilia Pits | trap | u | trap=spike len=long kw=- rune=B
Murder Hole | trap | u | trap=blast kw=stun len=short size=three rune=B
Riddle at the Gate | trap | u | trap=snare kw=confuse len=long rune=F
Tomb Builder's Pitfall | trap | u | trap=spike kw=mend len=short rune=C
Daedalus's Snare | trap | r | trap=snare kw=pull rune=C

Noon Sun on Marble | environment | c | env=burn pattern=row len=short kw=- rune=B
Hedge Maze | environment | c | env=bramble pattern=cross len=short kw=- rune=B
Monastery Herb Garden | environment | c | env=bramble pattern=burst len=short kw=stun rune=D
Marble Quarry | environment | c | env=tremor pattern=column len=short kw=- rune=C
Pure Snowfield | environment | c | env=freeze pattern=burst len=short kw=- rune=F
Consecrated Ground | environment | u | env=burn pattern=burst len=long kw=- rune=C
Rose Garden of Shiraz | environment | u | env=bramble pattern=row len=long kw=- rune=B
Collapsing Colonnade | environment | r | env=tremor pattern=row kw=- rune=E
Hanging Gardens of Babylon | environment | l | env=bramble pattern=burst kw=- rune=C

Crown of the Round Table | piece | l | boon=intervene side=jolt timing=delayed kw=- rune=B
Grail of the Fisher King | piece | l | boon=intervene side=chill kw=- rune=C
Stone of the Philosophers | piece | l | boon=heal side=jolt kw=- rune=C
Bridle of the Pegasus | piece | l | boon=courage side=muster kw=- rune=D
Scales of the Final Judge | piece | l | boon=heal side=chill timing=echo kw=- rune=E

Pegasus Foal | summon | c | body=Pegasus mod=Tiny beh=barrage tier=sturdy speed=slow trait=tidal kw=- rune=D
Pegasus | summon | r | body=Pegasus mod=Noble beh=barrage tier=sturdy speed=steady kw=stun trait=radiant rune=C
Centaur Archer | summon | u | body=Centaur beh=snipe tier=tough speed=steady kw=mend trait=overcharge rune=B
Chiron, Healer of Heroes | summon | l | body=Centaur mod=Ancient beh=mends tier=sturdy speed=slow kw=mend trait=blessed rune=C
White Unicorn | summon | r | body=Unicorn mod=Pale beh=mends tier=sturdy speed=slow kw=valor trait=overcharge rune=B
White Stag | summon | u | body=Stag mod=Pale beh=barrage tier=sturdy speed=steady kw=mend trait=guardian rune=A
Snow Crane | summon | c | body=Crane beh=empower tier=sturdy speed=steady kw=valor trait=dread rune=B
Thousand-Year Crane | summon | r | body=Crane mod=Ancient beh=cross tier=sturdy speed=slow kw=mend trait=static rune=C
Barn Owl | summon | c | body=Owl beh=dash tier=sturdy speed=steady kw=valor trait=static rune=B
Owl of Athena | summon | u | body=Owl mod=Clever beh=diag tier=sturdy speed=steady trait=overcharge kw=- rune=D
White Wolf | summon | c | body=Wolf mod=Pale beh=pounce tier=sturdy speed=steady kw=push trait=chilling rune=C
White Wolf Matriarch | summon | r | body=Wolf mod=Noble beh=pounce tier=sturdy speed=steady trait=sandstorm kw=- rune=F
Talbot Hound | summon | c | body=Hound mod=Loyal beh=dash tier=sturdy speed=slow kw=valor trait=dread rune=B
Royal Gyrfalcon | summon | c | body=Hawk mod=Pale beh=diag tier=sturdy speed=steady kw=valor trait=radiant rune=B
Heraldic Griffin | summon | u | body=Griffin mod=Noble beh=shields tier=sturdy speed=slow kw=mend trait=rallying rune=C
Lamassu | summon | r | body=Lamassu beh=empower tier=sturdy speed=steady kw=confuse trait=blessed rune=D
Guardian Sphinx of Giza | summon | u | body=Sphinx mod=Clever beh=taunt tier=tough speed=slow trait=static kw=- rune=B
Great Sphinx of Giza | summon | l | body=Sphinx mod=Ancient beh=empower tier=sturdy speed=steady trait=static kw=- rune=B
White Elephant | summon | r | body=Elephant mod=Pale beh=trample tier=tough speed=slow kw=mend trait=tidal rune=C
Hannibal's War Elephant | summon | r | body=Elephant mod=Brave beh=trample tier=tough speed=steady kw=mend trait=chilling rune=B
Qilin | summon | l | body=Qilin beh=blast tier=sturdy speed=slow kw=mend trait=tidal rune=F
Valkyrie Herald | summon | u | body=Valkyrie mod=Swift beh=empower tier=sturdy speed=slow kw=valor trait=rallying rune=C
Valkyrie Shieldmaiden | summon | r | body=Valkyrie beh=taunt tier=tough speed=steady kw=valor trait=guardian rune=B
Cherub | summon | c | body=Angel mod=Tiny beh=empower tier=sturdy speed=slow kw=push rune=C
Guardian Angel | summon | u | body=Angel beh=guards tier=tough speed=slow kw=mend trait=blessed rune=B
Forbidden City Lion | summon | u | body=Shishi mod=Stone beh=pounce tier=sturdy speed=steady kw=valor rune=B
Rose-Garden Simurgh | summon | l | body=Phoenix mod=Ancient beh=barrage tier=sturdy speed=slow kw=mend trait=radiant rune=B
Sylph of the Gale | summon | c | body=Sprite mod=Swift beh=cross tier=sturdy speed=slow kw=push trait=dread rune=C
Roman Legionary | summon | c | body=Knight mod=Iron beh=empower tier=sturdy speed=steady kw=stun trait=sandstorm rune=B
Centurion | summon | u | body=Knight mod=Old beh=taunt tier=tough speed=steady kw=confuse trait=tidal rune=F
Crusader Knight | summon | u | body=Knight mod=Brave beh=guards tier=tough speed=steady kw=push trait=sandstorm rune=B
Knight of the Round Table | summon | r | body=Knight mod=Noble beh=guards tier=tough speed=steady kw=valor trait=dread rune=C
Sir Galahad, the Pure | summon | l | body=Knight mod=Pale beh=cross tier=sturdy speed=steady kw=mend trait=rallying rune=E
El Cid Campeador | summon | l | body=Knight mod=Noble beh=lob tier=sturdy speed=steady kw=mend trait=chilling rune=D
Longbowman | summon | c | body=Squire mod=Loyal beh=snipe tier=sturdy speed=quick kw=valor trait=dread rune=B
Inca Stonemason | summon | c | body=Squire mod=Stone beh=barrage tier=sturdy speed=steady kw=confuse trait=static rune=B
Village Physician | summon | c | body=Cleric mod=Gentle beh=barrage tier=sturdy speed=quick kw=mend trait=overcharge rune=C
Battle Cleric | summon | c | body=Cleric mod=Brave beh=shields tier=frail speed=quick kw=valor trait=blessed rune=B
Vaidya of Taxila | summon | u | body=Cleric mod=Gentle beh=cross tier=sturdy speed=quick kw=- rune=C
Hanlin Academy Scribe | summon | c | body=Scholar beh=summoner tier=sturdy speed=steady kw=valor trait=overcharge rune=C
Persian Astronomer | summon | u | body=Scholar mod=Clever beh=blast tier=sturdy speed=steady kw=valor trait=martyr rune=F
Astronomer of Copan | summon | u | body=Scholar mod=Old beh=lob tier=sturdy speed=quick kw=push trait=chilling rune=B
Imhotep the Builder | summon | l | body=Scholar mod=Ancient beh=cross tier=sturdy speed=slow kw=valor trait=sandstorm rune=C
Terracotta Warrior | summon | u | body=Golem mod=Stone beh=trample tier=tough speed=slow kw=valor rune=C
Talos, the Bronze Guard | summon | r | body=Golem mod=Iron beh=taunt tier=tough speed=quick trait=blessed kw=- rune=B

Roman Ballista | machine | c | mach=Ballista beh=snipe tier=sturdy speed=slow kw=mend rune=F
Legion Scorpio Engine | machine | c | mach=Crossbow beh=empower tier=sturdy speed=slow kw=mend trait=dread rune=C
Mangonel | machine | c | mach=Catapult beh=blast tier=sturdy speed=slow kw=stun trait=static rune=B
Battering Ram | machine | c | mach=Engine beh=zigzag tier=tough speed=quick kw=push trait=martyr rune=C
Wicker Mantlet | machine | c | mach=Barricade beh=lob tier=sturdy speed=slow kw=valor trait=blessed rune=B
Legion Camp Palisade | machine | c | mach=Palisade beh=wardmaker tier=huge speed=slow kw=mend rune=C
Curtain Wall Rampart | machine | c | mach=Rampart beh=wardmaker tier=huge speed=slow kw=push trait=dread rune=B
Norman Keep | machine | c | mach=Bulwark beh=wardmaker tier=huge speed=steady kw=- rune=C
Onager Catapult | machine | u | mach=Catapult beh=lob tier=sturdy speed=slow kw=push trait=martyr rune=B
Counterweight Trebuchet | machine | u | mach=Trebuchet beh=lob tier=sturdy speed=slow kw=stun rune=F
Zhuge Nu Repeater | machine | u | mach=Repeater beh=twin tier=frail speed=frantic kw=valor rune=A
Siege Tower | machine | u | mach=Tower beh=blast tier=sturdy speed=slow kw=valor rune=D
Motte-and-Bailey Palisade | machine | u | mach=Palisade beh=wardmaker tier=huge speed=slow kw=valor trait=rallying rune=B
Marble Bastion | machine | u | mach=Bastion beh=wardmaker tier=huge speed=slow kw=stun trait=sandstorm rune=✱
Turtle Ship Bulwark | machine | u | mach=Bulwark beh=guards tier=tough speed=slow kw=stun rune=C
Hero's Automaton | machine | u | mach=Automaton beh=trample tier=tough speed=slow kw=push trait=radiant rune=B
Kite of Han Xin | machine | u | mach=Drone beh=blast tier=sturdy speed=steady kw=mend trait=dread rune=C
Polybolos | machine | r | mach=Repeater beh=barrage tier=sturdy speed=steady kw=push trait=dread rune=B
Helepolis | machine | r | mach=Tower beh=blast tier=sturdy speed=slow kw=push trait=rallying rune=C
Star Fort Bastion | machine | r | mach=Bastion beh=wardmaker tier=huge speed=slow trait=static kw=- rune=C
Claw of Archimedes | machine | r | mach=Engine beh=empower tier=sturdy speed=steady kw=mend trait=martyr rune=B
Al-Jazari's Automaton | machine | r | mach=Automaton beh=guards tier=tough speed=slow trait=guardian kw=- rune=A
Su Song's Clock Tower | machine | r | mach=Tower beh=cross tier=sturdy speed=steady kw=push trait=static rune=C
Warwolf Trebuchet | machine | l | mach=Trebuchet beh=lob tier=sturdy speed=slow trait=guardian kw=- rune=A
Krak des Chevaliers | machine | l | mach=Bastion beh=barrage tier=sturdy speed=slow kw=push trait=overcharge rune=F
`,


/* ---------------- Green · Verdant: nature, the forest and the wild ---------------- */
verdant:`
Hunter's Longbow Shot | strike | c | shape=mark rider=onkill cast=charged kw=- rune=A
Yew Arrow | strike | c | shape=twin rider=pierce cast=charged kw=- rune=D
Woodsman's Throwing Axe | strike | c | shape=fan rider=crit cast=charged kw=- rune=E
Atlatl Dart | strike | c | shape=line rider=pierce cast=quick kw=- rune=A
Bear Swipe | strike | c | shape=burst rider=onkill kw=- rune=C
Volley of the Greenwood | strike | u | shape=gun cast=quick kw=- rune=E
Outlaw's Split Arrow | strike | u | shape=line cast=charged kw=- rune=A
Jaguar Pounce | strike | u | shape=diag rider=recoil cast=quick kw=- rune=E
Tiger's Rake | strike | r | shape=wedge rider=recoil kw=- rune=A
Army Ant March | strike | r | shape=chain rider=crit kw=- rune=A
Blowgun Dart | strike | c | shape=spear kw=poison rider=recoil rune=E
Viper Strike | strike | c | shape=dig kw=poison rider=recoil cast=charged rune=C
Cobra Venom Spray | strike | u | shape=fan kw=poison rider=pierce rune=B
Hornet Swarm | strike | u | shape=cluster kw=poison cluster=scatter rune=E
Komodo Bite | strike | u | shape=wedge kw=drain rider=crit cast=charged rune=D
Curare Needle | strike | u | shape=dig kw=slow rider=crit cast=quick rune=A
Creeping Ivy | strike | c | shape=row kw=slow cast=quick rune=A
Root Grasp | strike | c | shape=boomerang kw=slow rider=crit cast=charged rune=E
Anaconda Squeeze | strike | r | shape=line kw=slow rider=crit rune=✱
Liana Whip | strike | c | shape=zigzag kw=pull rider=pierce cast=quick rune=E
Strangler Fig | strike | u | shape=wave kw=pull rider=recoil rune=A
Will-o'-Wisp Lure | strike | u | shape=zigzag kw=pull rune=D
Stag Leap | strike | c | shape=mine kw=push rune=E
Grizzly Charge | strike | u | shape=spear kw=push rider=recoil cast=charged rune=D
Moose Antler Rush | strike | u | shape=line kw=push rider=pierce rune=E
Highland Caber Toss | strike | r | shape=cluster kw=push rider=recoil cluster=scatter rune=F
Tanuki Leaf Trick | strike | c | shape=mark kw=push cast=charged rune=A
Ratatoskr's Insult | strike | c | shape=cluster kw=push cast=quick cluster=cross rune=F
Leshy's Wrong Turn | strike | u | shape=zigzag kw=mend rider=crit rune=A
Curupira's Backward Trail | strike | r | shape=zigzag kw=drain cast=charged rune=A
Pan's Panic Pipes | strike | r | shape=wave kw=push rider=onkill cast=quick rune=B
Monkey Coconut Toss | strike | c | shape=mine kw=mend rider=onkill rune=A
Elf-Shot | strike | u | shape=spear kw=push rider=pierce cast=quick rune=F
Mapinguari Roar | strike | r | shape=shockwave kw=mend rider=onkill cast=quick rune=E
Druid's Golden Sickle | strike | c | shape=ricochet kw=mend rune=D
Ride of the Wild Hunt | strike | l | shape=snipe kw=drain rider=recoil rune=E
Green Knight's Axe | strike | l | shape=wedge kw=valor rider=crit rune=A
Caledfwlch | strike | l | shape=line kw=valor rider=pierce cast=charged rune=✱

Wasp Nest | summon | c | beh=barrage tier=frail speed=frantic kw=push rune=B
Squirting Cucumber | lob | c | pattern=cross fuse=heavy kw=poison after=ground rune=E
Bog Belch | lob | u | pattern=burst fuse=quick kw=poison after=ground rune=E
Dart Frog Leap | strike | u | shape=spear kw=poison cast=quick rune=E
Rafflesia Bloom | lob | r | pattern=ring fuse=heavy kw=poison after=knock rune=D
Coconut Drop | lob | c | pattern=single fuse=quick kw=mend after=knock rune=A
Falling Deadwood | lob | c | pattern=single kw=valor after=ground rune=A
Felled Oak | summon | r | beh=guards tier=sturdy speed=slow trait=regrows kw=- rune=E
Pinecone Shower | lob | c | pattern=cross fuse=heavy kw=- rune=E
Acorn Rain | lob | c | pattern=ring fuse=heavy after=ground kw=- rune=A
Seed Pod Barrage | lob | c | pattern=row fuse=quick after=ground kw=- rune=C
Sticky Sap Glob | lob | c | pattern=burst fuse=heavy kw=slow after=ground rune=F
Wild Honeycomb Hurl | lob | u | pattern=burst kw=slow after=knock rune=A
Kapok Fluff Burst | lob | u | pattern=burst fuse=quick kw=valor after=knock rune=F
Toadstool Ring | boon | u | boon=intervene side=blood timing=delayed kw=- rune=A
Sasquatch Boulder | lob | u | pattern=single fuse=heavy kw=push after=knock rune=D
Treefolk Stomp | lob | u | pattern=column fuse=quick kw=push after=ground rune=E
Mokele-mbembe's Wake | lob | r | pattern=row fuse=quick kw=push after=knock rune=A
Fall of the Great Ceiba | lob | l | pattern=row fuse=heavy kw=valor after=ground rune=E

Hawthorn Hedge | ward | c | form=corridor build=light kw=- rune=E
Holly Thicket | ward | c | form=corridor build=light wfx=healing len=long kw=- rune=B
Briar Rose Hedge | ward | u | form=corridor build=light wfx=thorns len=short kw=- rune=C
Stacked Log Wall | ward | c | form=rampart build=heavy wfx=thorns len=short kw=- rune=F
Strangler Fig Roots | summon | u | beh=lob tier=sturdy speed=slow kw=drain trait=drilled rune=A
Living Hedge Maze | ward | r | form=shield build=heavy kw=- rune=D
Baobab Bulwark | ward | r | form=rampart build=heavy len=long kw=- rune=E
Turtle Shell Guard | summon | c | beh=guards tier=tough speed=slow trait=drilled kw=- rune=F
Bear Hide Cloak | ward | c | form=arc len=short kw=- rune=A
Moss Mantle | ward | c | form=corridor build=heavy wfx=healing len=short kw=- rune=E
Oak Heartwood Shield | ward | u | form=shield build=light len=short kw=- rune=A
Ghillie Suit | ward | u | form=shield len=long kw=- rune=A
Pangolin Scales | ward | u | form=shield wfx=draining kw=- rune=A
Green Chapel Gate | ward | l | form=cage build=heavy len=short kw=- rune=C

Pitcher Plant | sentry | c | beh=bolt tier=sturdy speed=quick kw=poison trait=lifesteal rune=E
Sundew Patch | sentry | c | beh=bolt tier=sturdy speed=steady kw=slow trait=thorny rune=C
Venus Flytrap | sentry | c | beh=pierce tier=sturdy speed=steady kw=pull rune=B
Beltane Maypole | sentry | c | beh=bolt tier=sturdy speed=steady kw=drain trait=rallying rune=C
Puffball Sentinel | summon | c | beh=taunt tier=tough speed=steady trait=camouflage kw=- rune=B
Carved Stag Post | sentry | c | beh=snipe tier=sturdy speed=slow kw=slow trait=ambush rune=A
Treehouse Archer Post | sentry | u | beh=snipe tier=sturdy speed=slow kw=poison trait=regrows rune=F
Hornet Hive | summon | u | beh=barrage tier=frail speed=frantic kw=poison trait=tidal rune=A
Whispering Oak | summon | u | beh=guards tier=sturdy speed=slow kw=pull trait=thorny rune=E
Druid's Standing Stone | sentry | u | beh=chain tier=sturdy speed=steady kw=slow trait=ambush rune=E
Weeping Willow | summon | r | beh=lob tier=sturdy speed=slow kw=slow trait=regrows rune=E
Mandrake Patch | sentry | r | beh=cone tier=sturdy speed=steady trait=drilled kw=- rune=F

Bear's Might | boon | c | boon=power side=rally timing=echo kw=- rune=E
Stag's Grace | boon | c | boon=haste len=short side=siphon kw=- rune=B
Chameleon Skin | boon | c | boon=dodge side=radiance timing=echo kw=- rune=E
Wild Herb Poultice | boon | c | boon=haste len=long side=siphon timing=echo kw=- rune=E
Willow Bark Tea | boon | c | boon=regen len=short side=rally timing=echo kw=- rune=E
Mistletoe Sprig | boon | c | boon=gauge side=siphon timing=echo kw=- rune=A
Shaman's Vision Quest | boon | u | boon=gauge side=radiance kw=- rune=A
Wolfskin Frenzy | boon | u | boon=pact len=short side=rally kw=- rune=B
Fern Seed Vanishing | boon | u | boon=phase len=short side=radiance kw=- rune=A
Green Man's Blessing | boon | u | boon=courage len=long side=radiance kw=- rune=E
Tapio's Favour | boon | r | boon=power len=long side=glow kw=- rune=D
Demeter's Bounty | boon | r | boon=heal side=sprout timing=echo kw=- rune=A
Green Knight's Girdle | boon | l | boon=intervene side=sprout kw=- rune=F

Quiver of Yew Arrows | charge | c | shot=burst uses=many kw=poison edge=pierce rune=E
Fletcher's Bundle | charge | c | shot=twin uses=few kw=- rune=D
Acorn Sack | charge | c | shot=lob uses=few edge=splash kw=- rune=E
Chestnut Basket | charge | c | shot=lob uses=few kw=push edge=pierce rune=F
Hunter's Sling Pouch | charge | c | shot=bolt uses=few kw=push edge=crit rune=A
Poison Dart Pouch | charge | c | shot=twin uses=few kw=poison edge=splash rune=E
Herb Bundle | charge | c | shot=burst uses=few kw=mend edge=splash rune=C
Monkey's Fruit Stash | charge | c | shot=lob uses=few kw=drain edge=crit rune=F
Seed Satchel | charge | c | shot=lob uses=many kw=slow edge=crit rune=✱
Hornet Jar | charge | u | shot=bolt kw=poison rune=E
Mushroom Basket | charge | u | shot=lob kw=poison edge=pierce rune=E
Bola Set | charge | u | shot=bolt kw=slow edge=splash rune=A
Gourd of Pine Sap | charge | u | shot=lob kw=slow rune=F
Marsh Leech Pouch | charge | u | shot=bolt kw=drain edge=pierce rune=A
Elven Moonshaft Quiver | charge | r | shot=bolt uses=many kw=- rune=A
Silver Arrow Prize | charge | r | shot=bolt uses=few edge=pierce kw=- rune=E
Annwn Hunting Quiver | charge | r | shot=bolt uses=many kw=drain edge=crit rune=D
Horn of Plenty | charge | l | shot=lob uses=many kw=mend rune=A

Tracker's Instinct | utility | c | util=draw rune=E
Forest Spring | utility | c | util=cleanse rune=F
Squirrel's Cache | utility | c | util=recall rune=A
Snakeroot Remedy | utility | u | util=cleanse rune=F
Ogham Staves | utility | u | util=draw rune=A
Mycelium Network | utility | u | util=copy rune=B
Lyrebird Mimicry | utility | r | util=copy rune=C
Anansi's Bag of Tales | utility | r | util=draw rune=B

Hunter's Net | trap | c | trap=snare kw=- rune=F
Root Tripwire | trap | c | trap=snare kw=push len=short rune=E
Bear Pit | trap | c | trap=spike kw=poison size=three rune=E
Punji Stakes | trap | c | trap=spike kw=slow len=long size=three rune=C
Stinkhorn Patch | trap | c | trap=blast kw=poison len=long size=three rune=B
Pitfall of Thorns | trap | u | trap=spike len=short size=three kw=- rune=A
Deadfall | trap | u | trap=blast kw=mend size=three rune=A
Fairy Ring | trap | u | trap=snare kw=push len=long size=three rune=E
Peat Bog Mire | trap | u | trap=snare kw=slow len=long rune=D
Giant Puffball | trap | u | trap=blast kw=push len=short size=three rune=✱
Strangler Vine Snare | trap | r | trap=snare kw=pull size=three rune=E
Pixie-Led Path | trap | r | trap=snare kw=mend len=short size=three rune=F

Bramble Thicket | environment | c | env=bramble pattern=burst kw=valor rune=B
Tangled Undergrowth | environment | c | env=bramble pattern=row kw=- rune=E
Kudzu Spread | environment | c | env=bramble pattern=cross kw=mend rune=✱
Heather Moor | environment | c | env=bramble pattern=row len=short kw=mend rune=E
Rainforest Canopy | environment | u | env=bramble pattern=cross len=short kw=- rune=D
Mire of the Fens | environment | u | env=bramble pattern=column len=long kw=push rune=A
Stampede | environment | u | env=tremor pattern=row len=long kw=- rune=F
Birnam Wood Marches | environment | r | env=tremor pattern=column kw=- rune=E
Ent Moot | environment | r | env=tremor pattern=burst len=short kw=- rune=E
Primeval Wildwood | environment | l | env=bramble pattern=burst len=long kw=- rune=B

Antlers of the Forest King | piece | l | boon=heal side=siphon timing=delayed kw=- rune=A
Seed of the World Ash | piece | l | boon=regen side=blood timing=delayed kw=- rune=✱
Horn of the Wild Hunt | piece | l | boon=regen side=radiance kw=- rune=E
Pipes of the Goat-Footed | piece | l | boon=regen len=short side=glow kw=- rune=B
Pelt of the Jaguar King | piece | l | boon=heal side=rally kw=- rune=C
Mask of the Green Man | piece | l | boon=heal side=glow timing=echo kw=- rune=F

Elder Ent | summon | r | body=Ent mod=Ancient beh=guards tier=sturdy speed=slow kw=valor trait=rallying rune=A
Jack-in-the-Green | summon | r | body=Ent mod=Mossy beh=shields tier=sturdy speed=steady kw=pull trait=seeds rune=C
Leshy of the Birchwood | summon | r | body=Leshy beh=mends tier=sturdy speed=steady kw=drain trait=thorny rune=A
Kodama | summon | c | body=Kodama beh=diag tier=sturdy speed=slow kw=drain trait=rises rune=A
Oak Dryad | summon | u | body=Fairy mod=Gentle beh=lob tier=sturdy speed=slow kw=pull trait=lifesteal rune=A
Pixie Swarm | summon | c | body=Fairy mod=Tiny beh=twin tier=frail speed=frantic kw=drain trait=camouflage rune=E
Robin Goodfellow | summon | r | body=Fairy mod=Sly beh=shields tier=sturdy speed=steady kw=valor rune=✱
Queen Mab | summon | l | body=Fairy mod=Noble beh=summoner tier=sturdy speed=slow trait=thorny kw=- rune=A
Will-o'-Wisp | summon | c | body=Spirit mod=Pale beh=zigzag tier=frail speed=quick kw=- rune=E
Faun Reveler | summon | c | body=Satyr mod=Lucky beh=cross tier=sturdy speed=slow kw=pull trait=seeds rune=E
Elven Pathfinder | summon | c | body=Elf beh=burrow tier=sturdy speed=steady kw=drain rune=A
Patupaiarehe Mist Folk | summon | u | body=Elf mod=Sly beh=mends tier=sturdy speed=steady kw=valor trait=seeds rune=D
Curupira | summon | r | body=Elf mod=Wild beh=mends tier=sturdy speed=steady kw=pull trait=ambush rune=E
Chullachaqui | summon | u | body=Duende mod=Sly beh=summoner tier=sturdy speed=slow kw=poison trait=rises rune=D
Alux Field Keeper | summon | c | body=Duende mod=Mossy beh=summoner tier=sturdy speed=quick kw=poison rune=E
Grove Druid | summon | c | body=Druid beh=chain tier=sturdy speed=slow kw=pull trait=pack rune=F
Rainforest Curandero | summon | u | body=Druid mod=Wild beh=mends tier=sturdy speed=slow kw=- rune=A
Archdruid of the Oaks | summon | r | body=Druid mod=Ancient beh=chain tier=sturdy speed=slow kw=drain trait=regrows rune=D
Greenwood Outlaw | summon | c | body=Squire mod=Sly beh=summoner tier=sturdy speed=quick kw=drain trait=thorny rune=E
Hooded Outlaw Captain | summon | r | body=Squire mod=Clever beh=mends tier=sturdy speed=steady kw=poison trait=rises rune=A
Mountain Man Trapper | summon | c | body=Squire mod=Scrappy beh=shields tier=sturdy speed=steady kw=mend trait=rallying rune=A
Sir Gawain | summon | r | body=Knight mod=Brave beh=shields tier=sturdy speed=quick kw=pull rune=A
The Green Knight | summon | l | body=Knight mod=Mossy beh=guards tier=tough speed=steady kw=drain trait=pack rune=B
Arthur, the Once King | summon | l | body=Knight mod=Noble beh=shields tier=sturdy speed=steady kw=slow trait=rises rune=E
Gwyn ap Nudd | summon | l | body=Knight mod=Pale beh=mends tier=sturdy speed=steady trait=camouflage kw=- rune=D
Cwn Annwn Hound | summon | u | body=Hound mod=Pale beh=dash tier=sturdy speed=slow trait=tidal kw=- rune=A
Herne the Hunter | summon | l | body=Deer mod=Ancient beh=snipe tier=sturdy speed=steady trait=regrows kw=- rune=F
Tapio, King of the Forest | summon | l | body=Leshy mod=Mossy beh=shields tier=sturdy speed=steady kw=drain trait=lifesteal rune=C
Sasquatch | summon | u | body=Sasquatch beh=trample tier=huge speed=slow kw=poison trait=thorny rune=B
Yowie | summon | u | body=Sasquatch mod=Feral beh=shields tier=sturdy speed=slow kw=poison trait=rallying rune=B
Basajaun | summon | r | body=Sasquatch mod=Noble beh=summoner tier=sturdy speed=steady trait=seeds kw=- rune=C
Kapre Tree Giant | summon | r | body=Sasquatch mod=Old beh=trample tier=huge speed=slow kw=drain trait=regrows rune=F
Orang Pendek | summon | c | body=Ape mod=Tiny beh=mends tier=sturdy speed=steady kw=push trait=lifesteal rune=A
Mapinguari | summon | r | body=Ape mod=Dire beh=beam tier=sturdy speed=steady trait=lifesteal kw=- rune=E
Old Man of the Forest | summon | u | body=Ape mod=Old beh=summoner tier=sturdy speed=slow kw=valor trait=drilled rune=E
Capuchin Thief | summon | c | body=Monkey mod=Clever beh=dash tier=sturdy speed=slow kw=slow trait=thorny rune=A
Monkey King's Vanguard | summon | u | body=Monkey mod=Brave beh=taunt tier=tough speed=steady kw=pull rune=E
Tanuki Drummer | summon | c | body=Tanuki mod=Lucky beh=empower tier=sturdy speed=slow kw=drain trait=rallying rune=E
Grizzly Matriarch | summon | u | body=Bear mod=Dire beh=summoner tier=sturdy speed=slow kw=mend rune=A
Otso the Honey-Paw | summon | r | body=Bear mod=Ancient beh=mends tier=sturdy speed=steady kw=mend trait=pack rune=A
Bull Moose | summon | u | body=Moose beh=trample tier=tough speed=steady kw=drain trait=camouflage rune=A
Dappled Fawn | summon | c | body=Deer mod=Gentle beh=mends tier=sturdy speed=slow kw=pull trait=rallying rune=E
Balam Jaguar Knight | summon | r | body=Panther mod=Noble beh=taunt tier=tough speed=steady kw=poison trait=drilled rune=D
Clouded Leopard | summon | c | body=Panther mod=Swift beh=pounce tier=sturdy speed=steady trait=thorny kw=- rune=E
Sundarbans Tiger | summon | r | body=Tiger mod=Dire beh=pounce tier=sturdy speed=steady kw=poison trait=pack rune=E
Horangi Mountain Tiger | summon | u | body=Tiger mod=Old beh=dash tier=sturdy speed=steady kw=drain trait=pack rune=E
Greenwood Wolf Pack | summon | c | body=Wolf mod=Wild beh=pounce tier=sturdy speed=steady kw=push trait=tidal rune=A
Wild Tusker Boar | summon | c | body=Boar beh=trample tier=tough speed=steady kw=poison trait=rises rune=E
Twrch Trwyth | summon | l | body=Boar mod=Dire beh=summoner tier=sturdy speed=steady kw=poison trait=ambush rune=D
Komodo Monitor | summon | r | body=Lizard mod=Dire beh=pounce tier=tough speed=steady kw=drain trait=tidal rune=A
Fer-de-Lance | summon | c | body=Serpent mod=Swift beh=burrow tier=sturdy speed=steady kw=valor trait=thorny rune=A
Green Anaconda | summon | r | body=Serpent mod=Dire beh=blast tier=sturdy speed=slow kw=poison trait=camouflage rune=A
Poison Dart Frog | summon | c | body=Toad mod=Tiny beh=summoner tier=sturdy speed=quick trait=lifesteal kw=- rune=E
Army Ant Soldier | summon | c | body=Ant mod=Hungry beh=taunt tier=tough speed=slow kw=poison trait=ambush rune=D
Giant Forest Hornet | summon | c | body=Hornet beh=barrage tier=frail speed=frantic kw=drain trait=drilled rune=E
Sporeling Thallid | summon | c | body=Mushroom beh=blast tier=sturdy speed=steady kw=mend trait=thorny rune=F
Thallid Germinator | summon | u | body=Mushroom beh=blast tier=sturdy speed=slow kw=slow trait=seeds rune=A
Fungal Thallid Brute | summon | r | body=Mushroom mod=Dire beh=pounce tier=tough speed=steady kw=slow trait=seeds rune=A
Moss-Shelled Tortoise | summon | c | body=Tortoise mod=Mossy beh=wardmaker tier=tough speed=slow trait=rises kw=- rune=E
Galapagos Giant Tortoise | summon | r | body=Tortoise mod=Ancient beh=trample tier=huge speed=slow kw=pull trait=rallying rune=E
Resplendent Quetzal | summon | u | body=Quetzal beh=guards tier=sturdy speed=slow kw=poison trait=tidal rune=D
Mokele-mbembe | summon | l | body=Sauropod beh=shields tier=sturdy speed=steady kw=poison trait=tidal rune=A

Hunter's Crossbow Rig | machine | c | mach=Crossbow beh=bolt tier=sturdy speed=steady kw=poison rune=F
Sharpened Log Palisade | machine | c | mach=Palisade beh=wardmaker tier=huge speed=slow kw=poison rune=E
Sapling Catapult | machine | u | mach=Catapult beh=lob tier=sturdy speed=slow trait=pack kw=- rune=B
Treehouse Lookout | machine | u | mach=Tower beh=summoner tier=sturdy speed=slow kw=pull trait=regrows rune=E
`,

/* ---------------- Gray · the normal type ----------------
   Creatures that fit any color: suits of armor, golems and guardians, hunters and beasts of
   burden, household spirits and familiars, and the mythical heroes of every culture.
   Gray never has a weakness. Veteran: a Gray creature gets +10% each turn it survives.
   Guardian: Gray guardians step in front of hits aimed at you. Legend: a Gray hero makes your
   other Gray creatures stronger while it stands. */
gray:`
Living Armor | summon | c | body=Armor beh=guards tier=tough speed=steady kw=pull stance=front rune=B
Empty Helm Sentinel | summon | c | body=Armor beh=taunt tier=tough speed=quick stance=rear kw=- rune=B
Haunted Plate | summon | u | body=Armor mod=Grim beh=chain tier=sturdy speed=slow trait=static stance=escort kw=- rune=A
Rusted Suit of Armor | summon | c | body=Armor mod=Old beh=guards tier=tough speed=steady kw=curse trait=loyal stance=front rune=B
Gilded Parade Armor | summon | u | body=Armor mod=Noble beh=guards tier=tough speed=slow trait=loyal stance=rear kw=- rune=C
Black Knight's Armor | summon | r | body=Armor mod=Dire beh=guards tier=tough speed=steady trait=steadfast stance=front kw=- rune=B
Tin Soldier | summon | c | body=Squire mod=Tiny beh=taunt tier=tough speed=steady trait=chilling stance=rear kw=- rune=B
Toy Knight | summon | c | body=Knight mod=Tiny beh=guards tier=tough speed=steady kw=slow trait=overcharge stance=front rune=B
Clay Golem of Prague | summon | r | body=Golem beh=guards tier=tough speed=slow trait=overcharge stance=front kw=- rune=C
Mud Golem | summon | c | body=Golem mod=Mossy beh=bolt tier=tough speed=slow trait=laststand stance=front kw=- rune=E
Stone Golem | summon | c | body=Golem mod=Stone beh=bolt tier=tough speed=slow kw=push stance=escort rune=D
Iron Golem | summon | u | body=Golem mod=Iron beh=guards tier=tough speed=slow trait=drilled stance=escort kw=- rune=C
Talos, the Bronze Giant | summon | l | body=Golem mod=Iron legend=1 beh=trample tier=huge speed=slow trait=chilling stance=front kw=- rune=B
Cathedral Gargoyle | summon | c | body=Gargoyle beh=dash tier=sturdy speed=steady kw=curse trait=static stance=front rune=C
Grotesque | summon | c | body=Gargoyle mod=Grim beh=blast tier=sturdy speed=slow kw=stun stance=rear rune=B
Waterspout Gargoyle | summon | u | body=Gargoyle mod=Old beh=barrage tier=sturdy speed=slow kw=freeze trait=drilled stance=rear rune=B
Shisa | summon | c | body=Shishi beh=barrage tier=sturdy speed=slow trait=veteran stance=front kw=- rune=C
Komainu | summon | u | body=Shishi mod=Stone beh=pierce tier=sturdy speed=steady stance=escort kw=- rune=C
Guardian Lion of the Gate | summon | r | body=Shishi mod=Noble beh=pounce tier=tough speed=slow trait=static stance=front kw=- rune=B
Nio Temple Guardian | summon | r | body=Oni mod=Stone beh=guards tier=tough speed=steady stance=escort kw=- trait=laststand rune=F
Dvarapala | summon | u | body=Hero mod=Stone beh=barrage tier=sturdy speed=steady trait=laststand stance=front kw=- rune=A
Moai Watcher | summon | r | body=Golem mod=Ancient beh=bolt tier=tough speed=slow trait=loyal stance=escort kw=- rune=D
Terracotta Spearman | summon | c | body=Squire mod=Stone beh=guards tier=tough speed=slow kw=slow trait=chilling stance=front rune=B
Terracotta General | summon | r | body=Knight mod=Stone beh=bolt tier=tough speed=slow trait=veteran stance=rear kw=- rune=D
Ushabti Servant | summon | c | body=Squire mod=Tiny beh=wardmaker tier=sturdy speed=steady kw=pull trait=static stance=front rune=C
Scarecrow Sentinel | summon | c | body=Squire mod=Scrappy beh=taunt tier=tough speed=quick kw=stun stance=front rune=B
Shield Maiden | summon | u | body=Heroine beh=guards tier=tough speed=quick trait=overcharge stance=rear kw=- rune=C
Hoplite | summon | c | body=Knight beh=taunt tier=tough speed=quick trait=overcharge stance=escort kw=- rune=B
Roman Centurion | summon | u | body=Knight mod=Brave beh=taunt tier=tough speed=steady trait=veteran stance=front kw=- rune=C
Gatehouse Sergeant | summon | c | body=Squire beh=wardmaker tier=huge speed=slow trait=veteran stance=front kw=- rune=A
Castle Warden | summon | u | body=Knight mod=Old beh=guards tier=tough speed=steady stance=rear kw=- rune=C
Watchtower Guard | summon | c | body=Squire mod=Loyal beh=guards tier=tough speed=frantic stance=front kw=- rune=C
Loyal Mastiff | summon | c | body=Hound mod=Loyal beh=pierce tier=sturdy speed=steady kw=freeze trait=chilling stance=escort rune=B
Kangal Shepherd Dog | summon | u | body=Hound mod=Brave beh=dash tier=sturdy speed=steady trait=chilling stance=rear kw=- rune=C
Old Gray Bear | summon | u | body=Bear mod=Old beh=pounce tier=tough speed=steady trait=tidal stance=front kw=- rune=B
Cave Bear | summon | c | body=Bear beh=pounce tier=tough speed=steady kw=freeze stance=front rune=E
Wild Boar | summon | c | body=Boar mod=Wild beh=trample tier=tough speed=steady kw=push trait=drilled stance=front rune=C
Great Tortoise | summon | u | body=Tortoise mod=Ancient beh=wardmaker tier=tough speed=slow trait=steadfast stance=front kw=- rune=C
Snapping Turtle | summon | c | body=Turtle mod=Hungry beh=wardmaker tier=tough speed=slow kw=pull stance=front rune=B
Armadillo Knight | summon | u | body=Beetle mod=Brave beh=taunt tier=tough speed=slow stance=front kw=- trait=loyal rune=C
Ironback Beetle | summon | c | body=Beetle mod=Iron beh=wardmaker tier=tough speed=slow trait=static stance=escort kw=- rune=C
Mimic Chest | summon | u | body=Mimic beh=barrage tier=sturdy speed=frantic trait=veteran stance=rear kw=- rune=B
War Elephant | summon | r | body=Elephant beh=trample tier=tough speed=steady trait=laststand stance=front kw=- rune=C
Ox of the Plough | summon | c | body=Bull mod=Gentle beh=trample tier=tough speed=steady kw=slow stance=front rune=B
Aurochs | summon | u | body=Bull mod=Ancient beh=trample tier=tough speed=steady trait=loyal stance=rear kw=- rune=C
Wandering Ronin | summon | u | body=Hero mod=Scrappy beh=pounce tier=tough speed=steady trait=veteran stance=escort kw=- rune=✱
Bridge Troll | summon | u | body=Ogre mod=Mossy beh=taunt tier=tough speed=quick trait=drilled stance=front kw=- rune=E
Ettin | summon | r | body=Ogre mod=Dire beh=trample tier=huge speed=slow kw=slow trait=drilled stance=front rune=B

Longbow Yeoman | summon | c | body=Hero beh=pierce tier=sturdy speed=steady trait=static stance=front kw=- rune=C
Village Archer | summon | c | body=Squire beh=pierce tier=sturdy speed=steady kw=pull trait=steadfast stance=escort rune=✱
Shepherd Slinger | summon | c | body=Squire mod=Swift beh=snipe tier=sturdy speed=slow kw=stun trait=drilled stance=rear rune=F
Scythian Horse Archer | summon | u | body=Centaur beh=snipe tier=sturdy speed=steady trait=steadfast stance=rear kw=- rune=C
Steppe Rider | summon | u | body=Horse mod=Swift beh=empower tier=sturdy speed=steady trait=laststand stance=escort kw=- rune=D
Amazon Archer | summon | u | body=Heroine beh=snipe tier=sturdy speed=quick trait=overcharge stance=rear kw=- rune=C
Mounted Bowman | summon | c | body=Horse beh=pierce tier=sturdy speed=steady trait=veteran stance=rear kw=- rune=B
Javelin Thrower | summon | c | body=Hero mod=Swift beh=lob tier=sturdy speed=frantic stance=rear kw=- rune=A
Spear Hunter | summon | c | body=Hero mod=Wild beh=snipe tier=sturdy speed=steady kw=slow trait=static stance=rear rune=B
Woodcutter | summon | c | body=Squire mod=Old beh=zigzag tier=sturdy speed=quick trait=drilled stance=escort kw=- rune=C
Bounty Hunter | summon | u | body=Hero mod=Sly beh=snipe tier=sturdy speed=steady kw=push trait=laststand stance=rear rune=B
Wandering Ranger | summon | u | body=Heroine mod=Swift beh=snipe tier=sturdy speed=steady kw=pull stance=rear rune=B
Tracker | summon | c | body=Hero mod=Clever beh=blast tier=sturdy speed=steady kw=stun trait=tidal stance=rear rune=B
Falconer | summon | u | body=Hero mod=Noble beh=diag tier=sturdy speed=steady trait=loyal stance=escort kw=- rune=✱
Hunting Falcon | summon | c | body=Hawk mod=Swift beh=diag tier=sturdy speed=steady kw=pull stance=escort rune=E
Peregrine | summon | c | body=Hawk beh=burrow tier=sturdy speed=steady kw=pull trait=chilling stance=escort rune=B
Kestrel | summon | c | body=Hawk mod=Tiny beh=beam tier=sturdy speed=steady trait=drilled stance=rear kw=- rune=C
Osprey | summon | c | body=Hawk mod=Hungry beh=blast tier=sturdy speed=steady kw=freeze stance=rear rune=F
Golden Eagle | summon | u | body=Hawk mod=Noble beh=diag tier=sturdy speed=steady trait=overcharge stance=front kw=- rune=A
Messenger Pigeon | summon | c | body=Hawk mod=Gentle beh=chain tier=sturdy speed=quick trait=steadfast stance=escort kw=- rune=D
Night Owl Scout | summon | c | body=Owl beh=diag tier=sturdy speed=steady kw=stun trait=steadfast stance=escort rune=C
Horned Owl | summon | u | body=Owl mod=Grim beh=snipe tier=sturdy speed=quick trait=static stance=escort kw=- rune=C
Quill Porcupine | summon | c | body=Boar mod=Scrappy beh=lob tier=sturdy speed=slow kw=pull trait=tidal stance=rear rune=B
Spiny Hedgehog | summon | c | body=Mole mod=Scrappy beh=chain tier=sturdy speed=steady kw=pull stance=front rune=C
Spitting Llama | summon | c | body=Camel mod=Sly beh=burrow tier=sturdy speed=steady kw=freeze stance=escort rune=C
Bactrian Camel | summon | u | body=Camel mod=Old beh=wardmaker tier=sturdy speed=steady kw=curse trait=loyal stance=front rune=C
Gray Fox | summon | c | body=Fox mod=Sly beh=dash tier=tough speed=steady stance=front kw=- trait=drilled rune=B
Plains Wolf | summon | c | body=Wolf beh=dash tier=sturdy speed=steady kw=freeze trait=steadfast stance=front rune=E
Lone Wolf | summon | u | body=Wolf mod=Scrappy beh=dash tier=sturdy speed=quick stance=front kw=- trait=veteran rune=C
Alpha Wolf | summon | r | body=Wolf mod=Dire beh=dash tier=sturdy speed=steady stance=front kw=- rune=A
Hunting Hound | summon | c | body=Hound beh=pounce tier=sturdy speed=steady kw=slow stance=front rune=C
Alley Cat | summon | c | body=Cat mod=Scrappy beh=dash tier=sturdy speed=steady kw=slow trait=overcharge stance=front rune=B
Lynx | summon | u | body=Cat mod=Wild beh=dash tier=sturdy speed=steady kw=pull trait=chilling stance=front rune=B
Wildcat | summon | c | body=Cat mod=Feral beh=cross tier=sturdy speed=steady kw=pull trait=chilling stance=rear rune=F
Sea Eagle | summon | u | body=Hawk mod=Dire beh=diag tier=sturdy speed=steady kw=push trait=tidal stance=escort rune=A
Mountain Goat | summon | c | body=Stag mod=Scrappy beh=burrow tier=sturdy speed=frantic stance=escort kw=- rune=B
Ibex | summon | u | body=Stag mod=Wild beh=lob tier=sturdy speed=quick kw=curse trait=laststand stance=rear rune=C
Hippogriff | summon | u | body=Hippogriff beh=twin tier=sturdy speed=quick trait=drilled stance=rear kw=- rune=B
Hippogriff Rider | summon | r | body=Hippogriff mod=Noble beh=taunt tier=sturdy speed=steady stance=rear kw=- rune=B
War Griffin | summon | r | body=Griffin mod=Brave beh=wardmaker tier=sturdy speed=steady kw=slow trait=tidal stance=front rune=C
Royal Griffin | summon | l | body=Griffin mod=Noble beh=lob tier=sturdy speed=steady kw=freeze trait=laststand stance=rear rune=✱
Sleipnir, the Eight-Legged Steed | summon | l | body=Horse mod=Swift beh=barrage tier=sturdy speed=steady trait=static stance=rear kw=- rune=E
Arion, the Swift Horse | summon | r | body=Horse mod=Swift beh=blast tier=sturdy speed=steady trait=steadfast stance=escort kw=- rune=D
Bayard, the Magic Bay | summon | r | body=Horse mod=Lucky beh=cross tier=sturdy speed=steady kw=curse trait=veteran stance=rear rune=C
Uchchaihshravas | summon | l | body=Pegasus mod=Noble beh=guards tier=sturdy speed=quick trait=laststand stance=front kw=- rune=B
Wandering Bard | summon | c | body=Hero mod=Gentle beh=empower tier=sturdy speed=slow kw=push trait=static stance=escort rune=C
Crossbow Militia | summon | c | body=Squire mod=Brave beh=bolt tier=sturdy speed=quick trait=loyal stance=escort kw=- rune=B
Pikeman | summon | c | body=Knight beh=cross tier=sturdy speed=steady kw=push trait=overcharge stance=rear rune=A
Sellsword | summon | u | body=Hero mod=Scrappy beh=blast tier=sturdy speed=steady kw=push trait=steadfast stance=rear rune=C
Veteran Captain | summon | r | body=Knight mod=Old beh=cone tier=sturdy speed=frantic kw=- rune=A trait=veteran stance=escort
Errant Knight | summon | u | body=Knight mod=Brave beh=guards tier=tough speed=slow kw=stun trait=steadfast stance=front rune=C
Cossack Rider | summon | u | body=Horse mod=Brave beh=taunt tier=sturdy speed=slow trait=steadfast stance=rear kw=- rune=C
Gaucho with Bolas | summon | u | body=Hero mod=Wild beh=cross tier=sturdy speed=steady kw=stun trait=drilled stance=rear rune=B
Mongol Outrider | summon | r | body=Horse mod=Dire beh=barrage tier=sturdy speed=steady trait=drilled stance=escort kw=- rune=B
Maasai Spearman | summon | u | body=Hero mod=Brave beh=guards tier=tough speed=quick stance=escort kw=- rune=B
Zulu Impi | summon | u | body=Hero mod=Swift beh=zigzag tier=frail speed=quick trait=laststand stance=escort kw=- rune=A
Viking Raider | summon | c | body=Hero mod=Feral beh=cross tier=sturdy speed=frantic trait=drilled stance=rear kw=- rune=F

Hill Giant | summon | u | body=Ogre beh=lob tier=huge speed=slow trait=tidal stance=rear kw=- rune=C
Rock-Throwing Cyclops | summon | r | body=Ogre mod=Dire beh=trample tier=huge speed=slow trait=loyal stance=escort kw=- rune=C
Stone Troll | summon | u | body=Ogre mod=Stone beh=pounce tier=tough speed=slow trait=overcharge stance=escort kw=- rune=B
Ogre Brute | summon | c | body=Ogre beh=lob tier=huge speed=slow stance=escort kw=- rune=D
Mountain Gorilla | summon | u | body=Ape beh=pounce tier=tough speed=slow stance=rear kw=- rune=B
Sling Monkey | summon | c | body=Monkey mod=Sly beh=shields tier=sturdy speed=slow kw=stun trait=static stance=escort rune=C
Howler Monkey | summon | c | body=Monkey mod=Wild beh=snipe tier=sturdy speed=slow trait=veteran stance=rear kw=- rune=D
Coconut Crab | summon | c | body=Crab beh=wardmaker tier=tough speed=slow trait=overcharge stance=rear kw=- rune=E
Boulder Golem | summon | u | body=Golem mod=Stone beh=bolt tier=tough speed=slow kw=stun trait=veteran stance=escort rune=C
Pebble Golem | summon | c | body=Golem mod=Tiny beh=bolt tier=tough speed=steady stance=escort kw=- rune=A
Rock Elemental | summon | r | body=Golem mod=Ancient beh=cross tier=sturdy speed=slow trait=loyal stance=rear kw=- rune=B
Siege Ogre | summon | r | body=Ogre mod=Iron beh=blast tier=huge speed=slow trait=steadfast stance=rear kw=- rune=C
Two-Headed Giant | summon | r | body=Ogre mod=Grim beh=trample tier=huge speed=slow trait=veteran stance=rear kw=- rune=D
Jotun Hurler | summon | r | body=Ogre mod=Ancient beh=lob tier=sturdy speed=slow trait=laststand stance=rear kw=- rune=E
Fomorian Brute | summon | u | body=Ogre mod=Feral beh=pounce tier=tough speed=slow kw=push trait=tidal stance=front rune=C
Oni Pebble-Tosser | summon | c | body=Oni mod=Tiny beh=pounce tier=tough speed=steady trait=laststand stance=rear kw=- rune=B
Gremlin Pot-Thrower | summon | c | body=Gremlin mod=Scrappy beh=blast tier=frail speed=slow stance=rear kw=- rune=C
Kobold Sapper | summon | c | body=Goblin mod=Clever beh=beam tier=sturdy speed=quick stance=rear kw=- rune=B
Hobgoblin Grenadier | summon | u | body=Goblin mod=Brave beh=blast tier=sturdy speed=slow trait=loyal stance=front kw=- rune=B
Barrel-Rolling Dwarf | summon | u | body=Dwarf mod=Lucky beh=blast tier=sturdy speed=slow kw=slow trait=chilling stance=rear rune=D
Village Brawler | summon | c | body=Hero mod=Scrappy beh=cross tier=sturdy speed=steady kw=slow stance=rear rune=C
Tavern Bouncer | summon | c | body=Ogre mod=Gentle beh=barrage tier=sturdy speed=steady kw=curse stance=rear rune=F
Mole Sapper | summon | c | body=Mole mod=Clever beh=burrow tier=sturdy speed=slow trait=tidal stance=escort kw=- rune=A
Badger | summon | c | body=Mole mod=Feral beh=summoner tier=sturdy speed=steady trait=overcharge stance=rear kw=- rune=B
Rampaging Rhino | summon | u | body=Bull mod=Dire beh=trample tier=tough speed=steady trait=static stance=escort kw=- rune=B
Charging Bison | summon | c | body=Bull mod=Wild beh=trample tier=tough speed=slow stance=front kw=- rune=C
Woolly Mammoth | summon | r | body=Elephant mod=Ancient beh=zigzag tier=tough speed=quick trait=chilling stance=escort kw=- rune=F
Elephant Bird | summon | u | body=Roc mod=Tiny beh=trample tier=tough speed=quick trait=tidal stance=front kw=- rune=C
Stone-Dropping Vulture | summon | c | body=Crow mod=Hungry beh=summoner tier=sturdy speed=quick stance=escort kw=- trait=laststand rune=B
Thunder Ram | summon | u | body=Bull mod=Brave beh=chain tier=tough speed=slow trait=laststand stance=rear kw=- rune=B

Familiar Cat | summon | c | body=Cat mod=Gentle beh=dash tier=sturdy speed=slow trait=tidal stance=front kw=- rune=D
Tabby Familiar | summon | c | body=Cat mod=Lucky beh=mends tier=sturdy speed=steady kw=stun stance=escort rune=B
Owl Familiar | summon | c | body=Owl mod=Clever beh=diag tier=sturdy speed=slow trait=laststand stance=escort kw=- rune=F
Toad Familiar | summon | c | body=Toad mod=Gentle beh=shields tier=sturdy speed=slow stance=front kw=- rune=B
Raven Familiar | summon | u | body=Crow mod=Clever beh=mends tier=sturdy speed=slow kw=- rune=C trait=drilled stance=rear
Brownie | summon | c | body=Duende mod=Gentle beh=barrage tier=sturdy speed=slow kw=push stance=rear rune=B
Domovoi | summon | u | body=Duende mod=Old beh=taunt tier=sturdy speed=slow kw=pull trait=overcharge stance=front rune=C
Tomte | summon | c | body=Duende mod=Ancient beh=blast tier=sturdy speed=slow kw=curse trait=veteran stance=rear rune=F
Hob of the Hearth | summon | c | body=Duende mod=Mossy beh=cone tier=sturdy speed=steady kw=push trait=loyal stance=escort rune=E
Zashiki-warashi | summon | u | body=Kodama mod=Lucky beh=shields tier=sturdy speed=slow trait=chilling stance=escort kw=- rune=D
Lares of the Home | summon | u | body=Spirit mod=Gentle beh=taunt tier=sturdy speed=steady kw=curse stance=front rune=C
Household Kobold | summon | c | body=Goblin mod=Gentle beh=wardmaker tier=sturdy speed=slow kw=slow trait=steadfast stance=front rune=B
Village Healer | summon | c | body=Heroine mod=Gentle beh=empower tier=sturdy speed=slow trait=veteran stance=escort kw=- rune=✱
Wise Woman | summon | u | body=Heroine mod=Old beh=cross tier=sturdy speed=slow trait=steadfast stance=escort kw=- rune=C
Field Surgeon | summon | u | body=Hero mod=Clever beh=diag tier=sturdy speed=slow trait=static stance=rear kw=- rune=C
Herbwife | summon | c | body=Heroine mod=Mossy beh=chain tier=sturdy speed=slow stance=front kw=- trait=laststand rune=A
Midwife | summon | c | body=Heroine mod=Gentle beh=blast tier=sturdy speed=quick trait=overcharge stance=escort kw=- rune=B
Saint Bernard | summon | u | body=Hound mod=Gentle beh=mends tier=sturdy speed=quick stance=escort kw=- rune=C
Therapy Pony | summon | c | body=Horse mod=Tiny beh=empower tier=sturdy speed=quick trait=tidal stance=escort kw=- rune=B
Faithful Donkey | summon | c | body=Horse mod=Loyal beh=twin tier=sturdy speed=slow trait=loyal stance=escort kw=- rune=C
Milk Cow | summon | c | body=Bull mod=Gentle beh=cross tier=sturdy speed=slow kw=curse stance=rear rune=D
Mother Hen | summon | c | body=Crane mod=Tiny beh=summoner tier=frail speed=quick stance=rear kw=- rune=C
Honeybadger | summon | u | body=Mole mod=Brave beh=wardmaker tier=sturdy speed=slow kw=freeze trait=loyal stance=front rune=B
Sacred Ibis | summon | u | body=Crane mod=Noble beh=lob tier=sturdy speed=quick trait=static stance=front kw=- rune=E
Beaver Builder | summon | c | body=Rat mod=Clever beh=lob tier=sturdy speed=slow kw=slow stance=rear rune=C
Capybara | summon | c | body=Rat mod=Gentle beh=cone tier=sturdy speed=quick stance=front kw=- rune=D
Wandering Monk | summon | u | body=Hero mod=Gentle beh=mends tier=sturdy speed=steady trait=tidal stance=escort kw=- rune=B
Pilgrim | summon | c | body=Hero mod=Old beh=barrage tier=sturdy speed=slow kw=freeze stance=escort rune=F
Tea Master | summon | r | body=Hero mod=Clever beh=blast tier=sturdy speed=slow trait=overcharge stance=rear kw=- rune=C
Camp Cook | summon | c | body=Ogre mod=Gentle beh=lob tier=sturdy speed=slow trait=steadfast stance=front kw=- rune=B

Beowulf | summon | l | body=Hero mod=Brave legend=1 beh=lob tier=sturdy speed=steady trait=loyal stance=rear kw=- rune=C
Gilgamesh | summon | l | body=Hero mod=Noble legend=1 beh=guards tier=sturdy speed=slow trait=static stance=front kw=- rune=D
Enkidu | summon | r | body=Ape mod=Wild legend=1 beh=blast tier=sturdy speed=steady trait=drilled stance=front kw=- rune=C
Hua Mulan | summon | l | body=Heroine mod=Brave legend=1 beh=lob tier=sturdy speed=steady trait=overcharge stance=escort kw=- rune=B
Cu Chulainn | summon | l | body=Hero mod=Feral legend=1 beh=blast tier=sturdy speed=steady trait=laststand stance=rear kw=- rune=D
Sundiata Keita | summon | l | body=Hero mod=Noble legend=1 beh=wardmaker tier=sturdy speed=steady trait=steadfast stance=front kw=- rune=C
Momotaro | summon | r | body=Hero mod=Lucky legend=1 beh=wardmaker tier=sturdy speed=frantic kw=- rune=B trait=veteran stance=front
Atalanta | summon | r | body=Heroine mod=Swift legend=1 beh=lob tier=sturdy speed=steady trait=tidal stance=front kw=- rune=C
Heracles | summon | l | body=Hero mod=Brave legend=1 beh=taunt tier=sturdy speed=slow trait=drilled stance=front kw=- rune=F
Perseus | summon | r | body=Hero mod=Clever legend=1 beh=wardmaker tier=sturdy speed=slow stance=escort kw=- rune=A
Theseus | summon | r | body=Hero mod=Brave legend=1 beh=cross tier=sturdy speed=steady trait=static stance=escort kw=- rune=D
Achilles | summon | l | body=Hero mod=Swift legend=1 beh=taunt tier=sturdy speed=quick kw=- rune=E trait=steadfast stance=front
Hector of Troy | summon | r | body=Knight mod=Noble legend=1 beh=taunt tier=sturdy speed=steady trait=chilling stance=escort kw=- rune=F
Rostam | summon | l | body=Hero mod=Brave legend=1 beh=cross tier=sturdy speed=steady trait=tidal stance=rear kw=- rune=A
Arjuna | summon | l | body=Hero mod=Noble legend=1 beh=wardmaker tier=sturdy speed=steady trait=veteran stance=escort kw=- rune=C
Sigurd | summon | r | body=Hero mod=Brave legend=1 beh=cross tier=sturdy speed=steady trait=loyal stance=front kw=- rune=B
Ilya Muromets | summon | r | body=Hero mod=Old legend=1 beh=cross tier=sturdy speed=slow trait=overcharge stance=front kw=- rune=C
Lancelot | summon | r | body=Knight mod=Noble legend=1 beh=barrage tier=sturdy speed=steady kw=slow trait=veteran stance=rear rune=C
Gawain | summon | r | body=Knight mod=Brave legend=1 beh=guards tier=sturdy speed=steady trait=chilling stance=front kw=- rune=A
El Cid | summon | r | body=Knight mod=Noble legend=1 beh=barrage tier=sturdy speed=steady kw=freeze trait=tidal stance=rear rune=B
Roland | summon | r | body=Knight mod=Brave legend=1 beh=taunt tier=sturdy speed=slow trait=overcharge stance=escort kw=- rune=E
Robin Hood | summon | r | body=Hero mod=Sly legend=1 beh=taunt tier=sturdy speed=steady kw=pull trait=laststand stance=front rune=✱
Mwindo | summon | r | body=Hero mod=Lucky legend=1 beh=blast tier=sturdy speed=slow trait=drilled stance=escort kw=- rune=C
Kintaro | summon | r | body=Hero mod=Tiny legend=1 beh=lob tier=sturdy speed=quick trait=steadfast stance=rear kw=- rune=F
Fionn mac Cumhaill | summon | r | body=Hero mod=Clever legend=1 beh=lob tier=sturdy speed=quick trait=chilling stance=escort kw=- rune=B
Scathach | summon | l | body=Heroine mod=Grim legend=1 beh=pounce tier=sturdy speed=steady trait=veteran stance=front kw=- rune=C
Tomoe Gozen | summon | r | body=Heroine mod=Brave legend=1 beh=barrage tier=sturdy speed=quick stance=rear kw=- trait=loyal rune=C
Antarah the Poet-Knight | summon | r | body=Hero mod=Noble legend=1 beh=guards tier=tough speed=quick trait=static stance=front kw=- rune=E
Hunahpu and Xbalanque | summon | l | body=Hero mod=Lucky legend=1 beh=wardmaker tier=sturdy speed=slow trait=chilling stance=front kw=- rune=F
Glooscap | summon | l | body=Hero mod=Ancient legend=1 beh=barrage tier=sturdy speed=slow trait=tidal stance=rear kw=- rune=A

Shield Wall | ward | c | form=shield len=short kw=- rune=F
Phalanx | ward | u | form=rampart build=heavy wfx=thorns kw=- rune=C
Testudo | ward | u | form=shield build=heavy wfx=shocking kw=- rune=B
Schiltron | ward | r | form=corridor build=heavy wfx=thorns len=short kw=- rune=C
Hedge of Spears | ward | c | form=rampart wfx=thorns len=short kw=- rune=B
Wagon Circle | ward | c | form=arc build=heavy len=short kw=- rune=E
Shield Brace | ward | c | form=shield build=light wfx=shocking len=long kw=- rune=C
Hold the Gate | ward | u | form=corridor wfx=shocking len=short kw=- rune=E
Last Stand | ward | r | form=shield build=heavy len=long kw=- rune=D
Iron Ring Fort | ward | l | form=arc build=heavy wfx=shocking len=long kw=- rune=F

Battle Cry | boon | c | boon=courage side=jolt timing=echo kw=- rune=B
Rallying Horn | boon | c | boon=courage len=long side=muster kw=- rune=E
Haka War Dance | boon | u | boon=power side=chill kw=- rune=C
Kiai Shout | boon | c | boon=power len=short side=chill timing=delayed kw=- rune=A
Oath of Brotherhood | boon | u | boon=courage len=long side=jolt timing=delayed kw=- rune=F
Hunter's Focus | boon | c | boon=haste side=chill timing=delayed kw=- rune=C
Stubborn Will | boon | u | boon=dodge side=chill timing=echo kw=- rune=B
Campfire Rest | boon | c | boon=heal side=jolt kw=- rune=E
Trusty Steed | boon | u | boon=haste len=long side=chill kw=- rune=✱
Song of the Old Heroes | boon | r | boon=courage len=short side=jolt kw=- rune=B

Sling Stones | charge | c | shot=burst uses=few kw=- rune=✱
Hunter's Quiver | charge | c | shot=twin uses=many edge=splash kw=- rune=C
Bag of Rocks | charge | c | shot=lob uses=few edge=splash kw=- rune=B
Throwing Axes | charge | u | shot=bolt edge=splash kw=- rune=A
Javelin Bundle | charge | u | shot=bolt uses=few edge=crit kw=- rune=F
Caltrop Pouch | charge | c | shot=lob uses=few kw=slow rune=B
Boomerang Belt | charge | u | shot=lob uses=many edge=crit kw=- rune=D
Bundle of Darts | charge | c | shot=twin uses=few edge=pierce kw=- rune=C
Hurling Stones | charge | r | shot=lob uses=many kw=push rune=B
Legendary Quiver | charge | l | shot=bolt uses=many kw=- rune=✱
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
Dwarven Cannon Nest | machine | c | mach=Cannon race=dwarf beh=twin tier=sturdy speed=steady trait=sandstorm kw=- rune=D
Steam Cannon | machine | u | mach=Cannon race=dwarf beh=bolt tier=sturdy speed=quick trait=rallying kw=- rune=A
Dwarven Runic Battery | machine | l | mach=Tower race=dwarf beh=zigzag tier=frail speed=quick trait=racetech kw=- rune=F
Gnomish Arc Turret | machine | u | mach=Tower race=gnome beh=pierce tier=sturdy speed=steady kw=push trait=chilling rune=A
Clockwork Owl | machine | c | mach=Drone race=gnome beh=diag tier=tough speed=slow trait=chilling kw=- rune=F
Elven Moonbow Ballista | machine | u | mach=Ballista race=elf beh=snipe tier=sturdy speed=quick trait=chilling kw=- rune=C
Elven Starglass Spire | sentry | r | mach=Tower race=elf beh=mends tier=sturdy speed=steady trait=chilling kw=- rune=B
Goblin Junk Cannon | machine | c | mach=Cannon race=goblin beh=bolt tier=sturdy speed=steady kw=mend trait=chilling rune=A
Harbor Ballista | machine | c | mach=Ballista race=sea beh=snipe tier=sturdy speed=steady trait=lifesteal kw=- rune=F
Lighthouse Lens Beam | machine | r | mach=Tower race=sea beh=mends tier=sturdy speed=steady kw=push trait=tidal rune=D
Sky-Ship Deck Gun | machine | r | mach=Cannon race=sky beh=bolt tier=sturdy speed=steady kw=push trait=rallying rune=E
Djinn Brass Idol | machine | r | mach=Tower race=djinn beh=empower tier=sturdy speed=slow trait=tidal kw=- rune=B
Troll Bone Ballista | machine | c | mach=Ballista race=troll beh=snipe tier=tough speed=steady trait=chilling kw=- rune=C
Alchemist's Fire Siphon | machine | u | mach=Cannon race=alchemy beh=mends tier=sturdy speed=quick trait=tidal kw=- rune=B
Brass Crossbow Turret | machine | c | mach=Crossbow race=human beh=snipe tier=sturdy speed=steady kw=mend trait=rallying rune=C
Antikythera Sentinel | machine | l | mach=Automaton race=human beh=guards tier=tough speed=steady trait=racetech kw=- rune=F

Gnomish Gatling | machine | c | mach=Gatling race=gnome beh=pierce tier=sturdy speed=steady kw=slow trait=tidal rune=A
Brass Hornet Swarm | machine | r | mach=Drone race=gnome beh=barrage tier=frail speed=frantic trait=rallying kw=- rune=F
Goblin Rattle-Gun | machine | c | mach=Gatling race=goblin beh=zigzag tier=frail speed=steady trait=rallying kw=- rune=✱
Chu-ko-nu Repeater | machine | u | mach=Repeater race=human beh=barrage tier=frail speed=frantic kw=slow trait=chilling rune=A
Elven Spinning Glaive | machine | u | mach=Repeater race=elf beh=mends tier=sturdy speed=steady kw=mend trait=racetech rune=F
Coral Spitter | machine | c | mach=Repeater race=sea beh=shields tier=sturdy speed=steady trait=dread kw=- rune=E
Sky-Folk Kite Drone | machine | u | mach=Drone race=sky beh=blast tier=sturdy speed=steady trait=tidal kw=- rune=D
Dwarven Rivet Gun | machine | r | mach=Gatling race=dwarf beh=pierce tier=sturdy speed=steady trait=rallying kw=- rune=E
Troll Pebble Hurler | machine | c | mach=Repeater race=troll beh=lob tier=tough speed=slow trait=tidal kw=- rune=D
Al-Jazari's Elephant Clock | machine | l | mach=Automaton race=djinn beh=trample tier=tough speed=steady trait=rallying kw=- rune=C

Siege Mangonel | machine | c | mach=Catapult race=human beh=blast tier=sturdy speed=slow trait=shatter kw=- rune=B
Castle Trebuchet | machine | u | mach=Trebuchet race=human beh=lob tier=sturdy speed=slow kw=slow trait=rallying rune=E
Goblin Rocket Rack | machine | c | mach=Engine race=goblin beh=mends tier=sturdy speed=slow kw=push trait=chilling rune=D
Gnomish Bomb Lobber | machine | c | mach=Catapult race=gnome beh=cross tier=sturdy speed=slow kw=push trait=rallying rune=F
Alchemist's Acid Mortar | machine | u | mach=Engine race=alchemy beh=lob tier=sturdy speed=slow kw=push trait=tidal rune=A
Troll Boulder Sling | machine | c | mach=Catapult race=troll beh=pounce tier=tough speed=steady trait=shatter kw=- rune=B
Depth Charge Launcher | machine | r | mach=Engine race=sea beh=mends tier=sturdy speed=slow trait=rallying kw=- rune=C
Sky-Folk Bomb Balloon | machine | u | mach=Drone race=sky beh=blast tier=sturdy speed=quick trait=dread kw=- rune=D
Dwarven Thunder Mortar | machine | r | mach=Engine race=dwarf beh=lob tier=sturdy speed=slow trait=racetech kw=- rune=E
Byzantine Fire Engine | machine | r | mach=Engine race=alchemy beh=shields tier=sturdy speed=slow trait=chilling kw=- rune=F
Djinn Sand Cannon | machine | l | mach=Engine race=djinn beh=bolt tier=sturdy speed=steady trait=racetech kw=- rune=A
Elven Seed Catapult | machine | u | mach=Catapult race=elf beh=cross tier=sturdy speed=slow trait=dread kw=- rune=D

Iron Bastion | machine | c | mach=Bastion race=dwarf beh=guards tier=huge speed=slow trait=tidal kw=- rune=E
Dwarven Gate of Iron | machine | r | mach=Bulwark race=dwarf beh=wardmaker tier=huge speed=slow trait=rallying kw=- rune=A
Gnomish Pop-Up Wall | machine | c | mach=Barricade race=gnome beh=taunt tier=huge speed=slow kw=mend trait=rallying rune=F
Elven Thornglass Barrier | machine | u | mach=Palisade race=elf beh=mends tier=sturdy speed=slow kw=mend trait=shatter rune=C
Goblin Scrap Barricade | machine | c | mach=Barricade race=goblin beh=wardmaker tier=huge speed=slow kw=drain trait=shatter rune=B
Coral Rampart | machine | u | mach=Rampart race=sea beh=wardmaker tier=huge speed=slow kw=mend trait=chilling rune=E
Sky-Folk Wind Sail Wall | machine | u | mach=Palisade race=sky beh=taunt tier=huge speed=slow trait=racetech kw=- rune=D
Troll Stone Rampart | machine | c | mach=Rampart race=troll beh=pounce tier=tough speed=slow trait=racetech kw=- rune=A
Pike Palisade | machine | c | mach=Palisade race=human beh=guards tier=huge speed=slow kw=push trait=rallying rune=F
Alchemist's Glass Bulwark | machine | u | mach=Bulwark race=alchemy beh=wardmaker tier=huge speed=slow kw=slow trait=sandstorm rune=C
Djinn Mirage Wall | machine | r | mach=Bastion race=djinn beh=wardmaker tier=huge speed=slow kw=push trait=tidal rune=B
Brass Tortoise Wall | machine | l | mach=Bulwark race=human beh=guards tier=tough speed=slow trait=rallying kw=- rune=B

Dwarven Stout | instant | c | as=boon race=dwarf boon=heal side=glow timing=echo kw=- rune=D
Elven Dew | instant | c | as=boon race=elf boon=pact side=rime kw=- rune=A
Troll Blood Tonic | instant | u | as=boon race=troll boon=regen len=long side=muster kw=- rune=F
Panacea | instant | r | as=boon race=alchemy boon=heal side=sprout kw=- rune=C
Elixir of Life | instant | l | as=boon race=alchemy boon=heal side=rally timing=delayed kw=- rune=B
Peach of Immortality | instant | l | as=boon race=human boon=regen side=glow kw=- rune=E
Soma Draught | instant | u | as=boon race=human boon=power side=muster kw=- rune=✱
Berserker Brew | instant | c | as=boon race=troll boon=power len=long side=muster timing=delayed kw=- rune=C
Giant's Strength Potion | instant | u | as=boon race=alchemy boon=power len=long side=glow kw=- rune=B
Haoma Cup | instant | r | as=boon race=djinn boon=courage len=long side=chill kw=- rune=D
Liquid Courage | instant | c | as=boon race=dwarf boon=courage len=short side=chill timing=delayed kw=- rune=E
Mead of Poetry | instant | u | as=boon race=human boon=gauge side=chill timing=delayed kw=- rune=B
Mana Potion | instant | c | as=boon race=alchemy boon=gauge side=radiance kw=- rune=C
Gnomish Coffee | instant | c | as=boon race=gnome boon=haste len=short side=glow kw=- rune=F
Kahve of the Bazaar | instant | u | as=boon race=djinn boon=haste len=long side=rally kw=- rune=A
Sea-Folk Kelp Tea | instant | c | as=boon race=sea boon=regen len=short side=sprout timing=echo kw=- rune=D
Smoke Bomb | instant | c | as=boon race=goblin boon=dodge side=muster timing=delayed kw=- rune=E
Cat's Eye Tonic | instant | u | as=boon race=elf boon=dodge side=chill kw=- rune=F
Invisibility Draught | instant | r | as=boon race=alchemy boon=phase side=rally kw=- rune=A
Bottled Lightning | instant | u | as=boon race=sky boon=haste len=short side=rally timing=delayed kw=- rune=A
Guardian Angel Vial | instant | r | as=boon race=human boon=intervene side=rally timing=echo kw=- rune=F
Goblin Rage Juice | instant | u | as=boon race=goblin boon=power len=short side=rally kw=- rune=E

Throwing Knives | instant | c | as=strike race=human shape=cluster rider=crit cluster=cross kw=- rune=D
Goblin Firecracker | instant | c | as=strike race=goblin shape=cluster kw=valor rider=recoil cast=quick cluster=cross rune=C
Flash Bang Powder | instant | u | as=strike race=gnome shape=cluster kw=valor cluster=scatter rune=B
Shock Glove | instant | c | as=strike race=gnome shape=shockwave kw=push rider=recoil cast=charged rune=A
Elven Flechette | instant | c | as=strike race=elf shape=mine rider=onkill kw=- rune=F
Bolas | instant | c | as=strike race=human shape=ricochet kw=slow cast=quick rune=E
Boomerang | instant | c | as=strike race=human shape=boomerang rider=pierce cast=charged kw=- rune=D
Chakram | instant | u | as=strike race=human shape=boomerang rider=recoil kw=- rune=F
Net Gun | instant | u | as=strike race=sea shape=mine kw=push rider=recoil cast=quick rune=A
Coral Shrapnel | instant | c | as=strike race=sea shape=mine cast=quick kw=- rune=B
Djinn Smoke Puff | instant | u | as=strike race=djinn shape=mine kw=confuse rune=C
Dwarven Blasting Charge | instant | u | as=lob race=dwarf pattern=burst fuse=heavy kw=push rune=B
Gnomish Grenade | instant | c | as=lob race=gnome pattern=single fuse=quick kw=- rune=C
Sticky Tar Bomb | instant | c | as=lob race=troll pattern=burst fuse=heavy kw=slow after=ground rune=D
Acid Flask | instant | c | as=lob race=alchemy pattern=single fuse=quick kw=push after=ground rune=E
Sky-Folk Lightning Jar | instant | r | as=lob race=sky pattern=burst fuse=quick kw=push after=knock rune=D
Troll Snot Bomb | instant | u | as=lob race=troll pattern=burst fuse=heavy kw=mend after=knock rune=E
Dwarven Rune Grenade | instant | r | as=lob race=dwarf pattern=cross fuse=quick after=knock kw=- rune=A

Spyglass Peek | instant | c | as=utility util=draw race=sea rune=F
Pocket Almanac | instant | c | as=utility util=draw race=human rune=C
Dwarven Ledger | instant | u | as=utility util=draw race=dwarf rune=B
Elven Star Map | instant | r | as=utility util=draw race=elf rune=C
Gnomish Punch-Card Reader | instant | u | as=utility util=draw race=gnome rune=B
Dowsing Rod | instant | c | as=utility util=search find=any race=dwarf rune=E
Gnomish Card-Finder | instant | c | as=utility util=search find=any race=gnome rune=✱
Smuggler's Map | instant | c | as=utility util=search find=any race=sea rune=E
Goblin Rummage Sack | instant | c | as=utility util=search find=any race=goblin rune=D
Quartermaster's Ledger | instant | u | as=utility util=search find=attack race=human rune=F
Weapon Rack Index | instant | u | as=utility util=search find=attack race=dwarf rune=A
Armorer's Catalog | instant | u | as=utility util=search find=defense race=dwarf rune=D
Shield Rack Index | instant | u | as=utility util=search find=defense race=human rune=E
Beast Whistle | instant | u | as=utility util=search find=creature race=troll rune=D
Kite Signal | instant | u | as=utility util=search find=creature race=sky rune=E
Rune Compass | instant | r | as=utility util=search find=rune race=dwarf rune=B
Lodestone Locator | instant | r | as=utility util=search find=rune race=alchemy rune=C
Akashic Lens | instant | l | as=utility util=search find=pick race=elf rune=D
Clockwork Shuffler | instant | u | as=utility util=reshuffle race=gnome rune=E
Goblin Card Toss | instant | c | as=utility util=reshuffle race=goblin rune=C
Djinn's Whirlwind Deal | instant | r | as=utility util=reshuffle race=djinn rune=B
Tidecaller's Shuffle | instant | u | as=utility util=reshuffle race=sea rune=A
Elven Sorting Lens | instant | r | as=utility util=keep race=elf rune=F
Dwarven Sorting Tray | instant | u | as=utility util=keep race=dwarf rune=✱
Gnomish Sieve | instant | u | as=utility util=keep race=gnome rune=F
Merchant's Scale | instant | l | as=utility util=keep race=djinn rune=E
Lightning Battery | instant | u | as=utility util=recharge race=sky rune=D
Dwarven Forge Bellows | instant | c | as=utility util=recharge race=dwarf rune=E
Gnomish Wind-Up Key | instant | c | as=utility util=recharge race=gnome rune=D
Alchemist's Reagent Kit | instant | u | as=utility util=recharge race=alchemy rune=B
Storm Jar Generator | instant | r | as=utility util=recharge race=sky rune=C
Troll Rock Grinder | instant | l | as=utility util=recharge race=troll rune=✱
Smelling Salts | instant | c | as=utility util=cleanse race=alchemy rune=E
Antidote Kit | instant | u | as=utility util=cleanse race=alchemy rune=F
Elven Purifying Lamp | instant | r | as=utility util=cleanse race=elf rune=A
Copying Press | instant | u | as=utility util=copy race=human rune=B
Gnomish Duplicator | instant | r | as=utility util=copy race=gnome rune=C
Grappling Hook | instant | c | as=utility util=recall race=sea rune=D

Pop-Up Umbrella Shield | instant | c | as=ward race=gnome form=shield wfx=healing len=short kw=- rune=E
Dwarven Shield Charm | instant | c | as=ward race=dwarf form=shield build=light kw=- rune=C
Gnomish Force Bubble | instant | u | as=ward race=gnome form=shield build=heavy wfx=healing kw=- rune=B
Elven Glass Ward | instant | u | as=ward race=elf form=arc build=light len=short kw=- rune=E
Sea-Folk Shell Guard | instant | c | as=ward race=sea form=shield build=heavy len=long kw=- rune=D
Djinn Mirage Cloak | instant | r | as=ward race=djinn form=shield build=light wfx=healing len=long kw=- rune=A

Dwarven War Axe | equip | c | eq=blade race=dwarf rune=E
Elven Moon Blade | equip | u | eq=blade race=elf rune=F
Goblin Spiked Collar | equip | c | eq=blade race=goblin unstable=1 rune=A
Troll Bone Club | equip | c | eq=blade race=troll rune=F
Sea-Folk Trident Head | equip | c | eq=blade race=sea rune=A
Sky-Folk Steel Talons | equip | u | eq=blade race=sky rune=B
Damascus Edge | equip | r | eq=blade race=djinn rune=C
Masamune's Edge | equip | l | eq=blade race=human rune=B
Khopesh | equip | u | eq=blade race=alchemy rune=C
Dwarven Plate | equip | c | eq=plate race=dwarf rune=E
Elven Leaf Mail | equip | c | eq=plate race=elf rune=D
Gnomish Gear Armor | equip | u | eq=plate race=gnome rune=C
Troll Hide Barding | equip | c | eq=plate race=troll rune=B
Sea-Folk Scale Mail | equip | c | eq=plate race=sea rune=A
O-yoroi Lacquer Plate | equip | r | eq=plate race=human rune=F
Brigandine Coat | equip | u | eq=plate race=human rune=E
Clockwork Spurs | equip | c | eq=spring race=gnome rune=D
Gnomish Spring Boots | equip | u | eq=spring race=gnome rune=C
Goblin Rocket Pack | equip | u | eq=spring race=goblin unstable=1 rune=B
Sky-Folk Wing Harness | equip | r | eq=spring race=sky rune=F
Quicksilver Horseshoes | equip | u | eq=spring race=alchemy rune=A
Tower Shield Harness | equip | c | eq=aegis race=human rune=D
Dwarven Aegis Plate | equip | r | eq=aegis race=dwarf rune=E
Elven Mirror Shield | equip | u | eq=aegis race=elf rune=B
Gnomish Deflector Dish | equip | u | eq=aegis race=gnome rune=C
War Banner Pole | equip | c | eq=banner race=human rune=F
Regimental Drum | equip | u | eq=banner race=human rune=A
Dwarven Clan Standard | equip | r | eq=banner race=dwarf rune=B
Conch War Horn | equip | u | eq=banner race=sea rune=C
Dwarven Fire Rune | equip | u | eq=rune race=dwarf kw=burn rune=C
Elven Frost Sigil | equip | u | eq=rune race=elf kw=freeze rune=B
Sky-Folk Spark Coil | equip | r | eq=rune race=sky kw=stun rune=E

Whetstone | tinker | c | race=human kw=- rune=B
Gun Oil | tinker | c | race=human kw=- rune=A
Sharpening Wheel | tinker | c | race=dwarf kw=- rune=F
Tempering Oil | tinker | c | race=dwarf kw=- rune=E
Lens Polish | tinker | c | race=elf kw=- rune=D
Gnomish Overclock | tinker | u | race=gnome kw=- rune=C
Dwarven Forge Upgrade | tinker | u | race=dwarf kw=- rune=B
Elven Enchanter's Kit | tinker | u | race=elf kw=mend rune=A
Goblin Duct Tape | tinker | c | race=goblin unstable=1 kw=- rune=F
Alchemical Infusion | tinker | u | race=alchemy kw=poison rune=B
Fire Rune Etching | tinker | u | race=dwarf kw=burn rune=C
Frost Coating | tinker | u | race=sea kw=freeze rune=✱
Spark Plug | tinker | u | race=gnome kw=stun rune=E
Silver Plating | tinker | c | race=human kw=- rune=D
Counterweight | tinker | c | race=troll kw=push rune=E
Djinn's Polish | tinker | r | race=djinn kw=confuse rune=F
Wayland's Bench | tinker | r | race=human kw=- rune=A
Goibniu's Hammer | tinker | r | race=human kw=- rune=F
Ilmarinen's Forge | tinker | l | race=human kw=- rune=A
Hephaestus's Anvil | tinker | l | race=human kw=burn rune=A

Goblin Bomb Bag | charge | c | race=goblin shot=lob uses=few kw=push edge=crit rune=C
Dwarven Blasting Keg | lob | u | race=dwarf pattern=ring fuse=heavy kw=push after=knock rune=D
Gnomish Spark Canister | charge | c | race=gnome shot=bolt uses=few kw=mend edge=splash rune=E
Harpoon Rack | charge | c | race=sea shot=bolt uses=few kw=pull edge=crit rune=D
Pebble Pouch | charge | c | race=sky shot=twin uses=few kw=- rune=E
Elven Arrow Pouch | charge | u | race=elf shot=bolt edge=crit kw=- rune=F
Acid Vial Belt | charge | u | race=alchemy shot=lob uses=many kw=push rune=A
Troll Rock Satchel | charge | c | race=troll shot=lob uses=few edge=splash kw=- rune=D
Brass Shot Bundle | charge | c | race=human shot=twin uses=many edge=pierce kw=- rune=E
Djinn Ember Censer | charge | r | race=djinn shot=lob uses=many kw=slow edge=pierce rune=C
Clockwork Bolt Feeder | charge | r | race=gnome shot=bolt uses=few edge=pierce kw=- rune=B
Bottomless Quiver | charge | l | race=elf shot=bolt uses=many kw=- rune=A
Dwarven Pendulum Axe | trap | c | race=dwarf trap=pendulum len=long size=three spread=row kw=- rune=F
Gnomish Clockwork Pendulum | trap | u | race=gnome trap=pendulum size=three spread=column kw=- rune=E
Goblin Swinging Saw | trap | c | race=goblin unstable=1 trap=snare len=long size=three kw=- rune=D
Grand Pendulum Engine | trap | r | race=human trap=pendulum kw=push len=long size=three spread=column rune=E

Flintlock Pistol | ace | c | shape=line race=human kw=- rune=F
Dwarven Hand Cannon | ace | u | shape=nova race=dwarf kw=push rune=E
Gnomish Ray Pistol | ace | u | shape=row race=gnome kw=- rune=D
Goblin Boomstick | ace | c | shape=nova race=goblin unstable=1 kw=- rune=C
Elven Crystal Sling | ace | u | shape=line race=elf kw=- rune=B
Harpoon Gun | ace | c | shape=line race=sea kw=pull rune=A
Double-Barrel Blunderbuss | ace | r | shape=twin race=human kw=- rune=F
Djinn Lamp Blast | ace | r | shape=all race=djinn kw=confuse rune=E
Thunder Rod | ace | r | shape=row race=sky kw=stun rune=D
Philosopher's Bullet | ace | l | shape=line race=alchemy kw=- rune=F
Runic Siege Pistol | ace | l | shape=row race=dwarf kw=- rune=A
Troll Bone Crossbow | ace | u | shape=line race=troll kw=slow rune=B

Silver Bullets | aceup | c | race=human kw=- rune=E
Black Powder Charge | aceup | c | race=dwarf kw=push rune=B
Gnomish Scope | aceup | u | race=gnome kw=- rune=C
Spread Shot Choke | aceup | u | shape=row race=human kw=- rune=B
Scattergun Drum | aceup | r | shape=all race=goblin unstable=1 kw=- rune=C
Explosive Rounds | aceup | u | shape=nova race=goblin kw=- rune=F
Frost Shell | aceup | u | race=sea kw=freeze rune=A
Alchemical Tracer | aceup | c | race=alchemy kw=burn rune=F
Elven Mirror Barrel | aceup | r | shape=twin race=elf kw=- rune=A
Lightning Capacitor | aceup | r | race=sky kw=stun rune=E
Venom Cartridge | aceup | c | race=alchemy kw=poison rune=D
Rifled Barrel | aceup | u | race=dwarf kw=- rune=A
Bottled Djinn Wind | aceup | r | shape=all race=djinn kw=- rune=F
Masterwork Trigger | aceup | l | race=gnome kw=- rune=A
Troll Hide Grip | aceup | c | race=troll kw=- rune=F
`,

};
/* Later additions to the six colors: each gets three Aces (finishers for the Sidearm) and three
   Ace Enchantments that power up or change whatever Ace is loaded. They roll their own ranks,
   so the cards above keep theirs. */
const CARD_EXTRAS={
fire:`
Phoenix Arrow | ace | u | shape=line kw=burn rune=F
Sunfall Lance | ace | r | shape=row kw=burn rune=E
Heart of the Volcano | ace | l | shape=nova kw=burn rune=F
Dragonfire Coating | aceup | c | kw=burn rune=F
Blacksmith's Temper | aceup | u | kw=- rune=F
Cyclone Wrap | aceup | r | shape=nova kw=push rune=E
`,
frost:`
Narwhal Harpoon | ace | u | shape=line kw=freeze rune=D
Tidal Ram | ace | r | shape=row kw=push rune=C
Heart of Winter | ace | l | shape=all kw=freeze rune=F
Rime Edge | aceup | c | kw=freeze rune=E
Undertow Charm | aceup | u | kw=pull rune=F
Hurricane Eye | aceup | r | shape=row kw=slow rune=A
`,
storm:`
Thunderbird Feather | ace | u | shape=line kw=stun rune=C
Djinn's Last Wish | ace | r | shape=all kw=confuse rune=F
Vajra of Indra | ace | l | shape=row kw=stun rune=F
Static Charge | aceup | c | kw=stun rune=C
Gilded Shot | aceup | u | kw=- rune=C
Sandstorm Scatter | aceup | r | shape=all kw=slow rune=C
`,
verdant:`
Thornheart Seed | ace | u | shape=nova kw=poison rune=A
Hunter's Last Arrow | ace | r | shape=line kw=slow rune=A
Wrath of the Wild | ace | l | shape=all kw=poison rune=B
Venom Tip | aceup | c | kw=poison rune=A
Sap of Renewal | aceup | u | kw=drain rune=D
Root Snare Wrap | aceup | r | shape=row kw=slow rune=E
`,
light:`
Sun Spear | ace | u | shape=line kw=valor rune=C
Archangel's Verdict | ace | r | shape=all kw=mend rune=C
Last Light of Dawn | ace | l | shape=row kw=mend rune=B
Blessed Oil | aceup | c | kw=mend rune=C
Oath of Valor | aceup | u | kw=valor rune=B
Halo of Judgment | aceup | r | shape=nova kw=- rune=✱
`,
shadow:`
Banshee's Final Wail | ace | u | shape=all kw=confuse rune=F
Reaper's Due | ace | r | shape=line kw=drain rune=C
Death's Door | ace | l | shape=nova kw=curse rune=B
Cursed Bullet | aceup | c | kw=curse rune=C
Blood Price | aceup | u | kw=drain rune=D
Fog of Dread | aceup | r | shape=all kw=confuse rune=E
`,
};
// Claim cards: ground taken from the enemy (reach=front, patch or deep)
const CARD_CLAIMS={
verdant:`
Creeping Overgrowth | claim | u | reach=front rune=A
Rootbound Glade | claim | r | reach=patch rune=B
Wildwood Reclamation | claim | l | reach=deep rune=C
`,
shadow:`
Spreading Mire | claim | u | reach=front rune=C
Sunken Bog | claim | r | reach=patch rune=F
The Drowned Fen | claim | l | reach=deep rune=A
`,
light:`
Marble Causeway | claim | u | reach=front rune=C
Colonnade of Dawn | claim | r | reach=patch rune=B
Temple Foundation | claim | l | reach=deep rune=C
`,
frost:`
Rising Tide | claim | u | reach=front rune=✱
Flash Flood | claim | r | reach=patch rune=D
The Great Deluge | claim | l | reach=deep rune=E
`,
};
// creatures the color sets add to the art's list (art.js), built from the same parts
const CARD_SET_CREATURES={"Merfolk":{"head":"round","ears":"point","snout":"grin","body":"wisp","tail":1,"eyes":"big"},"Fish":{"head":"long","ears":"plume","snout":"wide","body":"small","tail":1,"eyes":"top"},"Seal":{"head":"round","ears":"none","snout":"short","body":"round","tail":1,"eyes":"big"},"Kappa":{"head":"round","ears":"none","snout":"beak","body":"shell","claws":1},"Yeti":{"head":"wide","ears":"round","snout":"short","body":"big","claws":1},"Snowman":{"head":"round","ears":"none","snout":"short","body":"round","eyes":"big"},"Penguin":{"head":"round","ears":"none","snout":"beak","body":"squat","wings":1},"Walrus":{"head":"wide","ears":"none","snout":"tusk","body":"big","mod":{"beard":1}},"Narwhal":{"head":"long","ears":"horns","snout":"long","body":"round","tail":1},"Orca":{"head":"long","ears":"plume","snout":"grin","body":"big","tail":1},"Shark":{"head":"long","ears":"plume","snout":"fangs","body":"coil","tail":1},"Turtle":{"head":"square","ears":"none","snout":"beak","body":"shell","mod":{"scale":1.2,"mat":"s"}},"Crab":{"head":"wide","ears":"antenna","snout":"mandible","body":"shell","claws":1},"Kraken":{"head":"round","ears":"none","snout":"beak","body":"coil","tail":2,"eyes":"glow","mod":{"scale":1.3}},"Leviathan":{"head":"long","ears":"horns","snout":"fangs","body":"coil","tail":2,"eyes":"glow","mod":{"scale":1.3,"mat":"g"}},"Djinn":{"head":"long","ears":"point","snout":"grin","body":"wisp","eyes":"glow","mod":{"beard":1}},"Scarab":{"head":"round","ears":"antenna","snout":"mandible","body":"shell","wings":2},"Camel":{"head":"long","ears":"floppy","snout":"long","body":"big","tail":1},"Manticore":{"head":"wide","ears":"tufts","snout":"fangs","body":"big","wings":2,"tail":1,"claws":1},"Chimera":{"head":"wide","ears":"horns","snout":"fangs","body":"big","tail":2,"claws":1},"Scorpion":{"head":"round","ears":"antenna","snout":"mandible","body":"shell","tail":1,"claws":1},"Jackal":{"head":"long","ears":"point","snout":"long","body":"small","tail":1},"Crocodile":{"head":"long","ears":"none","snout":"long","body":"squat","tail":1,"claws":1},"Roc":{"head":"round","ears":"plume","snout":"beak","body":"big","wings":2,"mod":{"scale":1.3}},"Sphinx":{"head":"helm","ears":"floppy","snout":"short","body":"squat","tail":1,"claws":1,"mod":{"mat":"s"}},"Automaton":{"head":"square","ears":"none","snout":"none","body":"block","eyes":"glow","mod":{"mat":"g"}},"Lizard":{"head":"long","ears":"none","snout":"long","body":"small","tail":1,"claws":1},"Raiju":{"head":"round","ears":"point","snout":"fangs","body":"small","tail":2,"eyes":"glow"},"Chupacabra":{"head":"long","ears":"point","snout":"fangs","body":"squat","eyes":"glow","claws":1},"Simurgh":{"head":"round","ears":"plume","snout":"beak","body":"wisp","wings":2,"tail":2},"Bahamut":{"head":"wide","ears":"none","snout":"wide","body":"coil","tail":2,"mod":{"scale":1.3}},"Sandworm":{"head":"round","ears":"none","snout":"mandible","body":"coil","mod":{"scale":1.2}},"Skeleton":{"head":"round","ears":"none","snout":"grin","body":"small","eyes":"glow"},"Zombie":{"head":"square","ears":"floppy","snout":"wide","body":"squat","claws":1},"Ghoul":{"head":"wide","ears":"point","snout":"fangs","body":"squat","eyes":"big","claws":1},"Ghost":{"head":"round","ears":"none","snout":"none","body":"wisp","eyes":"big"},"Banshee":{"head":"long","ears":"none","snout":"wide","body":"wisp","eyes":"glow"},"Lich":{"head":"helm","ears":"horns","snout":"none","body":"wisp","eyes":"glow","mod":{"beard":1}},"Reaper":{"head":"helm","ears":"none","snout":"none","body":"wisp","eyes":"glow","claws":1,"mod":{"scale":1.2}},"Werewolf":{"head":"long","ears":"point","snout":"fangs","body":"big","tail":1,"eyes":"glow","claws":1},"Gaunt":{"head":"long","ears":"horns","snout":"fangs","body":"big","eyes":"glow","claws":1,"mod":{"scale":1.25}},"Nightmare":{"head":"long","ears":"point","snout":"long","body":"big","tail":1,"eyes":"glow"},"Spider":{"head":"round","ears":"none","snout":"mandible","body":"small","eyes":"glow","claws":1},"Moth":{"head":"round","ears":"antenna","snout":"none","body":"small","wings":2,"eyes":"big"},"Centipede":{"head":"long","ears":"antenna","snout":"mandible","body":"coil","claws":1},"Leech":{"head":"round","ears":"none","snout":"mandible","body":"coil","mod":{"scale":0.8}},"Witch":{"head":"long","ears":"point","snout":"long","body":"small","eyes":"top"},"Plaguemask":{"head":"helm","ears":"none","snout":"beak","body":"big","eyes":"glow"},"Demon":{"head":"wide","ears":"horns","snout":"fangs","body":"big","wings":2,"tail":1,"claws":1},"Crow":{"head":"round","ears":"none","snout":"beak","body":"small","wings":2,"tail":1,"eyes":"glow"},"Cat":{"head":"round","ears":"point","snout":"short","body":"small","tail":1,"eyes":"glow"},"Jiangshi":{"head":"square","ears":"none","snout":"short","body":"block","eyes":"top"},"Pegasus":{"head":"long","ears":"point","snout":"long","body":"big","wings":1,"tail":1},"Centaur":{"head":"round","ears":"round","snout":"short","body":"big","tail":1,"mod":{"beard":1}},"Unicorn":{"head":"long","ears":"horns","snout":"long","body":"big","tail":1,"eyes":"big"},"Stag":{"head":"long","ears":"horns","snout":"short","body":"big","tail":1},"Crane":{"head":"round","ears":"plume","snout":"beak","body":"small","wings":1,"tail":1},"Angel":{"head":"round","ears":"none","snout":"none","body":"wisp","wings":2,"eyes":"glow"},"Lamassu":{"head":"helm","ears":"horns","snout":"short","body":"big","wings":2,"tail":1,"mod":{"beard":1,"mat":"s"}},"Elephant":{"head":"wide","ears":"floppy","snout":"tusk","body":"big","tail":1,"mod":{"scale":1.3}},"Qilin":{"head":"long","ears":"horns","snout":"long","body":"armor","tail":2,"eyes":"glow"},"Valkyrie":{"head":"helm","ears":"plume","snout":"none","body":"armor","wings":1},"Cleric":{"head":"round","ears":"none","snout":"short","body":"round"},"Scholar":{"head":"square","ears":"round","snout":"short","body":"small","mod":{"beard":1}},"Ent":{"head":"square","ears":"none","snout":"none","body":"block","eyes":"glow","mod":{"beard":1,"scale":1.25}},"Leshy":{"head":"square","ears":"horns","snout":"grin","body":"big","eyes":"glow","claws":1,"mod":{"beard":1}},"Deer":{"head":"long","ears":"horns","snout":"short","body":"small","tail":1},"Moose":{"head":"long","ears":"horns","snout":"wide","body":"big","tail":1},"Ape":{"head":"round","ears":"round","snout":"wide","body":"big","claws":1},"Monkey":{"head":"round","ears":"round","snout":"short","body":"small","tail":2},"Panther":{"head":"wide","ears":"point","snout":"fangs","body":"small","tail":1,"claws":1,"eyes":"glow"},"Tiger":{"head":"wide","ears":"round","snout":"fangs","body":"big","tail":1,"claws":1},"Elf":{"head":"long","ears":"point","snout":"none","body":"small"},"Druid":{"head":"round","ears":"none","snout":"none","body":"wisp","mod":{"beard":1}},"Fairy":{"head":"round","ears":"point","snout":"none","body":"wisp","wings":2,"mod":{"scale":0.7}},"Mushroom":{"head":"wide","ears":"none","snout":"grin","body":"squat"},"Ant":{"head":"round","ears":"antenna","snout":"mandible","body":"armor"},"Hornet":{"head":"round","ears":"antenna","snout":"mandible","body":"small","wings":2,"tail":1},"Tortoise":{"head":"round","ears":"none","snout":"beak","body":"shell"},"Sasquatch":{"head":"round","ears":"none","snout":"wide","body":"big","claws":1,"mod":{"scale":1.3}},"Tanuki":{"head":"round","ears":"round","snout":"short","body":"round","tail":1},"Satyr":{"head":"long","ears":"horns","snout":"grin","body":"small","tail":1,"mod":{"beard":1}},"Kodama":{"head":"round","ears":"none","snout":"none","body":"small","eyes":"big","mod":{"scale":0.6}},"Quetzal":{"head":"round","ears":"plume","snout":"beak","body":"small","wings":2,"tail":2},"Sauropod":{"head":"round","ears":"none","snout":"short","body":"big","tail":1,"mod":{"scale":1.3}}};
// "Name | type | rarity | k=v k=v" lines -> entries
function parseCardSet(text){ return text.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')).map(l=>{
  const [name,type,r,opts]=l.split('|').map(s=>s.trim()), e={name, type, rarity:{c:'common',u:'uncommon',r:'rare',l:'legendary'}[r], o:{}};
  for(const kv of (opts||'').split(/\s+/).filter(Boolean)){ const i=kv.indexOf('='); e.o[kv.slice(0,i)]=kv.slice(i+1); }
  return e; }); }
