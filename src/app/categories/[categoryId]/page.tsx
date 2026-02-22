'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  albumCover: string;
}

interface CategoryData {
  name: string;
  description: string;
  songs: Song[];
}

const MOCK_SONGS: Song[] = [
  {
    id: '1',
    title: 'Humble',
    artist: 'Kendrick Lamar',
    duration: '2:57',
    albumCover: '/demo/album-covers/humble.jpeg',
  },
  {
    id: '2',
    title: 'I Wonder',
    artist: 'Kanye West',
    duration: '4:16',
    albumCover: '/demo/album-covers/i-wonder.png',
  },
  {
    id: '3',
    title: 'God\'s Plan',
    artist: 'Drake',
    duration: '3:19',
    albumCover: '/demo/album-covers/gods-plan.jpg',
  },
  {
    id: '4',
    title: 'Mo Money Mo Problems',
    artist: 'The Notorious B.I.G.',
    duration: '3:35',
    albumCover: '/demo/album-covers/mo-money.jpg',
  },
  {
    id: '5',
    title: 'Lose Yourself',
    artist: 'Eminem',
    duration: '5:26',
    albumCover: '/demo/album-covers/lose-yourself.jpg',
  },
  {
    id: '6',
    title: 'Still D.R.E.',
    artist: 'Dr. Dre ft. Snoop Dogg',
    duration: '4:41',
    albumCover: '/demo/album-covers/still-dre.jpg',
  },
  {
    id: '7',
    title: 'Gold Digger',
    artist: 'Kanye West ft. Jamie Foxx',
    duration: '3:38',
    albumCover: '/demo/album-covers/gold-digger.jpg',
  },
  {
    id: '8',
    title: 'In Da Club',
    artist: '50 Cent',
    duration: '3:03',
    albumCover: '/demo/album-covers/in-da-club.jpg',
  },
];

export default function CategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState<{
    categoryId: string;
  } | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Resolve params
  useEffect(() => {
    params.then((resolved) => {
      setResolvedParams(resolved);
    });
  }, [params]);

  // Fetch category data
  useEffect(() => {
    if (!resolvedParams) return;

    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/categories/${resolvedParams.categoryId}`);
        // const data = await response.json();

        // Mock data for now
        setCategoryData({
          name: 'Rap & Hip-Hop',
          description: 'The most energetic and powerful beats.',
          songs: MOCK_SONGS,
        });
      } catch (error) {
        console.error('Failed to fetch category data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [resolvedParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black p-8">
        <div className="text-white text-center">Loading...</div>
      </div>
    );
  }

  if (!categoryData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black p-8">
        <div className="text-white text-center">Category not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black">
      {/* Header Section */}
      <div
        className="relative p-8 border-b border-zinc-800 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/demo/category-banners/rap-background.jpg)',
        }}
      >
        {/* Dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/70"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            {categoryData.name}
          </h1>
          <p className="text-lg text-zinc-200">{categoryData.description}</p>
        </div>
      </div>

      {/* Songs List */}
      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        <div className="p-8 space-y-3">
          {categoryData.songs.map((song, index) => (
            <div
              key={song.id}
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer group"
            >
              {/* Row Number */}
              <div className="text-zinc-500 font-semibold min-w-8 text-center group-hover:text-white">
                {index + 1}
              </div>

              {/* Album Cover */}
              <div className="relative w-16 h-16 flex-shrink-0 rounded bg-zinc-800 flex items-center justify-center">
                {imageErrors.has(song.id) ? (
                  <div className="text-zinc-400 text-2xl font-light">?</div>
                ) : (
                  <Image
                    src={song.albumCover}
                    alt={song.title}
                    fill
                    className="object-cover rounded"
                    onError={() => {
                      setImageErrors((prev) => new Set(prev).add(song.id));
                    }}
                  />
                )}
              </div>

              {/* Song Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate group-hover:text-blue-400">
                  {song.title}
                </h3>
                <p className="text-zinc-400 text-sm truncate">{song.artist}</p>
              </div>

              {/* Duration */}
              <div className="text-zinc-500 text-sm font-medium min-w-12 text-right">
                {song.duration}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
