// Millicay Heroes - Flowery Step ability (STARTUP script, loaded by Palladium from this addon pack)
//
// Registers the ability type "millicayheroes:flowery_step". While it's enabled (it's a toggle in
// the power file), every time you step onto a new block it gets the bone meal effect:
//   - the block at your feet (crops, saplings, flowers, mushrooms...), or if nothing grows there,
//   - the block you're standing on (grass spreads grass and flowers, moss spreads, etc.).

const FS_BoneMealItem = Java.loadClass('net.minecraft.world.item.BoneMealItem');
const FS_LAST_POS = 'millicayheroes_fs_last';

// Bone meals one block. Returns true if something grew.
function fsBoneMeal(entity, pos) {
    let level = entity.level;
    let stack = Item.of('minecraft:bone_meal');
    let grew = false;
    try {
        // Forge's version also fires BonemealEvent, so other mods' plants work too.
        grew = FS_BoneMealItem.applyBonemeal(stack, level, pos, entity.isPlayer() ? entity : null);
    } catch (e) {
        grew = FS_BoneMealItem.growCrop(stack, level, pos);
    }
    if (grew) level.levelEvent(1505, pos, 0); // the green bone meal particles
    return grew;
}

StartupEvents.registry('palladium:abilities', (event) => {
    event.create('millicayheroes:flowery_step')
        .icon(palladium.createItemIcon('minecraft:bone_meal'))
        .addProperty('chance_percent', 'integer', 100, 'Chance (0 to 100) that each new step gets the bone meal effect.')

        .tick((entity, entry, holder, enabled) => {
            if (entity.level.isClientSide()) return;
            if (!enabled) {
                entity.persistentData.remove(FS_LAST_POS);
                return;
            }
            if (!entity.onGround() || entity.isSpectator()) return;

            try {
                let pos = entity.blockPosition();
                let key = pos.getX() + ',' + pos.getY() + ',' + pos.getZ();
                if (String(entity.persistentData.getString(FS_LAST_POS)) === key) return;
                entity.persistentData.putString(FS_LAST_POS, key);

                if (Math.random() * 100 >= entry.getPropertyByName('chance_percent')) return;
                if (!fsBoneMeal(entity, pos)) fsBoneMeal(entity, pos.below());
            } catch (err) {
                console.error('Millicay flowery step error: ' + err);
            }
        });
});
