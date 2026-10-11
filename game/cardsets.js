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

};
// creatures the color sets add to the art's list (art.js), built from the same parts
const CARD_SET_CREATURES={"Merfolk":{"head":"round","ears":"point","snout":"grin","body":"wisp","tail":1,"eyes":"big"},"Fish":{"head":"long","ears":"plume","snout":"wide","body":"small","tail":1,"eyes":"top"},"Seal":{"head":"round","ears":"none","snout":"short","body":"round","tail":1,"eyes":"big"},"Kappa":{"head":"round","ears":"none","snout":"beak","body":"shell","claws":1},"Yeti":{"head":"wide","ears":"round","snout":"short","body":"big","claws":1},"Snowman":{"head":"round","ears":"none","snout":"short","body":"round","eyes":"big"},"Penguin":{"head":"round","ears":"none","snout":"beak","body":"squat","wings":1},"Walrus":{"head":"wide","ears":"none","snout":"tusk","body":"big","mod":{"beard":1}},"Narwhal":{"head":"long","ears":"horns","snout":"long","body":"round","tail":1},"Orca":{"head":"long","ears":"plume","snout":"grin","body":"big","tail":1},"Shark":{"head":"long","ears":"plume","snout":"fangs","body":"coil","tail":1},"Turtle":{"head":"square","ears":"none","snout":"beak","body":"shell","mod":{"scale":1.2,"mat":"s"}},"Crab":{"head":"wide","ears":"antenna","snout":"mandible","body":"shell","claws":1},"Kraken":{"head":"round","ears":"none","snout":"beak","body":"coil","tail":2,"eyes":"glow","mod":{"scale":1.3}},"Leviathan":{"head":"long","ears":"horns","snout":"fangs","body":"coil","tail":2,"eyes":"glow","mod":{"scale":1.3,"mat":"g"}}};
// "Name | type | rarity | k=v k=v" lines -> entries
function parseCardSet(text){ return text.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')).map(l=>{
  const [name,type,r,opts]=l.split('|').map(s=>s.trim()), e={name, type, rarity:{c:'common',u:'uncommon',r:'rare',l:'legendary'}[r], o:{}};
  for(const kv of (opts||'').split(/\s+/).filter(Boolean)){ const i=kv.indexOf('='); e.o[kv.slice(0,i)]=kv.slice(i+1); }
  return e; }); }
