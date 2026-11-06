// Millicay Heroes - Too Much Churro (SERVER script, loaded by Palladium from this addon pack)
// Eating a Too Much Churro gives the player the Churro Power.

const TMC_Component = Java.loadClass('net.minecraft.network.chat.Component');

ItemEvents.foodEaten('millicayheroes:too_much_churro', (event) => {
    let player = event.entity;
    if (!player || !player.isPlayer() || player.level.isClientSide()) return;

    try {
        let name = player.getGameProfile().getName();
        player.server.runCommandSilent(`execute as ${name} at ${name} run superpower add millicayheroes:churro_power`);
        player.server.runCommandSilent(`execute at ${name} run playsound minecraft:entity.generic.explode player @a ~ ~ ~ 0.5 1.6`);
        player.server.runCommandSilent(`execute at ${name} run particle minecraft:item croptopia_additions:frosted_churro ~ ~1 ~ 0.4 0.6 0.4 0.15 30`);
        player.setStatusMessage(TMC_Component.literal('§6That was way too much churro... §7(Churro Power gained)'));
    } catch (err) {
        console.error('Millicay too much churro error: ' + err);
    }
});
