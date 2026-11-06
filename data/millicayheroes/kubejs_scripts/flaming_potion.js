// Millicay Heroes - Flaming Potion (SERVER script, loaded by Palladium from this addon pack)
// Drinking a Flaming Potion gives the player the Fire power and leaves an empty bottle.

const FP_Component = Java.loadClass('net.minecraft.network.chat.Component');

ItemEvents.foodEaten('millicayheroes:flaming_potion', (event) => {
    let player = event.entity;
    if (!player || !player.isPlayer() || player.level.isClientSide()) return;

    try {
        let name = player.getGameProfile().getName();
        player.server.runCommandSilent(`execute as ${name} at ${name} run superpower add millicayheroes:fire`);
        player.server.runCommandSilent(`execute at ${name} run playsound minecraft:item.firecharge.use player @a ~ ~ ~ 1 1`);
        player.server.runCommandSilent(`execute at ${name} run particle minecraft:flame ~ ~1 ~ 0.4 0.8 0.4 0.05 40`);
        player.give('minecraft:glass_bottle');
        player.setStatusMessage(FP_Component.literal('§6Fire burns inside you... §7(Fire power gained)'));
    } catch (err) {
        console.error('Millicay flaming potion error: ' + err);
    }
});
