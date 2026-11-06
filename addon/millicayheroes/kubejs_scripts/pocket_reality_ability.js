// Millicay Heroes - Pocket Reality abilities (STARTUP script, loaded by Palladium from this addon pack)
//
// Registers the ability type "millicayheroes:pocket_reality". It acts once per key press. Modes:
//   mode "portal"      -> opens a portal (a ring of particles) in front of you for "portal_seconds".
//                         Anything that walks into it is teleported:
//                           - outside the pocket reality: to your own spot in it
//                             (dimension millicayheroes:pocket_reality, defined in data/millicayheroes/dimension)
//                           - inside the pocket reality: back to where each player came in from
//                         Press again while it's open to close it.
//   mode "ender_chest" -> opens your ender chest, wherever you are.

const PR_Component = Java.loadClass('net.minecraft.network.chat.Component');
const PR_SimpleMenuProvider = Java.loadClass('net.minecraft.world.SimpleMenuProvider');
const PR_ChestMenu = Java.loadClass('net.minecraft.world.inventory.ChestMenu');

const PR_DIM = 'millicayheroes:pocket_reality';
const PR_PLOT_SPACING = 1024;      // blocks between players' spots in the pocket reality
const PR_FLOOR_Y = 0;              // the invisible barrier floor; you stand at y 1
const PR_PLATFORM_RADIUS = 6;      // the visible platform built around your spot
const PR_TP_COOLDOWN_TICKS = 40;   // stops entities from bouncing straight back through a portal

// Keys in the owner's persistentData
const PR_K = {
    until: 'millicayheroes_pr_until',
    dim: 'millicayheroes_pr_dim',
    x: 'millicayheroes_pr_x', y: 'millicayheroes_pr_y', z: 'millicayheroes_pr_z',
    fx: 'millicayheroes_pr_fx', fz: 'millicayheroes_pr_fz',
    destDim: 'millicayheroes_pr_dest_dim',
    destX: 'millicayheroes_pr_dest_x', destY: 'millicayheroes_pr_dest_y', destZ: 'millicayheroes_pr_dest_z',
    buildAt: 'millicayheroes_pr_build_at',
    // On every player that enters the pocket reality: where to send them back
    retDim: 'millicayheroes_pr_ret_dim',
    retX: 'millicayheroes_pr_ret_x', retY: 'millicayheroes_pr_ret_y', retZ: 'millicayheroes_pr_ret_z',
    // On every entity that goes through a portal
    cooldown: 'millicayheroes_pr_cooldown'
};

function prLevelDimension(level) {
    let d = level.dimension;
    if (typeof d === 'function') d = level.dimension();
    let s = String(d);
    let m = s.match(/\/\s*([^\]\s]+)\]/);
    return m ? m[1] : s;
}

function prDimension(entity) {
    return prLevelDimension(entity.level);
}

// The server level for a dimension id like "minecraft:overworld", or null.
function prFindLevel(server, dimId) {
    let it = server.getAllLevels().iterator();
    while (it.hasNext()) {
        let level = it.next();
        if (prLevelDimension(level) === dimId) return level;
    }
    return null;
}

function prMessage(player, text) {
    player.setStatusMessage(PR_Component.literal(text));
}

function prRun(player, cmd) {
    player.server.runCommandSilent(cmd);
}

// Each player gets their own spot in the pocket reality, worked out from their UUID.
function prPlot(player) {
    let s = String(player.getUuid());
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    h = Math.abs(h);
    let gx = (h % 1000) - 500;
    let gz = (Math.floor(h / 1000) % 1000) - 500;
    if (gx === 0 && gz === 0) gx = 1;
    return { x: gx * PR_PLOT_SPACING + 0.5, y: PR_FLOOR_Y + 1, z: gz * PR_PLOT_SPACING + 0.5 };
}

function prPortalOpen(data, now) {
    return data.contains(PR_K.until) && now < data.getLong(PR_K.until);
}

function prClosePortal(player) {
    let data = player.persistentData;
    data.remove(PR_K.until);
}

