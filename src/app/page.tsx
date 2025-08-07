import { redirect } from "next/navigation"
import { redirectAuthorizedUser } from "@/lib/supabase/server/auth-utils"

export default async function Page() {
  await redirectAuthorizedUser()
  redirect("/login")
}
