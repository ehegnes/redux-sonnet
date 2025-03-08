import { describe, expect, it } from "@effect/vitest"
import {
  Effect,
  Fiber,
  FiberStatus,
  Layer,
  ManagedRuntime,
  Option,
  pipe,
  Ref
} from "effect"
import { constVoid } from "effect/Function"
import { withConsoleLog } from "effect/Logger"
import type { Action } from "redux"
import { applyMiddleware, legacy_createStore as createStore } from "redux"
import { Operators, Sonnet } from "redux-sonnet"

describe("takeEvery", () => {
  /**
   * @see https://github.com/redux-saga/redux-saga/blob/01f425c/packages/core/__tests__/sagaHelpers/takeEvery.js#L4
   */
  it("takeEvery", async () => {
    const loop = 10
    const actual: Array<Array<string>> = []

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

    const sonnet = Sonnet.make(
      root,
      Sonnet.defaultLayer
    )

    const store = applyMiddleware(sonnet)(createStore)(constVoid)

    for (let i = 1; i <= loop / 2; i++) {
      setTimeout(
        () => {
          console.log({ i })
          store.dispatch({
            type: "ACTION",
            payload: i
          })
        },
        0
      )
    }

    setTimeout(() =>
      store.dispatch({
        type: "CANCEL_WATCHER"
      }), 0)

    for (let i = loop / 2 + 1; i <= loop; i++) {
      console.log({ i })
      store.dispatch({
        type: "ACTION",
        payload: i
      })
    }

    await Effect.runPromise(Fiber.await(sonnet.fiber))

    expect(actual).toEqual([
      ["a1", "a2", 1],
      ["a1", "a2", 2],
      ["a1", "a2", 3],
      ["a1", "a2", 4],
      ["a1", "a2", 5]
    ])
  })

  /**
   * @see https://github.com/redux-saga/redux-saga/blob/01f425c/packages/core/__tests__/sagaHelpers/takeEvery.js#L53
   *
   * XXX: Is there a way to share the constructed service without a `ManagedRuntime`?
   */
  it("pattern END", async () => {
    class Service extends Effect.Service<Service>()("Service", {
      effect: Effect.Do.pipe(
        Effect.bind(
          "task",
          () => Ref.make(Option.none<Fiber.RuntimeFiber<void, never>>())
        ),
        Effect.bind("called", () => Ref.make(false))
      )
    }) {}

    const runtime = ManagedRuntime.make(Service.Default)

    const fnToCall = () =>
      Effect.gen(function*() {
        const { called } = yield* Service
        yield* Ref.set(called, true)
      })

    const saga = Effect.gen(function*() {
      const { task } = yield* Service
      yield* pipe(
        Operators.takeEvery(Operators.ofType("ACTION"), fnToCall),
        Effect.flatMap((fiber) =>
          pipe(
            Ref.set(task, Option.some(fiber)),
            Effect.andThen(() => Fiber.await(fiber))
          )
        )
      )
    })

    const sonnet = Sonnet.make(
      saga,
      Layer.mergeAll(
        Sonnet.defaultLayer,
        Service.Default
      ),
      runtime.memoMap
    )

    const store = applyMiddleware(sonnet)(createStore)(constVoid)

    setTimeout(() =>
      store.dispatch({
        type: "ACTION"
      }), 0)

    const checkStatus = (pred: (self: FiberStatus.FiberStatus) => boolean) =>
      pipe(
        Fiber.status(sonnet.fiber),
        Effect.flatMap(
          (status) =>
            pred(status)
              ? Effect.succeed(status._tag)
              : Effect.fail(void 0 as void)
        ),
        Effect.eventually
      )

    const isRunning = await Effect.runPromise(
      checkStatus(FiberStatus.isRunning)
    )
    expect(isRunning).toBe("Running")

    const isSuspended = await Effect.runPromise(
      checkStatus(FiberStatus.isSuspended)
    )
    expect(isSuspended).toBe("Suspended")

    await Effect.runPromise(Fiber.interrupt(sonnet.fiber))
    await Effect.runPromise(Fiber.await(sonnet.fiber))

    const status = await Effect.runPromise(Fiber.status(sonnet.fiber))
    expect(status).toBe(FiberStatus.done)

    const called = await pipe(
      Service.pipe(Effect.andThen(({ called }) => pipe(called, Ref.get))),
      runtime.runPromise
    )

    expect(called).toBe(false)
  })
})
