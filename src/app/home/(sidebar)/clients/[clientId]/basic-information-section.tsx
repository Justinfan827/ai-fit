import { Icons } from "@/components/icons"
import { Separator } from "@/components/ui/separator"
import type { ValueWithUnit } from "@/lib/domain/clients"

interface StatCardProps {
  icon: React.ReactNode
  display: React.ReactNode
}

const StatCard = ({ icon, display }: StatCardProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {icon}
      <div>{display}</div>
    </div>
  )
}

const formatValueWithUnit = (value: number, unit: string): React.ReactNode => {
  return (
    <>
      {value}
      <span className="text-muted-foreground text-sm">{` ${unit}`}</span>
    </>
  )
}

const formatHeightInInches = (inches: number): React.ReactNode => {
  const feet = Math.floor(inches / 12)
  const remainingInches = inches % 12
  const formattedInches = remainingInches.toFixed(2)
  return (
    <>
      {feet}
      <span className="text-muted-foreground text-sm">ft </span>
      {formattedInches}
      <span className="text-muted-foreground text-sm">in</span>
    </>
  )
}

export default function ClientBasicInfoSection({
  age,
  gender,
  weight,
  height,
}: {
  age: number
  gender: string
  weight: ValueWithUnit
  height: ValueWithUnit
}) {
  const ageDisplay = formatValueWithUnit(
    age,
    gender === "male" ? "Male" : "Female"
  )
  const weightDisplay = formatValueWithUnit(weight.value, weight.unit)
  const heightDisplay =
    height.unit === "in"
      ? formatHeightInInches(height.value)
      : formatValueWithUnit(height.value, height.unit)

  return (
    <div className="flex items-center gap-4">
      <StatCard
        display={ageDisplay}
        icon={<Icons.user className="h-4 w-4" />}
      />
      <Separator
        className="mx-1 data-[orientation=vertical]:h-4"
        orientation="vertical"
      />
      <StatCard
        display={weightDisplay}
        icon={<Icons.scale className="h-4 w-4" />}
      />
      <Separator
        className="mx-1 data-[orientation=vertical]:h-4"
        orientation="vertical"
      />
      <StatCard
        display={heightDisplay}
        icon={<Icons.ruler className="h-4 w-4" />}
      />
    </div>
  )
}
