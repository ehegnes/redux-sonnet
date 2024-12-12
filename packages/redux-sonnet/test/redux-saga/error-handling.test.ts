import { describe, expect, it } from "@effect/vitest"
import {
  Cause,
  Effect,
  Fiber,
  Layer,
  Logger,
  LogLevel,
  pipe,
  Schedule,
  Stream
} from "effect"
import { applyMiddleware, legacy_createStore as createStore } from "redux"
import { Sonnet, Stanza } from "redux-sonnet"
import { arrayReducer, INIT_ACTION } from "../utils.js"

describe("error handling", () => {
  it("throw", async () => {
    const actual: Array<string> = []

    const stanza = Effect.gen(function*() {
      yield* Effect.void
      throw new Error("hello")
    }).pipe(
      Effect.parallelErrors,
      Effect.catchAll(() => Effect.sync(() => actual.push("catch"))),
      Effect.onInterrupt(() => Effect.sync(() => actual.push("interrupt"))),
      Effect.onError(() => Effect.sync(() => actual.push("error")))
    )

    const sonnet = Sonnet.make(
      stanza,
      Layer.mergeAll(
        Sonnet.defaultLayer,
        Logger.minimumLogLevel(LogLevel.Trace)
      )
    )

    applyMiddleware(sonnet)(createStore)(() => {})

    await Effect.runPromise(Effect.exit(Fiber.await(sonnet.fiber)))

    await expect.poll(() => actual).toStrictEqual([
      "error"
    ])
  })

  it("fiber interrupts when die", async () => {
    const actual: Array<unknown> = []

    const s1 = Effect.gen(function*() {
      yield* pipe(
        Effect.die("Uh oh!"),
        Effect.delay("20 millis")
      )
    })

    const s2 = Stanza.fromStream(
      Stream.range(1, 3).pipe(
        Stream.schedule(Schedule.spaced("10 millis")),
        Stream.map((i) => ({ type: `ACTION-${i}` }))
      )
    )

    const sonnet = Sonnet.make(
      Effect.all([s1, s2], { discard: true, concurrency: "unbounded" }),
      Layer.mergeAll(
        Sonnet.defaultLayer,
        Logger.minimumLogLevel(LogLevel.Trace)
      )
    )

    applyMiddleware(sonnet)(createStore)(arrayReducer(actual))

    await Effect.runPromise(Effect.exit(Fiber.join(sonnet.fiber)))

    expect(actual).toStrictEqual([
      INIT_ACTION,
      { type: "ACTION-1" }
    ])
  })

  it("can stop propagation", async () => {
    const actual: Array<unknown> = []

    const s1 = Effect.gen(function*() {
      yield* pipe(
        Effect.die("Uh oh!"),
        Effect.delay("20 millis")
      )
    }).pipe(
      Effect.catchAllCause((cause) => Effect.sync(() => actual.push(cause)))
    )

    class E {
      readonly _tag = "E"
    }

    const s2 = Effect.gen(function*() {
      yield* pipe(
        Effect.fail(new E()),
        Effect.delay("10 millis")
      )
    }).pipe(
      Effect.catchTag("E", (cause) => Effect.sync(() => actual.push(cause)))
    )

    const s3 = Stanza.fromStream(
      Stream.range(1, 3).pipe(
        Stream.schedule(Schedule.spaced("10 millis")),
        Stream.map((i) => ({ type: `ACTION-${i}` }))
      )
    )

    const sonnet = Sonnet.make(
      Effect.all([s1, s2, s3], { discard: true, concurrency: "unbounded" }),
      Layer.mergeAll(
        Sonnet.defaultLayer,
        Logger.minimumLogLevel(LogLevel.Trace)
      )
    )

    applyMiddleware(sonnet)(createStore)(arrayReducer(actual))

    await Effect.runPromise(Effect.exit(Fiber.join(sonnet.fiber)))

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
