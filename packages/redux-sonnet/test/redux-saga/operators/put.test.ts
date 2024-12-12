import { assert, describe, expect, it } from "@effect/vitest"
// import deferred from "@redux-saga/deferred"
import { Effect, Fiber, Layer, Logger, LogLevel, pipe } from "effect"
import type { Middleware, Reducer } from "redux"
import { applyMiddleware, legacy_createStore as createStore } from "redux"
import { Operators, Sonnet } from "redux-sonnet"

const thunk: Middleware<void, any, any> = () => (next) => (action) => {
  if (typeof action.then === "function") {
    return action
  }

  next(action)
}

describe("put", () => {
  it.effect("saga put handling", () =>
    Effect.gen(function*() {
      const actual: Array<string> = []

      const spy = () => (next: any) => (action: any) => {
        actual.push(action.type)
        next(action)
      }

      const genFn = (arg: string) =>
        Effect.gen(function*() {
          yield* Operators.put({ type: arg })
          yield* Operators.put({ type: "2" })
        })

      const sonnet = Sonnet.make(
        genFn("arg"),
        Sonnet.defaultLayer
      )

      applyMiddleware(spy, sonnet)(createStore)(() => {})

      const expected = ["arg", "2"]

      yield* Fiber.join(sonnet.fiber)

      assert.deepStrictEqual(actual, expected)
    }))

  /**
   * @unimplemented
   */
  it.effect.skip("saga put in a channel", () =>
    Effect.gen(function*() {
      const buffer: Array<string> = []
      const spyBuffer = {
        isEmpty: () => !buffer.length,
        put: (it) => buffer.push(it),
        take: () => buffer.shift()
      }
      const chan = channel(spyBuffer)
      const sonnet = Sonnet.make(Sonnet.defaultLayer)
      applyMiddleware(sonnet.middleware)(createStore)(() => {})

      const genFn = (arg: string) =>
        Effect.gen(function*() {
          // yield io.put(chan, arg)
          yield* Operators.put(arg)
          yield io.put(chan, "2")
        })

      const task = sagaMiddleware.run(genFn, "arg")
      const expected = ["arg", 2]
      yield* Fiber.join(task)

      assert.equal(buffer, expected)
    }))

  /**
   * @see https://github.com/redux-saga/redux-saga/blob/01f425c46f26b956509464fee5ccffce95bea6ff/packages/core/__tests__/interpreter/put.js#L66
   */
  it.effect("saga async put's response handling", () =>
    Effect.gen(function*() {
      const actual: Array<string> = []

      const genFn = (arg: string) =>
        Effect.gen(function*() {
          actual.push(
            yield* pipe(
              Effect.promise(() => Promise.resolve({ type: arg })),
              Effect.flatMap(Operators.put)
            )
          )
          actual.push(
            yield* pipe(
              Effect.promise(() => Promise.resolve({ type: "2" })),
              Effect.flatMap(Operators.put)
            )
          )
        })

      const sonnet = Sonnet.make(
        genFn("arg"),
        Sonnet.defaultLayer
      )

      applyMiddleware(thunk, sonnet)(createStore)(() => {})

      const expected = ["arg", "2"]
      yield* Fiber.join(sonnet.fiber)

      assert.deepStrictEqual(actual, expected)
    }))

  /**
   * @unimplemented
   */
  it.effect.skip("saga error put's response handling", () =>
    Effect.gen(function*() {
      const actual: Array<Error> = []
      const error = new Error("error")

      const reducer: Reducer = (state, action) => {
        if (action.error) {
          throw error
        }

        return state
      }

      const genFn = (arg: string) =>
        Effect.gen(function*() {
          yield* Operators.put({
            type: arg,
            error: true
          })
        })

      const sonnet = Sonnet.make(
        genFn("arg"),
        Sonnet.defaultLayer
      )

      applyMiddleware(sonnet)(createStore)(reducer)

      const expected = [error]

      yield* Fiber.join(sonnet.fiber)

      assert.equal(actual, expected)
    }))

  /**
   * @see https://github.com/redux-saga/redux-saga/blob/01f425c46f26b956509464fee5ccffce95bea6ff/packages/core/__tests__/interpreter/put.js#L118
   */
  it.effect("saga error putResolve's response handling", () =>
    Effect.gen(function*() {
      const actual: Array<string> = []

      const reducer: Reducer = (state) => state

      const genFn = (arg: string) =>
        Effect.gen(function*() {
          const promise: Promise<string> = Promise.reject(
            new Error("error " + arg)
          )

          const op = Effect.tryPromise({
            try: () => promise,
            catch: (error: unknown) => (error as Error).message
          })

          /**
           * XXX: Here we are forced to handle this error in place.
           *      Can railway be optional?
           */
          actual.push(
            yield* pipe(
              op,
              Effect.flatMap((type) => Operators.put({ type })),
              Effect.catchAllCause((cause) =>
                Operators.put({ type: cause.toString() })
              )
            )
          )
        })

      const sonnet = Sonnet.make(genFn("arg"), Sonnet.defaultLayer)

      applyMiddleware(thunk, sonnet)(createStore)(reducer)

      /**
       * XXX: `Cause` is prepending "Error: ".
       *      Can this be removed?
       *      Should user be forced to tag errors?
       */
      const expected = ["Error: error arg"]

      yield* Fiber.join(sonnet.fiber)

      assert.deepStrictEqual(actual, expected)
    }))

  /**
   * @see https://github.com/redux-saga/redux-saga/blob/01f425c46f26b956509464fee5ccffce95bea6ff/packages/core/__tests__/interpreter/put.js#L142
   */
  it.effect("saga nested puts handling", () =>
    Effect.gen(function*() {
      const actual: Array<string> = []

      const genA = Effect.gen(function*() {
        yield* Operators.put({
          type: "a"
        })
        actual.push("put a")
      })

      const genB = Effect.gen(function*() {
        yield* Operators.take(Operators.ofType("a"))
        yield* Operators.put({
          type: "b"
        })
        actual.push("put b")
      })

      /**
       * XXX: This pattern is not possible presently. Should consumers be
       *      given control over fiber coordination?
       */
      // function* root() {
      //   yield io.fork(genB) // forks genB first to be ready to take before genA starts putting

      //   yield io.fork(genA)
      // }

      /** ^ not true */

      // const root = Effect.gen(function*() {
      //   yield* Effect.fork(genB)
      //   yield* Effect.fork(genA)
      // })

      const sonnet = Sonnet.make(
        // root,
        // XXX: order is weird here. reverse order is correct?
        Effect.all([genA, genB], { concurrency: "unbounded" }),
        Sonnet.defaultLayer
      )

      applyMiddleware(sonnet)(createStore)(() => {})

      const expected = ["put a", "put b"]

      yield* Fiber.join(sonnet.fiber)

      // saga must order nested puts by executing them after the outer puts complete
      assert.deepStrictEqual(actual, expected)
    }))

  it.effect.skip("puts emitted while dispatching saga need not to cause stack overflow", () =>
    Effect.gen(function*() {
      const capacity = 32768
      const nPuts = 32_768

      const root = Effect.gen(function*() {
        yield* pipe(
          Operators.put({
            type: "put a lot of actions"
          }),
          Effect.repeatN(nPuts - 1)
        )
        /// XXX: ???
        yield* Effect.delay("0 millis")(Effect.void)
      })

      const reducer: Reducer = (state, action) => action.type

      // const chan = stdChannel()
      // const rawPut = chan.put
      // chan.put = () => {
      //  for (let i = 0; i < 32768; i++) {
      //    rawPut({ type: "test" })
      //  }
      // }

      const sonnet = Sonnet.make(
        Layer.mergeAll(
          Sonnet.defaultLayer,
          Logger.minimumLogLevel(LogLevel.Trace)
        )
      )
      createStore(reducer, applyMiddleware(sonnet.middleware))

      const task = sonnet.run(root)
      yield* Fiber.join(task)

      // this saga needs to run without stack overflow
      assert.ok(true)
    }))

  it.skip("puts emitted directly after creating a task (caused by another put) should not be missed by that task", () => {
    const actual = []

    const rootReducer = (state, action) => {
      return {
        callSubscriber: action.callSubscriber
      }
    }

    const sagaMiddleware = createSagaMiddleware()
    const store = createStore(
      rootReducer,
      undefined,
      applyMiddleware(sagaMiddleware)
    )
    const saga = sagaMiddleware.run(function*() {
      yield io.take("a")
      yield io.put({
        type: "b",
        callSubscriber: true
      })
      yield io.take("c")
      yield io.fork(function*() {
        yield io.take("do not miss")
        actual.push("didn't get missed")
      })
    })
    store.subscribe(() => {
      if (store.getState().callSubscriber) {
        store.dispatch({
          type: "c"
        })
        store.dispatch({
          type: "do not miss"
        })
      }
    })
    store.dispatch({
      type: "a"
    })
    const expected = ["didn't get missed"]
    return saga.toPromise().then(() => {
      expect(actual).toEqual(expected)
    })
  })

  describe("put", () => {
    it.skip("END should reach tasks created after it gets dispatched", () => {
      const actual = []

      const rootReducer = () => ({})

      const sagaMiddleware = createSagaMiddleware()
      const store = createStore(
        rootReducer,
        undefined,
        applyMiddleware(sagaMiddleware)
      )

      function* subTask() {
        try {
          while (true) {
            actual.push("subTask taking END")
            yield io.take("NEXT")
            actual.push("should not get here")
          }
        } finally {
          actual.push("auto ended")
        }
      }

      const def = deferred()
      const rootSaga = sagaMiddleware.run(function*() {
        while (true) {
          yield io.take("START")
          actual.push("start taken")
          yield def.promise
          actual.push("non-take effect resolved")
          yield io.fork(subTask)
          actual.push("subTask forked")
        }
      })
      Promise.resolve()
        .then(() => {
          store.dispatch({
            type: "START"
          })
          store.dispatch(END)
        })
        .then(() => {
          def.resolve()
          store.dispatch({
            type: "NEXT"
          })
          store.dispatch({
            type: "START"
          })
        })
      const expected = [
        "start taken",
        "non-take effect resolved",
        "subTask taking END",
        "auto ended",
        "subTask forked"
      ]
      return rootSaga.toPromise().then(() => {
        expect(actual).toEqual(expected)
      })
    })
  })
})
