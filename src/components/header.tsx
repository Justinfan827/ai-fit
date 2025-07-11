import { Logo } from "@/components/icons"
import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Usermenu } from "@/components/user-dropdown"

export default async function Header({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b px-4">
      <div className="flex shrink-0 items-center justify-start gap-4">
        <Logo />
        <Separator className="h-4" orientation="vertical" />
        <Breadcrumb>
          <BreadcrumbList>{children}</BreadcrumbList>
        </Breadcrumb>
      </div>
      <Usermenu />
    </header>
  )
}

export function UnauthHeader() {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b px-4">
      <div className="flex shrink-0 items-center justify-start gap-4">
        <Logo />
      </div>
    </header>
  )
}
