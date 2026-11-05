// Millicay Heroes - Techno Beacon throw (SERVER script, loaded by Palladium from this addon pack)
//
// Right click with the Techno Beacon: throws a copy of it as an ender pearl.
// The sword stays in your hand. The landing is handled in
// addon/millicayheroes/kubejs_scripts/techno_beacon_landing.js (no fall damage, no endermites).

const TB_ThrownEnderpearl = Java.loadClass('net.minecraft.world.entity.projectile.ThrownEnderpearl');
const TB_COOLDOWN_TICKS = 20;

ItemEvents.rightClicked('millicayheroes:techno_beacon', (event) => {
    let player = event.player;
    let level = event.level;
    if (!player || level.isClientSide()) return;

    try {
        let stack = event.item;
        if (player.getCooldowns().isOnCooldown(stack.getItem())) return;

        // The thrown pearl carries a copy of the sword, so it looks like the sword flying
        // and the landing script can tell it apart from a normal ender pearl.
        let shown = stack.copy();
        shown.setCount(1);

        let pearl = new TB_ThrownEnderpearl(level, player);
        pearl.setItem(shown);
        pearl.shootFromRotation(player, player.getXRot(), player.getYRot(), 0.0, 1.5, 1.0);
        level.addFreshEntity(pearl);

        player.getCooldowns().addCooldown(stack.getItem(), TB_COOLDOWN_TICKS);
        player.swing(event.hand, true);
        let name = player.getGameProfile().getName();
        player.server.runCommandSilent(`execute at ${name} run playsound minecraft:entity.ender_pearl.throw player @a ~ ~ ~ 0.6 0.6`);
        event.cancel();
    } catch (err) {
        console.error('Millicay techno beacon throw error: ' + err);
    }
});
