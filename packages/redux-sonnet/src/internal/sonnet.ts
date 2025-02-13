import type { Action, MiddlewareAPI } from "@reduxjs/toolkit"
import type { Scope, Take } from "effect"
import {
  Effect,
  Equal,
  Exit,
  Hash,
  Inspectable,
  Layer,
  ManagedRuntime,
  pipe,
  Predicate,
  Queue,
  Ref,
  Stream,
  SubscriptionRef,
  SynchronizedRef
} from "effect"
import { pipeArguments } from "effect/Pipeable"
import { hasProperty } from "effect/Predicate"
import * as Sonnet from "../Sonnet.js"

const SonnetSymbolKey = "redux-sonnet/Sonnet"

export const TypeId: Sonnet.TypeId = Symbol.for(
  SonnetSymbolKey
) as Sonnet.TypeId

const Prototype = {
  [TypeId]: TypeId,
  [Equal.symbol](that: any) {
    return this === that
  },
  [Hash.symbol]() {
    return Hash.cached(this, Hash.random(this))
  },
  [Inspectable.NodeInspectSymbol](): string {
    return Inspectable.format(this)
  },
  toString(): string {
    return Inspectable.format(this)
  },
  toJSON(): unknown {
    return {
      unimplemented: true
    }
  },
  pipe() {
    return pipeArguments(this, arguments)
  }
} as const

const makeProto = <LA, LE>(
  rootEffect: Effect.Effect<void, never, LA>,
  layer: Layer.Layer<LA | Sonnet.Sonnet.Context, LE, never>,
  memoMap?: Layer.MemoMap | undefined
): Sonnet.Sonnet<LA, LE> => {
  const runtime = ManagedRuntime.make(
    Layer.mergeAll(layer),
    memoMap
  )

  // XXX: is it okay to fork here?
  const fiber = runtime.runFork(rootEffect.pipe(
    Effect.onInterrupt((a) => Effect.logError("rootEffect interrupted", a)),
    Effect.onExit((a) => Effect.logError("rootEffect interrupted", a)),
    Effect.onError((a) => Effect.logError("rootEffect errored", a)),
    Effect.catchAll((a) => Effect.logError("rootEffect caught", a))
  ))

  const middleware: Sonnet.Sonnet.Middleware = function(api: MiddlewareAPI) {
    const getState = pipe(
      Effect.sync(api.getState)
    )

    const dispatch = Effect.fn("dispatch")(
      (action: Action) => Effect.sync(() => api.dispatch(action))
    )

    const offerState: Effect.Effect<void, never, Sonnet.SonnetService> = pipe(
      Sonnet.SonnetService,
      Effect.andThen(({ state: { ref } }) =>
        pipe(
          SynchronizedRef.updateAndGetEffect(ref, () => getState),
          Effect.flatMap((newState) =>
            Effect.logTrace("[state] offered", newState)
          )
        )
      )
    )

    const dispatcher = Effect.gen(function*() {
      yield* Effect.logTrace("[dispatcher] starting...")
      const { dispatch: { stream } } = yield* Sonnet.SonnetService

      yield* Effect.addFinalizer((exit) =>
        Effect.log(`[dispatcher] finalized. Exit status: ${exit._tag}`)
      )

      return yield* pipe(
        stream,
        Stream.tap((take) => Effect.log("[dispatcher] take", take)),
        Stream.flattenTake,
        Stream.tap((x) => Effect.logTrace("[dispatcher] publishing", x)),
        Stream.mapEffect(dispatch),
        Stream.runDrain
      )
    })

    runtime.runPromiseExit(offerState).then(
      (exit) =>
        Exit.match(exit, {
          onFailure: (cause) => {
            throw new Error(`Could not offer state: ${cause.toString()}`)
          },
          onSuccess: () => {}
        })
    )
    runtime.runFork(Effect.scoped(dispatcher))

    return (next) => {
      return (action) => {
        let result: any = undefined

        if (Predicate.isObject(action)) {
          result = next(action)
        }

        /**
         * XXX: This will encounter backpressure and become asynchronous if the
         * queue is full, failing with `AsyncFiberException`, so this is not
         * safe to consider synchronous.
         *
         * - Should this fork?
         *   - This /works/, but it may be an anti-pattern.
         * - Should this become a Promise?
         *   - What's the point of backpressure if this just runs async?
         */
        const actionResult = runtime.runPromiseExit(
          pipe(
            Sonnet.SonnetService,
            Effect.andThen(({ action: { queue } }) =>
              pipe(
                Queue.offer(queue, action as Action),
                Effect.flatMap(() =>
                  Effect.logTrace("[action] offered", action)
                )
              )
            )
          )
        )

        actionResult.then(
          Exit.match({
            onFailure: () => {
              // XXX: do something
            },
            onSuccess: () => {
              // XXX: do something (log?)
              // wishing Effect had structured logs!
            }
          }),
          (rej) => {
            throw new Error(
              `Could not offer action (this should never happen) ${rej.toString()}`
            )
          }
        )

        const finalOfferP = runtime.runPromiseExit(offerState)

        finalOfferP.then((finalOfferResult) =>
          Exit.match(finalOfferResult, {
            onFailure: (cause) => {
              // eslint-disable-next-line no-console
              console.error("holy fuck", cause)
            },
            onSuccess: () => {
            }
          })
        )

        return result
      }
    }
  }

  return Object.assign(
    middleware,
    {
      ...Prototype,
      runtime,
      fiber
    }
  )
}

