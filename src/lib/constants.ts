export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
)

const PAGES = {
  home: {
    title: "Home",
    url: "/home",
    matchRegex: "^/home$",
  },
  generateProgram: {
    title: "Generate Program",
    url: "/home/programs/generate",
    matchRegex: "^/home/programs/generate$",
  },
  programId: {
    title: "Program",
    url: (id: string) => `/home/programs/${id}`,
    matchRegex: "^/home/programs/:id$",
  },
  clientId: {
    title: "Client",
    url: (id: string) => `/home/clients/${id}`,
    matchRegex: "^/home/clients/:id$",
  },
}

export { PAGES }
