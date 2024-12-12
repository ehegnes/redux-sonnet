import { assert, describe, expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import { Sonnet } from "redux-sonnet"

describe("Sonnet", () => {
  it("isSonnet", () => {
    assert.isTrue(
      Sonnet.isSonnet(Sonnet.make(Effect.void, Sonnet.defaultLayer))
    )
  })

  it.skip("toJSON", () => {
    assert.deepStrictEqual(
      Sonnet.make(Effect.void, Sonnet.defaultLayer).toJSON(),
      { unimplemented: true }
    )
  })

  it.skip("inspect", () => {
    if (typeof window === "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { inspect } = require("node:util")
      expect(
        inspect(Sonnet.make(Effect.void, Sonnet.defaultLayer))
      ).toEqual(
        inspect({ unimplemented: true })
      )
    }
  })
})
