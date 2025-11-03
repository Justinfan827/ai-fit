import { z } from "zod"
import type { QueryCtx } from "./_generated/server"

//  {
//   tokenIdentifier: 'https://leading-ostrich-95.clerk.accounts.dev|user_34lDzZ3pM8gleRe5XXYelZUvzHm',
//   issuer: 'https://leading-ostrich-95.clerk.accounts.dev',
//   subject: 'user_34lDzZ3pM8gleRe5XXYelZUvzHm',
//   name: 'Justin Fan',
//   givenName: 'Justin',
//   familyName: 'Fan',
//   pictureUrl: 'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvdXBsb2FkZWQvaW1nXzM0d2V3TDFQaExtcmJYREcxRzRtMkdLMUljVCJ9',
//   email: 'justinfan827@gmail.com',
//   emailVerified: true,
//   phoneNumberVerified: false,
//   updatedAt: '2025-11-03T00:25:51+00:00'
// }

const clerkSchema = z.object({
  tokenIdentifier: z.string(),
  issuer: z.string(),
  subject: z.string(),
  name: z.string(),
  givenName: z.string(),
  familyName: z.string(),
  pictureUrl: z.string(),
})

const throwIfNotAuthenticated = async (ctx: QueryCtx) => {
  const identity = await ctx.auth.getUserIdentity()
  const { success, data } = clerkSchema.safeParse(identity)
  if (!success) {
    throw new Error("Not authenticated")
  }
  const dbuser = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("externalId"), data.subject))
    .first()
  if (dbuser === null) {
    throw new Error("Not authenticated")
  }
  return {
    id: dbuser._id,
    email: dbuser.email,
    firstName: dbuser.firstName,
    lastName: dbuser.lastName,
    avatarURL: dbuser.avatarURL,
  }
}

export { throwIfNotAuthenticated }
