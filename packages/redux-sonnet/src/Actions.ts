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
import { Effect } from "effect"

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
    Defined<FulfilledPayload>,
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
 * Gates a type T such that it cannot be `never`, `void`, or `undefined`.
 */
export type Defined<T> = [T] extends [never] | [undefined] | [void] ? never
  : T

/**
 * Analogous to {@link Effect.match} for an {@link AsyncActionSet}.
 *
 * @since 0.0.0
 * @category utils
 * @todo Add dual API
 */
export const match = <
  P extends string,
  A,
  E
>(
  action: AsyncActionSetWithPayload<P, any, A, E>
) =>
  Effect.match({
    onFailure: action.rejected,
    onSuccess: action.fulfilled
  })
