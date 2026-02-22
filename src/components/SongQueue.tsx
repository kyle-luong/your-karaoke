interface QueueSong {
  id: string;
  title: string;
  artist: string;
  duration: string;
  isNowPlaying?: boolean;
}

const QUEUE_SONGS: QueueSong[] = [
  {
    id: '1',
    title: 'I Wonder',
    artist: 'Kanye West',
    duration: '4:16',
    isNowPlaying: true,
  },
  {
    id: '2',
    title: 'Gold Digger',
    artist: 'Kanye West ft. Jamie Foxx',
    duration: '3:38',
  },
  {
    id: '3',
    title: 'Humble',
    artist: 'Kendrick Lamar',
    duration: '2:57',
  },
  {
    id: '4',
    title: 'ROCKSTAR',
    artist: 'Post Malone ft. 21 Savage',
    duration: '3:34',
  },
];

export default function SongQueue() {
  return (
    <div className="w-full bg-white border border-zinc-200 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50">
        <h3 className="font-bold text-sm uppercase tracking-wide text-zinc-900">Queue</h3>
      </div>

      {/* Queue Items */}
      <div className="flex-1 overflow-y-auto max-h-96">
        {QUEUE_SONGS.map((song, index) => (
          <div
            key={song.id}
            className={`px-4 py-3 border-b border-zinc-100 transition-colors ${
              song.isNowPlaying
                ? 'bg-primary/10 border-primary/30'
                : 'hover:bg-zinc-50'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Queue Number */}
              <div className="text-xs font-semibold text-zinc-500 mt-0.5 w-5 flex-shrink-0">
                {song.isNowPlaying ? '▶' : index + 1}
              </div>

              {/* Song Info */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold truncate ${
                    song.isNowPlaying ? 'text-primary' : 'text-zinc-900'
                  }`}
                >
                  {song.title}
                </p>
                <p className="text-xs text-zinc-500 truncate">{song.artist}</p>
              </div>

              {/* Duration */}
              <div className="text-xs text-zinc-500 flex-shrink-0">{song.duration}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-200 bg-zinc-50">
        <p className="text-xs text-zinc-600">{QUEUE_SONGS.length} songs in queue</p>
      </div>
    </div>
  );
}