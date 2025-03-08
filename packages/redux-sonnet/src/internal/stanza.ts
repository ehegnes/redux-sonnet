import type { Action } from "@reduxjs/toolkit"
import type { SynchronizedRef } from "effect"
import { Effect, Effectable, pipe, Predicate, Stream } from "effect"
import { dual } from "effect/Function"
import { pipeArguments } from "effect/Pipeable"
import * as Sonnet from "../Sonnet.js"
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
export const make = <S = unknown, R = never>(
  processor: (
    action$: Stream.Stream<Action>,
    state: {
      changes: Stream.Stream<S>
      latest: Stream.Stream<S>
      ref: SynchronizedRef.SynchronizedRef<S>
    }
  ) => Stream.Stream<Action, never, R>
): Stanza.Stanza<Sonnet.Sonnet.Context | R> =>
  Sonnet.SonnetService.pipe(
    Effect.andThen(({ action, dispatch, state }) =>
      pipe(
        processor(action.stream, state),
        Stream.runIntoQueue(dispatch.queue)
      )
    )
  )

export const fromStream = <R = never>(
  self: Stream.Stream<Action, never, R>
) =>
  pipe(
    Sonnet.SonnetService,
    Effect.andThen(({ dispatch }) => Stream.runIntoQueue(self, dispatch.queue))
  )

export const fromEffect = <R = never>(
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
