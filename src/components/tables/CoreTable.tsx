import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type Row,
  type TableMeta,
  useReactTable,
} from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { type RefObject, useState, useTransition } from "react"
import { Icons } from "@/components/icons"
import TableProvider, {
  type TableRouter,
  useTableRouter,
} from "@/components/tables/hooks/useTableRouter"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn, isDefined } from "@/lib/utils"

interface CoreTableProps<TData> {
  ref: RefObject<HTMLTableSectionElement>
  columns: ColumnDef<TData>[]
  data: TData[]
  rowClick?: (router: TableRouter, row: Row<TData>) => void
  searchIsPending?: boolean
  meta?: TableMeta<TData>
  tableCellClassNames?: string[]
}

interface CoreTableStickyRightProps<TData> extends CoreTableProps<TData> {
  rightPinnedColumns?: string[]
  isUploadInProgress?: boolean
}
/*
 * CoreTableStickyRight supports right pinned columns.
 * Use for tables that require right pinned columns.
 * NOTE:
 *  The ref here is pointed to the TableBody element, NOT the table itself.
 */
const CoreTableStickyRightBase = <TData,>({
  columns,
  data,
  rowClick,
  searchIsPending,
  isUploadInProgress,
  meta,
  rightPinnedColumns,
  ref,
}: CoreTableStickyRightProps<TData>) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(isDefined(meta) && { meta }),
    state: {
      columnPinning: {
        right: rightPinnedColumns || [],
      },
    },
  })

  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null)

  const { router, isPending } = useTableRouter()
  return (
    <div className="relative w-full">
      {(isPending || searchIsPending) && (
        <div className="absolute z-20 h-full w-full rounded-b-md bg-background/80">
          <div className="-mx-6 -mt-6 absolute top-1/2 left-1/2">
            <Icons.spinner className="h-12 w-12 animate-spin text-muted-foreground" />
          </div>
        </div>
      )}
      <div className="no-scrollbar overflow-auto">
        {/* fix the positioning of loading spinner*/}
        <div className="px-1 pb-4">
          <Table
            className="border-separate border-spacing-0"
            // TODO: Support explicit sizing of the table
            // https://github.com/TanStack/table/issues/5115
            // {...(explicitWidth && {
            //   style: {
            //     width: table.getCenterTotalSize() + table.getRightTotalSize(),
            //   },
            // })}
          >
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup, headerGroupIdx) => {
                const numHeaderGroups = table.getHeaderGroups().length
                const numHeaders = headerGroup.headers.length
                return (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header, headerIdx) => {
                      return (
                        <TableHead
                          className={cn(
                            // NOTE: if changing the box shadow, also update the shadow in the sticky right columns.
                            // This header needs to mirror the format of the table body cells when in the last child position.
                            "whitespace-nowrap border-t border-b bg-accent/80 text-secondary-foreground first:rounded-tl-md first:border-l last:rounded-tr-md",
                            "last:border-r",
                            headerIdx === numHeaders - 1 &&
                              headerGroupIdx === numHeaderGroups - 1 &&
                              "rounded-tr-md",
                            header.column.getIsPinned() === "right" &&
                              "sticky right-0 z-10 rounded-tr-md bg-card last:shadow-[0.1rem_-0.1rem_0_1px_white,-3px_0px_3px_-2px_theme('colors.border')]"
                          )}
                          key={header.id}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableHeader>
            <TableBody ref={ref}>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, rowIdx) => (
                  <TableRow
                    className={cn(
                      rowClick &&
                        "cursor-pointer transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                      rowIdx === activeRowIdx && "bg-muted/50"
                    )}
                    data-state={row.getIsSelected() && "selected"}
                    key={row.id}
                    onClick={
                      rowClick
                        ? () => {
                            rowClick(router, row)
                            setActiveRowIdx(rowIdx)
                          }
                        : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => {
                      // const cellClassName =
                      //   cell.column.columnDef.meta?.cellClassName
                      return (
                        <TableCell
                          className={cn(
                            "whitespace-nowrap border-b first:border-l last:border-r",
                            cell.column.getIsPinned() === "right" &&
                              "sticky right-0 z-10 last:shadow-[-3px_0px_3px_-2px_theme('colors.border')] last:shadow-[0.2rem_0.2rem_0_1px_white,-3px_0px_3px_-2px_theme('colors.border')]",
                            table.getRowModel().rows?.length === rowIdx + 1 &&
                              "first:rounded-bl-md last:rounded-br-md"
                            // cellClassName
                          )}
                          // I'm sorry for this monstrosity. TLDR on how this works:
                          // the last: classes are for the last cell in the row, which needs to have a different border radius
                          // the first: classes are for the first cell in the row, which needs to have a different border radius
                          // the sticky right-0 z-10 classes are for the right pinned columns.
                          // the shadow classes are for the right pinned columns, which need a shadow on the left side.
                          key={cell.id}
                          style={{
                            width: cell.column.getSize(),
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  {/* TODO: fix empty state*/}
                  <TableCell
                    className={cn(
                      "h-24 rounded-bl-md border-r border-b border-l text-center",
                      !rightPinnedColumns?.length && "rounded-br-md"
                    )}
                    colSpan={columns.length - (rightPinnedColumns?.length || 0)}
                  >
                    {isUploadInProgress ? "Upload in progress" : "No results."}
                  </TableCell>
                  {(rightPinnedColumns?.length || 0) > 0 && (
                    <TableCell
                      className={cn(
                        "whitespace-nowrap border-b bg-card first:border-l last:border-r",
                        "sticky right-0 z-10 last:shadow-[-3px_0px_3px_-2px_theme('colors.border')]",
                        "first:rounded-bl-md last:rounded-br-md last:shadow-[0.2rem_0.2rem_0_1px_white,-3px_0px_3px_-2px_theme('colors.border')]"
                      )}
                    />
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  baseURL: string
  children: React.ReactNode[] | React.ReactNode
}

function GenericTable({ baseURL, className, children }: DataTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  return (
    <TableProvider
      baseURL={baseURL}
      isPending={isPending}
      router={router}
      startTransition={startTransition}
    >
      <div className={cn("space-y-4 px-2 pb-2", className)}>{children}</div>
    </TableProvider>
  )
}

export { GenericTable, CoreTableStickyRightBase as CoreTable }
