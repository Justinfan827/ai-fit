declare namespace NodeJS {
  interface ProcessEnv {
    // Convex
    readonly NEXT_PUBLIC_CONVEX_URL: string

    // Clerk
    readonly NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string
    readonly CLERK_JWT_ISSUER_DOMAIN: string
    readonly CLERK_WEBHOOK_SECRET: string

    // Supabase
    readonly NEXT_PUBLIC_SUPABASE_URL: string
    readonly NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string
    readonly SUPABASE_SERVICE_ROLE_KEY: string

    // Test/CI
    readonly PLAYWRIGHT_TEST_BASE_URL: string
    readonly PLAYWRIGHT: string
    readonly CI_PLAYWRIGHT: string

    // Standard Node.js/Next.js
    readonly NODE_ENV: "development" | "production" | "test"
  }
}
