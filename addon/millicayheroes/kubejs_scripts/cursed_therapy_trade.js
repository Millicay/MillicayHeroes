// Millicay Heroes - Cursed Therapy trade (STARTUP script, loaded by Palladium from this addon pack)
//
// Adds a master-level (level 5) trade to the Minecraft Comes Alive cultist:
//   3 blocks of emerald -> 1 Cursed Therapy book
// Uses Forge's VillagerTradesEvent, which fires when the server starts.

const CT_MerchantOffer = Java.loadClass('net.minecraft.world.item.trading.MerchantOffer');
const CT_ItemListing = Java.loadClass('net.minecraft.world.entity.npc.VillagerTrades$ItemListing');
const CT_ForgeRegistries = Java.loadClass('net.minecraftforge.registries.ForgeRegistries');

const CT_PROFESSION = 'mca:cultist';
const CT_LEVEL = 5;

ForgeEvents.onEvent('net.minecraftforge.event.village.VillagerTradesEvent', (event) => {
    try {
        let key = CT_ForgeRegistries.VILLAGER_PROFESSIONS.getKey(event.getType());
        if (String(key) !== CT_PROFESSION) return;

        // Note: Rhino treats the Int2ObjectMap as a JS object, so calling a method on it
        // (like .get(5)) crashes the game. Number indexing (trades[5]) is safe.
        let trades = event.getTrades();
        let list = trades[CT_LEVEL];
        if (!list) {
            console.warn('Millicay cursed therapy trade: no level ' + CT_LEVEL + ' trade list for ' + key);
            return;
        }

        // Wrap the function as a real ItemListing. Without this, the list stores a raw JS
        // function and Forge would crash later when it tries to use it.
        list.add(new CT_ItemListing((trader, random) => {
            console.info('Millicay cursed therapy trade: a cultist is rolling the Cursed Therapy offer');
            return new CT_MerchantOffer(
                Item.of('minecraft:emerald_block', 3),
                Item.of('millicayheroes:cursed_therapy', 1),
                3,    // uses before it needs to restock
                30,   // villager XP
                0.05  // price multiplier
            );
        }));
        console.info('Millicay cursed therapy trade: added to ' + key + ' level ' + CT_LEVEL + ' (' + list.length + ' trades at that level now)');
    } catch (err) {
        console.error('Millicay cursed therapy trade error: ' + err);
    }
});
