"use client";

import PlayerWidget from "./PlayerWidget";
import QueuePanel from "./QueuePanel";

// Composes the player widget (top) and queue panel (bottom)
// into the full right sidebar used on the karaoke page.
export default function PlayerSidebar() {
    return (
        <aside className="w-80 shrink-0 border-l bg-muted/20 hidden lg:flex lg:flex-col overflow-y-auto">
            {/* Top: Mini player */}
            <PlayerWidget />

            {/* Bottom: Queue */}
            <QueuePanel />
        </aside>
    );
}
