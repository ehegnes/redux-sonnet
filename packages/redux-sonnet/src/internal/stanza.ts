import type { Action } from "@reduxjs/toolkit"
import type { SynchronizedRef } from "effect"
import { Effect, Effectable, pipe, Predicate, Stream } from "effect"
import { dual } from "effect/Function"
import { pipeArguments } from "effect/Pipeable"
import * as Sonnet from "../Sonnet.js"
import type * as Sonnet2 from "../Sonnet.js"
import type * as Stanza from "../Stanza.js"

/** @internal */
export const TypeId: Stanza.TypeId = Symbol.for(
  `redux-sonnet/Stanza`
) as Stanza.TypeId

/** @internal */
export const isStanza = (u: unknown): u is Stanza.Stanza =>
  Predicate.hasProperty(u, TypeId)

const Prototype = {
  ...Effectable.CommitPrototype,
  [TypeId]: TypeId,
  commit() {
    return Effect.succeed(this)
  },
  pipe() {
    return pipeArguments(this, arguments)
  }
}

export const bufferActions = dual<
  (
    options: Parameters<typeof Stream.buffer>[1]
  ) => <R>(self: Stanza.Stanza<R>) => Stanza.Stanza<R>,
  <R>(
    self: Stanza.Stanza<R>,
    options: Parameters<typeof Stream.buffer>[1]
  ) => Stanza.Stanza<R>
>(2, <R>(
  self: Stanza.Stanza<R>,
  options: Parameters<typeof Stream.buffer>[1]
): Stanza.Stanza<R> =>
  Effect.updateService(
    self,
    Sonnet.SonnetService,
    (service) => ({
      ...service,
      action: {
        ...service.action,
        stream: pipe(service.action.stream, Stream.buffer(options))
      }
    })
  ))

/**
 * Constructs a `Stanza` from a `effect/Stream` processor.
 *
 * @since 0.0.0
 * @category constructors
 */
export const make = <R>(
  processor: (
    action$: Stream.Stream<Action>,
    state: {
      changes: Stream.Stream<any>
      latest: Stream.Stream<any>
      ref: SynchronizedRef.SynchronizedRef<any>
    }
  ) => Stream.Stream<Action, never, R>
): Stanza.Stanza<Sonnet2.Sonnet.Context | R> =>
  Effect.gen(function*() {
    const {
      action,
      dispatch,
      state
    } = yield* Sonnet.SonnetService

    return yield* pipe(
      processor(
        action.stream.pipe(
          Stream.tap((x) => Effect.log("[Stanza] Got action:", x))
        ),
        state
      ),
      Stream.tap((x) => Effect.log("[stanza] output", x)),
      Stream.runIntoQueue(dispatch.queue)
    )
  })

export const fromStream = <R>(
  self: Stream.Stream<Action, never, R>
) =>
  pipe(
    Sonnet.SonnetService,
    Effect.andThen(({ dispatch }) => Stream.runIntoQueue(self, dispatch.queue))
  )

export const fromEffect = <R>(
  effect: Effect.Effect<Action, never, R>
) =>
  pipe(
    Sonnet.SonnetService,
    Effect.andThen(({ dispatch }) =>
      pipe(
        Stream.fromEffect(effect),
        Stream.runIntoQueue(dispatch.queue)
      )
    )
  )
