/**
 * This module provides utility for working `Stream`-based Redux interactions.
 * It includes analogues to Redux Saga helper functions.
 *
 * @since 0.0.0
 */

import type { Selector } from "@reduxjs/toolkit"
import type {
  Channel,
  Chunk,
  Effect,
  Fiber,
  Option,
  Predicate,
  Queue,
  Stream
} from "effect"
import { type Action, isAction as _isAction } from "redux"
import * as internal from "./internal/operators.js"
import type { SonnetService } from "./Sonnet.js"

/**
 * A re-export of `isAction` from `redux` typed with `Predicate.Refinement`.
 *
 * @since 0.0.0
 * @category utils
 */
export const isAction: Predicate.Refinement<unknown, Action<string>> =
  internal.isAction

/**
 * Filter by virtue of `Action.type` matching the given `string`.
 *
 * @example
 * ```
 * import { Stream } from "effect"
 * import { Operators } from "redux-sonnet"
 *
 * const actions = Stream.make(
 *   { type: "A1" },
 *   { type: "A2" },
 *   { type: "A3" },
 * )
 *
 * const filtered = actions.pipe(
 *   Stream.filter(Operators.ofType("A2"))
 * )
 *
 * // Effect.runPromise(Stream.runCollect(filtered)).then(console.log)
 * // { _id: 'Chunk', values: [ { type: "A2"} ] }
 * ```
 *
 * @since 0.0.0
 * @category utils
 */
export const ofType: <T extends string>(
  type: T
) => Predicate.Refinement<unknown, Action<T>> = internal.ofType

/**
 * Select latest state from Redux given some selector.
 *
 * @example
 * ```
 * import { Effect } from "effect"
 * import * as Operators from "redux-sonnet/Operators"
 *
 * interface State {
 *   x: number;
 * }
 *
 * declare const selectX: (_: State) => State["x"]
 *
 * const program = Effect.gen(function*(){
 *   const x = yield* Operators.select(selectX)
 * })
 * ```
 *
 * @since 0.0.0
 * @category utils
 */
export const select: <State, Result, Params extends Array<unknown> = []>(
  selector?: Selector<State, Result, Params> | undefined,
  ...params: [Params] extends [never] ? [] : Params
) => Effect.Effect<Result, never, SonnetService> = internal.select

/**
 * Dispatch an `Action` to the Redux store.
 *
 * @since 0.0.0
 * @category utils
 */
export const put: <A extends Action>(
  self: A
) => Effect.Effect<string, never, SonnetService> = internal.put

/**
 * Take a single `Action` matching the given predicate.
 *
 * **Warning:** This will throw an error if the chunk is empty.
 *
 * @example
 * ```
 * import * as Op from "redux-sonnet/Operators"
 *
 * const result = Op.unsafeTake(Op.ofType("ACTION"))
 * ```
 *
 * @since 0.0.0
 * @category utils
 */
export const unsafeTake: (
  pred: Predicate.Predicate<Action>
) => Effect.Effect<Action, never, SonnetService> = internal.unsafeTake

/**
 * Maybe take a single `Action` matching the given predicate.
 *
 * **Note**: This blocks generator execution until the given predicate is matched.
 *
 * @example
 * ```ts
 * import * as Op from "redux-sonnet/Operators"
 *
 * const result = Op.take(Op.ofType("ACTION"))
 * ```
 *
 * @since 0.0.0
 * @category utils
 */
export const take: (
  pred: Predicate.Predicate<Action>
) => Effect.Effect<Option.Option<Action>, never, SonnetService> = internal.take

/**
 * Optionally take from the given source matching the given predicate.
 *
 * @since 0.0.0
 * @category utils
 */
export const takeFrom: {
  <T>(
    pred: Predicate.Predicate<T>
  ): (
    source: Stream.Stream<T, never, never>
  ) => Effect.Effect<Option.Option<T>, never, never>
  <T>(
    pred: Predicate.Predicate<T>
  ): (
    source: Channel.Channel<
      Chunk.Chunk<T>,
      unknown,
      never,
      unknown,
      void,
      unknown
    >
  ) => Effect.Effect<Option.Option<T>, never, never>
  <T>(
    pred: Predicate.Predicate<T>
  ): (
    source: Queue.Queue<T>
  ) => Effect.Effect<Option.Option<T>, never, never>
  <T>(
    source: Stream.Stream<T, never, never>,
    pred: Predicate.Predicate<T>
  ): Effect.Effect<Option.Option<T>, never, never>
  <T>(
    source: Channel.Channel<
      Chunk.Chunk<T>,
      unknown,
      never,
      unknown,
      void,
      unknown
    >,
    pred: Predicate.Predicate<T>
  ): Effect.Effect<Option.Option<T>, never, never>
  <T>(
    source: Queue.Queue<T>,
    pred: Predicate.Predicate<T>
  ): Effect.Effect<Option.Option<T>, never, never>
} = internal.takeFrom

/**
 * TODO: needs consideration of halting vs interruption behavior
 *
 * @since 0.0.0
 * @category utils
 */
export const takeEvery: <Params extends Array<unknown>>(
  pred: Predicate.Predicate<Action>,
  effect: (
    action: Action,
    ...params: Params
  ) => Effect.Effect<void, never, never>,
  ...params: Params
) => Effect.Effect<Fiber.RuntimeFiber<void, never>, never, SonnetService> =
  internal.takeEvery
