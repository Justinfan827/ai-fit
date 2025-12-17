import { ClerkProvider } from "@clerk/clerk-react"

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!PUBLISHABLE_KEY) {
  throw new Error("Add VITE_CLERK_PUBLISHABLE_KEY to .env.local")
}

export default function AppClerkProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider afterSignOutUrl="/" publishableKey={PUBLISHABLE_KEY}>
      {children}
    </ClerkProvider>
  )
}
