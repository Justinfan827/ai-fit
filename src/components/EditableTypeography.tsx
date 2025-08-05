import { type ChangeEventHandler, useState } from "react"
import { Tp } from "@/components/typography"
import { cn } from "@/lib/utils"

export default function EditableTypography({
  value,
  valueDefault = "Untitled",
  onChange,
  className,
}: {
  value: string
  valueDefault?: string
  onChange: (value: string) => void
  className?: string
}) {
  const [isEditing, setIsEditing] = useState(false)

  const handleBlur = () => {
    setIsEditing(false)
  }

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault()
      e.currentTarget?.blur()
    }
  }

  return (
    <div
      className="flex h-8 w-fit min-w-[100px] max-w-[200px] items-center justify-start rounded-md focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring sm:min-w-[100px] sm:max-w-[400px]"
      onClick={() => !isEditing && setIsEditing(true)}
      onKeyUp={(e) => e.key === "Enter" && setIsEditing(true)}
      tabIndex={0}
    >
      {isEditing ? (
        <input
          autoFocus
          className={cn(
            "w-[200px] bg-background font-semibold text-lg leading-7 tracking-normal focus:border-0 focus:outline-hidden focus:ring-0 sm:w-[400px]",
            className
          )}
          onBlur={handleBlur}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          type="text"
          value={value}
        />
      ) : (
        <Tp
          className={cn(
            "truncate leading-none tracking-wide underline decoration-neutral-300 decoration-dotted underline-offset-4",
            className,
            !value && "text-neutral-500"
          )}
          variant="h3"
        >
          {value || valueDefault}
        </Tp>
      )}
    </div>
  )
}
