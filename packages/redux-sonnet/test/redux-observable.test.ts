import { describe, expect, it, vi } from "@effect/vitest"
import {
  Chunk,
  Effect,
  Layer,
  Logger,
  LogLevel,
  pipe,
  Ref,
  Stream
} from "effect"
import type { Action, Reducer, UnknownAction } from "redux"
import { applyMiddleware, legacy_createStore as createStore } from "redux"
import * as Operators from "redux-sonnet/Operators"
import * as Sonnet from "redux-sonnet/Sonnet"
import * as Stanza from "redux-sonnet/Stanza"
import { INIT_ACTION } from "./utils.js"

describe("redux-observable - createEpicSonnet", () => {
  /**
   * @see https://github.com/redux-observable/redux-observable/blob/356ae7583be005b0dcc153b03dbab521478c179e/test/createEpicMiddleware-spec.ts#L87
   */
  it.effect.skip(
    "should update state$ after an action goes through reducers but before epics",
    ({ expect }) =>
      Effect.gen(function*() {
        expect.assertions(2)

        const actions: Array<Action> = []

        const reducer: Reducer<number> = (state = 0, action) => {
          actions.push(action)

          if (action.type === "PING") {
            return state + 1
          } else {
            return state
          }
        }

        const stanza = Stanza.make((action$, state) =>
          pipe(
            Stream.merge(
              action$.pipe(Stream.filter(Operators.ofType("PING"))),
              state.changes.pipe(Stream.changes)
            ),
            // XXX: why can I not zip this ref?
            Stream.flatMap((x) =>
              pipe(
                Ref.get(state.ref),
                Effect.map((y) => [x, y])
              )
            ),
            Stream.map(([input, state]) => ({
              type: "PONG",
              input,
              state
            }))
          )
        )

        const sonnet = Sonnet.make(
          stanza,
          Sonnet.layer({
            backing: {
              capacity: 32,
              strategy: "bounded"
            },
            replay: 32
          })
        )

        const store = createStore(reducer, applyMiddleware(sonnet))

        yield* Effect.promise(() =>
          new Promise((resolve) => setTimeout(resolve, 900))
        )

        setTimeout(() => store.dispatch({ type: "PING" }), 0)
        setTimeout(() => store.dispatch({ type: "PING" }), 0)

        yield* Effect.promise(() =>
          expect.poll(() => store.getState()).toEqual(2)
        )

        yield* Effect.promise(() =>
          expect.poll(() => actions).toEqual([
            INIT_ACTION,
            {
              type: "PONG",
              input: 0,
              state: 0
            },
            {
              type: "PING"
            },
            {
              type: "PONG",
              input: 1,
              state: 1
            },
            {
              type: "PONG",
              input: { type: "PING" },
              state: 1
            },
            {
              type: "PING"
            },
            {
              type: "PONG",
              input: 2,
              state: 2
            },
            {
              type: "PONG",
              input: { type: "PING" },
              state: 2
            }
          ])
        )
      })
  )

  describe("should allow accessing state$.value on epic startup", () => {
    const reducer: Reducer<Array<UnknownAction>> = (state = [], action) =>
      state.concat(action)

    /**
     * @see https://github.com/redux-observable/redux-observable/blob/356ae7583be005b0dcc153b03dbab521478c179e/test/createEpicMiddleware-spec.ts#L152
     */
    it.effect("epic-like", ({ expect }) =>
      Effect.gen(function*() {
        const stanza = Stanza.make((_, state) =>
          Stream.map(state.latest, (state) => ({
            type: "PONG",
            state
          }))
        )

        const sonnet = Sonnet.make(
          stanza,
          Sonnet.defaultLayer
        )

        const store = createStore(reducer, applyMiddleware(sonnet))

        setTimeout(() => store.dispatch({ type: "PING" }), 0)

        yield* Effect.promise(() =>
          expect.poll(() => store.getState()).toEqual([
            INIT_ACTION,
            {
              type: "PONG",
              state: [INIT_ACTION]
            },
            {
              type: "PING"
            }
          ])
        )
      }))

    it.effect("saga-like", ({ expect }) =>
      Effect.gen(function*() {
        const onStartup = Effect.gen(function*() {
          const state = yield* Operators.select()

          yield* Operators.put({
            type: "PONG",
            state
          })
        })

        const watchPing = Effect.gen(function*() {
          yield* Operators.take(Operators.ofType("PING")).pipe(
            Effect.forever
          )
        })

        const root = Effect.all(
          {
            onStartup,
            watchPing
          },
          { concurrency: "unbounded" }
        )

        const sonnet = Sonnet.make(root, Sonnet.defaultLayer)
        const store = createStore(reducer, applyMiddleware(sonnet))

        setTimeout(() => store.dispatch({ type: "PING" }), 0)

        yield* Effect.promise(() =>
          expect.poll(() => store.getState()).toEqual([
            INIT_ACTION,
            {
              type: "PONG",
              state: [INIT_ACTION]
            },
            {
              type: "PING"
            }
          ])
        )
      }))
  })

  /**
   * @see https://github.com/redux-observable/redux-observable/blob/356ae7583be005b0dcc153b03dbab521478c179e/test/createEpicMiddleware-spec.ts#L179
   */
  it("should queue state$ updates", ({ expect }) =>
    Effect.gen(function*() {
      expect.assertions(2)
      type TestState = { action: string | null; value: number }
      const actions: Array<UnknownAction> = []
      const reducer: Reducer<TestState> = (
        state = { action: null, value: 0 },
        action
      ) => {
        actions.push(action)

        switch (action.type) {
          case "FIRST":
          case "SECOND":
          case "THIRD":
          case "STATE":
            return {
              action: action.type,
              value: state.value + 1
            }

          default:
            return state
        }
      }

      const stanza = Stanza.make((action$, state) =>
        action$.pipe(
          Stream.filter(Operators.ofType("FIRST")),
          Stream.flatMap(() =>
            pipe(
              Stream.merge(
                pipe(
                  state.changes,
                  Stream.filter((state) => state.value < 6),
                  Stream.map((state) => ({ type: "STATE", state }))
                ),
                pipe(
                  Chunk.make({ type: "SECOND" }, { type: "THIRD" }),
                  Stream.fromChunk
                )
              )
            )
          )
        )
      )

      const sonnet = Sonnet.make(
        stanza,
        Sonnet.defaultLayer
      )

      const store = createStore(reducer, applyMiddleware(sonnet))

      store.dispatch({ type: "FIRST" })

      yield* Effect.promise(() =>
        expect.poll(() => store.getState().value).toEqual(8)
      )

      expect(actions).toEqual([
        INIT_ACTION,
        {
          type: "FIRST"
        },
        {
          type: "STATE",
          state: { action: "FIRST", value: 1 }
        },
        {
          type: "SECOND"
        },
        {
          type: "THIRD"
        },
        {
          type: "STATE",
          state: { action: "STATE", value: 2 }
        },
        {
          type: "STATE",
          state: { action: "SECOND", value: 3 }
        },
        {
          type: "STATE",
          state: { action: "THIRD", value: 4 }
        },
        {
          type: "STATE",
          state: { action: "STATE", value: 5 }
        }
      ])
    }))

  /**
   * @see https://github.com/redux-observable/redux-observable/blob/356ae75/test/createEpicMiddleware-spec.ts#L255
   */
  describe("should accept an epic that wires up action$ input to action$ out", () => {
    const reducer: Reducer<Array<UnknownAction>> = (state = [], action) =>
      state.concat(action)

    it("epic-like", async ({ expect }) => {
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

    it.skip("saga-like", async ({ expect }) => {
      expect.assertions(1)

      const handleAction = (x: string) =>
        Effect.gen(function*() {
          yield* Operators.take(Operators.ofType(`FIRE_${x}`))

          yield* Operators.put({ type: `ACTION_${x}` })
        })

      const handleAction1 = handleAction("1")
      const handleAction2 = handleAction("2")

      const sonnet = Sonnet.make(
        Effect.all(
          { handleAction1, handleAction2 },
          { concurrency: "unbounded" }
        ),
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

  /**
   * @see https://github.com/redux-observable/redux-observable/blob/356ae75/test/createEpicMiddleware-spec.ts#L286
   */
  it("should support synchronous emission by epics on start up", async ({ expect }) => {
    expect.assertions(1)
    const reducer: Reducer<Array<UnknownAction>> = (state = [], action) =>
      state.concat(action)
    const s1 = Stanza.make(() =>
      pipe(
        Stream.make({ type: "ACTION_1" }),
        // XXX: this is hideous but required, because Streams that terminate will
        // kill (finalize) the dispatcher
        Stream.concat(Stream.never)
      )
    )
    const s2 = Stanza.make((action$) =>
      action$.pipe(
        Stream.filter(Operators.ofType("ACTION_1")),
        Stream.map(() => ({ type: "ACTION_2" }))
      )
    )

    const sonnet = Sonnet.make(
      Effect.all(
        [s1, s2],
        { discard: true, concurrency: "unbounded" }
      ),
      Layer.mergeAll(
        Sonnet.defaultLayer,
        Logger.minimumLogLevel(LogLevel.Trace)
      )
    )
    const store = createStore(reducer, applyMiddleware(sonnet))

    await expect.poll(() => store.getState(), { timeout: 3_000 }).toEqual([
      INIT_ACTION,
      { type: "ACTION_1" },
      { type: "ACTION_2" }
    ])

    Effect.runSync(Effect.log("done"))
  })

  // WORKING
  // github.com/redux-observable/redux-observable/blob/356ae75/test/createEpicSonnet-spec.ts#L305
  it.scoped("should queue synchronous actions", ({ expect }) =>
    Effect.gen(function*() {
      expect.assertions(1)
      const reducer: Reducer<Array<UnknownAction>> = (state = [], action) =>
        state.concat(action)

      const s1 = Stanza.make((action$) =>
        action$.pipe(
          Stream.filter(Operators.ofType("ACTION_1")),
          Stream.flatMap(() =>
            Stream.make(
              { type: "ACTION_2" } as const,
              { type: "ACTION_3" } as const
            )
          )
        )
      )

      const s2 = Stanza.make((action$) =>
        action$.pipe(
          Stream.filter(Operators.ofType("ACTION_2")),
          Stream.map(() => ({ type: "ACTION_4" })),
          Stream.prepend(Chunk.of({ type: "ACTION_1" } as const))
        )
      )

      const sonnet = Sonnet.make(
        Effect.all({ s1, s2 }, { concurrency: "unbounded" }),
        Sonnet.defaultLayer
      )

      const store = createStore(reducer, applyMiddleware(sonnet))

      yield* Effect.promise(() =>
        expect.poll(() => store.getState()).toEqual([
          INIT_ACTION,
          { type: "ACTION_1" },
          { type: "ACTION_2" },
          { type: "ACTION_3" },
          { type: "ACTION_4" }
        ])
      )
    }))

  /**
   * @see https://github.com/redux-observable/redux-observable/blob/356ae758/test/createEpicMiddleware-spec.ts#L336
   */
  it.skip("exceptions thrown in reducers as part of an epic-dispatched action should go through HostReportErrors", () =>
    new Promise<void>((done) => {
      expect.assertions(2)
      const reducer: Reducer<Array<UnknownAction>> = (state = [], action) => {
        switch (action.type) {
          case "ACTION_1":
            throw new Error("some error")
          default:
            return state
        }
      }
      // const epic: Epic = (action$, _state$) =>
      //  merge(
      //    action$.pipe(
      //      ofType("FIRE_1"),
      //      map(() => ({ type: "ACTION_1" }))
      //    ),
      //    action$.pipe(
      //      ofType("FIRE_2"),
      //      map(() => ({ type: "ACTION_2" }))
      //    )
      //  )

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

      const sonnet = Sonnet.make(stanza, Sonnet.defaultLayer)
      const store = createStore(reducer, applyMiddleware(sonnet))

      // config.onUnhandledError = (err: Error) => {
      //  expect(err.message).toEqual("some error")
      //  done()
      // }

      // rxjs v6 does not rethrow synchronously instead emitting on
      // HostReportErrors e.g. window.onerror or process.on('uncaughtException')
      expect(() => {
        store.dispatch({ type: "FIRE_1" })
      }).not.toThrow()
    }))

  it.skip("should throw if you provide a root epic that doesn't return anything", () =>
    new Promise<void>((done) => {
      expect.assertions(2)
      const rootEpic = () => {}
      const { middleware, run } = middleware.make(
        Sonnet.layer({ capacity: 32 })
      )
      createStore(() => {}, applyMiddleware(middleware))

      // config.onUnhandledError = (err: Error) => {
      //  expect(err.message).toEqual(
      //    "Your root Epic \"rootEpic\" does not return a stream. Double check you're not missing a return statement!"
      //  )
      //  done()
      // }

      expect(() => {
        // @ts-expect-error type mismatch on purpose
        epicSonnet.run(rootEpic)
      }).not.toThrow()
    }))

  it.skip("should pass undefined as third argument to epic if no dependencies provided", () => {
    expect.assertions(2)
    const reducer: Reducer<Array<UnknownAction>> = (state = [], _action) =>
      state
    const epic = vi.fn(
      (
        ...args: [
          Observable<unknown>,
          StateObservable<Array<UnknownAction>>,
          undefined
        ]
      ) => {
        expect(args.length).toEqual(3)
        expect(args[2]).toEqual(undefined)

        return args[0]
      }
    )

    const middleware = createEpicSonnet<
      unknown,
      unknown,
      Array<UnknownAction>
    >()
    createStore(reducer, applyMiddleware(middleware))
    middleware.run(epic)
  })

  it.skip("should inject dependencies into a single epic", () => {
    expect.assertions(2)
    const reducer: Reducer<Array<UnknownAction>> = (state = [], _action) =>
      state
    const epic = vi.fn(
      (
        ...args: [
          Observable<unknown>,
          StateObservable<Array<UnknownAction>>,
          string
        ]
      ) => {
        expect(args.length).toEqual(3)
        expect(args[2]).toEqual("deps")

        return args[0]
      }
    )

    const middleware = createEpicSonnet<
      unknown,
      unknown,
      Array<UnknownAction>,
      string
    >({ dependencies: "deps" })
    createStore(reducer, applyMiddleware(middleware))
    middleware.run(epic)
  })

  it.skip("should pass literally anything provided as dependencies, even `undefined`", () => {
    expect.assertions(2)
    const reducer: Reducer<Array<UnknownAction>> = (state = [], _action) =>
      state
    const epic = vi.fn(
      (
        ...args: [
          Observable<unknown>,
          StateObservable<Array<UnknownAction>>,
          undefined
        ]
      ) => {
        expect(args.length).toEqual(3)
        expect(args[2]).toEqual(undefined)

        return args[0]
      }
    )

    const middleware = createEpicSonnet<
      unknown,
      unknown,
      Array<UnknownAction>,
      undefined
    >({
      dependencies: undefined
    })
    createStore(reducer, applyMiddleware(middleware))
    middleware.run(epic)
  })

  it.skip("should inject dependencies into combined epics", () => {
    expect.assertions(11)
    const reducer: Reducer<Array<UnknownAction>> = (state = [], _action) =>
      state
    const epic = vi.fn(
      (
        action$: Observable<unknown>,
        _state$: StateObservable<Array<UnknownAction>>,
        { bar, foo }: Record<string, string>
      ) => {
        expect(foo).toEqual("bar")
        expect(bar).toEqual("foo")
        return action$
      }
    )

    const rootEpic: Epic<
      unknown,
      unknown,
      Array<UnknownAction>,
      Record<string, string>
    > = combineEpics(
      epic,
      epic,
      combineEpics(epic, combineEpics(epic, epic))
    )

    const middleware = createEpicSonnet<
      unknown,
      unknown,
      Array<UnknownAction>,
      Record<string, string>
    >({
      dependencies: { foo: "bar", bar: "foo" }
    })
    createStore(reducer, applyMiddleware(middleware))
    middleware.run(rootEpic)

    expect(epic).toHaveBeenCalledTimes(5)
  })

  it.skip("should call epics with all additional arguments, not just dependencies", () => {
    expect.assertions(4)
    const reducer: Reducer<Array<UnknownAction>> = (state = [], _action) =>
      state
    const epic = vi.fn(
      <T>(action$: T, _state$: T, deps: T, arg1: T, arg2: T) => {
        expect(deps).toEqual("deps")
        expect(arg1).toEqual("first")
        expect(arg2).toEqual("second")
        return action$
      }
    )

    // @ts-expect-error type mismatch on purpose
    const rootEpic = (...args: Parameters<Epic>) =>
      combineEpics(epic)(...args, "first", "second")
    const middleware = createEpicSonnet({ dependencies: "deps" })
    createStore(reducer, applyMiddleware(middleware))
    middleware.run(rootEpic)

    expect(epic).toHaveBeenCalled()
  })

  it.skip("should not allow interference from the public queueScheduler singleton", () =>
    new Promise<void>((done) => {
      expect.assertions(1)
      const reducer: Reducer<Array<UnknownAction>> = (state = [], action) =>
        state.concat(action)
      const epic1: Epic = (action$) =>
        action$.pipe(
          ofType("ACTION_1"),
          mergeMap(() => of({ type: "ACTION_2" }, { type: "ACTION_3" }))
        )

      const epic2: Epic = (action$) =>
        action$.pipe(
          ofType("ACTION_2"),
          map(() => ({ type: "ACTION_4" }))
        )

      const rootEpic = combineEpics(epic1, epic2)

      queueScheduler.schedule(() => {
        const middleware = createEpicSonnet()
        const store = createStore(reducer, applyMiddleware(middleware))
        middleware.run(rootEpic)
        store.dispatch({ type: "ACTION_1" })

        expect(store.getState()).toEqual([
          INIT_ACTION,
          { type: "ACTION_1" },
          { type: "ACTION_2" },
          { type: "ACTION_3" },
          { type: "ACTION_4" }
        ])

        done()
      })
    }))
})
