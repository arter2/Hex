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
Bottle Rocket | strike | c | shape=zigzag kw=push
Skyrocket | strike | u | shape=diag kw=stun
Rocket Barrage | strike | r | shape=missiles kw=burn
Dragon's Breath | strike | r | shape=wedge kw=burn
Wyvern Spit | strike | u | shape=line kw=-
Kitsune Foxfire | strike | u | shape=missiles kw=burn
Oni Club Swing | strike | u | shape=wedge kw=self
Minotaur Charge | strike | r | shape=dig kw=push
Bull Rush | strike | c | shape=dig kw=push
Pickaxe Strike | strike | c | shape=line kw=stun
Miner's Drill | strike | u | shape=dig kw=-
Forge Hammer Throw | strike | c | shape=line kw=stun
Red-Hot Rivet | strike | c | shape=line kw=burn
Molten Slag Spray | strike | u | shape=wedge kw=slow
Lava Jet | strike | c | shape=row kw=slow
Volcanic Vent | strike | r | shape=row kw=burn
Cyclone of Cinders | strike | r | shape=all kw=push
Fire Whirl | strike | u | shape=zigzag kw=push
Phoenix Feather | strike | u | shape=line kw=mend
Griffin Talon | strike | c | shape=line kw=-
Coyote's Trick Shot | strike | c | shape=diag kw=-
Goblin Slingshot | strike | c | shape=line kw=-
Gremlin Sparkler | strike | c | shape=zigzag kw=confuse
Duende's Ember | strike | c | shape=line kw=confuse
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
Grenado | lob | c | pattern=single kw=push
Greek Fire Jar | lob | u | pattern=burst kw=burn
Volcano Bomb | lob | r | pattern=ring kw=burn
Lava Glob | lob | c | pattern=single kw=burn
Magma Geyser | lob | u | pattern=column kw=burn
Meteor Shard | lob | c | pattern=single kw=-
Firework Shell | lob | u | pattern=cross kw=confuse
Paper Lantern Bomb | lob | c | pattern=burst kw=confuse
Dragon Egg | lob | r | pattern=burst kw=burn
Goblin Bomb | lob | c | pattern=single kw=self
Gremlin Grenade | lob | c | pattern=cross kw=-
Mortar Round | lob | c | pattern=column kw=push
Cannonball | lob | u | pattern=single kw=push
Basalt Boulder | lob | c | pattern=single kw=stun
Rockfall | lob | u | pattern=row kw=stun
Phoenix Ash Bomb | lob | u | pattern=ring kw=mend
Sake Firebomb | lob | c | pattern=burst kw=self
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
Lava Totem | sentry | c | kw=slow
Shishi Guardian Statue | sentry | u | kw=push
Fox Lantern | sentry | u | kw=confuse
Dragon Kiln | sentry | r | kw=burn
Smoking Chimney | sentry | c | kw=-
Torch Post | sentry | c | kw=-
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
Rocket Crate | charge | u | fx=lob kw=push
Bandolier of Flares | charge | c | fx=bolt kw=confuse
Ore Cart | charge | u | fx=lob kw=stun
Coal Sack | charge | c | fx=lob kw=-
Goblin Junk Sack | charge | c | fx=lob kw=-
Rivet Pouch | charge | c | fx=bolt kw=-
Dragon Tooth Quiver | charge | r | fx=bolt kw=-
Firecracker String | charge | c | fx=bolt kw=push
Lantern Oil Flask | charge | u | fx=bolt kw=burn
Pistol Case | charge | u | fx=bolt kw=push
Blasting Caps | charge | u | fx=lob kw=push
Shishi Pearl | charge | r | fx=bolt kw=-
Fox-Fire Jar | charge | u | fx=bolt kw=burn
Wineskin of Flame | charge | c | fx=bolt kw=self
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
Firework Mine | trap | u | trap=blast kw=push

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
Heart of the Phoenix | piece | l | kw=mend
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
/* ---------------- Blue · Frost: water, ice and the great unknown ---------------- */
frost:`
Harpoon Throw | strike | c | shape=line kw=pull
Whaler's Harpoon | strike | u | shape=line kw=pull
Tidal Wave | strike | r | shape=row kw=push
Breaking Surf | strike | c | shape=row kw=push
Riptide | strike | u | shape=zigzag kw=pull
Undertow | strike | c | shape=line kw=pull
Maelstrom | strike | l | shape=all kw=pull
Hurricane's Eye | strike | l | shape=all kw=push
Typhoon Lash | strike | r | shape=wedge kw=push
Narwhal Tusk | strike | c | shape=line kw=-
Shark Bite | strike | c | shape=line kw=-
Frenzy of Sharks | strike | u | shape=missiles kw=valor
Cutlass Slash | strike | c | shape=wedge kw=-
Boarding Axe | strike | c | shape=line kw=stun
Grapeshot Volley | strike | u | shape=wedge kw=push
Siren's Song | strike | u | shape=missiles kw=confuse
Lorelei's Lure | strike | r | shape=line kw=pull
Kelpie's Plunge | strike | u | shape=dig kw=pull
Nixie's Whirlpool | strike | c | shape=zigzag kw=confuse
Frostbite | strike | c | shape=line kw=freeze
Blizzard Gale | strike | u | shape=all kw=slow
Avalanche Rush | strike | r | shape=dig kw=stun
Hailstone Barrage | strike | u | shape=missiles kw=stun
Sleet Volley | strike | c | shape=missiles kw=slow
Winter Wolf Fangs | strike | c | shape=line kw=slow
Yeti's Swipe | strike | c | shape=wedge kw=stun
Icebreaker Ram | strike | u | shape=dig kw=push
Kappa's Sumo Shove | strike | c | shape=line kw=push
Rusalka's Embrace | strike | r | shape=line kw=drain
Umibozu's Grasp | strike | r | shape=wedge kw=pull
Ningyo Scale Dart | strike | c | shape=diag kw=mend
Ice Skate Slash | strike | c | shape=diag kw=-
Glacier Calving | strike | u | shape=row kw=stun
Waterspout | strike | u | shape=zigzag kw=push
Leviathan's Wake | strike | l | shape=row kw=push
World Serpent's Coil | strike | l | shape=all kw=stun
Bunyip's Bellow | strike | u | shape=wedge kw=confuse
Leister Spear | strike | c | shape=line kw=-

Twelve-Pound Shot | lob | c | pattern=single kw=push
Chain Shot | lob | c | pattern=single kw=slow
Powder Monkey's Keg | lob | u | pattern=burst kw=push
Depth Charge | lob | u | pattern=burst kw=stun
Frozen Comet | lob | r | pattern=burst kw=freeze
Ice Floe Drop | lob | c | pattern=single kw=freeze
Geyser Burst | lob | u | pattern=column kw=push
Rain of Fish | lob | c | pattern=burst kw=-
Coconut Lob | lob | c | pattern=single kw=stun
Ink Cloud | lob | c | pattern=burst kw=confuse
Holy Water Flask | lob | u | pattern=burst kw=mend
Spring Water Gourd | lob | c | pattern=single kw=mend
Hailstone Cross | lob | u | pattern=cross kw=stun
Whirlpool Ring | lob | r | pattern=ring kw=pull
Falling Iceberg | lob | r | pattern=column kw=stun
Message in a Bottle | lob | c | pattern=single kw=confuse
Jellyfish Bloom | lob | u | pattern=burst kw=poison
Pufferfish Toss | lob | c | pattern=single kw=poison
Monsoon Downpour | lob | r | pattern=row kw=slow
Rogue Wave | lob | l | pattern=row kw=push

Sea Wall | ward | c | ward=wall
Beaver Dam | ward | c | ward=wall
Great Dam | ward | r | ward=wall
Ice Palace Gate | ward | u | ward=wall
Snow Fort | ward | c | ward=wall
Igloo | ward | c | ward=barrier
Coral Reef | ward | u | ward=thorns
Sea Urchin Bed | ward | c | ward=thorns
Bubble Shield | ward | c | ward=barrier
Mirror of Still Water | ward | u | ward=barrier
Kelp Curtain | ward | c | ward=barrier
Pack Ice Bulwark | ward | u | ward=wall
Walls of Ys | ward | l | ward=wall
Dome of Atlantis | ward | r | ward=barrier

Inuksuk Watcher | sentry | c | kw=-
Lighthouse | sentry | u | kw=stun
Ice Spike Totem | sentry | c | kw=freeze
Narwhal Horn Totem | sentry | c | kw=-
Figurehead Sentinel | sentry | u | kw=curse
Coral Spire | sentry | c | kw=poison
Siren Rock | sentry | r | kw=confuse
Fountain of Youth | sentry | r | kw=mend
Rime Giant Cairn | sentry | u | kw=slow
Whale Bone Arch | sentry | c | kw=push
Lantern of the Drowned | sentry | r | kw=drain
Tide Pole | sentry | c | kw=pull

Sea Legs | boon | c | boon=dodge
Fair Winds | boon | c | boon=haste
Grog Ration | boon | c | boon=heal
Hot Spring Soak | boon | c | boon=regen
Sauna Steam | boon | c | boon=regen
Cleansing Rain | boon | u | boon=heal
Polar Bear Plunge | boon | u | boon=power
Mead of the Longhall | boon | u | boon=courage
Selkie Skin | boon | r | boon=phase
Become the Tide | boon | u | boon=phase
Sorcerer's Trance | boon | u | boon=gauge
Sea Witch's Bargain | boon | r | boon=pact
Blood Price of the Deep | boon | r | boon=pact
Northern Lights | boon | r | boon=gauge
Lucky Doubloon | boon | c | boon=dodge
Gift of the River Mother | boon | l | boon=intervene

Pirate's Pistol | charge | c | fx=bolt kw=-
Brace of Pistols | charge | u | fx=bolt kw=push
Harpoon Quiver | charge | c | fx=bolt kw=pull
Icicle Darts | charge | c | fx=bolt kw=freeze
Snowball Stockpile | charge | c | fx=lob kw=slow
Cannon Shot Crate | charge | u | fx=lob kw=push
Grapeshot Bag | charge | c | fx=lob kw=-
Blowfish Spines | charge | c | fx=bolt kw=poison
Sea Urchin Quills | charge | c | fx=bolt kw=-
Conch Shell Blasts | charge | u | fx=bolt kw=confuse
Frozen Arrows | charge | c | fx=bolt kw=slow
Hail Pouch | charge | c | fx=lob kw=stun
Bottled Waves | charge | u | fx=lob kw=push
Ice Javelins | charge | u | fx=bolt kw=-
Rusalka's Tears | charge | r | fx=bolt kw=drain
Ghost Ship Volley | charge | r | fx=lob kw=curse
Sorcerer's Orbs | charge | u | fx=bolt kw=confuse
Glass Fishing Floats | charge | c | fx=lob kw=-
Holy Spring Droplets | charge | u | fx=bolt kw=mend
Narwhal Ivory Darts | charge | c | fx=bolt kw=-

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

Ice Hole | trap | c | trap=snare kw=freeze
Thin Ice | trap | c | trap=snare kw=-
Hidden Reef | trap | c | trap=spike kw=-
Fishing Net | trap | c | trap=snare kw=slow
Sunken Mine | trap | u | trap=blast kw=push
Sea Mine | trap | u | trap=blast kw=stun
Kelp Tangle | trap | c | trap=snare kw=slow
Ice Spike Pit | trap | u | trap=spike kw=freeze
Siren's Shoal | trap | r | trap=snare kw=confuse
Davy Jones' Locker | trap | l | trap=blast kw=drain

Frozen Lake | environment | c | env=freeze pattern=burst
Permafrost | environment | c | env=freeze pattern=row
Black Ice | environment | u | env=freeze pattern=cross
Snowfield | environment | c | env=freeze pattern=burst
Tsunami Surge | environment | r | env=tremor pattern=row
Rolling Breakers | environment | u | env=tremor pattern=row
Flood Plain | environment | u | env=tremor pattern=column
Iceberg Field | environment | u | env=freeze pattern=cross
Polar Night | environment | r | env=freeze pattern=burst
Kelp Forest | environment | c | env=bramble pattern=burst
Mangrove Roots | environment | c | env=bramble pattern=column
Sargasso Sea | environment | u | env=bramble pattern=cross
Fimbulwinter | environment | l | env=freeze pattern=row

Crown of the Sea Dragon King | piece | l | kw=pull
Pearl of the Tide Jewels | piece | l | kw=push
Trident of the Sunken King | piece | l | kw=stun
Heart of the Leviathan | piece | l | kw=valor
Eye of the Frost Giant | piece | l | kw=freeze
Bell of the Sunken City | piece | l | kw=confuse

Merrow | summon | c | ai=shooter body=Merfolk
Mermaid Singer | summon | u | ai=healer body=Merfolk mod=Gentle
Merman Spearman | summon | c | ai=guardian body=Merfolk mod=Brave
Merfolk Tidecaller | summon | u | ai=bomber body=Merfolk mod=Clever
Ningyo | summon | u | ai=healer body=Fish mod=Pale
Siren | summon | r | ai=shooter body=Merfolk mod=Sly
Selkie | summon | u | ai=healer body=Seal
Nixie | summon | c | ai=shooter body=Sprite mod=Pale
Rusalka | summon | r | ai=shooter body=Spirit mod=Pale
Kappa | summon | c | ai=guardian body=Kappa
Umibozu | summon | r | ai=guardian body=Ogre mod=Ancient
Yeti | summon | u | ai=guardian body=Yeti
Yeti Cub | summon | c | ai=guardian body=Yeti mod=Tiny
Yeti Matriarch | summon | r | ai=guardian body=Yeti mod=Dire
Snowman | summon | c | ai=guardian body=Snowman
Winter Wolf | summon | c | ai=shooter body=Wolf mod=Pale
Frost Wolf Alpha | summon | u | ai=guardian body=Wolf mod=Dire
Rockhopper Penguin | summon | c | ai=bomber body=Penguin mod=Scrappy
Walrus | summon | u | ai=guardian body=Walrus
Narwhal | summon | u | ai=shooter body=Narwhal
Orca | summon | r | ai=bomber body=Orca
Hammerhead Shark | summon | u | ai=shooter body=Shark
Great White Shark | summon | r | ai=bomber body=Shark mod=Hungry
Sea Turtle | summon | c | ai=healer body=Turtle mod=Gentle
Zaratan the Island Turtle | summon | l | ai=guardian body=Turtle mod=Ancient
King Crab | summon | u | ai=guardian body=Crab mod=Iron
Giant Squid | summon | r | ai=bomber body=Kraken mod=Wild
The Kraken | summon | l | ai=guardian body=Kraken mod=Dire
Kraken Spawn | summon | c | ai=bomber body=Kraken mod=Tiny
Leviathan | summon | l | ai=guardian body=Leviathan mod=Ancient
Bunyip of the Billabong | summon | u | ai=guardian body=Seal mod=Feral
Sea Serpent | summon | r | ai=shooter body=Serpent mod=Wild
Dragon King of the Deep | summon | l | ai=bomber body=Lung mod=Noble
River Lung | summon | u | ai=healer body=Lung mod=Gentle
Frost Giant | summon | r | ai=guardian body=Ogre mod=Pale
Pirate Deckhand | summon | c | ai=shooter body=Squire mod=Scrappy
Buccaneer Captain | summon | r | ai=shooter body=Knight mod=Sly
Powder Monkey | summon | c | ai=bomber body=Squire mod=Tiny
Flying Dutchman's Captain | summon | l | ai=shooter body=Spirit mod=Grim
Drowned Sailor | summon | c | ai=bomber body=Spirit mod=Pale
Snow Maiden | summon | c | ai=healer body=Sprite mod=Gentle
Yuki-onna | summon | r | ai=shooter body=Spirit mod=Pale
Kayak Hunter | summon | c | ai=shooter body=Squire mod=Brave
Polar Bear | summon | u | ai=guardian body=Bear mod=Pale
River Mother's Herald | summon | u | ai=healer body=Merfolk mod=Noble
Vodyanoy | summon | u | ai=bomber body=Toad mod=Old
Ahuizotl | summon | u | ai=shooter body=Hound mod=Sly
Taniwha | summon | r | ai=guardian body=Serpent mod=Ancient

Ship's Cannon | machine | u | ai=turret mach=Cannon
Broadside Battery | machine | r | ai=repeater mach=Cannon
Harpoon Ballista | machine | u | ai=turret mach=Ballista
Harpoon Launcher | machine | c | ai=turret mach=Crossbow
Ice Catapult | machine | c | ai=mortar mach=Catapult
Mortar Ketch | machine | u | ai=mortar mach=Cannon
Sluice Gate Bulwark | machine | u | ai=bulwark mach=Bulwark
Icebreaker Engine | machine | r | ai=bulwark mach=Engine
Waterwheel Repeater | machine | c | ai=repeater mach=Repeater
Diving Bell Automaton | machine | r | ai=turret mach=Automaton
`,

