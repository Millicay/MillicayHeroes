// Millicay Heroes - Mind Control ability (STARTUP script, loaded by Palladium from this addon pack)
//
// Registers the ability type "millicayheroes:mind_control". It acts on the entity you are looking at.
// One type, these modes:
//   mode "affinity"     -> MCA villager: +hearts with you          (crouch: -hearts)
//   mode "mood"         -> MCA villager: happier mood               (crouch: sadder mood)
//   mode "relationship" -> MCA villager: next relationship step with you
//                          single -> promised -> engaged -> married (crouch: break up, both become single)
//   mode "anger"        -> neutral mob (wolf, iron golem, enderman, bee, piglin...): calms it down
//                          (crouch: makes it angry at the nearest other mob, never at you)
//
// The MCA parts need Minecraft Comes Alive (Reborn). Without it, only "anger" does anything.

const MC_Component = Java.loadClass('net.minecraft.network.chat.Component');

let MC_PlayerSaveData = null;
let MC_RelationshipState = null;
try {
    MC_PlayerSaveData = Java.loadClass('forge.net.mca.server.world.data.PlayerSaveData');
    MC_RelationshipState = Java.loadClass('forge.net.mca.entity.ai.relationship.RelationshipState');
} catch (e) {
    console.info('Millicay mind control: Minecraft Comes Alive not found, villager modes are disabled.');
}

function mcMessage(player, text) {
    player.setStatusMessage(MC_Component.literal(text));
}

function mcDimension(entity) {
    let d = entity.level.dimension;
    if (typeof d === 'function') d = entity.level.dimension();
    let s = String(d);
    let m = s.match(/\/\s*([^\]\s]+)\]/);
    return m ? m[1] : s;
}

function mcFx(target, particle, sound) {
    let x = Number(target.x).toFixed(2), y = (Number(target.y) + Number(target.getBbHeight()) + 0.3).toFixed(2), z = Number(target.z).toFixed(2);
    let dim = mcDimension(target);
    target.server.runCommandSilent(`execute in ${dim} run particle ${particle} ${x} ${y} ${z} 0.3 0.2 0.3 0.05 8`);
    if (sound) target.server.runCommandSilent(`execute in ${dim} run playsound ${sound} neutral @a ${x} ${y} ${z} 0.8 1`);
}

function mcName(entity) {
    return String(entity.getDisplayName().getString());
}

function mcIsMcaVillager(entity) {
    return entity && typeof entity.getVillagerBrain === 'function' && typeof entity.getRelationships === 'function';
}

function mcIsNeutralMob(entity) {
    return entity && typeof entity.stopBeingAngry === 'function' && typeof entity.setPersistentAngerTarget === 'function';
}

function mcLookTarget(player, range) {
    let hit = player.rayTrace(range, false);
    return hit && hit.entity ? hit.entity : null;
}

// ---------- MCA villagers ----------

function mcAffinity(player, villager, step, crouching) {
    let memories = villager.getVillagerBrain().getMemoriesForPlayer(player);
    let amount = crouching ? -step : step;
    memories.modHearts(amount);
    let hearts = memories.getHearts();
    mcFx(villager, crouching ? 'minecraft:angry_villager' : 'minecraft:heart', 'minecraft:entity.illusioner.mirror_move');
    mcMessage(player, `§d${mcName(villager)} §7hearts: §f${hearts} §8(${amount > 0 ? '+' : ''}${amount})`);
}

function mcMood(player, villager, step, crouching) {
    let brain = villager.getVillagerBrain();
    brain.modifyMoodValue(crouching ? -step : step);
    let moodText = brain.getMood().getText().getString();
    mcFx(villager, crouching ? 'minecraft:smoke' : 'minecraft:happy_villager', 'minecraft:entity.illusioner.mirror_move');
    mcMessage(player, `§d${mcName(villager)} §7now feels §f${moodText} §8(${brain.getMoodValue()})`);
}

// Ends the villager's current relationship (with anyone) on both sides.
function mcEndRelationship(villager) {
    let rel = villager.getRelationships();
    let partner = rel.getPartner().orElse(null);
    if (partner) {
        if (partner.isPlayer()) {
            MC_PlayerSaveData.get(partner).endRelationShip(MC_RelationshipState.SINGLE);
        } else if (mcIsMcaVillager(partner)) {
            partner.getRelationships().endRelationShip(MC_RelationshipState.SINGLE);
        }
    }
    rel.endRelationShip(MC_RelationshipState.SINGLE);
}

// Ends the player's current relationship with someone other than this villager.
function mcEndPlayerRelationship(player, villager) {
    let data = MC_PlayerSaveData.get(player);
    let partner = data.getPartner().orElse(null);
    if (partner && String(partner.getUUID()) !== String(villager.getUUID()) && mcIsMcaVillager(partner)) {
        partner.getRelationships().endRelationShip(MC_RelationshipState.SINGLE);
    }
    data.endRelationShip(MC_RelationshipState.SINGLE);
}

