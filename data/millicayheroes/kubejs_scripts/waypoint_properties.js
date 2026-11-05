// Millicay Heroes - Waypoint storage (SERVER script, loaded by Palladium from this addon pack)
// Registers the player property that holds saved waypoints. Palladium saves it with the
// player and syncs it to clients so the HUD can show it.

PalladiumEvents.registerProperties((event) => {
    if (event.getEntityType() == 'minecraft:player') {
        event.registerProperty('millicayheroes_waypoints', 'string', '');
    }
});
