/**
 * This module provides the core Redux middleware for instantiating a Redux Sonnet.
 *
 * @since 0.0.0
 */

import type {
  Effect,
  Equal,
  Fiber,
  Hash,
  Inspectable,
  Layer,
  ManagedRuntime,
  Queue,
  Stream,
  SynchronizedRef,
  Take
} from "effect"
import { Context } from "effect"
import type { Pipeable } from "effect/Pipeable"
import type { Action, Middleware as ReduxMiddleware } from "redux"
import * as internal from "./internal/sonnet.js"

/**
 * @since 0.0.0
 * @category context
 */
export class SonnetService extends Context.Tag("redux-sonnet/Sonnet/Service")<
  SonnetService,
  Sonnet.Service
>() {}

/**
 * @since 1.0.0
 * @category type ids
 */
export const TypeId: unique symbol = internal.TypeId

/**
 * @since 1.0.0
 * @category type ids
 */
export type TypeId = typeof TypeId

/**
 * @since 1.0.0
 * @category models
 */
export interface Sonnet<LA, LE>
  extends
    Pipeable,
    Equal.Equal,
    Hash.Hash,
    Inspectable.Inspectable,
    Sonnet.Middleware
{
  readonly [TypeId]: TypeId
  readonly runtime: ManagedRuntime.ManagedRuntime<LA, LE>
  readonly fiber: Fiber.RuntimeFiber<void, LE>
}

/**
 * @since 1.0.0
 * @category models
 */
export declare namespace Sonnet {
  /**
   * @since 1.0.0
   * @category models
   */
  export type Context = SonnetService

  /**
   * @since 0.0.0
   * @category unknown
   */
  export interface Service {
    readonly action: {
      readonly queue: Queue.Queue<Action>
      readonly stream: Stream.Stream<Action>
    }
    readonly state: {
      readonly changes: Stream.Stream<any>
      readonly latest: Stream.Stream<any>
      readonly ref: SynchronizedRef.SynchronizedRef<any>
    }
    readonly dispatch: {
      readonly stream: Stream.Stream<Take.Take<Action>>
      readonly queue: Queue.Queue<Take.Take<Action>>
    }
  }

  /**
   * @since 0.0.0
   * @category unknown
   */
  export type Middleware = ReduxMiddleware<any, any, any>

  /**
   * @since 0.0.0
   * @category models
   */
  export interface Options {
    /**
     * Number of actions to replay to late subscribers.
     *
     * @default 0
     */
    readonly replay?: number | undefined
    /**
     * Configuration for queue-backed action stream.
     *
     * @defaultValue `{ strategy: "unbounded" }`
     */
    readonly backing?:
      | { strategy: "unbounded" }
      | { strategy: "bounded"; capacity: number }
      | { strategy: "dropping"; capacity: number }
      | { strategy: "sliding"; capacity: number }
      | undefined
  }
}

/**
 * Construct a `redux-sonnet` middleware.
 *
 * **NOTE:** side-effect handlers are provided up-front to guarantee declarative
 * behavior.
 *
 * @example
 * ```ts
 * import { configureStore, Tuple as RTKTuple } from "@reduxjs/toolkit"
 * import { Sonnet, Stanza } from "redux-sonnet"
 * import { Stream, Layer } from "effect"
 *
 * const stanza = Stanza.fromStream(Stream.make(
 *   { type: "ACTION-1" },
 *   { type: "ACTION-2" },
 *   { type: "ACTION-3" },
 * ))
 *
 * const sonnet = Sonnet.make(
 * //    ^?
 *   stanza,
 *   Sonnet.defaultLayer,
 * )
 *
 * const store = configureStore({
 * //    ^?
 *   reducer: () => {},
 *   middleware: () => new RTKTuple(sonnet)
 * })
 * ```
 *
 * @since 0.0.0
 * @category constructors
 */
export const make: <LA, LE>(
  rootEffect: Effect.Effect<void, never, LA>,
  layer: Layer.Layer<LA | Sonnet.Context, LE, never>,
  memoMap?: Layer.MemoMap | undefined
) => Sonnet<LA, LE> = internal.make

/**
 * Returns `true` if the specified value is a `Sonnet`, `false` otherwise.
 *
 * @since 0.0.0
 * @category refinements
 */
export const isSonnet: (u: unknown) => u is Sonnet<unknown, unknown> =
  internal.isSonnet

/**
 * @since 0.0.0
 * @category layers
 */
export const layer: (
  options: Sonnet.Options
) => Layer.Layer<SonnetService, never, never> = internal.layer

/**
 * @since 0.0.0
 * @category layers
 */
export const defaultLayer: Layer.Layer<SonnetService> = layer({
  backing: { strategy: "unbounded" }
})
