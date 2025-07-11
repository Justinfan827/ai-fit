"use client"

import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import { useEffect, useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

dayjs.extend(utc)
dayjs.extend(advancedFormat)
dayjs.extend(timezone)

interface TimeDisplayProps extends React.HTMLAttributes<HTMLParagraphElement> {
  dateString: string
  dateFormat: string
  customDateValue?: (date: dayjs.Dayjs) => string
}

// https://github.com/vercel/next.js/discussions/38263#discussioncomment-3070160
/* TimeDisplay is a component that displays a time string in the local
 * timezone without causing react hydration errors.
 *
 * The key is that with react SSR, the initial HTML rendered on the client and the server
 * needs to match EXACTLY (see useState rendering the time in UTC time).
 *
 * Once the client compiles the initial render, a useEffect hook will run and update
 * the time to the local timezone, thus solving for the mismatched server / client HTML
 * on initial render issue.
 */
function TimeDisplay({ ...props }: TimeDisplayProps) {
  const { dateString, dateFormat, customDateValue } = props

  // useState runs in both the server and client, so we need to make sure
  // the initial time is in UTC time to match the server rendered HTML.
  const [{ time, isInitialTime }, setDisplayTime] = useState(() => {
    const rowDate = dayjs.utc(dateString) // parse in UTC time
    return {
      time: rowDate.format(dateFormat || TIMESTAMP_FORMAT),
      isInitialTime: true,
    }
  })

  // useEffect runs only on the client, so we can safely update the time to the local timezone.
  useEffect(() => {
    setDisplayTime(() => {
      const rowDate = dayjs(dateString) // parse in local browser time
      return {
        time: customDateValue
          ? customDateValue(rowDate)
          : rowDate.format(dateFormat),
        isInitialTime: false,
      }
    })
  }, [dateString, dateFormat, customDateValue])

  return (
    <span
      className={cn(isInitialTime ? "invisible" : "visible", props.className)}
    >
      {time}
    </span>
  )
}

interface TimeDisplayTooltipProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  dateString: string
  buttonDateFormat: string
  tooltipDateFormat: string
}

// https://github.com/vercel/next.js/discussions/38263#discussioncomment-3070160
/* TimeDisplayTOoltip is a component that displays a time string in the local
 * timezone without causing react hydration errors.
 *
 * The key is that with react SSR, the initial HTML rendered on the client and the server
 * needs to match EXACTLY (see useState rendering the time in UTC time).
 *
 * Once the client comples the initial render, a useEffect hook will run and update
 * the time to the local timezone, thus solving for the mismatched server / client HTML
 * on initial render issue.
 */
function TimeDisplayTooltip({ ...props }: TimeDisplayTooltipProps) {
  const { dateString, buttonDateFormat, tooltipDateFormat } = props
  // useState runs in both the server and client, so we need to make sure
  // the initial time is in UTC time to match the server rendered HTML.
  const [{ tooltipTime, buttonTime, isInitialTime }, setDisplayTime] = useState(
    () => {
      const rowDate = dayjs.utc(dateString) // parse in UTC time
      return {
        tooltipTime: rowDate.format(tooltipDateFormat),
        buttonTime: rowDate.format(buttonDateFormat),
        isInitialTime: true,
      }
    }
  )

  // useEffect runs only on the client, so we can safely update the time to the local timezone.
  useEffect(() => {
    setDisplayTime(() => {
      const rowDate = dayjs(dateString) // parse in local browser time
      return {
        tooltipTime: rowDate.format(tooltipDateFormat),
        buttonTime: rowDate.format(buttonDateFormat),
        isInitialTime: false,
      }
    })
  }, [dateString, tooltipDateFormat, buttonDateFormat])

  return (
    <Tooltip>
      {/* optionally make this content take space, but remain invisible, to avoid layout shift*/}
      <TooltipTrigger
        asChild
        className={cn(
          "my-auto",
          isInitialTime ? "invisible" : "visible",
          props.className
        )}
      >
        <button>{buttonTime}</button>
      </TooltipTrigger>
      <TooltipContent
        align="start"
        className="space-y-[2px] border-input bg-secondary px-2 py-1 text-primary"
        side="top"
        sideOffset={0}
      >
        {tooltipTime}
      </TooltipContent>
    </Tooltip>
  )
}

// Looks like: `July 17, 2024 02:08:19 PM (PDT)`
// Should not be used with ToolTip Display
export const TIMESTAMP_FORMAT = "MMMM DD, YYYY hh:mm:ss A (z)"

// Looks like: `Jul 17, 2024`
// Tooltip:    `2:08 PM (PDT)`
export const DATE_FORMAT = "MMM D, YYYY"
export const DATE_TOOLTIP_FORMAT = "h:mm A (z)"

// Looks like: `Jul 17`
export const DATE_NO_YEAR_FORMAT = "MMM D"

// Looks like: `July 17, 2024`
// Tooltip:    `2:08 PM (PDT)`
export const DATE_LONG_FORMAT = "MMMM D, YYYY"
export const DATE_LONG_TOOLTIP_FORMAT = "h:mm A (z)"
export const DATE_LONG_FULL_FORMAT = "MMMM D, YYYY, h:mm A (z)"

// Looks like: `07/17/2024`
// Tooltip:    `2:08 PM (PDT)`
export const DATE_NUMERIC_FORMAT = "MM/DD/YYYY"
export const DATE_NUMERIC_TOOLTIP_FORMAT = "h:mm A (z)"

// Looks like: `Jul 17`
// Tooltip:    `2:08 PM (PDT)`
export const MONTH_DAY_FORMAT = "MMM D"
export const MONTH_DAY_TOOLTIP_FORMAT = "h:mm A (z)"

// Do not use this const. This is only for places where the timestamp itself has no
// timezone information on it (app-backend timestamps)
export const DO_NOT_USE_TIMESTAMP_NO_TZ = "MMMM DD, YYYY hh:mm:ss A"

export default TimeDisplay
export { TimeDisplayTooltip }
