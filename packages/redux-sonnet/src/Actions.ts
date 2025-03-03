/**
 * This module provides utility for creating custom Redux actions.
 *
 * @since 0.0.0
 */

import type {
  ActionCreatorWithPayload,
  PayloadActionCreator
} from "@reduxjs/toolkit"
import { createAction } from "@reduxjs/toolkit"
import type { Effect } from "effect"
import * as internal from "./internal/actions.js"

/**
 * @since 0.0.0
 * @category models
 */
export interface AsyncActionSet<
  Prefix extends string,
  TriggerPayload = void,
  FulfilledPayload = void,
  RejectedPayload = void
> {
  trigger: PayloadActionCreator<TriggerPayload, `${Prefix}/trigger`, void>
  fulfilled: PayloadActionCreator<FulfilledPayload, `${Prefix}/fulfilled`, void>
  rejected: PayloadActionCreator<RejectedPayload, `${Prefix}/rejected`, void>
}

/**
 * A subtype of {@link AsyncActionSet} such that payloads for `fulfilled` and
 * `rejected` actions are well defined.
 * @since 0.0.0
 * @category models
 */
export interface AsyncActionSetWithPayload<
  Prefix extends string,
  TriggerPayload,
  FulfilledPayload,
  RejectedPayload
> extends
  Omit<
    AsyncActionSet<Prefix, TriggerPayload, FulfilledPayload, RejectedPayload>,
    "fulfilled" | "rejected"
  >
{
  fulfilled: ActionCreatorWithPayload<
    internal.Defined<FulfilledPayload>,
    `${Prefix}/fulfilled`
  >
  rejected: ActionCreatorWithPayload<
    Defined<RejectedPayload>,
    `${Prefix}/rejected`
  >
}

/**
 * Constructs trigger, fulfillment, and rejection actions based on a prefix.
 *
 * @example
 * ```
 * import * as Actions from "redux-sonnet/Actions"
 *
 * const {
 *   trigger,
 *   fulfilled,
 *   rejected,
 * } = Actions.make("increment")<void, void, never>()
 *
 * assert.strictEqual(trigger.type, "increment/trigger")
 * assert.strictEqual(fulfilled.type, "increment/fulfilled")
 * assert.strictEqual(rejected.type, "increment/rejected")
 * ```
 *
 * @since 0.0.0
 * @category constructors
 */
export const make = <
  Prefix extends string
>(prefix: Prefix) =>
<
  TriggerPayload = void,
  FulfilledPayload = void,
  RejectedPayload = void
>(): AsyncActionSet<
  Prefix,
  TriggerPayload,
  FulfilledPayload,
  RejectedPayload
> => ({
  trigger: createAction(`${prefix}/trigger`),
  fulfilled: createAction(`${prefix}/fulfilled`),
  rejected: createAction(`${prefix}/rejected`)
})

/**
 * Analogous to {@link Effect.match} for an {@link AsyncActionSet}.
 *
 * @since 0.0.0
 * @category utils
 */
export const match: {
  <P extends string, A, E>(
    action: AsyncActionSetWithPayload<P, any, A, E>
  ): <R = never>(
    self: Effect.Effect<internal.Defined<A>, internal.Defined<E>, R>
  ) => Effect.Effect<
    | ReturnType<
      AsyncActionSetWithPayload<
        P,
        any,
        internal.Defined<A>,
        internal.Defined<E>
      >["fulfilled"]
    >
    | ReturnType<
      AsyncActionSetWithPayload<
        P,
        any,
        internal.Defined<A>,
        internal.Defined<E>
      >["rejected"]
    >,
    never,
    R
  >
  <P extends string, A, E, R = never>(
    self: Effect.Effect<internal.Defined<A>, internal.Defined<E>, R>,
    action: AsyncActionSetWithPayload<P, any, A, E>
  ): Effect.Effect<
    | ReturnType<
      AsyncActionSetWithPayload<
        P,
        any,
        internal.Defined<A>,
        internal.Defined<E>
      >["fulfilled"]
    >
    | ReturnType<
      AsyncActionSetWithPayload<
        P,
        any,
        internal.Defined<A>,
        internal.Defined<E>
      >["rejected"]
    >,
    never,
    R
  >
} = internal.match
