// Millicay Heroes - Techno Beacon landing (STARTUP script, loaded by Palladium from this addon pack)
//
// When a pearl thrown by the Techno Beacon lands, we cancel the normal ender pearl teleport
// (which deals 5 fall damage and can spawn an endermite) and teleport the player ourselves.

const TB_ITEM = 'millicayheroes:techno_beacon';

ForgeEvents.onEvent('net.minecraftforge.event.entity.EntityTeleportEvent$EnderPearl', (event) => {
    try {
        let pearl = event.getPearlEntity();
        if (!pearl || String(pearl.getItem().getId()) !== TB_ITEM) return;

        let player = event.getPlayer();
        let x = event.getTargetX(), y = event.getTargetY(), z = event.getTargetZ();
        event.setCanceled(true);

        if (player.isPassenger()) player.stopRiding();
        player.teleportTo(x, y, z);
        player.resetFallDistance();

        let name = player.getGameProfile().getName();
        player.server.runCommandSilent(`execute at ${name} run playsound minecraft:entity.enderman.teleport player @a ~ ~ ~ 0.8 1.4`);
        player.server.runCommandSilent(`execute at ${name} run particle minecraft:portal ~ ~1 ~ 0.3 0.6 0.3 0.4 30`);
    } catch (err) {
        console.error('Millicay techno beacon landing error: ' + err);
    }
});
