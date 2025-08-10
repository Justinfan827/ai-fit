"use client"

import { Command as CommandPrimitive, useCommandState } from "cmdk"
import { X } from "lucide-react"
import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  forwardRef,
  type KeyboardEvent,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useFormField } from "@/components/ui/form"
import { cn } from "@/lib/utils"

export interface Option {
  value: string
  label: string
  /** any count associated with the option */
  count?: number
  /** sub label to display on the right side of the row*/
  subLabel?: string
  /** if this option is selected, no other option can be selected */
  singular?: boolean
  /** an element to show after the badge label, before the close icon */
  badgeSuffix?: React.ReactNode
}

interface MultiSelectProps {
  /** controlled input value */
  value: string[]
  /** Input options to select from */
  options: Option[]
  /* Options that cannot be selected with any other options */
  singularOptions?: Option[]
  /** Controlled component selected options */
  /** Placeholder for the input */
  placeholder?: string
  /** OnChange listener triggered when a selection occurs.*/
  onChange?: (options: string[]) => void
  /** Limit the maximum number of selected options. */
  maxSelected?: number
  /** When the number of selected options exceeds the limit, the onMaxSelected will be called. */
  onMaxSelected?: (maxLimit: number) => void
  /** Hide the placeholder when there are options selected. */
  hidePlaceholderWhenSelected?: boolean
  /** Empty component. */
  emptyIndicator?: React.ReactNode
  disabled?: boolean
  className?: string
  badgeClassName?: string
  /**
   * First item selected is a default behavior by cmdk. That is why the default is true.
   * This is a workaround solution by add a dummy item.
   *
   * @reference: https://github.com/pacocoursey/cmdk/issues/171
   */
  selectFirstItem?: boolean
  /** Props of `Command` */
  commandProps?: ComponentPropsWithoutRef<typeof Command>
  /** Props of `CommandInput` */
  inputProps?: Omit<
    ComponentPropsWithoutRef<typeof CommandPrimitive.Input>,
    "value" | "placeholder" | "disabled"
  >
  /** form errors */
  error?: string
}

export interface MultiSelectRef {
  selectedValue: string[]
  input: HTMLInputElement
}

/**
 * The `CommandEmpty` of shadcn/ui will cause the cmdk empty not rendering correctly.
 * So we create one and copy the `Empty` implementation from `cmdk`.
 *
 * @reference: https://github.com/hsuanyi-chou/shadcn-ui-expansions/issues/34#issuecomment-1949561607
 */
const CommandEmpty = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof CommandPrimitive.Empty>
>(({ className, ...props }, forwardedRef) => {
  const render = useCommandState((state) => state.filtered.count === 0)

  if (!render) return null

  return (
    <div
      className={cn("py-6 text-center text-sm", className)}
      cmdk-empty=""
      ref={forwardedRef}
      role="presentation"
      {...props}
    />
  )
})

CommandEmpty.displayName = "CommandEmpty"

