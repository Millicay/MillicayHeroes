// Millicay Heroes - Waypoint ability (STARTUP script, loaded by Palladium from this addon pack)
//
// Registers the ability type "millicayheroes:waypoint". One type, these modes:
//   mode "save"        -> saves where you stand (crouch while pressing = delete the selected waypoint)
//   mode "scroll_up"   -> selects the waypoint above in the list
//   mode "scroll_down" -> selects the waypoint below in the list
//   mode "cycle"       -> (older single-key version) next waypoint, crouch = previous
//   mode "teleport"    -> teleports you to the selected waypoint
//
// Waypoints are stored in the synced Palladium property "millicayheroes_waypoints"
// (registered in data/millicayheroes/kubejs_scripts and assets/millicayheroes/kubejs_scripts)
// so the client HUD can draw them. The value is a JSON string:
//   { "sel": 0, "hud": <seconds to show the HUD>, "v": <change counter>, "list": [ {n,x,y,z,yaw,pitch,d}, ... ] }

const WP_Component = Java.loadClass('net.minecraft.network.chat.Component');
const WP_PROPERTY = 'millicayheroes_waypoints';

function wpRead(entity) {
    let raw = palladium.getProperty(entity, WP_PROPERTY);
    let data = null;
    try {
        data = raw ? JSON.parse(String(raw)) : null;
    } catch (e) {
        data = null;
    }
    if (!data || !Array.isArray(data.list)) data = { sel: 0, hud: 0, list: [] };
    if (data.sel >= data.list.length) data.sel = Math.max(0, data.list.length - 1);
    return data;
}

function wpWrite(entity, data, hudTicks) {
    // "hud" = seconds the client shows the list. "v" changes on every write so the
    // client always notices a key press, even if the waypoint list itself didn't change.
    data.hud = hudTicks / 20;
    data.v = ((data.v || 0) + 1) % 100000;
    palladium.setProperty(entity, WP_PROPERTY, JSON.stringify(data));
}

function wpMessage(entity, text) {
    entity.setStatusMessage(WP_Component.literal(text));
}

function wpDimension(entity) {
    // KubeJS exposes level.dimension as a property (a ResourceLocation like "minecraft:overworld").
    let d = entity.level.dimension;
    if (typeof d === 'function') d = entity.level.dimension();
    let s = String(d);
    // Fallback if we ever get a ResourceKey string: "ResourceKey[minecraft:dimension / minecraft:overworld]"
    let m = s.match(/\/\s*([^\]\s]+)\]/);
    return m ? m[1] : s;
}

function wpPlaySound(entity, sound, x, y, z) {
    entity.server.runCommandSilent(`execute in ${wpDimension(entity)} run playsound ${sound} player @a ${x} ${y} ${z} 1 1`);
}

function wpParticles(entity, particle, x, y, z) {
    entity.server.runCommandSilent(`execute in ${wpDimension(entity)} run particle ${particle} ${x} ${y + 1} ${z} 0.3 0.6 0.3 0.5 40`);
}

