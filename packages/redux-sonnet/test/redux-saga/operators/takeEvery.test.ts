import { expect, it } from "@effect/vitest"
import { Effect, Fiber, Layer, Logger, LogLevel } from "effect"
import { withConsoleLog } from "effect/Logger"
import type { Action } from "redux"
import { applyMiddleware, legacy_createStore as createStore } from "redux"
import { Operators, Sonnet } from "redux-sonnet"
import colors from "yoctocolors"
// import sagaMiddleware, { END } from "../../src"
// import { cancel, take, takeEvery } from "../../src/effects"

it("takeEvery", () => {
  const loop = 10
  const actual: Array<Array<string>> = []
  const sonnet = Sonnet.make(Layer.mergeAll(
    Sonnet.defaultLayer,
    Logger.minimumLogLevel(LogLevel.Trace)
  ))
  const store = applyMiddleware(sonnet.middleware)(createStore)(() => {})

  // function* root() {
  //   const task = yield takeEvery("ACTION", worker, "a1", "a2")
  //   yield take("CANCEL_WATCHER")
  //   yield cancel(task)
  // }

  // function* worker(arg1, arg2, action) {
  //   actual.push([arg1, arg2, action.payload])
  // }

  const worker = (action: Action, arg1: string, arg2: string) =>
    Effect.gen(function*() {
      actual.push([arg1, arg2, (action as any).payload as unknown as string])
      return yield* Effect.void
    })

  const root = Effect.gen(function*() {
    const task = yield* Operators.takeEvery(
      Operators.ofType("ACTION"),
      worker,
      "a1",
      "a2"
    )
    yield* Operators.take(Operators.ofType("CANCEL_WATCHER"))
    yield* Fiber.interrupt(task)
  })

  const mainTask = sonnet.run(root)

  // const inputTask = Promise.resolve()
  //   .then(() => {
  //     for (let i = 1; i <= loop / 2; i++) {
  //       store.dispatch({
  //         type: "ACTION",
  //         payload: i
  //       })
  //     }
  //   }) // the watcher should be cancelled after this
  //   // no further task should be forked after this
  //   .then(() =>
  //     store.dispatch({
  //       type: "CANCEL_WATCHER"
  //     })
  //   )
  //   .then(() => {
  //     for (let i = loop / 2 + 1; i <= loop; i++) {
  //       store.dispatch({
  //         type: "ACTION",
  //         payload: i
  //       })
  //     }
  //   })

  const inputTask = Promise.resolve()
    .then(() => {
      for (let i = 1; i <= loop / 2; i++) {
        store.dispatch({
          type: "ACTION",
          payload: i
        })
      }
    }) // the watcher should be cancelled after this
    // no further task should be forked after this
    .then(() =>
      store.dispatch({
        type: "CANCEL_WATCHER"
      })
    )
    .then(() => {
      for (let i = loop / 2 + 1; i <= loop; i++) {
        store.dispatch({
          type: "ACTION",
          payload: i
        })
      }
    })

  const a = Effect.runPromise(Fiber.join(mainTask))

  return Promise.all([a, inputTask]).then(() => {
    // takeEvery must fork a worker on each action
    expect(actual).toEqual([
      ["a1", "a2", 1],
      ["a1", "a2", 2],
      ["a1", "a2", 3],
      ["a1", "a2", 4],
      ["a1", "a2", 5]
    ])
  })
})
it.skip("takeEvery: pattern END", () => {
  const middleware = sagaMiddleware()
  const store = createStore(() => ({}), {}, applyMiddleware(middleware))
  const mainTask = middleware.run(saga)
  let task

  function* saga() {
    task = yield takeEvery("ACTION", fnToCall)
  }

  let called = false

  function* fnToCall() {
    called = true
  }

  store.dispatch(END)
  store.dispatch({
    type: "ACTION"
  })
  return mainTask.toPromise().then(() => {
    // should finish takeEvery task on END
    expect(task.isRunning()).toBe(false) // should not call function if finished with END

    expect(called).toBe(false)
  })
})
