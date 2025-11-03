import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import type { Metadata } from "next"
import { Lora } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
})

export const metadata: Metadata = {
  title: "AI Fitness Workout Generator",
  description: "AI Fitness Workout Generator",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      className={`${GeistSans.variable} ${GeistMono.variable} ${lora.variable}`}
      lang="en"
      suppressHydrationWarning // temporarily: https://github.com/pacocoursey/next-themes/tree/bf0c5a45eaf6fb2b336a6b93840e4ec572bc08c8?tab=readme-ov-file#with-app
    >
      <body className={"h-screen w-full"}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
