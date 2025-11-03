import { config } from "dotenv"
import type { Id } from "../convex/_generated/dataModel"
import { seedExercises } from "./seed-platform-exercises"

// Load environment variables from .env.local
config({ path: ".env.local" })

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL

if (!CONVEX_URL) {
  console.error("❌ Error: CONVEX_URL not found in environment variables")
  console.error("Please set NEXT_PUBLIC_CONVEX_URL or CONVEX_URL in .env.local")
  process.exit(1)
}

// You need to replace this with your actual platform user ID
// You can get this from the Convex dashboard or by querying your users table
const PLATFORM_USER_ID = process.env.PLATFORM_USER_ID

if (!PLATFORM_USER_ID) {
  console.error("❌ Error: PLATFORM_USER_ID not found in environment variables")
  console.error("Please set PLATFORM_USER_ID in .env.local")
  console.error(
    "This should be the Convex user ID (_id from the users table) to own the platform exercises"
  )
  process.exit(1)
}

console.log("🚀 Starting exercise seed process...")
console.log(`📡 Convex URL: ${CONVEX_URL}`)
console.log(`👤 Platform User ID: ${PLATFORM_USER_ID}`)

seedExercises({
  userId: PLATFORM_USER_ID as Id<"users">,
  convexUrl: CONVEX_URL,
}).catch((error) => {
  console.error("❌ Fatal error during seeding:", error)
  process.exit(1)
})