/* ---------------- Yellow · Storm: lightning, sand, invention and greed ---------------- */
storm:`
Lightning Lash | strike | c | shape=line kw=stun
Forked Bolt | strike | c | shape=zigzag kw=stun
Thunderclap | strike | u | shape=wedge kw=push
Static Discharge | strike | c | shape=missiles kw=-
Sky-Splitter | strike | r | shape=line kw=stun
Leyden Jar Shock | strike | c | shape=line kw=stun
Voltaic Arc | strike | u | shape=zigzag kw=stun
Tesla Arc | strike | r | shape=all kw=stun
Scorpion Sting | strike | c | shape=line kw=poison
Manticore Tail Spikes | strike | u | shape=missiles kw=poison
Cobra Spit | strike | c | shape=line kw=poison
Sandblast | strike | c | shape=wedge kw=slow
Dune Lash | strike | c | shape=row kw=slow
Sirocco Gust | strike | u | shape=row kw=push
Haboob Wall | strike | r | shape=all kw=slow
Scimitar Sweep | strike | c | shape=wedge kw=-
Bedouin Lance | strike | c | shape=line kw=-
Camel Kick | strike | c | shape=line kw=push
Ifrit's Flame | strike | u | shape=wedge kw=burn
Sun Disk Ray | strike | u | shape=line kw=burn
Noon Sun Glare | strike | c | shape=diag kw=burn
Mirage Dagger | strike | u | shape=diag kw=confuse
Djinn's Whirlwind | strike | r | shape=all kw=confuse
Coin Toss | strike | c | shape=missiles kw=-
Golden Touch | strike | r | shape=line kw=drain
Bronze Fist | strike | c | shape=dig kw=push
Talos's Boulder | strike | r | shape=dig kw=push
Serpent Whip | strike | c | shape=line kw=pull
Lodestone Pull | strike | u | shape=row kw=pull
Raiju's Pounce | strike | u | shape=dig kw=stun
Plumed Serpent Gale | strike | r | shape=missiles kw=push
Perun's Oak-Splitter | strike | l | shape=line kw=stun
Midas's Last Embrace | strike | l | shape=line kw=drain
Heaven-Rending Bolt | strike | l | shape=all kw=stun

Lightning in a Bottle | lob | u | pattern=burst kw=stun
Alembic Flask | lob | c | pattern=single kw=poison
Quicklime Pot | lob | c | pattern=burst kw=burn
Naphtha Jar | lob | c | pattern=single kw=burn
Sulfur Bomb | lob | u | pattern=burst kw=poison
Thunder Gourd | lob | c | pattern=single kw=stun
Sand Urn | lob | c | pattern=burst kw=slow
Sack of Coins | lob | c | pattern=single kw=push
Golden Hail | lob | u | pattern=row kw=-
Mercury Flask | lob | u | pattern=cross kw=poison
Scarab Swarm Jar | lob | u | pattern=ring kw=poison
Roc's Egg | lob | r | pattern=single kw=push
Saltpeter Charge | lob | c | pattern=column kw=push
Storm Cloud Seed | lob | u | pattern=cross kw=stun
Hail of Dinars | lob | r | pattern=ring kw=drain
Great Work Detonation | lob | l | pattern=burst kw=burn

Copper Lattice | ward | c | ward=barrier
Bronze Aegis | ward | u | ward=barrier
Sandbag Wall | ward | c | ward=wall
Mudbrick Wall | ward | c | ward=wall
Kasbah Gate | ward | r | ward=wall
Cactus Hedge | ward | c | ward=thorns
Scorpion Pit Ring | ward | u | ward=thorns
Faraday Cage | ward | u | ward=barrier
Charged Fence | ward | c | ward=thorns
Caravan Circle | ward | c | ward=wall
Djinn's Veil | ward | u | ward=barrier
Lightning Rod Array | ward | r | ward=thorns
Walls of the City of Brass | ward | l | ward=wall

Lightning Rod | sentry | c | kw=stun
Tesla Coil | sentry | u | kw=stun
Sun Obelisk | sentry | c | kw=burn
Scarab Totem | sentry | c | kw=poison
Brazen Head | sentry | r | kw=confuse
Foo Dog Statue | sentry | u | kw=push
Snake Charmer's Basket | sentry | c | kw=poison
Oil Lamp Brazier | sentry | c | kw=burn
Storm Kite | sentry | u | kw=stun
Sandstone Idol | sentry | c | kw=slow
Thunder Drum | sentry | c | kw=push
Burning Mirror | sentry | r | kw=burn

Overcharge | boon | c | boon=power
Galvanic Surge | boon | u | boon=power
Djinn's Bargain | boon | r | boon=pact
Wish of the Lamp | boon | l | boon=intervene
Desert Mirage | boon | u | boon=dodge
Sand Step | boon | c | boon=haste
Camel's Endurance | boon | c | boon=regen
Date Palm Oasis | boon | c | boon=heal
Mint Tea | boon | c | boon=heal
Hoard Fever | boon | u | boon=courage
Merchant's Luck | boon | c | boon=gauge
Aurum Potabile | boon | r | boon=regen
Lightning Step | boon | u | boon=phase
Horus's Watch | boon | r | boon=dodge

Leyden Jar Battery | charge | c | fx=bolt kw=stun
Baghdad Battery | charge | u | fx=bolt kw=stun
Copper Coil Spool | charge | c | fx=bolt kw=-
Bag of Dirhams | charge | c | fx=lob kw=push
Quiver of Sand Darts | charge | c | fx=bolt kw=slow
Venom Vials | charge | c | fx=bolt kw=poison
Scorpion Jar | charge | u | fx=lob kw=poison
Naphtha Grenades | charge | u | fx=lob kw=burn
Sling of Thunderstones | charge | c | fx=lob kw=stun
Alchemist's Bandolier | charge | u | fx=lob kw=poison
Sun-Glass Lenses | charge | c | fx=bolt kw=burn
Magnet Shot | charge | c | fx=bolt kw=pull
Thunderbolt Sheaf | charge | r | fx=bolt kw=stun
Golden Arrow Quiver | charge | u | fx=bolt kw=-
Bottled Sirocco | charge | u | fx=bolt kw=push
Ifrit Embers | charge | r | fx=lob kw=burn
Canopic Jars | charge | r | fx=lob kw=curse
Forty Thieves' Hoard | charge | l | fx=lob kw=drain

Astrolabe | utility | c | util=draw
Bazaar Haggle | utility | c | util=draw
Caravan Map | utility | c | util=draw
Transmutation | utility | u | util=copy
Djinn's Duplicate | utility | r | util=copy
Natron Salts | utility | u | util=cleanse
Open Sesame | utility | r | util=recall
Moneylender's Loan | utility | u | util=recall
Inventor's Codex | utility | r | util=draw

Pit of Gold Coins | trap | u | trap=snare kw=drain
Quicksand | trap | c | trap=snare kw=slow
Tripwire Spark | trap | c | trap=blast kw=stun
Scorpion Nest | trap | c | trap=spike kw=poison
Pressure Plate Darts | trap | c | trap=spike kw=poison
Tomb Boulder | trap | u | trap=blast kw=push
Antlion Pit | trap | u | trap=snare kw=pull
Shocking Floor Tiles | trap | c | trap=spike kw=stun
Djinn Bottle | trap | r | trap=snare kw=confuse
Collapsing Tomb Floor | trap | u | trap=blast kw=slow
Electrified Gold Idol | trap | r | trap=blast kw=stun
Cobra Basket Trap | trap | c | trap=spike kw=poison
Mirage Oasis | trap | u | trap=snare kw=confuse
Pharaoh's Curse Seal | trap | r | trap=blast kw=curse

Scorching Sun | environment | c | env=burn pattern=row
Salt Flats | environment | c | env=burn pattern=burst
Sahara Noon | environment | u | env=burn
Sandworm Burrows | environment | r | env=tremor pattern=column
Thunder Rumble | environment | c | env=tremor pattern=burst
Dune Shift | environment | c | env=tremor pattern=row
Lightning Field | environment | u | env=burn pattern=cross
Sun-Baked Wadi | environment | c | env=burn pattern=column
Storm Front | environment | u | env=tremor pattern=row
Great Sand Sea | environment | l | env=tremor

Lamp of the Bound Djinn | piece | l | kw=confuse
Crown of the Brass City | piece | l | kw=drain
Scale of the World Fish | piece | l | kw=push
Tail of the Manticore | piece | l | kw=poison
Heart of the Bronze Giant | piece | l | kw=stun

Thunder Raiju | summon | r | ai=shooter body=Raiju
Lamp Djinn | summon | r | ai=shooter body=Djinn
Ifrit | summon | r | ai=bomber body=Djinn mod=Dire
Ifrit Sultan | summon | l | ai=bomber body=Djinn mod=Ancient
Si'lat Shapeshifter | summon | u | ai=shooter body=Djinn mod=Sly
Dybbuk | summon | u | ai=bomber body=Spirit mod=Grim
Sand Scarab | summon | c | ai=guardian body=Scarab
Golden Scarab | summon | u | ai=healer body=Scarab mod=Lucky
Khepri's Dawn Beetle | summon | r | ai=healer body=Scarab mod=Noble
Desert Camel | summon | c | ai=guardian body=Camel
War Camel | summon | u | ai=guardian body=Camel mod=Brave
Manticore | summon | r | ai=shooter body=Manticore
Chimera | summon | r | ai=bomber body=Chimera
Emperor Scorpion | summon | u | ai=guardian body=Scorpion
Sand Scorpion | summon | c | ai=shooter body=Scorpion
Girtablilu Gatewarden | summon | r | ai=guardian body=Scorpion mod=Noble
Jackal Tomb Guard | summon | u | ai=guardian body=Jackal
Nile Crocodile | summon | c | ai=guardian body=Crocodile
Great River Crocodile | summon | r | ai=guardian body=Crocodile mod=Dire
Roc | summon | r | ai=bomber body=Roc
Simurgh | summon | l | ai=healer body=Simurgh
Great Sphinx | summon | l | ai=guardian body=Sphinx mod=Ancient
Riddling Sphinx | summon | r | ai=healer body=Sphinx mod=Clever
Bronze Automaton | summon | u | ai=guardian body=Automaton
Talos the Bronze Giant | summon | l | ai=guardian body=Automaton mod=Dire
Clockwork Falcon | summon | u | ai=shooter body=Hawk mod=Iron
Horus the Far-Seeing | summon | l | ai=shooter body=Hawk mod=Noble
Ibis Scribe | summon | c | ai=healer body=Hawk mod=Gentle
Frilled Lizard | summon | c | ai=shooter body=Lizard
Horned Viper | summon | c | ai=shooter body=Serpent
Uraeus Cobra | summon | u | ai=shooter body=Serpent mod=Noble
Plumed Serpent | summon | r | ai=bomber body=Serpent mod=Wild
Chupacabra | summon | u | ai=bomber body=Chupacabra
Foo Dog Sentinel | summon | u | ai=guardian body=Shishi mod=Loyal
Brass Foo Pup | summon | c | ai=guardian body=Shishi mod=Tiny
Bahamut | summon | l | ai=guardian body=Bahamut
Falak the Abyss Serpent | summon | l | ai=bomber body=Sandworm mod=Ancient
Sandworm | summon | r | ai=bomber body=Sandworm
Linen-Wrapped Sentinel | summon | u | ai=guardian body=Knight mod=Pale
Sand Golem | summon | c | ai=guardian body=Golem
Wandering Alchemist | summon | u | ai=healer body=Squire mod=Clever
Bedouin Raider | summon | c | ai=shooter body=Squire mod=Swift
Parthian Horse Archer | summon | u | ai=shooter body=Squire mod=Brave
Bazaar Pickpocket | summon | c | ai=bomber body=Goblin mod=Sly
Mamluk Lancer | summon | u | ai=guardian body=Knight
Persian Immortal | summon | r | ai=guardian body=Knight mod=Noble
Storm Imp | summon | c | ai=shooter body=Imp
Spark Sprite | summon | c | ai=shooter body=Sprite
Thunder Hawk | summon | c | ai=shooter body=Hawk
Coin-Hoard Dragon | summon | r | ai=guardian body=Dragon mod=Hungry

Ornithopter | machine | c | ai=repeater mach=Drone
Spiral Aerial Screw | machine | u | ai=repeater mach=Drone
Tesla Tower | machine | r | ai=turret mach=Tower
Voltaic Pile Turret | machine | c | ai=turret mach=Tower
Arc Gatling | machine | u | ai=repeater mach=Gatling
Brass Automaton Archer | machine | u | ai=turret mach=Automaton
Scorpio Bolt Thrower | machine | c | ai=turret mach=Ballista
Naphtha Siphon | machine | u | ai=turret mach=Engine
Desert Onager | machine | c | ai=mortar mach=Catapult
Caravan Mangonel | machine | u | ai=mortar mach=Trebuchet
Architronito | machine | r | ai=turret mach=Cannon
Zhuge Repeater | machine | u | ai=repeater mach=Repeater
Tortoise War Wagon | machine | r | ai=bulwark mach=Bulwark
Sandstone Rampart | machine | c | ai=bulwark mach=Rampart
Palm-Log Palisade | machine | c | ai=bulwark mach=Palisade
Bronze Barricade | machine | c | ai=bulwark mach=Barricade
Elephant Clock Automaton | machine | r | ai=turret mach=Automaton
Coin-Spitting Mortar | machine | c | ai=mortar mach=Cannon
Clockwork Flying Carpet | machine | r | ai=repeater mach=Drone
Hang-Glider Scout | machine | c | ai=repeater mach=Drone
The Thunder Engine | machine | l | ai=repeater mach=Engine
The Bronze Colossus | machine | l | ai=bulwark mach=Automaton
`,

