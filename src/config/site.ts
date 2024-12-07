// https://supabase.com/docs/guides/auth#redirect-urls-and-wildcards
export function getSiteURL() {
  // https://vercel.com/docs/concepts/projects/environment-variables/system-environment-variables
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_BRANCH_URL ?? // Automatically set by Vercel.
    // TODO: handle preview urls.
    // Unfortunately I don't know of a good way to determine whether
    // we're in a Vercel preview deployment or not.
    // process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/'
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
  return url
}

export const siteConfig = {
  name: 'AI Strong',
  auth: {
    callbackURL: ({ query }: { query?: URLSearchParams }) =>
      `${getSiteURL()}api/auth/callback${query ? `?${query}` : ''}`,
  },
}
