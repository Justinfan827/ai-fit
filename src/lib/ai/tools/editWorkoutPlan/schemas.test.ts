import { zodSchema } from "ai"
import { describe, expect, it } from "vitest"
import { log } from "@/lib/logger/logger"
import { editOperationWrappedSchema } from "./schemas"

describe("editOperationSchema", () => {
  it("should be valid", () => {
    const schema = zodSchema(editOperationWrappedSchema)
    // TODO: this is just for seeing the schema in the console. remove later
    log.consoleJSON(schema)
    expect(schema).toBeDefined()
  })
})
