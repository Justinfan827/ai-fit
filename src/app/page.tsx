import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
export default async function Page() {
  // if authenticated, redirect to home/clients
  const { isAuthenticated } = await auth()
  if (isAuthenticated) {
    redirect("/home/clients")
  }
  redirect("/login")
}
