// Millicay Heroes - Ender Pill (SERVER script, loaded by Palladium from this addon pack)
// Eating an Ender Pill gives the player the Waypoints power.

const EP_Component = Java.loadClass('net.minecraft.network.chat.Component');

ItemEvents.foodEaten('millicayheroes:ender_pill', (event) => {
    let player = event.entity;
    if (!player || !player.isPlayer() || player.level.isClientSide()) return;

    try {
        let name = player.getGameProfile().getName();
        player.server.runCommandSilent(`execute as ${name} at ${name} run superpower add millicayheroes:waypoints`);
        player.server.runCommandSilent(`execute at ${name} run playsound minecraft:entity.enderman.teleport player @a ~ ~ ~ 1 1.2`);
        player.server.runCommandSilent(`execute at ${name} run particle minecraft:portal ~ ~1 ~ 0.4 0.8 0.4 0.6 60`);
        player.setStatusMessage(EP_Component.literal('§dYou feel ender energy... §7(Waypoints power gained)'));
    } catch (err) {
        console.error('Millicay ender pill error: ' + err);
    }
});
