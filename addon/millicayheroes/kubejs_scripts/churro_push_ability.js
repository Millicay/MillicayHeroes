// Millicay Heroes - Churro Push ability (STARTUP script, loaded by Palladium from this addon pack)
//
// Registers the ability type "millicayheroes:churro_push". On each key press, every entity around
// you (mobs, players, items...) is blasted away from you so it lands about "distance" blocks away.

const CP_Component = Java.loadClass('net.minecraft.network.chat.Component');

function cpDimension(entity) {
    let d = entity.level.dimension;
    if (typeof d === 'function') d = entity.level.dimension();
    let s = String(d);
    let m = s.match(/\/\s*([^\]\s]+)\]/);
    return m ? m[1] : s;
}

function cpPush(player, radius, distance) {
    let px = Number(player.x), py = Number(player.y), pz = Number(player.z);
    // Launched at 0.6 up, a mob stays in the air ~22 ticks and covers ~9.7 blocks per 1.0 of speed.
    let speed = distance / 9.7;
    let look = player.getLookAngle();
    let selfId = String(player.getUuid());
    let count = 0;

    player.level.getEntitiesWithin(player.getBoundingBox().inflate(radius)).forEach((e) => {
        try {
            if (String(e.getUuid()) === selfId || !e.isAlive() || e.isSpectator()) return;
            let dx = Number(e.x) - px, dy = Number(e.y) - py, dz = Number(e.z) - pz;
            if (dx * dx + dy * dy + dz * dz > radius * radius) return;
            let len = Math.sqrt(dx * dx + dz * dz);
            if (len < 0.01) { dx = Number(look.x()); dz = Number(look.z()); len = Math.sqrt(dx * dx + dz * dz) || 1; }
            // KubeJS renames setDeltaMovement to setMotion (and distanceTo to distanceToEntity).
            e.setMotion(dx / len * speed, 0.6, dz / len * speed);
            e.hurtMarked = true; // makes the server send the new motion to clients (needed for players)
            count++;
        } catch (err) {
            console.error('Millicay churro push entity error: ' + err);
        }
    });

    let x = Number(player.x).toFixed(2), y = (Number(player.y) + 1).toFixed(2), z = Number(player.z).toFixed(2);
    let dim = cpDimension(player);
    player.server.runCommandSilent(`execute in ${dim} run particle minecraft:explosion ${x} ${y} ${z} 1.5 0.3 1.5 0 6`);
    player.server.runCommandSilent(`execute in ${dim} run particle minecraft:item croptopia_additions:churro ${x} ${y} ${z} 2 0.5 2 0.3 40`);
    player.server.runCommandSilent(`execute in ${dim} run playsound minecraft:entity.generic.explode player @a ${x} ${y} ${z} 0.7 1.4`);
    player.setStatusMessage(CP_Component.literal(count > 0 ? `§6Churro blast! §7(${count} pushed)` : '§7Nothing to push'));
}

StartupEvents.registry('palladium:abilities', (event) => {
    event.create('millicayheroes:churro_push')
        .icon(palladium.createItemIcon('minecraft:tnt'))
        .addProperty('radius', 'integer', 6, 'Entities within this many blocks of you get pushed.')
        .addProperty('distance', 'integer', 15, 'Roughly how many blocks away the pushed entities land.')

        .tick((entity, entry, holder, enabled) => {
            if (entity.level.isClientSide() || !entity.isPlayer()) return;

            // Only act once per key press (rising edge of "enabled").
            let edgeKey = 'millicayheroes_cp_down';
            let wasDown = entity.persistentData.getBoolean(edgeKey);
            entity.persistentData.putBoolean(edgeKey, enabled);
            if (!enabled || wasDown) return;

            try {
                cpPush(entity, Math.max(1, entry.getPropertyByName('radius')), Math.max(1, entry.getPropertyByName('distance')));
            } catch (err) {
                console.error('Millicay churro push error: ' + err);
            }
        });
});
