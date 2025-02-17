import { assert, describe, expect, it } from "@effect/vitest"
import { Exit, Fiber, identity, pipe, Stream } from "effect"
import * as Effect from "effect/Effect"
import type { Action, Reducer } from "redux"
import { applyMiddleware, legacy_createStore as createStore } from "redux"
import { Sonnet, Stanza } from "redux-sonnet"

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

  it.effect("interrupts when all root stanza exits", () =>
    Effect.gen(function*() {
      const sonnet = Sonnet.make(
        Effect.void,
        Sonnet.defaultLayer
      )

      const result = yield* Fiber.await(sonnet.fiber)

      assert.deepStrictEqual(result, Exit.void)
    }))

  describe("bounding", () => {
    it("unbounded", () =>
      Effect.gen(function*() {
        const sonnet = Sonnet.make(
          Stanza.make(() =>
            pipe(
              Stream.range(1, 1000),
              Stream.map((n) =>
                ({
                  type: n.toString()
                }) as Action
              )
            )
          ),
          Sonnet.layer({
            backing: {
              strategy: "unbounded"
            }
          })
        )

        const reducer: Reducer = identity

        applyMiddleware(sonnet)(createStore)(reducer)

        yield* Fiber.join(sonnet.fiber)

        assert(true)
      }))

    it.skip("bounded", () =>
      Effect.gen(function*() {
      }))

    it.skip("dropping", () =>
      Effect.gen(function*() {
      }))

    it.skip("sliding", () =>
      Effect.gen(function*() {
      }))
  })
})
