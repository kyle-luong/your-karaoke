"use client"

import { Button } from "@/components/ui/button"
import { signInWithGoogle } from "@/app/frontend/auth"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export function HomeActions({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter()

  const handleCreateLobby = () => {
    if (!isAuthenticated) {
      signInWithGoogle()
    } else {
      router.push("/party/new")
    }
  }

  return (
    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
      <Button size="lg" className="gap-2" onClick={handleCreateLobby}>
        <Plus className="size-5" />
        Create Lobby
      </Button>
    </div>
  )
}