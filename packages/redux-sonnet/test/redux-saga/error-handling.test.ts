import { describe, expect, it } from "@effect/vitest"
import {
  Cause,
  Effect,
  Exit,
  Fiber,
  Layer,
  Logger,
  LogLevel,
  pipe,
  Schedule,
  Stream
} from "effect"
import { constVoid } from "effect/Function"
import { applyMiddleware, legacy_createStore as createStore } from "redux"
import { Sonnet, Stanza } from "redux-sonnet"
import { arrayReducer, INIT_ACTION } from "../utils.js"

describe("error handling", () => {
  it("throw", async () => {
    const actual: Array<unknown> = []

    const pushError = (e: Array<unknown>) => Effect.sync(() => actual.push(e))

    const stanza = Effect.gen(function*() {
      yield* Effect.void
      throw new Error("message")
    }).pipe(
      Effect.catchAll(() => pushError(["catch"])),
      Effect.onInterrupt((hs) => pushError(["interrupt", hs])),
      Effect.onError((e) => pushError(["error", e]))
    )

    const sonnet = Sonnet.make(stanza, Sonnet.defaultLayer)

    applyMiddleware(sonnet)(createStore)(constVoid)

    await Effect.runPromise(Effect.exit(Fiber.await(sonnet.fiber)))

    await expect.poll(() => actual).toStrictEqual([
      ["error", Cause.die(Error("message"))]
    ])
  })

  it("fiber interrupts when die", async () => {
    const actual: Array<unknown> = []

    const die = Effect.delay(
      Effect.die("Uh oh!"),
      "30 millis"
    )

    const work = Stanza.fromStream(
      Stream.range(1, 5).pipe(
        Stream.schedule(Schedule.spaced("10 millis")),
        Stream.map((i) => ({ type: `ACTION-${i}` }))
      )
    )

    const root = Effect.all([die, work], {
      discard: true,
      concurrency: "unbounded"
    })

    const sonnet = Sonnet.make(
      root,
      Sonnet.defaultLayer
    )

    applyMiddleware(sonnet)(createStore)(arrayReducer(actual))

    const exit = await Effect.runPromiseExit(Fiber.join(sonnet.fiber))

    // expect(exit).toStrictEqual(Exit.void)

    expect(actual).toStrictEqual([
      INIT_ACTION,
      { type: "ACTION-1" },
      { type: "ACTION-2" }
    ])
  })

  it("can stop propagation", async () => {
    const actual: Array<unknown> = []

    const push = (x: unknown) => Effect.sync(() => actual.push(x))

    class E {
      readonly _tag = "E"
    }

    const fail = Effect.delay(
      Effect.fail(new E()),
      "10 millis"
    ).pipe(Effect.catchTag("E", push))

    const die = Effect.delay(
      Effect.die("Uh oh!"),
      "20 millis"
    ).pipe(Effect.catchAllCause(push))

    const work = Stanza.fromStream(
      Stream.range(1, 3).pipe(
        Stream.schedule(Schedule.spaced("10 millis")),
        Stream.map((i) => ({ type: `ACTION-${i}` }))
      )
    )

    const sonnet = Sonnet.make(
      Stanza.combine([fail, die, work]),
      Sonnet.defaultLayer
    )

    applyMiddleware(sonnet)(createStore)(arrayReducer(actual))

    const exit = await Effect.runPromiseExit(Fiber.join(sonnet.fiber))

    expect(exit).toStrictEqual(Exit.succeed(void 0))
    expect(actual).toStrictEqual([
      INIT_ACTION,
      new E(),
      { type: "ACTION-1" },
      Cause.die("Uh oh!"),
      { type: "ACTION-2" },
      { type: "ACTION-3" }
    ])
  })
})