function mcRelationship(player, villager, crouching) {
    let rel = villager.getRelationships();
    let data = MC_PlayerSaveData.get(player);
    let uuid = player.getUUID();
    let name = mcName(villager);

    if (crouching) {
        if (String(rel.getRelationshipState()) === 'SINGLE') {
            mcMessage(player, `§7${name} is already single`);
            return;
        }
        let wasYours = rel.isMarriedTo(uuid) || rel.isEngagedWith(uuid) || rel.isPromisedTo(uuid);
        mcEndRelationship(villager);
        if (wasYours) data.endRelationShip(MC_RelationshipState.SINGLE);
        mcFx(villager, 'minecraft:angry_villager', 'minecraft:entity.villager.no');
        mcMessage(player, `§c${name} is now single`);
        return;
    }

    if (rel.isMarriedTo(uuid)) {
        mcMessage(player, `§d${name} §7is already married to you`);
        return;
    }

    let label;
    if (rel.isEngagedWith(uuid)) {
        rel.marry(player);
        data.marry(villager);
        label = 'married to you';
    } else if (rel.isPromisedTo(uuid)) {
        rel.engage(player);
        data.engage(villager);
        label = 'engaged to you';
    } else {
        // Clear any old partners first, then start with a promise.
        mcEndRelationship(villager);
        mcEndPlayerRelationship(player, villager);
        rel.promise(player);
        data.promise(villager);
        label = 'promised to you';
    }
    mcFx(villager, 'minecraft:heart', 'minecraft:entity.villager.celebrate');
    mcMessage(player, `§d${name} §7is now §f${label}`);
}

// ---------- Neutral mobs ----------

function mcFindNewEnemy(player, mob, range) {
    let box = mob.getBoundingBox().inflate(range);
    let best = null, bestScore = 1e9;
    mob.level.getEntitiesWithin(box).forEach((e) => {
        if (!e.isLiving() || !e.isAlive()) return;
        let id = String(e.getUUID());
        if (id === String(mob.getUUID()) || id === String(player.getUUID())) return;
        if (e.isPlayer() && e.isCreative && e.isCreative()) return;
        // Prefer monsters: they count as being much closer.
        let score = mob.distanceTo(e) - (e.isMonster() ? 1000 : 0);
        if (score < bestScore) { bestScore = score; best = e; }
    });
    return best;
}

function mcAnger(player, mob, range, crouching) {
    let name = mcName(mob);
    if (!crouching) {
        mob.stopBeingAngry();
        mob.setTarget(null);
        mcFx(mob, 'minecraft:happy_villager', 'minecraft:entity.illusioner.mirror_move');
        mcMessage(player, `§b${name} §7calms down`);
        return;
    }

    let enemy = mcFindNewEnemy(player, mob, range);
    if (!enemy) {
        mcMessage(player, `§7No one near ${name} to be angry at`);
        return;
    }
    mob.setPersistentAngerTarget(enemy.getUUID());
    mob.startPersistentAngerTimer();
    mob.setLastHurtByMob(enemy);
    mob.setTarget(enemy);
    mcFx(mob, 'minecraft:angry_villager', 'minecraft:entity.illusioner.mirror_move');
    mcMessage(player, `§c${name} §7is now angry at §f${mcName(enemy)}`);
}

StartupEvents.registry('palladium:abilities', (event) => {
    event.create('millicayheroes:mind_control')
        .icon(palladium.createItemIcon('minecraft:written_book'))
        .addProperty('mode', 'string', 'affinity', 'What this key does: "affinity", "mood", "relationship" or "anger".')
        .addProperty('range', 'integer', 16, 'How far away (in blocks) the target can be.')
        .addProperty('hearts_step', 'integer', 10, 'Hearts added or removed per press ("affinity" mode).')
        .addProperty('mood_step', 'integer', 5, 'Mood points added or removed per press ("mood" mode). MCA mood goes from -15 to 15.')

        .tick((entity, entry, holder, enabled) => {
            if (entity.level.isClientSide() || !entity.isPlayer()) return;

            let mode = String(entry.getPropertyByName('mode'));

            // Only act once per key press (rising edge of "enabled").
            let edgeKey = 'millicayheroes_mc_down_' + mode;
            let wasDown = entity.persistentData.getBoolean(edgeKey);
            entity.persistentData.putBoolean(edgeKey, enabled);
            if (!enabled || wasDown) return;

            try {
                let range = Math.max(1, entry.getPropertyByName('range'));
                let crouching = entity.isCrouching();
                let target = mcLookTarget(entity, range);

                if (mode === 'anger') {
                    if (!mcIsNeutralMob(target)) {
                        mcMessage(entity, '§7Look at a neutral mob (wolf, iron golem, enderman, bee...)');
                        return;
                    }
                    mcAnger(entity, target, range, crouching);
                    return;
                }

                if (!MC_PlayerSaveData) {
                    mcMessage(entity, '§cThis needs Minecraft Comes Alive');
                    return;
                }
                if (!mcIsMcaVillager(target)) {
                    mcMessage(entity, '§7Look at a villager');
                    return;
                }

                if (mode === 'affinity') {
                    mcAffinity(entity, target, Math.max(1, entry.getPropertyByName('hearts_step')), crouching);
                } else if (mode === 'mood') {
                    mcMood(entity, target, Math.max(1, entry.getPropertyByName('mood_step')), crouching);
                } else if (mode === 'relationship') {
                    if (target.isBaby()) {
                        mcMessage(entity, '§7Not with a child');
                        return;
                    }
                    mcRelationship(entity, target, crouching);
                }
            } catch (err) {
                console.error('Millicay mind control error (' + mode + '): ' + err);
            }
        });
});
