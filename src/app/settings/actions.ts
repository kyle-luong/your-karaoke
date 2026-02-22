"use server"

import { createClient } from "@supabase/supabase-js"
import { createServerSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function deleteAccount() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: "Not authenticated" }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

  if (error) {
    console.error("Delete error:", error.message)
    return { error: "Failed to delete account" }
  }

  await supabase.auth.signOut()
  redirect("/")
}