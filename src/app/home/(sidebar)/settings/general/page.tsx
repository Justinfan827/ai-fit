import { SiteHeader } from "@/components/site-header"

export default function SettingsGeneralPage() {
  return (
    <>
      <SiteHeader left={"General"} />
      <div
        className="@container/main flex flex-1 flex-col"
        id="programs content"
      >
        <div className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-4 md:py-6">
          General Settings
        </div>
      </div>
    </>
  )
}
