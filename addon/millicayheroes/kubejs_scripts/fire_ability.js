// Millicay Heroes - Fire abilities (STARTUP script, loaded by Palladium from this addon pack)
//
// Registers the ability type "millicayheroes:fire". It acts once per key press. Modes:
//   mode "fireball" -> throws a fireball where you look. explosion_power 0 = blaze fireball
//                      (sets things on fire, no explosion); 1+ = ghast fireball that explodes.
//   mode "cook"     -> smelts the items in your main hand and off hand, like a furnace would
//                      (raw beef -> steak, iron ore -> iron ingot, sand -> glass...).

const FR_Component = Java.loadClass('net.minecraft.network.chat.Component');
const FR_SmallFireball = Java.loadClass('net.minecraft.world.entity.projectile.SmallFireball');
const FR_LargeFireball = Java.loadClass('net.minecraft.world.entity.projectile.LargeFireball');
const FR_RecipeType = Java.loadClass('net.minecraft.world.item.crafting.RecipeType');
const FR_SimpleContainer = Java.loadClass('net.minecraft.world.SimpleContainer');
const FR_InteractionHand = Java.loadClass('net.minecraft.world.InteractionHand');

function frDimension(entity) {
    let d = entity.level.dimension;
    if (typeof d === 'function') d = entity.level.dimension();
    let s = String(d);
    let m = s.match(/\/\s*([^\]\s]+)\]/);
    return m ? m[1] : s;
}

function frFx(player, particle, sound) {
    let x = Number(player.x).toFixed(2), y = (Number(player.y) + 1.2).toFixed(2), z = Number(player.z).toFixed(2);
    let dim = frDimension(player);
    player.server.runCommandSilent(`execute in ${dim} run particle ${particle} ${x} ${y} ${z} 0.3 0.3 0.3 0.03 15`);
    if (sound) player.server.runCommandSilent(`execute in ${dim} run playsound ${sound} player @a ${x} ${y} ${z} 1 1`);
}

function frFireball(player, explosionPower) {
    let level = player.level;
    let look = player.getLookAngle();
    let lx = Number(look.x()), ly = Number(look.y()), lz = Number(look.z());

    let fireball = explosionPower > 0
        ? new FR_LargeFireball(level, player, lx, ly, lz, explosionPower)
        : new FR_SmallFireball(level, player, lx, ly, lz);
    // Start it just in front of your eyes, already moving (KubeJS calls setDeltaMovement "setMotion").
    fireball.setPos(Number(player.x) + lx * 1.5, Number(player.getEyeY()) - 0.2 + ly * 1.5, Number(player.z) + lz * 1.5);
    fireball.setMotion(lx * 1.2, ly * 1.2, lz * 1.2);
    level.addFreshEntity(fireball);

    player.swing(FR_InteractionHand.MAIN_HAND, true);
    frFx(player, 'minecraft:flame', 'minecraft:entity.blaze.shoot');
}

// Returns how many items got cooked in that hand.
function frCookHand(player, hand) {
    let level = player.level;
    let stack = player.getItemInHand(hand);
    if (stack.isEmpty()) return 0;

    let container = new FR_SimpleContainer(1);
    container.setItem(0, stack.copy());
    let recipe = level.getRecipeManager().getRecipeFor(FR_RecipeType.SMELTING, container, level).orElse(null);
    if (!recipe) return 0;

    let result = recipe.getResultItem(level.registryAccess());
    if (result.isEmpty()) return 0;

    let count = stack.getCount();
    let total = count * result.getCount();
    let max = result.getMaxStackSize();
    let cooked = result.copy();
    cooked.setCount(Math.min(total, max));
    player.setItemInHand(hand, cooked);
    // Anything that doesn't fit in one stack goes to the inventory (or drops).
    let rest = total - cooked.getCount();
    while (rest > 0) {
        let extra = result.copy();
        extra.setCount(Math.min(rest, max));
        player.give(extra);
        rest -= extra.getCount();
    }

    let xp = Math.round(Number(recipe.getExperience()) * count);
    if (xp > 0) player.giveExperiencePoints(xp);
    return count;
}

function frCook(player) {
    let cooked = frCookHand(player, FR_InteractionHand.MAIN_HAND) + frCookHand(player, FR_InteractionHand.OFF_HAND);
    if (cooked > 0) {
        frFx(player, 'minecraft:flame', 'minecraft:block.fire.extinguish');
        player.setStatusMessage(FR_Component.literal(`§6Cooked ${cooked} item${cooked === 1 ? '' : 's'}`));
    } else {
        player.setStatusMessage(FR_Component.literal('§7Nothing in your hands can be cooked'));
    }
}

StartupEvents.registry('palladium:abilities', (event) => {
    event.create('millicayheroes:fire')
        .icon(palladium.createItemIcon('minecraft:fire_charge'))
        .addProperty('mode', 'string', 'fireball', 'What this key does: "fireball" or "cook".')
        .addProperty('explosion_power', 'integer', 1, 'Fireball explosion size. 0 = small blaze fireball that only sets fires, 1 = ghast fireball.')

        .tick((entity, entry, holder, enabled) => {
            if (entity.level.isClientSide() || !entity.isPlayer()) return;

            let mode = String(entry.getPropertyByName('mode'));

            // Only act once per key press (rising edge of "enabled").
            let edgeKey = 'millicayheroes_fire_down_' + mode;
            let wasDown = entity.persistentData.getBoolean(edgeKey);
            entity.persistentData.putBoolean(edgeKey, enabled);
            if (!enabled || wasDown) return;

            try {
                if (mode === 'fireball') {
                    frFireball(entity, Math.max(0, entry.getPropertyByName('explosion_power')));
                } else if (mode === 'cook') {
                    frCook(entity);
                }
            } catch (err) {
                console.error('Millicay fire error (' + mode + '): ' + err);
            }
        });
});
