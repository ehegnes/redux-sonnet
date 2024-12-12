import { describe, it } from "@effect/vitest"
import {
  applyMiddleware,
  createStore,
  type Reducer,
  type UnknownAction
} from "@reduxjs/toolkit"
import { Context, Effect, Layer, ManagedRuntime, Stream } from "effect"
import { Operators, Sonnet, Stanza } from "redux-sonnet"
import { INIT_ACTION } from "./utils.js"

// describe.skip("Stanza (ng)", () => {
//   it("does a thing", () => {
//     const a = pipe(
//       Stanza.make((_action$, _state) => Stream.make({ type: "TYPE" })),
//       Stanza.bufferActions({ capacity: "unbounded" })
//     )
//   })
// })

describe("Sonnet (ng)", () => {
  it("builds standtard", () => {
    const _ = Sonnet.make()
  })
  it("build with an existing runtime", () => {
    const AContext = Context.GenericTag<"A">("A")
    const runtime = ManagedRuntime.make(
      Layer.effect(AContext, Effect.succeed("A" as const))
    )
    const _ = Sonnet.make().pipe(
      Sonnet.withRuntime(runtime)
    )
  })
  it.only("is a middleware?", async ({ expect }) => {
    const reducer: Reducer<Array<UnknownAction>> = (state = [], action) =>
      state.concat(action)

    expect.assertions(1)

    const stanza = Stanza.make((action$) =>
      Stream.merge(
        action$.pipe(
          Stream.filter(Operators.ofType("FIRE_1")),
          Stream.map(() => ({ type: "ACTION_1" }))
        ),
        action$.pipe(
          Stream.filter(Operators.ofType("FIRE_2")),
          Stream.map(() => ({ type: "ACTION_2" }))
        )
      )
    )

    const sonnet = Sonnet.make(
      stanza,
      Sonnet.defaultLayer
    )

    const store = createStore(reducer, applyMiddleware(sonnet))

    setTimeout(() => store.dispatch({ type: "FIRE_1" }), 0)
    setTimeout(() => store.dispatch({ type: "FIRE_2" }), 0)

    await expect.poll(() => store.getState()).toEqual([
      INIT_ACTION,
      { type: "FIRE_1" },
      { type: "ACTION_1" },
      { type: "FIRE_2" },
      { type: "ACTION_2" }
    ])
  })
})
