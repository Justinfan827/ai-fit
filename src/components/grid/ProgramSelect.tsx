import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

const options = [
  {
    value: "weekly",
    label: "Multi-Week",
  },
  {
    value: "splits",
    label: "Split",
  },
]

export function ProgramSelect({
  onValueChange,
  value,
}: {
  value: string
  onValueChange: (v: "weekly" | "splits") => void
}) {
  return (
    <Select onValueChange={onValueChange} value={value}>
      <SelectTrigger className="w-[160px]">
        <span className="text-muted-foreground">Type: </span>{" "}
        {options.find((o) => o.value === value)?.label}
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="weekly">Multi-Week</SelectItem>
          <SelectItem value="splits">Split</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
