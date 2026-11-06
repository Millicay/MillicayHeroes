# MillicayHeroes

A small collection of superhero OCs for Palladium (Forge 1.20.1).

## Requirements

- Palladium 4.4.1+
- KubeJS 2001.6.x (plus Rhino). The Waypoints power is scripted, so it needs KubeJS.
- Minecraft Comes Alive (MCA Reborn) 7.5+ for the Mind Control power's villager abilities and the cultist trade. Optional: without it, only the Anger ability works.
- The other dependencies listed in `META-INF/mods.toml` (FSang's Heroes, Croptopia Additions, Echoes of Power)

## Installing

1. Put the `MillicayHeroes` folder (or a zip of its contents) in `<instance>/addonpacks/`.
2. Start the game. Palladium loads the KubeJS scripts that ship inside this pack. You do **not** need to copy anything into the instance's `kubejs/` folder.
3. After changing a **startup** script (`addon/.../kubejs_scripts`), restart the game. After changing server scripts or power JSON, run `/reload`.

## Creative tab and EMI

Every item in the pack is in the **Millicay Heroes** creative tab, which is defined in `addon/millicayheroes/creative_mode_tabs/millicay_heroes.json`. When you add a new item, add its ID to that file's `items` list.

With REMI installed, the creative tab also appears as a tab in EMI's item list. Each suit collapses into one stack group in EMI: "Lemillion Suit" and "Millicay Suit". The groups are built from the item tags in `data/millicayheroes/tags/items/` and the files in `assets/millicayheroes/stack_groups/`. In JEI or EMI you can also search `@millicayheroes` to show only this pack's items.

## Pocket Reality power (`millicayheroes:pocket_reality`)

Two abilities:

- **Pocket Portal** (key press): opens a portal (a ring of purple particles) 2.5 blocks in front of you for 15 seconds. Anything that walks into it, including you, friends and mobs, is teleported. Press again next to it to close it early.
  - From any dimension, it leads to **your own spot in the pocket reality** (dimension `millicayheroes:pocket_reality`). Each player gets a different spot, 1024+ blocks apart. A small purpur platform appears the first time, over an invisible barrier floor, so you can't fall into the void. It's always night there, with an End-style sky.
  - Inside the pocket reality, the portal leads back. Each player returns to where they came in. Mobs, and players with nowhere stored, go to your return spot or world spawn.
- **Ender Chest** (key press): opens your own ender chest, wherever you are.

`portal_seconds` in the power file sets how long a portal stays open.

**Getting it:** use a **Multiversal Catalyst** (`millicayheroes:multiversal_catalyst`). Recipe:

| | | |
| --- | --- | --- |
| Gamma Radiation | TNT | Gamma Radiation |
| Ender Chest | Multiversal Extrapolator | Ender Chest |
| Gamma Radiation | TNT | Gamma Radiation |

Gamma Radiation is FSang's `fsang:gamma_syringe`. The Multiversal Extrapolator is Palladium's `palladium:multiversal_extrapolator`.

The dimension is new data, so leave the world and rejoin (or restart) after installing. `/reload` isn't enough for dimensions.

| File | Script type | Purpose |
| --- | --- | --- |
| `addon/millicayheroes/kubejs_scripts/pocket_reality_ability.js` | startup | Registers the `millicayheroes:pocket_reality` ability type (portal, ender chest) |
| `data/millicayheroes/kubejs_scripts/multiversal_catalyst.js` | server | Gives the power when you use a Multiversal Catalyst |
| `data/millicayheroes/palladium/powers/pocket_reality.json` | power | The two abilities |
| `data/millicayheroes/dimension/pocket_reality.json`, `dimension_type/`, `worldgen/biome/` | data | The pocket reality dimension |

## Fire power (`millicayheroes:fire`)

Four abilities:

- **Flame Flight** (always on): you can fly. Jump twice to take off.
- **Fireball** (key press, 1 s cooldown): throws a ghast fireball where you look. It explodes on impact (block damage follows the `mobGriefing` game rule). Set `explosion_power` to 0 for a blaze fireball that only sets fires.
- **Fire Stream** (hold the key): a fire beam from your hands, 25 blocks long, 4 damage and sets targets and blocks on fire. It uses FSang's `fsang:pyrokinesis_fire` beam look.
- **Cook** (key press, 1 s cooldown): smelts the items in your main hand and off hand as a furnace would (raw food, ores, sand, logs...), and gives the furnace XP.

**Getting it:** drink a **Flaming Potion** (`millicayheroes:flaming_potion`). It has no recipe yet, so take it from the creative tab or use `/give @s millicayheroes:flaming_potion`. Drinking it gives back a glass bottle.

| File | Script type | Purpose |
| --- | --- | --- |
| `addon/millicayheroes/kubejs_scripts/fire_ability.js` | startup | Registers the `millicayheroes:fire` ability type (fireball, cook) |
| `data/millicayheroes/kubejs_scripts/flaming_potion.js` | server | Gives the power when you drink a Flaming Potion |
| `data/millicayheroes/palladium/powers/fire.json` | power | Flight, fireball, fire stream and cook abilities |

## Churro Power (`millicayheroes:churro_power`)

Three abilities:

- **Churro Flight** (always on): you can fly. Jump twice to take off, like creative flight.
- **Churro Blast** (key press, 2 s cooldown): every entity within 6 blocks of you is launched away from you and lands about 15 blocks away. Change `radius` and `distance` in the power file.
- **Churro Maker** (key press, 1 s cooldown): gives you a Croptopia Additions churro.

**Getting it:** eat a **Too Much Churro** (`millicayheroes:too_much_churro`). You can eat it even with full hunger. Recipe:

| | | |
| --- | --- | --- |
| Golden Apple | Golden Apple | Golden Apple |
| TNT | Cake | TNT |
| Chocolate Covered Churro | TNT | Chocolate Covered Churro |

That's 3 TNT, not 4: 3 apples + cake + 4 TNT + 2 churros would be 10 items, and the grid has 9 slots. The chocolate covered churro's item id is `croptopia_additions:frosted_churro`.

| File | Script type | Purpose |
| --- | --- | --- |
| `addon/millicayheroes/kubejs_scripts/churro_push_ability.js` | startup | Registers the `millicayheroes:churro_push` ability type |
| `data/millicayheroes/kubejs_scripts/too_much_churro.js` | server | Gives the power when you eat a Too Much Churro |
| `data/millicayheroes/palladium/powers/churro_power.json` | power | Flight, blast and churro abilities |

## Flowery Step power (`millicayheroes:flowery_step`)

One toggle ability. While it's on, every block you step onto gets the bone meal effect. Crops and saplings at your feet grow, and grass under you sprouts grass and flowers. Press the key again to turn it off.

**Getting it:** use a **Green Vaccine** (`millicayheroes:green_vaccine`). Craft it with augmented human DNA in the middle, an MCA bouquet in each corner, and any small flower in the other 4 slots (see `data/millicayheroes/recipes/green_vaccine.json`). You can always use it, even with full hunger.

`chance_percent` in `data/millicayheroes/palladium/powers/flowery_step.json` sets how often a step triggers it (default 100).

| File | Script type | Purpose |
| --- | --- | --- |
| `addon/millicayheroes/kubejs_scripts/flowery_step_ability.js` | startup | Registers the `millicayheroes:flowery_step` ability type |
| `data/millicayheroes/kubejs_scripts/green_vaccine.js` | server | Gives the power when you use a Green Vaccine |
| `data/millicayheroes/palladium/powers/flowery_step.json` | power | The power and its toggle ability |

## Ender Beacon (`millicayheroes:ender_beacon`)

A sword with iron sword stats (6 attack damage, 1.6 attack speed, iron durability). **Right click** to throw it like an ender pearl. You teleport to where it lands. The sword leaves your inventory while it flies and goes back into the same hand when you land, with its enchantments and durability. You take no fall damage, and no endermites spawn. If the pearl gets lost (falls into the void, or lands while you're in another dimension), you still get the sword back. If you're offline, it drops where the pearl ended up. You can throw it once per second.

**Crafting:** two Techno-Organic Metal Ingots (`fsang:techno_organic_ingot`) above an ender pearl, in a vertical line like a sword (see `data/millicayheroes/recipes/ender_beacon.json`).

| File | Script type | Purpose |
| --- | --- | --- |
| `data/millicayheroes/kubejs_scripts/ender_beacon.js` | server | Takes the sword from your hand and throws it as a pearl |
| `addon/millicayheroes/kubejs_scripts/ender_beacon_landing.js` | startup | Safe teleport on landing, gives the sword back, and covers lost pearls |

## Mind Control power (`millicayheroes:mind_control`)

You have this power while you hold a **Cursed Therapy** book (`millicayheroes:cursed_therapy`) in your main hand or off hand. Drop it or put it away and the power goes away.

**Getting the book:** a master-level (level 5) MCA **cultist** sells it for 3 blocks of emerald. A cultist reaches level 5 the same way vanilla villagers level up, by trading with you. In creative, it's in the Millicay Heroes tab. EMI shows how to get it on the book's info page (`assets/millicayheroes/recipe/additions/cursed_therapy_info.json`).

To test the trade, summon a villager **without NBT** (with NBT, `/summon` skips MCA's setup and the villager has no skin), then make it a level-5 cultist:

```
/summon mca:male_villager ~ ~ ~
```

```
/data merge entity @e[type=mca:male_villager,limit=1,sort=nearest] {VillagerData:{profession:"mca:cultist",level:5}}
```

Do this before you open its trade menu, because a villager picks its trades the first time you open it. Then open its menu and choose Trade.

Every ability acts on the mob you're looking at, up to 16 blocks away:

| Key | Ability | Press | Crouch + press |
| --- | --- | --- | --- |
| 1 | Affinity | Villager gets +10 hearts with you | -10 hearts |
| 2 | Mood | Villager gets happier (+5 mood) | Sadder (-5 mood). MCA mood goes from -15 to 15. |
| 3 | Relationship | Moves the villager one step closer to you: single, then promised, then engaged, then married | Breaks up, so you both end up single |
| 4 | Anger | Neutral mob (wolf, iron golem, enderman, bee, piglin...) calms down for 60 seconds and won't target anyone | It gets angry at the nearest other mob, preferring monsters. It never targets you. |

Before the Relationship ability starts a new relationship, it ends the villager's old one and your old one, on both sides. It doesn't work on children.

You can change `range`, `hearts_step`, `mood_step` and `calm_seconds` per ability in `data/millicayheroes/palladium/powers/mind_control.json`.

| File | Script type | Purpose |
| --- | --- | --- |
| `addon/millicayheroes/kubejs_scripts/mind_control_ability.js` | startup | Registers the `millicayheroes:mind_control` ability type |
| `addon/millicayheroes/kubejs_scripts/cursed_therapy_trade.js` | startup | Adds the cultist trade |
| `data/millicayheroes/palladium/powers/mind_control.json` | power | The power and its four abilities |
| `data/millicayheroes/palladium/item_powers/cursed_therapy_*.json` | item power | Gives the power while the book is in either hand |

## Waypoints power (`millicayheroes:waypoints`)

Save up to 5 spots, see them on screen with an ender pearl icon, and warp back with a power key.

Give it to yourself:

```
/superpower add millicayheroes:waypoints
```

Or eat an **Ender Pill** (`millicayheroes:ender_pill`). Craft it with 2 lead blocks, 1 augmented human DNA, 2 techno-organic blocks, 2 ender pearls, 1 lead circuit and 1 pufferfish (shaped: `#Aa / oWo / aP#`, see `data/millicayheroes/recipes/ender_pill.json`). You can always eat it, even with full hunger. The script that grants the power is `data/millicayheroes/kubejs_scripts/ender_pill.js`.

Abilities, in order on the power keybinds:

| Key | Ability | Press | Crouch + press |
| --- | --- | --- | --- |
| 1 | Warp to Waypoint | Teleports you to the selected waypoint (1 s cooldown) | Same |
| 2 | Waypoint Up | Shows the list and selects the waypoint above (wraps to the bottom) | Same |
| 3 | Waypoint Down | Shows the list and selects the waypoint below (wraps to the top) | Same |
| 4 | Save Waypoint | Saves where you stand. When all slots are full, it overwrites the selected one. | Deletes the selected waypoint |

When you press any of the four keys, the list appears on the right side of the screen for a few seconds. Each waypoint has an ender pearl icon, its coordinates and its dimension. The selected waypoint is highlighted in yellow.

Waypoints are saved with your player and stay through relogs. They work across dimensions unless you turn that off.

### Configuring it

Every ability entry in `data/millicayheroes/palladium/powers/waypoints.json` can set:

| Property | Default | What it does |
| --- | --- | --- |
| `mode` | `teleport` | `teleport`, `scroll_up`, `scroll_down` or `save` |
| `max_waypoints` | `5` | Number of slots (read by the `save` ability) |
| `hud_seconds` | `5` | How long the list stays on screen after a press |
| `allow_interdim` | `true` | Allow warping to a waypoint in another dimension |
| `sound` | `minecraft:entity.enderman.teleport` | Teleport sound |
| `particle` | `minecraft:portal` | Teleport particle |

To add waypoints to another hero, copy the four ability entries into that hero's power file.

### How it's built

| File | Script type | Purpose |
| --- | --- | --- |
| `addon/millicayheroes/kubejs_scripts/waypoint_ability.js` | startup | Registers the `millicayheroes:waypoint` ability type |
| `data/millicayheroes/kubejs_scripts/waypoint_properties.js` | server | Registers the saved, synced `millicayheroes_waypoints` player property |
| `assets/millicayheroes/kubejs_scripts/waypoint_hud.js` | client | Registers the same property on the client and draws the on-screen list |
| `data/millicayheroes/palladium/powers/waypoints.json` | power | The power and its three abilities |

Palladium loads addon-pack scripts from `kubejs_scripts` folders: `addon/<namespace>/` for startup scripts, `data/<namespace>/` for server scripts and `assets/<namespace>/` for client scripts.

### Troubleshooting

- **The list never shows up:** check `logs/kubejs/client.log` for errors from `waypoint_hud.js`.
- **The keys do nothing:** check `logs/kubejs/startup.log` and `logs/kubejs/server.log`. Make sure `/superpower add millicayheroes:waypoints` succeeded.
- **The Ender Beacon throws but you take damage or don't teleport:** the landing script didn't load. Restart the game and check `logs/kubejs/startup.log` for `Millicay ender beacon`.
- **Mind Control does nothing:** look straight at the mob, and check `logs/kubejs/startup.log` and `server.log` for `Millicay mind control error`.
- **The cultist doesn't sell the book:** it only appears when a cultist reaches level 5. Trades are set when the server starts, so restart after changing `cursed_therapy_trade.js`.
- **Error `Unknown ability type millicayheroes:waypoint`:** the startup script didn't load. Restart the game, then check `startup.log`.