function prOpenPortal(player, seconds) {
    let data = player.persistentData;
    let now = player.level.getTime();
    let here = prDimension(player);

    // Pressing again next to your open portal closes it. A portal left behind in
    // another dimension is simply replaced by the new one.
    if (prPortalOpen(data, now) && data.getString(PR_K.dim) === here) {
        prClosePortal(player);
        prMessage(player, '§5The portal closes');
        prRun(player, `execute in ${here} run playsound minecraft:block.portal.trigger player @a ${data.getDouble(PR_K.x)} ${data.getDouble(PR_K.y)} ${data.getDouble(PR_K.z)} 0.5 2`);
        return;
    }

    // Horizontal facing, so the ring stands upright in front of you.
    let look = player.getLookAngle();
    let fx = Number(look.x()), fz = Number(look.z());
    let len = Math.sqrt(fx * fx + fz * fz) || 1;
    fx /= len; fz /= len;
    let px = Number(player.x) + fx * 2.5, py = Number(player.y), pz = Number(player.z) + fz * 2.5;

    let dest;
    if (here !== PR_DIM) {
        let plot = prPlot(player);
        dest = { dim: PR_DIM, x: plot.x, y: plot.y, z: plot.z };
        data.putLong(PR_K.buildAt, now + 10);
    } else if (data.contains(PR_K.retDim)) {
        dest = { dim: data.getString(PR_K.retDim), x: data.getDouble(PR_K.retX), y: data.getDouble(PR_K.retY), z: data.getDouble(PR_K.retZ) };
    } else {
        let spawn = player.server.overworld().getSharedSpawnPos();
        dest = { dim: 'minecraft:overworld', x: spawn.getX() + 0.5, y: spawn.getY(), z: spawn.getZ() + 0.5 };
    }

    data.putLong(PR_K.until, now + seconds * 20);
    data.putString(PR_K.dim, here);
    data.putDouble(PR_K.x, px); data.putDouble(PR_K.y, py); data.putDouble(PR_K.z, pz);
    data.putDouble(PR_K.fx, fx); data.putDouble(PR_K.fz, fz);
    data.putString(PR_K.destDim, dest.dim);
    data.putDouble(PR_K.destX, dest.x); data.putDouble(PR_K.destY, dest.y); data.putDouble(PR_K.destZ, dest.z);

    prRun(player, `execute in ${here} run playsound minecraft:block.portal.trigger player @a ${px} ${py} ${pz} 0.7 1.4`);
    prMessage(player, here === PR_DIM ? '§dA portal home opens' : '§dA portal to your pocket reality opens');
}

function prDrawPortal(player, data, now) {
    if (now % 3 !== 0) return;
    let dim = data.getString(PR_K.dim);
    let cx = data.getDouble(PR_K.x), cy = data.getDouble(PR_K.y) + 1.2, cz = data.getDouble(PR_K.z);
    let rx = -data.getDouble(PR_K.fz), rz = data.getDouble(PR_K.fx); // sideways direction
    let points = 14;
    for (let i = 0; i < points; i++) {
        let a = (i / points) * Math.PI * 2 + now * 0.05;
        let side = Math.cos(a) * 1.0, up = Math.sin(a) * 1.4;
        let x = (cx + rx * side).toFixed(2), y = (cy + up).toFixed(2), z = (cz + rz * side).toFixed(2);
        prRun(player, `execute in ${dim} run particle minecraft:reverse_portal ${x} ${y} ${z} 0 0 0 0 1 force`);
    }
    prRun(player, `execute in ${dim} run particle minecraft:portal ${cx.toFixed(2)} ${cy.toFixed(2)} ${cz.toFixed(2)} 0.3 0.6 0.3 0.5 6 force`);
    if (now % 40 === 0) prRun(player, `execute in ${dim} run playsound minecraft:block.portal.ambient player @a ${cx} ${cy} ${cz} 0.3 1.5`);
}

