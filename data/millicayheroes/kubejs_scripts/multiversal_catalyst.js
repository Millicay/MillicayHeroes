// Millicay Heroes - Multiversal Catalyst (SERVER script, loaded by Palladium from this addon pack)
// Using a Multiversal Catalyst gives the player the Pocket Reality power.

const MVC_Component = Java.loadClass('net.minecraft.network.chat.Component');

ItemEvents.foodEaten('millicayheroes:multiversal_catalyst', (event) => {
    let player = event.entity;
    if (!player || !player.isPlayer() || player.level.isClientSide()) return;

    try {
        let name = player.getGameProfile().getName();
        player.server.runCommandSilent(`execute as ${name} at ${name} run superpower add millicayheroes:pocket_reality`);
        player.server.runCommandSilent(`execute at ${name} run playsound minecraft:block.end_portal.spawn player @a ~ ~ ~ 0.6 1.4`);
        player.server.runCommandSilent(`execute at ${name} run particle minecraft:reverse_portal ~ ~1 ~ 0.4 0.8 0.4 0.1 60`);
        player.setStatusMessage(MVC_Component.literal('§dA reality of your own unfolds... §7(Pocket Reality power gained)'));
    } catch (err) {
        console.error('Millicay multiversal catalyst error: ' + err);
    }
});
