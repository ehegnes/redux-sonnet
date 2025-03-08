import type { Action, MiddlewareAPI } from "@reduxjs/toolkit"
import type { Scope, Take } from "effect"
import {
  Cause,
  Effect,
  Equal,
  Exit,
  Hash,
  Inspectable,
  Layer,
  ManagedRuntime,
  pipe,
  Queue,
  Ref,
  Stream,
  SubscriptionRef,
  SynchronizedRef
} from "effect"
import { constVoid } from "effect/Function"
import { pipeArguments } from "effect/Pipeable"
import { hasProperty } from "effect/Predicate"
import { Operators } from "redux-sonnet"
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
  rootEffect: Effect.Effect<void, never, LA | Sonnet.SonnetService>,
  layer: Layer.Layer<LA | Sonnet.SonnetService, LE, never>,
  memoMap?: Layer.MemoMap | undefined
): Sonnet.Sonnet<LA, LE> => {
  const runtime = ManagedRuntime.make(
    Layer.mergeAll(layer),
    memoMap
  )

  // XXX: is it okay to fork here?
  const fiber = runtime.runFork(rootEffect.pipe(
    Effect.onInterrupt((a) => Effect.logTrace("rootEffect interrupted", a)),
    Effect.onExit((a) => Effect.logTrace("rootEffect interrupted", a)),
    Effect.onError((a) => Effect.logTrace("rootEffect errored", a)),
    Effect.catchAll((a) => Effect.logTrace("rootEffect caught", a))
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
        SynchronizedRef.updateAndGetEffect(ref, () => getState)
      )
    )

    const offerAction = (action: Action) =>
      pipe(
        Sonnet.SonnetService,
        Effect.andThen(({ action: { queue } }) =>
          Queue.offer(queue, action as Action)
        )
      )

    const dispatcher = Sonnet.SonnetService.pipe(
      Effect.andThen((_) =>
        pipe(
          Stream.flattenTake(_.dispatch.stream),
          Stream.mapEffect(dispatch),
          Stream.runDrain
        )
      )
    )

    runtime.runPromiseExit(offerState)
    runtime.runFork(dispatcher)

    const produce = (action: Action) =>
      Effect.andThen(offerState, () => offerAction(action))

    return (next) => {
      return (action) => {
        const result = next(action)

        // No-op on non-action input
        if (!Operators.isAction(action)) {
          return result
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
        const exit = runtime.runPromiseExit(produce(action as Action))

        exit.then(Exit.match({
          onFailure: (cause) => {
            // eslint-disable-next-line no-console
            console.error(Cause.pretty(cause))
          },
          onSuccess: constVoid
        }))

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
  rootEffect: Effect.Effect<void, never, LA | Sonnet.SonnetService>,
  layer: Layer.Layer<LA | Sonnet.SonnetService, LE, never>,
  memoMap?: Layer.MemoMap | undefined
): Sonnet.Sonnet<Exclude<LA, Sonnet.SonnetService>, LE> =>
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
    const queue = options.backing ?? { strategy: "unbounded" }
    const capacity = queue.strategy === "unbounded" ? undefined : queue.capacity

    const actionQueue = yield* Queue[queue.strategy]<Action>(capacity as any)
    const dispatchQueue = yield* Queue.unbounded<Take.Take<Action>>()
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