function prTeleportThrough(player, data, now) {
    let cx = data.getDouble(PR_K.x), cy = data.getDouble(PR_K.y), cz = data.getDouble(PR_K.z);
    let destDim = data.getString(PR_K.destDim);
    let intoPocket = destDim === PR_DIM;
    let fromDim = data.getString(PR_K.dim);
    let box = AABB.of(cx - 0.9, cy, cz - 0.9, cx + 0.9, cy + 2.6, cz + 0.9);
    // The portal may be in another dimension than you (e.g. you already went through it).
    let level = prFindLevel(player.server, fromDim);
    if (!level) return;

    level.getEntitiesWithin(box).forEach((e) => {
        try {
            if (!e.isAlive() || e.isSpectator()) return;
            let ed = e.persistentData;
            if (ed.contains(PR_K.cooldown) && now < ed.getLong(PR_K.cooldown)) return;
            ed.putLong(PR_K.cooldown, now + PR_TP_COOLDOWN_TICKS);

            let dx = data.getDouble(PR_K.destX), dy = data.getDouble(PR_K.destY), dz = data.getDouble(PR_K.destZ), dd = destDim;
            if (e.isPlayer()) {
                if (intoPocket) {
                    // Remember where to send this player back: just in front of the portal.
                    ed.putString(PR_K.retDim, fromDim);
                    ed.putDouble(PR_K.retX, cx - data.getDouble(PR_K.fx) * 1.5);
                    ed.putDouble(PR_K.retY, cy);
                    ed.putDouble(PR_K.retZ, cz - data.getDouble(PR_K.fz) * 1.5);
                } else if (ed.contains(PR_K.retDim)) {
                    dd = ed.getString(PR_K.retDim);
                    dx = ed.getDouble(PR_K.retX); dy = ed.getDouble(PR_K.retY); dz = ed.getDouble(PR_K.retZ);
                }
            }
            prRun(player, `execute in ${dd} run tp ${e.getUuid()} ${dx} ${dy} ${dz}`);
            prRun(player, `execute in ${dd} run playsound minecraft:entity.enderman.teleport player @a ${dx} ${dy} ${dz} 0.8 0.8`);
        } catch (err) {
            console.error('Millicay pocket reality teleport error: ' + err);
        }
    });
}

// Builds a small visible platform around your spot (over the invisible barrier floor).
// Done a moment after you arrive, once the area is loaded. Only replaces barrier, so builds are kept.
function prBuildPlatform(player) {
    let plot = prPlot(player);
    let r = PR_PLATFORM_RADIUS;
    let x1 = Math.floor(plot.x) - r, x2 = Math.floor(plot.x) + r;
    let z1 = Math.floor(plot.z) - r, z2 = Math.floor(plot.z) + r;
    prRun(player, `execute in ${PR_DIM} run fill ${x1} ${PR_FLOOR_Y} ${z1} ${x2} ${PR_FLOOR_Y} ${z2} minecraft:purpur_block replace minecraft:barrier`);
    prRun(player, `execute in ${PR_DIM} run fill ${x1 + 2} ${PR_FLOOR_Y} ${z1 + 2} ${x2 - 2} ${PR_FLOOR_Y} ${z2 - 2} minecraft:end_stone_bricks replace minecraft:purpur_block`);
}

function prOpenEnderChest(player) {
    player.openMenu(new PR_SimpleMenuProvider(
        (id, inventory, p) => PR_ChestMenu.threeRows(id, inventory, p.getEnderChestInventory()),
        PR_Component.translatable('container.enderchest')
    ));
    prRun(player, `execute in ${prDimension(player)} run playsound minecraft:block.ender_chest.open player @a ${player.x} ${player.y} ${player.z} 0.6 1`);
}

StartupEvents.registry('palladium:abilities', (event) => {
    event.create('millicayheroes:pocket_reality')
        .icon(palladium.createItemIcon('minecraft:ender_eye'))
        .addProperty('mode', 'string', 'portal', 'What this key does: "portal" or "ender_chest".')
        .addProperty('portal_seconds', 'integer', 15, 'How long a portal stays open ("portal" mode).')

        .tick((entity, entry, holder, enabled) => {
            if (entity.level.isClientSide() || !entity.isPlayer()) return;

            let mode = String(entry.getPropertyByName('mode'));
            let now = entity.level.getTime();

            if (mode === 'portal') {
                try {
                    let data = entity.persistentData;
                    if (prPortalOpen(data, now)) {
                        // Keeps working after you go through, so others can follow until it closes.
                        prDrawPortal(entity, data, now);
                        prTeleportThrough(entity, data, now);
                    }
                    if (data.contains(PR_K.buildAt) && now >= data.getLong(PR_K.buildAt) && prDimension(entity) === PR_DIM) {
                        data.remove(PR_K.buildAt);
                        prBuildPlatform(entity);
                    }
                } catch (err) {
                    console.error('Millicay pocket reality portal tick error: ' + err);
                }
            }

            // Only act once per key press (rising edge of "enabled").
            let edgeKey = 'millicayheroes_pr_down_' + mode;
            let wasDown = entity.persistentData.getBoolean(edgeKey);
            entity.persistentData.putBoolean(edgeKey, enabled);
            if (!enabled || wasDown) return;

            try {
                if (mode === 'portal') {
                    prOpenPortal(entity, Math.max(1, entry.getPropertyByName('portal_seconds')));
                } else if (mode === 'ender_chest') {
                    prOpenEnderChest(entity);
                }
            } catch (err) {
                console.error('Millicay pocket reality error (' + mode + '): ' + err);
            }
        });
});
