export default function FrontendTipsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1>Frontend Tips</h1>
      <TipContainer>
        <TipDescription>
          Creating a link that spans the entire container using absolute
        </TipDescription>
        <TipCode>
          <div className="flex flex-col gap-2">
            {[
              { listItemName: "this is list item 1" },
              { listItemName: "this is list item 2" },
              { listItemName: "this is list item 3" },
            ].map((item, idx) => (
              <div
                className="relative isolate flex items-center gap-2 border border-muted-foreground p-4"
                key={item.listItemName}
              >
                <a
                  className="absolute inset-0 bg-pink-500/10"
                  href={`#${idx}`}
                />
                <div className="text-sm">{item.listItemName}</div>
              </div>
            ))}
          </div>
        </TipCode>
      </TipContainer>
    </div>
  )
}

function TipContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-md border p-4">{children}</div>
  )
}

function TipDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-muted-foreground text-sm">{children}</div>
}

function TipCode({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md bg-muted p-4">{children}</div>
}
