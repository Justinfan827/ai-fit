import { Icons } from "@/components/icons"
import { Separator } from "@/components/ui/separator"
import type { ValueWithUnit } from "@/lib/domain/clients"

interface StatCardProps {
  icon: React.ReactNode
  value: number
  valueUnit?: string
  label: string
}

const StatCard = ({ icon, value, valueUnit, label }: StatCardProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {icon}
      <div>
        {value}
        {valueUnit && (
          <span className="text-muted-foreground text-sm">{` ${valueUnit}`}</span>
        )}
      </div>
    </div>
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
  const stats = [
    {
      id: "age",
      icon: <Icons.user className="h-4 w-4" />,
      value: age,
      valueUnit: gender === "male" ? "Male" : "Female",
      label: "Age",
    },
    {
      id: "weight",
      icon: <Icons.scale className="h-4 w-4" />,
      value: weight.value,
      valueUnit: weight.unit,
      label: "Weight",
    },
    {
      id: "height",
      icon: <Icons.ruler className="h-4 w-4" />,
      value: height.value,
      valueUnit: height.unit,
      label: "Height",
    },
  ]

  return (
    <div className="flex items-center gap-4">
      <StatCard {...stats[0]} />
      <Separator
        className="mx-1 data-[orientation=vertical]:h-4"
        orientation="vertical"
      />
      <StatCard {...stats[1]} />
      <Separator
        className="mx-1 data-[orientation=vertical]:h-4"
        orientation="vertical"
      />
      <StatCard {...stats[2]} />
    </div>
  )
}
