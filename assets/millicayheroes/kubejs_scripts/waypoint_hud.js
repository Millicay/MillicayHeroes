// Millicay Heroes - Waypoint HUD (CLIENT script, loaded by Palladium from this addon pack)
// Registers the client copy of the waypoint property and draws the saved waypoints
// on the right side of the screen, each with an ender pearl icon.

const WPH_Component = Java.loadClass('net.minecraft.network.chat.Component');
const WPH_PROPERTY = 'millicayheroes_waypoints';
let wphPearl = null;
let wphLastRaw = null;     // last property value we saw
let wphShownAt = 0;        // Date.now() when a key press was last noticed

PalladiumEvents.registerPropertiesClientSided((event) => {
    if (event.getEntityType() == 'minecraft:player') {
        event.registerProperty(WPH_PROPERTY, 'string', '');
    }
});

PalladiumEvents.registerGuiOverlays((event) => {
    event.register('millicayheroes/waypoints', (minecraft, gui, guiGraphics, partialTicks, width, height) => {
        let player = minecraft.player;
        if (!player || !minecraft.level || minecraft.options.hideGui) return;

        let raw = palladium.getProperty(player, WPH_PROPERTY);
        if (!raw) return;
        raw = String(raw);

        // Every key press changes the synced value. Start the timer when it changes,
        // but not for the very first value we receive (e.g. when joining the world).
        let now = Date.now();
        if (wphLastRaw === null) {
            wphLastRaw = raw;
            return;
        }
        if (raw !== wphLastRaw) {
            wphLastRaw = raw;
            wphShownAt = now;
        }

        let data;
        try {
            data = JSON.parse(raw);
        } catch (e) {
            return;
        }
        if (!data || !Array.isArray(data.list)) return;

        // Only show for a few seconds after one of the waypoint keys was pressed.
        let seconds = Number(data.hud) > 0 ? Number(data.hud) : 5;
        if (now - wphShownAt > seconds * 1000) return;

        if (wphPearl == null) wphPearl = Item.of('minecraft:ender_pearl');

        let font = minecraft.font;
        let rowH = 18;
        let lines = [];

        if (data.list.length === 0) {
            lines.push({ text: 'No waypoints saved', sub: '', selected: false });
        } else {
            data.list.forEach((wp, i) => {
                let dim = String(wp.d).replace('minecraft:', '');
                lines.push({
                    text: wp.n,
                    sub: `${Math.floor(wp.x)}, ${Math.floor(wp.y)}, ${Math.floor(wp.z)}  ${dim}`,
                    selected: i === data.sel
                });
            });
        }

        let boxW = 0;
        lines.forEach((l) => {
            let w = Math.max(font.width(l.text), font.width(l.sub) * 0.75);
            if (w > boxW) boxW = w;
        });
        boxW = Math.ceil(boxW) + 30;

        let title = 'Waypoints';
        let boxH = lines.length * rowH + 16;
        let x = width - boxW - 6;
        let y = Math.floor(height / 2 - boxH / 2);

        // Background panel (ARGB ints written with |0 so they fit in a Java int)
        guiGraphics.fill(x, y, x + boxW, y + boxH, 0xA0000000 | 0);
        palladium.gui.drawString(guiGraphics, WPH_Component.literal(title), x + 6, y + 4, 0xFFB65CFF | 0);

        lines.forEach((l, i) => {
            let ry = y + 14 + i * rowH;
            if (l.selected) {
                guiGraphics.fill(x + 2, ry, x + boxW - 2, ry + rowH, 0x60B65CFF | 0);
            }
            if (data.list.length > 0) {
                guiGraphics.renderItem(wphPearl, x + 4, ry + 1);
            }
            let color = l.selected ? (0xFFFFFF55 | 0) : (0xFFBBBBBB | 0);
            palladium.gui.drawString(guiGraphics, WPH_Component.literal(l.text), x + 23, ry + 1, color);

            if (l.sub) {
                let pose = guiGraphics.pose();
                pose.pushPose();
                pose.translate(x + 23, ry + 10, 0);
                pose.scale(0.75, 0.75, 1);
                palladium.gui.drawString(guiGraphics, WPH_Component.literal(l.sub), 0, 0, 0xFF888888 | 0);
                pose.popPose();
            }
        });
    });
});
