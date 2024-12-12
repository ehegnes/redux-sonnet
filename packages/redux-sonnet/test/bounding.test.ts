import { assert, describe, it } from "@effect/vitest"
import type { Action, Reducer } from "@reduxjs/toolkit"
import { applyMiddleware, createStore } from "@reduxjs/toolkit"
import { Effect, Fiber, identity, pipe, Stream } from "effect"
import { Sonnet, Stanza } from "redux-sonnet"

describe("bounding", () => {
  it.effect("unbounded", () =>
    Effect.gen(function*() {
      const sonnet = Sonnet.make(
        Sonnet.layer({
          // strategy: "bounded",
          capacity: 8
        })
      )

      const reducer: Reducer = identity

      applyMiddleware(sonnet.middleware)(createStore)(reducer)

      const s1 = Stanza.make(() =>
        pipe(
          Stream.range(1, 1000),
          Stream.map((n) =>
            ({
              type: n.toString()
            }) as Action
          )
        )
      )

      const fiber = sonnet.run(s1)

      yield* Fiber.join(fiber)

      assert(true)
    }))

  it.effect("bounded", () =>
    Effect.gen(function*() {
    }))

  it.effect("sliding", () =>
    Effect.gen(function*() {
    }))
})
