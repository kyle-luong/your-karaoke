"use client";

import Link from "next/link";
import Image from "next/image";

export function KidsNavbar() {
  return (
    <nav className="kids-navbar sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Image
            src="/image.png"
            alt="LyricLab logo"
            width={44}
            height={44}
            className="rounded-lg"
          />
          <span className="text-xl font-black tracking-tight text-white drop-shadow-sm">
            LYRICLAB{" "}
            <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-sm font-bold">
              Kids
            </span>
          </span>
        </Link>

        <Link
          href="/songs/karaoke"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-bold uppercase tracking-wide hover:bg-white/30 transition-colors"
        >
          🎤 Sing
        </Link>
      </div>
    </nav>
  );
}
