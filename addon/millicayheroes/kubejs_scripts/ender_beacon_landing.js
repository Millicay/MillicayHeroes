// Millicay Heroes - Ender Beacon landing (STARTUP script, loaded by Palladium from this addon pack)
//
// The thrown Ender Beacon is an ender pearl that carries the sword (see data/.../ender_beacon.js).
// When it lands, we cancel the normal ender pearl teleport (which deals 5 fall damage and can spawn
// an endermite), teleport the player ourselves, and give the sword back.
//
// If the pearl disappears without landing normally (fell into the void, you're in another
// dimension, its chunk unloaded...), the sword is still given back, or dropped where the pearl
// was if you're offline. A "returned" flag on the pearl makes sure you only get it back once.

const TB_ITEM = 'millicayheroes:ender_beacon';
const TB_RETURNED = 'millicayheroes_returned';
const TB_HAND = 'millicayheroes_hand';
const TB_OWNER = 'millicayheroes_owner';
const TB_UUID = Java.loadClass('java.util.UUID');
const TB_ThrownEnderpearl = Java.loadClass('net.minecraft.world.entity.projectile.ThrownEnderpearl');
const TB_InteractionHand = Java.loadClass('net.minecraft.world.InteractionHand');
const TB_ItemEntity = Java.loadClass('net.minecraft.world.entity.item.ItemEntity');

function tbIsBeaconPearl(entity) {
    // Only thrown pearls: a dropped Ender Beacon item also has getItem(), and must not count.
    if (!entity || !(entity instanceof TB_ThrownEnderpearl)) return false;
    let stack = entity.getItem();
    return stack && !stack.isEmpty() && String(stack.getId()) === TB_ITEM;
}

// The thrower, looked up on the whole server (getOwner() only finds them in the pearl's dimension).
function tbFindOwner(pearl) {
    let id = String(pearl.persistentData.getString(TB_OWNER));
    if (!id) return null;
    let server = pearl.level.getServer();
    return server ? server.getPlayerList().getPlayer(TB_UUID.fromString(id)) : null;
}

// Gives the sword carried by this pearl back to the player (once).
function tbReturnSword(pearl, player) {
    let data = pearl.persistentData;
    if (data.getBoolean(TB_RETURNED)) return;
    data.putBoolean(TB_RETURNED, true);

    let stack = pearl.getItem().copy();
    if (player && player.isAlive()) {
        let hand = String(data.getString(TB_HAND)) === 'OFF_HAND' ? TB_InteractionHand.OFF_HAND : TB_InteractionHand.MAIN_HAND;
        if (player.getItemInHand(hand).isEmpty()) {
            player.setItemInHand(hand, stack);
        } else {
            player.give(stack);
        }
        return;
    }

    // Owner offline or dead: drop the sword where the pearl was (above the void if it fell in).
    let level = pearl.level;
    let y = Math.max(Number(pearl.y), level.getMinBuildHeight() + 1);
    let drop = new TB_ItemEntity(level, Number(pearl.x), y, Number(pearl.z), stack);
    drop.setNoGravity(Number(pearl.y) < level.getMinBuildHeight());
    level.addFreshEntity(drop);
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.EntityTeleportEvent$EnderPearl', (event) => {
    try {
        let pearl = event.getPearlEntity();
        if (!tbIsBeaconPearl(pearl)) return;

        let player = event.getPlayer();
        let x = event.getTargetX(), y = event.getTargetY(), z = event.getTargetZ();
        event.setCanceled(true);

        if (player.isPassenger()) player.stopRiding();
        player.teleportTo(x, y, z);
        player.resetFallDistance();
        tbReturnSword(pearl, player);

        let name = player.getGameProfile().getName();
        player.server.runCommandSilent(`execute at ${name} run playsound minecraft:entity.enderman.teleport player @a ~ ~ ~ 0.8 1.4`);
        player.server.runCommandSilent(`execute at ${name} run particle minecraft:portal ~ ~1 ~ 0.3 0.6 0.3 0.4 30`);
    } catch (err) {
        console.error('Millicay ender beacon landing error: ' + err);
    }
});

// Pearls whose sword was already given back when their chunk unloaded. If such a pearl loads
// again later (the chunk was saved with it inside), it's removed so the sword can't be duplicated.
const TB_returnedOnUnload = {};

// Safety net: the pearl left the world without the landing above giving the sword back.
ForgeEvents.onEvent('net.minecraftforge.event.entity.EntityLeaveLevelEvent', (event) => {
    try {
        let level = event.getLevel();
        if (level.isClientSide()) return;
        let pearl = event.getEntity();
        if (!tbIsBeaconPearl(pearl)) return;
        if (pearl.persistentData.getBoolean(TB_RETURNED)) return;

        let reason = pearl.getRemovalReason();
        let why = reason ? String(reason) : '';
        // Went through a portal: the pearl keeps flying in the other dimension, nothing to do.
        if (why === 'CHANGED_DIMENSION') return;

        let owner = tbFindOwner(pearl);
        if (why.indexOf('UNLOADED') === 0) {
            // Chunk unloaded with the pearl in it. Give it back only if the thrower is online;
            // otherwise leave the pearl saved in the chunk, so the sword isn't lost.
            if (!owner) return;
            TB_returnedOnUnload[String(pearl.getUuid())] = true;
        }
        tbReturnSword(pearl, owner);
    } catch (err) {
        console.error('Millicay ender beacon return error: ' + err);
    }
});

ForgeEvents.onEvent('net.minecraftforge.event.entity.EntityJoinLevelEvent', (event) => {
    try {
        let pearl = event.getEntity();
        if (event.getLevel().isClientSide() || !tbIsBeaconPearl(pearl)) return;
        let id = String(pearl.getUuid());
        if (TB_returnedOnUnload[id]) {
            delete TB_returnedOnUnload[id];
            event.setCanceled(true);
        }
    } catch (err) {
        console.error('Millicay ender beacon reload error: ' + err);
    }
});