/* ---------------- Black · Shadow: death, horror and dark magic ---------------- */
shadow:`
Bone Splinter | strike | c | shape=line kw=-
Gravedigger's Spade | strike | c | shape=dig kw=-
Miasma Wave | strike | c | shape=row kw=poison
Mold Spore Volley | strike | c | shape=missiles kw=poison
Acid Vial Splash | strike | c | shape=wedge kw=poison
Evil Eye | strike | c | shape=line kw=curse
Hook and Chain | strike | c | shape=line kw=pull
Crow Swarm | strike | c | shape=missiles kw=-
Creeping Fog | strike | c | shape=row kw=confuse
Spider Silk Shot | strike | c | shape=zigzag kw=slow
Bog Muck Splash | strike | c | shape=row kw=slow
Yurei's Lament | strike | c | shape=zigzag kw=confuse
Banshee Wail | strike | u | shape=wedge kw=confuse
Strigoi Bite | strike | u | shape=line kw=drain
Plague Breath | strike | u | shape=wedge kw=poison
Hellfire Lash | strike | u | shape=zigzag kw=burn
Gallows Rope | strike | u | shape=line kw=pull
Raven of Ill Omen | strike | u | shape=diag kw=curse
Moonlit Rake | strike | u | shape=wedge kw=valor
Bloodletting Blade | strike | u | shape=line kw=self
Web Spray | strike | u | shape=wedge kw=slow
Jiangshi Hop | strike | u | shape=dig kw=stun
Asanbosam Hook | strike | u | shape=line kw=pull
Hellhound Howl | strike | u | shape=wedge kw=push
Infernal Brand | strike | r | shape=line kw=self
Reaper's Scythe | strike | r | shape=wedge kw=-
Danse Macabre | strike | r | shape=all kw=confuse
Onryo's Grudge | strike | r | shape=diag kw=curse
Manananggal Swoop | strike | r | shape=dig kw=drain
Mara's Ride | strike | r | shape=zigzag kw=confuse
Death Card | strike | r | shape=all kw=-
Wild Hunt of the Dead | strike | l | shape=all kw=confuse
Gashadokuro's Fist | strike | l | shape=dig kw=stun
Maw of the Abyss | strike | l | shape=wedge kw=self

Plague Flask | lob | c | pattern=single kw=poison
Skull Bomb | lob | c | pattern=single kw=-
Grave Dirt Handful | lob | c | pattern=burst kw=curse
Hex Bag | lob | c | pattern=single kw=curse
Bat Cloud | lob | c | pattern=burst kw=drain
Swamp Gas Bubble | lob | c | pattern=burst kw=burn
Ossuary Urn | lob | c | pattern=column kw=-
Cauldron Spill | lob | u | pattern=burst kw=poison
Witch's Brew Toss | lob | u | pattern=cross kw=poison
Coffin Drop | lob | u | pattern=single kw=stun
Spider Egg Sac | lob | u | pattern=burst kw=slow
Funeral Wreath | lob | u | pattern=ring kw=curse
Brimstone Hail | lob | u | pattern=column kw=burn
The Tower Card | lob | r | pattern=column kw=stun
Pox Cloud | lob | r | pattern=ring kw=poison
Bottled Nightmare | lob | r | pattern=cross kw=confuse
Black Death | lob | l | pattern=ring kw=poison

Skull-Topped Fence | ward | c | ward=wall
Coffin Lid | ward | c | ward=barrier
Cobweb Veil | ward | c | ward=barrier
Hook Fence | ward | c | ward=thorns
Beetle Carapace | ward | c | ward=barrier
Lead-Lined Coffin | ward | u | ward=barrier
Ossuary Wall | ward | u | ward=wall
Crypt Door | ward | u | ward=wall
Demon Hide | ward | u | ward=barrier
Shroud of Fog | ward | u | ward=barrier
Iron Maiden Shell | ward | r | ward=thorns
Barrow Mound | ward | r | ward=wall
Hell's Gate | ward | l | ward=thorns

Skull Lantern | sentry | c | kw=-
Stingy Jack's Lantern | sentry | c | kw=burn
Crow Perch | sentry | c | kw=-
Will-o'-the-Wisp | sentry | c | kw=confuse
Rot Censer | sentry | c | kw=poison
Bone Totem | sentry | c | kw=-
Pin Doll | sentry | u | kw=curse
Gallows Tree | sentry | u | kw=pull
Bubbling Cauldron | sentry | u | kw=poison
Spider Nest | sentry | u | kw=slow
Blood Fountain | sentry | r | kw=drain
Cursed Mirror | sentry | r | kw=confuse

Shadow Step | boon | c | boon=dodge
Bat Form | boon | c | boon=haste
Black Cat's Luck | boon | c | boon=dodge
Sip of Blood | boon | c | boon=heal
Embalming Salts | boon | c | boon=regen
Ritual Candles | boon | c | boon=gauge
Demon's Bargain | boon | u | boon=pact
Witching Hour | boon | u | boon=courage
Mist Form | boon | u | boon=phase
Full Moon Frenzy | boon | u | boon=power
Blood Moon | boon | r | boon=power
Crossroads Bargain | boon | r | boon=pact
Undying Will | boon | r | boon=intervene
Infernal Contract | boon | l | boon=pact

Bag of Teeth | charge | c | fx=bolt kw=-
Coffin Nails | charge | c | fx=bolt kw=-
Spider Fangs | charge | c | fx=bolt kw=poison
Bone Darts | charge | c | fx=bolt kw=-
Belfry Bats | charge | c | fx=bolt kw=drain
Crow Feathers | charge | c | fx=bolt kw=-
Nightshade Berries | charge | c | fx=bolt kw=poison
Jar of Carrion Beetles | charge | c | fx=lob kw=-
Plague Vials | charge | u | fx=lob kw=poison
Leech Jar | charge | u | fx=bolt kw=drain
Mold Jars | charge | u | fx=lob kw=poison
Dungeon Chains | charge | u | fx=bolt kw=pull
Mandrake Roots | charge | u | fx=lob kw=stun
Ferryman's Coins | charge | u | fx=bolt kw=curse
Hellfire Embers | charge | r | fx=lob kw=burn
Banshee's Comb | charge | r | fx=bolt kw=confuse
Vampire Fang Necklace | charge | r | fx=bolt kw=drain
Pandora's Jar | charge | l | fx=lob kw=curse

Three-Card Reading | utility | c | util=draw
Casting the Bones | utility | c | util=draw
Grave Robbing | utility | c | util=recall
Tarot Spread | utility | u | util=draw
Seance | utility | u | util=recall
Plague Doctor's Tonic | utility | u | util=cleanse
Raise the Dead | utility | r | util=recall
Doppelganger | utility | r | util=copy
Necromancer's Grimoire | utility | l | util=copy

Rusted Mantrap | trap | c | trap=spike kw=-
Open Grave | trap | c | trap=snare kw=-
Sucking Bog | trap | u | trap=snare kw=slow
Trapdoor Spider Lair | trap | u | trap=snare kw=poison
Plague Mine | trap | u | trap=blast kw=poison
Rigged Coffin | trap | c | trap=blast kw=-
Oubliette | trap | r | trap=snare kw=stun
The Hanged Man | trap | r | trap=snare kw=pull
Cursed Tomb | trap | r | trap=blast kw=curse

Haunted Bog | environment | c | env=bramble pattern=burst
Graveyard Fog | environment | c | env=bramble pattern=row
Webbed Hollow | environment | c | env=bramble pattern=cross
Graveyard Chill | environment | c | env=freeze pattern=row
Restless Graves | environment | u | env=tremor pattern=burst
Hellfire Rift | environment | u | env=burn pattern=column
Acid Rain | environment | u | env=burn pattern=row
Draugr's Barrow Frost | environment | u | env=freeze pattern=burst
Witch's Thicket | environment | c | env=bramble pattern=column
Catacomb Collapse | environment | r | env=tremor pattern=row
Mouth of Hell | environment | l | env=burn pattern=burst

Crown of the Lich King | piece | l | kw=curse
Fang of the First Vampire | piece | l | kw=drain
Candle of the Hanged Man | piece | l | kw=stun
Cauldron of the Bone Mother | piece | l | kw=poison
Mask of the Plague Doctor | piece | l | kw=mend

Skeleton Warrior | summon | c | ai=guardian body=Skeleton
Skeleton Archer | summon | c | ai=shooter body=Skeleton
Bone Rattler | summon | c | ai=bomber body=Skeleton mod=Scrappy
Shambling Zombie | summon | c | ai=guardian body=Zombie
Plague Zombie | summon | c | ai=bomber body=Zombie mod=Hungry
Ghoul | summon | c | ai=bomber body=Ghoul
Poltergeist | summon | c | ai=bomber body=Ghost mod=Scrappy
Vampire Thrall | summon | c | ai=guardian body=Vampire mod=Scrappy
Vampire Bat | summon | c | ai=shooter body=Bat mod=Hungry
Tokoloshe | summon | c | ai=bomber body=Imp mod=Sly
Adze | summon | c | ai=shooter body=Moth mod=Tiny
Night-Pack Wolf | summon | c | ai=bomber body=Wolf mod=Grim
Cave Spider | summon | c | ai=shooter body=Spider
Death's-Head Moth | summon | c | ai=shooter body=Moth
Carrion Beetle | summon | c | ai=guardian body=Beetle mod=Mossy
Cave Centipede | summon | c | ai=bomber body=Centipede
Plague Rat | summon | c | ai=bomber body=Rat mod=Mossy
Bog Leech | summon | c | ai=healer body=Leech
Gravedigger | summon | c | ai=guardian body=Squire mod=Old
Dungeon Jailer | summon | c | ai=guardian body=Ogre mod=Iron
Brimstone Imp | summon | c | ai=bomber body=Imp
Murder of Crows | summon | c | ai=shooter body=Crow
Witch's Toad | summon | c | ai=healer body=Toad mod=Mossy
Black Cat Familiar | summon | c | ai=shooter body=Cat
Haugbui | summon | u | ai=guardian body=Skeleton mod=Old
Jiangshi | summon | u | ai=guardian body=Jiangshi
Nachzehrer | summon | u | ai=shooter body=Ghoul mod=Hungry
Yurei | summon | u | ai=shooter body=Ghost mod=Pale
Vetala | summon | u | ai=shooter body=Ghost mod=Clever
Mara | summon | u | ai=shooter body=Ghost mod=Sly
Pontianak | summon | u | ai=bomber body=Banshee mod=Sly
Bog Revenant | summon | u | ai=guardian body=Zombie mod=Mossy
Loup-Garou | summon | u | ai=bomber body=Werewolf mod=Wild
Bayou Rougarou | summon | u | ai=guardian body=Werewolf mod=Mossy
Barghest | summon | u | ai=guardian body=Hound mod=Feral
Black Cadejo | summon | u | ai=bomber body=Hound mod=Grim
Night Mare | summon | u | ai=bomber body=Nightmare
Black Widow | summon | u | ai=bomber body=Spider mod=Grim
Bog Witch | summon | u | ai=healer body=Witch mod=Mossy
Plague Doctor | summon | u | ai=healer body=Plaguemask
Necromancer | summon | u | ai=shooter body=Witch mod=Clever
Horned Night Visitor | summon | u | ai=bomber body=Demon mod=Feral
Omen Raven | summon | u | ai=shooter body=Crow mod=Clever
Draugr | summon | r | ai=guardian body=Zombie mod=Ancient
Onryo | summon | r | ai=bomber body=Ghost mod=Grim
Bean Sidhe | summon | r | ai=shooter body=Banshee
Lich | summon | r | ai=shooter body=Lich
Ankou | summon | r | ai=bomber body=Reaper mod=Old
Strigoi | summon | r | ai=shooter body=Vampire mod=Pale
Aswang | summon | r | ai=bomber body=Werewolf mod=Sly
Manananggal | summon | r | ai=bomber body=Bat mod=Grim
Asanbosam | summon | r | ai=guardian body=Vampire mod=Feral
Werewolf | summon | r | ai=guardian body=Werewolf
Black Shuck | summon | r | ai=bomber body=Hound mod=Dire
Antlered Hunger | summon | r | ai=bomber body=Gaunt mod=Hungry
Jorogumo | summon | r | ai=shooter body=Spider mod=Sly
Rat King | summon | r | ai=guardian body=Rat mod=Dire
Black Annis | summon | r | ai=bomber body=Witch mod=Grim
Pit Fiend | summon | r | ai=guardian body=Demon
Rakshasa | summon | r | ai=shooter body=Demon mod=Sly
Morrigan's Raven | summon | r | ai=shooter body=Crow mod=Ancient
Gashadokuro | summon | l | ai=guardian body=Skeleton mod=Dire
La Llorona | summon | l | ai=shooter body=Banshee mod=Pale
Dullahan | summon | l | ai=guardian body=Knight mod=Grim
Grim Reaper | summon | l | ai=guardian body=Reaper mod=Ancient
Baba Yaga | summon | l | ai=healer body=Witch mod=Ancient
The Erlking | summon | l | ai=shooter body=Spirit mod=Pale

Bone Ballista | machine | c | ai=turret mach=Ballista
Skull Catapult | machine | c | ai=mortar mach=Catapult
Torture Rack | machine | u | ai=bulwark mach=Barricade
Coffin Cannon | machine | u | ai=turret mach=Cannon
Plague Trebuchet | machine | u | ai=mortar mach=Trebuchet
Iron Maiden | machine | r | ai=bulwark mach=Bastion
Gibbet Tower | machine | r | ai=turret mach=Tower
Hut on Chicken Legs | machine | l | ai=mortar mach=Automaton
`,


