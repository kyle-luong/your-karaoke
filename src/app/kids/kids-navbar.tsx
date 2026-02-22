"use client";

import Link from "next/link";
import { User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithGoogle, signOut } from "@/app/frontend/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KidsNavbarProps {
  userEmail?: string | null;
  userImage?: string | null;
}

export function KidsNavbar({ userEmail, userImage }: KidsNavbarProps) {
  return (
    <nav className="kids-navbar sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="text-3xl" role="img" aria-label="star">
            ⭐
          </span>
          <span className="text-xl font-black tracking-tight text-white drop-shadow-sm">
            Lyric<span className="text-yellow-200">Lab</span>{" "}
            <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-sm font-bold">
              Kids
            </span>
          </span>
        </Link>

        {/* Nav links + auth */}
        <div className="flex items-center gap-2">
          <Link
            href="/songs/karaoke"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wide hover:bg-white/30 transition-colors"
          >
            🎤 Sing
          </Link>
          <button
            onClick={() => {
              const port = window.location.port
                ? `:${window.location.port}`
                : "";
              window.location.href = `${window.location.protocol}//localhost${port}`;
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wide hover:bg-white/30 transition-colors"
          >
            🔙 Main Site
          </button>

          {/* Login / User menu — same as main navbar */}
          {userEmail ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-white/30 overflow-hidden"
                >
                  {userImage ? (
                    <img
                      src={userImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="size-5 text-white" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">Account</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userEmail}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/settings"
                    className="cursor-pointer flex items-center"
                  >
                    <Settings className="mr-2 size-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer flex items-center"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 size-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-white border border-white/30 hover:bg-white/20 hover:text-white"
              onClick={() => signInWithGoogle()}
            >
              <div className="bg-white p-0.5 rounded-sm">
                <svg className="size-3.5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
