// Millicay Heroes - Cursed Therapy trade (STARTUP script, loaded by Palladium from this addon pack)
//
// Adds a master-level (level 5) trade to the Minecraft Comes Alive cultist:
//   3 blocks of emerald -> 1 Cursed Therapy book
// Uses Forge's VillagerTradesEvent, which fires when the server starts.

const CT_MerchantOffer = Java.loadClass('net.minecraft.world.item.trading.MerchantOffer');
const CT_ForgeRegistries = Java.loadClass('net.minecraftforge.registries.ForgeRegistries');

const CT_PROFESSION = 'mca:cultist';
const CT_LEVEL = 5;

ForgeEvents.onEvent('net.minecraftforge.event.village.VillagerTradesEvent', (event) => {
    try {
        let key = CT_ForgeRegistries.VILLAGER_PROFESSIONS.getKey(event.getType());
        if (String(key) !== CT_PROFESSION) return;

        event.getTrades().get(CT_LEVEL).add((trader, random) => new CT_MerchantOffer(
            Item.of('minecraft:emerald_block', 3),
            Item.of('millicayheroes:cursed_therapy', 1),
            3,    // uses before it needs to restock
            30,   // villager XP
            0.05  // price multiplier
        ));
    } catch (err) {
        console.error('Millicay cursed therapy trade error: ' + err);
    }
});
