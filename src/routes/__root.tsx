import { TanStackDevtools } from "@tanstack/react-devtools"
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import ClerkProvider from "../integrations/clerk/provider"
import ConvexProvider from "../integrations/convex/provider"
import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AI Fitness Workout Generator" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="h-screen w-full">
        <ClerkProvider>
          <ConvexProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              disableTransitionOnChange
              enableSystem
            >
              {children}
              <Toaster />
              <TanStackDevtools
                config={{ position: "bottom-right" }}
                plugins={[
                  { name: "Router", render: <TanStackRouterDevtoolsPanel /> },
                ]}
              />
            </ThemeProvider>
          </ConvexProvider>
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  )
}
