import { Tp } from '@/components/typography'
import { cn } from '@/lib/utils'
import { ChangeEventHandler, useState } from 'react'

export default function EditableTypography({
  value,
  valueDefault = 'Untitled',
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
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault()
      e.currentTarget?.blur()
    }
  }

  return (
    <div
      className="focus-visible:ring-ring flex h-8 w-fit max-w-[200px] min-w-[100px] items-center justify-start rounded-md focus-visible:ring-1 focus-visible:outline-hidden sm:max-w-[400px] sm:min-w-[100px]"
      tabIndex={0}
      onKeyUp={(e) => e.key === 'Enter' && setIsEditing(true)}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          autoFocus
          className={cn(
            'bg-background w-[200px] text-lg leading-7 font-semibold tracking-normal focus:border-0 focus:ring-0 focus:outline-hidden sm:w-[400px]',
            className && className
          )}
        />
      ) : (
        <Tp
          className={cn(
            'truncate leading-none tracking-wide underline decoration-neutral-300 decoration-dotted underline-offset-4',
            className,
            !value && 'text-neutral-500'
          )}
          variant="h3"
        >
          {value || valueDefault}
        </Tp>
      )}
    </div>
  )
}
