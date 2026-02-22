"use client";
import { useState } from "react";
import { Share2, Copy, X } from "lucide-react";
import { toast } from "sonner";

export function SharePopout({ inviteCode }: { inviteCode: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/j/${inviteCode}` : "";
  const copy = () => { navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-full transition-all text-xs font-bold shadow-lg">
        <Share2 className="size-3" /> SHARE INVITE
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-72 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 text-white">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-[10px] uppercase tracking-widest text-zinc-400">Invite Partner</h4>
              <button onClick={() => setIsOpen(false)}><X className="size-3 opacity-50" /></button>
            </div>
            <div className="flex items-center gap-2">
              <input className="flex-1 bg-black p-2 text-[10px] rounded-lg border border-zinc-800 outline-none" value={shareUrl} readOnly />
              <button onClick={copy} className="p-2 bg-white text-black rounded-lg hover:bg-zinc-200"><Copy className="size-3" /></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}