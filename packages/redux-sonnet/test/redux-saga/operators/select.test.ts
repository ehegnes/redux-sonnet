import { assert, describe, it } from "@effect/vitest"
import {
  Deferred,
  Duration,
  Effect,
  Fiber,
  Layer,
  Logger,
  LogLevel
} from "effect"
import type { Reducer } from "redux"
import { applyMiddleware, legacy_createStore as createStore } from "redux"
import { Operators, Sonnet } from "redux-sonnet"

describe("select", () => {
  /**
   * @see https://github.com/redux-saga/redux-saga/blob/01f425c/packages/core/__tests__/interpreter/select.js
   */
  it.effect("saga select/getState handling", () =>
    Effect.gen(function*() {
      const actual: Array<number> = []

      type State = {
        counter: number
        arr: Array<number>
      }

      const initialState: State = {
        counter: 0,
        arr: [1, 2]
      } as const

      const counterSelector = (s: State) => s.counter

      const arrSelector = (s: State, idx: number) => s.arr[idx]

      const def = yield* Deferred.make()

      const rootReducer: Reducer<State> = (state = initialState, action) => {
        if (action.type === "inc") {
          return {
            ...state,
            counter: state.counter + 1
          }
        }

        return state
      }

      const genFn = Effect.gen(function*() {
        actual.push((yield* Operators.select<State>()).counter)
        actual.push(yield* Operators.select(counterSelector))
        actual.push(yield* Operators.select(arrSelector, 1))
        yield* Deferred.await(def)

        // XXX: the necessity of this indicates a timing issue
        yield* Effect.timeout(Duration.millis(10))(
          Effect.sleep(Duration.infinity)
        ).pipe(
          Effect.catchAll(() => Effect.void)
        )

        actual.push((yield* Operators.select<State>()).counter)
        actual.push(yield* Operators.select(counterSelector))
      })

      const sonnet = Sonnet.make(
        genFn,
        Layer.mergeAll(
          Sonnet.defaultLayer,
          // XXX: this only works with tracing enabled (??)
          Logger.minimumLogLevel(LogLevel.Trace)
        )
      )

      const store = applyMiddleware(sonnet)(createStore)(rootReducer)

      const expected = [0, 0, 2, 1, 1]

      setTimeout(() =>
        store.dispatch({
          type: "inc"
        }), 0)

      yield* Deferred.succeed(def, void 0)
      yield* Fiber.join(sonnet.fiber)

      assert.deepStrictEqual(actual, expected)
    }))
})
