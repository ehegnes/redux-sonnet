/**
 * This module provides the core Redux middleware for instantiating a Redux Sonnet.
 * It includes analogues to `redux-observable`'s *Epics*.
 *
 * @since 0.0.0
 */
import type { Action } from "@reduxjs/toolkit"
import type { Effect, Pipeable, Stream, SynchronizedRef } from "effect"
import * as internal from "./internal/stanza.js"
import type * as Sonnet from "./Sonnet.js"

/** @since 0.0.0 */
export const TypeId: unique symbol = internal.TypeId
/** @since 0.0.0 */
export type TypeId = typeof TypeId

/**
 * A `Stanza` is an `Effect` that produces `void`, never fails, and requires the `SonnetService`.
 *
 * @since 0.0.0
 * @category models
 */
export interface Stanza<R = never>
  extends
    Pipeable.Pipeable,
    Effect.Effect<void, never, Sonnet.SonnetService | R>
{
  // [TypeId]: TypeId
}

/**
 * Constructs a `Stanza` from a `effect/Stream` processor.
 *
 * @since 0.0.0
 * @category constructors
 */
export const make: <R>(
  processor: (action$: Stream.Stream<Action>, state: {
    changes: Stream.Stream<any>
    latest: Stream.Stream<any>
    ref: SynchronizedRef.SynchronizedRef<any>
  }) => Stream.Stream<Action, never, R>
) => Stanza<Sonnet.Sonnet.Context | R> = internal.make

/**
 * Construct a `Stanza` from a `Stream` such that each output dispatches to Redux.
 *
 * @example
 * ```
 * import { Stream, Schedule, pipe } from "effect"
 * import { Stanza } from "redux-sonnet"
 *
 * Stanza.fromStream(pipe(
 *   Stream.range(1, 3),
 *   Stream.schedule(Schedule.spaced("1 second")),
 *   Stream.map((i) => ({ type: `ACTION-${i}` })),
 * ))
 * ```
 *
 * @since 0.0.0
 * @category constructors
 */
export const fromStream: <R>(
  self: Stream.Stream<Action, never, R>
) => Effect.Effect<void, never, Sonnet.SonnetService | R> = internal.fromStream

/**
 * Construct a `Stanza` from an `Effect` such that the output dispatches to Redux.
 *
 * @example
 * ```
 * import { Effect } from "effect"
 * import { Stanza } from "redux-sonnet"
 *
 * Stanza.fromEffect(
 *  Effect.succeed({ type: "ACTION" })
 * )
 * ```
 *
 * @since 0.0.0
 * @category constructors
 */
export const fromEffect: <R>(
  self: Effect.Effect<Action, never, R>
) => Effect.Effect<void, never, Sonnet.SonnetService | R> = internal.fromEffect
