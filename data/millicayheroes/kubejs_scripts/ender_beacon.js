// Millicay Heroes - Ender Beacon throw (SERVER script, loaded by Palladium from this addon pack)
//
// Right click with the Ender Beacon: the sword leaves your hand and flies as an ender pearl.
// The pearl carries the real sword (enchantments and durability included). The landing script,
// addon/millicayheroes/kubejs_scripts/ender_beacon_landing.js, teleports you (no fall damage,
// no endermites) and gives the sword back. If the pearl is lost, it gives it back anyway.

const TB_ThrownEnderpearl = Java.loadClass('net.minecraft.world.entity.projectile.ThrownEnderpearl');
const TB_COOLDOWN_TICKS = 20;

ItemEvents.rightClicked('millicayheroes:ender_beacon', (event) => {
    let player = event.player;
    let level = event.level;
    if (!player || level.isClientSide()) return;

    try {
        let stack = event.item;
        if (player.getCooldowns().isOnCooldown(stack.getItem())) return;

        // The pearl carries the sword itself, so it looks like the sword flying, the landing
        // script can tell it apart from a normal ender pearl, and it can hand the sword back.
        let thrown = stack.copy();
        thrown.setCount(1);

        let pearl = new TB_ThrownEnderpearl(level, player);
        pearl.setItem(thrown);
        // Remember which hand it came from, so it goes back there.
        pearl.persistentData.putString('millicayheroes_hand', String(event.hand));
        pearl.persistentData.putString('millicayheroes_owner', String(player.getUuid()));
        pearl.shootFromRotation(player, player.getPitch(), player.getYaw(), 0.0, 1.5, 1.0);
        level.addFreshEntity(pearl);

        // Take it out of your hand while it's flying.
        stack.shrink(1);

        player.getCooldowns().addCooldown(stack.getItem(), TB_COOLDOWN_TICKS);
        player.swing(event.hand, true);
        let name = player.getGameProfile().getName();
        player.server.runCommandSilent(`execute at ${name} run playsound minecraft:entity.ender_pearl.throw player @a ~ ~ ~ 0.6 0.6`);
    } catch (err) {
        console.error('Millicay ender beacon throw error: ' + err);
        return;
    }
    // Outside the try: KubeJS cancels by throwing a special "exit" signal, which a catch would swallow.
    event.cancel();
});
