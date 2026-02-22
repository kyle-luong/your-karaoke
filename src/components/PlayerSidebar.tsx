"use client";

import Player from "./player";
import QueuePanel from "./QueuePanel";

// Composes the existing Player (top) and QueuePanel (bottom)
// into the full right sidebar used on the karaoke page.
export default function PlayerSidebar() {
    return (
        <aside className="w-[380px] shrink-0 border-l border-border/50 bg-muted/10 hidden lg:flex lg:flex-col overflow-hidden">
            {/* Top: The existing lyric player — fits flush in sidebar */}
            <div className="player-sidebar-embed border-b border-border/50">
                <Player />
            </div>

            {/* Bottom: Queue */}
            <QueuePanel />

            {/* Override the player styles so it fits inside the sidebar panel */}
            <style>{`
                .player-sidebar-embed .wrap {
                    min-height: unset !important;
                    height: auto !important;
                    background: transparent !important;
                    padding: 0 !important;
                }
                .player-sidebar-embed .wrap::before {
                    display: none !important;
                }
                .player-sidebar-embed .card {
                    width: 100% !important;
                    height: 320px !important;
                    border-radius: 0 !important;
                    border: none !important;
                }
            `}</style>
        </aside>
    );
}