export const make = <LA, LE>(
  rootEffect: Effect.Effect<void, never, LA>,
  layer: Layer.Layer<LA | Sonnet.Sonnet.Context, LE, never>,
  memoMap?: Layer.MemoMap | undefined
): Sonnet.Sonnet<LA, LE> =>
  makeProto(
    rootEffect,
    layer,
    memoMap
  )

/** @internal */
export const isSonnet = (u: unknown): u is Sonnet.Sonnet<unknown, unknown> =>
  hasProperty(u, TypeId)

/** @internal */
export const makeService = (
  options: Sonnet.Sonnet.Options
): Effect.Effect<Sonnet.Sonnet.Service, never, Scope.Scope> =>
  Effect.gen(function*() {
    // XXX: hideous...
    const queue = options.backing ?? { strategy: "unbounded" }
    const capacity = queue.strategy === "unbounded" ? undefined : queue.capacity

    /**
     * Takes incoming actions from Redux
     */
    const actionQueue = yield* Queue[queue.strategy]<Action>(capacity as any)
    /**
     * Dispatches actions from `Stanzas`
     */
    const dispatchQueue = yield* Queue.unbounded<Take.Take<Action>>()

    /**
     * Takes incoming state from Reudx on each new action.
     */
    const stateRef = yield* SubscriptionRef.make<any>({})

    const changes = yield* pipe(
      stateRef.changes,
      Stream.broadcastDynamic({ capacity: "unbounded", replay: options.replay })
    )

    const latest = Stream.fromEffect(Ref.get(stateRef))

    const action$ = yield* pipe(
      Stream.fromQueue(actionQueue, {}),
      Stream.broadcastDynamic({ capacity: "unbounded", replay: options.replay })
    )

    const dispatch$ = Stream.fromQueue(dispatchQueue)

    return Sonnet.SonnetService.of({
      action: {
        queue: actionQueue,
        stream: action$
      },
      state: {
        latest, // as stream
        changes, // stream
        ref: stateRef
      },
      dispatch: {
        stream: dispatch$,
        queue: dispatchQueue
      }
    })
  })

/** @internal */
export const layer = (
  options: Sonnet.Sonnet.Options
): Layer.Layer<Sonnet.SonnetService, never, never> =>
  Layer.scoped(Sonnet.SonnetService, makeService(options))