StartupEvents.registry('palladium:abilities', (event) => {
    event.create('millicayheroes:waypoint')
        .icon(palladium.createItemIcon('minecraft:ender_pearl'))
        .addProperty('mode', 'string', 'teleport', 'What this key does: "save", "scroll_up", "scroll_down" or "teleport".')
        .addProperty('max_waypoints', 'integer', 5, 'How many waypoints can be saved.')
        .addProperty('hud_seconds', 'integer', 5, 'How long the waypoint list stays on screen after a key press.')
        .addProperty('allow_interdim', 'boolean', true, 'Allow teleporting to waypoints in another dimension.')
        .addProperty('sound', 'string', 'minecraft:entity.enderman.teleport', 'Sound played when teleporting.')
        .addProperty('particle', 'string', 'minecraft:portal', 'Particle shown when teleporting.')

        .tick((entity, entry, holder, enabled) => {
            if (entity.level.isClientSide() || !entity.isPlayer()) return;

            let mode = String(entry.getPropertyByName('mode'));

            // Only act once per key press (rising edge of "enabled").
            let edgeKey = 'millicayheroes_wp_down_' + mode;
            let wasDown = entity.persistentData.getBoolean(edgeKey);
            entity.persistentData.putBoolean(edgeKey, enabled);
            if (!enabled || wasDown) return;

            try {
                let data = wpRead(entity);
                let hudTicks = Math.max(1, entry.getPropertyByName('hud_seconds')) * 20;
                let max = Math.max(1, entry.getPropertyByName('max_waypoints'));
                let count = data.list.length;

                if (mode === 'save') {
                    if (entity.isCrouching()) {
                        if (count === 0) {
                            wpMessage(entity, '§cNo waypoints to delete');
                        } else {
                            let removed = data.list.splice(data.sel, 1)[0];
                            if (data.sel >= data.list.length) data.sel = Math.max(0, data.list.length - 1);
                            wpMessage(entity, `§cDeleted ${removed.n}`);
                        }
                        wpWrite(entity, data, hudTicks);
                        return;
                    }

                    let wp = {
                        n: '',
                        x: Math.floor(entity.x * 10) / 10,
                        y: Math.floor(entity.y * 10) / 10,
                        z: Math.floor(entity.z * 10) / 10,
                        yaw: Math.round(entity.yaw),
                        pitch: Math.round(entity.pitch),
                        d: wpDimension(entity)
                    };

                    if (count < max) {
                        data.list.push(wp);
                        data.sel = data.list.length - 1;
                    } else {
                        // Full: overwrite the selected slot.
                        data.list[data.sel] = wp;
                    }
                    // Name by slot number so the list always reads Waypoint 1, 2, 3...
                    data.list.forEach((w, i) => { w.n = 'Waypoint ' + (i + 1); });

                    entity.server.runCommandSilent(`execute in ${wp.d} run playsound minecraft:block.amethyst_block.chime player @a ${wp.x} ${wp.y} ${wp.z} 1 1.4`);
                    wpMessage(entity, `§aSaved ${data.list[data.sel].n} §7(${Math.floor(wp.x)}, ${Math.floor(wp.y)}, ${Math.floor(wp.z)})`);
                    wpWrite(entity, data, hudTicks);
                    return;
                }

                if (mode === 'scroll_up' || mode === 'scroll_down' || mode === 'cycle') {
                    if (count === 0) {
                        wpMessage(entity, '§cNo waypoints saved yet');
                    } else {
                        // Up = the waypoint above in the on-screen list, down = the one below. Both wrap around.
                        let step = mode === 'scroll_up' ? -1 : 1;
                        if (mode === 'cycle' && entity.isCrouching()) step = -1;
                        data.sel = (data.sel + step + count) % count;
                        entity.server.runCommandSilent(`execute in ${wpDimension(entity)} run playsound minecraft:ui.button.click player ${entity.getGameProfile().getName()} ~ ~ ~ 0.4 1.6`);
                    }
                    wpWrite(entity, data, hudTicks);
                    return;
                }

                if (mode === 'teleport') {
                    if (count === 0) {
                        wpMessage(entity, '§cNo waypoints saved yet');
                        wpWrite(entity, data, hudTicks);
                        return;
                    }

                    let wp = data.list[data.sel];
                    let here = wpDimension(entity);
                    if (wp.d !== here && !entry.getPropertyByName('allow_interdim')) {
                        wpMessage(entity, `§c${wp.n} is in another dimension`);
                        wpWrite(entity, data, hudTicks);
                        return;
                    }

                    let sound = String(entry.getPropertyByName('sound'));
                    let particle = String(entry.getPropertyByName('particle'));
                    let name = entity.getGameProfile().getName();

                    // Effects where you leave...
                    wpParticles(entity, particle, entity.x, entity.y, entity.z);
                    wpPlaySound(entity, sound, entity.x, entity.y, entity.z);

                    entity.server.runCommandSilent(`execute in ${wp.d} run tp ${name} ${wp.x} ${wp.y} ${wp.z} ${wp.yaw} ${wp.pitch}`);
                    entity.fallDistance = 0;

                    // ...and where you arrive (the player is in the target dimension now).
                    entity.server.runCommandSilent(`execute in ${wp.d} run particle ${particle} ${wp.x} ${wp.y + 1} ${wp.z} 0.3 0.6 0.3 0.5 40`);
                    entity.server.runCommandSilent(`execute in ${wp.d} run playsound ${sound} player @a ${wp.x} ${wp.y} ${wp.z} 1 1`);

                    wpMessage(entity, `§dTeleported to ${wp.n}`);
                    wpWrite(entity, data, hudTicks);
                }
            } catch (err) {
                console.error('Millicay waypoint ability error: ' + err);
            }
        });
});
