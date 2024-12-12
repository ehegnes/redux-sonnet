import { describe, expect, it } from "@effect/vitest"
import { Array as A, Effect, Option, pipe, Stream } from "effect"
import { applyMiddleware, legacy_createStore as createStore } from "redux"
import { Operators, Sonnet } from "redux-sonnet"
import { SonnetService } from "redux-sonnet/Sonnet"

describe("channels", () => {
  /**
   * @see https://redux-saga.js.org/docs/advanced/Channels#using-the-actionchannel-effect
   */
  describe("using the action channel", () => {
    /**
     * @example
     * ```js
     * import { take, fork, ... } from 'redux-saga/effects'
     * function* watchRequests() {
     *   while (true) {
     *     const {payload} = yield take('REQUEST')
     *     yield fork(handleRequest, payload)
     *   }
     * }
     * function* handleRequest(payload) { ... }
     * ```
     */
    it("canonical example", async () => {
      const actual: Array<unknown> = []

      const handleRequest = (_: unknown) => Effect.sync(() => actual.push(_))

      const watchRequests = Effect.gen(function*() {
        const payload = yield* Operators.unsafeTake(Operators.ofType("REQUEST"))
        yield* Effect.fork(handleRequest(payload))
      }).pipe(
        Effect.forever
      )
      const sonnet = Sonnet.make(
        watchRequests,
        Sonnet.defaultLayer
      )
      const store = applyMiddleware(sonnet)(createStore)(() => {})

      setTimeout(() => store.dispatch({ type: "REQUEST", payload: 0 }), 0)
      setTimeout(() => store.dispatch({ type: "REQUEST", payload: 1 }), 0)
      setTimeout(() => store.dispatch({ type: "REQUEST", payload: 2 }), 0)

      await expect.poll(() => actual).toStrictEqual([
        { type: "REQUEST", payload: 0 },
        { type: "REQUEST", payload: 1 },
        { type: "REQUEST", payload: 2 }
      ])
    })

    /**
     * @example
     * ```js
     * import { take, actionChannel, call, ... } from 'redux-saga/effects'
     * function* watchRequests() {
     *   // 1- Create a channel for request actions
     *   const requestChan = yield actionChannel('REQUEST')
     *   while (true) {
     *     // 2- take from the channel
     *     const {payload} = yield take(requestChan)
     *     // 3- Note that we're using a blocking call
     *     yield call(handleRequest, payload)
     *   }
     * }
     * function* handleRequest(payload) { ... }
     * ```
     */
    it("actionChannel helper", async () => {
      const actual: Array<unknown> = []

      const handleRequest = (_: unknown) => Effect.sync(() => actual.push(_))

      const watchRequests = Effect.gen(function*() {
        const requestChan = yield* pipe(
          SonnetService,
          Effect.andThen(({ action }) => action.stream),
          Effect.map(Stream.toChannel)
        )

        yield* Effect.gen(function*() {
          const payload = yield* Operators.takeFrom(
            requestChan,
            Operators.ofType("REQUEST")
          )
          yield* handleRequest(payload)
        }).pipe(
          Effect.forever
        )
      })

      const sonnet = Sonnet.make(
        watchRequests,
        Sonnet.defaultLayer
      )
      const store = applyMiddleware(sonnet)(createStore)(() => {})

      setTimeout(() => store.dispatch({ type: "REQUEST", payload: 0 }), 0)
      setTimeout(() => store.dispatch({ type: "REQUEST", payload: 1 }), 0)
      setTimeout(() => store.dispatch({ type: "REQUEST", payload: 2 }), 0)

      await expect.poll(() => actual).toStrictEqual([
        Option.some({ type: "REQUEST", payload: 0 }),
        Option.some({ type: "REQUEST", payload: 1 }),
        Option.some({ type: "REQUEST", payload: 2 })
      ])
    })

    /**
     * @example
     * ```js
     * import { buffers } from 'redux-saga'
     * import { actionChannel } from 'redux-saga/effects'
     *
     * function* watchRequests() {
     *   const requestChan = yield actionChannel('REQUEST', buffers.sliding(5))
     *   ...
     * }
     * ```
     */
    it.skip("sliding", async () => {
      const actual: Array<unknown> = []

      const handleRequest = (_: unknown) => Effect.sync(() => actual.push(_))

      const watchRequests = Effect.gen(function*() {
        const requestChan = yield* pipe(
          SonnetService,
          Effect.andThen(({ action }) => action.stream),
          Effect.map(Stream.slidingSize(1, 5)),
          Effect.map(Stream.toChannel)
        )

        yield* Effect.gen(function*() {
          const payload = yield* Operators.takeFrom(
            requestChan,
            Operators.ofType("REQUEST")
          )
          yield* handleRequest(payload)
        }).pipe(
          Effect.forever
        )
      })

      const sonnet = Sonnet.make(
        watchRequests,
        Sonnet.defaultLayer
      )
      const store = applyMiddleware(sonnet)(createStore)(() => {})

      A.range(1, 12).forEach((_, i) => {
        setTimeout(() => store.dispatch({ type: "REQUEST", payload: i }), 0)
      })

      await expect.poll(() => actual).toStrictEqual([
        Option.some({ type: "REQUEST", payload: 0 }),
        Option.some({ type: "REQUEST", payload: 1 }),
        Option.some({ type: "REQUEST", payload: 2 })
      ])
    })
  })
})