const MultiSelectInput = forwardRef<MultiSelectRef, MultiSelectProps>(
  (
    {
      onChange,
      placeholder,
      value,
      options,
      maxSelected = Number.MAX_SAFE_INTEGER,
      onMaxSelected,
      hidePlaceholderWhenSelected,
      disabled,
      className,
      badgeClassName,
      selectFirstItem = true,
      commandProps,
      emptyIndicator,
      error,
      inputProps,
    }: MultiSelectProps,
    ref: Ref<MultiSelectRef>
  ) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [open, setOpen] = useState(false)
    const [onScrollbar, setOnScrollbar] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null) // Added this

    const selectedValues = (value ?? []).filter((v) =>
      options.some((o) => o.value === v)
    )
    const hasSelected = selectedValues.length > 0
    const [inputValue, setInputValue] = useState("")

    useImperativeHandle(
      ref,
      () => ({
        selectedValue: [...selectedValues],
        input: inputRef.current as HTMLInputElement,
        focus: () => inputRef.current?.focus(),
      }),
      [selectedValues]
    )

    const handleClickOutside = useCallback((event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }, [])

    // Update form when internal value changes
    const handleChange = useCallback(
      (newValues: string[]) => {
        onChange?.(newValues) // notify RHF
      },
      [onChange]
    )

    const handleUnselect = useCallback(
      (option: string) => {
        const newOptions = selectedValues.filter((s) => s !== option)
        handleChange(newOptions)
      },
      [selectedValues, handleChange]
    )

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current
      // Note: This is not a default behavior of the <input /> field
      if (input && e.key === "Escape") {
        input.blur()
        setOpen(false)
      }
    }

    useEffect(() => {
      if (open) {
        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("touchend", handleClickOutside)
      } else {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("touchend", handleClickOutside)
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("touchend", handleClickOutside)
      }
    }, [open, handleClickOutside])

    const commandFilter = useCallback(() => {
      if (commandProps?.filter) {
        return commandProps.filter
      }
      return
    }, [commandProps?.filter])

    return (
      <Command
        ref={dropdownRef}
        {...commandProps}
        className={cn(
          "h-auto overflow-visible bg-transparent",
          commandProps?.className
        )}
        filter={commandFilter()}
        onKeyDown={(e) => {
          handleKeyDown(e)
          commandProps?.onKeyDown?.(e)
        }}
        shouldFilter={
          commandProps?.shouldFilter !== undefined
            ? commandProps.shouldFilter
            : true
        }
      >
        <div
          className={cn(
            "min-h-10 rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            selectedValues.length !== 0 && "px-3 py-2",
            !disabled && selectedValues.length !== 0 && "cursor-text",
            disabled && "cursor-not-allowed opacity-50",
            error ? "border-destructive" : "border-input",
            className
          )}
          onClick={() => {
            if (!disabled) {
              inputRef.current?.focus()
            }
          }}
        >
          <div className="relative flex flex-wrap items-center gap-1">
            {hasSelected && (
              <div className="flex items-center justify-center">
                <div className="h-5 rounded-l-full bg-primary pl-2 text-primary-foreground">
                  <span>{selectedValues.length}</span>
                </div>
                <div className="h-5 rounded-r-full bg-primary pl-1">
                  <Button
                    className={cn(
                      "m-0 h-5 w-5 rounded-full p-0 hover:bg-[#2E2E31]"
                    )}
                    onClick={() => handleChange([])}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleChange([])
                        inputRef.current?.focus()
                      }
                    }}
                    type="button"
                  >
                    <Icons.x className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <CommandPrimitive.Input
              {...inputProps}
              className={cn(
                "flex-1 bg-transparent outline-none placeholder:text-muted-foreground",
                {
                  "w-full": hidePlaceholderWhenSelected,
                  "px-3 py-2": selectedValues.length === 0,
                  "ml-1": selectedValues.length !== 0,
                  "cursor-not-allowed": disabled,
                },
                inputProps?.className
              )}
              disabled={disabled}
              onBlur={(event) => {
                if (!onScrollbar) {
                  setOpen(false)
                }
                inputProps?.onBlur?.(event)
              }}
              onFocus={(event) => {
                setOpen(true)
                inputProps?.onFocus?.(event)
              }}
              onValueChange={(newValue) => {
                setInputValue(newValue)
                inputProps?.onValueChange?.(newValue)
              }}
              placeholder={
                hidePlaceholderWhenSelected && selectedValues.length !== 0
                  ? ""
                  : placeholder
              }
              ref={inputRef}
              value={inputValue}
            />

            <span
              className={cn(
                "flex items-center justify-center",
                selectedValues.length === 0 && "pr-3"
              )}
            >
              <Icons.chevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200 ease-in-out",
                  open ? "rotate-180 transform" : ""
                )}
              />
            </span>
          </div>
        </div>
        <div className="relative">
          {open && (
            <CommandList
              className="absolute top-1 z-20 w-full animate-in rounded-md border bg-popover text-popover-foreground shadow-md outline-none"
              onMouseEnter={() => {
                setOnScrollbar(true)
              }}
              onMouseLeave={() => {
                setOnScrollbar(false)
              }}
              onMouseUp={() => {
                inputRef.current?.focus()
              }}
            >
              <CommandEmpty>{emptyIndicator}</CommandEmpty>
              {!selectFirstItem && <CommandItem className="hidden" value="-" />}
              <CommandGroup className="h-full overflow-auto">
                {options.map((option) => (
                  <MultiSelectItem
                    key={option.value}
                    maxSelected={maxSelected}
                    onChange={handleChange}
                    onMaxSelected={onMaxSelected}
                    option={option}
                    setInputValue={setInputValue}
                    value={selectedValues}
                  />
                ))}
              </CommandGroup>
            </CommandList>
          )}
        </div>
        {hasSelected && (
          <div className="flex flex-wrap gap-x-2 gap-y-1 pt-2">
            {selectedValues.map((selectedValue) => {
              const selectedOption = options.find(
                (o) => o.value === selectedValue
              )!
              return (
                <Badge
                  className={cn(
                    "rounded-full border-dashed bg-background py-1 text-muted-foreground hover:bg-muted",
                    disabled && "cursor-not-allowed opacity-50",
                    badgeClassName
                  )}
                  key={selectedValue}
                  variant="outline"
                >
                  <span className="max-w-[100px] truncate">
                    {selectedOption.label}
                  </span>
                  {selectedOption.badgeSuffix && (
                    <>
                      <span className="ml-1" />
                      {selectedOption.badgeSuffix}
                    </>
                  )}
                  <button
                    className={cn(
                      "ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      disabled && "hidden"
                    )}
                    onClick={() => handleUnselect(selectedValue)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(selectedValue)
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    type="button"
                  >
                    <X className="h-4 w-4 hover:scale-105 hover:text-foreground hover:transition-transform" />
                  </button>
                </Badge>
              )
            })}
          </div>
        )}
      </Command>
    )
  }
)

