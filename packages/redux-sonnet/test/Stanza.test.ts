import { assert, describe, expect, it } from "@effect/vitest"
import { Effect, pipe, Stream } from "effect"
import { applyMiddleware, legacy_createStore as createStore } from "redux"
import { Sonnet, Stanza } from "redux-sonnet"
import { arrayReducer, INIT_ACTION } from "./utils.js"

describe("Stanza", () => {
  it.skip("isStanza", () => {
    const stanza = Stanza.fromEffect(Effect.succeed({ type: "ACTION" }))
    assert.isTrue(Stanza.isStanza(stanza))
  })

  it("fromEffect", async () => {
    const actual: Array<string> = []

    const stanza = Stanza.fromEffect(Effect.succeed({ type: "ACTION" }))

    const sonnet = Sonnet.make(stanza, Sonnet.defaultLayer)

    applyMiddleware(sonnet)(createStore)(arrayReducer(actual))

    const expected = [
      INIT_ACTION,
      { type: "ACTION" }
    ]

    await expect.poll(() => actual).toStrictEqual(expected)
  })

  it("fromStream", async () => {
    const actual: Array<string> = []

    const stanza = Stanza.fromStream(pipe(
      Stream.range(1, 3),
      Stream.map((i) => ({ type: `ACTION-${i}` }))
    ))

    const sonnet = Sonnet.make(stanza, Sonnet.defaultLayer)

    applyMiddleware(sonnet)(createStore)(arrayReducer(actual))

    const expected = [
      INIT_ACTION,
      { type: "ACTION-1" },
      { type: "ACTION-2" },
      { type: "ACTION-3" }
    ]

    await expect.poll(() => actual).toStrictEqual(expected)
  })
})
