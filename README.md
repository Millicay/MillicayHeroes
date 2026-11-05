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

## Techno Beacon (`millicayheroes:techno_beacon`)

A sword with iron sword stats (6 attack damage, 1.6 attack speed, iron durability). **Right click** to throw it like an ender pearl. You teleport to where it lands. The sword stays in your hand, you take no fall damage, and no endermites spawn. You can throw it once per second.

**Crafting:** two Techno-Organic Metal Ingots (`fsang:techno_organic_ingot`) above an ender pearl, in a vertical line like a sword (see `data/millicayheroes/recipes/techno_beacon.json`).

| File | Script type | Purpose |
| --- | --- | --- |
| `data/millicayheroes/kubejs_scripts/techno_beacon.js` | server | Throws the pearl on right click and sets the cooldown |
| `addon/millicayheroes/kubejs_scripts/techno_beacon_landing.js` | startup | Replaces the normal pearl landing with a safe teleport |

## Mind Control power (`millicayheroes:mind_control`)

You have this power while you hold a **Cursed Therapy** book (`millicayheroes:cursed_therapy`) in your main hand or off hand. Drop it or put it away and the power goes away.

**Getting the book:** a master-level (level 5) MCA **cultist** sells it for 3 blocks of emerald. A cultist reaches level 5 the same way vanilla villagers level up, by trading with you. In creative, it's in the Millicay Heroes tab.

Every ability acts on the mob you're looking at, up to 16 blocks away:

| Key | Ability | Press | Crouch + press |
| --- | --- | --- | --- |
| 1 | Affinity | Villager gets +10 hearts with you | -10 hearts |
| 2 | Mood | Villager gets happier (+5 mood) | Sadder (-5 mood). MCA mood goes from -15 to 15. |
| 3 | Relationship | Moves the villager one step closer to you: single, then promised, then engaged, then married | Breaks up, so you both end up single |
| 4 | Anger | Neutral mob (wolf, iron golem, enderman, bee, piglin...) calms down | It gets angry at the nearest other mob, preferring monsters. It never targets you. |

Before the Relationship ability starts a new relationship, it ends the villager's old one and your old one, on both sides. It doesn't work on children.

You can change `range`, `hearts_step` and `mood_step` per ability in `data/millicayheroes/palladium/powers/mind_control.json`.

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
- **The Techno Beacon throws but you take damage or don't teleport:** the landing script didn't load. Restart the game and check `logs/kubejs/startup.log` for `Millicay techno beacon`.
- **Mind Control does nothing:** look straight at the mob, and check `logs/kubejs/startup.log` and `server.log` for `Millicay mind control error`.
- **The cultist doesn't sell the book:** it only appears when a cultist reaches level 5. Trades are set when the server starts, so restart after changing `cursed_therapy_trade.js`.
- **Error `Unknown ability type millicayheroes:waypoint`:** the startup script didn't load. Restart the game, then check `startup.log`.