MultiSelectInput.displayName = "MultiSelectInput"

type MultiSelectItemProps = {
  option: Option
  value: string[]
  setInputValue: (value: string) => void
  onChange: (options: string[]) => void
  onMaxSelected?: (maxLimit: number) => void
  maxSelected: number
}
const MultiSelectItem = ({
  option,
  value,
  setInputValue,
  onChange,
  maxSelected,
  onMaxSelected,
}: MultiSelectItemProps) => {
  const handleSelectOrUnselect = (selectedValue: string) => {
    const alreadySelectd = value.find(
      (select) => selectedValue.toLowerCase() === select.toLowerCase()
    )
    if (alreadySelectd) {
      const newSelectedValues = value.filter((s) => s !== selectedValue)
      onChange(newSelectedValues)
      return
    }
    if (value.length >= maxSelected) {
      onMaxSelected?.(value.length)
      return
    }
    setInputValue("")
    if (option.singular) {
      onChange([option.value])
      return
    }
    const newSelected = [...value, option.value]
    onChange(newSelected)
  }
  const isSelected = value.find(
    (select) => select.toLowerCase() === option.value.toLowerCase()
  )
  return (
    <CommandItem
      className="cursor-pointer"
      keywords={[option.label]}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onSelect={handleSelectOrUnselect}
      value={option.value}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center justify-start gap-2">
          <div
            className={cn(
              "h-4 w-4 shrink-0 rounded-sm border border-primary",
              isSelected && "bg-primary text-primary-foreground"
            )}
          >
            <div className="">
              <Icons.check
                className={cn("hidden h-4 w-4", isSelected && "block")}
              />
            </div>
          </div>
          <span className={cn("max-w-[250px] truncate")}>{option.label}</span>
        </div>
        {option.subLabel && (
          <div className="truncate text-clip text-muted-foreground">
            {option.subLabel}
          </div>
        )}
      </div>
    </CommandItem>
  )
}

MultiSelectItem.displayName = "MultiSelectItem"

const MultiSelectFormInput = forwardRef<MultiSelectRef, MultiSelectProps>(
  (props, ref) => {
    const { error } = useFormField()
    const errMsg = error?.message as string
    return <MultiSelectInput {...props} error={errMsg} ref={ref} />
  }
)

MultiSelectFormInput.displayName = "MultiSelectFormInput"

export default MultiSelectInput
export { MultiSelectFormInput }
