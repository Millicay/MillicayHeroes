// Millicay Heroes - Green Vaccine (SERVER script, loaded by Palladium from this addon pack)
// Using a Green Vaccine gives the player the Flowery Step power.

const GV_Component = Java.loadClass('net.minecraft.network.chat.Component');

ItemEvents.foodEaten('millicayheroes:green_vaccine', (event) => {
    let player = event.entity;
    if (!player || !player.isPlayer() || player.level.isClientSide()) return;

    try {
        let name = player.getGameProfile().getName();
        player.server.runCommandSilent(`execute as ${name} at ${name} run superpower add millicayheroes:flowery_step`);
        player.server.runCommandSilent(`execute at ${name} run playsound minecraft:item.bone_meal.use player @a ~ ~ ~ 1 1`);
        player.server.runCommandSilent(`execute at ${name} run particle minecraft:happy_villager ~ ~1 ~ 0.4 0.8 0.4 0.1 30`);
        player.setStatusMessage(GV_Component.literal('§aYou feel nature growing inside you... §7(Flowery Step power gained)'));
    } catch (err) {
        console.error('Millicay green vaccine error: ' + err);
    }
});
