import MLoadingButton from "@/components/massor/buttons/m-buttons"

export default function Page() {
  return (
    <div>
      My Design System
      <div>
        Buttons
        <div className="flex items-center justify-center space-x-2">
          <p>Loading Buttons</p>
          <div className="flex flex-col space-y-2">
            <p> Default state</p>
            <MLoadingButton isLoading={false}>Loading Button</MLoadingButton>
          </div>
          <div className="flex flex-col space-y-2">
            <p>Loading state</p>
            <MLoadingButton isLoading={true}>Loading Button</MLoadingButton>
          </div>
        </div>
      </div>
    </div>
  )
}