/* ---------------- White · Light: knowledge, faith, safety and human achievement ---------------- */
light:`
Pilum Volley | strike | c | shape=missiles kw=-
Gladius Thrust | strike | c | shape=line kw=-
Lance Charge | strike | c | shape=dig kw=valor
Crusader's Charge | strike | u | shape=dig kw=valor
Longbow Volley | strike | c | shape=missiles kw=-
Agincourt Arrowstorm | strike | r | shape=missiles kw=-
West Wind Gust | strike | c | shape=row kw=push
Zephyr's Breath | strike | c | shape=wedge kw=push
Mistral Gale | strike | u | shape=all kw=push
Owl's Silent Dive | strike | c | shape=line kw=stun
Pegasus Hoofbeat | strike | u | shape=diag kw=push
Centaur's Arrow | strike | c | shape=line kw=-
Unicorn Horn Thrust | strike | u | shape=line kw=mend
Aegis Bash | strike | u | shape=wedge kw=stun
Starlight Lance | strike | u | shape=line kw=burn
Astrolabe Sightline | strike | c | shape=diag kw=-
Bright Comet | strike | r | shape=zigzag kw=burn
Gavel of Justice | strike | c | shape=line kw=stun
Shield Bash | strike | c | shape=line kw=stun
Phalanx Advance | strike | u | shape=row kw=push
Crane Wing Sweep | strike | c | shape=wedge kw=slow
Qilin's Flame | strike | r | shape=wedge kw=burn
White Stag's Antlers | strike | u | shape=dig kw=push
Simurgh Feather Gust | strike | r | shape=all kw=push
Paladin's Oath Blade | strike | r | shape=line kw=valor
Martyr's Last Stand | strike | r | shape=all kw=self
Riddle of the Sphinx | strike | r | shape=missiles kw=confuse
Scholar's Paradox | strike | c | shape=zigzag kw=confuse
Marble Shard Spray | strike | c | shape=wedge kw=slow
Valkyrie's Descent | strike | r | shape=diag kw=valor
Durandal's Stroke | strike | l | shape=line kw=valor
Excalibur's Arc | strike | l | shape=wedge kw=valor

Mortar of Bricks | lob | c | pattern=single kw=slow
Font of Blessed Water | lob | c | pattern=burst kw=mend
Incense Censer | lob | u | pattern=burst kw=confuse
Falling Masonry | lob | u | pattern=column kw=stun
Onager Stone | lob | c | pattern=single kw=stun
Toppled Marble Column | lob | u | pattern=column kw=slow
Falling Star | lob | c | pattern=single kw=burn
Alchemist's Flask | lob | c | pattern=burst kw=-
Salve Jar | lob | c | pattern=burst kw=mend
Quicksilver Retort | lob | u | pattern=burst kw=poison
Abbey Bell Toll | lob | u | pattern=ring kw=stun
Slinger's Hail | lob | c | pattern=row kw=-
Southern Cross Starfall | lob | r | pattern=cross kw=burn
Downdraft | lob | u | pattern=column kw=push
Owl Pellet | lob | c | pattern=single kw=-
Siege Stone of Acre | lob | r | pattern=burst kw=push

Kite Shield | ward | c | ward=barrier
Tower Shield | ward | c | ward=barrier
Marble Wall | ward | c | ward=wall
Brick Rampart | ward | c | ward=wall
Cloister Arches | ward | c | ward=wall
Spiked Pavise | ward | c | ward=thorns
Chevaux-de-Frise | ward | c | ward=thorns
Testudo Formation | ward | u | ward=barrier
Castle Portcullis | ward | u | ward=wall
Shieldwall of the Fyrd | ward | u | ward=barrier
Sheltering Wings | ward | u | ward=barrier
Hadrian's Wall | ward | r | ward=wall
Sacsayhuaman Stones | ward | r | ward=wall
Great Zimbabwe Walls | ward | r | ward=wall
Ishtar Gate | ward | r | ward=wall
White Heron Castle | ward | r | ward=wall
Aegis of Athena | ward | l | ward=barrier
Theodosian Walls | ward | l | ward=wall

Harbor Lighthouse | sentry | c | kw=-
Arrow-Slit Tower | sentry | c | kw=-
Owl on the Parapet | sentry | c | kw=-
Windmill of La Mancha | sentry | c | kw=push
Weathervane Cockerel | sentry | c | kw=push
Wayside Shrine | sentry | c | kw=mend
Bell Tower | sentry | u | kw=stun
Stone Lions of Delos | sentry | u | kw=-
Obelisk of the Sun | sentry | u | kw=burn
Caracol Observatory | sentry | u | kw=slow
Lamassu Gate Statue | sentry | r | kw=stun
Pharos of Alexandria | sentry | l | kw=burn

Knight's Vigil | boon | c | boon=courage
Oath of Fealty | boon | c | boon=power
Westerly Breeze | boon | c | boon=haste
Owl's Foresight | boon | c | boon=dodge
Physician's Balm | boon | c | boon=heal
Herbal Poultice | boon | c | boon=regen
Vigil Candle | boon | c | boon=gauge
Rally the Legion | boon | u | boon=courage
Pegasus Flight | boon | u | boon=dodge
Crusader's Vow | boon | u | boon=pact
Sushruta's Stitches | boon | u | boon=heal
Angelic Veil | boon | r | boon=phase
Valkyrie's Reprieve | boon | r | boon=intervene

Swan-Feather Quiver | charge | c | fx=bolt kw=-
Legionary's Javelins | charge | c | fx=bolt kw=push
Yew Longbow Quiver | charge | c | fx=bolt kw=-
Holy Water Vials | charge | c | fx=lob kw=mend
Huaraca Stones | charge | c | fx=bolt kw=stun
Brick Hod | charge | c | fx=lob kw=slow
Salve Tin | charge | c | fx=lob kw=mend
Owl-Feather Darts | charge | c | fx=bolt kw=-
Tesserae Pouch | charge | c | fx=bolt kw=-
Genoese Crossbow Bolts | charge | u | fx=bolt kw=push
Censer Coals | charge | u | fx=lob kw=burn
Sealed Edict Scrolls | charge | u | fx=lob kw=stun
Silver Arrows of the Hunt | charge | u | fx=bolt kw=-
Apothecary's Vials | charge | u | fx=lob kw=-
Bag of Winds | charge | r | fx=bolt kw=push
Thousand Paper Cranes | charge | r | fx=bolt kw=slow
Burning Lens of Archimedes | charge | r | fx=bolt kw=burn
Arrows of Heracles | charge | l | fx=bolt kw=poison

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

Roman Caltrops | trap | c | trap=spike kw=slow
Drawbridge Slam | trap | c | trap=blast kw=stun
Gladiator's Net | trap | c | trap=snare kw=slow
Sunfire Glyph | trap | c | trap=blast kw=burn
Lilia Pits | trap | u | trap=spike kw=-
Murder Hole | trap | u | trap=blast kw=burn
Riddle at the Gate | trap | u | trap=snare kw=confuse
Tomb Builder's Pitfall | trap | u | trap=spike kw=-
Daedalus's Snare | trap | r | trap=snare kw=pull

Noon Sun on Marble | environment | c | env=burn pattern=row
Hedge Maze | environment | c | env=bramble pattern=cross
Monastery Herb Garden | environment | c | env=bramble pattern=burst
Marble Quarry | environment | c | env=tremor pattern=column
Pure Snowfield | environment | c | env=freeze pattern=burst
Consecrated Ground | environment | u | env=burn pattern=burst
Rose Garden of Shiraz | environment | u | env=bramble pattern=row
Collapsing Colonnade | environment | r | env=tremor pattern=row
Hanging Gardens of Babylon | environment | l | env=bramble pattern=burst

Crown of the Round Table | piece | l | kw=valor
Grail of the Fisher King | piece | l | kw=mend
Stone of the Philosophers | piece | l | kw=-
Bridle of the Pegasus | piece | l | kw=push
Scales of the Final Judge | piece | l | kw=stun

Pegasus Foal | summon | c | ai=healer body=Pegasus mod=Tiny
Pegasus | summon | r | ai=shooter body=Pegasus mod=Noble
Centaur Archer | summon | u | ai=shooter body=Centaur
Chiron, Healer of Heroes | summon | l | ai=healer body=Centaur mod=Ancient
White Unicorn | summon | r | ai=healer body=Unicorn mod=Pale
White Stag | summon | u | ai=guardian body=Stag mod=Pale
Snow Crane | summon | c | ai=shooter body=Crane
Thousand-Year Crane | summon | r | ai=healer body=Crane mod=Ancient
Barn Owl | summon | c | ai=shooter body=Owl
Owl of Athena | summon | u | ai=shooter body=Owl mod=Clever
White Wolf | summon | c | ai=guardian body=Wolf mod=Pale
White Wolf Matriarch | summon | r | ai=guardian body=Wolf mod=Noble
Talbot Hound | summon | c | ai=bomber body=Hound mod=Loyal
Royal Gyrfalcon | summon | c | ai=shooter body=Hawk mod=Pale
Heraldic Griffin | summon | u | ai=guardian body=Griffin mod=Noble
Lamassu | summon | r | ai=guardian body=Lamassu
Guardian Sphinx of Giza | summon | u | ai=shooter body=Sphinx mod=Clever
Great Sphinx of Giza | summon | l | ai=guardian body=Sphinx mod=Ancient
White Elephant | summon | r | ai=healer body=Elephant mod=Pale
Hannibal's War Elephant | summon | r | ai=guardian body=Elephant mod=Brave
Qilin | summon | l | ai=healer body=Qilin
Valkyrie Herald | summon | u | ai=shooter body=Valkyrie mod=Swift
Valkyrie Shieldmaiden | summon | r | ai=guardian body=Valkyrie
Cherub | summon | c | ai=healer body=Angel mod=Tiny
Guardian Angel | summon | u | ai=healer body=Angel
Forbidden City Lion | summon | u | ai=guardian body=Shishi mod=Stone
Rose-Garden Simurgh | summon | l | ai=healer body=Phoenix mod=Ancient
Sylph of the Gale | summon | c | ai=bomber body=Sprite mod=Swift
Roman Legionary | summon | c | ai=guardian body=Knight mod=Iron
Centurion | summon | u | ai=guardian body=Knight mod=Old
Crusader Knight | summon | u | ai=guardian body=Knight mod=Brave
Knight of the Round Table | summon | r | ai=guardian body=Knight mod=Noble
Sir Galahad, the Pure | summon | l | ai=guardian body=Knight mod=Pale
El Cid Campeador | summon | l | ai=guardian body=Knight mod=Noble
Longbowman | summon | c | ai=shooter body=Squire mod=Loyal
Inca Stonemason | summon | c | ai=guardian body=Squire mod=Stone
Village Physician | summon | c | ai=healer body=Cleric mod=Gentle
Battle Cleric | summon | c | ai=bomber body=Cleric mod=Brave
Vaidya of Taxila | summon | u | ai=healer body=Cleric mod=Gentle
Hanlin Academy Scribe | summon | c | ai=shooter body=Scholar
Persian Astronomer | summon | u | ai=shooter body=Scholar mod=Clever
Astronomer of Copan | summon | u | ai=shooter body=Scholar mod=Old
Imhotep the Builder | summon | l | ai=healer body=Scholar mod=Ancient
Terracotta Warrior | summon | u | ai=guardian body=Golem mod=Stone
Talos, the Bronze Guard | summon | r | ai=guardian body=Golem mod=Iron

Roman Ballista | machine | c | ai=turret mach=Ballista
Legion Scorpio Engine | machine | c | ai=turret mach=Crossbow
Mangonel | machine | c | ai=mortar mach=Catapult
Battering Ram | machine | c | ai=bulwark mach=Engine
Wicker Mantlet | machine | c | ai=bulwark mach=Barricade
Legion Camp Palisade | machine | c | ai=bulwark mach=Palisade
Curtain Wall Rampart | machine | c | ai=bulwark mach=Rampart
Norman Keep | machine | c | ai=bulwark mach=Bulwark
Onager Catapult | machine | u | ai=mortar mach=Catapult
Counterweight Trebuchet | machine | u | ai=mortar mach=Trebuchet
Zhuge Nu Repeater | machine | u | ai=repeater mach=Repeater
Siege Tower | machine | u | ai=bulwark mach=Tower
Motte-and-Bailey Palisade | machine | u | ai=bulwark mach=Palisade
Marble Bastion | machine | u | ai=bulwark mach=Bastion
Turtle Ship Bulwark | machine | u | ai=bulwark mach=Bulwark
Hero's Automaton | machine | u | ai=turret mach=Automaton
Kite of Han Xin | machine | u | ai=repeater mach=Drone
Polybolos | machine | r | ai=repeater mach=Repeater
Helepolis | machine | r | ai=bulwark mach=Tower
Star Fort Bastion | machine | r | ai=bulwark mach=Bastion
Claw of Archimedes | machine | r | ai=turret mach=Engine
Al-Jazari's Automaton | machine | r | ai=repeater mach=Automaton
Su Song's Clock Tower | machine | r | ai=turret mach=Tower
Warwolf Trebuchet | machine | l | ai=mortar mach=Trebuchet
Krak des Chevaliers | machine | l | ai=bulwark mach=Bastion
`,


