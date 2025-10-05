import path from "node:path"
import { config } from "dotenv"

// Load .env.local file for tests
config({ path: path.resolve(__dirname, ".env.local") })