/* ---------------- Green · Verdant: nature, the forest and the wild ---------------- */
verdant:`
Hunter's Longbow Shot | strike | c | shape=line kw=-
Yew Arrow | strike | c | shape=line kw=-
Woodsman's Throwing Axe | strike | c | shape=line kw=-
Atlatl Dart | strike | c | shape=line kw=-
Bear Swipe | strike | c | shape=wedge kw=-
Volley of the Greenwood | strike | u | shape=missiles kw=-
Outlaw's Split Arrow | strike | u | shape=diag kw=-
Jaguar Pounce | strike | u | shape=diag kw=-
Tiger's Rake | strike | r | shape=wedge kw=-
Army Ant March | strike | r | shape=all kw=-
Blowgun Dart | strike | c | shape=line kw=poison
Viper Strike | strike | c | shape=line kw=poison
Cobra Venom Spray | strike | u | shape=wedge kw=poison
Hornet Swarm | strike | u | shape=missiles kw=poison
Komodo Bite | strike | u | shape=line kw=drain
Curare Needle | strike | u | shape=line kw=slow
Creeping Ivy | strike | c | shape=row kw=slow
Root Grasp | strike | c | shape=dig kw=slow
Anaconda Squeeze | strike | r | shape=line kw=slow
Liana Whip | strike | c | shape=zigzag kw=pull
Strangler Fig | strike | u | shape=row kw=pull
Will-o'-Wisp Lure | strike | u | shape=zigzag kw=pull
Stag Leap | strike | c | shape=diag kw=push
Grizzly Charge | strike | u | shape=dig kw=push
Moose Antler Rush | strike | u | shape=dig kw=push
Highland Caber Toss | strike | r | shape=line kw=push
Tanuki Leaf Trick | strike | c | shape=zigzag kw=confuse
Ratatoskr's Insult | strike | c | shape=zigzag kw=confuse
Leshy's Wrong Turn | strike | u | shape=zigzag kw=confuse
Curupira's Backward Trail | strike | r | shape=zigzag kw=confuse
Pan's Panic Pipes | strike | r | shape=all kw=confuse
Monkey Coconut Toss | strike | c | shape=zigzag kw=stun
Elf-Shot | strike | u | shape=line kw=stun
Mapinguari Roar | strike | r | shape=wedge kw=stun
Druid's Golden Sickle | strike | c | shape=line kw=mend
Ride of the Wild Hunt | strike | l | shape=missiles kw=drain
Green Knight's Axe | strike | l | shape=wedge kw=valor
Caledfwlch | strike | l | shape=line kw=valor

Wasp Nest | lob | c | pattern=burst kw=poison
Squirting Cucumber | lob | c | pattern=cross kw=poison
Bog Belch | lob | u | pattern=burst kw=poison
Dart Frog Leap | lob | u | pattern=single kw=poison
Rafflesia Bloom | lob | r | pattern=ring kw=poison
Coconut Drop | lob | c | pattern=single kw=stun
Falling Deadwood | lob | c | pattern=single kw=stun
Felled Oak | lob | r | pattern=column kw=stun
Pinecone Shower | lob | c | pattern=cross kw=-
Acorn Rain | lob | c | pattern=ring kw=-
Seed Pod Barrage | lob | c | pattern=row kw=-
Sticky Sap Glob | lob | c | pattern=burst kw=slow
Wild Honeycomb Hurl | lob | u | pattern=burst kw=slow
Kapok Fluff Burst | lob | u | pattern=burst kw=confuse
Toadstool Ring | lob | u | pattern=ring kw=confuse
Sasquatch Boulder | lob | u | pattern=single kw=push
Treefolk Stomp | lob | u | pattern=column kw=push
Mokele-mbembe's Wake | lob | r | pattern=row kw=push
Fall of the Great Ceiba | lob | l | pattern=row kw=stun

Hawthorn Hedge | ward | c | ward=thorns
Holly Thicket | ward | c | ward=thorns
Briar Rose Hedge | ward | u | ward=thorns
Stacked Log Wall | ward | c | ward=wall
Strangler Fig Roots | ward | u | ward=wall
Living Hedge Maze | ward | r | ward=wall
Baobab Bulwark | ward | r | ward=wall
Turtle Shell Guard | ward | c | ward=barrier
Bear Hide Cloak | ward | c | ward=barrier
Moss Mantle | ward | c | ward=barrier
Oak Heartwood Shield | ward | u | ward=barrier
Ghillie Suit | ward | u | ward=barrier
Pangolin Scales | ward | u | ward=barrier
Green Chapel Gate | ward | l | ward=wall

Pitcher Plant | sentry | c | kw=poison
Sundew Patch | sentry | c | kw=slow
Venus Flytrap | sentry | c | kw=pull
Beltane Maypole | sentry | c | kw=mend
Puffball Sentinel | sentry | c | kw=confuse
Carved Stag Post | sentry | c | kw=push
Treehouse Archer Post | sentry | u | kw=-
Hornet Hive | sentry | u | kw=poison
Whispering Oak | sentry | u | kw=confuse
Druid's Standing Stone | sentry | u | kw=stun
Weeping Willow | sentry | r | kw=slow
Mandrake Patch | sentry | r | kw=stun

Bear's Might | boon | c | boon=power
Stag's Grace | boon | c | boon=haste
Chameleon Skin | boon | c | boon=dodge
Wild Herb Poultice | boon | c | boon=heal
Willow Bark Tea | boon | c | boon=regen
Mistletoe Sprig | boon | c | boon=gauge
Shaman's Vision Quest | boon | u | boon=gauge
Wolfskin Frenzy | boon | u | boon=pact
Fern Seed Vanishing | boon | u | boon=phase
Green Man's Blessing | boon | u | boon=courage
Tapio's Favour | boon | r | boon=power
Demeter's Bounty | boon | r | boon=heal
Green Knight's Girdle | boon | l | boon=intervene

Quiver of Yew Arrows | charge | c | fx=bolt kw=-
Fletcher's Bundle | charge | c | fx=bolt kw=-
Acorn Sack | charge | c | fx=lob kw=-
Chestnut Basket | charge | c | fx=lob kw=stun
Hunter's Sling Pouch | charge | c | fx=bolt kw=stun
Poison Dart Pouch | charge | c | fx=bolt kw=poison
Herb Bundle | charge | c | fx=bolt kw=mend
Monkey's Fruit Stash | charge | c | fx=lob kw=confuse
Seed Satchel | charge | c | fx=lob kw=slow
Hornet Jar | charge | u | fx=bolt kw=poison
Mushroom Basket | charge | u | fx=lob kw=poison
Bola Set | charge | u | fx=bolt kw=slow
Gourd of Pine Sap | charge | u | fx=lob kw=slow
Marsh Leech Pouch | charge | u | fx=bolt kw=drain
Elven Moonshaft Quiver | charge | r | fx=bolt kw=-
Silver Arrow Prize | charge | r | fx=bolt kw=-
Annwn Hunting Quiver | charge | r | fx=bolt kw=drain
Horn of Plenty | charge | l | fx=lob kw=mend

Tracker's Instinct | utility | c | util=draw
Forest Spring | utility | c | util=cleanse
Squirrel's Cache | utility | c | util=recall
Snakeroot Remedy | utility | u | util=cleanse
Ogham Staves | utility | u | util=draw
Mycelium Network | utility | u | util=copy
Lyrebird Mimicry | utility | r | util=copy
Anansi's Bag of Tales | utility | r | util=draw

Hunter's Net | trap | c | trap=snare kw=-
Root Tripwire | trap | c | trap=snare kw=pull
Bear Pit | trap | c | trap=spike kw=-
Punji Stakes | trap | c | trap=spike kw=poison
Stinkhorn Patch | trap | c | trap=blast kw=poison
Pitfall of Thorns | trap | u | trap=spike kw=-
Deadfall | trap | u | trap=blast kw=stun
Fairy Ring | trap | u | trap=snare kw=confuse
Peat Bog Mire | trap | u | trap=snare kw=slow
Giant Puffball | trap | u | trap=blast kw=confuse
Strangler Vine Snare | trap | r | trap=snare kw=pull
Pixie-Led Path | trap | r | trap=snare kw=confuse

Bramble Thicket | environment | c | env=bramble pattern=burst
Tangled Undergrowth | environment | c | env=bramble pattern=row
Kudzu Spread | environment | c | env=bramble pattern=cross
Heather Moor | environment | c | env=bramble pattern=row
Rainforest Canopy | environment | u | env=bramble pattern=cross
Mire of the Fens | environment | u | env=bramble pattern=column
Stampede | environment | u | env=tremor pattern=row
Birnam Wood Marches | environment | r | env=tremor pattern=column
Ent Moot | environment | r | env=tremor pattern=burst
Primeval Wildwood | environment | l | env=bramble pattern=burst

Antlers of the Forest King | piece | l | kw=push
Seed of the World Ash | piece | l | kw=mend
Horn of the Wild Hunt | piece | l | kw=drain
Pipes of the Goat-Footed | piece | l | kw=confuse
Pelt of the Jaguar King | piece | l | kw=-
Mask of the Green Man | piece | l | kw=slow

Elder Ent | summon | r | ai=guardian body=Ent mod=Ancient
Jack-in-the-Green | summon | r | ai=guardian body=Ent mod=Mossy
Leshy of the Birchwood | summon | r | ai=guardian body=Leshy
Kodama | summon | c | ai=healer body=Kodama
Oak Dryad | summon | u | ai=healer body=Fairy mod=Gentle
Pixie Swarm | summon | c | ai=shooter body=Fairy mod=Tiny
Robin Goodfellow | summon | r | ai=shooter body=Fairy mod=Sly
Queen Mab | summon | l | ai=healer body=Fairy mod=Noble
Will-o'-Wisp | summon | c | ai=bomber body=Spirit mod=Pale
Faun Reveler | summon | c | ai=healer body=Satyr mod=Lucky
Elven Pathfinder | summon | c | ai=shooter body=Elf
Patupaiarehe Mist Folk | summon | u | ai=shooter body=Elf mod=Sly
Curupira | summon | r | ai=shooter body=Elf mod=Wild
Chullachaqui | summon | u | ai=bomber body=Duende mod=Sly
Alux Field Keeper | summon | c | ai=guardian body=Duende mod=Mossy
Grove Druid | summon | c | ai=healer body=Druid
Rainforest Curandero | summon | u | ai=healer body=Druid mod=Wild
Archdruid of the Oaks | summon | r | ai=healer body=Druid mod=Ancient
Greenwood Outlaw | summon | c | ai=shooter body=Squire mod=Sly
Hooded Outlaw Captain | summon | r | ai=shooter body=Squire mod=Clever
Mountain Man Trapper | summon | c | ai=guardian body=Squire mod=Scrappy
Sir Gawain | summon | r | ai=guardian body=Knight mod=Brave
The Green Knight | summon | l | ai=guardian body=Knight mod=Mossy
Arthur, the Once King | summon | l | ai=guardian body=Knight mod=Noble
Gwyn ap Nudd | summon | l | ai=shooter body=Knight mod=Pale
Cwn Annwn Hound | summon | u | ai=bomber body=Hound mod=Pale
Herne the Hunter | summon | l | ai=shooter body=Deer mod=Ancient
Tapio, King of the Forest | summon | l | ai=guardian body=Leshy mod=Mossy
Sasquatch | summon | u | ai=guardian body=Sasquatch
Yowie | summon | u | ai=bomber body=Sasquatch mod=Feral
Basajaun | summon | r | ai=guardian body=Sasquatch mod=Noble
Kapre Tree Giant | summon | r | ai=bomber body=Sasquatch mod=Old
Orang Pendek | summon | c | ai=shooter body=Ape mod=Tiny
Mapinguari | summon | r | ai=guardian body=Ape mod=Dire
Old Man of the Forest | summon | u | ai=healer body=Ape mod=Old
Capuchin Thief | summon | c | ai=bomber body=Monkey mod=Clever
Monkey King's Vanguard | summon | u | ai=guardian body=Monkey mod=Brave
Tanuki Drummer | summon | c | ai=bomber body=Tanuki mod=Lucky
Grizzly Matriarch | summon | u | ai=guardian body=Bear mod=Dire
Otso the Honey-Paw | summon | r | ai=guardian body=Bear mod=Ancient
Bull Moose | summon | u | ai=guardian body=Moose
Dappled Fawn | summon | c | ai=healer body=Deer mod=Gentle
Balam Jaguar Knight | summon | r | ai=guardian body=Panther mod=Noble
Clouded Leopard | summon | c | ai=shooter body=Panther mod=Swift
Sundarbans Tiger | summon | r | ai=guardian body=Tiger mod=Dire
Horangi Mountain Tiger | summon | u | ai=guardian body=Tiger mod=Old
Greenwood Wolf Pack | summon | c | ai=bomber body=Wolf mod=Wild
Wild Tusker Boar | summon | c | ai=guardian body=Boar
Twrch Trwyth | summon | l | ai=guardian body=Boar mod=Dire
Komodo Monitor | summon | r | ai=guardian body=Lizard mod=Dire
Fer-de-Lance | summon | c | ai=shooter body=Serpent mod=Swift
Green Anaconda | summon | r | ai=guardian body=Serpent mod=Dire
Poison Dart Frog | summon | c | ai=bomber body=Toad mod=Tiny
Army Ant Soldier | summon | c | ai=bomber body=Ant mod=Hungry
Giant Forest Hornet | summon | c | ai=bomber body=Hornet
Sporeling Thallid | summon | c | ai=bomber body=Mushroom
Thallid Germinator | summon | u | ai=healer body=Mushroom
Fungal Thallid Brute | summon | r | ai=guardian body=Mushroom mod=Dire
Moss-Shelled Tortoise | summon | c | ai=guardian body=Tortoise mod=Mossy
Galapagos Giant Tortoise | summon | r | ai=guardian body=Tortoise mod=Ancient
Resplendent Quetzal | summon | u | ai=healer body=Quetzal
Mokele-mbembe | summon | l | ai=guardian body=Sauropod

Hunter's Crossbow Rig | machine | c | ai=turret mach=Crossbow
Sharpened Log Palisade | machine | c | ai=bulwark mach=Palisade
Sapling Catapult | machine | u | ai=mortar mach=Catapult
Treehouse Lookout | machine | u | ai=turret mach=Tower
`,

};
// creatures the color sets add to the art's list (art.js), built from the same parts
const CARD_SET_CREATURES={"Merfolk":{"head":"round","ears":"point","snout":"grin","body":"wisp","tail":1,"eyes":"big"},"Fish":{"head":"long","ears":"plume","snout":"wide","body":"small","tail":1,"eyes":"top"},"Seal":{"head":"round","ears":"none","snout":"short","body":"round","tail":1,"eyes":"big"},"Kappa":{"head":"round","ears":"none","snout":"beak","body":"shell","claws":1},"Yeti":{"head":"wide","ears":"round","snout":"short","body":"big","claws":1},"Snowman":{"head":"round","ears":"none","snout":"short","body":"round","eyes":"big"},"Penguin":{"head":"round","ears":"none","snout":"beak","body":"squat","wings":1},"Walrus":{"head":"wide","ears":"none","snout":"tusk","body":"big","mod":{"beard":1}},"Narwhal":{"head":"long","ears":"horns","snout":"long","body":"round","tail":1},"Orca":{"head":"long","ears":"plume","snout":"grin","body":"big","tail":1},"Shark":{"head":"long","ears":"plume","snout":"fangs","body":"coil","tail":1},"Turtle":{"head":"square","ears":"none","snout":"beak","body":"shell","mod":{"scale":1.2,"mat":"s"}},"Crab":{"head":"wide","ears":"antenna","snout":"mandible","body":"shell","claws":1},"Kraken":{"head":"round","ears":"none","snout":"beak","body":"coil","tail":2,"eyes":"glow","mod":{"scale":1.3}},"Leviathan":{"head":"long","ears":"horns","snout":"fangs","body":"coil","tail":2,"eyes":"glow","mod":{"scale":1.3,"mat":"g"}},"Djinn":{"head":"long","ears":"point","snout":"grin","body":"wisp","eyes":"glow","mod":{"beard":1}},"Scarab":{"head":"round","ears":"antenna","snout":"mandible","body":"shell","wings":2},"Camel":{"head":"long","ears":"floppy","snout":"long","body":"big","tail":1},"Manticore":{"head":"wide","ears":"tufts","snout":"fangs","body":"big","wings":2,"tail":1,"claws":1},"Chimera":{"head":"wide","ears":"horns","snout":"fangs","body":"big","tail":2,"claws":1},"Scorpion":{"head":"round","ears":"antenna","snout":"mandible","body":"shell","tail":1,"claws":1},"Jackal":{"head":"long","ears":"point","snout":"long","body":"small","tail":1},"Crocodile":{"head":"long","ears":"none","snout":"long","body":"squat","tail":1,"claws":1},"Roc":{"head":"round","ears":"plume","snout":"beak","body":"big","wings":2,"mod":{"scale":1.3}},"Sphinx":{"head":"helm","ears":"floppy","snout":"short","body":"squat","tail":1,"claws":1,"mod":{"mat":"s"}},"Automaton":{"head":"square","ears":"none","snout":"none","body":"block","eyes":"glow","mod":{"mat":"g"}},"Lizard":{"head":"long","ears":"none","snout":"long","body":"small","tail":1,"claws":1},"Raiju":{"head":"round","ears":"point","snout":"fangs","body":"small","tail":2,"eyes":"glow"},"Chupacabra":{"head":"long","ears":"point","snout":"fangs","body":"squat","eyes":"glow","claws":1},"Simurgh":{"head":"round","ears":"plume","snout":"beak","body":"wisp","wings":2,"tail":2},"Bahamut":{"head":"wide","ears":"none","snout":"wide","body":"coil","tail":2,"mod":{"scale":1.3}},"Sandworm":{"head":"round","ears":"none","snout":"mandible","body":"coil","mod":{"scale":1.2}},"Skeleton":{"head":"round","ears":"none","snout":"grin","body":"small","eyes":"glow"},"Zombie":{"head":"square","ears":"floppy","snout":"wide","body":"squat","claws":1},"Ghoul":{"head":"wide","ears":"point","snout":"fangs","body":"squat","eyes":"big","claws":1},"Ghost":{"head":"round","ears":"none","snout":"none","body":"wisp","eyes":"big"},"Banshee":{"head":"long","ears":"none","snout":"wide","body":"wisp","eyes":"glow"},"Lich":{"head":"helm","ears":"horns","snout":"none","body":"wisp","eyes":"glow","mod":{"beard":1}},"Reaper":{"head":"helm","ears":"none","snout":"none","body":"wisp","eyes":"glow","claws":1,"mod":{"scale":1.2}},"Werewolf":{"head":"long","ears":"point","snout":"fangs","body":"big","tail":1,"eyes":"glow","claws":1},"Gaunt":{"head":"long","ears":"horns","snout":"fangs","body":"big","eyes":"glow","claws":1,"mod":{"scale":1.25}},"Nightmare":{"head":"long","ears":"point","snout":"long","body":"big","tail":1,"eyes":"glow"},"Spider":{"head":"round","ears":"none","snout":"mandible","body":"small","eyes":"glow","claws":1},"Moth":{"head":"round","ears":"antenna","snout":"none","body":"small","wings":2,"eyes":"big"},"Centipede":{"head":"long","ears":"antenna","snout":"mandible","body":"coil","claws":1},"Leech":{"head":"round","ears":"none","snout":"mandible","body":"coil","mod":{"scale":0.8}},"Witch":{"head":"long","ears":"point","snout":"long","body":"small","eyes":"top"},"Plaguemask":{"head":"helm","ears":"none","snout":"beak","body":"big","eyes":"glow"},"Demon":{"head":"wide","ears":"horns","snout":"fangs","body":"big","wings":2,"tail":1,"claws":1},"Crow":{"head":"round","ears":"none","snout":"beak","body":"small","wings":2,"tail":1,"eyes":"glow"},"Cat":{"head":"round","ears":"point","snout":"short","body":"small","tail":1,"eyes":"glow"},"Jiangshi":{"head":"square","ears":"none","snout":"short","body":"block","eyes":"top"},"Pegasus":{"head":"long","ears":"point","snout":"long","body":"big","wings":1,"tail":1},"Centaur":{"head":"round","ears":"round","snout":"short","body":"big","tail":1,"mod":{"beard":1}},"Unicorn":{"head":"long","ears":"horns","snout":"long","body":"big","tail":1,"eyes":"big"},"Stag":{"head":"long","ears":"horns","snout":"short","body":"big","tail":1},"Crane":{"head":"round","ears":"plume","snout":"beak","body":"small","wings":1,"tail":1},"Angel":{"head":"round","ears":"none","snout":"none","body":"wisp","wings":2,"eyes":"glow"},"Lamassu":{"head":"helm","ears":"horns","snout":"short","body":"big","wings":2,"tail":1,"mod":{"beard":1,"mat":"s"}},"Elephant":{"head":"wide","ears":"floppy","snout":"tusk","body":"big","tail":1,"mod":{"scale":1.3}},"Qilin":{"head":"long","ears":"horns","snout":"long","body":"armor","tail":2,"eyes":"glow"},"Valkyrie":{"head":"helm","ears":"plume","snout":"none","body":"armor","wings":1},"Cleric":{"head":"round","ears":"none","snout":"short","body":"round"},"Scholar":{"head":"square","ears":"round","snout":"short","body":"small","mod":{"beard":1}},"Ent":{"head":"square","ears":"none","snout":"none","body":"block","eyes":"glow","mod":{"beard":1,"scale":1.25}},"Leshy":{"head":"square","ears":"horns","snout":"grin","body":"big","eyes":"glow","claws":1,"mod":{"beard":1}},"Deer":{"head":"long","ears":"horns","snout":"short","body":"small","tail":1},"Moose":{"head":"long","ears":"horns","snout":"wide","body":"big","tail":1},"Ape":{"head":"round","ears":"round","snout":"wide","body":"big","claws":1},"Monkey":{"head":"round","ears":"round","snout":"short","body":"small","tail":2},"Panther":{"head":"wide","ears":"point","snout":"fangs","body":"small","tail":1,"claws":1,"eyes":"glow"},"Tiger":{"head":"wide","ears":"round","snout":"fangs","body":"big","tail":1,"claws":1},"Elf":{"head":"long","ears":"point","snout":"none","body":"small"},"Druid":{"head":"round","ears":"none","snout":"none","body":"wisp","mod":{"beard":1}},"Fairy":{"head":"round","ears":"point","snout":"none","body":"wisp","wings":2,"mod":{"scale":0.7}},"Mushroom":{"head":"wide","ears":"none","snout":"grin","body":"squat"},"Ant":{"head":"round","ears":"antenna","snout":"mandible","body":"armor"},"Hornet":{"head":"round","ears":"antenna","snout":"mandible","body":"small","wings":2,"tail":1},"Tortoise":{"head":"round","ears":"none","snout":"beak","body":"shell"},"Sasquatch":{"head":"round","ears":"none","snout":"wide","body":"big","claws":1,"mod":{"scale":1.3}},"Tanuki":{"head":"round","ears":"round","snout":"short","body":"round","tail":1},"Satyr":{"head":"long","ears":"horns","snout":"grin","body":"small","tail":1,"mod":{"beard":1}},"Kodama":{"head":"round","ears":"none","snout":"none","body":"small","eyes":"big","mod":{"scale":0.6}},"Quetzal":{"head":"round","ears":"plume","snout":"beak","body":"small","wings":2,"tail":2},"Sauropod":{"head":"round","ears":"none","snout":"short","body":"big","tail":1,"mod":{"scale":1.3}}};
// "Name | type | rarity | k=v k=v" lines -> entries
function parseCardSet(text){ return text.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')).map(l=>{
  const [name,type,r,opts]=l.split('|').map(s=>s.trim()), e={name, type, rarity:{c:'common',u:'uncommon',r:'rare',l:'legendary'}[r], o:{}};
  for(const kv of (opts||'').split(/\s+/).filter(Boolean)){ const i=kv.indexOf('='); e.o[kv.slice(0,i)]=kv.slice(i+1); }
  return e; }); }
